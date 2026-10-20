# Third-party projects

This project implements independent adapters. It does not bundle the three upstream repositories, their tools, dependencies or documentation. Upstreams must be installed and configured separately. Their names identify interoperability, not endorsement.

| Project | Inspected source revision | License at that revision | Integration |
| --- | --- | --- | --- |
| [REA](https://github.com/morluto/rea/tree/d98fc3859dbb9fc210b13ba766c447324935132d) | d98fc3859dbb9fc210b13ba766c447324935132d | MIT; Copyright (c) 2026 morluto | stdio MCP; real npm package 6.7.0 probed separately |
| [reverse-skill](https://github.com/zhaoxuya520/reverse-skill/tree/cab634bd855fc287f6e420c1f36fd1a6b9245960) | cab634bd855fc287f6e420c1f36fd1a6b9245960 | MIT; Copyright (c) 2026 zhaoxuya520 | master-route.ps1 with explicit Hint, OutDir, ProjectRoot |
| [PentAGI](https://github.com/vxcontrol/pentagi/tree/843dfeb4bfc809c09d1bc5022e567c602d8fc9dd) | 843dfeb4bfc809c09d1bc5022e567c602d8fc9dd | MIT; Copyright (c) 2025 PentAGI Development Team | HTTPS GET /api/v1/flows; active tasks blocked |

The source revisions describe inspected contracts, not a cryptographic assertion that an npm package was built from a particular commit. Keep upstream license notices when independently redistributing their code. Additional analysis tools and optional native backends have their own licenses and requirements.

The Windows Job Object launcher and test fixtures in this repository are original project code under the root MIT license. TLS test certificates/keys are generated locally and are not distributed.
