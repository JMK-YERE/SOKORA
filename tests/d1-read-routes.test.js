import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

function makeD1({ all = [], first = null, fail = false } = {}) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      calls.push({ sql, values: [] });
      const call = calls[calls.length - 1];
      return {
        bind(...values) {
          call.values = values;
          return {
            async all() {
              if (fail) throw new Error('simulated D1 failure');
              return { results: all };
            },
            async first() {
              if (fail) throw new Error('simulated D1 failure');
              return first;
            },
          };
        },
      };
    },
  };
}

async function invoke(path, db, flag = 'true') {
  return worker.fetch(
    new Request('https://sokora.test' + path),
    { SOKORA_DB: db, SOKORA_D1_READS: flag },
    {}
  );
}

test('D1 feed route returns the expected JSON envelope', async () => {
  const db = makeD1({ all: [{ video_id: 7, caption: 'Bidhaa' }] });
  const response = await invoke('/api/feed?limit=5', db);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    items: [{ video_id: 7, caption: 'Bidhaa' }],
    nextCursor: null,
  });
  assert.match(db.calls[0].sql, /FROM videos v JOIN products p/);
  assert.equal(db.calls[0].values.at(-1), 5);
});

test('D1 products route clamps limit and returns count', async () => {
  const db = makeD1({ all: [{ id: 12, name: 'Simu' }] });
  const response = await invoke('/api/products?limit=999&q=simu', db);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    items: [{ id: 12, name: 'Simu' }],
    count: 1,
    limit: 50,
  });
  assert.equal(db.calls[0].values.at(-1), 50);
});

test('D1 product detail returns 404 when product does not exist', async () => {
  const db = makeD1({ first: null });
  const response = await invoke('/api/products/999', db);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'PRODUCT_NOT_FOUND' });
});

test('D1 read failure returns a controlled 503 response', async () => {
  const db = makeD1({ fail: true });
  const response = await invoke('/api/products/999/reviews', db);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'REVIEWS_UNAVAILABLE' });
});

test('D1 reads remain opt-in when the feature flag is off', async () => {
  const db = makeD1({ all: [{ id: 1 }] });
  const response = await invoke('/api/products', db, 'false');
  assert.equal(db.calls.length, 0);
  // Without D1 reads, the legacy Neon route responds with a controlled DB error
  // in this isolated test environment (no Hyperdrive binding is supplied).
  assert.equal(response.status, 503);
});


test('D1 health endpoint reports binding and table count', async () => {
  const db = makeD1({ first: { table_count: 18 } });
  const response = await invoke('/api/health/d1', db, 'false');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    service: 'sokora-api',
    database: 'd1_connected',
    tables: 18,
    migration: 'foundation',
  });
});

test('D1 health endpoint fails closed when binding is missing', async () => {
  const response = await worker.fetch(
    new Request('https://sokora.test/api/health/d1'),
    {},
    {}
  );
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    ok: false,
    service: 'sokora-api',
    database: 'd1_binding_missing',
  });
});
