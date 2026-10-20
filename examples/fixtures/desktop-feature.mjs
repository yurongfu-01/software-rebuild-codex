// Self-owned reference feature, not extracted from any third-party product.
export function normalizeName(value) {
  if (typeof value !== 'string' || /[^\x20-\x7e]/.test(value)) throw new Error('ASCII printable string required');
  return value.trim().toLowerCase().replace(/ +/g, '-');
}
