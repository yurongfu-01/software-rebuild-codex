import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { renderProfiles, exportProfiles } from '../src/harness.mjs';
import { runProcess } from '../src/process.mjs';

async function setup(t) {
  await fs.mkdir('.work', { recursive: true });
  const root = await fs.mkdtemp(path.resolve('.work', 'harness spaces-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const hostConfig = path.join(root, 'operator config.json'); await fs.writeFile(hostConfig, '{}');
  return { root, options: { harness: 'all', pluginRoot: path.resolve('.'), hostConfig, outputRoot: path.join(root, 'generated profiles') } };
}

test('renders ten MCP hosts plus explicitly CLI-only Aider without flattening native shapes', async t => {
  const { options } = await setup(t); const profiles = await renderProfiles(options);
  assert.deepEqual(profiles.map(x => x.id).sort(), ['aider', 'claude-code', 'cline', 'codex', 'cursor', 'gemini-cli', 'hermes-agent', 'kiro', 'opencode', 'roo-code', 'windsurf'].sort());
  for (const id of ['claude-code', 'cursor', 'cline', 'roo-code', 'windsurf', 'gemini-cli', 'kiro']) {
    const p = profiles.find(x => x.id === id); const server = JSON.parse(p.files[p.configFile]).mcpServers.software_rebuild;
    assert.equal(server.command, process.execPath);
    assert.deepEqual(server.args, [path.resolve('bin/software-rebuild.mjs'), 'serve']);
    assert.equal(server.env.REBUILD_CONFIG, options.hostConfig);
    assert.ok(!Object.hasOwn(server, 'autoApprove') && !Object.hasOwn(server, 'alwaysAllow') && !Object.hasOwn(server, 'trust'));
  }
  const open = profiles.find(x => x.id === 'opencode'); const entry = JSON.parse(open.files[open.configFile]).mcp.software_rebuild;
  assert.equal(entry.type, 'local'); assert.deepEqual(entry.command, [process.execPath, path.resolve('bin/software-rebuild.mjs'), 'serve']);
  assert.equal(entry.environment.REBUILD_CONFIG, options.hostConfig); assert.ok(!Object.hasOwn(entry, 'env'));
  const hermes = profiles.find(x => x.id === 'hermes-agent'); assert.equal(hermes.configFile, 'config.yaml'); assert.ok(hermes.files['config.yaml'].startsWith('mcp_servers:\n'));
  const codex = profiles.find(x => x.id === 'codex'); assert.equal(codex.configFile, '.codex/config.toml'); assert.ok(codex.files[codex.configFile].startsWith('[mcp_servers.software_rebuild]'));
  const aider = profiles.find(x => x.id === 'aider'); assert.equal(aider.transport, 'cli-only'); assert.equal(aider.configFile, null);
  assert.ok(!Object.values(aider.files).some(x => x.includes('"mcpServers"')));
});

test('exports complete skill resources and refuses to overwrite any existing destination', async t => {
  const { options } = await setup(t);
  const result = await exportProfiles(options); assert.equal(result.profiles.length, 11);
  for (const p of result.profiles) {
    if (p.skillFile) {
      const body = await fs.readFile(path.join(options.outputRoot, p.id, p.skillFile), 'utf8'); assert.ok(body.startsWith('---\nname: software-rebuild\n'));
      await fs.access(path.join(options.outputRoot, p.id, path.dirname(p.skillFile), 'references', 'workflow.md'));
    }
  }
  const sentinel = path.join(options.outputRoot, 'keep.txt'); await fs.writeFile(sentinel, 'operator file');
  await assert.rejects(exportProfiles(options), /EXISTS/); assert.equal(await fs.readFile(sentinel, 'utf8'), 'operator file');
});

test('invalid exports create no directories or unrelated host configuration', async t => {
  const { options } = await setup(t);
  for (const changes of [{ harness: 'unknown' }, { pluginRoot: 'relative' }, { hostConfig: 'relative' }, { hostConfig: path.join(path.dirname(options.hostConfig), 'missing.json') }, { outputRoot: path.resolve('.') }, { surprise: 'do-not-export-me' }]) {
    await assert.rejects(exportProfiles({ ...options, ...changes }));
    await assert.rejects(fs.access(options.outputRoot), e => e.code === 'ENOENT');
  }
});

test('CLI export works independently of runtime policy and reports only generated artifacts', async t => {
  const { root, options } = await setup(t);
  const file = path.join(root, 'request.json'); await fs.writeFile(file, JSON.stringify({ ...options, harness: 'hermes-agent' }));
  const result = await runProcess(process.execPath, [path.resolve('bin/software-rebuild.mjs'), 'harness_export', file], { env: { ...process.env, REBUILD_CONFIG: path.join(root, 'intentionally missing runtime config.json') } });
  const parsed = JSON.parse(result.stdout); assert.equal(parsed.profiles[0].id, 'hermes-agent'); assert.equal(parsed.installed, false);
  await fs.access(path.join(options.outputRoot, 'hermes-agent', 'config.yaml'));
});
