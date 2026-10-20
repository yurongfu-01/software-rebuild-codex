# Design baseline v1

Approved 2026-10-20, including MIT licensing and public GitHub publication. Repository: yurongfu-01/software-rebuild-codex.

The product coordinates a specific feature investigation across desktop, Web and Android. Three separate adapters connect REA MCP, reverse-skill routing and a separately deployed PentAGI service. Codex uses the supplied skill to investigate, write an independent functional specification, implement in an explicitly selected destination and compare behavior.

CLI and local stdio MCP share a Node.js service. There is no new management GUI, separate model service or automatic cloud deployment. Upstreams remain separate installations with their own requirements and licenses. A host-owned configuration constrains roots, service endpoints and exact per-case REA tool/argument grants. Target artifacts and upstream text are untrusted data.

Cases retain scope, transitions, attributed evidence, hashes and verification records. Stages advance in order only when substantive artifacts exist. Evidence supplied by the operator is labeled as such. Verification stage names do not prove independent runtime execution; security validation is separate. The first release must distinguish real service probes, fixture contracts and missing GUI/device acceptance.

Active PentAGI jobs require enforceable target isolation, budget and verified stopping behavior. Until those exist the adapter blocks task creation and may read existing service metadata. No arbitrary tool execution is authorized merely by installing the plugin.

Before writing destination code, Codex inspects project rules and uncommitted changes and preserves a patch/snapshot. UI/interaction design confirmation follows the operator's existing rules. The plugin does not copy third-party proprietary source or assets and does not overwrite the destination automatically.

Validation covers scope/link escape, exact grants, evidence integrity, protocol bounds, process cleanup, interrupted responses and concurrent writers. Independent review is required for execution and storage boundaries. Distribution contains source, local plugin metadata, skills, examples, documentation and validation evidence; real analysis cases and credentials are excluded.

Source publication is distinct from full product acceptance. The alpha may be publicly inspectable with explicitly incomplete runtime acceptance, provided tested boundaries and review blockers are resolved and documented. No claim is made that arbitrary software can be perfectly reconstructed.
