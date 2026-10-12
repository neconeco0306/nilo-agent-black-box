# Receipt consistency audit (experimental)

The default recorder captures what an agent *claims* to have done.
The optional auditor checks references and counters in a saved receipt
without blocking actions or changing the original recorder.

## Usage

```js
import { auditReceipt } from '@nilo/agent-black-box/audit';
const report = auditReceipt(receipt);
console.log(report.status, report.findings);
```

No network calls, credentials or user data uploads are needed.

The audit checks:
- event order, start/finish, run and agent identity, sequences and duplicate IDs;
- existence, ordering and approval of referenced permissions (not scope);
- unknown/forward evidence IDs, verified outcomes without evidence links;
- unmatched tool results (matched by tool name only in schema 0.2);
- summary counters compared to actual recorded events.

## Important limitations

- A `consistent` result is **not** authentication, evidence verification, tamper protection, an authorization decision, or proof of external outcomes.
- Anyone who can rewrite an unsigned receipt can rewrite its apparent evidence. Use trusted read-back, signatures or append-only storage for stronger guarantees.
- Schema v0.2 has no call ID on tool results: repeated same-name calls cannot be paired precisely.
- Permission scope (action/resource) cannot be checked against a tool call automatically in schema v0.2.
- Missing permission links are conservatively flagged even if authorization happened elsewhere.
- Verified outcomes without evidence IDs are flagged even if manual verification took place. Link the evidence to make it auditable.

The auditor is deliberately opt-in and leaves historical recorder behavior unchanged.
