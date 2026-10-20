# Software Rebuild Codex Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. User explicitly authorized planning and continued implementation, testing and public publication on 2026-10-20; no repeated handoff approval is required.

**Goal:** Deliver a local Codex plugin coordinating REA, reverse-skill and PentAGI for evidence-based software understanding and independent reimplementation.

**Architecture:** A dependency-free Node.js core stores scoped cases and evidence. CLI and MCP share a service; three adapters separately connect to stdio MCP, an upstream routing script, and HTTPS APIs. Codex performs analysis and code generation using the packaged skill, rather than a second model service.

**Tech Stack:** Node.js >=22.12, ECMAScript modules, node:test, JSON-RPC over newline-delimited stdio, PowerShell for the upstream router, HTTPS for PentAGI.

**Spec:** User-approved design v1, published baseline in [design.md](design.md). License confirmed MIT.

## Global Constraints

- Support desktop, web, android routes; separately report actual runtime validation.
- Never auto-install upstream tools, auto-deploy services or request a paid model by default.
- Do not proxy arbitrary REA operations into automatic execution; explicit per-call grants constrain configured tools and exact arguments.
- PentAGI active execution stays blocked without enforceable isolation and stopping capability; API connectivity is not a penetration test.
- Case data stays outside source and published packages; logs redact secrets.
- Do not overwrite existing target files or user changes. Scope applies to real paths, not only lexical prefixes.
- Publish only the reviewed source and package to yurongfu-01/software-rebuild-codex; do not submit to the OpenAI directory.

## Review Focus

1. Path traversal, symlink/junction escape, case storage links: reject before reads/writes; tests belong to Task 1.
2. Arbitrary tool arguments or untrusted routing output: exact grants, no shell text evaluation; tests belong to Tasks 2/3.
3. Expired/missing authorization and unbounded upstream jobs: fail closed; Task 3 tests active PentAGI denial.
4. Interrupted calls and stale evidence: no success transition from empty files or mismatched hashes; Task 1 tests.
5. Protocol fragmentation, malformed messages and oversized responses: bounded framing and deterministic errors; Tasks 2/4 tests.

## Task 1: Scoped cases and evidence

**Files:** src/scope.mjs, src/cases.mjs, src/errors.mjs; test/core.test.mjs.
**Interfaces:** validateScope(input) → normalized scope; CaseStore(root) exposes create(scope), read(id), evidence(id, input), advance(id, stage, artifact), report(id).

- [x] Write tests for three platforms, invalid scope, traversal, links, missing evidence, tampered evidence, skipped stages and non-overwriting writes.
- [x] Run `node --test test/core.test.mjs`; observe missing implementation failures.
- [x] Implement realpath-based containment, immutable evidence records, bounded input, atomic serialized state writes, validation of transition artifacts and hash checking.
- [x] Run core tests; expected zero failures. Record evidence and commit.

## Task 2: Process and MCP transport

**Files:** src/process.mjs, src/mcp-client.mjs; test/transport.test.mjs, test/fixtures/mcp-peer.mjs.
**Interfaces:** runProcess(command,args,options) → {stdout,stderr,code}; McpClient(config).connect(), request(method,params), close().

- [x] Write tests for shell metacharacters as literal arguments, initialization/tool discovery, split lines, remote errors, timeouts, early exit, output cap and process cleanup.
- [x] Run transport tests and observe failures before implementation.
- [x] Implement bounded newline JSON-RPC, request IDs, child lifecycle, timeout and tree termination; do not echo raw stderr into public errors.
- [x] Run core and transport tests; expected zero failures. Commit.

## Task 3: Three independent adapters

**Files:** src/adapters/rea.mjs, reverse-skill.mjs, pentagi.mjs, src/config.mjs; test/adapters.test.mjs.
**Interfaces:** ReaAdapter(config).discover(), call(tool,args,grant); ReverseSkillAdapter(config).route(hint); PentagiAdapter(config).flows(), start().

- [x] Confirm upstream revisions, MIT licenses, router parameters and output; record interfaces and source links in docs/upstreams.md.
- [x] Write tests for exact REA grants, route output treated as data, missing tools, PentAGI HTTPS and token validation, redirect refusal, bounded responses and blocked active scans.
- [x] Observe adapter test failures, then implement subprocess/API boundaries and environment-only secret references.
- [x] Run all tests and attempt upstream probes that require no paid calls or target scans. Report missing services separately. Commit.

## Task 4: CLI, MCP tools and skill package

**Files:** src/service.mjs, src/server.mjs, bin/software-rebuild.mjs, .codex-plugin/plugin.json, .mcp.json, skills/software-rebuild/SKILL.md; test/service.test.mjs.
**Interfaces:** Service(config).dispatch(name,args); tools case_create/case_read/case_evidence/case_advance/case_report/route/rea_discover/rea_call/pentagi_flows/doctor.

- [x] Write CLI and MCP tests using real child processes: handshake, tools/list, valid call, unknown tool, invalid input, no stdout contamination, one case through evidence and verification.
- [x] Observe failures, implement a single dispatch path with startup configuration outside tool arguments and serial mutations.
- [x] Package documented compatibility manifest and `${PLUGIN_ROOT}` stdio config. Keep host configuration untouched.
- [x] Run full suite and CLI walkthrough; validate skill format. Commit.

## Task 5: Acceptance, review and publication

**Files:** README.md, README.zh-CN.md, docs/validation.md, docs/operations.md, docs/project-state.md, LICENSE, THIRD_PARTY_NOTICES.md, examples/, .github/workflows/ci.yml.

- [x] Provide self-owned desktop/Web/Android sample functional specs and a runnable Node behavioral comparison, clearly distinct from device/GUI integration.
- [x] Run `npm test`, `npm run check`, `npm pack --dry-run` and archive packaging inspection. Separate mock contracts, actual local runtime and missing upstream/device runs.
- [x] Dispatch read-only independent reviewer as required by requesting-code-review; fix important findings with reproducing tests; rerun suite.
- [x] Inspect staged files/history for secrets, user data and unrelated assets. Use noreply Git identity for this repository.
- [x] Verify target account/repository, publish reviewed source publicly and verify remote commit and visibility. If credentials fail, preserve completed deliverables and specify the exact remaining login action.

## Decisions and evidence ledger

- 2026-10-20: User confirmed design v1, MIT, and continuous implementation/testing/publication.
- Initial local environment: Node v24.15.0, Codex CLI 0.163.0-alpha.10.2; Docker executable exists but Linux daemon unavailable. gh not logged in, Git Credential Manager lists target account. Network access in restricted shell failed; evaluate approved network execution before changing any configuration.
- Isolation: new project directory, no existing project or branch to disturb; a linked worktree is not applicable before the first Git repository exists.
- Publication will disclose incomplete real integrations rather than labeling a mock test as platform acceptance.
- Task 1 baseline: db2eba8; core and transport checkpoint 9/9 passed.
- Tasks 2-4 integrated checkpoint: full suite 24/24 passed, 21 JavaScript modules syntax checked; actual REA 207-tool discovery and self-owned PE target selection/state continuity passed; actual reverse-skill routes recorded in upstreams.md.
- Independent review: four material findings reproduced RED, fixed, suite GREEN. New Windows execution/locking and later REA lifecycle changes independently reviewed with no remaining material blockers. Separate skill forward-test passed 157/157 and preserved reference hash.
- Final report batching and safe diagnostics corrected from forward-test evidence using RED→GREEN tests. Finalized case evidence is immutable; new runs create new cases.
- Ruling: Windows uses Job Objects; POSIX uses cooperative process groups, not a hostile-code sandbox. Cost if wrongly assumed stronger: escaped tool side effects. Documentation explicitly requires OS isolation for untrusted code.
- Ruling: public distribution is an alpha with blocked active PentAGI execution and unrun GUI/browser/device acceptance. Cost: it cannot claim the complete autonomous security/replication capability; limitations are visible in READMEs and validation.
- Ruling: specs and verification are typed immutable evidence rather than separate authoritative loose files. Cost: consumers use the report/evidence API instead of editing spec.md directly.
- Publication checkpoint: target account verified through Git Credential Manager without printing or persisting token values. Public main commit 34a733c confirmed remotely; repository identified MIT. Full source ZIP 44 files, excluded-data violations 0. Clean ZIP installed into independent CODEX_HOME, then installed-cache MCP initialize/tools/list/doctor passed (10 tools).
