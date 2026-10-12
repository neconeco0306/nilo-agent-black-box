import { evaluateOutcome } from './outcome-gate.js';

/**
 * A read-only integration seam. The TRUSTED application must supply an
 * independently administered authority and a read-only data-source adapter.
 * Model-generated functions, policies, tokens, and grants are not trusted.
 *
 * This module itself is not an authorization engine or a signature verifier.
 */
export async function evaluateWithReadback({ contract, receipt, authority, reader, clock = () => new Date().toISOString() }) {
  const stop = (status, reason) => ({
    status, reason, runId: contract?.runId ?? null,
    contractId: contract?.contractId ?? null, observed: null,
    evidence: null, trust: 'not_verified'
  });
  const valid = (s) => typeof s === 'string' && s.trim().length > 0;
  const time = (s) => typeof s === 'string' && Number.isFinite(Date.parse(s)) ? Date.parse(s) : null;
  if (!contract || !['projectId', 'contractId', 'runId', 'action', 'resource', 'observer'].every(k => valid(contract[k]))) {
    return stop('blocked', 'invalid_scoped_contract');
  }
  if (typeof authority?.isPaused !== 'function' ||
      typeof authority?.authorizeReadback !== 'function' ||
      typeof authority?.consumeGrant !== 'function' ||
      typeof reader?.read !== 'function') {
    return stop('blocked', 'trusted_dependencies_missing');
  }
  const request = Object.freeze({
    projectId: contract.projectId, runId: contract.runId,
    contractId: contract.contractId, action: contract.action,
    resource: contract.resource, observer: contract.observer,
    metric: contract.metric
  });
  try {
    if (await authority.isPaused(request) !== false) return stop('blocked', 'external_pause');
    const grant = await authority.authorizeReadback(request);
    if (!grant || grant.allowed !== true || grant.readOnly !== true ||
        !valid(grant.grantId) || !valid(grant.policyVersion) ||
        !['projectId', 'runId', 'contractId', 'action', 'resource', 'observer'].every(k => grant[k] === request[k])) {
      return stop('blocked', 'invalid_or_out_of_scope_grant');
    }
    const issued = time(grant.issuedAt);
    const expires = time(grant.expiresAt);
    const start = time(clock());
    if (start === null || issued === null || expires === null ||
        start < issued || start >= expires || expires <= issued) {
      return stop('blocked', 'grant_expired_or_invalid');
    }
    // The trusted authority implements durable, one-time grant consumption.
    // A successful read may be retried only with a new independently issued grant.
    if (await authority.consumeGrant(Object.freeze({ grantId: grant.grantId, ...request })) !== true) {
      return stop('blocked', 'grant_replay_or_unavailable');
    }
    if (await authority.isPaused(request) !== false) return stop('blocked', 'external_pause');
    const observation = await reader.read(Object.freeze({ ...request, grantId: grant.grantId }));
    const outcome = evaluateOutcome({ contract, receipt, observation, now: clock() });
    return {
      ...outcome,
      trust: outcome.status === 'supported' ? 'declared_adapter_readback' : 'not_verified',
      policyVersion: grant.policyVersion,
      // This string identifies integration configuration, not an authenticated person.
      caveat: 'Only the owner-controlled adapter and authority can independently establish observation origin and enforce the grant. This library cannot attest them.'
    };
  } catch {
    // Fail closed. In particular do not serialize provider errors containing secrets.
    return stop('inconclusive', 'trusted_dependency_failed');
  }
}
