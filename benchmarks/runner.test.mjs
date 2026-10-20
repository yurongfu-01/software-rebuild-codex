import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { runBenchmarks } from '../scripts/bench-oss.mjs';
import { projects } from './manifest.mjs';

test('manifest pins full commits and measured per-file SHA256', () => {
  assert.equal(projects.length, 3);
  for (const project of projects) {
    assert.match(project.revision, /^[a-f0-9]{40}$/);
    assert.ok(project.license);
    assert.ok(project.files.some(([name]) => /license/i.test(name)));
    for (const [name, hash] of project.files) { assert.ok(!name.startsWith('/') && !name.includes('..')); assert.match(hash, /^[a-f0-9]{64}$/); }
  }
});
test('runner rejects source/output overlap before writes', async () => {
  const root = path.resolve('.');
  await assert.rejects(runBenchmarks({ sourceRoot: root, workRoot: root }), /must not overlap/);
});
const integration = process.env.OSS_SOURCE_ROOT && process.env.OSS_TEST_ROOT;
test('runner refuses changed originals and existing outputs without overwriting', { skip: !integration }, async () => {
  const sourceRoot = path.resolve(process.env.OSS_SOURCE_ROOT);
  const root = path.join(path.resolve(process.env.OSS_TEST_ROOT), `guard-${Date.now()}`);
  await fs.mkdir(root); const existing = path.join(root, 'existing output'); await fs.mkdir(existing);
  await fs.writeFile(path.join(existing, 'sentinel'), 'preserve');
  await assert.rejects(runBenchmarks({ sourceRoot, workRoot: existing }), /EEXIST/);
  assert.equal(await fs.readFile(path.join(existing, 'sentinel'), 'utf8'), 'preserve');
  const changed = path.join(root, 'changed source'); await fs.cp(sourceRoot, changed, { recursive: true, errorOnExist: true });
  await fs.appendFile(path.join(changed, 'todomvc', projects[0].files[0][0]), '\n// tampered test copy\n');
  const output = path.join(root, 'must not exist');
  await assert.rejects(runBenchmarks({ sourceRoot: changed, workRoot: output }), /Source hash mismatch/);
  await assert.rejects(fs.stat(output), { code: 'ENOENT' });
});
