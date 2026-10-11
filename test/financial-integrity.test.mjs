import test from 'node:test';
import assert from 'node:assert/strict';
import { createBlackBox } from '../src/index.js';

test('unknown expenses never become zero when reporting net value', () => {
  const box = createBlackBox({ agentId: 'financial-integrity' });
  box.value({ profitAttributed: 4200, revenueAttributed: 5000 });
  const { value } = box.finish().summary;

  assert.equal(value.profitAttributed, 4200);
  assert.equal(value.costMoney, null);
  assert.equal(value.netValue, null);
  assert.equal(value.roi, null);
});

test('multiple events with incomplete costs do not certify aggregate net value', () => {
  const box = createBlackBox({ agentId: 'financial-aggregation' });
  box.value({ costMoney: 20, profitAttributed: 50 });
  box.value({ profitAttributed: 100 });
  const { value } = box.finish().summary;

  assert.equal(value.costMoney, 20); // observed subtotal, not certified total
  assert.equal(value.profitAttributed, 150);
  assert.equal(value.netValue, null);
  assert.equal(value.roi, null);
});

test('explicit zero cost is distinct from missing cost and has no finite ROI', () => {
  const box = createBlackBox({ agentId: 'free-run' });
  box.value({ costMoney: 0, profitAttributed: 100 });
  const { value } = box.finish().summary;
  assert.equal(value.costMoney, 0);
  assert.equal(value.netValue, 100);
  assert.equal(value.roi, null);
});

test('non-decimal and non-numeric values do not create fictitious metrics', () => {
  for (const raw of [' ', '  ', true, false, ['5'], '0x10', 'Infinity', 'NaN']) {
    const box = createBlackBox({ agentId: 'invalid-input' });
    box.value({ costMoney: raw, profitAttributed: 120 });
    const { value } = box.finish().summary;
    assert.equal(value.costMoney, null, `raw input: ${String(raw)}`);
    assert.equal(value.netValue, null, `raw input: ${String(raw)}`);
  }

  const box = createBlackBox({ agentId: 'decimal-input' });
  box.value({ costMoney: ' 1.25e1 ', profitAttributed: '60' });
  assert.equal(box.finish().summary.value.netValue, 47.5);
});

test('legacy outcome metrics also preserve unknown costs', () => {
  const box = createBlackBox({ agentId: 'legacy-finance' });
  box.outcome({ status: 'verified', profitAttributed: 300 });
  assert.equal(box.finish().summary.value.netValue, null);
});
