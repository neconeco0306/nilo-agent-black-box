import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateOutcome } from '../src/outcome-gate.js';

const now = '2026-10-13T01:00:00.000Z';
const base = () => {
  const contract = {
    contractId: 'demo-001', runId: 'run-001', action: 'submit_synthetic_inquiry',
    resource: 'demo:inquiry', tool: 'mock.form.submit', metric: 'delivered_test_inquiries',
    observer: 'demo.crm.readback', comparator: 'gte', target: 1, maxObservationAgeSeconds: 3600
  };
  const receipt = {
    runId: 'run-001', startedAt: '2026-10-13T00:20:00.000Z',
    events: [
      { id: 'start', runId: 'run-001', sequence: 1, type: 'agent.started', data: {} },
      { id: 'grant', runId: 'run-001', sequence: 2, type: 'permission.check', data: { action: contract.action, resource: contract.resource, allowed: true } },
      { id: 'call', runId: 'run-001', sequence: 3, type: 'tool.call', data: { tool: contract.tool, permissionEventId: 'grant' } },
      { id: 'result', runId: 'run-001', sequence: 4, type: 'tool.result', data: { tool: contract.tool, success: true } },
      { id: 'outcome', runId: 'run-001', sequence: 5, type: 'outcome', data: { status: 'verified' } }
    ]
  };
  const observation = { runId: 'run-001', resource: contract.resource, metric: contract.metric,
    source: contract.observer, value: 1, observedAt: '2026-10-13T00:30:00.000Z', reference: 'synthetic-readback-1' };
  return { contract, receipt, observation, now };
};
const run = (change) => { const input = base(); change?.(input); return evaluateOutcome(input); };

test('supported when in-scope declared readback meets the target', () => assert.equal(run().status, 'supported'));
test('missed even if the tool reported success', () => assert.equal(run(a => a.observation.value = 0).status, 'missed'));
test('outcome claim alone is not evidence', () => assert.equal(run(a => a.observation = null).reason, 'independent_readback_missing'));
test('permission denial takes priority over later tool success', () => assert.equal(run(a => a.receipt.events[1].data.allowed = false).status, 'blocked'));
test('wrong resource permission rejected', () => assert.equal(run(a => a.receipt.events[1].data.resource = 'demo:other').status, 'blocked'));
test('missing grant reference rejected', () => assert.equal(run(a => a.receipt.events[2].data.permissionEventId = 'forge').reason, 'authorized_tool_call_not_observed'));
test('false tool success rejected', () => assert.equal(run(a => a.receipt.events[3].data.success = false).reason, 'no_successful_tool_result'));
test('cross-run observations rejected', () => assert.equal(run(a => a.observation.runId = 'run-002').reason, 'observation_scope_mismatch'));
test('cross-resource observations rejected', () => assert.equal(run(a => a.observation.resource = 'demo:other').reason, 'observation_scope_mismatch'));
test('unregistered observer label rejected', () => assert.equal(run(a => a.observation.source = 'model.self.assertion').reason, 'observation_scope_mismatch'));
test('old observation rejected', () => assert.equal(run(a => a.observation.observedAt = '2026-10-12T00:30:00.000Z').reason, 'observation_timestamp_invalid_or_stale'));
test('future observation rejected', () => assert.equal(run(a => a.observation.observedAt = '2026-10-13T01:15:00.000Z').reason, 'observation_timestamp_invalid_or_stale'));
test('out-of-order events rejected', () => assert.equal(run(a => a.receipt.events[2].sequence = 12).reason, 'receipt_sequence_or_run_invalid'));
test('different receipt run rejected', () => assert.equal(run(a => a.receipt.runId = 'run-002').reason, 'receipt_run_mismatch_or_missing'));
test('NaN-like target rejected', () => assert.equal(run(a => a.contract.target = Infinity).reason, 'invalid_contract'));
test('incorrect tool mismatch rejected', () => assert.equal(run(a => a.receipt.events[3].data.tool = 'other.tool').reason, 'no_successful_tool_result'));
test('less-than threshold supported', () => assert.equal(run(a => { a.contract.comparator='lte'; a.contract.target=2; }).status, 'supported'));
test('exact threshold missed', () => assert.equal(run(a => { a.contract.comparator='eq'; a.contract.target=2; }).status, 'missed'));

test('rejects duplicate receipt event identifiers', () => assert.equal(run(a => a.receipt.events[2].id = 'grant').reason, 'receipt_sequence_or_run_invalid'));
test('rejects a second identical tool call without call-id correlation', () => assert.equal(run(a => a.receipt.events.push({ id: 'call2', runId: 'run-001', sequence: 6, type: 'tool.call', data: { tool: a.contract.tool, permissionEventId: 'grant' } })).reason, 'ambiguous_tool_calls'));
test('rejects extra identical tool result', () => assert.equal(run(a => a.receipt.events.push({ id: 'result2', runId: 'run-001', sequence: 6, type: 'tool.result', data: { tool: a.contract.tool, success: true } })).reason, 'ambiguous_tool_results'));
test('rejects contradictory allowed and denied permissions', () => assert.equal(run(a => a.receipt.events.push({ id: 'deny', runId: 'run-001', sequence: 6, type: 'permission.check', data: { action: a.contract.action, resource: a.contract.resource, allowed: false } })).status, 'blocked'));
test('rejects two allowed grants for same action', () => assert.equal(run(a => a.receipt.events.push({ id: 'grant2', runId: 'run-001', sequence: 6, type: 'permission.check', data: { action: a.contract.action, resource: a.contract.resource, allowed: true } })).reason, 'ambiguous_permissions'));
