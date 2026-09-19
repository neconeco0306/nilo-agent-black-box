# Nilo Agent Black Box

**Operational receipts for AI agents — permissions, actions, evidence, outcomes, rollback readiness, and ROI.**

AI agents can browse, call tools, edit data, send messages, and trigger workflows. A chat transcript alone is not enough to answer the operational questions that matter after an agent acts.

Nilo Agent Black Box creates a portable **Agent Receipt** that records:

- what the agent attempted
- what it was allowed to do
- which tools actually ran
- what evidence supports the claimed result
- whether the intended outcome happened
- whether the action can be rolled back
- what the run cost, saved, or earned when those values are known

It is a tiny dependency-free Node.js primitive designed to sit underneath agent frameworks rather than replace them.

```text
Permission → Tool action → Evidence → Outcome → Rollback → Business value
```

## The wedge

This is deliberately **not** another generic tracing dashboard and **not** a cryptographic-compliance product.

Observability can tell you what happened inside a run. Tamper-evident audit systems can prove a record was not silently changed. Agent Black Box focuses on the operational layer between them:

> Was the action allowed, did the intended thing actually happen, what proves it, can it be undone, and was it worth it?

## Quick start

```js
import { createBlackBox } from './src/index.js';

const box = createBlackBox({
  agentId: 'sales-agent',
  metadata: { task: 'send follow-up' }
});

const permission = box.permissionCheck({
  action: 'send_email',
  resource: 'lead@example.com',
  allowed: true,
  reason: 'User approved outreach'
});

box.toolCall({
  tool: 'gmail.send',
  input: { to: 'lead@example.com', subject: 'Follow-up' },
  permissionEventId: permission.id,
  reversible: false
});

const evidence = box.evidence({
  kind: 'message-id',
  value: 'msg_123'
});

box.toolResult({
  tool: 'gmail.send',
  success: true,
  output: { sent: true },
  evidenceIds: [evidence.id]
});

box.outcome({
  status: 'verified',
  metric: 'sent_messages',
  target: 1,
  observed: 1
});

box.value({
  costMoney: 12,
  revenueAttributed: 5000,
  profitAttributed: 4200,
  timeBeforeMinutes: 18,
  timeAfterMinutes: 3,
  humanInterventions: 1,
  confidence: 0.8,
  evidenceIds: [evidence.id]
});

const receipt = box.finish({ summary: 'Follow-up sent and verified.' });
console.log(JSON.stringify(receipt, null, 2));
```

Run the included example and tests:

```bash
node examples/basic.mjs
npm test
```

## Event model

The recorder intentionally keeps the vocabulary small:

- `agent.started`
- `permission.check`
- `tool.call`
- `tool.result`
- `evidence`
- `outcome`
- `value`
- `rollback`
- `agent.finished`

Every event includes a run ID, sequence number, timestamp, agent ID, and structured payload.

## Agent Receipt

`box.receipt()` returns the full event history plus a compact summary.

```json
{
  "schemaVersion": "0.2",
  "runId": "...",
  "agentId": "sales-agent",
  "summary": {
    "permissionChecks": 1,
    "deniedPermissions": 0,
    "toolCalls": 1,
    "toolFailures": 0,
    "evidenceCount": 1,
    "outcomeCount": 1,
    "rollbackReady": false,
    "rollbackAttempted": false,
    "rollbackSucceeded": null,
    "value": {
      "costMoney": 12,
      "revenueAttributed": 5000,
      "profitAttributed": 4200,
      "timeSavedMinutes": 15,
      "netValue": 4188,
      "roi": 349
    }
  },
  "events": []
}
```

You can also call `box.toJSONL()` for log pipelines.

## The important distinction

A tool can return `success: true` while the real task still fails.

Agent Black Box deliberately separates:

```text
Tool result ≠ Business outcome ≠ Business value
```

That makes it possible to keep low-level observability and outcome verification in the same receipt without pretending they are the same thing.

## Redaction

The recorder performs lightweight redaction for common bearer tokens, API keys, and secret-like strings before events are stored. This is a safety net, not a substitute for proper secret handling. **Do not intentionally pass credentials into traces.**

Custom patterns can be supplied:

```js
const box = createBlackBox({
  redactPatterns: [/customer-secret-[A-Z0-9]+/g]
});
```

## Good fits

- agents that send emails or messages
- coding agents that edit repositories
- browser agents that change external systems
- workflow agents that update CRM or back-office data
- multi-agent systems where responsibility needs to be attributable
- teams that want a verifiable record before expanding agent autonomy

## Design principles

**Outcome-first.** Tool success is not outcome success.

**Permission-aware.** Important actions should link to the permission decision that allowed them.

**Evidence-backed.** Claims should point to artifacts, provider IDs, hashes, measurements, or external observations when possible.

**Rollback-aware.** Reversibility should be known before an incident, not discovered during one.

**Value-aware.** Cost, time saved, revenue, and profit are optional evidence-backed fields — not invented estimates.

**Portable.** Receipts are plain JSON / JSONL and can be stored anywhere.

## What this is not

This is not a full observability platform, policy engine, sandbox, cryptographic audit system, or security boundary. It is the smallest useful primitive for producing operational agent receipts. Hosted search, adapters, policy hooks, cryptographic signing, and anomaly detection can sit on top of the format.

## Roadmap

- OpenAI / MCP / generic tool-call adapters
- policy / permission adapters
- rollback registry
- hosted searchable receipt explorer
- deeper ProofLoop outcome-verification hooks
- optional tamper-evident / signed receipt layer
- anomaly and unauthorized-action detection

## Status

`0.1.x` is an experimental OSS preview extracted from Nilo's internal ProofLoop / Agent Receipt work. The public API and schema may change while real integrations are tested.

## Reality test: 3 external-action fixtures completed

The first reality test collected three sanitized agent runs on materially different external surfaces:

- Reddit browser/public-post flow
- GitHub Discussion mutation plus authoritative read-back
- Creem back-office asset update plus fresh public rendering verification

The main finding is that operational success, externally verified state, downstream user behavior, and business value need to stay separate. Unknown conversion, revenue, time saved, and rollback execution remain unknown rather than being inferred.

→ [Read the mapped fixtures and schema findings](./docs/REALITY_TEST.md)

The original collection issue is complete: [#4](https://github.com/neconeco0306/nilo-agent-black-box/issues/4).

## Contributing

See `CONTRIBUTING.md`. Real agent failure modes, missing audit fields, interoperability cases, and evidence-verification examples are especially useful.

## Security

See `SECURITY.md`. Please do not publish real credentials or customer-private data in issues, examples, or fixtures.

## License

MIT
