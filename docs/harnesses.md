# Harness adapters — 0.2.0-alpha.1

The existing ten-tool MCP service is shared by ten client profiles. Aider has an additional CLI-only workflow. Export creates a **new directory**; it never installs, merges or overwrites daily client configuration. Paths point to your current local plugin, native Node executable and host policy. Regenerate after moving them.

Edit the absolute paths in `examples/harness-export.example.json`, then run:

```powershell
node bin/software-rebuild.mjs harness_export D:/RebuildWork/export-request.json
```

Choose `all` or an ID below. The host policy must already exist. No policy contents or credentials are copied. Review each generated `INSTALL.md` and merge only its server entry into the chosen client environment. Preserve normal client trust and tool permission prompts. Project configuration support does not imply project trust or immediate activation in an open session.

| ID | Configuration | Native runtime evidence, 2026-10-20 |
| --- | --- | --- |
| codex | TOML `mcp_servers` | Prior isolated plugin install/MCP execution passed; new profile parsed, new native profile not exercised |
| claude-code | `.mcp.json` | 2.1.237 native `mcp get`: Connected; no tool invocation |
| cursor | `.cursor/mcp.json` | Generated and parsed; client not tested |
| cline | extension-managed `cline_mcp_settings.json` | Generated and parsed; client not tested |
| roo-code | `.roo/mcp.json` | Generated and parsed; client not tested |
| windsurf | global `mcp_config.json` | Generated and parsed; client not tested; consult installed version's location |
| gemini-cli | `.gemini/settings.json` | 0.60.0 native `mcp list`: Connected; no tool invocation |
| opencode | `opencode.json`, command array/environment | Generated and parsed; client not tested |
| kiro | `.kiro/settings/mcp.json` | Generated and parsed; client not tested |
| hermes-agent | `HERMES_HOME/config.yaml`, `mcp_servers` | 0.21.6+122.gcbe5e53 native loader/discovery: 10 tools; native handler doctor passed |
| aider | `WORKFLOW.md` | CLI fallback; no native MCP compatibility asserted |

All ten generated launch configurations were independently parsed using JSON, Python TOML and PyYAML and compared with the intended executable, arguments and environment. This is format validation, not runtime acceptance. Portable skill resources are included; automatic skill discovery/invocation has not been established across all clients.

Claude, Gemini and Hermes checks used disposable profiles. Gemini trusted only the disposable probe folder; tool automatic approval was not enabled. Hermes used its installed Python 3.11 environment and actual native MCP modules, not the full interactive model loop. These probes made no model requests. No existing user profile was changed.

Current Windsurf documentation redirects to Devin Desktop, whose Windows global file is `%APPDATA%/devin/mcp_config.json`; older clients may differ. `.windsurf/skills` remains a documented legacy path; Devin prefers `.devin/skills`. Cline's exported filename is a merge snippet, not project auto-discovery. Kiro custom agents may require a `skill://` resource declaration. Generated INSTALL files link the relevant official documentation.

For real upstream calls, configure REA/router/PentAGI separately and retain the host scope/grant checks. An MCP connection alone does not establish upstream connectivity, application reconstruction, a security scan, or model-mediated tool use.
