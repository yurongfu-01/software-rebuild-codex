export class RebuildError extends Error {
  constructor(code, detail) { super(`${code}: ${detail}`); this.code = code; }
}
export function requireThat(ok, code, detail) { if (!ok) throw new RebuildError(code, detail); }
export function text(value, label, max = 10000) {
  requireThat(typeof value === 'string' && value.trim().length > 0 && value.length <= max && !value.includes('\0'), 'INPUT', `Invalid ${label}`);
  return value;
}
