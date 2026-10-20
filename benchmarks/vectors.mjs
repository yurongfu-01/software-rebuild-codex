export const crcVectors = [
  { name: 'empty', bytes: [] }, { name: 'standard ASCII', bytes: [...Buffer.from('123456789')] },
  { name: 'zero byte', bytes: [0] }, { name: 'binary all values', bytes: Array.from({ length: 256 }, (_, i) => i) },
  { name: 'UTF8 payload', bytes: [...Buffer.from('软件\u0000复刻😀')] },
  { name: 'seed zero', bytes: [1, 2, 255], seed: 0 },
  { name: 'empty custom seed', bytes: [], seed: 0x12345678 },
  { name: 'custom polynomial', bytes: [1, 2, 255], seed: 0, polynomial: 0x82f63b78 },
  { name: 'offset zero partial', bytes: [1, 2, 3, 4, 5], start: 0, length: 3 },
  { name: 'upstream nonzero offset truncation', bytes: [1, 2, 3, 4, 5], start: 1, length: 3 },
  { name: 'upstream offset beyond length hashes nothing', bytes: [1, 2, 3, 4, 5], start: 3, length: 2 },
  { name: 'zero length', bytes: [1, 2, 3], start: 2, length: 0 },
  { name: 'null input error', bytes: null }
];
export const names = ['file2', 'file10', 'file1', 'file01', 'file001', 'A2', 'a1', 'z', '', null, '   ', '\t', 'file0', 'file00', 'file000', 'file9999999999999999999999999999999999', 'file10000000000000000000000000000000000', 'x２', 'x2', 'Ä2', 'ä2', 'a', 'a0', 'a.2', 'a-2', '😀2'];
export const pairs = names.flatMap(a => names.map(b => [a, b]));
// One sequence tests state transitions; results include callback payloads and snapshots.
export function todoScenario(model) {
  const results = [];
  const call = (name, method, ...args) => {
    let output; try { model[method](...args, x => { output = x; }); results.push({ name, actual: output }); }
    catch (error) { results.push({ name, actual: { error: error.name } }); }
  };
  call('empty counters', 'getCount');
  call('trim title', 'create', '  learn  '); call('unicode title', 'create', ' 学习😀 ');
  call('whitespace title allowed by model', 'create', '  '); call('omitted title fallback', 'create', null);
  call('all rows', 'read', {}); call('read numeric ID', 'read', 1); call('parseInt suffix', 'read', '1suffix');
  call('invalid ID string', 'read', 'invalid'); call('complete first', 'update', 1, { completed: true });
  call('truthy completed counter', 'update', 2, { completed: 'yes' }); call('updated counters', 'getCount');
  call('strict true filter', 'read', { completed: true }); call('numeric filter does not coerce', 'read', { completed: 1 });
  call('missing property undefined matches all', 'read', { missing: undefined });
  call('update unknown ID', 'update', 99, { title: 'unused' }); call('zero ID creates', 'update', 0, { title: 'zero', completed: false });
  call('string update ID is strict', 'update', '1', { title: 'unused' });
  call('remove string ID is strict', 'remove', '1'); call('remove actual ID', 'remove', 1); call('remove missing ID', 'remove', 999);
  call('clear', 'removeAll'); call('ID does not reset', 'create', 'again'); call('final count', 'getCount');
  call('non-string title error', 'create', 42);
  return results;
}
