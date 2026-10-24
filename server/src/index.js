import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pool, checkDatabase } from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


const app = express();
const port = Number(process.env.PORT || 4000);
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    // Allow native mobile clients with no Origin header. Browser origins must be configured.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by SOKORA API'));
  },
}));
app.use(express.json({ limit: '256kb' }));

const JWT_SECRET = process.env.JWT_SECRET || '';
const requireAuth = (req, res, next) => {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token || !JWT_SECRET) return res.status(401).json({ error: 'AUTH_REQUIRED' });
  try { req.auth = jwt.verify(token, JWT_SECRET); return next(); }
  catch { return res.status(401).json({ error: 'INVALID_SESSION' }); }
};

app.get('/health', async (_req, res) => {
  let database = 'not_configured';
  try {
    if (pool) database = (await checkDatabase()) ? 'connected' : 'unavailable';
  } catch {
    database = 'unavailable';
  }
  const healthy = database === 'connected';
  res.status(healthy ? 200 : 503).json({
    ok: healthy,
    service: 'sokora-api',
    database,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/auth/register', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DATABASE_NOT_CONFIGURED' });
  if (!JWT_SECRET) return res.status(503).json({ error: 'AUTH_NOT_CONFIGURED' });
  const email = String(req.body.email || '').trim().toLowerCase() || null;
  const phone = String(req.body.phone || '').trim() || null;
  const username = String(req.body.username || '').trim().toLowerCase().replace(/^@/, '');
  const displayName = String(req.body.displayName || '').trim();
  const password = String(req.body.password || '');
  if ((!email && !phone) || !/^[a-z0-9_]{3,30}$/.test(username) || displayName.length < 2 || password.length < 10) {
    return res.status(400).json({ error: 'INVALID_REGISTRATION', message: 'Weka email au simu, username ya herufi/namba 3–30, jina, na password ya angalau herufi 10.' });
  }
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (email, phone, username, display_name, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, display_name, role`,
      [email, phone, username, displayName, passwordHash],
    );
    const user = result.rows[0];
    const token = jwt.sign({ sub: String(user.id), username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d', issuer: 'sokora-api', audience: 'sokora-app' });
    return res.status(201).json({ user, token, tokenType: 'Bearer', expiresIn: 604800 });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'ACCOUNT_ALREADY_EXISTS' });
    console.error('POST /api/auth/register failed:', error.message);
    return res.status(500).json({ error: 'REGISTRATION_FAILED' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DATABASE_NOT_CONFIGURED' });
  if (!JWT_SECRET) return res.status(503).json({ error: 'AUTH_NOT_CONFIGURED' });
  const identity = String(req.body.identity || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!identity || !password) return res.status(400).json({ error: 'IDENTITY_AND_PASSWORD_REQUIRED' });
  try {
    const result = await pool.query(
      `SELECT id, username, display_name, role, status, password_hash
       FROM users WHERE lower(username) = $1 OR lower(coalesce(email, '')) = $1 OR phone = $2
       LIMIT 1`,
      [identity.replace(/^@/, ''), identity],
    );
    const user = result.rows[0];
    if (!user || user.status !== 'ACTIVE' || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }
    const token = jwt.sign({ sub: String(user.id), username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d', issuer: 'sokora-api', audience: 'sokora-app' });
    return res.json({ user: { id: user.id, username: user.username, display_name: user.display_name, role: user.role }, token, tokenType: 'Bearer', expiresIn: 604800 });
  } catch (error) {
    console.error('POST /api/auth/login failed:', error.message);
    return res.status(500).json({ error: 'LOGIN_FAILED' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DATABASE_NOT_CONFIGURED' });
  try {
    const result = await pool.query(
      'SELECT id, username, display_name, role, status FROM users WHERE id = $1',
      [req.auth.sub],
    );
    if (!result.rowCount || result.rows[0].status !== 'ACTIVE') return res.status(401).json({ error: 'ACCOUNT_INACTIVE' });
    const { status, ...user } = result.rows[0];
    return res.json({ user });
  } catch (error) {
    console.error('GET /api/auth/me failed:', error.message);
    return res.status(500).json({ error: 'SESSION_LOOKUP_FAILED' });
  }
});

app.get('/api/feed', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DATABASE_NOT_CONFIGURED' });

  const rawLimit = Number.parseInt(String(req.query.limit || '10'), 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 30) : 10;
  const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : null;

  try {
    const result = await pool.query(
      `SELECT
         v.id AS video_id,
         v.caption,
         v.video_url,
         v.thumbnail_url,
         v.created_at,
         p.id AS product_id,
         p.name AS product_name,
         p.price_tzs,
         p.currency,
         p.location,
         u.id AS seller_id,
         u.display_name AS seller_name,
         u.username AS seller_username
       FROM videos v
       JOIN products p ON p.id = v.product_id
       JOIN users u ON u.id = v.seller_id
       WHERE v.status = 'PUBLISHED'
         AND p.status = 'ACTIVE'
         AND u.status = 'ACTIVE'
         AND ($1::timestamptz IS NULL OR v.created_at < $1::timestamptz)
       ORDER BY v.created_at DESC, v.id DESC
       LIMIT $2`,
      [cursor, limit],
    );

    res.json({
      items: result.rows,
      nextCursor: result.rows.length === limit
        ? result.rows[result.rows.length - 1].created_at
        : null,
    });
  } catch (error) {
    console.error('GET /api/feed failed:', error.message);
    res.status(500).json({ error: 'FEED_QUERY_FAILED' });
  }
});

app.get('/api/products', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DATABASE_NOT_CONFIGURED' });
  const rawLimit = Number.parseInt(String(req.query.limit || '30'), 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 60) : 30;
  const offsetValue = Number.parseInt(String(req.query.offset || '0'), 10);
  const offset = Number.isFinite(offsetValue) ? Math.max(offsetValue, 0) : 0;
  const search = String(req.query.q || '').trim().slice(0, 100);
  const category = String(req.query.category || '').trim().slice(0, 80);
  const location = String(req.query.location || '').trim().slice(0, 100);
  try {
    const result = await pool.query(
      `SELECT
         p.id, p.name, p.description, p.price_tzs, p.currency,
         p.category, p.location, p.created_at,
         u.id AS seller_id, u.display_name AS seller_name,
         u.username AS seller_username, u.phone AS seller_phone,
         media.thumbnail_url, media.video_url
       FROM products p
       JOIN users u ON u.id = p.seller_id
       LEFT JOIN LATERAL (
         SELECT v.thumbnail_url, v.video_url
         FROM videos v
         WHERE v.product_id = p.id
           AND v.seller_id = p.seller_id
           AND v.status = 'PUBLISHED'
         ORDER BY v.created_at DESC, v.id DESC
         LIMIT 1
       ) media ON TRUE
       WHERE p.status = 'ACTIVE'
         AND u.status = 'ACTIVE'
         AND ($1 = '' OR p.name ILIKE '%' || $1 || '%' OR coalesce(p.description, '') ILIKE '%' || $1 || '%')
         AND ($2 = '' OR coalesce(p.category, '') ILIKE '%' || $2 || '%')
         AND ($3 = '' OR coalesce(p.location, '') ILIKE '%' || $3 || '%')
       ORDER BY p.created_at DESC, p.id DESC
       LIMIT $4 OFFSET $5`,
      [search, category, location, limit, offset],
    );
    res.json({ items: result.rows, limit, offset, hasMore: result.rows.length === limit });
  } catch (error) {
    console.error('GET /api/products failed:', error.message);
    res.status(500).json({ error: 'PRODUCTS_QUERY_FAILED' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DATABASE_NOT_CONFIGURED' });
  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.description, p.price_tzs, p.currency,
              p.location, p.created_at, u.id AS seller_id,
              u.display_name AS seller_name, u.username AS seller_username
       FROM products p
       JOIN users u ON u.id = p.seller_id
       WHERE p.id = $1 AND p.status = 'ACTIVE' AND u.status = 'ACTIVE'`,
      [req.params.id],
    );
    if (!result.rowCount) return res.status(404).json({ error: 'PRODUCT_NOT_FOUND' });
    res.json({ product: result.rows[0] });
  } catch (error) {
    console.error('GET /api/products/:id failed:', error.message);
    res.status(500).json({ error: 'PRODUCT_QUERY_FAILED' });
  }
});

app.use((error, _req, res, _next) => {
  if (error.message === 'Origin is not allowed by SOKORA API') {
    return res.status(403).json({ error: 'ORIGIN_NOT_ALLOWED' });
  }
  if (error instanceof SyntaxError) return res.status(400).json({ error: 'INVALID_JSON' });
  console.error('Unhandled API error:', error.message);
  return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
});

app.listen(port, () => {
  console.log(`SOKORA API listening on port ${port}`);
});
