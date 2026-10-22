import postgres from 'postgres';

let sqlClient;
let sqlConnectionString;

function getDatabase(env) {
  const connectionString = env.HYPERDRIVE?.connectionString;
  if (!connectionString) throw new Error('HYPERDRIVE binding is missing');
  if (!sqlClient || sqlConnectionString !== connectionString) {
    sqlConnectionString = connectionString;
    sqlClient = postgres(connectionString, { max: 5, fetch_types: false });
  }
  return sqlClient;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      try {
        if (!env.HYPERDRIVE?.connectionString) {
          return json({ ok: false, service: 'sokora-api', database: 'binding_missing' }, 503);
        }
        await getDatabase(env)`SELECT 1`;
        return json({ ok: true, service: 'sokora-api', database: 'connected' });
      } catch (error) {
        console.error('SOKORA database health check failed:', error?.message || 'unknown error');
        return json({ ok: false, service: 'sokora-api', database: 'unavailable' }, 503);
      }
    }

    if (url.pathname === '/api/feed') {
      try {
        const db = getDatabase(env);
        const parsedLimit = Number.parseInt(url.searchParams.get('limit') || '10', 10);
        const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 30) : 10;
        const cursor = url.searchParams.get('cursor');
        const rows = await db`
          SELECT
            v.id AS video_id, v.caption, v.video_url, v.thumbnail_url, v.created_at,
            p.id AS product_id, p.name AS product_name, p.price_tzs, p.currency, p.location,
            u.id AS seller_id, u.display_name AS seller_name, u.username AS seller_username
          FROM videos v
          JOIN products p ON p.id = v.product_id
          JOIN users u ON u.id = v.seller_id
          WHERE v.status = 'PUBLISHED'
            AND p.status = 'ACTIVE'
            AND u.status = 'ACTIVE'
            AND (${cursor}::timestamptz IS NULL OR v.created_at < ${cursor}::timestamptz)
          ORDER BY v.created_at DESC, v.id DESC
          LIMIT ${limit}
        `;
        return json({
          items: rows,
          nextCursor: rows.length === limit ? rows[rows.length - 1].created_at : null,
        });
      } catch (error) {
        console.error('SOKORA feed query failed:', error?.message || 'unknown error');
        return json({ error: 'FEED_UNAVAILABLE' }, 503);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
