import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
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
    const c = new McpClient({ command: process.execPath, args: [peer, mode], timeoutMs: 300, maxBytes: 1000 });
    try { await assert.rejects(c.connect(), error); } finally { await c.close(); }
  }
});
