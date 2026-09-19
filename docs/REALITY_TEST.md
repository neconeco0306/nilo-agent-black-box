# Reality test: 3 external-action fixtures

Issue #4 collected three sanitized Hronaut runs on materially different external surfaces.

These are **mapping fixtures**, not claims of Nilo/Hronaut integration, compatibility, revenue, conversion, or autonomous operation. Unknown downstream outcomes stay unknown.

## 1. Reddit browser/public-post flow

Evidence ladder:

```text
browser submit receipt
→ permanent-page existence
→ independent visibility
→ business outcome
```

Established:
- the supervised agent submitted one public comment in the designated monthly self-promotion thread
- the permanent comment URL existed and matched the intended public text

Unknown:
- broader signed-out visibility
- lead generation
- revenue
- time saved
- rollback execution

## 2. GitHub Discussion mutation/read-back flow

Evidence ladder:

```text
mutation receipt
→ authoritative full-body read-back
→ confirmed public routing change
→ setup-report behavior
→ business value
```

Established:
- GitHub accepted one `updateDiscussion` mutation
- a fresh GraphQL read-back confirmed the complete intended body was preserved
- the public Discussion contained the new structured setup-report route

Unknown:
- whether users submit setup reports
- support-volume reduction
- time saved
- revenue

Rollback:
- readiness is known because the previous body was captured
- execution is untested

## 3. Creem back-office-to-public flow

Evidence ladder:

```text
upload/preview receipt
→ editor save/catalogue return
→ fresh public rendering
→ visitor behavior
→ purchase/business value
```

Established:
- replacement banner and two product covers were uploaded and saved
- the catalogue accepted the saves
- a fresh public reload showed the intended replacement assets
- the public catalogue still showed exactly the intended two products at unchanged public prices

Unknown:
- visitor attention
- click-through
- checkout completion
- conversion lift
- revenue
- time saved

Rollback:
- prior and replacement assets were retained, so rollback readiness is known
- rollback execution is untested

## Schema findings

The current v0.2 event model maps all three runs without inventing business outcomes.

The reality test exposed two summary-level gaps:

1. **Rollback readiness and rollback execution are different.** A receipt should report whether rollback was attempted and whether any attempted rollback succeeded, not only whether rollback is available.
2. **Unknown must remain explicit.** Successful tool results and verified public state changes must not auto-populate revenue, conversion, time saved, or other business-value fields.

The implementation now exposes `rollbackAttempted` and `rollbackSucceeded` in the receipt summary. Value fields remain `null` unless evidence-backed values are recorded.

Source discussion: #4.
