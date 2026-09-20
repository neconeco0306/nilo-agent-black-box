import test from 'node:test';
import assert from 'node:assert/strict';
import {
  redditPublicPostFixture,
  githubDiscussionEditFixture,
  creemStorefrontAssetFixture
} from './fixtures/real-world.mjs';

const fixtures = [
  ['reddit', redditPublicPostFixture],
  ['github', githubDiscussionEditFixture],
  ['creem', creemStorefrontAssetFixture]
];

for (const [name, build] of fixtures) {
  test(`real-world fixture: ${name} maps into Agent Receipt without inventing business value`, () => {
    const receipt = build();

    assert.equal(receipt.schemaVersion, '0.2');
    assert.equal(receipt.summary.permissionChecks, 1);
    assert.equal(receipt.summary.deniedPermissions, 0);
    assert.equal(receipt.summary.toolCalls, 1);
    assert.equal(receipt.summary.toolFailures, 0);
    assert.ok(receipt.summary.evidenceCount >= 1);
    assert.equal(receipt.summary.outcomeCount, 1);

    assert.equal(receipt.summary.value.costMoney, null);
    assert.equal(receipt.summary.value.revenueAttributed, null);
    assert.equal(receipt.summary.value.profitAttributed, null);
    assert.equal(receipt.summary.value.netValue, null);
    assert.equal(receipt.summary.value.roi, null);
    assert.equal(receipt.summary.value.timeSavedMinutes, null);

    const outcome = receipt.events.find((event) => event.type === 'outcome');
    assert.equal(outcome.data.status, 'verified');
    assert.match(outcome.data.note, /unknown/i);
  });
}

test('fixtures preserve different rollback evidence states', () => {
  assert.equal(redditPublicPostFixture().summary.rollbackReady, false);
  assert.equal(githubDiscussionEditFixture().summary.rollbackReady, true);
  assert.equal(creemStorefrontAssetFixture().summary.rollbackReady, true);
});

test('GitHub fixture preserves mutation receipt vs authoritative read-back as separate evidence', () => {
  const evidenceKinds = githubDiscussionEditFixture().events
    .filter((event) => event.type === 'evidence')
    .map((event) => event.data.kind);

  assert.deepEqual(evidenceKinds, [
    'mutation-receipt',
    'authoritative-full-body-readback'
  ]);
});

test('Creem fixture preserves admin save vs fresh public rendering as separate evidence', () => {
  const evidenceKinds = creemStorefrontAssetFixture().events
    .filter((event) => event.type === 'evidence')
    .map((event) => event.data.kind);

  assert.deepEqual(evidenceKinds, [
    'editor-save-readback',
    'fresh-public-rendering'
  ]);
});
