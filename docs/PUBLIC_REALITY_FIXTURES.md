# Public reality-test scenarios → acceptance levels

Source: [GitHub Issue #4](https://github.com/neconeco0306/nilo-agent-black-box/issues/4), which was already closed after collecting three **public descriptions** from an external contributor in September 2026.

These are **not authenticated executions by Nilo**, not a software integration, not proof of independent customer purchase intent, and not permission to access the other party's systems. The descriptions are reusable requirements research, not live customer evidence.

| Publicly described run | Narrow intermediate result described | What remains unknown |
| --- | --- | --- |
| Permitted public-post workflow | A permanent post URL was opened and checked after form submission | Independent signed-out visibility, reach, leads, sales |
| Update existing GitHub Discussion | A fresh full-body readback reportedly confirmed both new and preserved old content | Whether users submitted reports; support cost change |
| Storefront presentation change | Public reload reportedly showed new image assets and unchanged catalogue prices | Whether customers saw, clicked, or purchased |

Important distinction:
`tool success → owner-side save → readback of changed public state → end-user behavior → commercial outcome`.

A success at one level does **not** imply success at a later level. The matching JSON fixtures at
`fixtures/public-reality-test-cases.json` and tests at `tests/public-fixtures.test.js`
verify that later stages remain `inconclusive`, while a contributor-described
intermediate step can be marked `supported` **only as a claim-level example**.

These cases reveal three reusable acceptance rules:
- Verify a destination resource, not merely successful submission.
- On edits, preserve explicitly required old content and compare the full resulting resource.
- Verify **public** rendering separately from an authenticated admin save, and keep conversions and revenue unknown without transaction evidence.

**Next step**: only develop a provider-specific live adapter after the actual owner authorizes the exact resource, read-only access, acceptance metric, and privacy/contract conditions. No external tests were run as part of this PR.
