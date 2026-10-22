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


function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function verifySellerToken(request, env) {
  const secret = env.JWT_SECRET;
  const authorization = request.headers.get('authorization') || '';
  const token = authorization.replace(/^Bearer\\s+/i, '');
  if (!secret || !token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0])));
    const claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1])));
    if (header.alg !== 'HS256' || !claims.sub || !claims.exp ||
        claims.exp <= Math.floor(Date.now() / 1000) ||
        claims.iss !== 'sokora-api' || claims.aud !== 'sokora-app') return null;
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'],
    );
    const valid = await crypto.subtle.verify(
      'HMAC', key, decodeBase64Url(parts[2]), new TextEncoder().encode(parts[0] + '.' + parts[1]),
    );
    return valid ? { id: String(claims.sub), username: String(claims.username || ''), role: String(claims.role || '') } : null;
  } catch {
    return null;
  }
}

function streamConfig(env) {
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_STREAM_TOKEN) return null;
  return {
    accountId: env.CLOUDFLARE_ACCOUNT_ID,
    token: env.CLOUDFLARE_STREAM_TOKEN,
    base: 'https://api.cloudflare.com/client/v4/accounts/' + env.CLOUDFLARE_ACCOUNT_ID + '/stream',
  };
}

async function streamRequest(config, path, init = {}) {
  const response = await fetch(config.base + path, {
    ...init,
    headers: {
      authorization: 'Bearer ' + config.token,
      'content-type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    console.error('Cloudflare Stream request failed:', response.status);
    throw new Error('STREAM_PROVIDER_UNAVAILABLE');
  }
  return data.result;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

function validCursor(value) {
  if (value === null || value === '') return null;
  if (value.length > 80 || !Number.isFinite(Date.parse(value))) return undefined;
  return value;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const liveStartPath = url.pathname === '/api/live/start' && request.method === 'POST';
    const liveStopMatch = url.pathname.match(/^\\/api\\/live\\/([^/]+)\\/stop$/);
    if (url.pathname.startsWith('/api/') && request.method !== 'GET' &&
        !(liveStartPath || (liveStopMatch && request.method === 'POST'))) {
      return json({ error: 'METHOD_NOT_ALLOWED' }, 405);
    }

    if (url.pathname === '/api/live') {
      const config = streamConfig(env);
      if (!config) return json({ items: [], configured: false });
      try {
        const result = await streamRequest(config, '/live_inputs?per_page=100');
        const inputs = Array.isArray(result) ? result : (result?.data || []);
        const items = inputs
          .filter((input) => input.enabled !== false &&
            ['connected', 'reconnected', 'reconnecting'].includes(input.status))
          .map((input) => ({
            id: input.uid,
            title: typeof input.meta?.name === 'string' ? input.meta.name : 'SOKORA LIVE',
            creator: typeof input.meta?.creatorName === 'string' ? input.meta.creatorName : 'Muuzaji wa SOKORA',
            status: input.status,
            playback: input.webRTCPlayback?.url || input.playback?.hls || null,
            startedAt: input.modified || input.created || null,
          }))
          .filter((input) => input.playback);
        return json({ items, configured: true });
      } catch {
        return json({ error: 'LIVE_UNAVAILABLE' }, 503);
      }
    }

    if (liveStartPath) {
      const seller = await verifySellerToken(request, env);
      if (!seller) return json({ error: 'AUTH_REQUIRED' }, 401);
      if (!['SELLER', 'BUSINESS', 'ADMIN'].includes(seller.role.toUpperCase())) {
        return json({ error: 'SELLER_ACCOUNT_REQUIRED' }, 403);
      }
      const config = streamConfig(env);
      if (!config) return json({ error: 'LIVE_NOT_CONFIGURED' }, 503);
      let body;
      try {
        const raw = await request.text();
        if (raw.length > 4000) return json({ error: 'REQUEST_TOO_LARGE' }, 413);
        body = JSON.parse(raw || '{}');
      } catch {
        return json({ error: 'INVALID_JSON' }, 400);
      }
      const title = String(body.title || '').trim();
      if (!title || title.length > 100) return json({ error: 'INVALID_LIVE_TITLE' }, 400);
      try {
        const input = await streamRequest(config, '/live_inputs', {
          method: 'POST',
          headers: { 'Idempotency-Key': crypto.randomUUID() },
          body: JSON.stringify({
            enabled: true,
            preferLowLatency: true,
            meta: { name: title, creatorId: seller.id, creatorName: seller.username ? '@' + seller.username.replace(/^@/, '') : 'Muuzaji wa SOKORA' },
            recording: { mode: 'automatic', requireSignedURLs: false, hideLiveViewerCount: false, timeoutSeconds: 0 },
          }),
        });
        return json({
          id: input.uid,
          title,
          status: input.status || 'waiting_for_broadcast',
          publish: input.webRTC?.url || null,
          playback: input.webRTCPlayback?.url || input.playback?.hls || null,
          ingest: input.rtmps?.url || null,
          streamKey: input.rtmps?.streamKey || null,
        }, 201);
      } catch {
        return json({ error: 'LIVE_START_FAILED' }, 503);
      }
    }

    if (liveStopMatch && request.method === 'POST') {
      const seller = await verifySellerToken(request, env);
      if (!seller) return json({ error: 'AUTH_REQUIRED' }, 401);
      const config = streamConfig(env);
      if (!config) return json({ error: 'LIVE_NOT_CONFIGURED' }, 503);
      const liveId = decodeURIComponent(liveStopMatch[1]);
      if (!/^[a-f0-9]{32}$/i.test(liveId)) return json({ error: 'INVALID_LIVE_ID' }, 400);
      try {
        const input = await streamRequest(config, '/live_inputs/' + liveId);
        if (String(input.meta?.creatorId || '') !== seller.id && seller.role.toUpperCase() !== 'ADMIN') {
          return json({ error: 'NOT_LIVE_OWNER' }, 403);
        }
        await streamRequest(config, '/live_inputs/' + liveId, {
          method: 'PUT',
          body: JSON.stringify({ enabled: false }),
        });
        return json({ ok: true, id: liveId });
      } catch {
        return json({ error: 'LIVE_STOP_FAILED' }, 503);
      }
    }

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
      const cursor = validCursor(url.searchParams.get('cursor'));
      if (cursor === undefined) return json({ error: 'INVALID_CURSOR' }, 400);

      try {
        const db = getDatabase(env);
        const parsedLimit = Number.parseInt(url.searchParams.get('limit') || '10', 10);
        const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 30) : 10;
        const rows = await db`
          SELECT
            v.id AS video_id, v.caption, v.video_url, v.thumbnail_url, v.created_at,
            p.id AS product_id, p.name AS product_name, p.price_tzs, p.currency,
            p.location, p.category,
            u.id AS seller_id, u.display_name AS seller_name, u.username AS seller_username,
            (SELECT COUNT(*)::int FROM video_likes vl WHERE vl.video_id = v.id) AS likes_count
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

    const productMatch = url.pathname.match(/^\/api\/products\/([^/]+)$/);
    if (productMatch) {
      let productId;
      try {
        productId = decodeURIComponent(productMatch[1]);
      } catch {
        return json({ error: 'INVALID_PRODUCT_ID' }, 400);
      }
      if (!productId || productId.length > 80 || /[\u0000-\u001f]/.test(productId)) {
        return json({ error: 'INVALID_PRODUCT_ID' }, 400);
      }
      try {
        const db = getDatabase(env);
        const rows = await db`
          SELECT
            p.id, p.name, p.description, p.price_tzs, p.currency,
            p.location, p.created_at,
            u.id AS seller_id, u.display_name AS seller_name,
            u.username AS seller_username
          FROM products p
          JOIN users u ON u.id = p.seller_id
          WHERE p.id::text = ${productId}
            AND p.status = 'ACTIVE'
            AND u.status = 'ACTIVE'
          LIMIT 1
        `;
        if (!rows.length) return json({ error: 'PRODUCT_NOT_FOUND' }, 404);
        return json({ product: rows[0] });
      } catch (error) {
        console.error('SOKORA product lookup failed:', error?.message || 'unknown error');
        return json({ error: 'PRODUCT_UNAVAILABLE' }, 503);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
