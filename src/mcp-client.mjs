import { startProcess, terminateTree } from './process.mjs';
import { RebuildError, requireThat } from './errors.mjs';
import { VERSION } from './version.mjs';

export class McpClient {
  constructor(config) { this.config = config; this.pending = new Map(); this.nextId = 1; this.buffer = ''; this.bytes = 0; this.closed = false; }
  async connect() {
    requireThat(!this.child, 'INPUT', 'Client already connected');
    this.child = startProcess(this.config.command, this.config.args || [], this.config);
    this.child.stdout.setEncoding('utf8');
    this.child.stdout.on('data', data => this.receive(data));
    this.child.stderr.on('data', data => {
      this.bytes += data.length;
      if (this.bytes > (this.config.maxBytes || 1024 * 1024)) void this.fail(new RebuildError('LIMIT', 'MCP output exceeded limit'));
    });
    this.child.on('error', () => this.fail(new RebuildError('UNAVAILABLE', 'MCP executable unavailable')));
    this.child.on('close', () => this.fail(new RebuildError('PROCESS', 'MCP process closed')));
    this.child.stdin.on('error', () => this.fail(new RebuildError('PROCESS', 'MCP input closed')));
    const hello = await this.request('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'software-rebuild-codex', version: VERSION } });
    requireThat(['2024-11-05', '2025-03-26', '2025-06-18', '2025-11-25'].includes(hello?.protocolVersion) && hello?.serverInfo, 'PROTOCOL', 'Unsupported MCP initialize response');
    this.notify('notifications/initialized'); return hello;
  }
  receive(data) {
    this.buffer += data;
    let index;
    while ((index = this.buffer.indexOf('\n')) >= 0) {
      const line = this.buffer.slice(0, index).trim(); this.buffer = this.buffer.slice(index + 1);
      if (Buffer.byteLength(line) > (this.config.maxBytes || 1024 * 1024)) { void this.fail(new RebuildError('LIMIT', 'MCP frame exceeded limit')); return; }
      if (!line) continue;
      let m; try { m = JSON.parse(line); } catch { void this.fail(new RebuildError('PROTOCOL', 'Invalid MCP JSON')); return; }
      if (!m || typeof m !== 'object' || Array.isArray(m) || m.jsonrpc !== '2.0') { void this.fail(new RebuildError('PROTOCOL', 'Invalid MCP frame')); return; }
      if (m.method) {
        if (m.id !== undefined) this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: m.id, ...(m.method === 'ping' ? { result: {} } : { error: { code: -32601, message: 'Client capability not supported' } }) }) + '\n');
        continue;
      }
      const p = this.pending.get(m.id); if (!p) continue;
      if (Object.hasOwn(m, 'error') === Object.hasOwn(m, 'result') || (Object.hasOwn(m, 'error') && (!m.error || typeof m.error !== 'object'))) { void this.fail(new RebuildError('PROTOCOL', 'Invalid MCP response envelope')); return; }
      this.pending.delete(m.id); clearTimeout(p.timer);
      if (m.error) p.reject(new RebuildError('UPSTREAM', 'MCP request returned an error')); else p.resolve(m.result);
    }
    if (Buffer.byteLength(this.buffer) > (this.config.maxBytes || 1024 * 1024)) void this.fail(new RebuildError('LIMIT', 'MCP unterminated frame exceeded limit'));
  }
  notify(method, params) { if (!this.closed) this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, ...(params ? { params } : {}) }) + '\n'); }
  request(method, params = {}) {
    if (this.closed) return Promise.reject(new RebuildError('PROCESS', 'MCP connection is closed'));
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      const timer = setTimeout(() => this.fail(new RebuildError('TIMEOUT', 'MCP request exceeded time limit; tool completion may be uncertain')), this.config.timeoutMs || 30000);
      this.pending.set(id, { resolve, reject, timer });
      this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
  }
  async fail(error) {
    if (this.closed) return this.termination;
    this.closed = true;
    for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(error); } this.pending.clear();
    this.termination = terminateTree(this.child); await this.termination;
  }
  async close() { await this.fail(new RebuildError('CANCELLED', 'MCP client closed')); }
}
