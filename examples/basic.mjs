import { createBlackBox } from '../src/index.js';

const box = createBlackBox({
  agentId: 'demo-agent',
  metadata: { task: 'Publish a verified demo result' }
});

const permission = box.permissionCheck({
  action: 'write_demo_result',
  resource: 'demo-output',
  allowed: true,
  reason: 'Demo scope explicitly allows this write'
});

box.toolCall({
  tool: 'demo.write',
  input: { message: 'hello from an agent', token: 'secret=demo-do-not-log' },
  permissionEventId: permission.id,
  reversible: true
});

const evidence = box.evidence({
  kind: 'provider-response',
  value: { id: 'demo_001', stored: true }
});

box.toolResult({
  tool: 'demo.write',
  success: true,
  output: { id: 'demo_001' },
  evidenceIds: [evidence.id]
});

box.outcome({
  status: 'verified',
  metric: 'records_written',
  target: 1,
  observed: 1
});

box.value({
  costMoney: 3,
  profitAttributed: 50,
  timeBeforeMinutes: 8,
  timeAfterMinutes: 1,
  humanInterventions: 0,
  confidence: 1,
  evidenceIds: [evidence.id]
});

box.rollback({
  available: true,
  method: 'demo.delete(demo_001)',
  attempted: false
});

console.log(JSON.stringify(box.finish({ summary: 'Demo write verified.' }), null, 2));
