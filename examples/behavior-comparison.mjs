import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { normalizeName } from './fixtures/desktop-feature.mjs';
import { rebuildName } from './independent-feature.mjs';
import { runProcess } from '../src/process.mjs';
import { Service } from '../src/service.mjs';

const examples = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(process.env.REBUILD_DEMO_ROOT || '.work/demo'); await fs.mkdir(root, { recursive: true });
const dir = await fs.mkdtemp(path.join(root, 'run-'));
const service = new Service({ caseRoot: path.join(dir, 'cases'), readRoots: [examples], writeRoots: [dir] });
const inputs = [' Hello World ', 'A  B', '', 'already-slug', '  Mixed CASE 42  '];
const expected = ['hello-world', 'a-b', '', 'already-slug', 'mixed-case-42'];
const server = http.createServer((req, res) => {
  try { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ result: normalizeName(new URL(req.url, 'http://localhost').searchParams.get('name')) })); }
  catch { res.writeHead(400); res.end(JSON.stringify({ error: 'Invalid input' })); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const summary = [];
try {
  for (const platform of ['desktop', 'web', 'android']) {
    const reference = platform === 'android' ? path.join(examples, 'fixtures', 'NameNormalizer.java') : path.join(examples, 'fixtures', 'desktop-feature.mjs');
    const c = await service.dispatch('case_create', { platform, target: platform === 'web' ? `${origin}/normalize` : reference, feature: 'ASCII printable name normalization into lowercase hyphenated words', readRoots: [examples], writeRoots: [dir], networkTargets: platform === 'web' ? [origin] : [], authorization: 'self-owned demonstration fixtures only', expiresAt: new Date(Date.now() + 3600000).toISOString() });
    await service.dispatch('case_advance', { caseId: c.id, stage: 'scoped' });
    const route = await service.dispatch('route', { caseId: c.id });
    await service.dispatch('case_advance', { caseId: c.id, stage: 'routed', artifact: route });
    let observed;
    if (platform === 'desktop') observed = inputs.map(normalizeName);
    if (platform === 'web') observed = await Promise.all(inputs.map(async name => (await (await fetch(`${origin}/normalize?name=${encodeURIComponent(name)}`)).json()).result));
    if (platform === 'android') {
      const java = await runProcess(process.env.JAVA_COMMAND || 'java', [reference, ...inputs]);
      observed = java.stdout.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');
    }
    const checks = inputs.map((input, i) => ({ name: JSON.stringify(input), status: observed[i] === expected[i] && rebuildName(input) === expected[i] ? 'passed' : 'failed', expected: expected[i], actual: { reference: observed[i], independent: rebuildName(input) } }));
    const runtime = { desktop: 'Node.js source execution (no desktop GUI)', web: 'local HTTP server and real HTTP client (no browser)', android: 'JDK source-file execution (no Android device/APK)' }[platform];
    for (const [kind, stage, content] of [
      ['analysis', 'analyzed', `Source: ${reference}; observations: ${JSON.stringify(observed)}; runtime: ${runtime}.`],
      ['specification', 'specified', 'Accept printable ASCII strings; trim surrounding spaces; lowercase letters; collapse interior runs of spaces into one hyphen; preserve existing punctuation; empty input yields empty output. Non-ASCII and non-string input is invalid.'],
      ['implementation', 'rebuilt', `Independent source: ${path.join(examples, 'independent-feature.mjs')}; ${rebuildName.toString()}`],
      ['verification', 'verified', JSON.stringify({ mode: 'reported', runtime, checks })]
    ]) {
      const e = await service.dispatch('case_evidence', { caseId: c.id, kind, content, source: `self-owned demo; ${process.version}; ${runtime}`, classification: kind === 'specification' ? 'inference' : 'fact', tool: 'behavior-comparison', toolVersion: '0.1.0-alpha.1' });
      await service.dispatch('case_advance', { caseId: c.id, stage, artifact: { evidenceIds: [e.id] } });
    }
    const report = await service.dispatch('case_report', { caseId: c.id });
    await fs.writeFile(path.join(dir, `${platform}-report.json`), JSON.stringify(report, null, 2), { flag: 'wx' });
    summary.push({ platform, caseId: c.id, stage: report.stage, checks: checks.length, runtime, report: path.join(dir, `${platform}-report.json`) });
  }
  console.log(JSON.stringify({ summary, limitation: 'Behavioral fixtures only. These are not GUI, browser, APK/device or autonomous penetration-test acceptance.' }, null, 2));
} finally { await service.close(); await new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }); }
