# Revenue-Path Pilot — scope, sale and verification

**State: NOT SOLD / NOT DEPLOYED.** This is an offer experiment, not proof of buyer demand, a real client outcome or a production product.

## Positioning

One identified inquiry, booking or purchase-path defect: **reproduce it, fix or specify the fix, and retest against the same acceptance criterion**. Do not market this as a generic AI monitoring platform or as a guarantee of revenue growth.

## Who to approach

Only a buyer with an explicit open paid repair/QA need and an eligible, authorized application channel. Published open recruitment is not itself a purchase order. Respect age/guardian consent, existing contact limits, and all platform/application rules.

## Client deliverable and boundaries

1. Agree exactly one workflow, one target and one observable acceptance check.
2. Capture pre-intervention behavior (time/version, viewport, reproduction instructions) **only on authorized public or test surfaces**.
3. Provide a minimal bug report and either a change proposal or a scoped, authorized patch. Never change production, log in, submit forms, handle payment data or run vulnerability scans without relevant permission and review.
4. Recheck the same expected behavior. Deliver a one-page evidence packet: initial state, reproduction, change, verification, residual risks and a clear PASS / PARTIAL / NOT_READY conclusion.
5. Business impact remains **UNKNOWN** until independently measured, authorized customer outcomes exist. Page checks, script outputs and demo metrics are not sales.

## Price and economics

A first small task might be quoted around **JPY 5,000**, but only for a bounded, mutually agreed scope. No firm quote, turnaround promise, unlimited fixes, or sales guarantee without examining the work. Source all revenue claims from real payment/receipt evidence; no customer data in this public repository.

## Decision gates

- **Now**: prioritize actual paid open calls. Do not add a large new SaaS, user dashboard, agent hierarchy or cloned ledger.
- **30 days**: aim for >=1 genuinely paid pilot. If none, stop platform development and change the offer or audience using rejection evidence.
- **90 days**: require >=3 paying pilots, lawful comparable before/after measurements and explicit willingness to pay for recurring checks before testing a subscription.
- **Longer term**: maintain customer workflow access, consented evidence, measured outcomes and independent verification outside the replaceable AI model. Standard platform features are a serious substitution risk, not a moat.
- SECOND private Draft PR #29 remains **NOT_READY**. Do not auto-merge or treat repository demos as real customer evidence.

## Offline proof (synthetic fixture only)

```bash
node examples/revenue-path-demo.mjs
node --test test/revenue-path-demo.test.mjs
```

The demo records permission → mock tool action → mock provider acknowledgment → **unverified business outcome**. No HTTP requests, customer data, form submissions, bookings, real payments or actual revenue. Its purpose is to demonstrate why an agent returning success cannot by itself prove a business result.
