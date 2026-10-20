# Harness compatibility and open-source validation plan

Approved scope: 2026-10-20. User confirmed ten MCP-capable harness targets including Hermes Agent, Aider workflow fallback, isolated local testing, and publication of reviewed updates to the existing repository. This extends the existing packaging flow; the MCP tool core and authority model remain unchanged.

## Deliverables

1. A CLI-only `harness_export` command that generates host-specific MCP configuration fragments, portable workflow skills and installation notes into a newly created output directory. It does not install into real user profiles, merge settings, disable prompts or run a client automatically.
2. Profiles for Codex, Claude Code, Cursor, Cline, Roo Code, Windsurf/legacy versus current Devin guidance, Gemini CLI, OpenCode, Kiro and Hermes Agent. Aider receives an explicitly CLI-only workflow. Exact native structures follow checked official references; OpenCode uses command array/environment, Hermes YAML mcp_servers, Codex TOML, others documented JSON mcpServers.
3. Reproducible tests against pinned real TodoMVC, ShareX and Markor functional slices. Source/third-party licenses stay in isolated work storage, not the MIT runtime package. Outputs separate original execution, specification, independent behavior implementation, comparisons and platform limitations.
4. Installed-client verification where available in an isolated profile, plus clearly labeled schema/protocol-only checks elsewhere. Native/client execution, model-mediated agent use, GUI/device acceptance and mere configuration generation are distinct results.

## Files and ownership

- Primary implementer: src/harness.mjs, CLI integration, version metadata, test/harness.test.mjs, docs/harnesses.md and README updates.
- Open-source validation worker: benchmarks/** and scripts/bench-oss.mjs only; private downloads/artifacts under the session work/oss-benchmarks directory. No shared file writes or real client profile edits.
- Independent reviewer: read-only final diff, tests and evidence; no implementation edits.

## Task 1 — Safe export flow

- [ ] Write failing tests for all eleven profile outputs, exact native shapes, skill/reference inclusion, absolute paths with spaces, invalid/unknown profiles, nonexistent inputs and existing-output refusal.
- [ ] Implement renderProfiles(options) and exportProfiles(options) with a strict input allowlist, no secret values, existing absolute source/config paths, and exclusive new output creation. No shell invocation or host mutations.
- [ ] Integrate `node bin/software-rebuild.mjs harness_export request.json` outside the MCP tool surface. Preserve existing ten tools.
- [ ] Run profile tests, complete suite and static checks. Make version metadata consistent for alpha.2.

## Task 2 — Real open-source functional tests

- [ ] Pin source revisions and per-file hashes/licenses before running any reference code. Inspect each executed slice and retain exact original files.
- [ ] TodoMVC: execute original ES5 model/store in a restricted VM; compare CRUD, filters, counters and ID behavior against a separately authored implementation. Optional browser validation must be separately labeled.
- [ ] ShareX: compile original standalone Crc32.cs in isolated storage; compare CRC vectors and actual API offset behavior. Preserve and explicitly report any upstream boundary defect instead of changing expected results to idealized behavior.
- [ ] Markor: compile original comparator and exact minimal dependency slice with clear attribution; compare order/sign results and sorting sequences. Do not claim APK/device execution.
- [ ] Record substantive evidence and stages through the existing plugin, not only standalone unit assertions. New evidence or behavior changes require fresh cases; retain all failing outcomes.

## Task 3 — Harness verification

- [ ] Generate all profiles and parse their documented JSON/TOML/YAML structures with independent parsers.
- [ ] In separate client profile directories, test available native loaders and real MCP discovery/calls without paid model requests. Do not run the custom Hermes Windows wrapper, which may repair the real install; use approved raw Python/source entry points and HERMES_HOME.
- [ ] For unavailable GUI clients, record configuration/schema and direct protocol results without claiming actual host execution.
- [ ] Include installed-client versions, exact commands, expected/actual results, evidence paths and limitations in the compatibility matrix.

## Task 4 — Review and release

- [ ] Independently review path/overwrite handling, profile formats, secret references and test truthfulness; fix blockers and rerun affected checks.
- [ ] Update source status, upstream notices, READMEs and validation evidence. Keep original upstream code and live profiles out of source history/packages.
- [ ] Publish the reviewed update to yurongfu-01/software-rebuild-codex, verify remote commit/visibility/CI and release assets. Retain D-drive handoff and hashes.

## Acceptance and stops

An export is successful only when native files and workflow resources are complete and existing output/profile files are preserved. A tested functional slice is successful only when the actual fixed original and reproduction ran against meaningful inputs with reported differences. A harness is runtime-tested only if that actual client loaded the server or issued tools; a generic MCP client is not a substitute.

Missing Docker, model credentials, SDKs, GUI clients or Android devices must remain explicit limitations. This task does not enable autonomous PentAGI scans or broaden analysis authorization. Public publication authorization persists for this project; it does not permit publishing third-party samples or private profiles.
