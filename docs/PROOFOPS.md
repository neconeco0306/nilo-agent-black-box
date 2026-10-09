# ProofOps — business-outcome acceptance (experiment)

> Experimental design. This is not a security certification, compliance
> assessment, cryptographic attestation, or proof that an external action happened.

## Customer question

When an AI agent says `done`, can a customer or operator accept that result
without reconstructing the entire run?

The answer should be based on **customer-defined acceptance criteria**, durable
evidence, and checks against the external source of truth—not model confidence.

## Offer as a scoped service first

1. Pick **one workflow** and one customer-observable goal.
2. Record the baseline, source of truth, permission scope, and acceptance rules.
3. Run the existing workflow with minimal privileges and record an Agent Receipt.
4. Preflight the receipt for internal inconsistencies using `preflightReceipt`.
5. Independently compare the post-run state with the original system or agreed
   delivered artifact. Ask a customer to accept results when appropriate.
6. Deliver a compact acceptance report: PASS / FAIL / INDETERMINATE, deviations,
   evidence links, rollback/recovery, time/cost and the next fix.
7. Obtain the customer's consent before retaining or anonymizing any operational
   data; do not pool personal or confidential customer data.

### Pilot example: a web-app bugfix

- **Input:** a public, reproducible layout issue and three agreed screen widths.
- **Done means:** a code diff exists; an independent reproduction of the original
  failure is captured; affected widths pass after the fix; regression tests pass.
- **Evidence:** target commit, test log, screenshots/measurements, independently
  checked URL or file hashes.
- **Not done:** a model wrote "fixed" without independent reproduction or post-fix test.
- **Recovery:** revert commit if release is broken.

### Pilot example: a product listing update

- **Input:** one customer-authorized listing and its approved data values.
- **Done means:** the authoritative listing **actually shows the approved values**.
- **Evidence:** pre-change snapshot, scoped permission, provider change ID and
  a separate post-change read-back with timestamp.
- **Not done:** an API returned HTTP 200, but the public listing is still unchanged.
- **Recovery:** restore previous approved values. Avoid bulk production writes
  until one-listing acceptance is demonstrated.

## Preflight in code

```js
import { preflightReceipt } from './src/acceptance.js';
const assessment = preflightReceipt(receipt, { metric: 'records_updated' });
```

- `blocked`: invalid event chain, denied action executed, tool failure, failed
  outcome, or invalid evidence link.
- `needs_review`: evidence missing, authorization not recorded, no matching
  outcome, incomplete run, or another material gap.
- `candidate`: self-reported receipt is internally consistent **only**.

**Never interpret `candidate` as business success or independently verified
evidence.** The counterparty or a separate trusted verifier must inspect the
actual system/artifacts. Receipt fields can be self-reported or altered.
Cryptographic signatures alone also do not prove a claimed business outcome.

## Why this might be durable

The adapter and model can be replaced as AI advances. The useful assets are
the customer's acceptance rubric, authorized integrations, observed outcomes,
failure cases, and ongoing relationship—not prompt recipes or generic tracing.

### Test for commercial viability

Do not build a hosted dashboard before demand. Look for:
- 3 eligible, real workflows with a specific owner and acceptance rule
- 1 buyer willing to fund a bounded external acceptance task
- measurable baseline→outcome, with explicit permission and no sensitive data
- subsequent demand for monthly checks, exception handling, or next workflow

**Stop/switch the niche** if buyers have no observable loss from failed
automation, already solve it in their existing tools, or procurement/access
costs outweigh the value. A useful OSS library is not automatically a business.
