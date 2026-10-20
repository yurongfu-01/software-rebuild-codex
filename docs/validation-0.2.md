# Validation — 0.2.0-alpha.1

Date: 2026-10-20. Local Node 24.15.0, Windows; original Java 17.0.18, Windows PowerShell 5.1 / CLR 4.0. Test evidence remains in the private session artifact directory; no original third-party source, generated client profile or credentials are published.

| Requirement | Verification | Actual result |
| --- | --- | --- |
| Existing MCP core preserved | Complete Node regression including real stdio transport, TLS, scope and cleanup tests | 33 passed, 0 failed; 1 optional real-source guard skipped in default suite |
| Ten native configuration shapes | Four export tests; independent JSON/TOML/YAML parse | Passed; Aider is additional CLI-only workflow |
| No overwrite/user-config changes | Existing-output refusal and invalid-input tests; isolated native profiles | Passed |
| Real pinned source comparison | TodoMVC model/store, ShareX CRC, Markor comparator | 25 + 13 + 677 = 715 passed; three Service cases verified with operator-reported evidence |
| Source integrity / output preservation | Real eight-file hash validation, tampered-copy refusal, existing directory sentinel | Passed in separate 6/6 benchmark test run |
| Native hosts | Claude 2.1.237, Gemini 0.60.0, Hermes 0.21.6+122.gcbe5e53 | See [exact levels](harnesses.md); no model calls |
| Independent review | Read-only reviewer examined execution/data/config changes, evidence and all eight original hashes | No blocking finding; source execution snapshot improvement applied afterward and separately reviewed |

Static syntax checks cover 30 modules and manifest/version/path consistency. Default CI runs portable unit/regression tests, not the real Windows C#/Java benchmarks or native proprietary clients. Optional integration tests require explicitly provisioned source/test roots. The benchmark runner is offline and does not install dependencies.

The ShareX pinned offset behavior differs from conventional CRC slicing; the independent implementation reproduces the measured original, including that boundary behavior. Markor uses the complete original comparator plus one precisely extracted original helper method, not an APK or complete Android library. Finite test vectors do not establish equivalence for every Unicode/input/runtime combination.

Not run: complete desktop GUI, browser DOM, Android APK/device, every listed Harness runtime, model-mediated full agent loop, live PentAGI. PentAGI remains read-only with active task creation blocked. Connected means transport connection, not completed software reconstruction or security certification.

Private evidence index: session work/oss-benchmarks/run 03/{summary.json,commands.json,*-report.json}; work/harness-probes/native-client-verification.json, hermes-native-summary.json, claude-get.txt, gemini-list-trusted.txt. Public reproducibility instructions and pins: [benchmarks](../benchmarks/README.md). No continuous monitoring or upstream deployment is configured.
