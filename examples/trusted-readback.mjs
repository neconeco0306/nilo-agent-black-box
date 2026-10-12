/** Synthetic, local-only receiving-system fixture. No external messages. */
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { evaluateWithReadback } from '../src/trusted-readback.js';

const folder = await mkdtemp(join(tmpdir(), 'nilo-proof-demo-'));
const recordFile = join(folder, 'receiver.json');
const now = new Date();
const startedAt = new Date(now.getTime() - 60_000).toISOString();
const contract = { projectId: 'synthetic', contractId: 'inquiry-demo', runId: 'demo-001',
  action: 'test_send', resource: 'synthetic:inquiry', tool: 'mock.form.submit',
  metric: 'delivered_test_inquiries', observer: 'synthetic.receiver',
  target: 1, comparator: 'gte', maxObservationAgeSeconds: 300 };
const receipt = { runId: contract.runId, startedAt, events: [
  { id: 'p', runId: contract.runId, sequence: 1, type: 'permission.check', data: { action: contract.action, resource: contract.resource, allowed: true } },
  { id: 'c', runId: contract.runId, sequence: 2, type: 'tool.call', data: { tool: contract.tool, permissionEventId: 'p' } },
  { id: 'r', runId: contract.runId, sequence: 3, type: 'tool.result', data: { tool: contract.tool, success: true } }
] };
let issued = 0;
const used = new Set();
const authority = {
  async isPaused() { return false; },
  async authorizeReadback(request) {
    return { ...request, grantId: `demo-${++issued}`, policyVersion: 'demo-not-production',
      issuedAt: new Date(Date.now() - 1000).toISOString(), expiresAt: new Date(Date.now() + 60_000).toISOString(),
      allowed: true, readOnly: true };
  },
  async consumeGrant({ grantId }) { if (used.has(grantId)) return false; used.add(grantId); return true; }
};
const reader = {
  async read(request) {
    const fixture = JSON.parse(await readFile(recordFile, 'utf8'));
    return { runId: request.runId, resource: request.resource, metric: request.metric,
      source: request.observer, value: fixture.acceptedCount,
      observedAt: new Date().toISOString(), reference: 'synthetic-disk-readback' };
  }
};
try {
  for (const acceptedCount of [0, 1]) {
    await writeFile(recordFile, JSON.stringify({ acceptedCount }));
    const result = await evaluateWithReadback({ contract, receipt, authority, reader });
    console.log(`tool_success=true, receiver_record_count=${acceptedCount}, outcome=${result.status}`);
  }
} finally {
  await rm(folder, { recursive: true, force: true });
}
