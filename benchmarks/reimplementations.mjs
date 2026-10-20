// Independently authored from the documented behavior contract. No upstream source is embedded.
export function crc32({ bytes, seed = 0xffffffff, polynomial = 0xedb88320, start = 0, length = bytes?.length }) {
  if (bytes === null) return { error: 'NullReferenceException' };
  let value = seed >>> 0;
  // Pinned ShareX's offset API uses length as an end index; preserve that behavior.
  for (let i = start; i < length; i++) {
    value ^= bytes[i];
    for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ ((value & 1) ? polynomial : 0);
  }
  return (~value) >>> 0;
}

const javaBlank = s => s === null || s.replace(/^[\x00-\x20]+|[\x00-\x20]+$/g, '') === '';
const simpleCase = (s, upper) => [...s].map(c => {
  const changed = upper ? c.toUpperCase() : c.toLowerCase();
  // Java Character's simple mapping does not expand characters such as sharp s.
  return changed.length === 1 ? changed : c;
}).join('');
function regionOrder(a, b, insensitive) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    let x = a[i], y = b[i];
    if (insensitive) {
      x = simpleCase(x, true); y = simpleCase(y, true);
      if (x !== y) { x = simpleCase(x, false); y = simpleCase(y, false); }
    }
    if (x !== y) return x.charCodeAt(0) - y.charCodeAt(0);
  }
  return a.length - b.length;
}
export function naturalCompare(a, b) {
  const emptyA = javaBlank(a), emptyB = javaBlank(b);
  if (emptyA || emptyB) return emptyA === emptyB ? 0 : emptyA ? 1 : -1;
  const chunksA = a.match(/[0-9]+|[^0-9]+/g), chunksB = b.match(/[0-9]+|[^0-9]+/g);
  for (let i = 0; i < Math.min(chunksA.length, chunksB.length); i++) {
    const x = chunksA[i], y = chunksB[i]; let order;
    if (/^[0-9]/.test(x) && /^[0-9]/.test(y)) {
      const p = x.replace(/^0+(?=.)/, ''), q = y.replace(/^0+(?=.)/, '');
      order = p.length - q.length || regionOrder(p, q, false) || x.length - y.length;
    } else order = regionOrder(x, y, true) || regionOrder(x, y, false);
    if (order) return order;
  }
  return Math.sign(a.length - b.length);
}

export function makeTodoModel() {
  let nextId = 1, rows = [];
  const copy = x => JSON.parse(JSON.stringify(x));
  const model = {
    create(title, cb = () => {}) { const row = { title: (title || '').trim(), completed: false, id: nextId++ }; rows.push(copy(row)); cb([row]); },
    read(query, cb = () => {}) {
      if (typeof query === 'function') { query(copy(rows)); return; }
      const criteria = ['number', 'string'].includes(typeof query) ? { id: parseInt(query, 10) } : query;
      cb(copy(rows.filter(row => Object.keys(criteria || {}).every(key => criteria[key] === row[key]))));
    },
    update(id, changes, cb = () => {}) {
      if (!id) { const row = { ...changes, id: nextId++ }; rows.push(copy(row)); cb([row]); return; }
      const row = rows.find(x => x.id === id); if (row) Object.assign(row, changes); rows = copy(rows); cb(copy(rows));
    },
    remove(id, cb) { const i = rows.findIndex(x => x.id === id); if (i >= 0) rows.splice(i, 1); if (!cb) throw new TypeError(); cb(copy(rows)); },
    removeAll(cb) { rows = []; if (!cb) throw new TypeError(); cb([]); },
    getCount(cb) { cb({ active: rows.filter(x => !x.completed).length, completed: rows.filter(x => x.completed).length, total: rows.length }); }
  };
  return model;
}
