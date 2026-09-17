# Contributing to Nilo Agent Black Box

Thanks for helping improve the project.

## Best contributions right now

We especially want:

- real AI-agent failure modes that current receipts cannot explain
- missing audit / evidence / rollback fields
- OpenAI, MCP, or generic tool-call adapter proposals
- receipt interoperability examples
- security and redaction improvements
- examples that prove business outcomes or ROI without relying on subjective claims

## Before opening a PR

1. Open an issue describing the failure mode or interoperability need.
2. Keep the core event vocabulary small unless a new event type is truly necessary.
3. Prefer backwards-compatible optional fields.
4. Never include real credentials, private customer data, or secrets in fixtures.
5. Add tests for behavior changes.

## Design rules

- Tool success is not the same as outcome success.
- Important actions should be linkable to the permission decision that allowed them.
- Outcome claims should point to evidence when possible.
- Rollback readiness should be explicit.
- Receipts should remain portable JSON / JSONL.
- Redaction is a safety net, not permission to log secrets.

## Local checks

```bash
npm test
node examples/basic.mjs
```

## Security issues

Please follow `SECURITY.md` instead of posting sensitive exploit details publicly.
