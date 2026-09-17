# Nilo Agent Black Box — launch positioning

## Core wedge

**A verifiable operational receipt for AI agents — from permission to real-world outcome to ROI.**

Do not position this as another generic tracing dashboard or as a compliance product.

The differentiator is the chain:

```text
Permission → Tool action → Evidence → Outcome → Rollback → Business value
```

Most observability products are strongest at traces, tokens, latency, replay, and debugging.
Most audit-led products are strongest at tamper evidence, signatures, retention, and compliance.

Nilo Agent Black Box should own the question:

> The agent ran. Was it allowed, did the intended thing actually happen, can we prove it, can we undo it, and was it worth it?

## GitHub description

`Operational receipts for AI agents — permissions, actions, evidence, outcomes, rollback readiness, and ROI.`

## README hero

**A flight recorder that verifies more than the trace.**

Turn an AI-agent run into a portable receipt linking authorization, external actions, evidence, real outcomes, reversibility, and measurable value.

## Short launch post

AI agents are getting good at doing things outside the chat.

But a successful tool call still doesn't tell you:

- was it authorized?
- did the intended outcome happen?
- what proves it?
- can it be undone?
- did it save or make anything?

I'm building Nilo Agent Black Box: a tiny OSS recorder that turns an agent run into a portable operational receipt.

Permission → Action → Evidence → Outcome → Rollback → ROI

## First public demo

Use one simple external action with visible evidence:

1. permission check
2. tool call
3. provider ID / changed-record ID as evidence
4. verified outcome
5. rollback readiness
6. value event with cost + time saved
7. print one compact receipt

Avoid demos that require private customer data or unverifiable revenue claims.

## Early hit signals

Treat the launch as promising if any one happens organically:

- developers ask for an OpenAI / MCP adapter
- someone opens an issue with a real missing receipt field
- an external project integrates the receipt format
- someone asks for a hosted explorer
- someone asks how to connect receipts to their business metrics

Stars are useful distribution evidence, but integration requests are a stronger product signal.
