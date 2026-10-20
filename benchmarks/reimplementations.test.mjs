import test from 'node:test';
import assert from 'node:assert/strict';
import { crc32, naturalCompare, makeTodoModel } from './reimplementations.mjs';

test('independent CRC reproduces standard and pinned offset behavior', () => {
  assert.equal(crc32({ bytes: [...Buffer.from('123456789')] }), 0xcbf43926);
  assert.equal(crc32({ bytes: [1, 2, 3], start: 2, length: 1 }), 0);
});
test('natural comparison keeps numeric padding, chunk case and blank boundaries', () => {
  assert.ok(naturalCompare('file2', 'file10') < 0);
  assert.ok(naturalCompare('file1', 'file01') < 0);
  assert.ok(naturalCompare('A2', 'a1') < 0);
  assert.equal(naturalCompare(null, ' '), 0);
});
test('todo lifecycle uses global IDs and preserves empty titles', () => {
  const model = makeTodoModel(); let first;
  model.create('  ', x => { first = x; });
  assert.deepEqual(first, [{ title: '', completed: false, id: 1 }]);
  model.removeAll(() => {}); model.create('again', x => assert.equal(x[0].id, 2));
});
