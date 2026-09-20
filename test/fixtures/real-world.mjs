import { createBlackBox } from '../../src/index.js';

export function redditPublicPostFixture() {
  const box = createBlackBox({
    agentId: 'fixture-reddit-browser-agent',
    metadata: { source: 'external-reality-test', surface: 'reddit' }
  });
  const permission = box.permissionCheck({
    action: 'publish_public_comment',
    resource: 'r/webscraping monthly self-promotion thread',
    allowed: true,
    reason: 'Owner authorized routine public marketing in the designated thread'
  });
  box.toolCall({
    tool: 'browser.submit_comment',
    input: { destination: 'public-thread' },
    permissionEventId: permission.id,
    reversible: null
  });
  box.toolResult({
    tool: 'browser.submit_comment',
    success: true,
    output: { uiAccepted: true }
  });
  const permalink = box.evidence({
    kind: 'permanent-page-readback',
    uri: 'https://www.reddit.com/r/webscraping/comments/1w3zpdi/comment/pahb0fb/',
    note: 'Rendered author/body/links/timestamp matched intended public text'
  });
  box.outcome({
    status: 'verified',
    metric: 'permanent_page_exists',
    target: 1,
    observed: 1,
    evidenceIds: [permalink.id],
    note: 'Permanent-page existence verified; independent visibility and business outcome remain unknown'
  });
  box.rollback({
    available: false,
    attempted: false,
    note: 'Edit/delete was not tested; rollback capability remains unknown'
  });
  return box.finish({ summary: 'Public comment existence verified; downstream visibility/value unknown.' });
}

export function githubDiscussionEditFixture() {
  const box = createBlackBox({
    agentId: 'fixture-github-discussion-agent',
    metadata: { source: 'external-reality-test', surface: 'github' }
  });
  const permission = box.permissionCheck({
    action: 'edit_public_discussion',
    resource: 'Hronaut organization Discussion #201',
    allowed: true,
    reason: 'Repository owner authorized public discussion maintenance'
  });
  box.toolCall({
    tool: 'github.graphql.updateDiscussion',
    input: { discussionNumber: 201 },
    permissionEventId: permission.id,
    reversible: true
  });
  const mutation = box.evidence({
    kind: 'mutation-receipt',
    uri: 'https://github.com/orgs/hronaut/discussions/201',
    note: 'Mutation returned same discussion number/url with updated timestamp'
  });
  box.toolResult({
    tool: 'github.graphql.updateDiscussion',
    success: true,
    output: { accepted: true },
    evidenceIds: [mutation.id]
  });
  const readback = box.evidence({
    kind: 'authoritative-full-body-readback',
    uri: 'https://github.com/orgs/hronaut/discussions/201',
    note: 'Fresh read-back confirmed intended Setup report line and preserved existing content'
  });
  box.outcome({
    status: 'verified',
    metric: 'public_routing_change',
    target: 1,
    observed: 1,
    evidenceIds: [readback.id],
    note: 'Public state change verified; downstream setup-report behavior and business value unknown'
  });
  box.rollback({
    available: true,
    method: 'restore previously captured discussion body',
    attempted: false,
    note: 'Rollback readiness known; execution untested'
  });
  return box.finish({ summary: 'GitHub public state mutation verified by authoritative read-back.' });
}

export function creemStorefrontAssetFixture() {
  const box = createBlackBox({
    agentId: 'fixture-creem-storefront-agent',
    metadata: { source: 'external-reality-test', surface: 'creem' }
  });
  const permission = box.permissionCheck({
    action: 'replace_public_storefront_assets',
    resource: 'Hronaut public Creem storefront',
    allowed: true,
    reason: 'Store owner explicitly authorized prepared public asset uploads and saves'
  });
  box.toolCall({
    tool: 'browser.storefront_asset_update',
    input: { assets: ['banner', 'annual-cover', 'monthly-cover'] },
    permissionEventId: permission.id,
    reversible: true
  });
  const saveReceipt = box.evidence({
    kind: 'editor-save-readback',
    uri: 'https://www.creem.io/stores/hronaut',
    note: 'Catalogue return established that admin-side saves were accepted'
  });
  box.toolResult({
    tool: 'browser.storefront_asset_update',
    success: true,
    output: { saved: true },
    evidenceIds: [saveReceipt.id]
  });
  const publicRender = box.evidence({
    kind: 'fresh-public-rendering',
    uri: 'https://www.creem.io/stores/hronaut',
    note: 'Fresh public reload showed replacement banner/covers and unchanged intended product catalogue'
  });
  box.outcome({
    status: 'verified',
    metric: 'public_presentation_change',
    target: 1,
    observed: 1,
    evidenceIds: [publicRender.id],
    note: 'Public presentation verified; visitor behavior, conversion and revenue unknown'
  });
  box.rollback({
    available: true,
    method: 'restore retained prior assets',
    attempted: false,
    note: 'Rollback feasible but untested'
  });
  return box.finish({ summary: 'Storefront public rendering verified; conversion/value unknown.' });
}
