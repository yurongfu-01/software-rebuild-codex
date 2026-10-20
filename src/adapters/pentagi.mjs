import https from 'node:https';
import fs from 'node:fs/promises';
import { requireThat, RebuildError } from '../errors.mjs';

export class PentagiAdapter {
  constructor(config) { this.config = config; }
  async flows() {
    let base; try { base = new URL(this.config?.baseUrl); } catch { throw new RebuildError('UNAVAILABLE', 'Configure pentagi.baseUrl'); }
    requireThat(base.protocol === 'https:' && !base.username && !base.password && !base.search && !base.hash && base.pathname === '/', 'SCOPE', 'PentAGI requires a trusted HTTPS origin without credentials or path');
    requireThat(typeof this.config.tokenEnv === 'string' && /^[A-Z_][A-Z0-9_]*$/.test(this.config.tokenEnv), 'AUTH', 'Configure a token environment variable name');
    const token = process.env[this.config.tokenEnv];
    requireThat(token && !/[\r\n]/.test(token), 'AUTH', 'PentAGI token environment variable is empty or invalid');
    const ca = this.config.caFile ? await fs.readFile(this.config.caFile) : undefined;
    return new Promise((resolve, reject) => {
      let size = 0; let output = ''; let done = false;
      const finish = (error, value) => { if (done) return; done = true; clearTimeout(timer); if (error) reject(error); else resolve(value); };
      const req = https.get(new URL('/api/v1/flows', base), { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, ca, rejectUnauthorized: true }, res => {
        if (res.statusCode !== 200) { const status = res.statusCode; res.destroy(); req.destroy(); finish(new RebuildError('UPSTREAM', `PentAGI returned HTTP ${status}; redirects are not followed`)); return; }
        res.setEncoding('utf8');
        res.on('data', value => {
          size += Buffer.byteLength(value);
          if (size > (this.config.maxBytes || 1024 * 1024)) { req.destroy(); finish(new RebuildError('LIMIT', 'PentAGI response too large')); return; }
          output += value;
        });
        res.on('end', () => {
          try {
            const data = JSON.parse(output);
            requireThat(data && typeof data === 'object', 'PROTOCOL', 'PentAGI returned invalid flow data');
            finish(null, { status: 'connected', source: 'pentagi-api', data, securityTest: 'not_run' });
          } catch { finish(new RebuildError('PROTOCOL', 'PentAGI response is not valid flow JSON')); }
        });
        res.on('error', () => finish(new RebuildError('UPSTREAM', 'PentAGI response interrupted')));
      });
      const timer = setTimeout(() => { req.destroy(); finish(new RebuildError('TIMEOUT', 'PentAGI request timed out')); }, this.config.timeoutMs || 15000);
      req.on('error', () => finish(new RebuildError('UNAVAILABLE', 'PentAGI HTTPS connection failed; verify service and certificate')));
    });
  }
  async start() { throw new RebuildError('ISOLATION', 'Autonomous PentAGI task launch is blocked in alpha: enforceable target isolation, budget control and verified stop integration are not implemented. Use your independently controlled PentAGI deployment.'); }
}
