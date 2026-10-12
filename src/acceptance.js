/**
 * ProofOps receipt preflight (experimental).
 *
 * This only checks internal consistency of a self-reported receipt. It does NOT
 * independently observe the external system, verify cryptographic signatures,
 * grant authorization, or certify business outcomes.
 */
export function preflightReceipt(receipt, { metric = null, requireEvidence = true } = {}) {
  const problems = [];
  const flag = (severity, code, detail) => problems.push({ severity, code, detail });
  if (!receipt || typeof receipt !== 'object' || !Array.isArray(receipt.events) ||
      typeof receipt.runId !== 'string' || !receipt.runId.trim()) {
    return { state: 'blocked', problems: [{ severity: 'block', code: 'invalid_receipt', detail: 'Missing runId or event array' }] };
  }

  const events = receipt.events;
  const seen = new Set();
  const byId = new Map();
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (!event || typeof event !== 'object' || typeof event.id !== 'string' ||
        !event.id || seen.has(event.id) || event.runId !== receipt.runId ||
        event.sequence !== i + 1 || !event.data || typeof event.data !== 'object') {
      flag('block', 'invalid_event_chain', `Invalid event at index ${i}`);
      continue;
    }
    seen.add(event.id);
    byId.set(event.id, event);
  }

  const evidence = events.filter(event => event?.type === 'evidence');
  const calls = events.filter(event => event?.type === 'tool.call');
  const results = events.filter(event => event?.type === 'tool.result');
  const outcomes = events.filter(event => event?.type === 'outcome');
  const endings = events.filter(event => event?.type === 'agent.finished');

  if (endings.length !== 1 || events.at(-1)?.type !== 'agent.finished') {
    flag('review', 'not_finalized', 'Exactly one final event is required at the end');
  }

  for (const call of calls) {
    const id = call.data?.permissionEventId;
    if (!id) {
      flag('review', 'permission_missing', `No permission event linked for tool ${call.data?.tool || '?'}`);
      continue;
    }
    const permission = byId.get(id);
    if (!permission || permission.type !== 'permission.check' ||
        permission.sequence >= call.sequence) {
      flag('block', 'permission_link_invalid', `Invalid permission reference for tool ${call.data?.tool || '?'}`);
    } else if (permission.data?.allowed !== true) {
      flag('block', 'denied_action', `Action ${call.data?.tool || '?'} linked to denied permission`);
    }
  }

  const distinctTools = new Set(calls.map(call => call.data?.tool).filter(Boolean));
  for (const tool of distinctTools) {
    const callCount = calls.filter(call => call.data?.tool === tool).length;
    const toolResults = results.filter(result => result.data?.tool === tool);
    if (toolResults.some(result => result.data?.success === false)) {
      flag('block', 'tool_failed', `Tool ${tool} reported failure`);
    }
    if (toolResults.filter(result => result.data?.success === true).length < callCount) {
      flag('review', 'tool_result_missing', `Cannot match all calls to successful results for ${tool}`);
    }
  }

  for (const result of results) {
    for (const id of result.data?.evidenceIds || []) {
      const ref = byId.get(id);
      if (!ref || ref.type !== 'evidence' || ref.sequence >= result.sequence) {
        flag('block', 'result_evidence_invalid', `Invalid evidence reference in tool result ${result.id}`);
      }
    }
  }

  const relevant = metric === null ? outcomes : outcomes.filter(x => x.data?.metric === metric);
  if (!relevant.length) flag('review', 'outcome_missing', 'No matching outcome recorded');
  for (const outcome of relevant) {
    if (outcome.data?.status === 'failed') {
      flag('block', 'outcome_failed', `Outcome ${outcome.id} is failed`);
    } else if (outcome.data?.status !== 'verified') {
      flag('review', 'outcome_unconfirmed', `Outcome ${outcome.id} was not marked verified`);
    }
    const ids = outcome.data?.evidenceIds;
    if (requireEvidence && (!Array.isArray(ids) || ids.length === 0)) {
      flag('review', 'outcome_unlinked', `Outcome ${outcome.id} lacks linked evidence`);
    }
    for (const id of Array.isArray(ids) ? ids : []) {
      const ref = byId.get(id);
      if (!ref || ref.type !== 'evidence' || ref.sequence >= outcome.sequence) {
        flag('block', 'outcome_evidence_invalid', `Outcome ${outcome.id} links invalid evidence`);
      } else if (![ref.data?.uri, ref.data?.hash, ref.data?.value].some(
        x => x !== null && x !== undefined && String(x).trim() !== '')) {
        flag('review', 'evidence_unlocatable', `Evidence ${id} has no locator, hash, or value`);
      }
    }
  }

  if (!evidence.length && requireEvidence) flag('review', 'evidence_missing', 'No evidence events recorded');

  const state = problems.some(p => p.severity === 'block') ? 'blocked' :
    problems.some(p => p.severity === 'review') ? 'needs_review' : 'candidate';
  return {
    state,
    problems,
    counts: { events: events.length, toolCalls: calls.length, outcomes: outcomes.length, evidence: evidence.length },
    caveat: 'Candidate means only that self-reported events are internally consistent. Independently check original system state, identity, consent, and supporting evidence before accepting any outcome.'
  };
}
