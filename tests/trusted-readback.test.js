import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateWithReadback } from '../src/trusted-readback.js';

const now = '2026-10-13T01:00:00.000Z';
function fixture() {
  const contract = { projectId: 'customer-demo', contractId: 'c1', runId: 'r1', action: 'submit_test',
    resource: 'demo:inquiries', tool: 'mock.submit', metric: 'delivered', observer: 'demo.receiver',
    comparator: 'gte', target: 1, maxObservationAgeSeconds: 3600 };
  const receipt = { runId: 'r1', startedAt: '2026-10-13T00:30:00.000Z', events: [
    { id: 'g', runId: 'r1', sequence: 1, type: 'permission.check', data: { action: contract.action, resource: contract.resource, allowed: true } },
    { id: 'c', runId: 'r1', sequence: 2, type: 'tool.call', data: { tool: contract.tool, permissionEventId: 'g' } },
    { id: 't', runId: 'r1', sequence: 3, type: 'tool.result', data: { tool: contract.tool, success: true } }
  ] };
  const grant = { grantId: 'nonce-1', policyVersion: 'p1', allowed: true, readOnly: true,
    issuedAt: '2026-10-13T00:50:00.000Z', expiresAt: '2026-10-13T01:10:00.000Z',
    projectId: contract.projectId, runId: contract.runId, contractId: contract.contractId,
    action: contract.action, resource: contract.resource, observer: contract.observer };
  const observation = { runId: contract.runId, resource: contract.resource, metric: contract.metric,
    source: contract.observer, value: 1, observedAt: '2026-10-13T00:55:00.000Z', reference: 'synthetic:1' };
  const state = { paused: false, consumed: new Set(), readerCalls: 0, authorizeCalls: 0 };
  const authority = {
    async isPaused() { return state.paused; },
    async authorizeReadback() { state.authorizeCalls++; return grant; },
    async consumeGrant({grantId}) { if (state.consumed.has(grantId)) return false; state.consumed.add(grantId); return true; }
  };
  const reader = { async read() { state.readerCalls++; return observation; } };
  const input = { contract, receipt, authority, reader, clock: () => now };
  return {input, state, grant, observation};
}
const check = async edit => { const f = fixture(); edit?.(f); return evaluateWithReadback(f.input); };

test('authorized scoped readback supports observed result (NOT authenticated by library)', async () => {
  const out = await check(); assert.equal(out.status, 'supported'); assert.equal(out.trust, 'declared_adapter_readback');
});
test('zero delivered means missed even if tool succeeds', async () => assert.equal((await check(f=>f.observation.value=0)).status, 'missed'));
test('readback is required', async () => assert.equal((await check(f=>f.input.reader=null)).status, 'blocked'));
test('external pause denies without using adapter', async () => { const f=fixture();f.state.paused=true;assert.equal((await evaluateWithReadback(f.input)).reason, 'external_pause');assert.equal(f.state.readerCalls,0); });
test('missing read-only scope blocks', async () => assert.equal((await check(f=>f.grant.readOnly=false)).reason, 'invalid_or_out_of_scope_grant'));
test('forged cross-project scope blocks', async () => assert.equal((await check(f=>f.grant.projectId='foreign')).reason, 'invalid_or_out_of_scope_grant'));
test('foreign resource scope blocks', async () => assert.equal((await check(f=>f.grant.resource='other')).reason, 'invalid_or_out_of_scope_grant'));
test('expired grant blocks', async () => assert.equal((await check(f=>f.grant.expiresAt='2026-10-13T00:51:00.000Z')).reason,'grant_expired_or_invalid'));
test('future issued grant blocks', async () => assert.equal((await check(f=>f.grant.issuedAt='2026-10-13T01:01:00.000Z')).reason,'grant_expired_or_invalid'));
test('grant replay is denied', async () => { const f=fixture(); assert.equal((await evaluateWithReadback(f.input)).status,'supported'); assert.equal((await evaluateWithReadback(f.input)).reason, 'grant_replay_or_unavailable'); });
test('independently paused between consume and read blocks', async () => { const f=fixture(); f.input.authority.consumeGrant=async()=>{f.state.paused=true;return true;};assert.equal((await evaluateWithReadback(f.input)).reason,'external_pause');assert.equal(f.state.readerCalls,0); });
test('source confusion in readback becomes inconclusive', async () => assert.equal((await check(f=>f.observation.source='agent.self')).reason,'observation_scope_mismatch'));
test('cross-run observation becomes inconclusive', async () => assert.equal((await check(f=>f.observation.runId='other')).reason,'observation_scope_mismatch'));
test('reader throws safely without provider secrets', async () => { const f=fixture(); f.input.reader.read=async()=>{throw new Error('Authorization: Bearer secret-token');};const o=await evaluateWithReadback(f.input);assert.equal(o.reason,'trusted_dependency_failed');assert.doesNotMatch(JSON.stringify(o),/secret-token/); });
test('missing authority fails closed', async () => assert.equal((await check(f=>f.input.authority=undefined)).status, 'blocked'));
test('self-reported outcome success cannot override external miss', async () => {
  const f=fixture();f.observation.value=0;f.input.receipt.events.push({id:'o',runId:'r1',sequence:4,type:'outcome',data:{status:'verified'}});
  assert.equal((await evaluateWithReadback(f.input)).status,'missed');
});
test('invalid metadata result cannot pass', async () => assert.equal((await check(f=>f.grant.grantId='')).reason,'invalid_or_out_of_scope_grant'));
test('unavailable replay storage prevents read', async () => assert.equal((await check(f=>f.input.authority.consumeGrant=async()=>false)).reason, 'grant_replay_or_unavailable'));
