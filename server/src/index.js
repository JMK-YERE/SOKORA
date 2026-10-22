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

app.get('/api/search', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DATABASE_NOT_CONFIGURED' });

  const query = String(req.query.q || '').trim().slice(0, 100);
  const location = String(req.query.location || '').trim().slice(0, 80);
  const rawLimit = Number.parseInt(String(req.query.limit || '20'), 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 30) : 20;

  if (query.length < 2 && location.length < 2) {
    return res.status(400).json({
      error: 'SEARCH_TERM_REQUIRED',
      message: 'Andika angalau herufi 2 za bidhaa, maelezo au eneo.',
    });
  }

  const searchTerm = query ? '%' + query + '%' : null;
  const locationTerm = location ? '%' + location + '%' : null;

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
         AND (
           $1::text IS NULL
           OR p.name ILIKE $1 ESCAPE '\\'
           OR coalesce(p.description, '') ILIKE $1 ESCAPE '\\'
           OR coalesce(v.caption, '') ILIKE $1 ESCAPE '\\'
           OR u.username ILIKE $1 ESCAPE '\\'
           OR u.display_name ILIKE $1 ESCAPE '\\'
         )
         AND ($2::text IS NULL OR coalesce(p.location, '') ILIKE $2 ESCAPE '\\')
       ORDER BY v.created_at DESC, v.id DESC
       LIMIT $3`,
      [searchTerm, locationTerm, limit],
    );
    return res.json({ items: result.rows, count: result.rowCount });
  } catch (error) {
    console.error('GET /api/search failed:', error.message);
    return res.status(500).json({ error: 'SEARCH_QUERY_FAILED' });
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


const parsePositiveId = (value) => {
  const text = String(value ?? '');
  return /^\d+$/.test(text) && Number(text) > 0 ? text : null;
};

app.get('/api/videos/:id/comments', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DATABASE_NOT_CONFIGURED' });
  const videoId = parsePositiveId(req.params.id);
  if (!videoId) return res.status(400).json({ error: 'INVALID_VIDEO_ID' });
  const rawLimit = Number.parseInt(String(req.query.limit || '30'), 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 30;
  try {
    const result = await pool.query(
      "SELECT c.id, c.body, c.created_at, u.id AS user_id, u.username, u.display_name, u.avatar_url FROM comments c JOIN users u ON u.id = c.user_id WHERE c.video_id = $1 AND c.status = 'VISIBLE' AND u.status = 'ACTIVE' ORDER BY c.created_at DESC, c.id DESC LIMIT $2",
      [videoId, limit],
    );
    return res.json({ items: result.rows });
  } catch (error) {
    console.error('GET /api/videos/:id/comments failed:', error.message);
    return res.status(500).json({ error: 'COMMENTS_QUERY_FAILED' });
  }
});

app.post('/api/videos/:id/comments', requireAuth, async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DATABASE_NOT_CONFIGURED' });
  const videoId = parsePositiveId(req.params.id);
  const body = String(req.body.body || '').trim();
  if (!videoId) return res.status(400).json({ error: 'INVALID_VIDEO_ID' });
  if (body.length < 1 || body.length > 2000) return res.status(400).json({ error: 'INVALID_COMMENT' });
  try {
    const video = await pool.query("SELECT id FROM videos WHERE id = $1 AND status = 'PUBLISHED'", [videoId]);
    if (!video.rowCount) return res.status(404).json({ error: 'VIDEO_NOT_FOUND' });
    const result = await pool.query(
      "INSERT INTO comments (video_id, user_id, body) SELECT $1, u.id, $3 FROM users u WHERE u.id = $2 AND u.status = 'ACTIVE' RETURNING id, video_id, user_id, body, created_at, status",
      [videoId, req.auth.sub, body],
    );
    if (!result.rowCount) return res.status(401).json({ error: 'ACCOUNT_INACTIVE' });
    return res.status(201).json({ comment: result.rows[0] });
  } catch (error) {
    console.error('POST /api/videos/:id/comments failed:', error.message);
    return res.status(500).json({ error: 'COMMENT_CREATE_FAILED' });
  }
});

app.post('/api/videos/:id/like', requireAuth, async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DATABASE_NOT_CONFIGURED' });
  const videoId = parsePositiveId(req.params.id);
  if (!videoId) return res.status(400).json({ error: 'INVALID_VIDEO_ID' });
  try {
    const video = await pool.query("SELECT id FROM videos WHERE id = $1 AND status = 'PUBLISHED'", [videoId]);
    if (!video.rowCount) return res.status(404).json({ error: 'VIDEO_NOT_FOUND' });
    const inserted = await pool.query(
      "INSERT INTO video_likes (user_id, video_id) SELECT u.id, $2 FROM users u WHERE u.id = $1 AND u.status = 'ACTIVE' ON CONFLICT (user_id, video_id) DO NOTHING RETURNING user_id",
      [req.auth.sub, videoId],
    );
    if (!inserted.rowCount) {
      const user = await pool.query("SELECT id FROM users WHERE id = $1 AND status = 'ACTIVE'", [req.auth.sub]);
      if (!user.rowCount) return res.status(401).json({ error: 'ACCOUNT_INACTIVE' });
      await pool.query("DELETE FROM video_likes WHERE user_id = $1 AND video_id = $2", [req.auth.sub, videoId]);
    }
    const count = await pool.query("SELECT COUNT(*)::int AS count FROM video_likes WHERE video_id = $1", [videoId]);
    return res.json({ liked: inserted.rowCount > 0, likesCount: count.rows[0].count });
  } catch (error) {
    console.error('POST /api/videos/:id/like failed:', error.message);
    return res.status(500).json({ error: 'LIKE_UPDATE_FAILED' });
  }
});

app.post('/api/sellers/:sellerId/follow', requireAuth, async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DATABASE_NOT_CONFIGURED' });
  const sellerId = parsePositiveId(req.params.sellerId);
  if (!sellerId) return res.status(400).json({ error: 'INVALID_SELLER_ID' });
  if (String(req.auth.sub) === sellerId) return res.status(400).json({ error: 'CANNOT_FOLLOW_SELF' });
  try {
    const seller = await pool.query("SELECT id FROM users WHERE id = $1 AND status = 'ACTIVE'", [sellerId]);
    if (!seller.rowCount) return res.status(404).json({ error: 'SELLER_NOT_FOUND' });
    const inserted = await pool.query(
      "INSERT INTO follows (follower_id, seller_id) SELECT u.id, $2 FROM users u WHERE u.id = $1 AND u.status = 'ACTIVE' ON CONFLICT (follower_id, seller_id) DO NOTHING RETURNING follower_id",
      [req.auth.sub, sellerId],
    );
    if (!inserted.rowCount) {
      const user = await pool.query("SELECT id FROM users WHERE id = $1 AND status = 'ACTIVE'", [req.auth.sub]);
      if (!user.rowCount) return res.status(401).json({ error: 'ACCOUNT_INACTIVE' });
      await pool.query("DELETE FROM follows WHERE follower_id = $1 AND seller_id = $2", [req.auth.sub, sellerId]);
    }
    const count = await pool.query("SELECT COUNT(*)::int AS count FROM follows WHERE seller_id = $1", [sellerId]);
    return res.json({ following: inserted.rowCount > 0, followersCount: count.rows[0].count });
  } catch (error) {
    console.error('POST /api/sellers/:sellerId/follow failed:', error.message);
    return res.status(500).json({ error: 'FOLLOW_UPDATE_FAILED' });
  }
});

app.post('/api/videos/:id/save', requireAuth, async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DATABASE_NOT_CONFIGURED' });
  const videoId = parsePositiveId(req.params.id);
  if (!videoId) return res.status(400).json({ error: 'INVALID_VIDEO_ID' });
  try {
    const video = await pool.query("SELECT id FROM videos WHERE id = $1 AND status = 'PUBLISHED'", [videoId]);
    if (!video.rowCount) return res.status(404).json({ error: 'VIDEO_NOT_FOUND' });
    const inserted = await pool.query(
      "INSERT INTO saved_videos (user_id, video_id) SELECT u.id, $2 FROM users u WHERE u.id = $1 AND u.status = 'ACTIVE' ON CONFLICT (user_id, video_id) DO NOTHING RETURNING user_id",
      [req.auth.sub, videoId],
    );
    if (!inserted.rowCount) {
      const user = await pool.query("SELECT id FROM users WHERE id = $1 AND status = 'ACTIVE'", [req.auth.sub]);
      if (!user.rowCount) return res.status(401).json({ error: 'ACCOUNT_INACTIVE' });
      await pool.query("DELETE FROM saved_videos WHERE user_id = $1 AND video_id = $2", [req.auth.sub, videoId]);
    }
    return res.json({ saved: inserted.rowCount > 0 });
  } catch (error) {
    console.error('POST /api/videos/:id/save failed:', error.message);
    return res.status(500).json({ error: 'SAVE_UPDATE_FAILED' });
  }
});

app.get('/api/me/saved-videos', requireAuth, async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DATABASE_NOT_CONFIGURED' });
  try {
    const result = await pool.query(
      "SELECT v.id AS video_id, v.caption, v.video_url, v.thumbnail_url, v.created_at, p.id AS product_id, p.name AS product_name, p.price_tzs, p.currency, p.location, u.id AS seller_id, u.username AS seller_username, u.display_name AS seller_name, sv.created_at AS saved_at FROM saved_videos sv JOIN videos v ON v.id = sv.video_id JOIN products p ON p.id = v.product_id JOIN users u ON u.id = v.seller_id WHERE sv.user_id = $1 AND v.status = 'PUBLISHED' AND p.status = 'ACTIVE' AND u.status = 'ACTIVE' ORDER BY sv.created_at DESC LIMIT 100",
      [req.auth.sub],
    );
    return res.json({ items: result.rows });
  } catch (error) {
    console.error('GET /api/me/saved-videos failed:', error.message);
    return res.status(500).json({ error: 'SAVED_VIDEOS_QUERY_FAILED' });
  }
});

app.get('/api/sellers/:username', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DATABASE_NOT_CONFIGURED' });
  const username = String(req.params.username || '').trim().replace(/^@/, '').toLowerCase();
  if (!/^[a-z0-9_]{3,30}$/.test(username)) return res.status(400).json({ error: 'INVALID_USERNAME' });
  try {
    const result = await pool.query(
      "SELECT u.id, u.username, u.display_name, u.avatar_url, u.created_at, sp.business_name, sp.description AS business_description, sp.region, sp.district, sp.verification_status, (SELECT COUNT(*)::int FROM follows f WHERE f.seller_id = u.id) AS followers_count, (SELECT COUNT(*)::int FROM follows f WHERE f.follower_id = u.id) AS following_count, (SELECT COUNT(*)::int FROM videos v WHERE v.seller_id = u.id AND v.status = 'PUBLISHED') AS videos_count, (SELECT COUNT(*)::int FROM video_likes l JOIN videos v ON v.id = l.video_id WHERE v.seller_id = u.id AND v.status = 'PUBLISHED') AS likes_count FROM users u LEFT JOIN seller_profiles sp ON sp.user_id = u.id WHERE lower(u.username) = $1 AND u.status = 'ACTIVE'",
      [username],
    );
    if (!result.rowCount) return res.status(404).json({ error: 'SELLER_NOT_FOUND' });
    return res.json({ seller: result.rows[0] });
  } catch (error) {
    console.error('GET /api/sellers/:username failed:', error.message);
    return res.status(500).json({ error: 'SELLER_PROFILE_QUERY_FAILED' });
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
