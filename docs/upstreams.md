# Upstream contracts and probes

Inspected 2026-10-20. Revisions and licenses are listed in [third-party notices](../THIRD_PARTY_NOTICES.md). Only adapter code and self-owned fixtures are distributed.

## REA

Package `rea-agents@6.7.0` exposes `scripts/rea.mjs mcp`. It was installed in an isolated work directory with lifecycle scripts disabled, not installed globally. Real initialize/tool discovery returned server name `rea`, version `6.7.0`, and **207 tools**. The adapter uses schemas returned by tools/list instead of assuming a copied tool catalog.

Source reference: [package manifest](https://github.com/morluto/rea/blob/d98fc3859dbb9fc210b13ba766c447324935132d/package.json).

An exact-granted real `binary_session` call succeeded. A self-owned C# fixture was compiled to a PE/CLI DLL without executing it; `open_binary` recognized PE/x86 and selected it, and the next `binary_session` in the same adapter session returned `open: true`. This confirms the stateful transport path, not deep decompilation or behavioral reconstruction of a desktop application.

Case sessions are preserved in MCP server mode. Exact grants constrain calls; they are not an OS sandbox. Optional native tools remain separately provisioned. A successful tool listing does not establish every listed backend is installed or every analysis tool works.

## reverse-skill

The actual [master router](https://github.com/zhaoxuya520/reverse-skill/blob/cab634bd855fc287f6e420c1f36fd1a6b9245960/skills/scripts/master-route.ps1) takes `-Hint`, `-OutDir`, `-ProjectRoot`, reads `skills/config/routing.json`, and writes `route-scope.md`. `lib/WorkRoot.ps1` resolves the explicitly passed work root; route output is written outside the upstream checkout.

Real probes returned:

| Hint | Result | Confidence | Exit |
| --- | --- | --- | --- |
| inspect owned .NET desktop exe | R5 / skills/dotnet-reverse/SKILL.md | high | 0 |
| analyze owned frontend JavaScript source | R0 / skills/reverse-engineering/SKILL.md | low | 0 |
| analyze owned Android APK | R1 / skills/apk-reverse/SKILL.md | high | 0 |

The Web result is an upstream fallback, not claimed as precise routing. The adapter preserves that confidence and does not silently rewrite it. Any upstream text proposing execution is returned only as untrusted advisory data.

## PentAGI

The upstream [README API section](https://github.com/vxcontrol/pentagi/blob/843dfeb4bfc809c09d1bc5022e567c602d8fc9dd/README.md) documents bearer tokens, HTTPS `/api/v1/flows`, GraphQL task creation and API schema locations. This alpha implements only the read endpoint. It has no task creation tool.

Real local HTTPS fixture tests check endpoint/auth headers, trusted/private certificates, certificate rejection, response limits, timeout, redirect rejection and closure of endless error bodies. These are adapter contracts, not a real PentAGI deployment. The local Docker Linux engine was unavailable; no deployment or live penetration test was run.
