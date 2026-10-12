# ProofOps sample delivery — PR #6 CI acceptance (self-owned example)

**Demonstration only.** This documents the outcome of an internal OSS change, not a
paid customer project, production deployment, independent security audit, or
business-outcome success. The repository owner also authored the change.

## Customer-style brief and acceptance contract

A change to the experimental receipt preflight should satisfy these *bounded*
criteria:

1. The implementation and tests are traceable to one immutable Git commit.
2. The repository's own CI runs its full Node test command against that commit.
3. The workflow concludes successfully and reports zero failed tests.
4. No claim is made about real customers, secure production deployment, or
   whether an external agent actually completed its business objective.

## Evidence bundle

| Item | Observed evidence | Meaning / limitation |
| --- | --- | --- |
| Target | [Draft PR #6](https://github.com/neconeco0306/nilo-agent-black-box/pull/6) | Proposed experiment, **not merged** |
| Reviewed revision | `2fdaedd062e627a89d69211df813ece7e9375070` | Exact code at time of the checked CI run |
| CI | [GitHub Actions run 37890623750](https://github.com/neconeco0306/nilo-agent-black-box/actions/runs/37890623750) | Provider reported **completed / success** for this SHA |
| Test step | `npm test` | GitHub Actions job step reported **success** |
| Test count | 26 tests; 26 passed; 0 failed | Confirmed in the runner's job log, **only tests exercised in that run** |
| Demonstration | `node examples/basic.mjs` then JSON parse | Both steps reported success; proves format output in CI only |

## Result: PASS (CI contract only)

The particular *CI acceptance contract above* passed at the noted commit.
**Business outcome: INDETERMINATE.** No customer requested an action, no external
production-system readback occurred, no purchase or revenue was observed, and
no third-party security certification has been performed.

The conclusion would become **NOT REPRODUCED / NEEDS REVIEW** if:
- a fresh check at the same SHA cannot recover the matching green CI run,
- job logs do not support the claimed test count,
- an acceptance goal requires a browser or external provider check absent here,
- or a target business result is reported without a separately verifiable source.

## What a real buyer would receive

For one agreed real problem, replace this self-owned example with:
- one **buyer-defined** goal and acceptance criteria *before* the work;
- baseline evidence of the failure;
- scoped approval and source-of-truth identification;
- change diff / delivery artifact;
- independent post-change checks against the actual environment;
- PASS / FAIL / INDETERMINATE per acceptance criterion, never a fabricated green;
- rollback steps, excluded scope, and next recommended action.

**Privacy:** no customer credentials, user PII, or confidential data in public
receipts. Do not publish client names or anonymized case records without consent.

## Why it is not already product-market fit

Passing CI is an engineering proof, not proof that a customer has this problem
or will pay for this service. Commercial validation requires a real request,
eligible buyer, accepted delivery, and confirmed payment. Keep this distinction
in all sales messages.
