import postgres from 'postgres';

let sqlClient;
let sqlConnectionString;

function getDatabase(env) {
  const connectionString = env.sokora_hyperdrive?.connectionString;
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
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}


const textEncoder = new TextEncoder();

function base64url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function encodeJson(value) { return base64url(textEncoder.encode(JSON.stringify(value))); }
function decodeBase64url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
async function passwordHash(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', textEncoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' }, key, 256);
  return 'pbkdf2$310000$' + base64url(salt) + '$' + base64url(new Uint8Array(bits));
}
async function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2' || Number(parts[1]) !== 310000) return false;
  try {
    const salt = decodeBase64url(parts[2]);
    const expected = decodeBase64url(parts[3]);
    const key = await crypto.subtle.importKey('raw', textEncoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' }, key, 256));
    if (bits.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < bits.length; i++) diff |= bits[i] ^ expected[i];
    return diff === 0;
  } catch { return false; }
}
async function signToken(payload, secret) {
  const head = encodeJson({ alg: 'HS256', typ: 'JWT' });
  const body = encodeJson(payload);
  const input = head + '.' + body;
  const key = await crypto.subtle.importKey('raw', textEncoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, textEncoder.encode(input)));
  return input + '.' + base64url(signature);
}
async function readToken(token, secret) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  try {
    const key = await crypto.subtle.importKey('raw', textEncoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('HMAC', key, decodeBase64url(parts[2]), textEncoder.encode(parts[0] + '.' + parts[1]));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64url(parts[1])));
    if (payload.iss !== 'sokora-api' || payload.aud !== 'sokora-app' || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

function validCursor(value) {
  if (value === null || value === '') return null;
  if (value.length > 80 || !Number.isFinite(Date.parse(value))) return undefined;
  return value;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isAuthPost = request.method === 'POST' && ['/api/auth/register', '/api/auth/login'].includes(url.pathname);
    if (url.pathname.startsWith('/api/') && request.method !== 'GET' && !isAuthPost) {
      return json({ error: 'METHOD_NOT_ALLOWED' }, 405);
    }

    if (url.pathname === '/api/auth/register' && request.method === 'POST') {
      if (!env.JWT_SECRET2 || env.JWT_SECRET2.length < 32) return json({ error: 'AUTH_NOT_CONFIGURED' }, 503);
      let body;
      try { body = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
      const email = String(body.email || '').trim().toLowerCase() || null;
      const phone = String(body.phone || '').trim() || null;
      const username = String(body.username || '').trim().toLowerCase().replace(/^@/, '');
      const displayName = String(body.displayName || '').trim();
      const password = String(body.password || '');
      if ((!email && !phone) || !/^[a-z0-9_]{3,30}$/.test(username) || displayName.length < 2 || displayName.length > 80 || password.length < 10 || password.length > 128) {
        return json({ error: 'INVALID_REGISTRATION', message: 'Weka email au simu, username ya herufi/namba 3–30, jina, na password ya angalau herufi 10.' }, 400);
      }
      try {
        const db = getDatabase(env);
        const hash = await passwordHash(password);
        const rows = await db`
          INSERT INTO users (email, phone, username, display_name, password_hash)
          VALUES (${email}, ${phone}, ${username}, ${displayName}, ${hash})
          RETURNING id, username, display_name, role
        `;
        const user = rows[0];
        const now = Math.floor(Date.now() / 1000);
        const token = await signToken({ sub: String(user.id), username: user.username, role: user.role, iss: 'sokora-api', aud: 'sokora-app', iat: now, exp: now + 604800 }, env.JWT_SECRET2);
        return json({ user, token, tokenType: 'Bearer', expiresIn: 604800 }, 201);
      } catch (error) {
        if (error?.code === '23505') return json({ error: 'ACCOUNT_ALREADY_EXISTS' }, 409);
        console.error('SOKORA registration failed:', error?.message || 'unknown error');
        return json({ error: 'REGISTRATION_FAILED' }, 500);
      }
    }

    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      if (!env.JWT_SECRET2 || env.JWT_SECRET2.length < 32) return json({ error: 'AUTH_NOT_CONFIGURED' }, 503);
      let body;
      try { body = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
      const identity = String(body.identity || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!identity || !password || password.length > 128) return json({ error: 'IDENTITY_AND_PASSWORD_REQUIRED' }, 400);
      try {
        const db = getDatabase(env);
        const rows = await db`
          SELECT id, username, display_name, role, status, password_hash
          FROM users
          WHERE lower(username) = ${identity.replace(/^@/, '')}
             OR lower(coalesce(email, '')) = ${identity}
             OR phone = ${identity}
          LIMIT 1
        `;
        const user = rows[0];
        if (!user || user.status !== 'ACTIVE' || !(await verifyPassword(password, user.password_hash))) {
          return json({ error: 'INVALID_CREDENTIALS' }, 401);
        }
        const now = Math.floor(Date.now() / 1000);
        const token = await signToken({ sub: String(user.id), username: user.username, role: user.role, iss: 'sokora-api', aud: 'sokora-app', iat: now, exp: now + 604800 }, env.JWT_SECRET2);
        return json({ user: { id: user.id, username: user.username, display_name: user.display_name, role: user.role }, token, tokenType: 'Bearer', expiresIn: 604800 });
      } catch (error) {
        console.error('SOKORA login failed:', error?.message || 'unknown error');
        return json({ error: 'LOGIN_FAILED' }, 500);
      }
    }

    if (url.pathname === '/api/auth/me' && request.method === 'GET') {
      if (!env.JWT_SECRET2 || env.JWT_SECRET2.length < 32) return json({ error: 'AUTH_NOT_CONFIGURED' }, 503);
      const authorization = request.headers.get('authorization') || '';
      const token = authorization.replace(/^Bearer\s+/i, '');
      const payload = await readToken(token, env.JWT_SECRET2);
      if (!payload) return json({ error: 'INVALID_SESSION' }, 401);
      try {
        const db = getDatabase(env);
        const rows = await db`SELECT id, username, display_name, role, status FROM users WHERE id = ${payload.sub} LIMIT 1`;
        const user = rows[0];
        if (!user || user.status !== 'ACTIVE') return json({ error: 'ACCOUNT_INACTIVE' }, 401);
        return json({ user: { id: user.id, username: user.username, display_name: user.display_name, role: user.role } });
      } catch (error) {
        console.error('SOKORA session lookup failed:', error?.message || 'unknown error');
        return json({ error: 'SESSION_LOOKUP_FAILED' }, 500);
      }
    }

    if (url.pathname === '/api/health') {
      try {
        if (!env.sokora_hyperdrive?.connectionString) {
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
            p.id AS product_id, p.name AS product_name, p.price_tzs, p.currency, p.location, p.category,
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

    if (url.pathname === '/api/products') {
      const rawLimit = Number.parseInt(url.searchParams.get('limit') || '20', 10);
      const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 20;
      const category = (url.searchParams.get('category') || '').trim().slice(0, 80);
      const query = (url.searchParams.get('q') || '').trim().slice(0, 120);
      const sort = url.searchParams.get('sort') || 'newest';
      const orderBy = sort === 'price-asc'
        ? 'price_asc'
        : sort === 'price-desc' ? 'price_desc' : 'newest';

      try {
        const db = getDatabase(env);
        const rows = await db`
          SELECT
            p.id, p.name, p.description, p.price_tzs, p.currency,
            p.category, p.location, p.created_at,
            u.id AS seller_id, u.display_name AS seller_name,
            u.username AS seller_username
          FROM products p
          JOIN users u ON u.id = p.seller_id
          WHERE p.status = 'ACTIVE'
            AND u.status = 'ACTIVE'
            AND (${category} = '' OR p.category ILIKE ${'%' + category + '%'})
            AND (
              ${query} = ''
              OR p.name ILIKE ${'%' + query + '%'}
              OR COALESCE(p.description, '') ILIKE ${'%' + query + '%'}
              OR COALESCE(p.location, '') ILIKE ${'%' + query + '%'}
              OR COALESCE(p.category, '') ILIKE ${'%' + query + '%'}
              OR u.username ILIKE ${'%' + query + '%'}
              OR u.display_name ILIKE ${'%' + query + '%'}
            )
          ORDER BY
            CASE WHEN ${orderBy} = 'price_asc' THEN p.price_tzs END ASC,
            CASE WHEN ${orderBy} = 'price_desc' THEN p.price_tzs END DESC,
            p.created_at DESC, p.id DESC
          LIMIT ${limit}
        `;
        return json({ items: rows, count: rows.length, limit });
      } catch (error) {
        console.error('SOKORA products list failed:', error?.message || 'unknown error');
        return json({ error: 'PRODUCTS_UNAVAILABLE' }, 503);
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
