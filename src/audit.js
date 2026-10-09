/**
 * Static consistency audit for Nilo Agent Black Box receipts.
 * Not an external verifier, cryptographic audit or security boundary.
 */
const TYPES = new Set([
  'agent.started','agent.finished','permission.check','tool.call',
  'tool.result','evidence','outcome','value','rollback'
]);

export function auditReceipt(receipt) {
  const findings = [];
  const add = (code, severity, message, sequence = null) =>
    findings.push({ code, severity, message, sequence });

  if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)) {
    add('invalid-receipt','error','Receipt must be an object.');
    return report(findings, 0);
  }
  if (!Array.isArray(receipt.events)) {
    add('invalid-events','error','Receipt events must be an array.');
    return report(findings, 0);
  }

  const events = receipt.events;
  const ids = new Set();
  const permissions = new Map();
  const evidence = new Map();
  const started = events.filter(e => e?.type === 'agent.started');
  const finished = events.filter(e => e?.type === 'agent.finished');
  if (started.length !== 1 || events[0]?.type !== 'agent.started') {
    add('invalid-start','error','Expected exactly one agent.started at the beginning.');
  }
  if (finished.length > 1 || (finished.length === 1 && events.at(-1)?.type !== 'agent.finished')) {
    add('invalid-finish','error','agent.finished must appear at most once, at the end.');
  }

  events.forEach((event, index) => {
    const seq = index + 1;
    if (!event || typeof event !== 'object' || Array.isArray(event)) {
      add('invalid-event','error','Non-object event at position ' + seq,seq);
      return;
    }
    if (event.sequence !== seq) add('sequence-mismatch','error','Sequence mismatch at position ' + seq,seq);
    if (!TYPES.has(event.type)) add('unknown-event-type','error','Unknown event type at position ' + seq,seq);
    if (event.runId !== receipt.runId || event.agentId !== receipt.agentId) {
      add('envelope-mismatch','error','Event disagrees with receipt runId/agentId at position ' + seq,seq);
    }
    if (typeof event.id !== 'string' || !event.id) {
      add('missing-event-id','error','Missing event ID at position ' + seq,seq);
    } else if (ids.has(event.id)) {
      add('duplicate-event-id','error','Duplicate event ID at position ' + seq,seq);
    } else {
      ids.add(event.id);
    }
    if (event.type === 'permission.check' && typeof event.id === 'string') permissions.set(event.id,index);
    if (event.type === 'evidence' && typeof event.id === 'string') evidence.set(event.id,index);
  });

  // v0.2 has no toolCallId on results. Same-name matching is approximate.
  const pending = new Map();
  events.forEach((event,index) => {
    if (!event || typeof event !== 'object') return;
    const seq = index + 1;
    const data = event.data && typeof event.data === 'object' ? event.data : {};

    if (event.type === 'tool.call') {
      const id = data.permissionEventId;
      if (typeof id !== 'string' || !id) {
        add('unlinked-tool-call','error','Tool call has no permission reference.',seq);
      } else if (!permissions.has(id)) {
        add('unknown-permission','error','Tool call references an unknown permission.',seq);
      } else if (permissions.get(id) >= index) {
        add('future-permission','error','Tool call references a permission recorded later.',seq);
      } else if (events[permissions.get(id)]?.data?.allowed !== true) {
        add('denied-permission-used','error','Tool call references a denied or unknown permission.',seq);
      }
      const tool = typeof data.tool === 'string' ? data.tool : '';
      if (!tool) add('unnamed-tool','warning','Tool call has no name.',seq);
      pending.set(tool,(pending.get(tool) ?? 0) + 1);
    }

    if (event.type === 'tool.result') {
      const tool = typeof data.tool === 'string' ? data.tool : '';
      if ((pending.get(tool) ?? 0) < 1) {
        add('orphan-tool-result','error','Tool result has no earlier unmatched call with the same name.',seq);
      } else {
        pending.set(tool,pending.get(tool) - 1);
      }
    }

    if (['tool.result','outcome','value'].includes(event.type)) {
      const refs = data.evidenceIds;
      if (refs !== undefined && !Array.isArray(refs)) {
        add('invalid-evidence-references','error','evidenceIds must be an array.',seq);
      } else if (Array.isArray(refs)) {
        for (const id of refs) {
          if (!evidence.has(id)) add('unknown-evidence','error','Event cites nonexistent evidence.',seq);
          else if (evidence.get(id) >= index) add('future-evidence','warning','Event cites evidence recorded later.',seq);
        }
      }
    }

    if (event.type === 'outcome' && data.status === 'verified' &&
        (!Array.isArray(data.evidenceIds) || data.evidenceIds.length === 0)) {
      add('unsupported-verified-outcome','error','Verified outcome cites no evidence.',seq);
    }
  });

  for (const [tool,unmatched] of pending) {
    if (unmatched > 0) add('unfinished-tool-calls','warning',
      String(unmatched) + ' ' + (tool || '(unnamed)') + ' call(s) have no matching result.');
  }

  const count = type => events.filter(e => e?.type === type).length;
  const summary = receipt.summary;
  const counters = {
    eventCount: events.length,
    permissionChecks: count('permission.check'),
    deniedPermissions: events.filter(e => e?.type === 'permission.check' && e.data?.allowed !== true).length,
    toolCalls: count('tool.call'),
    toolFailures: events.filter(e => e?.type === 'tool.result' && e.data?.success !== true).length,
    evidenceCount: count('evidence'),
    outcomeCount: count('outcome'),
    valueEventCount: count('value')
  };
  if (summary && typeof summary === 'object') {
    for (const [key,expected] of Object.entries(counters)) {
      if (Object.hasOwn(summary,key) && summary[key] !== expected) {
        add('summary-mismatch','error',
          'Summary ' + key + '=' + String(summary[key]) + ', recomputed=' + expected + '.');
      }
    }
  } else add('missing-summary','warning','Receipt has no summary.');

  return report(findings,events.length);
}

function report(findings,eventCount) {
  return {
    status: findings.some(f => f.severity === 'error') ? 'attention' : 'consistent',
    eventCount,
    errorCount: findings.filter(f => f.severity === 'error').length,
    warningCount: findings.filter(f => f.severity === 'warning').length,
    findings,
    limitation: 'Internal consistency only. A consistent receipt does not prove authorization, external outcomes, evidence authenticity, or tamper resistance.'
  };
}
