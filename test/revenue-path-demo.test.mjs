import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const demo = resolve(here, '../examples/revenue-path-demo.mjs');
function run() {
  return execFileSync(process.execPath, [demo], { encoding: 'utf8', timeout: 5000 });
}

test('mock tool success never becomes verified business success', () => {
  const x = JSON.parse(run());
  assert.equal(x.demoOnly, true);
  assert.equal(x.summary.mockedToolSucceeded, true);
  assert.equal(x.summary.businessOutcome, 'unverified');
  assert.equal(x.summary.observedQualifiedInquiries, null);
  assert.equal(x.summary.attributedRevenue, null);
  assert.equal(x.summary.independentCustomerEvidence, false);
  assert.equal(x.verifiedRealWorldOutcome, false);
  assert.equal(x.recordedPayment, false);
  assert.equal(x.receipt.summary.permissionChecks, 1);
  assert.equal(x.receipt.summary.toolCalls, 1);
  assert.equal(x.receipt.summary.outcomeCount, 1);
  assert.ok(x.receipt.events.every(e => e.agentId === 'synthetic-revenue-path-demo'));
  assert.ok(x.receipt.events.some(e => e.type === 'tool.result' && e.data.success === true));
});

test('demo contains no URLs, credentials, or falsely verified results', () => {
  const raw = run();
  assert.doesNotMatch(raw, /https?:\/\//);
  assert.doesNotMatch(raw, /sk-[A-Za-z0-9_-]{12,}/);
  assert.doesNotMatch(raw, /"status": "verified"/);
});
