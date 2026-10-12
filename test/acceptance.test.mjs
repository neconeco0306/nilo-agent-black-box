import test from 'node:test';
import assert from 'node:assert/strict';
import { createBlackBox } from '../src/index.js';
import { preflightReceipt } from '../src/acceptance.js';

function validReceipt() {
  const box = createBlackBox({ agentId: 'proofops-fixture' });
  const permission = box.permissionCheck({ action: 'update', resource: 'item:1', allowed: true });
  box.toolCall({ tool: 'db.update', permissionEventId: permission.id, reversible: true });
  const evidence = box.evidence({ kind: 'record-id', value: 'record:1' });
  box.toolResult({ tool: 'db.update', success: true, evidenceIds: [evidence.id] });
  box.outcome({ status: 'verified', metric: 'records_updated', target: 1, observed: 1,
    evidenceIds: [evidence.id] });
  return box.finish();
}

test('internally consistent receipt is only a candidate, not a verified business result', () => {
  const result = preflightReceipt(validReceipt(), { metric: 'records_updated' });
  assert.equal(result.state, 'candidate');
  assert.match(result.caveat, /Independently check/);
});

test('no linked outcome evidence requires human review', () => {
  const receipt = validReceipt();
  receipt.events.find(e => e.type === 'outcome').data.evidenceIds = [];
  const result = preflightReceipt(receipt);
  assert.equal(result.state, 'needs_review');
  assert.ok(result.problems.some(x => x.code === 'outcome_unlinked'));
});

test('claiming evidence from a different run is blocked', () => {
  const receipt = validReceipt();
  receipt.events.find(e => e.type === 'outcome').data.evidenceIds = ['foreign-evidence'];
  const result = preflightReceipt(receipt);
  assert.equal(result.state, 'blocked');
  assert.ok(result.problems.some(x => x.code === 'outcome_evidence_invalid'));
});

test('action linked to a denied permission is blocked', () => {
  const receipt = validReceipt();
  receipt.events.find(e => e.type === 'permission.check').data.allowed = false;
  assert.equal(preflightReceipt(receipt).state, 'blocked');
});

test('tool failure is blocked even if outcome claims success', () => {
  const receipt = validReceipt();
  receipt.events.find(e => e.type === 'tool.result').data.success = false;
  assert.equal(preflightReceipt(receipt).state, 'blocked');
});

test('missing permission link requires review', () => {
  const receipt = validReceipt();
  receipt.events.find(e => e.type === 'tool.call').data.permissionEventId = null;
  assert.equal(preflightReceipt(receipt).state, 'needs_review');
});

test('tampered sequence or duplicate id blocks the receipt', () => {
  const receipt = validReceipt();
  receipt.events[1].sequence = 100;
  assert.equal(preflightReceipt(receipt).state, 'blocked');
  const duplicate = validReceipt();
  duplicate.events[1].id = duplicate.events[0].id;
  assert.equal(preflightReceipt(duplicate).state, 'blocked');
});

test('absence of final event requires review', () => {
  const receipt = validReceipt();
  receipt.events.pop();
  assert.equal(preflightReceipt(receipt).state, 'needs_review');
});

test('metric requirement prevents a receipt from claiming an unrelated success', () => {
  const receipt = validReceipt();
  const result = preflightReceipt(receipt, { metric: 'invoices_paid' });
  assert.equal(result.state, 'needs_review');
  assert.ok(result.problems.some(x => x.code === 'outcome_missing'));
});

test('failed outcome is blocked', () => {
  const receipt = validReceipt();
  receipt.events.find(e => e.type === 'outcome').data.status = 'failed';
  assert.equal(preflightReceipt(receipt).state, 'blocked');
});

test('missing or malformed receipt fails closed', () => {
  assert.equal(preflightReceipt(null).state, 'blocked');
  assert.equal(preflightReceipt({ runId: 'x', events: null }).state, 'blocked');
});
