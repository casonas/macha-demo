# Remediation Checklist

- [ ] Set and rotate `RECAPTCHA_SECRET_KEY` in secure runtime config (never commit it).
- [ ] Set `WEBAUTHN_RP_ID` and `WEBAUTHN_ORIGIN` to your production HTTPS domain.
- [ ] Configure `securityConfig/auth` (`recaptchaMinScore`, `maxTrustedDevices`) per environment.
- [ ] Review Firestore and IAM policies to ensure least privilege for Functions service account.
- [ ] Add Cloud Logging alert on repeated `impossible_travel` or reCAPTCHA failures.
- [ ] Validate account flows: list/revoke trusted devices and WebAuthn credentials.
- [ ] Run periodic dependency + security scans (npm audit, CodeQL, advisory checks).
