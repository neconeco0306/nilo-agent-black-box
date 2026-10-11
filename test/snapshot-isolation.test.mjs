import test from 'node:test';
import assert from 'node:assert/strict';
import { createBlackBox } from '../src/index.js';

test('record return values cannot rewrite stored authorization history', () => {
  const box = createBlackBox({ agentId: 'isolation-test' });
  const permission = box.permissionCheck({
    action: 'publish', resource: 'record:1', allowed: false
  });

  permission.data.allowed = true;
  permission.type = 'tool.result';
  const stored = box.receipt();
  assert.equal(stored.summary.deniedPermissions, 1);
  assert.equal(stored.events[1].type, 'permission.check');
  assert.equal(stored.events[1].data.allowed, false);
});

test('mutating receipt and events snapshots cannot corrupt future receipts', () => {
  const box = createBlackBox({ agentId: 'snapshot-test' });
  const permission = box.permissionCheck({
    action: 'read', resource: 'record:2', allowed: true
  });
  box.toolCall({ tool: 'db.read', permissionEventId: permission.id });
  const expectedJSONL = box.toJSONL();

  const receipt = box.receipt();
  receipt.events[1].data.allowed = false;
  receipt.events[2].type = 'outcome';
  receipt.events.push({ type: 'permission.check', data: { allowed: false } });
  receipt.summary.deniedPermissions = 99;

  const exposedEvents = box.events;
  exposedEvents[1].data.allowed = false;
  exposedEvents.splice(0, 1);
  exposedEvents.push({ type: 'tool.result', data: { success: true } });

  const later = box.receipt();
  assert.equal(later.summary.eventCount, 3);
  assert.equal(later.summary.deniedPermissions, 0);
  assert.deepEqual(later.events.map(({ sequence }) => sequence), [1, 2, 3]);
  assert.equal(later.events[1].data.allowed, true);
  assert.equal(later.events[2].type, 'tool.call');
  assert.equal(box.toJSONL(), expectedJSONL);
});

test('snapshot isolation preserves IDs for cross-event references', () => {
  const box = createBlackBox({ agentId: 'reference-test' });
  const permission = box.permissionCheck({
    action: 'write', resource: 'record:3', allowed: true
  });
  box.toolCall({ tool: 'db.write', permissionEventId: permission.id });
  const receipt = box.finish();
  assert.equal(receipt.events[2].data.permissionEventId, permission.id);
  assert.equal(receipt.events.at(-1).type, 'agent.finished');
});
