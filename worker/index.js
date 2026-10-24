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
// Cloudflare Workers Web Crypto supports at most 100,000 PBKDF2 iterations.
const PASSWORD_ITERATIONS = 100000;
async function passwordHash(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', textEncoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: PASSWORD_ITERATIONS, hash: 'SHA-256' }, key, 256);
  return 'pbkdf2$' + PASSWORD_ITERATIONS + '$' + base64url(salt) + '$' + base64url(new Uint8Array(bits));
}
async function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  const iterations = Number(parts[1]);
  if (parts.length !== 4 || parts[0] !== 'pbkdf2' || !Number.isInteger(iterations) || iterations < 1 || iterations > PASSWORD_ITERATIONS) return false;
  try {
    const salt = decodeBase64url(parts[2]);
    const expected = decodeBase64url(parts[3]);
    const key = await crypto.subtle.importKey('raw', textEncoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256));
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


async function handleD1ReadRoutes(request, env, url) {
  if (env.SOKORA_D1_READS !== 'true' || !env.SOKORA_DB) return null;
  const db = env.SOKORA_DB;
  const jsonD1 = (data, status = 200) => new Response(JSON.stringify(data), {
    status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
  });
  try {
    if (url.pathname === '/api/feed' && request.method === 'GET') {
      const rawCursor = url.searchParams.get('cursor');
      const cursor = rawCursor ? validCursor(rawCursor) : null;
      if (cursor === undefined) return jsonD1({ error: 'INVALID_CURSOR' }, 400);
      const rawLimit = Number.parseInt(url.searchParams.get('limit') || '10', 10);
      const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 30) : 10;
      const result = await db.prepare(`
        SELECT v.id AS video_id, v.caption, v.video_url, v.thumbnail_url, v.created_at,
          p.id AS product_id, p.name AS product_name, p.price_tzs, p.currency, p.location, p.category,
          p.image_url AS product_image_url, u.id AS seller_id, u.display_name AS seller_name,
          u.username AS seller_username
        FROM videos v JOIN products p ON p.id = v.product_id JOIN users u ON u.id = v.seller_id
        WHERE v.status = 'PUBLISHED' AND p.status = 'ACTIVE' AND u.status = 'ACTIVE'
          AND (? IS NULL OR v.created_at < ?)
        ORDER BY v.created_at DESC, v.id DESC LIMIT ?
      `).bind(cursor, cursor, limit).all();
      const items = result.results || [];
      return jsonD1({ items, nextCursor: items.length === limit ? items[items.length - 1].created_at : null });
    }
    if (url.pathname === '/api/products' && request.method === 'GET') {
      const rawLimit = Number.parseInt(url.searchParams.get('limit') || '20', 10);
      const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 20;
      const category = (url.searchParams.get('category') || '').trim().slice(0, 80);
      const query = (url.searchParams.get('q') || '').trim().slice(0, 120);
      const sort = url.searchParams.get('sort') || 'newest';
      const order = sort === 'price-asc' ? 'p.price_tzs ASC' : sort === 'price-desc' ? 'p.price_tzs DESC' : 'p.created_at DESC, p.id DESC';
      const statement = `
        SELECT p.id, p.name, p.description, p.price_tzs, p.currency, p.category, p.location, p.image_url, p.created_at,
          u.id AS seller_id, u.display_name AS seller_name, u.username AS seller_username
        FROM products p JOIN users u ON u.id = p.seller_id
        WHERE p.status='ACTIVE' AND u.status='ACTIVE'
          AND (?='' OR lower(coalesce(p.category,'')) LIKE '%' || lower(?) || '%')
          AND (?='' OR lower(p.name) LIKE '%' || lower(?) || '%'
            OR lower(coalesce(p.description,'')) LIKE '%' || lower(?) || '%'
            OR lower(coalesce(p.location,'')) LIKE '%' || lower(?) || '%'
            OR lower(coalesce(p.category,'')) LIKE '%' || lower(?) || '%'
            OR lower(u.username) LIKE '%' || lower(?) || '%'
            OR lower(u.display_name) LIKE '%' || lower(?) || '%')
        ORDER BY ${order} LIMIT ?
      `;
      const result = await db.prepare(statement).bind(category, category, query, query, query, query, query, query, limit).all();
      const items = result.results || [];
      return jsonD1({ items, count: items.length, limit });
    }
    const productMatch = url.pathname.match(/^\/api\/products\/([^/]+)$/);
    if (productMatch && request.method === 'GET') {
      let productId;
      try { productId = decodeURIComponent(productMatch[1]); } catch { return jsonD1({ error: 'INVALID_PRODUCT_ID' }, 400); }
      if (!productId || productId.length > 80 || /[\\u0000-\\u001f]/.test(productId)) return jsonD1({ error: 'INVALID_PRODUCT_ID' }, 400);
      const row = await db.prepare(`
        SELECT p.id, p.name, p.description, p.price_tzs, p.currency, p.category, p.image_url, p.location, p.created_at,
          u.id AS seller_id, u.display_name AS seller_name, u.username AS seller_username
        FROM products p JOIN users u ON u.id=p.seller_id
        WHERE CAST(p.id AS TEXT)=? AND p.status='ACTIVE' AND u.status='ACTIVE' LIMIT 1
      `).bind(productId).first();
      return row ? jsonD1({ product: row }) : jsonD1({ error: 'PRODUCT_NOT_FOUND' }, 404);
    }

    if (url.pathname === '/api/live' && request.method === 'GET') {
      const rawLimit = Number.parseInt(url.searchParams.get('limit') || '8', 10);
      const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 20) : 8;
      const result = await db.prepare(`
        SELECT ls.id, ls.title, ls.started_at, u.id AS seller_id, u.username AS seller_username,
          u.display_name AS seller_name, sp.business_name, sp.verification_status,
          p.id AS pinned_product_id, p.name AS pinned_product_name,
          p.price_tzs AS pinned_product_price_tzs, p.image_url AS pinned_product_image_url
        FROM live_sessions ls JOIN users u ON u.id=ls.seller_id
        LEFT JOIN seller_profiles sp ON sp.user_id=u.id
        LEFT JOIN live_session_products lsp ON lsp.live_session_id=ls.id
        LEFT JOIN products p ON p.id=lsp.product_id AND p.status='ACTIVE'
        WHERE ls.status='LIVE' AND u.status='ACTIVE'
          AND (lsp.pinned_at IS NULL OR lsp.pinned_at=(SELECT MAX(lsp2.pinned_at) FROM live_session_products lsp2 JOIN products p2 ON p2.id=lsp2.product_id WHERE lsp2.live_session_id=ls.id AND p2.status='ACTIVE'))
        ORDER BY ls.started_at DESC LIMIT ?
      `).bind(limit).all();
      return jsonD1({ items: result.results || [] });
    }
    const sellerMatch = url.pathname.match(/^\/api\/sellers\/([^/]+)$/);
    if (sellerMatch && request.method === 'GET') {
      let username;
      try { username = decodeURIComponent(sellerMatch[1]).replace(/^@/, '').toLowerCase(); }
      catch { return jsonD1({ error: 'INVALID_SELLER' }, 400); }
      const seller = await db.prepare(`
        SELECT u.id, u.username, u.display_name, u.avatar_url, sp.business_name, sp.description,
          sp.region, sp.district, sp.verification_status
        FROM users u LEFT JOIN seller_profiles sp ON sp.user_id=u.id
        WHERE lower(u.username)=? AND u.status='ACTIVE' LIMIT 1
      `).bind(username).first();
      if (!seller) return jsonD1({ error: 'SELLER_NOT_FOUND' }, 404);
      const [productsResult, followersResult, ratingResult] = await Promise.all([
        db.prepare("SELECT id, name, description, price_tzs, currency, category, location, image_url, created_at FROM products WHERE seller_id=? AND status='ACTIVE' ORDER BY created_at DESC LIMIT 100").bind(seller.id).all(),
        db.prepare("SELECT COUNT(*) AS followers FROM follows WHERE seller_id=?").bind(seller.id).first(),
        db.prepare("SELECT ROUND(AVG(pr.rating),1) AS rating, COUNT(pr.id) AS review_count FROM product_reviews pr JOIN products p ON p.id=pr.product_id WHERE p.seller_id=?").bind(seller.id).first()
      ]);
      return jsonD1({ seller: { ...seller, verified: seller.verification_status === 'VERIFIED', followers: Number(followersResult?.followers || 0), rating: ratingResult?.rating ?? null, reviewCount: Number(ratingResult?.review_count || 0) }, products: productsResult.results || [] });
    }
    const reviewsMatch = url.pathname.match(/^\/api\/products\/([^/]+)\/reviews$/);
    if (reviewsMatch && request.method === 'GET') {
      const result = await db.prepare(`
        SELECT pr.id, pr.rating, pr.body, pr.created_at, u.username, u.display_name
        FROM product_reviews pr JOIN users u ON u.id=pr.buyer_id
        WHERE CAST(pr.product_id AS TEXT)=? ORDER BY pr.created_at DESC LIMIT 100
      `).bind(reviewsMatch[1]).all();
      const summary = await db.prepare("SELECT ROUND(AVG(rating),1) AS rating, COUNT(*) AS count FROM product_reviews WHERE CAST(product_id AS TEXT)=?").bind(reviewsMatch[1]).first();
      return jsonD1({ items: result.results || [], summary: summary || { rating: null, count: 0 } });
    }
    return null;
  } catch (error) {
    console.error('SOKORA D1 read route failed:', error?.message || 'unknown error');
    if (url.pathname === '/api/feed') return jsonD1({ error: 'FEED_UNAVAILABLE' }, 503);
    if (url.pathname === '/api/products') return jsonD1({ error: 'PRODUCTS_UNAVAILABLE' }, 503);
    if (/^\/api\/products\/[^/]+$/.test(url.pathname)) return jsonD1({ error: 'PRODUCT_UNAVAILABLE' }, 503);
    if (url.pathname === '/api/live') return jsonD1({ error: 'LIVE_SESSIONS_UNAVAILABLE' }, 503);
    if (url.pathname.startsWith('/api/sellers/')) return jsonD1({ error: 'SELLER_STORE_UNAVAILABLE' }, 503);
    if (/^\/api\/products\/[^/]+\/reviews$/.test(url.pathname)) return jsonD1({ error: 'REVIEWS_UNAVAILABLE' }, 503);
    return null;
  }
}

function validCursor(value) {
  if (value === null || value === '') return null;
  if (value.length > 80 || !Number.isFinite(Date.parse(value))) return undefined;
  return value;
}


async function authenticatedUser(request, env) {
  if (!env.JWT_SECRET2 || env.JWT_SECRET2.length < 32) return { error: 'AUTH_NOT_CONFIGURED', status: 503 };
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const payload = await readToken(token, env.JWT_SECRET2);
  if (!payload) return { error: 'INVALID_SESSION', status: 401 };
  try {
    const db = getDatabase(env);
    const rows = await db`SELECT id, username, display_name, role FROM users WHERE id = ${payload.sub} AND status = 'ACTIVE' LIMIT 1`;
    if (!rows.length) return { error: 'ACCOUNT_INACTIVE', status: 401 };
    return { user: rows[0] };
  } catch (error) {
    console.error('SOKORA auth lookup failed:', error?.message || 'unknown error');
    return { error: 'DATABASE_UNAVAILABLE', status: 503 };
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const d1ReadResponse = await handleD1ReadRoutes(request, env, url);
    if (d1ReadResponse) return d1ReadResponse;
    const isAuthPost = request.method === 'POST' && ['/api/auth/register', '/api/auth/login'].includes(url.pathname);
    const allowedWrite = (
      (request.method === 'POST' && ['/api/auth/register', '/api/auth/login', '/api/orders', '/api/conversations'].includes(url.pathname)) ||
      (request.method === 'PATCH' && /^\/api\/orders\/[^/]+\/status$/.test(url.pathname)) ||
      (request.method === 'POST' && (/^\/api\/conversations\/[^/]+\/messages$/.test(url.pathname) || /^\/api\/live\/[^/]+\/pin$/.test(url.pathname) || /^\/api\/products\/[^/]+\/reviews$/.test(url.pathname))) ||
      ((request.method === 'POST' || request.method === 'DELETE') && (/^\/api\/saved-products\/[^/]+$/.test(url.pathname) || /^\/api\/follows\/[^/]+$/.test(url.pathname)))
    );
    if (url.pathname.startsWith('/api/') && request.method !== 'GET' && !isAuthPost && !allowedWrite) {
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

    if (url.pathname === '/api/health/d1') {
      try {
        if (!env.SOKORA_DB || typeof env.SOKORA_DB.prepare !== 'function') {
          return json({ ok: false, service: 'sokora-api', database: 'd1_binding_missing' }, 503);
        }
        const result = await env.SOKORA_DB.prepare(
          "SELECT COUNT(*) AS table_count FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name <> '_cf_KV'"
        ).first();
        return json({
          ok: true,
          service: 'sokora-api',
          database: 'd1_connected',
          tables: Number(result?.table_count || 0),
          migration: 'foundation',
        });
      } catch (error) {
        console.error('SOKORA D1 health check failed:', error?.message || 'unknown error');
        return json({ ok: false, service: 'sokora-api', database: 'd1_unavailable' }, 503);
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
        // Log only non-secret diagnostic metadata; never log the connection string or credentials.
        const diagnostic = {
          name: String(error?.name || 'Error').slice(0, 80),
          code: String(error?.code || error?.errno || 'UNKNOWN').slice(0, 80),
          message: String(error?.message || 'unknown error').slice(0, 240),
        };
        console.error('SOKORA database health check failed:', JSON.stringify(diagnostic));
        return json({
          ok: false,
          service: 'sokora-api',
          database: 'unavailable',
          diagnostic: { name: diagnostic.name, code: diagnostic.code },
        }, 503);
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
            p.id AS product_id, p.name AS product_name, p.price_tzs, p.currency, p.location, p.category, p.image_url AS product_image_url,
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
            p.category, p.location, p.image_url, p.created_at,
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
            p.category, p.image_url, p.location, p.created_at,
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


    if (url.pathname === '/api/orders' && request.method === 'POST') {
      const auth = await authenticatedUser(request, env);
      if (auth.error) return json({ error: auth.error }, auth.status);
      let body;
      try { body = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
      const items = Array.isArray(body.items) ? body.items : [];
      if (!items.length || items.length > 20) return json({ error: 'INVALID_ORDER_ITEMS' }, 400);
      const deliveryName = String(body.deliveryName || '').trim().slice(0, 120) || null;
      const deliveryPhone = String(body.deliveryPhone || '').trim().slice(0, 32) || null;
      const deliveryAddress = String(body.deliveryAddress || '').trim().slice(0, 500) || null;
      const buyerNote = String(body.note || '').trim().slice(0, 1000) || null;
      try {
        const db = getDatabase(env);
        const order = await db.begin(async tx => {
          const normalized = [];
          for (const item of items) {
            const productId = String(item.productId || '');
            const quantity = Number(item.quantity);
            if (!/^\d+$/.test(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error('INVALID_ORDER_ITEM');
            const rows = await tx`SELECT id, seller_id, name, price_tzs FROM products WHERE id = ${productId} AND status = 'ACTIVE' LIMIT 1`;
            if (!rows.length) throw new Error('PRODUCT_NOT_AVAILABLE');
            normalized.push({ ...rows[0], quantity });
          }
          const sellerIds = new Set(normalized.map(item => String(item.seller_id)));
          if (sellerIds.size !== 1) throw new Error('ONE_SELLER_PER_ORDER');
          const subtotal = normalized.reduce((sum, item) => sum + Number(item.price_tzs) * item.quantity, 0);
          const orderNumber = 'SK-' + crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
          const created = await tx`INSERT INTO orders (order_number, buyer_id, seller_id, subtotal_tzs, delivery_fee_tzs, total_tzs, delivery_name, delivery_phone, delivery_address, buyer_note) VALUES (${orderNumber}, ${auth.user.id}, ${normalized[0].seller_id}, ${subtotal}, 0, ${subtotal}, ${deliveryName}, ${deliveryPhone}, ${deliveryAddress}, ${buyerNote}) RETURNING id, order_number, status, subtotal_tzs, delivery_fee_tzs, total_tzs, created_at`;
          for (const item of normalized) {
            await tx`INSERT INTO order_items (order_id, product_id, product_name, unit_price_tzs, quantity, line_total_tzs) VALUES (${created[0].id}, ${item.id}, ${item.name}, ${item.price_tzs}, ${item.quantity}, ${Number(item.price_tzs) * item.quantity})`;
          }
          await tx`INSERT INTO notifications (user_id, kind, title, body, target_url) VALUES (${normalized[0].seller_id}, 'NEW_ORDER', 'Oda mpya', ${'Umepokea oda ' + orderNumber}, ${'/orders/' + created[0].id})`;
          return { ...created[0], items: normalized.map(item => ({ productId: item.id, name: item.name, quantity: item.quantity, unitPriceTzs: item.price_tzs })) };
        });
        return json({ order }, 201);
      } catch (error) {
        if (error?.message === 'INVALID_ORDER_ITEM') return json({ error: 'INVALID_ORDER_ITEM' }, 400);
        if (error?.message === 'PRODUCT_NOT_AVAILABLE') return json({ error: 'PRODUCT_NOT_AVAILABLE' }, 409);
        if (error?.message === 'ONE_SELLER_PER_ORDER') return json({ error: 'ONE_SELLER_PER_ORDER', message: 'Tengeneza oda tofauti kwa kila duka.' }, 400);
        console.error('SOKORA order creation failed:', error?.message || 'unknown error');
        return json({ error: 'ORDER_CREATION_FAILED' }, 503);
      }
    }

    if (url.pathname === '/api/orders' && request.method === 'GET') {
      const auth = await authenticatedUser(request, env);
      if (auth.error) return json({ error: auth.error }, auth.status);
      try {
        const db = getDatabase(env);
        const rows = await db`SELECT o.id, o.order_number, o.buyer_id, o.seller_id, o.status, o.subtotal_tzs, o.delivery_fee_tzs, o.total_tzs, o.created_at, o.updated_at, (o.buyer_id = ${auth.user.id}) AS is_buyer FROM orders o WHERE o.buyer_id = ${auth.user.id} OR o.seller_id = ${auth.user.id} ORDER BY o.created_at DESC LIMIT 100`;
        return json({ items: rows });
      } catch (error) {
        console.error('SOKORA orders list failed:', error?.message || 'unknown error');
        return json({ error: 'ORDERS_UNAVAILABLE' }, 503);
      }
    }

    const orderStatusMatch = url.pathname.match(/^\/api\/orders\/([^/]+)\/status$/);
    if (orderStatusMatch && request.method === 'PATCH') {
      const auth = await authenticatedUser(request, env);
      if (auth.error) return json({ error: auth.error }, auth.status);
      let body;
      try { body = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
      const nextStatus = String(body.status || '').toUpperCase();
      if (!['CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(nextStatus)) return json({ error: 'INVALID_ORDER_STATUS' }, 400);
      try {
        const db = getDatabase(env);
        const rows = await db`UPDATE orders SET status = ${nextStatus}, updated_at = NOW() WHERE id::text = ${orderStatusMatch[1]} AND ((${nextStatus} IN ('CONFIRMED','SHIPPED') AND seller_id = ${auth.user.id}) OR (${nextStatus} = 'DELIVERED' AND buyer_id = ${auth.user.id}) OR (${nextStatus} = 'CANCELLED' AND (buyer_id = ${auth.user.id} OR seller_id = ${auth.user.id}))) AND ((${nextStatus} = 'CONFIRMED' AND status = 'PENDING') OR (${nextStatus} = 'SHIPPED' AND status = 'CONFIRMED') OR (${nextStatus} = 'DELIVERED' AND status = 'SHIPPED') OR (${nextStatus} = 'CANCELLED' AND status = 'PENDING')) RETURNING id, order_number, status, updated_at`;
        if (!rows.length) return json({ error: 'ORDER_NOT_FOUND_OR_TRANSITION_NOT_ALLOWED' }, 409);
        const detail = await db`SELECT buyer_id, seller_id FROM orders WHERE id = ${rows[0].id}`;
        const notifyUser = String(auth.user.id) === String(detail[0].buyer_id) ? detail[0].seller_id : detail[0].buyer_id;
        await db`INSERT INTO notifications (user_id, kind, title, body, target_url) VALUES (${notifyUser}, 'ORDER_UPDATE', 'Hali ya oda imebadilika', ${'Oda ' + rows[0].order_number + ': ' + nextStatus}, ${'/orders/' + rows[0].id})`;
        return json({ order: rows[0] });
      } catch (error) {
        console.error('SOKORA order status update failed:', error?.message || 'unknown error');
        return json({ error: 'ORDER_UPDATE_FAILED' }, 503);
      }
    }

    if (url.pathname === '/api/saved-products' && request.method === 'GET') {
      const auth = await authenticatedUser(request, env);
      if (auth.error) return json({ error: auth.error }, auth.status);
      try {
        const db = getDatabase(env);
        const rows = await db`SELECT p.id, p.name, p.description, p.price_tzs, p.currency, p.category, p.location, p.created_at, u.username AS seller_username, u.display_name AS seller_name FROM saved_products sp JOIN products p ON p.id = sp.product_id JOIN users u ON u.id = p.seller_id WHERE sp.user_id = ${auth.user.id} AND p.status = 'ACTIVE' ORDER BY sp.created_at DESC LIMIT 200`;
        return json({ items: rows });
      } catch (error) {
        console.error('SOKORA saved products list failed:', error?.message || 'unknown error');
        return json({ error: 'SAVED_PRODUCTS_UNAVAILABLE' }, 503);
      }
    }
    const savedMatch = url.pathname.match(/^\/api\/saved-products\/([^/]+)$/);
    if (savedMatch && ['POST', 'DELETE'].includes(request.method)) {
      const auth = await authenticatedUser(request, env);
      if (auth.error) return json({ error: auth.error }, auth.status);
      try {
        const db = getDatabase(env);
        if (request.method === 'POST') {
          const product = await db`SELECT id FROM products WHERE id::text = ${savedMatch[1]} AND status = 'ACTIVE' LIMIT 1`;
          if (!product.length) return json({ error: 'PRODUCT_NOT_FOUND' }, 404);
          await db`INSERT INTO saved_products (user_id, product_id) VALUES (${auth.user.id}, ${product[0].id}) ON CONFLICT DO NOTHING`;
          return json({ saved: true });
        }
        await db`DELETE FROM saved_products WHERE user_id = ${auth.user.id} AND product_id::text = ${savedMatch[1]}`;
        return json({ saved: false });
      } catch (error) {
        console.error('SOKORA saved product change failed:', error?.message || 'unknown error');
        return json({ error: 'SAVED_PRODUCT_UPDATE_FAILED' }, 503);
      }
    }

    if (url.pathname === '/api/conversations' && request.method === 'GET') {
      const auth = await authenticatedUser(request, env);
      if (auth.error) return json({ error: auth.error }, auth.status);
      try {
        const db = getDatabase(env);
        const rows = await db`SELECT c.id, c.product_id, c.updated_at, CASE WHEN c.buyer_id = ${auth.user.id} THEN s.id ELSE b.id END AS other_user_id, CASE WHEN c.buyer_id = ${auth.user.id} THEN s.username ELSE b.username END AS other_username, CASE WHEN c.buyer_id = ${auth.user.id} THEN s.display_name ELSE b.display_name END AS other_display_name, p.name AS product_name FROM conversations c JOIN users b ON b.id = c.buyer_id JOIN users s ON s.id = c.seller_id LEFT JOIN products p ON p.id = c.product_id WHERE c.buyer_id = ${auth.user.id} OR c.seller_id = ${auth.user.id} ORDER BY c.updated_at DESC LIMIT 100`;
        return json({ items: rows });
      } catch (error) {
        console.error('SOKORA conversations list failed:', error?.message || 'unknown error');
        return json({ error: 'CONVERSATIONS_UNAVAILABLE' }, 503);
      }
    }
    if (url.pathname === '/api/conversations' && request.method === 'POST') {
      const auth = await authenticatedUser(request, env);
      if (auth.error) return json({ error: auth.error }, auth.status);
      let body;
      try { body = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
      const productId = body.productId == null ? null : String(body.productId);
      const sellerId = String(body.sellerId || '');
      if (!/^\d+$/.test(sellerId) || (productId !== null && !/^\d+$/.test(productId))) return json({ error: 'INVALID_CONVERSATION_PARTICIPANTS' }, 400);
      try {
        const db = getDatabase(env);
        if (productId) {
          const products = await db`SELECT id, seller_id FROM products WHERE id::text = ${productId} AND status = 'ACTIVE' LIMIT 1`;
          if (!products.length || String(products[0].seller_id) !== sellerId) return json({ error: 'PRODUCT_NOT_FOUND' }, 404);
        }
        if (String(auth.user.id) === sellerId) return json({ error: 'CANNOT_MESSAGE_SELF' }, 400);
        const rows = await db`INSERT INTO conversations (buyer_id, seller_id, product_id) VALUES (${auth.user.id}, ${sellerId}, ${productId}) ON CONFLICT (buyer_id, seller_id, (COALESCE(product_id, 0))) DO UPDATE SET updated_at = NOW() RETURNING id, buyer_id, seller_id, product_id, updated_at`;
        return json({ conversation: rows[0] }, 201);
      } catch (error) {
        console.error('SOKORA conversation creation failed:', error?.message || 'unknown error');
        return json({ error: 'CONVERSATION_CREATION_FAILED' }, 503);
      }
    }
    const messageMatch = url.pathname.match(/^\/api\/conversations\/([^/]+)\/messages$/);
    if (messageMatch && ['GET', 'POST'].includes(request.method)) {
      const auth = await authenticatedUser(request, env);
      if (auth.error) return json({ error: auth.error }, auth.status);
      try {
        const db = getDatabase(env);
        const conversations = await db`SELECT id FROM conversations WHERE id::text = ${messageMatch[1]} AND (buyer_id = ${auth.user.id} OR seller_id = ${auth.user.id}) LIMIT 1`;
        if (!conversations.length) return json({ error: 'CONVERSATION_NOT_FOUND' }, 404);
        if (request.method === 'GET') {
          const rows = await db`SELECT m.id, m.sender_id, u.username AS sender_username, m.body, m.read_at, m.created_at FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.conversation_id = ${conversations[0].id} ORDER BY m.created_at DESC LIMIT 100`;
          return json({ items: rows.reverse() });
        }
        let body;
        try { body = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
        const message = String(body.body || '').trim();
        if (!message || message.length > 4000) return json({ error: 'INVALID_MESSAGE' }, 400);
        const rows = await db`INSERT INTO messages (conversation_id, sender_id, body) VALUES (${conversations[0].id}, ${auth.user.id}, ${message}) RETURNING id, conversation_id, sender_id, body, created_at`;
        await db`UPDATE conversations SET updated_at = NOW() WHERE id = ${conversations[0].id}`;
        const participants = await db`SELECT buyer_id, seller_id FROM conversations WHERE id = ${conversations[0].id}`;
        const otherUser = String(participants[0].buyer_id) === String(auth.user.id) ? participants[0].seller_id : participants[0].buyer_id;
        await db`INSERT INTO notifications (user_id, kind, title, body, target_url) VALUES (${otherUser}, 'NEW_MESSAGE', 'Ujumbe mpya', ${message.slice(0, 160)}, ${'/messages/' + conversations[0].id})`;
        return json({ message: rows[0] }, 201);
      } catch (error) {
        console.error('SOKORA conversation messages failed:', error?.message || 'unknown error');
        return json({ error: 'MESSAGES_UNAVAILABLE' }, 503);
      }
    }

    const reviewMatch = url.pathname.match(/^\/api\/products\/([^/]+)\/reviews$/);
    if (reviewMatch && request.method === 'POST') {
      const auth = await authenticatedUser(request, env);
      if (auth.error) return json({ error: auth.error }, auth.status);
      let body;
      try { body = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
      const rating = Number(body.rating);
      const reviewBody = String(body.body || '').trim().slice(0, 2000) || null;
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json({ error: 'INVALID_RATING' }, 400);
      try {
        const db = getDatabase(env);
        const eligible = await db`SELECT o.id FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.buyer_id = ${auth.user.id} AND o.status = 'DELIVERED' AND oi.product_id::text = ${reviewMatch[1]} LIMIT 1`;
        if (!eligible.length) return json({ error: 'REVIEW_REQUIRES_DELIVERED_ORDER' }, 403);
        const rows = await db`INSERT INTO product_reviews (order_id, product_id, buyer_id, rating, body) SELECT ${eligible[0].id}, p.id, ${auth.user.id}, ${rating}, ${reviewBody} FROM products p WHERE p.id::text = ${reviewMatch[1]} AND p.status = 'ACTIVE' RETURNING id, product_id, rating, body, created_at`;
        if (!rows.length) return json({ error: 'PRODUCT_NOT_FOUND' }, 404);
        return json({ review: rows[0] }, 201);
      } catch (error) {
        if (error?.code === '23505') return json({ error: 'REVIEW_ALREADY_EXISTS' }, 409);
        console.error('SOKORA product review failed:', error?.message || 'unknown error');
        return json({ error: 'REVIEW_CREATION_FAILED' }, 503);
      }
    }

    if (url.pathname === '/api/notifications' && request.method === 'GET') {
      const auth = await authenticatedUser(request, env);
      if (auth.error) return json({ error: auth.error }, auth.status);
      try {
        const db = getDatabase(env);
        const rows = await db`SELECT id, kind, title, body, target_url, read_at, created_at FROM notifications WHERE user_id = ${auth.user.id} ORDER BY created_at DESC LIMIT 100`;
        return json({ items: rows, unreadCount: rows.filter(item => !item.read_at).length });
      } catch (error) {
        console.error('SOKORA notifications list failed:', error?.message || 'unknown error');
        return json({ error: 'NOTIFICATIONS_UNAVAILABLE' }, 503);
      }
    }


    if (url.pathname === '/api/live' && request.method === 'GET') {
      const parsedLimit = Number.parseInt(url.searchParams.get('limit') || '8', 10);
      const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 20) : 8;
      try {
        const db = getDatabase(env);
        const items = await db`SELECT ls.id, ls.title, ls.started_at, u.id AS seller_id, u.username AS seller_username, u.display_name AS seller_name, sp.business_name, sp.verification_status, p.id AS pinned_product_id, p.name AS pinned_product_name, p.price_tzs AS pinned_product_price_tzs, p.image_url AS pinned_product_image_url FROM live_sessions ls JOIN users u ON u.id = ls.seller_id LEFT JOIN seller_profiles sp ON sp.user_id = u.id LEFT JOIN LATERAL (SELECT p.id, p.name, p.price_tzs, p.image_url FROM live_session_products lsp JOIN products p ON p.id = lsp.product_id WHERE lsp.live_session_id = ls.id AND p.status = 'ACTIVE' ORDER BY lsp.pinned_at DESC LIMIT 1) p ON TRUE WHERE ls.status = 'LIVE' AND u.status = 'ACTIVE' ORDER BY ls.started_at DESC NULLS LAST LIMIT ${limit}`;
        return json({ items });
      } catch (error) {
        console.error('SOKORA live sessions list failed:', error?.message || 'unknown error');
        return json({ error: 'LIVE_SESSIONS_UNAVAILABLE' }, 503);
      }
    }

    if (url.pathname === '/api/follows' && request.method === 'GET') {
      const auth = await authenticatedUser(request, env);
      if (auth.error) return json({ error: auth.error }, auth.status);
      try {
        const db = getDatabase(env);
        const rows = await db`SELECT f.seller_id, u.username, u.display_name, f.created_at FROM follows f JOIN users u ON u.id = f.seller_id WHERE f.follower_id = ${auth.user.id} AND u.status = 'ACTIVE' ORDER BY f.created_at DESC LIMIT 500`;
        return json({ items: rows, count: rows.length });
      } catch (error) {
        console.error('SOKORA follows list failed:', error?.message || 'unknown error');
        return json({ error: 'FOLLOWS_UNAVAILABLE' }, 503);
      }
    }

    const followMatch = url.pathname.match(/^\/api\/follows\/([^/]+)$/);
    if (followMatch && ['POST', 'DELETE'].includes(request.method)) {
      const auth = await authenticatedUser(request, env);
      if (auth.error) return json({ error: auth.error }, auth.status);
      const sellerId = followMatch[1];
      if (!/^\d+$/.test(sellerId)) return json({ error: 'INVALID_SELLER_ID' }, 400);
      if (String(auth.user.id) === sellerId) return json({ error: 'CANNOT_FOLLOW_SELF' }, 400);
      try {
        const db = getDatabase(env);
        if (request.method === 'POST') {
          const seller = await db`SELECT id FROM users WHERE id = ${sellerId} AND status = 'ACTIVE' LIMIT 1`;
          if (!seller.length) return json({ error: 'SELLER_NOT_FOUND' }, 404);
          await db`INSERT INTO follows (follower_id, seller_id) VALUES (${auth.user.id}, ${seller[0].id}) ON CONFLICT DO NOTHING`;
          return json({ following: true, sellerId: seller[0].id });
        }
        await db`DELETE FROM follows WHERE follower_id = ${auth.user.id} AND seller_id = ${sellerId}`;
        return json({ following: false, sellerId });
      } catch (error) {
        console.error('SOKORA follow update failed:', error?.message || 'unknown error');
        return json({ error: 'FOLLOW_UPDATE_FAILED' }, 503);
      }
    }
    const sellerMatch = url.pathname.match(/^\/api\/sellers\/([^/]+)$/);
    if (sellerMatch && request.method === 'GET') {
      let username;
      try { username = decodeURIComponent(sellerMatch[1]).replace(/^@/, '').toLowerCase(); }
      catch { return json({ error: 'INVALID_SELLER' }, 400); }
      try {
        const db = getDatabase(env);
        const sellers = await db`SELECT u.id, u.username, u.display_name, u.avatar_url, sp.business_name, sp.description, sp.region, sp.district, sp.verification_status FROM users u LEFT JOIN seller_profiles sp ON sp.user_id = u.id WHERE lower(u.username) = ${username} AND u.status = 'ACTIVE' LIMIT 1`;
        if (!sellers.length) return json({ error: 'SELLER_NOT_FOUND' }, 404);
        const seller = sellers[0];
        const products = await db`SELECT id, name, description, price_tzs, currency, category, location, image_url, created_at FROM products WHERE seller_id = ${seller.id} AND status = 'ACTIVE' ORDER BY created_at DESC LIMIT 100`;
        const metrics = await db`SELECT COUNT(*)::int AS followers FROM follows WHERE seller_id = ${seller.id}`;
        const rating = await db`SELECT ROUND(AVG(pr.rating)::numeric, 1) AS rating, COUNT(pr.id)::int AS review_count FROM product_reviews pr JOIN products p ON p.id = pr.product_id WHERE p.seller_id = ${seller.id}`;
        return json({ seller: { ...seller, verified: seller.verification_status === 'VERIFIED', followers: metrics[0]?.followers || 0, rating: rating[0]?.rating || null, reviewCount: rating[0]?.review_count || 0 }, products });
      } catch (error) {
        console.error('SOKORA seller store lookup failed:', error?.message || 'unknown error');
        return json({ error: 'SELLER_STORE_UNAVAILABLE' }, 503);
      }
    }

    const reviewsGetMatch = url.pathname.match(/^\/api\/products\/([^/]+)\/reviews$/);
    if (reviewsGetMatch && request.method === 'GET') {
      try {
        const db = getDatabase(env);
        const rows = await db`SELECT pr.id, pr.rating, pr.body, pr.created_at, u.username, u.display_name FROM product_reviews pr JOIN users u ON u.id = pr.buyer_id WHERE pr.product_id::text = ${reviewsGetMatch[1]} ORDER BY pr.created_at DESC LIMIT 100`;
        const summary = await db`SELECT ROUND(AVG(rating)::numeric, 1) AS rating, COUNT(*)::int AS count FROM product_reviews WHERE product_id::text = ${reviewsGetMatch[1]}`;
        return json({ items: rows, summary: summary[0] });
      } catch (error) {
        console.error('SOKORA reviews lookup failed:', error?.message || 'unknown error');
        return json({ error: 'REVIEWS_UNAVAILABLE' }, 503);
      }
    }

    const livePinMatch = url.pathname.match(/^\/api\/live\/([^/]+)\/pin$/);
    if (livePinMatch && request.method === 'POST') {
      const auth = await authenticatedUser(request, env);
      if (auth.error) return json({ error: auth.error }, auth.status);
      let body;
      try { body = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
      const productId = String(body.productId || '');
      if (!/^\d+$/.test(productId)) return json({ error: 'INVALID_PRODUCT_ID' }, 400);
      try {
        const db = getDatabase(env);
        const sessions = await db`SELECT id, seller_id, status FROM live_sessions WHERE id::text = ${livePinMatch[1]} LIMIT 1`;
        if (!sessions.length || String(sessions[0].seller_id) !== String(auth.user.id)) return json({ error: 'LIVE_SESSION_NOT_FOUND' }, 404);
        if (sessions[0].status !== 'LIVE') return json({ error: 'LIVE_SESSION_NOT_ACTIVE' }, 409);
        const products = await db`SELECT id FROM products WHERE id::text = ${productId} AND seller_id = ${auth.user.id} AND status = 'ACTIVE' LIMIT 1`;
        if (!products.length) return json({ error: 'PRODUCT_NOT_FOUND_OR_NOT_OWNED' }, 404);
        await db`INSERT INTO live_session_products (live_session_id, product_id, pinned_by) VALUES (${sessions[0].id}, ${products[0].id}, ${auth.user.id}) ON CONFLICT (live_session_id, product_id) DO UPDATE SET pinned_by = EXCLUDED.pinned_by, pinned_at = NOW()`;
        return json({ pinned: true, liveSessionId: sessions[0].id, productId: products[0].id });
      } catch (error) {
        console.error('SOKORA live product pin failed:', error?.message || 'unknown error');
        return json({ error: 'LIVE_PRODUCT_PIN_FAILED' }, 503);
      }
    }
    const livePinnedMatch = url.pathname.match(/^\/api\/live\/([^/]+)\/pinned-product$/);
    if (livePinnedMatch && request.method === 'GET') {
      try {
        const db = getDatabase(env);
        const rows = await db`SELECT p.id, p.name, p.price_tzs, p.currency, p.image_url, p.category, p.location, lsp.pinned_at, u.username AS seller_username FROM live_session_products lsp JOIN products p ON p.id = lsp.product_id JOIN live_sessions ls ON ls.id = lsp.live_session_id JOIN users u ON u.id = p.seller_id WHERE ls.id::text = ${livePinnedMatch[1]} AND ls.status = 'LIVE' AND p.status = 'ACTIVE' ORDER BY lsp.pinned_at DESC LIMIT 1`;
        return json({ product: rows[0] || null });
      } catch (error) {
        console.error('SOKORA live pinned product lookup failed:', error?.message || 'unknown error');
        return json({ error: 'LIVE_PRODUCT_UNAVAILABLE' }, 503);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
