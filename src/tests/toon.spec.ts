import test from 'node:test';
import assert from 'node:assert/strict';

async function loadToonModule() {
  return import('../utils/toon.js');
}

test('formatForLLM does not throw when TOON encoding fails on circular data', async () => {
  const { formatForLLM } = await loadToonModule();
  const circular: Record<string, unknown> = { name: 'loop' };
  circular.self = circular;

  const result = formatForLLM(circular);

  assert.equal(typeof result, 'string');
  assert.ok(result.length > 0);
});
