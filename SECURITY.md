# Security

Nilo Agent Black Box is designed to record agent activity, which means traces can accidentally capture sensitive material if integrations are careless.

## Do not log secrets

Do not intentionally pass passwords, session cookies, private keys, access tokens, API keys, full payment details, or other credentials into recorder payloads.

The built-in redaction patterns are only a best-effort safety net. They are not a complete data-loss-prevention system.

## Recommended production controls

- redact or minimize payloads before calling the recorder
- restrict access to stored receipts
- encrypt receipt storage and backups
- define retention/deletion rules
- separate customer/tenant data
- record permission decisions for external writes
- prefer provider IDs, hashes, and metadata over full sensitive content as evidence
- review custom tool adapters before production use

## Reporting a vulnerability

Please avoid posting credentials, exploit payloads containing real secrets, or private customer data in public issues. Open a minimal issue without sensitive details if coordination is needed before private disclosure.
