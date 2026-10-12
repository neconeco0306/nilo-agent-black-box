import test from 'node:test';
import assert from 'node:assert/strict';
import { createBlackBox, evaluateOutcome, evaluateWithReadback } from '../src/index.js';

test('main package entrypoint exports existing recorder and new experimental tools', () => {
  assert.equal(typeof createBlackBox, 'function');
  assert.equal(typeof evaluateOutcome, 'function');
  assert.equal(typeof evaluateWithReadback, 'function');
  const recorder = createBlackBox({ agentId: 'smoke-test' });
  assert.equal(recorder.receipt().agentId, 'smoke-test');
});
