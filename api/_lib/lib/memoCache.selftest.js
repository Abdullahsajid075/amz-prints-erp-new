const assert = require('assert');
const { cachedRead, clearCache } = require('./memoCache');

async function run() {
  // Fresh value is cached and reused within the TTL window.
  let calls = 0;
  const load = async () => { calls += 1; return { n: calls }; };
  const a = await cachedRead('k1', load, 50);
  const b = await cachedRead('k1', load, 50);
  assert.strictEqual(calls, 1, 'loader should run once while cache is fresh');
  assert.strictEqual(a, b, 'second call should return the same cached value');

  // Concurrent calls for the same key share one in-flight load, not two.
  clearCache('k1');
  calls = 0;
  let resolveLoad;
  const slowLoad = () => new Promise((resolve) => {
    resolveLoad = () => { calls += 1; resolve({ n: calls }); };
  });
  const p1 = cachedRead('k1', slowLoad, 50);
  const p2 = cachedRead('k1', slowLoad, 50);
  await new Promise((r) => { setTimeout(r, 0); });
  resolveLoad();
  const [r1, r2] = await Promise.all([p1, p2]);
  assert.strictEqual(calls, 1, 'concurrent calls should share one in-flight load');
  assert.deepStrictEqual(r1, r2);

  // After the TTL expires, the loader runs again.
  clearCache('k1');
  calls = 0;
  await cachedRead('k1', load, 10);
  await new Promise((r) => { setTimeout(r, 25); });
  await cachedRead('k1', load, 10);
  assert.strictEqual(calls, 2, 'loader should re-run once the TTL has passed');

  // A rejected load is not cached — the next call retries.
  clearCache('k2');
  let attempts = 0;
  const flaky = async () => {
    attempts += 1;
    if (attempts === 1) throw new Error('boom');
    return 'ok';
  };
  await assert.rejects(cachedRead('k2', flaky, 1000));
  const ok = await cachedRead('k2', flaky, 1000);
  assert.strictEqual(ok, 'ok');
  assert.strictEqual(attempts, 2, 'a failed load should not be cached');

  // Different keys never collide.
  clearCache();
  await cachedRead('x', async () => 'x-value', 1000);
  await cachedRead('y', async () => 'y-value', 1000);
  assert.strictEqual(await cachedRead('x', async () => 'wrong', 1000), 'x-value');
  assert.strictEqual(await cachedRead('y', async () => 'wrong', 1000), 'y-value');

  console.log('memoCache ok');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
