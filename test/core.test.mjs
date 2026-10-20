import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { CaseStore } from '../src/cases.mjs';
import { inside, validateScope, redact } from '../src/scope.mjs';

async function setup(t) {
  const tempRoot = path.resolve('.work'); await fs.mkdir(tempRoot, { recursive: true });
  const base = await fs.mkdtemp(path.join(tempRoot, 'rebuild-core-'));
  t.after(() => fs.rm(base, { recursive: true, force: true }));
  const input = path.join(base, 'input');
  const output = path.join(base, 'output');
  await fs.mkdir(input); await fs.mkdir(output);
  const target = path.join(input, 'app.exe'); await fs.writeFile(target, 'self owned sample');
  const policy = { readRoots: [input], writeRoots: [output] };
  const scope = { platform: 'desktop', feature: 'normalize names', target, readRoots: [input], writeRoots: [output], networkTargets: [], authorization: 'self-owned fixture', expiresAt: '2099-01-01T00:00:00Z' };
  const store = new CaseStore(path.join(base, 'cases'), policy);
  return { base, input, output, target, policy, scope, store };
}

test('rejects sibling prefixes, traversal and symlink escapes', async t => {
  const { base, input } = await setup(t);
  assert.equal(await inside(path.join(input, 'new.txt'), [input]), true);
  assert.equal(await inside(path.join(base, 'input-evil', 'x'), [input]), false);
  assert.equal(await inside(path.join(input, '..', 'x'), [input]), false);
  await fs.symlink(base, path.join(input, 'escape'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.equal(await inside(path.join(input, 'escape', 'x'), [input]), false);
});

test('validates three platforms without granting broader host permissions', async t => {
  const { scope, policy, base } = await setup(t);
  for (const platform of ['desktop', 'android', 'web']) {
    const s = { ...scope, platform, ...(platform === 'web' ? { target: 'https://example.test/feature', networkTargets: ['https://example.test'] } : {}) };
    assert.equal((await validateScope(s, policy)).platform, platform);
  }
  await assert.rejects(validateScope({ ...scope, readRoots: [base] }, policy), /SCOPE/);
  await assert.rejects(validateScope({ ...scope, platform: 'ios' }, policy), /INPUT/);
  await assert.rejects(validateScope({ ...scope, expiresAt: '2000-01-01T00:00:00Z' }, policy), /EXPIRED/);
  await assert.rejects(validateScope({ ...scope, platform: 'web', target: 'https://u:pw@example.test', networkTargets: ['https://example.test'] }, policy), /INPUT/);
});

test('case lifecycle requires ordered substantive, hash-checked artifacts', async t => {
  const { store, scope, base } = await setup(t);
  const c = await store.create(scope);
  assert.equal(c.stage, 'initialized');
  await assert.rejects(store.read('../input'), /INPUT/);
  await assert.rejects(store.advance(c.id, 'analyzed'), /STAGE/);
  await store.advance(c.id, 'scoped');
  await store.advance(c.id, 'routed', { platform: 'desktop', method: 'fixture' });
  await assert.rejects(store.evidence(c.id, { kind: 'analysis', content: '', source: 'test', classification: 'fact' }), /INPUT/);
  const e = await store.evidence(c.id, { kind: 'analysis', content: 'The observed function strips surrounding whitespace.', source: 'self-owned source inspection', classification: 'fact' });
  await store.advance(c.id, 'analyzed', { evidenceIds: [e.id] });
  const spec = await store.evidence(c.id, { kind: 'specification', content: 'Input string; trim surrounding whitespace; preserve interior spaces.', source: 'derived spec', classification: 'inference' });
  await store.advance(c.id, 'specified', { evidenceIds: [spec.id] });
  const impl = await store.evidence(c.id, { kind: 'implementation', content: 'Independent implementation in explicitly selected output project.', source: 'local coding session', classification: 'fact' });
  await store.advance(c.id, 'rebuilt', { evidenceIds: [impl.id] });
  const v = await store.evidence(c.id, { kind: 'verification', content: JSON.stringify({ mode: 'reported', checks: [{ name: 'trim', status: 'passed', expected: 'a', actual: 'a' }] }), source: 'test log supplied by operator', classification: 'fact' });
  const v2 = await store.evidence(c.id, { kind: 'verification', content: JSON.stringify({ mode: 'reported', checks: [{ name: 'preserve interior space', status: 'passed', expected: 'a b', actual: 'a b' }] }), source: 'second test log batch', classification: 'fact' });
  await store.advance(c.id, 'verified', { evidenceIds: [v.id, v2.id] });
  assert.equal((await store.report(c.id)).security.status, 'not_run');
  assert.equal((await store.report(c.id)).verification.mode, 'reported');
  assert.equal((await store.report(c.id)).verification.checks.length, 2);
  await assert.rejects(store.evidence(c.id, { kind: 'analysis', content: 'A new run must not silently change a finalized report.', source: 'new observation', classification: 'fact' }), /STAGE/);
  await fs.writeFile(path.join(base, 'cases', c.id, 'evidence', `${e.id}.json`), '{}');
  await assert.rejects(store.report(c.id), /INTEGRITY/);
});

test('case storage rejects linked evidence directories without writing outside', async t => {
  const { store, scope, base } = await setup(t);
  const c = await store.create(scope);
  const outside = path.join(base, 'outside'); await fs.mkdir(outside);
  const evidence = path.join(base, 'cases', c.id, 'evidence');
  await fs.rmdir(evidence); await fs.symlink(outside, evidence, process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(store.evidence(c.id, { kind: 'analysis', content: 'Should never be written outside case storage.', source: 'test', classification: 'fact' }), /SCOPE/);
  assert.deepEqual(await fs.readdir(outside), []);
});

test('failed verification cannot advance and secrets are redacted recursively', async t => {
  const { store, scope } = await setup(t);
  const c = await store.create(scope);
  await assert.rejects(store.evidence(c.id, { kind: 'verification', content: JSON.stringify({ mode: 'reported', checks: [] }), source: 'test', classification: 'fact' }), /INPUT/);
  const cleaned = redact({ token: 'private', note: 'Bearer abc.def.ghi secret-value', nested: { password: 'pw' } }, ['secret-value']);
  assert.equal(cleaned.token, '[REDACTED]'); assert.equal(cleaned.nested.password, '[REDACTED]');
  assert.ok(!cleaned.note.includes('abc.def.ghi')); assert.ok(!cleaned.note.includes('secret-value'));
});

test('concurrent store instances retain both evidence records', async t => {
  const { store, scope, policy, base } = await setup(t); const c = await store.create(scope);
  const other = new CaseStore(path.join(base, 'cases'), policy);
  const evidence = content => ({ kind: 'analysis', content, source: 'concurrency fixture', classification: 'fact' });
  await Promise.all([store.evidence(c.id, evidence('first observation')), other.evidence(c.id, evidence('second observation'))]);
  assert.equal((await store.report(c.id)).records.length, 2);
});
