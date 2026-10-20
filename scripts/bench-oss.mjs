#!/usr/bin/env node
// Offline by design: provision the eight pinned files described by manifest.mjs separately.
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { projects } from '../benchmarks/manifest.mjs';
import { crc32, naturalCompare, makeTodoModel } from '../benchmarks/reimplementations.mjs';
import { crcVectors, pairs, names, todoScenario } from '../benchmarks/vectors.mjs';
import { Service } from '../src/service.mjs';
import { canonical, inside } from '../src/scope.mjs';

const exec = promisify(execFile);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const json = x => JSON.stringify(x, null, 2);
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const limitations = ['Domain-source slices only; no desktop GUI, browser DOM, APK build, Android device or PentAGI scan.', 'Operator-reported evidence, not independent certification.', 'No upstream install scripts, network requests or package installation by runner.', 'Markor compiles original comparator plus the exact extracted original isNullOrEmpty method, not the full Android-dependent GsTextUtils.'];

function options(args) {
  if (args.length !== 4 || args[0] !== '--source-root' || args[2] !== '--work-root') throw Error('Usage: node scripts/bench-oss.mjs --source-root ABS --work-root ABS_NEW_DIRECTORY');
  for (const value of [args[1], args[3]]) if (!path.isAbsolute(value) || value.includes('\0')) throw Error('Absolute local paths required');
  return { sourceRoot: args[1], workRoot: args[3] };
}

export async function runBenchmarks({ sourceRoot, workRoot }) {
  sourceRoot = await canonical(sourceRoot); workRoot = await canonical(workRoot);
  if (await inside(sourceRoot, [workRoot]) || await inside(workRoot, [sourceRoot])) throw Error('Source and output directories must not overlap');
  const stat = await fs.stat(sourceRoot); if (!stat.isDirectory()) throw Error('Source root must exist');
  // Validate all original files before any source is executed or output is created.
  const sources = {}; const verifiedBytes = new Map();
  for (const project of projects) {
    sources[project.id] = [];
    for (const [relative, expected] of project.files) {
      const location = path.join(sourceRoot, project.id, relative);
      if (!(await inside(location, [sourceRoot]))) throw Error('Linked source escapes source root');
      const bytes = await fs.readFile(location); const actual = sha256(bytes);
      if (actual !== expected) throw Error(`Source hash mismatch: ${project.id}/${relative}`);
      const snapshotLocation = path.join(workRoot, 'verified-sources', project.id, relative);
      sources[project.id].push({ relative, originalLocation: location, location: snapshotLocation, sha256: actual, bytes: bytes.length, url: `https://raw.githubusercontent.com/${project.repo}/${project.revision}/${relative}` });
      verifiedBytes.set(snapshotLocation, bytes);
    }
  }
  // Exclusive output creation protects previous cases, originals and reports.
  await fs.mkdir(workRoot);
  // Execute only private snapshots written from the exact bytes hashed above.
  // Never reopen mutable provisioned sources after validation (TOCTOU boundary).
  for (const [location, bytes] of verifiedBytes) {
    await fs.mkdir(path.dirname(location), { recursive: true });
    await fs.writeFile(location, bytes, { flag: 'wx' });
  }
  verifiedBytes.clear();
  const commands = [];
  const command = async (file, args) => {
    const entry = { file, args, cwd: workRoot }; commands.push(entry);
    try { const result = await exec(file, args, { cwd: workRoot, timeout: 60000, maxBuffer: 4 * 1024 * 1024, windowsHide: true }); entry.stdout = result.stdout; entry.stderr = result.stderr; entry.exitCode = 0; return result.stdout.trim(); }
    catch (error) { entry.stdout = error.stdout; entry.stderr = error.stderr; entry.exitCode = error.code; throw error; }
  };
  const write = (name, content) => fs.writeFile(path.join(workRoot, name), content, { flag: 'wx' });
  const service = new Service({ caseRoot: path.join(workRoot, 'cases'), readRoots: [path.join(workRoot, 'verified-sources')], writeRoots: [workRoot] });
  const reports = [];
  const startedAt = new Date().toISOString();
  try {
    for (const project of projects) {
      const c = await service.dispatch('case_create', { platform: project.platform, feature: project.feature, target: project.platform === 'web' ? `https://github.com/${project.repo}/tree/${project.revision}` : sources[project.id][0].location, readRoots: [path.join(workRoot, 'verified-sources')], writeRoots: [workRoot], networkTargets: project.platform === 'web' ? ['https://github.com'] : [], authorization: 'User confirmed isolated pinned open-source functional benchmark; original execution confined to local source slices; no network or GUI/device execution.', expiresAt: new Date(Date.now() + 86400000).toISOString() });
      const advance = (stage, artifact = {}) => service.dispatch('case_advance', { caseId: c.id, stage, artifact });
      const evidence = (kind, content, classification = 'fact') => service.dispatch('case_evidence', { caseId: c.id, kind, content: json(content), source: `pinned ${project.repo}@${project.revision}; ${workRoot}`, classification, tool: 'offline-oss-benchmark', toolVersion: '1' });
      await advance('scoped'); const route = await service.dispatch('route', { caseId: c.id }); await advance('routed', route);
      const analysis = await evidence('analysis', { project, sources: sources[project.id], inspected: true, executionBoundary: 'Only listed original source and explicit minimal helper; no application lifecycle or upstream build scripts.', limitations });
      await advance('analyzed', { evidenceIds: [analysis.id] });
      const spec = await evidence('specification', { feature: project.feature, comparison: project.id === 'todomvc' ? 'Callback JSON, CRUD, strict filtering, parseInt and empty-title/error boundaries, ID lifecycle' : project.id === 'sharex' ? 'Unsigned CRC output or error type including pinned nonzero-offset loop defect, not idealized CRC behavior' : 'Natural comparator exact return values for pair matrix and independently sorted sequence; ASCII digits, zero padding, Java trim and case rules', limitations }, 'inference');
      await advance('specified', { evidenceIds: [spec.id] });
      const implementation = await evidence('implementation', { independentSource: 'benchmarks/reimplementations.mjs', sha256: sha256(await fs.readFile(new URL('../benchmarks/reimplementations.mjs', import.meta.url))), authoredFrom: 'Behavior contract; upstream original code is kept outside the source tree and MIT package.', sourceFiles: sources[project.id], limitations });
      await advance('rebuilt', { evidenceIds: [implementation.id] });
      let checks = [], runtime;
      try {
        if (project.id === 'todomvc') {
          const context = vm.createContext(Object.create(null), { codeGeneration: { strings: false, wasm: false } });
          vm.runInContext('globalThis.window = Object.create(null)', context, { timeout: 1000 });
          for (const source of sources.todomvc.slice(0, 2)) vm.runInContext(await fs.readFile(source.location, 'utf8'), context, { timeout: 1000, filename: source.relative });
          const model = vm.runInContext('new window.app.Model(new window.app.Store("benchmark"))', context, { timeout: 1000 });
          const actual = JSON.parse(JSON.stringify(todoScenario(model))); const expected = todoScenario(makeTodoModel());
          checks = expected.map((row, i) => ({ name: row.name, expected: row.actual, actual: actual[i].actual, status: equal(row.actual, actual[i].actual) ? 'passed' : 'failed' }));
          runtime = { node: process.version, method: 'node:vm, code generation disabled; known hash-checked ES5 source only', browser: 'not_run' };
        } else if (project.id === 'sharex') {
          await write('crc-input.json', json(crcVectors));
          await write('crc-original.ps1', `param([string]$Source,[string]$InputFile)
$ErrorActionPreference='Stop'
Add-Type -Path $Source
$rows=Get-Content -Raw -LiteralPath $InputFile | ConvertFrom-Json
$results=@(foreach($r in $rows){
  try {
    if($null -eq $r.bytes) { $value=[ShareX.HelpersLib.Crc32]::Compute([byte[]]$null) }
    elseif($null -ne $r.start) {
      $h=New-Object ShareX.HelpersLib.Crc32
      try { $hash=$h.ComputeHash([byte[]]$r.bytes,[int]$r.start,[int]$r.length); $hex=([BitConverter]::ToString($hash)).Replace('-',''); $value=[Convert]::ToUInt32($hex,16) } finally { $h.Dispose() }
    } else {
      $seed=[uint32]::MaxValue; $poly=[uint32]3988292384
      if($null -ne $r.seed){$seed=[uint32]$r.seed}; if($null -ne $r.polynomial){$poly=[uint32]$r.polynomial}
      $value=[ShareX.HelpersLib.Crc32]::Compute($poly,$seed,[byte[]]$r.bytes)
    }
    $value
  } catch { $err=$_.Exception; while($err.InnerException){$err=$err.InnerException}; @{error=$err.GetType().Name} }
})
ConvertTo-Json -Depth 8 -InputObject @{runtime=$PSVersionTable.PSVersion.ToString();clr=[Environment]::Version.ToString();results=$results} -Compress
`);
          const output = JSON.parse(await command('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(workRoot, 'crc-original.ps1'), '-Source', sources.sharex[0].location, '-InputFile', path.join(workRoot, 'crc-input.json')]));
          checks = crcVectors.map((row, i) => { const expected = crc32(row), actual = output.results[i]; return { name: row.name, input: row, expected, actual, status: equal(expected, actual) ? 'passed' : 'failed' }; });
          runtime = { powershell: output.runtime, clr: output.clr, desktopGUI: 'not_run', upstreamDefect: 'CalculateHash loops i < size, although HashCore passes start,length; offset cases preserve actual pinned behavior.' };
        } else {
          const helperText = await fs.readFile(sources.markor[1].location, 'utf8');
          const method = helperText.match(/public static boolean isNullOrEmpty\(final CharSequence str\)\s*\{[^}]+\}/)?.[0];
          if (!method) throw Error('Exact Markor dependency method not found');
          const helper = `// Exact method extracted from ${project.revision}; Unlicense OR CC0-1.0. Original complete file and notice retained in source storage.\npackage net.gsantner.opoc.format;\npublic class GsTextUtils {\n${method}\n}\n`;
          await write('GsTextUtils.java', helper);
          await write('markor-input.txt', pairs.map(pair => pair.map(x => x === null ? '~' : Buffer.from(x).toString('base64')).join('|')).join('\n') + '\n');
          await write('ComparatorRunner.java', `import java.nio.file.*; import java.nio.charset.StandardCharsets; import java.util.Base64; import net.gsantner.opoc.util.AlphanumComparator;
public class ComparatorRunner {
 static String decode(String value) { return value.equals("~") ? null : new String(Base64.getDecoder().decode(value), StandardCharsets.UTF_8); }
 public static void main(String[] args) throws Exception { AlphanumComparator comparator = new AlphanumComparator(); for (String line : Files.readAllLines(Path.of(args[0]), StandardCharsets.UTF_8)) { String[] pair=line.split("\\\\|", -1); System.out.println(comparator.compare(decode(pair[0]),decode(pair[1]))); } }
}
`);
          await fs.mkdir(path.join(workRoot, 'classes'));
          // Resolve javac beside the actual java binary; never install or repair a JDK.
          const javaLocations = (await command('where.exe', ['java.exe'])).split(/\r?\n/).filter(Boolean);
          let java, javac;
          for (const candidate of javaLocations) { const real = await fs.realpath(candidate); const compiler = path.join(path.dirname(real), 'javac.exe'); try { await fs.access(compiler); java = real; javac = compiler; break; } catch {} }
          if (!javac) throw Error('No javac alongside detected Java; install not attempted');
          await command(java, ['-version']); const javaVersion = commands.at(-1).stderr.trim();
          runtime = { java: javaVersion, javac: await command(javac, ['-version']), androidDevice: 'not_run', extraction: { method, originalSource: sources.markor[1], helperSha256: sha256(helper) } };
          // Java -version writes to stderr; retain complete version command in commands evidence.
          await command(javac, ['-encoding', 'UTF-8', '-d', path.join(workRoot, 'classes'), sources.markor[0].location, path.join(workRoot, 'GsTextUtils.java'), path.join(workRoot, 'ComparatorRunner.java')]);
          const actual = (await command(java, ['-cp', path.join(workRoot, 'classes'), 'ComparatorRunner', path.join(workRoot, 'markor-input.txt')])).split(/\r?\n/).map(Number);
          if (actual.length !== pairs.length || actual.some(x => !Number.isFinite(x))) throw Error('Invalid Java comparator output');
          checks = pairs.map(([a, b], i) => { const expected = naturalCompare(a, b); return { name: `pair ${i}: ${JSON.stringify([a, b])}`, expected, actual: actual[i], status: expected === actual[i] ? 'passed' : 'failed' }; });
          const lookup = new Map(pairs.map(([a,b], i) => [JSON.stringify([a,b]), actual[i]]));
          const originalSorted = [...names].sort((a,b) => lookup.get(JSON.stringify([a,b])));
          const rebuiltSorted = [...names].sort(naturalCompare);
          checks.push({ name: 'full sorting sequence using actual original comparator results', expected: rebuiltSorted, actual: originalSorted, status: equal(rebuiltSorted, originalSorted) ? 'passed' : 'failed' });
        }
      } catch (error) {
        checks.push({ name: 'original source execution', expected: 'original executes successfully', actual: { message: error.message, code: error.code }, status: 'failed' });
      }
      const verificationIds = [];
      for (let i = 0; i < checks.length; i += 90) { const batch = await evidence('verification', { mode: 'reported', checks: checks.slice(i, i + 90), runtime, limitations }); verificationIds.push(batch.id); }
      if (checks.every(x => x.status === 'passed')) await advance('verified', { evidenceIds: verificationIds });
      const report = await service.dispatch('case_report', { caseId: c.id });
      const reportPath = path.join(workRoot, `${project.id}-report.json`); await fs.writeFile(reportPath, json(report), { flag: 'wx' });
      reports.push({ project: project.id, caseId: c.id, stage: report.stage, checks: checks.length, passed: checks.filter(x => x.status === 'passed').length, failed: checks.filter(x => x.status !== 'passed'), verificationIds, reportPath, runtime });
    }
  } finally {
    await service.close(); await write('commands.json', json(commands));
  }
  const summary = { startedAt, finishedAt: new Date().toISOString(), sourceRoot, workRoot, node: process.version, projects, sources, reports, limitations, totals: { checks: reports.reduce((n,x) => n+x.checks,0), passed: reports.reduce((n,x) => n+x.passed,0) } };
  await write('summary.json', json(summary));
  return summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { const result = await runBenchmarks(options(process.argv.slice(2))); console.log(json({ summary: path.join(result.workRoot, 'summary.json'), totals: result.totals, reports: result.reports.map(({project,caseId,stage,checks,passed,reportPath}) => ({project,caseId,stage,checks,passed,reportPath})) })); if (result.totals.checks !== result.totals.passed) process.exitCode = 1; }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
