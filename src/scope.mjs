import fs from 'node:fs/promises';
import path from 'node:path';
import { requireThat, text } from './errors.mjs';

export async function canonical(candidate) {
  requireThat(typeof candidate === 'string' && path.isAbsolute(candidate) && !candidate.includes('\0'), 'INPUT', 'Absolute local path required');
  // Reject Windows device paths, UNC paths, alternate data streams and reserved names.
  if (process.platform === 'win32') {
    requireThat(!candidate.startsWith('\\\\') && !candidate.slice(2).includes(':') && !candidate.split(/[\\/]/).some(p => /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p) || /[. ]$/.test(p)), 'SCOPE', 'Unsupported Windows path');
  }
  let current = path.resolve(candidate); const missing = [];
  for (;;) {
    try { return path.join(await fs.realpath(current), ...missing.reverse()); }
    catch (e) {
      if (e.code !== 'ENOENT') throw e;
      // A dangling symlink must not be mistaken for a missing path.
      try { requireThat(!(await fs.lstat(current)).isSymbolicLink(), 'SCOPE', 'Dangling link'); }
      catch (x) { if (x.code !== 'ENOENT') throw x; }
      const parent = path.dirname(current); requireThat(parent !== current, 'SCOPE', 'No existing ancestor');
      missing.push(path.basename(current)); current = parent;
    }
  }
}
export async function inside(candidate, roots) {
  const real = await canonical(candidate);
  for (const root of roots) {
    const rel = path.relative(await canonical(root), real);
    if (rel === '' || (!rel.startsWith(`..${path.sep}`) && rel !== '..' && !path.isAbsolute(rel))) return true;
  }
  return false;
}
export function safeUrl(value) {
  let u; try { u = new URL(value); } catch { requireThat(false, 'INPUT', 'Invalid URL'); }
  requireThat(['https:', 'http:'].includes(u.protocol) && !u.username && !u.password && !u.hash, 'INPUT', 'HTTP(S) URL without credentials or fragment required');
  return u;
}
export async function validateScope(input, policy) {
  requireThat(input && typeof input === 'object', 'INPUT', 'Scope required');
  requireThat(['desktop', 'web', 'android'].includes(input.platform), 'INPUT', 'Unsupported platform');
  text(input.feature, 'feature'); text(input.authorization, 'authorization'); text(input.target, 'target');
  requireThat(Number.isFinite(Date.parse(input.expiresAt)) && Date.parse(input.expiresAt) > Date.now(), 'EXPIRED', 'Authorization expired or missing');
  const scope = { platform: input.platform, feature: input.feature, target: input.target, authorization: input.authorization, expiresAt: input.expiresAt };
  for (const key of ['readRoots', 'writeRoots']) {
    requireThat(Array.isArray(input[key]) && input[key].length <= 32, 'INPUT', `${key} required`);
    scope[key] = [];
    for (const root of input[key]) {
      requireThat(await inside(root, policy[key] || []), 'SCOPE', `${key} exceeds host policy`);
      requireThat((await fs.stat(root)).isDirectory(), 'SCOPE', 'Scope root must exist');
      scope[key].push(await canonical(root));
    }
  }
  requireThat(Array.isArray(input.networkTargets) && input.networkTargets.length <= 32, 'INPUT', 'networkTargets required');
  scope.networkTargets = input.networkTargets.map(x => safeUrl(x).origin);
  if (scope.platform === 'web') {
    requireThat(scope.networkTargets.includes(safeUrl(scope.target).origin), 'SCOPE', 'Web target outside network scope');
  } else {
    requireThat(await inside(scope.target, scope.readRoots), 'SCOPE', 'Target outside read roots');
    requireThat((await fs.stat(scope.target)).isFile(), 'SCOPE', 'Local target must be a file');
    scope.target = await canonical(scope.target);
  }
  return scope;
}
export function redact(value, secrets = []) {
  if (Array.isArray(value)) return value.map(x => redact(x, secrets));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, /password|secret|token|api.?key|authorization/i.test(k) ? '[REDACTED]' : redact(v, secrets)]));
  if (typeof value !== 'string') return value;
  let result = value.replace(/Bearer\s+[^\s"'<>]+/gi, 'Bearer [REDACTED]').replace(/\b(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|sk-[A-Za-z0-9_-]{12,})\b/g, '[REDACTED]');
  for (const s of secrets) if (typeof s === 'string' && s.length >= 4) result = result.split(s).join('[REDACTED]');
  return result;
}
