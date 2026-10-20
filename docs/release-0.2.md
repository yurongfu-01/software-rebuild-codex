# 0.2.0-alpha.1

Software feature investigation now shares its MCP core across ten Harness configuration/skill exports: Codex, Claude Code, Cursor, Cline, Roo Code, Windsurf, Gemini CLI, OpenCode, Kiro and Hermes Agent. Aider receives a CLI-only workflow. `harness_export` writes a new directory and never merges or installs daily client settings.

Pinned TodoMVC, ShareX and Markor source slices were actually executed and compared with independent implementations: 715/715 comparisons passed, recorded through three plugin cases. The offline runner checks hashes, executes verified private snapshots, preserves existing output, and publishes no upstream originals.

Validation: 33 local regression tests passed; one optional real-source guard skipped in default suite and passed in the separate 6/6 source test run. Static checks passed. Independent implementation and incremental snapshot reviews found no blocking issue. Native Claude/Gemini connected in isolated profiles; Hermes discovered ten tools and called doctor through its native handler. No model requests were made.

Limitations: complete GUI, browser DOM, Android devices/APKs, every Harness runtime and full model loops remain untested. PentAGI active tasks remain blocked. See [validation](validation-0.2.md), [Harness matrix](harnesses.md) and [benchmark reproduction](../benchmarks/README.md).

Rollback: select the previous release in a separate checkout and restore your selected client's prior configuration. Export itself changes no client settings. Keep case storage private; do not destructively rewrite existing evidence. No upstream service was deployed and no continuous operations are configured.
