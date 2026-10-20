import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import https from 'node:https';
import fs from 'node:fs/promises';
import { runProcess } from '../src/process.mjs';
import { ReaAdapter } from '../src/adapters/rea.mjs';
import { ReverseSkillAdapter } from '../src/adapters/reverse-skill.mjs';
import { PentagiAdapter } from '../src/adapters/pentagi.mjs';

test('REA discovers schema and rejects missing or mismatched exact argument grants', async () => {
  const config = { command: process.execPath, args: [path.resolve('test/fixtures/mcp-peer.mjs')], grants: [{ tool: 'inspect_fixture', arguments: { path: 'owned-fixture' }, expiresAt: '2099-01-01T00:00:00Z' }] };
  const rea = new ReaAdapter(config);
  const discovered = await rea.discover(); assert.equal(discovered.tools[0].name, 'inspect_fixture');
  await assert.rejects(rea.call('inspect_fixture', { path: 'outside' }), /SCOPE/);
  await assert.rejects(rea.call('not_discovered', {}), /SCOPE/);
  const result = await rea.call('inspect_fixture', { path: 'owned-fixture' });
  assert.equal(JSON.parse(result.content[0].text).arguments.path, 'owned-fixture');
  await assert.rejects(new ReaAdapter({ ...config, grants: [] }).call('inspect_fixture', { path: 'owned-fixture' }), /SCOPE/);
});

test('REA keeps a case session across target selection and subsequent inspection', async t => {
  const rea = new ReaAdapter({ command: process.execPath, args: [path.resolve('test/fixtures/mcp-peer.mjs')], keepAlive: true, grants: [
    { tool: 'inspect_fixture', arguments: { set: 'selected-owned-target' }, expiresAt: '2099-01-01T00:00:00Z' },
    { tool: 'inspect_fixture', arguments: {}, expiresAt: '2099-01-01T00:00:00Z' }
  ] }); t.after(() => rea.close());
  await rea.call('inspect_fixture', { set: 'selected-owned-target' });
  const result = await rea.call('inspect_fixture', {});
  assert.equal(JSON.parse(result.content[0].text).selected, 'selected-owned-target');
});

test('reverse-skill diagnoses missing installation instead of simulating upstream execution', async () => {
  await assert.rejects(new ReverseSkillAdapter({ root: path.resolve('.work/nonexistent') }).route('analyze owned APK'), /UNAVAILABLE/);
});

test('PentAGI rejects insecure URL and missing tokens before sending requests', async () => {
  await assert.rejects(new PentagiAdapter({ baseUrl: 'http://localhost:8443', tokenEnv: 'REBUILD_NONEXISTENT_TOKEN' }).flows(), /SCOPE/);
  await assert.rejects(new PentagiAdapter({ baseUrl: 'https://localhost:8443', tokenEnv: 'REBUILD_NONEXISTENT_TOKEN' }).flows(), /AUTH/);
});

test('PentAGI never launches active autonomous scans in alpha', async () => {
  await assert.rejects(new PentagiAdapter({}).start({ target: 'https://example.test', authorized: true, isolation: true }), /ISOLATION/);
});

async function tlsServer(t, handler) {
  const temp = path.resolve('.work'); await fs.mkdir(temp, { recursive: true });
  const root = await fs.mkdtemp(path.join(temp, 'tls-')); t.after(() => fs.rm(root, { recursive: true, force: true }));
  let openssl = process.env.OPENSSL_PATH || 'openssl';
  if (process.platform === 'win32' && !process.env.OPENSSL_PATH) {
    const git = await runProcess('git', ['--exec-path']); openssl = path.resolve(git.stdout.trim(), '../../../usr/bin/openssl.exe');
  }
  const key = path.join(root, 'localhost.key'); const cert = path.join(root, 'localhost.crt');
  await runProcess(openssl, ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-days', '1', '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1']);
  const server = https.createServer({ key: await fs.readFile(key), cert: await fs.readFile(cert) }, handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const variable = `REBUILD_TEST_TOKEN_${Math.random().toString(16).slice(2).toUpperCase()}`;
  process.env[variable] = 'local-fixture-token'; t.after(() => { delete process.env[variable]; });
  return { baseUrl: `https://127.0.0.1:${server.address().port}`, tokenEnv: variable, caFile: cert };
}

test('PentAGI uses verified TLS, correct endpoint and token; connectivity is not a scan', async t => {
  const config = await tlsServer(t, (req, res) => {
    if (req.url !== '/api/v1/flows' || req.headers.authorization !== 'Bearer local-fixture-token') { res.writeHead(403); res.end(); return; }
    res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ flows: [{ id: '1', title: 'fixture', status: 'finished' }] }));
  });
  const result = await new PentagiAdapter(config).flows();
  assert.equal(result.data.flows[0].id, '1'); assert.equal(result.securityTest, 'not_run');
  await assert.rejects(new PentagiAdapter({ ...config, caFile: undefined }).flows(), /UNAVAILABLE/);
});

test('PentAGI refuses redirects and bounds response size and elapsed time', async t => {
  const redirect = await tlsServer(t, (_req, res) => { res.writeHead(302, { Location: 'https://example.test/collect-token' }); res.end(); });
  await assert.rejects(new PentagiAdapter(redirect).flows(), /HTTP 302/);
  const large = await tlsServer(t, (_req, res) => res.end('x'.repeat(5000)));
  await assert.rejects(new PentagiAdapter({ ...large, maxBytes: 1000 }).flows(), /LIMIT/);
  const slow = await tlsServer(t, () => {});
  await assert.rejects(new PentagiAdapter({ ...slow, timeoutMs: 100 }).flows(), /TIMEOUT/);
});

test('PentAGI closes an endless non-success response instead of draining it forever', async t => {
  let closed;
  const disconnected = new Promise(resolve => { closed = resolve; });
  const config = await tlsServer(t, (_req, res) => {
    res.writeHead(401); res.write('unauthorized');
    const timer = setInterval(() => res.write('x'.repeat(1000)), 15);
    res.on('close', () => { clearInterval(timer); closed(true); });
  });
  await assert.rejects(new PentagiAdapter(config).flows(), /HTTP 401/);
  const result = await Promise.race([disconnected, new Promise(resolve => setTimeout(() => resolve(false), 300))]);
  assert.equal(result, true);
});
