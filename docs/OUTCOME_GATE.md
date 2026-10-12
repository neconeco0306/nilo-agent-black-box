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
