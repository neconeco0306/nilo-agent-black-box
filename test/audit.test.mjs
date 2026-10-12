import test from 'node:test';
import assert from 'node:assert/strict';
import { auditReceipt } from '../src/audit.js';
import { createBlackBox } from '../src/index.js';
import {
  redditPublicPostFixture,
  githubDiscussionEditFixture,
  creemStorefrontAssetFixture
} from './fixtures/real-world.mjs';

test('real-world fixtures are internally consistent', () => {
  for (const receipt of [
    redditPublicPostFixture(),
    githubDiscussionEditFixture(),
    creemStorefrontAssetFixture()
  ]) {
    const audit = auditReceipt(receipt);
    assert.equal(audit.status, 'consistent', JSON.stringify(audit.findings));
    assert.equal(audit.errorCount, 0);
    assert.match(audit.limitation, /does not prove/);
  }
});

test('denied permission is flagged, without preventing historical recording', () => {
  const box = createBlackBox({agentId:'test'});
  const deny = box.permissionCheck({action:'edit',resource:'db:1',allowed:false});
  box.toolCall({tool:'db.edit',permissionEventId:deny.id});
  const audit = auditReceipt(box.finish());
  assert.ok(audit.findings.some(f => f.code === 'denied-permission-used'));
});

test('missing and unknown permission links are flagged', () => {
  const box = createBlackBox({agentId:'test'});
  box.toolCall({tool:'db.write'});
  box.toolCall({tool:'db.write',permissionEventId:'invented-id'});
  const audit = auditReceipt(box.finish());
  assert.ok(audit.findings.some(f => f.code === 'unlinked-tool-call'));
  assert.ok(audit.findings.some(f => f.code === 'unknown-permission'));
});

test('fabricated evidence IDs are flagged', () => {
  const box = createBlackBox({agentId:'test'});
  box.outcome({status:'verified',evidenceIds:['not-real']});
  const audit = auditReceipt(box.finish());
  assert.ok(audit.findings.some(f => f.code === 'unknown-evidence'));
});

test('verified outcome with zero evidence IDs is flagged', () => {
  const box = createBlackBox({agentId:'test'});
  box.outcome({status:'verified'});
  const audit = auditReceipt(box.finish());
  assert.ok(audit.findings.some(f => f.code === 'unsupported-verified-outcome'));
});

test('tampered summary, duplicate event ID, and sequence gap are flagged', () => {
  const box = createBlackBox({agentId:'test'});
  box.evidence({kind:'id',value:1});
  const receipt = box.finish();
  receipt.summary.evidenceCount = 500;
  receipt.events[1].id = receipt.events[0].id;
  receipt.events[2].sequence = 99;
  const codes = auditReceipt(receipt).findings.map(f => f.code);
  assert.ok(codes.includes('summary-mismatch'));
  assert.ok(codes.includes('duplicate-event-id'));
  assert.ok(codes.includes('sequence-mismatch'));
});

test('orphan result and forward permission references are flagged', () => {
  const box = createBlackBox({agentId:'test'});
  box.toolResult({tool:'db.write',success:true});
  const permission = box.permissionCheck({action:'write',resource:'db',allowed:true});
  box.toolCall({tool:'db.write',permissionEventId:permission.id});
  const receipt = box.finish();
  // A valid ID can still point to a later event, which is not valid authorization.
  [receipt.events[2], receipt.events[3]] = [receipt.events[3], receipt.events[2]];
  receipt.events.forEach((event, index) => { event.sequence = index + 1; });
  const codes = auditReceipt(receipt).findings.map(f => f.code);
  assert.ok(codes.includes('orphan-tool-result'));
  assert.ok(codes.includes('future-permission'));
});

test('incorrect envelope and invalid input are safely reported', () => {
  assert.equal(auditReceipt(null).status,'attention');
  assert.equal(auditReceipt({events:'not-an-array'}).status,'attention');
  const receipt = createBlackBox({agentId:'test'}).finish();
  receipt.events[0].runId = 'tampered';
  assert.ok(auditReceipt(receipt).findings.some(f => f.code === 'envelope-mismatch'));
});
