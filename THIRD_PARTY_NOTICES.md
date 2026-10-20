# Third-party projects

This project implements independent adapters. It does not bundle the three upstream repositories, their tools, dependencies or documentation. Upstreams must be installed and configured separately. Their names identify interoperability, not endorsement.

| Project | Inspected source revision | License at that revision | Integration |
| --- | --- | --- | --- |
| [REA](https://github.com/morluto/rea/tree/d98fc3859dbb9fc210b13ba766c447324935132d) | d98fc3859dbb9fc210b13ba766c447324935132d | MIT; Copyright (c) 2026 morluto | stdio MCP; real npm package 6.7.0 probed separately |
| [reverse-skill](https://github.com/zhaoxuya520/reverse-skill/tree/cab634bd855fc287f6e420c1f36fd1a6b9245960) | cab634bd855fc287f6e420c1f36fd1a6b9245960 | MIT; Copyright (c) 2026 zhaoxuya520 | master-route.ps1 with explicit Hint, OutDir, ProjectRoot |
| [PentAGI](https://github.com/vxcontrol/pentagi/tree/843dfeb4bfc809c09d1bc5022e567c602d8fc9dd) | 843dfeb4bfc809c09d1bc5022e567c602d8fc9dd | MIT; Copyright (c) 2025 PentAGI Development Team | HTTPS GET /api/v1/flows; active tasks blocked |

The source revisions describe inspected contracts, not a cryptographic assertion that an npm package was built from a particular commit. Keep upstream license notices when independently redistributing their code. Additional analysis tools and optional native backends have their own licenses and requirements.

The Windows Job Object launcher and test fixtures in this repository are original project code under the root MIT license. TLS test certificates/keys are generated locally and are not distributed.

## Optional pinned benchmark originals

The MIT distribution includes independently authored comparison logic and a source manifest, not these upstream source files. Provision originals and their notices separately in private test storage. The offline runner verifies every listed file hash before execution. See [benchmark manifest](benchmarks/manifest.mjs) and [boundaries](benchmarks/README.md).

| Source | Pinned revision | License observations |
| --- | --- | --- |
| tastejs/todomvc | ff43b02e59dfa604386bb382034b2cd07c2bcd8a | MIT |
| ShareX/ShareX | 4b8e66cfab23c54bf4a9d5c2bd7d10c7b2561358 | Repository GPL-3.0; retain original Crc32.cs header, whose version wording differs |
| gsantner/markor | aff9492c55a1d0a09e3b11e603a0487678bb4f27 | Repository Apache-2.0; GsTextUtils identifies Unlicense OR CC0 |

Do not redistribute third-party originals under this project's MIT license. Generated private compilation helpers retain their extraction provenance; they are not part of the public package.
