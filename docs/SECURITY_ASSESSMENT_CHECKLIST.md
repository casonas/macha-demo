# Security Assessment Checklist (OWASP Top 10 Mapping)

- [ ] **A01 Broken Access Control**: Account security endpoints require verified Firebase ID token (`Authorization: Bearer ...`) and only operate on caller UID.
- [ ] **A02 Cryptographic Failures**: Device IDs and WebAuthn credential IDs are stored as SHA-256 hashes; session cookies are `Secure`, `HttpOnly`, `SameSite=Strict`.
- [ ] **A03 Injection**: API accepts structured JSON only and avoids dynamic query construction.
- [ ] **A04 Insecure Design**: Suspicious login checks (unknown device, UA/IP change, velocity/impossible travel) require additional verification.
- [ ] **A05 Security Misconfiguration**: WebAuthn enforces exact RP ID/origin; HTTPS-only deployment required.
- [ ] **A06 Vulnerable Components**: New auth dependency (`@simplewebauthn/server`) was checked against GitHub advisory DB before use.
- [ ] **A07 Identification and Authentication Failures**: 24h trusted-device session created only after successful sign-in token verification.
- [ ] **A08 Software and Data Integrity Failures**: Server decides trust/risk; client is advisory only.
- [ ] **A09 Security Logging and Monitoring Failures**: Keep audit logs for suspicious events/revocations in Firestore/Cloud Logging.
- [ ] **A10 SSRF**: External call is limited to Google reCAPTCHA verification endpoint.
