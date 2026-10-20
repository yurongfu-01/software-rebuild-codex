# Project state

Version: 4. Updated: 2026-10-20. Owner: primary implementer; user is repository owner and future operator.

Phase: reviewed alpha source publicly published; final local suite 24/24, isolated skill forward-test 157/157, clean ZIP installation and installed-cache MCP execution passed. Full product runtime acceptance remains incomplete as listed below.

Confirmed requirements: three adapters under unified orchestration; desktop/Web/Android workflow coverage; MIT; public repository yurongfu-01/software-rebuild-codex. User explicitly authorized continuous planning, development, testing and public publication.

Implemented: scoped cases, evidence integrity/provenance, concurrent-writer locks, CLI/MCP, retained REA case sessions, upstream router, read-only HTTPS PentAGI flows, Windows Job Object cleanup, Codex skill and marketplace, self-owned examples, CI and documentation.

Evidence: [validation](validation.md), [upstream contracts](upstreams.md), [implementation plan](implementation-plan.md), [operations](operations.md). Source design baseline: [design](design.md).

Acceptance limitations: live PentAGI not deployed; active scans blocked; actual native GUI/browser/Android-device reconstruction not run; existing account/chat plugin activation not attempted. These remain explicit limitations, not silent passes.

Publication: https://github.com/yurongfu-01/software-rebuild-codex confirmed public, main branch, MIT. First implementation publication commit: 34a733cca80f4caa50300d6169da035ae25c8854. Clean source ZIP had no .work, cases, node_modules or local credentials; independent CODEX_HOME installation exposed 10 tools and ran doctor successfully. Current account/chat configuration was not changed.

Handoff: GitHub Release contains the packaged alpha and release notes; latest CI result is authoritative on the repository Actions page. The initial CI run was still in progress at this source-status update. Final package hashes and actual release/CI observations are retained in the local release handoff. No continuous operations are configured. Deployment of upstream services is outside this release.
