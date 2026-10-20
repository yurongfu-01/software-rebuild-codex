import fs from 'node:fs/promises';
import { CaseStore } from './cases.mjs';
import { ReaAdapter } from './adapters/rea.mjs';
import { ReverseSkillAdapter } from './adapters/reverse-skill.mjs';
import { PentagiAdapter } from './adapters/pentagi.mjs';
import { configuredSecrets } from './config.mjs';
import { requireThat } from './errors.mjs';
import { redact } from './scope.mjs';

const str = { type: 'string' }; const arr = { type: 'array', items: str }; const obj = { type: 'object' };
function tool(name, description, properties, required = Object.keys(properties), readOnly = false) {
  return { name, description, inputSchema: { type: 'object', properties, required, additionalProperties: false }, annotations: { readOnlyHint: readOnly, destructiveHint: false, openWorldHint: ['rea_call', 'pentagi_flows', 'route', 'rea_discover'].includes(name) } };
}
export const TOOLS = [
  tool('doctor', 'Inspect local configuration without installing tools or launching upstream services.', {}, [], true),
  tool('case_create', 'Create a scoped local software-understanding case. Scope cannot exceed host configuration.', { platform: { type: 'string', enum: ['desktop', 'web', 'android'] }, feature: str, target: str, readRoots: arr, writeRoots: arr, networkTargets: arr, authorization: str, expiresAt: str }),
  tool('case_read', 'Read the current scoped case; expired authorizations are rejected.', { caseId: str }, undefined, true),
  tool('case_evidence', 'Save operator-supplied evidence, with hash and provenance. Does not certify truth.', { caseId: str, kind: { type: 'string', enum: ['analysis', 'specification', 'implementation', 'verification'] }, content: str, source: str, classification: { type: 'string', enum: ['fact', 'inference'] }, tool: str, toolVersion: str }, ['caseId', 'kind', 'content', 'source', 'classification']),
  tool('case_advance', 'Advance exactly one stage with substantive evidence. Verified means reported checks passed, not independent certification.', { caseId: str, stage: { type: 'string', enum: ['scoped', 'routed', 'analyzed', 'specified', 'rebuilt', 'verified'] }, artifact: obj }, ['caseId', 'stage']),
  tool('case_report', 'Read a hash-checked case report, distinguishing reported verification and unrun security scans.', { caseId: str }, undefined, true),
  tool('route', 'Run configured reverse-skill router; otherwise return clearly labeled built-in preparation guidance.', { caseId: str }),
  tool('rea_discover', 'Start configured REA MCP and discover its actual tools. Does not analyze any target.', {}, [], true),
  tool('rea_call', 'Invoke one REA tool only with an unexpired exact-argument host grant bound to this case ID.', { caseId: str, tool: str, arguments: obj }),
  tool('pentagi_flows', 'Read existing PentAGI flows from the configured HTTPS service. Does not start a security test.', {}, [], true)
];

function matches(value, schema) {
  if (schema.enum && !schema.enum.includes(value)) return false;
  if (schema.type === 'string') return typeof value === 'string' && value.length <= 200000 && !value.includes('\0');
  if (schema.type === 'array') return Array.isArray(value) && value.length <= 100 && value.every(x => matches(x, schema.items));
  if (schema.type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  return false;
}
export class Service {
  constructor(config) {
    this.config = config; this.secrets = configuredSecrets(config); this.queue = Promise.resolve(); this.reaSessions = new Map();
    this.store = config.caseRoot ? new CaseStore(config.caseRoot, config, this.secrets) : null;
  }
  dispatch(name, args = {}) {
    const task = this.queue.then(async () => {
      const def = TOOLS.find(x => x.name === name); requireThat(def, 'INPUT', 'Unknown tool');
      requireThat(matches(args, { type: 'object' }) && Buffer.byteLength(JSON.stringify(args)) <= 300000, 'INPUT', 'Tool arguments must be a bounded object');
      const schema = def.inputSchema;
      requireThat(schema.required.every(k => Object.hasOwn(args, k)) && Object.entries(args).every(([k, v]) => Object.hasOwn(schema.properties, k) && matches(v, schema.properties[k])), 'INPUT', 'Missing, extra or invalid tool arguments');
      if (name === 'doctor') return this.doctor();
      if (name === 'rea_discover') return redact(await new ReaAdapter(this.config.rea).discover(), this.secrets);
      if (name === 'pentagi_flows') return redact(await new PentagiAdapter(this.config.pentagi).flows(), this.secrets);
      requireThat(this.store, 'UNAVAILABLE', 'Set REBUILD_CONFIG with caseRoot/readRoots/writeRoots before creating cases');
      const { caseId, ...input } = args;
      let result;
      if (name === 'case_create') result = await this.store.create(input);
      else if (name === 'case_read') result = await this.store.read(caseId);
      else if (name === 'case_evidence') result = await this.store.evidence(caseId, input);
      else if (name === 'case_advance') result = await this.store.advance(caseId, input.stage, input.artifact);
      else if (name === 'case_report') result = await this.store.report(caseId);
      else if (name === 'route') {
        const c = await this.store.read(caseId);
        const prep = { desktop: ['REA', 'Ghidra', 'ILSpy'], web: ['REA', 'browser-devtools', 'Playwright'], android: ['REA', 'jadx', 'adb'] }[c.scope.platform];
        if (this.config.reverseSkill?.root) result = { ...(await new ReverseSkillAdapter(this.config.reverseSkill).route(`${c.scope.platform}: ${c.scope.feature}; target: ${c.scope.target}`)), platform: c.scope.platform, upstreamExecuted: true, recommendedTools: prep };
        else result = { method: 'builtin-guidance', platform: c.scope.platform, upstreamExecuted: false, recommendedTools: prep, note: 'Configure reverseSkill to run the actual upstream router. This result is preparation guidance only.' };
      } else if (name === 'rea_call') {
        const c = await this.store.read(caseId);
        requireThat(c.stage !== 'initialized', 'SCOPE', 'Confirm case scope before tool execution');
        if (!this.reaSessions.has(caseId)) {
          if (this.reaSessions.size >= 8) { const [oldId, old] = this.reaSessions.entries().next().value; await old.close(); this.reaSessions.delete(oldId); }
          const config = { ...this.config.rea, keepAlive: true, grants: (this.config.rea?.grants || []).filter(g => g.caseId === caseId) };
          this.reaSessions.set(caseId, new ReaAdapter(config));
        }
        result = await this.reaSessions.get(caseId).call(input.tool, input.arguments);
      }
      return redact(result, this.secrets);
    });
    this.queue = task.catch(() => {}); return task;
  }
  async close() { await Promise.all([...this.reaSessions.values()].map(x => x.close())); this.reaSessions.clear(); }
  async doctor() {
    const exists = async p => { try { return Boolean(p && (await fs.stat(p))); } catch { return false; } };
    return { node: { available: true, version: process.version }, config: { configured: Boolean(this.config.caseRoot), caseRootExists: await exists(this.config.caseRoot), readRootCount: this.config.readRoots?.length || 0, writeRootCount: this.config.writeRoots?.length || 0 }, rea: { configured: Boolean(this.config.rea?.command), runtime: 'not_probed' }, reverseSkill: { configured: Boolean(this.config.reverseSkill?.root), rootExists: await exists(this.config.reverseSkill?.root), runtime: 'not_probed' }, pentagi: { configured: Boolean(this.config.pentagi?.baseUrl), tokenPresent: Boolean(this.config.pentagi?.tokenEnv && process.env[this.config.pentagi.tokenEnv]), runtime: 'not_probed' }, activePentagi: 'blocked', assurance: 'Configuration presence is not runtime integration.' };
  }
}
