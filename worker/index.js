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
      if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) return json({ error: 'AUTH_NOT_CONFIGURED' }, 503);
      let body;
      try { body = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
      const email = String(body.email || '').trim().toLowerCase() || null;