import test from 'node:test';
import assert from 'node:assert/strict';
import { createBlackBox } from '../src/index.js';

test('string false must not authorize a tool call', () => {
  const box = createBlackBox();
  const permission = box.permissionCheck({action:'send_email',resource:'recipient',allowed:'false'});
  assert.equal(permission.data.allowed, false);
  assert.equal(box.receipt().summary.deniedPermissions, 1);
});
test('string false must not count as a successful tool result', () => {
  const box = createBlackBox();
  const result = box.toolResult({tool:'gmail.send',success:'false'});
  assert.equal(result.data.success, false);
  assert.equal(box.receipt().summary.toolFailures, 1);
});
test('string false must not claim rollback readiness', () => {
  const box = createBlackBox();
  assert.equal(box.rollback({available:'false'}).data.available,false);
  assert.equal(box.receipt().summary.rollbackReady,false);
});
test('real booleans and unknown rollback remain unchanged', () => {
  const box = createBlackBox();
  assert.equal(box.permissionCheck({action:'read',resource:'x',allowed:true}).data.allowed,true);
  assert.equal(box.toolResult({tool:'read',success:true}).data.success,true);
  assert.equal(box.rollback({available:true}).data.available,true);
  assert.equal(box.rollback({available:null}).data.available,null);
});
