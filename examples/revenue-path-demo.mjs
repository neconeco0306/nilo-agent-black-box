import { createBlackBox } from '../src/index.js';

// Entirely offline/synthetic. A mock tool acknowledgment is NOT a real customer outcome.
const box = createBlackBox({
  agentId: 'synthetic-revenue-path-demo',
  metadata: { fixture: true, workflow: 'inquiry-routing', customerData: false }
});
const permission = box.permissionCheck({
  action: 'route_synthetic_inquiry', resource: 'offline-demo-only',
  allowed: true, reason: 'Local synthetic fixture: no external side effects'
});
box.toolCall({
  tool: 'fixture.routeInquiry', input: { fixtureId: 'demo-inquiry-001' },
  permissionEventId: permission.id, reversible: true
});
const evidence = box.evidence({
  kind: 'synthetic-transport-ack',
  value: { fixtureId: 'demo-inquiry-001', acceptedByMock: true },
  note: 'Mock acknowledgment, NOT a real external provider receipt.'
});
box.toolResult({
  tool: 'fixture.routeInquiry', success: true,
  output: { acceptedByMock: true }, evidenceIds: [evidence.id]
});
box.outcome({
  status: 'unverified', metric: 'qualified_inquiries_received',
  target: 1, observed: null,
  note: 'No independent downstream customer evidence. Outcome is UNKNOWN.'
});
box.rollback({ available: true, method: 'discard synthetic fixture', attempted: false });
const receipt = box.finish({ summary: 'Synthetic routing acknowledged; actual business result unknown.' });
const outcome = receipt.events.find(event => event.type === 'outcome')?.data;
console.log(JSON.stringify({
  demoOnly: true,
  verifiedRealWorldOutcome: false,
  recordedPayment: false,
  summary: {
    mockedToolSucceeded: receipt.summary.toolFailures === 0,
    businessOutcome: outcome?.status,
    observedQualifiedInquiries: outcome?.observed,
    attributedRevenue: receipt.summary.value.revenueAttributed,
    independentCustomerEvidence: false
  },
  receipt
}, null, 2));
