# Pinned real open-source functional slices

These benchmarks execute inspected original project code and compare it with independently authored behavior implementations in `reimplementations.mjs`. They exercise real application components, not full application builds. They do not establish desktop GUI, browser DOM, Android APK/device or security-scan acceptance.

The runner is offline: it never downloads sources, installs dependencies, invokes upstream build scripts or edits client configuration. Windows PowerShell with Add-Type, Java/Javac 17 and Node 24 were used for the initial run. A .NET SDK, Gradle, adb and Docker are unnecessary for these specific slices.

## Provision separately

`manifest.mjs` specifies repository names, full revisions, source-relative paths, license notes and measured SHA256 hashes of every required source/license file. A trusted operator must place those exact bytes under `SOURCE_ROOT/<project id>/<source-relative path>`. GitHub raw source URLs follow `https://raw.githubusercontent.com/<repo>/<revision>/<path>`. Review the original code and license notices before executing. The runner validates every hash before execution or creating its output directory.

Keep all original source, licenses, extracted dependencies, compiled classes, inputs and case evidence outside this MIT project/package. In this chat they live under `D:/Codex产物/2026-10-20-软件理解复刻-01a15a42/work/oss-benchmarks/`. The runner exclusively creates a new run directory; a previous run is never overwritten. Provisioning and source execution need the operator's filesystem/execution authorization.

```powershell
node scripts/bench-oss.mjs --source-root 'D:/private samples/sources' --work-root 'D:/private samples/run 01'
node --test --test-isolation=none benchmarks/reimplementations.test.mjs benchmarks/runner.test.mjs
# Optional filesystem guards against already-provisioned sources; retains isolated test copies:
$env:OSS_SOURCE_ROOT = 'D:/private samples/sources'
$env:OSS_TEST_ROOT = 'D:/private samples'
node --test --test-isolation=none benchmarks/runner.test.mjs
```

## Contracts and boundaries

- **TodoMVC ES5 (MIT):** original `store.js` and `model.js` run in `node:vm` with code generation disabled. The VM is only for known hash-checked inspected source, not a general security sandbox. Twenty-five callback/state comparisons cover CRUD, strict filtering, `parseInt` ID reads, whitespace/invalid titles, counters and ID continuity. This pinned store is memory-backed; browser persistence is not tested.
- **ShareX CRC32 (repository GPL-3.0; source header wording differs):** PowerShell compiles the complete original `Crc32.cs`, which uses only the framework hash API. Thirteen vectors cover standard CRC, UTF8/binary input, seeds, custom polynomial, null error and offsets. The pinned implementation loops until `length` rather than `offset + length`; the reproduction preserves that actual behavior. Offset compatibility is not a statement that the original satisfies standard CRC subarray semantics. Preserve the complete original header and repository license in private storage.
- **Markor natural comparator (Apache-2.0 repository):** javac compiles the complete original comparator plus the exact original `GsTextUtils.isNullOrEmpty` method extracted at runtime. The complete dependency has Android imports, so that one-method extraction is an explicit boundary. Its original file declares `Unlicense OR CC0-1.0`; the original complete file/license is retained. Twenty-six representative names form 676 exact-result ordered pairs plus one sorted-sequence check, including zero padding, huge numeric chunks, ASCII versus full-width digits, umlaut case, emoji and Java whitespace behavior. This is not Android runtime verification. The finite name set does not prove exhaustive Java Unicode case-mapping equivalence.

## Evidence and interpretation

For each project the runner uses the existing `Service` APIs to create scope, route preparation, analysis, specification, implementation and verification evidence. All verification batches (at most 90 checks each) are explicitly referenced in the final transition. Any failed comparison leaves the case at `rebuilt`; failures are retained and the CLI exits nonzero. `verified` means operator-reported passing checks, not independent certification.

Each new run contains `summary.json`, `commands.json`, per-project reports, hash-protected case/evidence files and generated original-run adapters/compiled assets. The runner retains the exact hash-verified bytes in memory and writes them exclusively into the new run's `verified-sources` directory, including licenses; execution and compilation use only these private snapshots. Reports distinguish `originalLocation` from the snapshot `location`. Reports carry source hashes/revisions, runtime, expected/actual results, differences and limitations. Exact child-process arguments, output, errors and exit status are in `commands.json`. No active PentAGI test is performed.
