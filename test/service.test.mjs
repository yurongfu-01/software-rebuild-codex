import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Service } from '../src/service.mjs';
import { McpClient } from '../src/mcp-client.mjs';
import { runProcess } from '../src/process.mjs';

test('service enforces host-configured scope and rejects extra tool arguments', async t => {
  const temp = path.resolve('.work'); await fs.mkdir(temp, { recursive: true });
  const root = await fs.mkdtemp(path.join(temp, 'service-')); t.after(() => fs.rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'self-owned.apk'); await fs.writeFile(file, 'fixture');
  const config = { caseRoot: path.join(root, 'cases'), readRoots: [root], writeRoots: [root] };
  const svc = new Service(config);
  await assert.rejects(svc.dispatch('case_create', { platform: 'android', target: file, feature: 'test', authorization: 'own', readRoots: [root], writeRoots: [], networkTargets: [], expiresAt: '2099-01-01T00:00:00Z', surprise: true }), /INPUT/);
  const c = await svc.dispatch('case_create', { platform: 'android', target: file, feature: 'understand string normalization', authorization: 'own fixture', readRoots: [root], writeRoots: [], networkTargets: [], expiresAt: '2099-01-01T00:00:00Z' });
  await svc.dispatch('case_advance', { caseId: c.id, stage: 'scoped' });
  const route = await svc.dispatch('route', { caseId: c.id });
  assert.equal(route.platform, 'android'); assert.equal(route.upstreamExecuted, false);
  assert.ok(route.recommendedTools.includes('jadx'));
  await assert.rejects(svc.dispatch('rea_call', { caseId: c.id, tool: 'shell', arguments: {} }), /SCOPE/);
  await assert.rejects(svc.dispatch('unknown', {}), /INPUT/);
});

test('CLI prints structured diagnostics and exits nonzero for invalid requests', async () => {
  const cli = path.resolve('bin/software-rebuild.mjs');
  const r = await runProcess(process.execPath, [cli, 'doctor']); const result = JSON.parse(r.stdout);
  assert.equal(result.node.available, true); assert.equal(result.activePentagi, 'blocked');
  await assert.rejects(runProcess(process.execPath, [cli, 'not_a_tool']), /PROCESS/);
});

test('real MCP server exposes tools and rejects unknown or malformed calls', async t => {
  const c = new McpClient({ command: process.execPath, args: [path.resolve('bin/software-rebuild.mjs'), 'serve'] }); t.after(() => c.close());
  const hello = await c.connect(); assert.equal(hello.serverInfo.name, 'software-rebuild-codex');
  const tools = (await c.request('tools/list')).tools; assert.ok(tools.some(x => x.name === 'case_create'));
  const result = await c.request('tools/call', { name: 'doctor', arguments: {} });
  assert.equal(JSON.parse(result.content[0].text).activePentagi, 'blocked');
  const bad = await c.request('tools/call', { name: 'case_read', arguments: { caseId: '../x' } }); assert.equal(bad.isError, true);
  assert.match(JSON.parse(bad.content[0].text).message, /REBUILD_CONFIG/);
  await assert.rejects(c.request('not_supported'), /UPSTREAM/);
});
