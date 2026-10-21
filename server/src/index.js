import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pool, checkDatabase } from './db.js';

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
