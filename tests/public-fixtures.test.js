import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluateOutcome } from '../src/outcome-gate.js';

const cases = JSON.parse(readFileSync(new URL('../fixtures/public-reality-test-cases.json', import.meta.url), 'utf8'));
const now = '2026-10-13T01:00:00.000Z';
function assess(f, metric, count) {
  const c = { contractId: f.id, runId: `fixture-${f.id}`, action: 'summarize_public_description',
    resource: f.resource, tool: 'fixture.mapping', metric, observer: 'contributor-described',
    comparator: 'gte', target: 1, maxObservationAgeSeconds: 3600 };
  const r = { runId: c.runId, startedAt: '2026-10-13T00:30:00.000Z', events: [
    { id: 'p', runId: c.runId, sequence: 1, type: 'permission.check', data: { action: c.action, resource: c.resource, allowed: true } },
    { id: 'a', runId: c.runId, sequence: 2, type: 'tool.call', data: { tool: c.tool, permissionEventId: 'p' } },
    { id: 'b', runId: c.runId, sequence: 3, type: 'tool.result', data: { tool: c.tool, success: true } }
  ] };
  const observation = count === null ? null : { runId: c.runId, resource: c.resource, metric,
    source: c.observer, value: count, observedAt: '2026-10-13T00:55:00.000Z', reference: f.reference };
  return evaluateOutcome({ contract: c, receipt: r, observation, now });
}
for (const f of cases) {
  test(`${f.id}: public contributor's described intermediate outcome is only supported`, () => {
    assert.equal(f.origin, 'external-contributor-report-not-independently-reproduced');
    const result = assess(f, f.supported_metric, 1);
    assert.equal(result.status, 'supported');
    assert.match(result.note, /MUST be verified/);
  });
  test(`${f.id}: downstream behavior cannot be inferred`, () => {
    assert.equal(assess(f, f.unconfirmed_metric, null).status, 'inconclusive');
    assert.equal(f.commercial_outcome, null);
  });
}
test('no external case is represented as a paying Nilo customer', () => {
  assert.equal(cases.length, 3);
  assert.ok(cases.every(c => c.commercial_outcome === null));
});
