import { createBlackBox } from '../src/index.js';

function redditFixture() {
  const box = createBlackBox({
    agentId: 'hronaut-supervised-browser-agent',
    metadata: { fixture: 'reality-test-1', surface: 'reddit' }
  });
  const permission = box.permissionCheck({
    action: 'publish_public_comment',
    resource: 'reddit:r/webscraping:monthly-self-promotion-thread',
    allowed: true,
    reason: 'Owner-authorized routine public marketing in the designated promotion thread'
  });
  box.toolCall({
    tool: 'browser.submit',
    input: { destination: 'reddit-public-comment-form' },
    permissionEventId: permission.id,
    reversible: null
  });
  box.toolResult({ tool: 'browser.submit', success: true, output: { uiAccepted: true } });
  const permalink = box.evidence({
    kind: 'public-permalink-readback',
    uri: 'https://www.reddit.com/r/webscraping/comments/1w3zpdi/comment/pahb0fb/',
    note: 'Permanent page existed and rendered the intended author/body/timestamp.'
  });
  box.outcome({
    status: 'verified',
    metric: 'permanent_page_exists',
    target: true,
    observed: true,
    evidenceIds: [permalink.id],
    note: 'Independent signed-out visibility and business outcome remain unknown.'
  });
  box.rollback({
    available: false,
    attempted: false,
    success: null,
    note: 'Edit/delete rollback was not tested; availability is unknown for this fixture.'
  });
  return box.finish({ summary: 'Public comment existence verified; reach/value unknown.' });
}

function githubFixture() {
  const box = createBlackBox({
    agentId: 'hronaut-supervised-github-agent',
    metadata: { fixture: 'reality-test-2', surface: 'github-discussions' }
  });
  const permission = box.permissionCheck({
    action: 'update_discussion',
    resource: 'github:orgs/hronaut/discussions/201',
    allowed: true,
    reason: 'Repository owner authorized maintenance of public Hronaut Discussions'
  });
  box.toolCall({
    tool: 'github.graphql.updateDiscussion',
    input: { discussion: 201 },
    permissionEventId: permission.id,
    reversible: true
  });
  box.toolResult({ tool: 'github.graphql.updateDiscussion', success: true, output: { accepted: true } });
  const readback = box.evidence({
    kind: 'authoritative-full-body-readback',
    uri: 'https://github.com/orgs/hronaut/discussions/201',
    note: 'Fresh GraphQL read-back confirmed intended addition and preservation of the existing body.'
  });
  box.outcome({
    status: 'verified',
    metric: 'public_routing_change',
    target: true,
    observed: true,
    evidenceIds: [readback.id],
    note: 'Downstream setup-report behavior and business value remain unknown.'
  });
  box.rollback({
    available: true,
    method: 'restore previously captured Discussion body',
    attempted: false,
    success: null,
    note: 'Rollback readiness known; execution untested.'
  });
  return box.finish({ summary: 'GitHub public state change verified by authoritative read-back.' });
}

function creemFixture() {
  const box = createBlackBox({
    agentId: 'hronaut-supervised-browser-agent',
    metadata: { fixture: 'reality-test-3', surface: 'creem-storefront' }
  });
  const permission = box.permissionCheck({
    action: 'replace_public_store_assets',
    resource: 'creem:store/hronaut',
    allowed: true,
    reason: 'Store owner explicitly authorized the prepared public-asset uploads and saves'
  });
  box.toolCall({
    tool: 'browser.storefront-editor',
    input: { assets: ['banner', 'annual-cover', 'monthly-cover'] },
    permissionEventId: permission.id,
    reversible: true
  });
  box.toolResult({ tool: 'browser.storefront-editor', success: true, output: { catalogueReturned: true } });
  const rendering = box.evidence({
    kind: 'fresh-public-rendering',
    uri: 'https://www.creem.io/stores/hronaut',
    note: 'Fresh public reload showed replacement assets and the intended two-product catalogue.'
  });
  box.outcome({
    status: 'verified',
    metric: 'public_presentation_change',
    target: true,
    observed: true,
    evidenceIds: [rendering.id],
    note: 'Visitor behavior, conversion, revenue, and time saved remain unknown.'
  });
  box.rollback({
    available: true,
    method: 'restore retained prior brand assets',
    attempted: false,
    success: null,
    note: 'Rollback readiness known; execution untested.'
  });
  return box.finish({ summary: 'Back-office save and fresh public rendering verified.' });
}

for (const receipt of [redditFixture(), githubFixture(), creemFixture()]) {
  console.log(JSON.stringify(receipt, null, 2));
}
