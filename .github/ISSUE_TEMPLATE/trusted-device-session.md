---
name: Trusted Device Session
description: Track work for 24h remembered device + session cookie flow
title: "[Auth] Trusted device 24h session"
labels: ["auth", "security"]
assignees: []
---

## Scope
- [ ] `/preAuthCheck` and `/sessionLogin` behavior
- [ ] 24h secure session cookie flags
- [ ] Trusted device persistence + max-device limits

## Acceptance
- [ ] Returning non-suspicious trusted device can skip repetitive MFA prompts
- [ ] Suspicious device requires additional challenge

## Notes
Add environment and Firestore schema updates in PR description.
