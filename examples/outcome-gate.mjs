import { evaluateOutcome } from '../src/outcome-gate.js';

const runId = 'synthetic-run-001';
const startedAt = new Date(Date.now() - 60000).toISOString();
const observedAt = new Date().toISOString();
const contract = { contractId: 'synthetic-web-inquiry', runId,
  action: 'submit_synthetic_inquiry', resource: 'demo:inquiry',
  tool: 'mock.form.submit', metric: 'delivered_test_inquiries',
  observer: 'demo.crm.readback', comparator: 'gte', target: 1,
  maxObservationAgeSeconds: 300 };
const receipt = { runId, startedAt, events: [
  { id: 'grant', runId, sequence: 1, type: 'permission.check', data: { action: contract.action, resource: contract.resource, allowed: true } },
  { id: 'call', runId, sequence: 2, type: 'tool.call', data: { tool: contract.tool, permissionEventId: 'grant' } },
  { id: 'result', runId, sequence: 3, type: 'tool.result', data: { tool: contract.tool, success: true } },
  { id: 'claim', runId, sequence: 4, type: 'outcome', data: { status: 'verified' } }
] };
const observation = { runId, resource: contract.resource, metric: contract.metric,
  source: contract.observer, value: 0, observedAt, reference: 'mock-crm-000' };
console.log('Tool says success, CRM sees zero test submissions:');
console.log(JSON.stringify(evaluateOutcome({ contract, receipt, observation }), null, 2));
observation.value = 1;
observation.reference = 'mock-crm-001';
console.log('Synthetic CRM readback reports one accepted submission:');
console.log(JSON.stringify(evaluateOutcome({ contract, receipt, observation }), null, 2));
