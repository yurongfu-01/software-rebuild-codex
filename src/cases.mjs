import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { inside, canonical, validateScope, redact } from './scope.mjs';
import { requireThat, text } from './errors.mjs';

const stages = ['initialized', 'scoped', 'routed', 'analyzed', 'specified', 'rebuilt', 'verified'];
const kinds = { analyzed: 'analysis', specified: 'specification', rebuilt: 'implementation', verified: 'verification' };
const digest = s => createHash('sha256').update(s).digest('hex');
export class CaseStore {
  constructor(root, policy = {}, secrets = []) { this.root = path.resolve(root); this.policy = policy; this.secrets = secrets; }
  async locked(id, action) {
    const lock = await this.location(id, '.lock'); const started = Date.now();
    for (;;) {
      try { await fs.mkdir(lock); break; }
      catch (e) {
        if (e.code !== 'EEXIST') throw e;
        requireThat(Date.now() - started < 5000, 'BUSY', 'Case is locked by another writer; inspect owner before removing a stale lock');
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    }
    try {
      await fs.writeFile(path.join(lock, 'owner.json'), JSON.stringify({ pid: process.pid, at: new Date().toISOString() }), { flag: 'wx' });
      return await action();
    } finally {
      await this.location(id, '.lock');
      await fs.unlink(path.join(lock, 'owner.json')).catch(() => {}); await fs.rmdir(lock);
    }
  }
  async location(id, ...parts) {
    requireThat(/^[a-f0-9-]{36}$/.test(id), 'INPUT', 'Invalid case ID');
    const candidate = path.join(this.root, id, ...parts);
    requireThat(await inside(candidate, [this.root]), 'SCOPE', 'Case storage escape');
    // Storage files and directories may never be symlinks, even to another case.
    let cursor = this.root;
    for (const part of [id, ...parts]) {
      cursor = path.join(cursor, part);
      try { requireThat(!(await fs.lstat(cursor)).isSymbolicLink(), 'SCOPE', 'Linked case storage'); }
      catch (e) { if (e.code !== 'ENOENT') throw e; }
    }
    return candidate;
  }
  async create(input) {
    const scope = await validateScope(input, this.policy);
    await fs.mkdir(this.root, { recursive: true }); this.root = await canonical(this.root);
    const id = randomUUID(); const dir = await this.location(id);
    await fs.mkdir(dir); await fs.mkdir(path.join(dir, 'evidence'));
    const c = { version: 1, id, stage: 'initialized', scope, evidence: [], transitions: [], security: { status: 'not_run' }, createdAt: new Date().toISOString() };
    await fs.writeFile(path.join(dir, 'scope.json'), JSON.stringify(scope, null, 2), { flag: 'wx' });
    await fs.writeFile(path.join(dir, 'case.json'), JSON.stringify(c, null, 2), { flag: 'wx' });
    await fs.writeFile(path.join(dir, 'events.jsonl'), JSON.stringify({ stage: c.stage, at: c.createdAt }) + '\n', { flag: 'wx' });
    return c;
  }
  async read(id) {
    const c = JSON.parse(await fs.readFile(await this.location(id, 'case.json'), 'utf8'));
    requireThat(c.id === id && stages.includes(c.stage), 'INTEGRITY', 'Invalid case metadata');
    await validateScope(c.scope, this.policy);
    return c;
  }
  async save(c, event) {
    // The caller holds a cross-process per-case directory lock through this update.
    const state = await this.location(c.id, 'case.json'); const events = await this.location(c.id, 'events.jsonl');
    const temp = await this.location(c.id, `${randomUUID()}.tmp`);
    await fs.writeFile(temp, JSON.stringify(c, null, 2), { flag: 'wx' });
    try { await fs.appendFile(events, JSON.stringify({ at: new Date().toISOString(), ...event }) + '\n'); await fs.rename(temp, state); }
    finally { await fs.rm(temp, { force: true }); }
  }
  async evidence(id, input) {
    return this.locked(id, () => this.addEvidence(id, input));
  }
  async addEvidence(id, input) {
    const c = await this.read(id);
    requireThat(c.stage !== 'verified', 'STAGE', 'Finalized case is immutable; start a new case for a new run');
    requireThat(Object.values(kinds).includes(input?.kind), 'INPUT', 'Invalid evidence kind');
    requireThat(['fact', 'inference'].includes(input.classification), 'INPUT', 'Evidence classification required');
    text(input.content, 'content', 200000); text(input.source, 'source', 1000);
    if (input.kind === 'verification') {
      let v; try { v = JSON.parse(input.content); } catch { requireThat(false, 'INPUT', 'Verification must be JSON'); }
      requireThat(v?.mode === 'reported' && Array.isArray(v.checks) && v.checks.length > 0 && v.checks.length <= 100 && v.checks.every(x => x && typeof x === 'object' && typeof x.name === 'string' && x.name.trim() && ['passed', 'failed', 'not_run'].includes(x.status) && Object.hasOwn(x, 'expected') && Object.hasOwn(x, 'actual')), 'INPUT', 'Verification requires 1-100 reported checks with names, statuses, expected and actual results; split larger runs into evidence batches');
    }
    const e = { id: randomUUID(), kind: input.kind, classification: input.classification, source: redact(input.source, this.secrets), content: redact(input.content, this.secrets), provenance: 'operator_supplied', at: new Date().toISOString(), tool: input.tool ? text(input.tool, 'tool', 200) : 'operator', toolVersion: input.toolVersion ? text(input.toolVersion, 'toolVersion', 100) : 'unspecified' };
    const body = JSON.stringify(redact(e, this.secrets), null, 2);
    const record = { id: e.id, kind: e.kind, sha256: digest(body) };
    await fs.writeFile(await this.location(id, 'evidence', `${e.id}.json`), body, { flag: 'wx' });
    c.evidence.push(record); c.version++;
    await this.save(c, { evidenceId: e.id, kind: e.kind }); return record;
  }
  async loadEvidence(c, id) {
    const record = c.evidence.find(x => x.id === id); requireThat(record, 'INTEGRITY', 'Unknown evidence');
    const body = await fs.readFile(await this.location(c.id, 'evidence', `${record.id}.json`), 'utf8');
    requireThat(digest(body) === record.sha256, 'INTEGRITY', 'Evidence content changed');
    return JSON.parse(body);
  }
  async advance(id, stage, artifact = {}) {
    return this.locked(id, () => this.doAdvance(id, stage, artifact));
  }
  async doAdvance(id, stage, artifact = {}) {
    const c = await this.read(id);
    requireThat(stages.indexOf(stage) === stages.indexOf(c.stage) + 1, 'STAGE', 'Stages must advance in order');
    if (stage === 'routed') requireThat(artifact?.platform === c.scope.platform && typeof artifact.method === 'string' && artifact.method.trim(), 'INPUT', 'Route artifact required');
    if (kinds[stage]) {
      requireThat(Array.isArray(artifact?.evidenceIds) && artifact.evidenceIds.length > 0, 'INPUT', 'Evidence IDs required');
      const records = await Promise.all(artifact.evidenceIds.map(x => this.loadEvidence(c, x)));
      requireThat(records.some(x => x.kind === kinds[stage]), 'INPUT', 'Wrong evidence kind');
      if (stage === 'verified') {
        for (const r of records.filter(x => x.kind === 'verification')) requireThat(JSON.parse(r.content).checks.every(x => x.status === 'passed'), 'STAGE', 'Verification checks did not pass');
      }
    }
    c.stage = stage; c.version++; c.transitions.push({ stage, artifact: redact(artifact, this.secrets), at: new Date().toISOString() });
    await this.save(c, { stage }); return c;
  }
  async report(id) {
    return this.locked(id, () => this.doReport(id));
  }
  async doReport(id) {
    const c = await this.read(id);
    const records = await Promise.all(c.evidence.map(x => this.loadEvidence(c, x.id)));
    const finalizedIds = c.transitions.findLast(x => x.stage === 'verified')?.artifact.evidenceIds;
    const selected = records.filter(x => x.kind === 'verification' && (!finalizedIds || finalizedIds.includes(x.id)));
    const batches = selected.map(x => JSON.parse(x.content));
    const verification = batches.length ? { mode: 'reported', finalized: c.stage === 'verified', evidenceIds: selected.map(x => x.id), checks: batches.flatMap(x => x.checks) } : { mode: 'not_run' };
    return redact({ ...c, records, verification, assurance: 'Evidence and verification are operator-supplied, not independently certified by this plugin.' }, this.secrets);
  }
}
