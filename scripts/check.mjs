import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

async function files(dir) {
  const result = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name); if (e.isDirectory()) result.push(...await files(p)); else result.push(p);
  }
  return result;
}
const modules = (await Promise.all(['src', 'bin', 'scripts', 'examples', 'test', 'benchmarks'].map(files))).flat().filter(p => p.endsWith('.mjs'));
for (const file of modules) {
  const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8', windowsHide: true });
  if (r.status !== 0) throw new Error(`Syntax check failed: ${file}\n${r.stderr || r.error}`);
}
const manifest = JSON.parse(await fs.readFile('.codex-plugin/plugin.json', 'utf8'));
const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));
assert.equal(manifest.version, pkg.version); assert.equal(manifest.license, 'MIT');
for (const key of ['skills', 'mcpServers']) { const p = manifest[key]; assert.ok(p.startsWith('./') && !p.split('/').includes('..')); await fs.access(p); }
const wiring = JSON.parse(await fs.readFile('.mcp.json', 'utf8')).mcpServers.software_rebuild;
assert.equal(wiring.type, 'stdio');
const script = wiring.args[0].replace('${PLUGIN_ROOT}/', ''); await fs.access(script);
for (const file of ['README.md', 'README.zh-CN.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md']) await fs.access(file);
console.log(`Checked ${modules.length} JavaScript modules, plugin paths, MCP entrypoint, version and distribution files.`);
