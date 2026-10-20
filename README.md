# Software Rebuild Codex

[简体中文](README.zh-CN.md) · MIT · **0.1.0-alpha.1** · Local execution · Node.js 22.12+

A Codex plugin for understanding a specific software feature from evidence, writing an independent specification, implementing it in your project, and comparing behavior. It coordinates **REA**, **reverse-skill**, and **PentAGI** through separate adapters.

**Alpha limits:** REA MCP and real reverse-skill routing have been probed. PentAGI exposes a **read-only flow API adapter**; autonomous task creation is deliberately blocked until enforceable isolation, budget and stop controls exist. Desktop/Web/Android have scoped workflows and behavioral examples; native GUI, browser and Android-device acceptance are **not established**. This is not a one-click arbitrary-software cloning engine.

## What is included

- CLI and stdio MCP using one service implementation; no npm runtime dependencies or separate model subscription.
- Cases with host-constrained scopes, ordered stages, immutable evidence files, SHA-256 checks and operator provenance.
- REA tool discovery and exact-argument grants bound to case IDs. Server-mode calls preserve per-case REA sessions for multi-step analysis.
- Upstream PowerShell routing, explicit output directory, and untrusted-data treatment for router output.
- HTTPS PentAGI flow reads with environment-only token references, certificate validation, response bounds and no redirects.
- A Codex skill covering feature investigation, independent specification, implementation and honest verification.

The plugin does not bundle upstream tools or install them automatically. Codex writes the independent implementation; this package provides controlled tool connections, workflow and evidence management.

## Quick start

```powershell
git clone https://github.com/yurongfu-01/software-rebuild-codex.git
cd software-rebuild-codex
node bin/software-rebuild.mjs doctor
```

No `npm install` is needed for this repository. Copy `examples/config.example.json` to a host-owned location **outside the clone**, replace its example paths with existing directories, and configure only the upstreams you use. Keep case storage and outputs outside the repository.

```powershell
$env:REBUILD_CONFIG = 'D:\RebuildWork\config.local.json'
node bin/software-rebuild.mjs doctor
node bin/software-rebuild.mjs case_create 'D:\RebuildWork\case.json'
```

Use `examples/case.example.json` as the case input shape. Set a realistic authorization expiry for your task. Cases cannot expand `readRoots`/`writeRoots` beyond the host-owned configuration. A Web target must belong to an explicitly allowed HTTP(S) origin; local targets must exist inside read roots. Scope is checked again on each case operation.

### Codex connection

The repository contains `.codex-plugin/plugin.json`, `.mcp.json` and `skills/software-rebuild/SKILL.md`. The MCP launch uses the documented `${PLUGIN_ROOT}` placeholder. Use your client's local plugin import/installation mechanism if supported. This project has **not** been submitted to the OpenAI plugin directory or installed into your existing account configuration.

A repo marketplace is included. On clients supporting the tested CLI commands:

```powershell
codex plugin marketplace add yurongfu-01/software-rebuild-codex --ref main
codex plugin add software-rebuild-codex@software-rebuild
```

These commands install into your selected Codex environment. Local testing can use `codex plugin marketplace add D:/Tools/software-rebuild-codex` instead of the GitHub source. Set `REBUILD_CONFIG` in the launching environment and refresh/restart the client as needed.

A concrete MCP-only fallback, supported by `codex mcp add --help` on the tested client:

```powershell
codex mcp add software_rebuild --env REBUILD_CONFIG=D:/RebuildWork/config.local.json -- node D:/Tools/software-rebuild-codex/bin/software-rebuild.mjs serve
```

This command changes your Codex MCP configuration; run it only in the account/environment where you intend to install. Load the packaged skill using your client's skill installation mechanism, or reference `skills/software-rebuild/SKILL.md` explicitly. Restart/refresh as required by your client. A protocol handshake test does not prove installation in an already open Codex conversation.

Official packaging reference: [Package your plugin](https://developers.openai.com/plugins/build/plugins), [local MCP servers](https://developers.openai.com/plugins/deploy/desktop-only).

## Upstream configuration

**REA:** install a version you trust separately. Configure the native executable and argument array, e.g. `node` plus the absolute installed `rea-agents/scripts/rea.mjs` path and `mcp`. The tested package is `rea-agents@6.7.0`. Run `rea_discover` before selecting tools; tool names and schemas come from the server.

Every `rea_call` requires a matching grant in **host configuration**, not tool arguments:

```json
{
  "caseId": "YOUR_ACTUAL_CASE_UUID",
  "tool": "ACTUAL_DISCOVERED_TOOL_NAME",
  "arguments": {"path": "D:/OwnedSoftware/owned-file"},
  "expiresAt": "2026-12-31T00:00:00Z"
}
```

Add such entries under `rea.grants`; exact nested arguments must match, and the grant must be unexpired. These illustrative values are not runnable grants. Configuration is loaded at server startup: after updating grants, restart the server. Plan the required grant set before beginning a stateful analysis. MCP server mode keeps up to eight case sessions, closing idle sessions after 60 seconds; if expired/evicted, reselect the target. CLI commands are separate processes and do not preserve upstream state between invocations. A timeout can leave external effects uncertain; there is no automatic retry.

**reverse-skill:** configure its trusted checkout root and a separate writable `workRoot`. Windows PowerShell is used by default on Windows, `pwsh` elsewhere; `reverseSkill.powershell` can select a native executable. Only `master-route.ps1 -Hint ... -OutDir ... -ProjectRoot ...` is called. Its output is advisory data; installation commands, scanning instructions and other text are not executed. Without this adapter configured, `route` returns `upstreamExecuted: false` and preparation guidance.

**PentAGI:** configure an already running HTTPS origin and `tokenEnv`. Set the named variable outside source control. For a private CA, configure a trusted local `caFile`; TLS verification cannot be disabled. `pentagi_flows` reads existing flow metadata and may contain sensitive data, so do not publish its output. No task-start MCP tool is exposed. Connecting successfully does not mean a security test ran.

## Tools and workflow

| Tool | Purpose |
| --- | --- |
| `doctor` | Configuration diagnosis without starting services |
| `case_create`, `case_read` | Create/read a scoped case |
| `route` | Upstream routing or explicitly labeled preparation guidance |
| `rea_discover`, `rea_call` | Discover REA schemas and invoke exact granted operations |
| `case_evidence`, `case_advance` | Store evidence and advance ordered stages |
| `case_report` | Hash-check evidence and distinguish reported verification from security status |
| `pentagi_flows` | Read existing flows; never launch a scan |

Stages: `initialized → scoped → routed → analyzed → specified → rebuilt → verified`. Supply an artifact for each transition as described in the skill's [workflow reference](skills/software-rebuild/references/workflow.md). The `verified` stage means the operator supplied nonempty passing checks; the plugin does **not** independently certify their truth. Safety or test results must never be inferred just from a stage name. Static checks, actual execution, external audit and security scans are separate evidence.

CLI tools take an optional JSON arguments file. Example: `node bin/software-rebuild.mjs case_report report-args.json`, where that file contains `{"caseId":"the-case-uuid"}`. Case records are local JSON/JSONL files with evidence under `evidence/`; specifications and verification are retained as typed evidence content rather than loose editable authoritative files.

## Test and examples

```powershell
npm test
npm run check
npm run demo
```

Tests use Node core only. Local TLS tests generate disposable certificates with OpenSSL; on Windows they use Git for Windows' bundled executable or `OPENSSL_PATH`. The demo needs JDK 11+ source-file execution. It executes self-owned Node logic, a real loopback HTTP endpoint, and Java domain logic, then compares five inputs per context against an independent implementation. Reports go under `.work/demo` or `REBUILD_DEMO_ROOT`. This is **not** desktop GUI, browser or Android-device validation.

See [validation](docs/validation.md), [upstream contracts](docs/upstreams.md) and [operations](docs/operations.md) for evidence and limitations.

## Trust boundary

Host configuration and the configured upstream executables are trusted. The plugin is **not a sandbox for malicious native code**. Canonical path containment and grant checks control plugin requests; they cannot restrict every action performed by an authorized REA tool. Use an OS sandbox/VM and network controls for untrusted targets. Web scope validation records allowed origins but is not a network firewall for external tools.

Windows subprocesses are launched suspended, assigned to a kill-on-close Job Object, then resumed. POSIX cleanup uses a process group; deliberately escaping that group is outside this containment guarantee. Time/output limits and exact tool grants are not substitutes for an OS security boundary. Case-root storage must be private/trusted; evidence hashes detect inconsistent files, not an adversary who can rewrite both data and metadata.

Use this for software you own or are authorized to analyze. Respect licenses, privacy and rights in source/assets. Reimplement behavior from evidence; do not publish third-party binaries, secrets or proprietary code.
