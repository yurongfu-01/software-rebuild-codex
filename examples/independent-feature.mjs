// Written from the functional spec, without importing the reference implementation.
export function rebuildName(value) {
  if (typeof value !== 'string' || [...value].some(c => c.charCodeAt(0) < 32 || c.charCodeAt(0) > 126)) throw new Error('ASCII printable string required');
  return value.split(' ').filter(Boolean).map(word => word.toLowerCase()).join('-');
}
