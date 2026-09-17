import test from 'node:test';
import assert from 'node:assert/strict';
import { createBlackBox } from '../src/index.js';

test('builds a compact receipt from agent events', () => {
  const box = createBlackBox({ agentId: 'test-agent' });
  const permission = box.permissionCheck({ action: 'write', resource: 'record:1', allowed: true });
  box.toolCall({ tool: 'db.write', input: { id: 1 }, permissionEventId: permission.id, reversible: true });
  box.toolResult({ tool: 'db.write', success: true, output: { id: 1 } });
  box.evidence({ kind: 'record-id', value: 1 });
  box.outcome({ status: 'verified', metric: 'writes', target: 1, observed: 1 });
  box.rollback({ available: true, method: 'db.delete(1)' });
  const receipt = box.finish({ summary: 'done' });

  assert.equal(receipt.agentId, 'test-agent');
  assert.equal(receipt.summary.permissionChecks, 1);
  assert.equal(receipt.summary.toolCalls, 1);
  assert.equal(receipt.summary.evidenceCount, 1);
  assert.equal(receipt.summary.outcomeCount, 1);
  assert.equal(receipt.summary.rollbackReady, true);
  assert.equal(receipt.events.at(-1).type, 'agent.finished');
});

test('redacts common secret patterns before storage', () => {
  const box = createBlackBox({ agentId: 'redaction-test' });
  const event = box.toolCall({
    tool: 'api.call',
    input: { authorization: 'Bearer abc.def.ghi', config: 'api_key=super-secret-value' }
  });
  assert.equal(event.data.input.authorization, '[REDACTED]');
  assert.equal(event.data.input.config, '[REDACTED]');
});

test('supports a dedicated value event and derives ROI', () => {
  const box = createBlackBox({ agentId: 'roi-test' });
  box.outcome({ status: 'verified', metric: 'qualified_leads', target: 1, observed: 1 });
  box.value({
    costMoney: 12,
    revenueAttributed: 5000,
    profitAttributed: 4200,
    timeBeforeMinutes: 18,
    timeAfterMinutes: 3,
    humanInterventions: 1,
    confidence: 0.8
  });
  const receipt = box.finish();
  assert.equal(receipt.summary.valueEventCount, 1);
  assert.equal(receipt.summary.value.timeSavedMinutes, 15);
  assert.equal(receipt.summary.value.netValue, 4188);
  assert.equal(receipt.summary.value.roi, 349);
});

test('keeps outcome-embedded value fields backwards compatible', () => {
  const box = createBlackBox({ agentId: 'compat-test' });
  box.outcome({ status: 'verified', costMoney: 10, profitAttributed: 40, timeSavedMinutes: 5 });
  const receipt = box.finish();
  assert.equal(receipt.summary.value.costMoney, 10);
  assert.equal(receipt.summary.value.netValue, 30);
  assert.equal(receipt.summary.value.roi, 3);
});

test('rejects unsupported event types', () => {
  const box = createBlackBox({ agentId: 'validation-test' });
  assert.throws(() => box.record('unknown.event', {}), /Unsupported event type/);
});

test('exports newline-delimited JSON', () => {
  const box = createBlackBox({ agentId: 'jsonl-test' });
  box.outcome({ status: 'verified' });
  const lines = box.toJSONL().split('\n');
  assert.equal(lines.length, 2);
  assert.equal(JSON.parse(lines[0]).type, 'agent.started');
  assert.equal(JSON.parse(lines[1]).type, 'outcome');
});
