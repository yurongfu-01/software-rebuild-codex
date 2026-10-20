# Validation record — 0.1.0-alpha.1

Date: 2026-10-20. This record distinguishes actual observations from fixture tests and incomplete acceptance. Source publication is an alpha distribution, not a claim of full three-platform runtime or autonomous penetration-test acceptance.

## Environment

- Windows local Codex desktop execution; Node.js v24.15.0.
- Codex CLI 0.163.0-alpha.10.2; JDK 17.0.18.
- Git and Windows PowerShell; OpenSSL provided by Git for Windows for local TLS fixtures.
- Docker executable present, but local Linux engine unavailable. No PentAGI instance deployed.
- Restricted-shell subprocess/network checks initially returned EPERM/proxy connection errors. Tests requiring subprocesses ran with approved local execution; these restrictions were not reported as product failures or test passes.

## Actual execution

| Check | Observed result | What it does not prove |
| --- | --- | --- |
| Real REA 6.7.0 initialize and discovery | server rea / 6.7.0, 207 tools | Availability of every optional backend |
| Real REA exact-granted tool execution | binary_session returned a structured session | A security scan or native feature reconstruction |
| Real REA state across tools | open_binary selected a self-owned compiled .NET PE; subsequent binary_session reported open:true | Deep decompilation, GUI execution or APK analysis |
| Real reverse-skill router | Desktop R5 high; Android R1 high; generic Web hint R0 low fallback; all exit 0 | Complete or precise Web feature understanding |
| Plugin installation in isolated CODEX_HOME | CLI marketplace add and plugin add returned software-rebuild-codex@software-rebuild, version 0.1.0-alpha.1, installed cache path | Activation in the user's current account/chat |
| Clean committed-source ZIP install and runtime | Extracted into a new directory, installed into another isolated CODEX_HOME; installed-cache server initialized, listed 10 tools and executed doctor | Existing-account activation or live upstream availability in that clean configuration |
| Official skill format validator | Skill is valid | Behavioral quality on its own |
| Self-owned end-to-end cases | 5/5 checks each for Node, real loopback HTTP, JDK domain logic; stages reached reported verified | Native desktop GUI, browser, Android device or APK installation |

Case verification artifacts are explicitly labeled `mode: reported` and `provenance: operator_supplied`. The demo really executes its reference and independent implementations but does not claim another executor independently certified those results.

## Regression and independent review

The automated suite exercises scope traversal and junctions, three platform input contracts, ordered transitions, tampered evidence, concurrent stores, secret redaction, exact REA grants and state persistence, child-process argv/timeout/output handling, malformed MCP frames, fragmented protocol messages, per-frame response limits, target-exited descendant cleanup, actual CLI/MCP service calls and local HTTPS boundary behavior.

Initial independent review identified four material findings: malformed MCP null-frame crash, concurrent evidence loss, descendant cleanup after target exit, and draining endless non-200 PentAGI bodies. Each received a reproducing failing test before its fix. The fixes include strict frame validation, per-case directory locks, Windows Job Objects and immediate response/request destruction. Independent follow-up review found no new material blockers in those implementations; the reviewer independently ran core 6/6 and transport 6/6 at that checkpoint.

Real-upstream probing also revealed state loss across separate REA processes and an incorrect cumulative stdout byte limit. Regression tests were observed failing, then passing after case-session reuse and per-frame limits. An independent review of those lifecycle changes found no material publication blockers. Windows argv parsing in the new launcher was corrected using direct minimal diagnostics; the complete transport suite then passed.

An independent skill forward-test used only the raw self-owned reference and packaged skill/CLI. It produced another independent module and ran **157/157** normal/error/edge comparisons successfully, preserving the reference hash. REA was deliberately unconfigured for this evaluation and routing correctly reported built-in preparation guidance. The evaluator encountered two invalid-input attempts at the 100-check evidence limit before inspecting the schema and batching results. This exposed overly generic errors and a report that summarized only the last batch. Reproducing tests were observed failing; errors now preserve safe actionable details, and finalized reports aggregate all referenced verification batches. The limit and batching are documented in the workflow.

Final local suite checkpoint: **24/24 passed** before distribution, with source syntax and plugin-path checks passing. Independent skill comparison is separate from these 24 automated tests. See the release handoff for immutable package/remote evidence.

## Not run / incomplete

- Live PentAGI API against a deployed instance: **not run**. Local TLS fixture tests are contract tests only.
- Autonomous PentAGI security test: **blocked by design**; isolation/budget/verified stop integration is not implemented.
- Native desktop GUI, actual browser and Android emulator/device functional reconstruction: **not run**.
- Full recovery after arbitrary system failure: **not established**; interrupted multi-file records require operator-assisted recovery.
- Malicious-code OS sandboxing: **not provided**. Trusted host config and storage boundaries are described in operations.
- Activation in the existing Codex desktop conversation: **not run**. Isolated CLI installation and protocol execution are separate evidence.
- GitHub CI: pipeline provided; its real remote result must be checked after publication.

Final suite count, source commit, package hashes, skill behavioral evaluation and remote publication evidence are recorded in the release handoff accompanying the published archive. This document does not assume those future checks passed.
