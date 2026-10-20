import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import { runProcess } from '../src/process.mjs';
import { McpClient } from '../src/mcp-client.mjs';
const peer = path.resolve('test/fixtures/mcp-peer.mjs');
test('process passes shell metacharacters literally', async () => {
  const value = '; echo bad $(whoami) & | < >';
  const result = await runProcess(process.execPath, ['-e', 'console.log(process.argv[1])', value]);
  assert.equal(result.stdout.trim(), value);
});
test('process bounds execution time and output size', async () => {
  await assert.rejects(runProcess(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { timeoutMs: 100 }), /TIMEOUT/);
  await assert.rejects(runProcess(process.execPath, ['-e', 'console.log("x".repeat(5000))'], { maxBytes: 1000 }), /LIMIT/);
  await assert.rejects(runProcess(process.execPath, ['-e', 'process.exit(4)']), /PROCESS/);
});
test('MCP client initializes and handles fragmented frames and remote errors', async t => {
  const client = new McpClient({ command: process.execPath, args: [peer, 'fragment'] }); t.after(() => client.close());
  const hello = await client.connect(); assert.equal(hello.serverInfo.name, 'test-peer');
  assert.equal((await client.request('tools/list')).tools[0].name, 'inspect_fixture');
  await assert.rejects(client.request('unknown'), /UPSTREAM/);
});
test('MCP client rejects timeout, early exit and oversized unterminated frames', async () => {
  for (const [mode, error] of [['hang', /TIMEOUT/], ['exit', /PROCESS/], ['oversize', /LIMIT/]]) {
    const c = new McpClient({ command: process.execPath, args: [peer, mode], timeoutMs: mode === 'hang' ? 300 : 10000, maxBytes: 1000 });
    try { await assert.rejects(c.connect(), error); } finally { await c.close(); }
  }
});

test('MCP malformed null and missing-result frames reject without crashing the host', async () => {
  for (const mode of ['null', 'no-result']) {
    const c = new McpClient({ command: process.execPath, args: [peer, mode] });
    try { await assert.rejects(c.connect(), /PROTOCOL/); } finally { await c.close(); }
  }
});

test('MCP response limit applies per frame rather than accumulating normal session traffic', async t => {
  const client = new McpClient({ command: process.execPath, args: [peer], maxBytes: 1000 }); t.after(() => client.close());
  await client.connect();
  for (let i = 0; i < 8; i++) assert.equal((await client.request('tools/list')).tools[0].name, 'inspect_fixture');
});

test('process cleanup kills descendants after the actual target exits', async t => {
  const root = path.resolve('.work'); await fs.mkdir(root, { recursive: true });
  const marker = path.join(root, `orphan-${Date.now()}.txt`); t.after(() => fs.rm(marker, { force: true }));
  const childCode = `setTimeout(()=>require('fs').writeFileSync(${JSON.stringify(marker)},'escaped'),1800)`;
  const parentCode = `require('child_process').spawn(process.execPath,['-e',${JSON.stringify(childCode)}],{stdio:'ignore',detached:${process.platform === 'win32'}}).unref()`;
  await runProcess(process.execPath, ['-e', parentCode]);
  await new Promise(resolve => setTimeout(resolve, 2200));
  await assert.rejects(fs.access(marker), e => e.code === 'ENOENT');
});
