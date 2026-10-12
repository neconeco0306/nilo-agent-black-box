/**
 * Outcome Gate v0 — offline, deterministic evaluator of one AI/human task.
 * It does not run actions, validate cryptographic signatures, or authenticate
 * observers. In particular, 'supported' is not proof of independent identity.
 */
const missing = (s) => typeof s !== 'string' || s.trim().length === 0;
const validDate = (s) => {
  const n = typeof s === 'string' ? Date.parse(s) : NaN;
  return Number.isFinite(n) ? n : null;
};
const RESPONSE = Object.freeze({
  BLOCKED: 'blocked',
  INCONCLUSIVE: 'inconclusive',
  SUPPORTED: 'supported',
  MISSED: 'missed'
});

export function evaluateOutcome({ contract, receipt, observation, now = new Date().toISOString() }) {
  const invalid = (reason, status = RESPONSE.INCONCLUSIVE) => ({
    contractId: contract?.contractId ?? null,
    runId: contract?.runId ?? null,
    status,
    reason,
    observed: null,
    target: Number.isFinite(contract?.target) ? contract.target : null,
    evidence: null,
    note: 'A declared readback is not independently authenticated by this module.'
  });

  if (!contract || typeof contract !== 'object' ||
      ['contractId', 'runId', 'action', 'resource', 'tool', 'metric', 'observer'].some(k => missing(contract[k])) ||
      !Number.isFinite(contract.target) || contract.target < 0 ||
      !['gte', 'lte', 'eq'].includes(contract.comparator) ||
      !Number.isFinite(contract.maxObservationAgeSeconds) || contract.maxObservationAgeSeconds <= 0) {
    return invalid('invalid_contract');
  }
  if (!receipt || receipt.runId !== contract.runId || !Array.isArray(receipt.events)) {
    return invalid('receipt_run_mismatch_or_missing');
  }
  const nowMs = validDate(now);
  if (nowMs === null) return invalid('invalid_clock');
  const events = receipt.events;
  // A receipt is untrusted telemetry. Catch simple structural/tampering errors;
  // authentication and append-only storage require independent infrastructure.
  const ids = new Set();
  if (events.some((e, i) => {
    if (!e || typeof e.id !== 'string' || !e.id || ids.has(e.id) ||
        e.runId !== contract.runId || e.sequence !== i + 1 ||
        !e.data || typeof e.data !== 'object' || Array.isArray(e.data)) return true;
    ids.add(e.id);
    return false;
  })) return invalid('receipt_sequence_or_run_invalid');

  // V0 contract handles exactly one operation. Multiple calls or results to the
  // same tool are ambiguous until stable per-call result IDs are implemented.
  const matchingPermissions = events.filter(e => e.type === 'permission.check' &&
    e.data.action === contract.action && e.data.resource === contract.resource);
  if (matchingPermissions.some(e => e.data.allowed !== true)) {
    return invalid('action_permission_denied', RESPONSE.BLOCKED);
  }
  if (!matchingPermissions.length) return invalid('no_matching_permission', RESPONSE.BLOCKED);
  if (matchingPermissions.length !== 1) return invalid('ambiguous_permissions');
  const permission = matchingPermissions[0];
  const allCalls = events.filter(e => e.type === 'tool.call' && e.data.tool === contract.tool);
  if (allCalls.length === 0 || !allCalls.some(e =>
      e.data.permissionEventId === permission.id && e.sequence > permission.sequence)) {
    return invalid('authorized_tool_call_not_observed');
  }
  if (allCalls.length !== 1 || allCalls[0].data.permissionEventId !== permission.id) {
    return invalid('ambiguous_tool_calls');
  }
  const results = events.filter(e => e.type === 'tool.result' && e.data.tool === contract.tool);
  if (results.length === 0) return invalid('no_successful_tool_result');
  if (results.length !== 1) return invalid('ambiguous_tool_results');
  if (results[0].sequence <= allCalls[0].sequence || results[0].data.success !== true) {
    return invalid('no_successful_tool_result');
  }
  // This is not an outcome check: tool success is only a prerequisite.
  if (!observation || typeof observation !== 'object') return invalid('independent_readback_missing');
  if (observation.runId !== contract.runId || observation.resource !== contract.resource ||
      observation.metric !== contract.metric || observation.source !== contract.observer ||
      !Number.isFinite(observation.value)) {
    return invalid('observation_scope_mismatch');
  }
  const at = validDate(observation.observedAt);
  const started = validDate(receipt.startedAt);
  if (at === null || started === null || at < started || at > nowMs + 60000 ||
      nowMs - at > contract.maxObservationAgeSeconds * 1000) {
    return invalid('observation_timestamp_invalid_or_stale');
  }
  const satisfied = contract.comparator === 'gte' ? observation.value >= contract.target :
    contract.comparator === 'lte' ? observation.value <= contract.target :
      observation.value === contract.target;
  return {
    contractId: contract.contractId,
    runId: contract.runId,
    status: satisfied ? RESPONSE.SUPPORTED : RESPONSE.MISSED,
    reason: satisfied ? 'declared_readback_meets_target' : 'declared_readback_below_target',
    observed: observation.value,
    target: contract.target,
    evidence: { source: observation.source, observedAt: observation.observedAt, reference: observation.reference ?? null },
    note: 'Observer identity and the referenced record MUST be verified by an independent trusted adapter before calling this externally verified.'
  };
}
