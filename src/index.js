import { randomUUID } from 'node:crypto';

const VALID_TYPES = new Set([
  'agent.started',
  'agent.finished',
  'permission.check',
  'tool.call',
  'tool.result',
  'evidence',
  'outcome',
  'value',
  'rollback'
]);

function nowIso() {
  return new Date().toISOString();
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function cleanObject(value) {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) return value.map(cleanObject);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cleanObject(item)])
    );
  }
  if (['string', 'number', 'boolean'].includes(typeof value)) return value;
  return String(value);
}

function redactValue(value, patterns) {
  if (typeof value === 'string') {
    return patterns.reduce((text, pattern) => text.replace(pattern, '[REDACTED]'), value);
  }
  if (Array.isArray(value)) return value.map((item) => redactValue(item, patterns));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, redactValue(item, patterns)])
    );
  }
  return value;
}

function normalizeValueFields({
  costMoney = null,
  revenueAttributed = null,
  profitAttributed = null,
  timeBeforeMinutes = null,
  timeAfterMinutes = null,
  timeSavedMinutes = null,
  humanInterventions = null,
  confidence = null,
  evidenceIds = [],
  note = ''
} = {}) {
  const before = numberOrNull(timeBeforeMinutes);
  const after = numberOrNull(timeAfterMinutes);
  const explicitSaved = numberOrNull(timeSavedMinutes);
  const derivedSaved = explicitSaved ?? (
    before !== null && after !== null ? Math.max(0, before - after) : null
  );

  return {
    costMoney: numberOrNull(costMoney),
    revenueAttributed: numberOrNull(revenueAttributed),
    profitAttributed: numberOrNull(profitAttributed),
    timeBeforeMinutes: before,
    timeAfterMinutes: after,
    timeSavedMinutes: derivedSaved,
    humanInterventions: numberOrNull(humanInterventions),
    confidence: numberOrNull(confidence),
    evidenceIds,
    note
  };
}

function sumKnown(events, field) {
  const values = events
    .map((event) => numberOrNull(event.data?.[field]))
    .filter((value) => value !== null);
  return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
}

function buildValueSummary(events) {
  const costMoney = sumKnown(events, 'costMoney');
  const revenueAttributed = sumKnown(events, 'revenueAttributed');
  const profitAttributed = sumKnown(events, 'profitAttributed');
  const timeSavedMinutes = sumKnown(events, 'timeSavedMinutes');
  const humanInterventions = sumKnown(events, 'humanInterventions');
  const netValue = profitAttributed === null ? null : profitAttributed - (costMoney ?? 0);
  const roi = costMoney && netValue !== null ? netValue / costMoney : null;

  return {
    costMoney,
    revenueAttributed,
    profitAttributed,
    netValue,
    roi,
    timeSavedMinutes,
    humanInterventions
  };
}

export class AgentBlackBox {
  constructor(options = {}) {
    this.runId = options.runId || randomUUID();
    this.agentId = options.agentId || 'unknown-agent';
    this.startedAt = options.startedAt || nowIso();
    this.events = [];
    this.redactPatterns = options.redactPatterns || [
      /sk-[A-Za-z0-9_-]{12,}/g,
      /Bearer\s+[A-Za-z0-9._-]+/gi,
      /(?:api[_-]?key|token|secret)\s*[:=]\s*[^\s,}]+/gi
    ];

    this.record('agent.started', {
      agentId: this.agentId,
      metadata: options.metadata || {}
    });
  }

  record(type, data = {}) {
    if (!VALID_TYPES.has(type)) throw new Error(`Unsupported event type: ${type}`);

    const event = {
      id: randomUUID(),
      runId: this.runId,
      agentId: this.agentId,
      sequence: this.events.length + 1,
      type,
      timestamp: nowIso(),
      data: redactValue(cleanObject(data), this.redactPatterns)
    };

    this.events.push(event);
    return event;
  }

  permissionCheck({ action, resource, allowed, reason = '', policy = null }) {
    return this.record('permission.check', {
      action,
      resource,
      allowed: Boolean(allowed),
      reason,
      policy
    });
  }

  toolCall({ tool, input = null, permissionEventId = null, reversible = null }) {
    return this.record('tool.call', { tool, input, permissionEventId, reversible });
  }

  toolResult({ tool, success, output = null, error = null, evidenceIds = [] }) {
    return this.record('tool.result', {
      tool,
      success: Boolean(success),
      output,
      error,
      evidenceIds
    });
  }

  evidence({ kind, uri = null, value = null, hash = null, note = '' }) {
    return this.record('evidence', { kind, uri, value, hash, note });
  }

  outcome({
    status,
    metric = null,
    target = null,
    observed = null,
    note = '',
    ...valueFields
  }) {
    return this.record('outcome', {
      status,
      metric,
      target,
      observed,
      ...normalizeValueFields({ ...valueFields, note })
    });
  }

  value(fields = {}) {
    return this.record('value', normalizeValueFields(fields));
  }

  rollback({ available, method = null, attempted = false, success = null, note = '' }) {
    return this.record('rollback', {
      available: Boolean(available),
      method,
      attempted: Boolean(attempted),
      success,
      note
    });
  }

  finish({ status = 'completed', summary = '' } = {}) {
    this.record('agent.finished', { status, summary });
    return this.receipt();
  }

  receipt() {
    const permissions = this.events.filter((event) => event.type === 'permission.check');
    const toolCalls = this.events.filter((event) => event.type === 'tool.call');
    const toolResults = this.events.filter((event) => event.type === 'tool.result');
    const outcomes = this.events.filter((event) => event.type === 'outcome');
    const valueEvents = this.events.filter((event) => event.type === 'value');
    const rollbacks = this.events.filter((event) => event.type === 'rollback');
    const evidence = this.events.filter((event) => event.type === 'evidence');
    const valueSource = valueEvents.length ? valueEvents : outcomes;
    const attemptedRollbacks = rollbacks.filter((event) => event.data.attempted);
    const successfulRollbacks = attemptedRollbacks.filter((event) => event.data.success === true);

    return {
      schemaVersion: '0.2',
      runId: this.runId,
      agentId: this.agentId,
      startedAt: this.startedAt,
      endedAt: this.events.at(-1)?.timestamp || null,
      summary: {
        eventCount: this.events.length,
        permissionChecks: permissions.length,
        deniedPermissions: permissions.filter((event) => !event.data.allowed).length,
        toolCalls: toolCalls.length,
        toolFailures: toolResults.filter((event) => !event.data.success).length,
        evidenceCount: evidence.length,
        outcomeCount: outcomes.length,
        valueEventCount: valueEvents.length,
        rollbackRecorded: rollbacks.length > 0,
        rollbackReady: rollbacks.some((event) => event.data.available),
        rollbackAttempted: attemptedRollbacks.length > 0,
        rollbackSucceeded: attemptedRollbacks.length > 0
          ? successfulRollbacks.length === attemptedRollbacks.length
          : null,
        value: buildValueSummary(valueSource)
      },
      events: [...this.events]
    };
  }

  toJSONL() {
    return this.events.map((event) => JSON.stringify(event)).join('\n');
  }
}

export function createBlackBox(options = {}) {
  return new AgentBlackBox(options);
}
