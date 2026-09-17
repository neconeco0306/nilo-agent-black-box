# Receipt schema v0.2

A receipt is a portable JSON document representing one agent run.

## Top-level fields

| Field | Type | Meaning |
| --- | --- | --- |
| `schemaVersion` | string | Receipt schema version |
| `runId` | string | Stable identifier for the run |
| `agentId` | string | Agent identity or strategy label |
| `startedAt` | ISO-8601 string | Run start time |
| `endedAt` | ISO-8601 string or null | Last recorded event time |
| `summary` | object | Compact operational counters and value summary |
| `events` | array | Ordered event ledger |

## Event envelope

Every event contains:

```json
{
  "id": "uuid",
  "runId": "uuid",
  "agentId": "agent-name",
  "sequence": 1,
  "type": "tool.call",
  "timestamp": "2026-09-17T00:00:00.000Z",
  "data": {}
}
```

## Event types

### `agent.started`
Records run metadata at initialization.

### `permission.check`
Captures the decision that allowed or denied an action.

Recommended fields: `action`, `resource`, `allowed`, `reason`, `policy`.

### `tool.call`
Records an intended external or internal tool invocation.

Recommended fields: `tool`, `input`, `permissionEventId`, `reversible`.

### `tool.result`
Records tool completion separately from the intended business outcome.

Recommended fields: `tool`, `success`, `output`, `error`, `evidenceIds`.

### `evidence`
Attaches proof of an observed change or result.

Recommended fields: `kind`, `uri`, `value`, `hash`, `note`.

### `outcome`
Records whether the intended result was actually achieved.

Recommended fields: `status`, `metric`, `target`, `observed`, `note`.

For backwards compatibility, value fields may also be attached to an outcome.

### `value`
Records optional, evidence-backed business value for the run.

Supported fields:
- `costMoney`
- `revenueAttributed`
- `profitAttributed`
- `timeBeforeMinutes`
- `timeAfterMinutes`
- `timeSavedMinutes`
- `humanInterventions`
- `confidence`
- `evidenceIds`
- `note`

The receipt summary derives:
- `netValue = profitAttributed - costMoney`
- `roi = netValue / costMoney` when cost is non-zero
- total time saved
- total human interventions

### `rollback`
Records whether reversal exists and whether it was attempted.

Recommended fields: `available`, `method`, `attempted`, `success`, `note`.

### `agent.finished`
Closes the run with a final status and summary.

## Design rules

`tool.result.success = true` means the tool call completed. It does **not** prove that the user's intended result happened.

Likewise, a verified outcome does not automatically imply economic value.

```text
Tool result ≠ Business outcome ≠ Business value
```

Keep all three separate whenever possible and link claims to evidence IDs when evidence exists.
