import fs from 'node:fs/promises';
import path from 'node:path';
import { requireThat, RebuildError } from './errors.mjs';

export async function loadConfig() {
  const file = process.env.REBUILD_CONFIG;
  if (!file) return { readRoots: [], writeRoots: [] };
  requireThat(path.isAbsolute(file), 'INPUT', 'REBUILD_CONFIG must be an absolute path');
  requireThat((await fs.stat(file)).size <= 1024 * 1024, 'LIMIT', 'Configuration too large');
  let c; try { c = JSON.parse(await fs.readFile(file, 'utf8')); } catch { throw new RebuildError('INPUT', 'Configuration must be valid JSON'); }
  requireThat(c && typeof c === 'object' && !Array.isArray(c), 'INPUT', 'Configuration object required');
  for (const key of ['readRoots', 'writeRoots']) requireThat(Array.isArray(c[key]) && c[key].every(x => typeof x === 'string' && path.isAbsolute(x)), 'INPUT', `Configure absolute ${key}`);
  if (c.caseRoot) requireThat(path.isAbsolute(c.caseRoot), 'INPUT', 'caseRoot must be absolute');
  return c;
}
export function configuredSecrets(config) {
  const names = Object.keys(process.env).filter(k => /(?:TOKEN|SECRET|PASSWORD|API_KEY)$/.test(k));
  if (config.pentagi?.tokenEnv) names.push(config.pentagi.tokenEnv);
  return [...new Set(names.map(k => process.env[k]).filter(x => x && x.length >= 4))];
}
