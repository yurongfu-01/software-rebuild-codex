import { isDeepStrictEqual } from 'node:util';
import { McpClient } from '../mcp-client.mjs';
import { requireThat } from '../errors.mjs';

export class ReaAdapter {
  constructor(config) { this.config = config; this.client = null; this.server = null; this.idle = null; }
  async withClient(fn) {
    requireThat(this.config?.command, 'UNAVAILABLE', 'Configure rea.command and rea.args for a locally installed REA MCP');
    if (this.config.keepAlive) {
      clearTimeout(this.idle);
      try {
        if (!this.client) { this.client = new McpClient(this.config); this.server = await this.client.connect(); }
        const result = await fn(this.client, this.server);
        this.idle = setTimeout(() => { void this.close(); }, this.config.idleMs || 60000); this.idle.unref();
        return result;
      } catch (e) { await this.close(); throw e; }
    }
    const client = new McpClient(this.config);
    try { const server = await client.connect(); return await fn(client, server); } finally { await client.close(); }
  }
  async close() { clearTimeout(this.idle); const client = this.client; this.client = null; this.server = null; if (client) await client.close(); }
  async discover() {
    return this.withClient(async (client, server) => {
      const tools = []; let cursor;
      for (let page = 0; page < 20; page++) {
        const result = await client.request('tools/list', cursor ? { cursor } : {});
        requireThat(Array.isArray(result?.tools), 'PROTOCOL', 'REA tools/list returned invalid data'); tools.push(...result.tools);
        if (!result.nextCursor) return { server: server.serverInfo, tools };
        cursor = result.nextCursor;
      }
      requireThat(false, 'LIMIT', 'REA tools pagination exceeded limit');
    });
  }
  async call(tool, args) {
    const grant = (this.config?.grants || []).find(g => g.tool === tool && Date.parse(g.expiresAt) > Date.now() && isDeepStrictEqual(g.arguments, args));
    requireThat(grant, 'SCOPE', 'No unexpired host-configured grant for exact REA tool and arguments');
    return this.withClient(async client => {
      const tools = await client.request('tools/list');
      requireThat(tools?.tools?.some(t => t.name === tool), 'PROTOCOL', 'Granted REA tool not present on first discovery page; refresh configuration');
      const result = await client.request('tools/call', { name: tool, arguments: args });
      requireThat(!result?.isError, 'UPSTREAM', 'REA tool returned an error'); return result;
    });
  }
}
