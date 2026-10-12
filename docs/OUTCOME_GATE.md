# Outcome Gate v0 — narrow outcome verification experiment

## Why this is being built
Future AI can likely create and fix websites cheaply. A durable asset, if buyer demand emerges, is whether an authorized workflow **actually produced the intended result**, using readback outside the acting AI's self-reported claims.

The first proposed vertical is an authorized, synthetic web-inquiry journey: form submission followed by a separate receiving-system readback. This is **not** a marketed SaaS or contracted client feature.

## Function and statuses
- **supported**: a declared readback matching the pre-agreed scope, time range, and observation source meets the target.
- **missed**: the declared readback falls short despite successful tool execution.
- **blocked**: missing or denied matching permission.
- **inconclusive**: insufficient, mismatched, stale, or malformed evidence.

A self-reported outcome saying "verified" is never accepted as a substitute for readback.

Run the self-contained example with: node examples/outcome-gate.mjs
Run the 18 deterministic tests with: node --test tests/outcome-gate.test.js

## Security and honesty limitations
This module checks *declared telemetry only*. The caller can forge the observation source string. Independent external authentication, durable storage, integrity protection, observer access control, trusted time, and actual external service reads are NOT implemented. A receipt is not independently authenticated. The underlying receipt schema does not correlate individual tool calls with tool results via immutable call IDs, so repeated identical tool calls can lead to ambiguous pairing. This module therefore returns "supported," NOT independently "verified."

Do not give it real credentials or confidential customer data. Do not run synthetic contact messages on third-party websites without explicit authorization. No external sending, publication, purchases, or account changes are performed by this prototype.

## Commercial validation: GO / NO-GO
Customer hypothesis: small Japanese web maintenance / workflow implementation teams willing to pay for repeatable post-fix checks, including evidence that their client's receiving system accepted a permitted synthetic inquiry. **No customer purchase intent confirmed. No sales.**

Seek three genuine conversations with appropriate, permitted buyers and at least one concrete paid pilot request before building hosted infrastructure. If that does not materialize, keep this only as an internal QA library rather than adding a new business.

## Future market, not just current demand
SLOW: web repair remains a useful small-ticket service, with acceptance checks included.
BASE: more agents operate sites and back-office workflows; track outcome success independent of agent claims.
FAST: generic code-writing and simple checking become commodities. Only authorized integration into proprietary workflow, independently observed outcomes, data, and trusted delivery relationship might remain valuable. Incumbent platforms could still provide it at no marginal cost and eliminate the standalone product.

## v0.2 safety hardening and read-only integration seam (2026-10-13)

`evaluateOutcome` rejects duplicate event IDs, contradictory permission logs,
repeated same-tool calls, and multiple results without a per-call correlation ID.
This conservative constraint intentionally covers **one operation per contract**,
not an arbitrary agent trace.

`evaluateWithReadback` (exported from `src/index.js`) adds a host-owned
integration boundary. The application must supply **trusted functions**, not
prompt-supplied implementations:

- `authority.isPaused(scope)`: fail closed unless it returns exactly `false`.
- `authority.authorizeReadback(scope)`: supply a time-bounded, read-only grant
  matching **project, run, contract, action, resource, observer, tool, metric,
  comparator, target, and max-age**.
- `authority.consumeGrant(scope)`: atomically consume a grant exactly once.
  A demo Set is not durable; production must use a genuine transaction.
- `reader.read(scope)`: inspect the actual system of record using read-only
  credentials held outside the AI and return the observed result.

The module checks expiry and pause both before and after readback. Errors are
reported as generic inconclusive results without provider error text. **It
does not implement the grant issuer, cryptographic provenance, external
credential isolation, authenticated readback, network restrictions, or durable
audit storage.** A caller-supplied fake authority or reader can fake success.
For this reason the strongest possible status remains `supported`, not
`verified`. Agent receipt permission events are merely telemetry, not real
authorization.

Run:

```bash
node --test tests/outcome-gate.test.js tests/trusted-readback.test.js tests/package-exports.test.js
node examples/outcome-gate.mjs
node examples/trusted-readback.mjs
```

The second example reads a separate **synthetic** receiving-system JSON
file. It prints `missed` for zero accepted inquiries and `supported` for one.
No public form, real customer account, secrets, or paid activity is accessed.

## 2026-10-13 commercial discovery, not proof of market fit

Observed budget-bearing 2026-10 job posts for AI workflow deployment and
software QA, but those postings **do not request this standalone library**:

- [Workflow-agent build: 150,000–200,000 JPY, 97 applications, 0 contracts at search](https://crowdworks.jp/public/jobs/13512033)
- [Software test engineer: 4,000–5,000 JPY/hour, long weekly commitment](https://crowdworks.jp/public/jobs/13499321)
- [AI-agent development: 2,000–3,000 JPY/hour, substantial weekly workload](https://crowdworks.jp/public/jobs/13517913)

These are **adjacent-market signals**, not a qualified pipeline or confirmed
opportunity; deadline/search status do not prove the apply control is open.
Platform age eligibility, guardian consent, and real ability to perform are
hard gates before applying or contracting. No unsolicited emails or
third-party tests are authorized.

Market risks: built-in outcome evaluation from agent vendors, improving
AI autonomy, commoditized e2e tests, and lengthy procurement can eliminate
standalone willingness to pay. Real wedge, if any: owner-authorized
receiving-system integrations and explicit business acceptance criteria.

**GO** only after one owner with a permitted workflow confirms a budgeted,
bounded acceptance task and a lawful contracting path. **NO-GO** for a new
hosted SaaS before payment evidence. Otherwise keep code as internal/OSS QA
support and pursue existing paid repair and workflow contracts.
