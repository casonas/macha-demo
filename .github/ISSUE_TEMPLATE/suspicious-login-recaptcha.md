---
name: Suspicious Login reCAPTCHA
description: Track work for risk scoring and conditional reCAPTCHA
title: "[Security] Suspicious-login reCAPTCHA"
labels: ["security", "recaptcha", "risk"]
assignees: []
---

## Scope
- [ ] Risk heuristics (device, UA/IP, velocity)
- [ ] reCAPTCHA v3 verification for suspicious flows
- [ ] Threshold configuration (`securityConfig/auth`)

## Acceptance
- [ ] Suspicious flows are blocked until reCAPTCHA passes
- [ ] Non-suspicious flows remain low-friction
