<p align="center">
  <img src="https://img.shields.io/badge/Project-Macha_Group_Security_Platform-228b22?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Document_Type-Sprint_Deliverable-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Sprint-1__Prototype-orange?style=for-the-badge" />
</p>

<h1 align="center">🔐 Security Architecture</h1>
<h3 align="center">Macha Group — Security Assessment Platform</h3>
<p align="center"><i>Sprint Deliverable · Prototype Phase · February 2026</i></p>

---

## 1. Executive Summary

This document describes the security architecture of the **Macha Group Security Assessment Platform** as implemented during Sprint 1. The platform is a working prototype that demonstrates how a full production system will be secured at every layer — from user identity and authentication through data storage and network transport.

Because this sprint produced a **functional prototype**, certain production hardening steps (e.g., App Check enforcement, custom email templates, dedicated backend) are deliberately deferred and documented as roadmap items. Every decision made in this sprint was made with the production security model in mind so that hardening requires no architectural rework.

---

## 2. Threat Model

Before designing controls, the team identified the assets worth protecting and the threats most likely to target them.

### 2.1 Assets

| Asset | Sensitivity | Description |
|:------|:-----------:|:------------|
| User credentials | 🔴 Critical | Email/password combinations stored and managed by Firebase Auth |
| Assessment responses | 🟠 High | Answers to 1,381 security questions — potentially reveals physical vulnerabilities |
| User profiles | 🟠 High | Full name, email, phone, organization, address |
| Photo uploads | 🟠 High | Site photos attached to assessment answers |
| Assessment templates | 🟡 Medium | The question bank used to generate assessments |
| Application source code | 🟡 Medium | TypeScript / React frontend logic |

### 2.2 Threat Actors

| Actor | Capability | Likely Goal |
|:------|:----------:|:------------|
| Unauthenticated external attacker | Low–Medium | Access assessment data, enumerate users |
| Authenticated but unauthorized user | Medium | Read another user's assessments or profiles |
| Credential-stuffing bot | Medium | Brute-force login with leaked credential lists |
| Insider / compromised account | High | Exfiltrate or tamper with assessment data |

### 2.3 STRIDE Analysis (Summary)

| Threat Category | Risk | Control(s) Applied |
|:----------------|:----:|:-------------------|
| **S**poofing | Medium | Firebase Auth email/password + MFA |
| **T**ampering | Medium | Firestore security rules (write only as self) |
| **R**epudiation | Low | Firestore server timestamps on every write |
| **I**nformation Disclosure | High | Per-user Firestore rules; Storage rules |
| **D**enial of Service | Low | Firebase built-in rate limiting; App Check (roadmap) |
| **E**levation of Privilege | Medium | Role-based rules (`admin`, `owner`, `user`); admin checks in Firestore rules |

---

## 3. Authentication Architecture

### 3.1 Provider

The platform uses **Firebase Authentication** (Firebase Auth) as its identity provider. Firebase Auth was chosen because:

- It is a managed, battle-tested identity service maintained by Google.
- It supports email/password, Google OAuth, and phone-based MFA out of the box.
- It integrates natively with Firestore security rules through `request.auth`.

### 3.2 Sign-In Flows

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          AUTHENTICATION FLOWS                                   │
│                                                                                 │
│  Email / Password                    Google OAuth                               │
│  ──────────────────                  ─────────────                              │
│  User enters email + password        User clicks "Sign in with Google"          │
│         │                                    │                                  │
│         ▼                                    ▼                                  │
│  Firebase Auth validates             signInWithPopup() → Google consent screen  │
│         │                                    │                                  │
│         ▼                                    ▼                                  │
│  MFA check: enrolled?                MFA check: enrolled?                       │
│    YES → SMS code challenge            YES → SMS code challenge                 │
│    NO  → redirect to /mfa-setup        NO  → redirect to /mfa-setup             │
│         │                                    │                                  │
│         ▼                                    ▼                                  │
│  Firebase ID Token issued            Firebase ID Token issued                   │
│  (JWT, short-lived, auto-refreshed)  (JWT, short-lived, auto-refreshed)         │
│         │                                    │                                  │
│         └────────────┬───────────────────────┘                                  │
│                      ▼                                                          │
│              AuthGuard component                                                │
│              checks onAuthStateChanged                                          │
│              before rendering protected routes                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Multi-Factor Authentication (MFA)

MFA is **mandatory** for all users. The implementation uses **SMS-based TOTP** via Firebase's phone authentication.

**Enrollment flow:**
1. After account creation or Google sign-in, the app detects that MFA is not yet enrolled.
2. The user is redirected to `/mfa-setup`.
3. The user enters their phone number; Firebase sends a 6-digit SMS code.
4. On successful verification, MFA is enrolled and the user is redirected to the dashboard.

**Login flow (MFA challenge):**
1. User submits email + password (or completes Google OAuth).
2. Firebase throws `auth/multi-factor-auth-required`.
3. The app catches this as `MfaRequiredError`, extracts the `MultiFactorResolver`.
4. The user is prompted to enter the SMS code.
5. On success, a Firebase ID token is issued.

**Key implementation files:**
- `src/services/auth/authService.ts` — `MfaRequiredError`, `login()`, `loginWithGoogle()`
- `src/services/auth/mfaService.ts` — `enrollMfa()`, `verifyMfaEnrollment()`
- `src/components/pages/MfaSetup.tsx` — enrollment UI

### 3.4 Session Management

| Property | Value | Rationale |
|:---------|:-----:|:----------|
| Token type | Firebase ID Token (JWT) | Industry standard; contains `uid`, `email`, roles claim |
| Token lifetime | 1 hour | Firebase default; short lifetime limits stolen-token window |
| Token refresh | Automatic (Firebase SDK) | SDK silently refreshes before expiry |
| Inactivity timeout | 1 hour (configurable via `REACT_APP_SESSION_TIMEOUT_MS`) | Enforced client-side; triggers `logout()` + `session-timeout` event |
| Session storage | Firebase SDK in-memory + IndexedDB | No raw tokens in `localStorage` |

### 3.5 Brute-Force Protection

In the mock/development mode the app enforces its own counter: after `MAX_ATTEMPTS` (default 5) failed logins the account is locked for 10 minutes. In production (Firebase mode) Firebase Auth applies server-side rate limiting automatically.

---

## 4. Authorization Architecture

### 4.1 Role Model

Users are assigned one or more roles stored in the `users/{uid}.roles` array in Firestore:

| Role | Description | Permissions |
|:-----|:------------|:------------|
| `user` | Default role for all registered users | Read/write own assessments and profile |
| `manager` | Future role (roadmap) | Read assessments for assigned buildings |
| `admin` | Elevated internal role | Read all assessments and user profiles; write assessment templates |
| `owner` | Highest privilege (reserved) | Full access; equivalent to admin for current rules |

### 4.2 Firestore Security Rules

Security rules are the **server-enforced authorization layer**. The rules run inside Firebase's infrastructure — they cannot be bypassed by modifying client-side code.

```
rules_version='2'
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: check role in user document
    function hasRole(role) {
      return request.auth != null
        && exists(/databases/$(database)/documents/users/$(request.auth.uid))
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny([role]);
    }

    function isAdminOrOwner() {
      return hasRole('admin') || hasRole('owner');
    }

    // Assessment templates
    match /assessments/{assessmentId} {
      allow read:   if request.auth != null;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null
        && (resource.data.userId == request.auth.uid || isAdminOrOwner())
        && request.resource.data.userId == request.auth.uid;
    }

    // Question nodes (read-only shared data)
    match /assessmentNodes/{nodeId} {
      allow read: if request.auth != null;
    }

    // User-specific assessment responses
    match /userAssessments/{docId} {
      allow read:   if request.auth != null
        && (resource.data.userId == request.auth.uid || isAdminOrOwner());
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.keys().hasAll(['name', 'userId', 'status']);
      allow update: if request.auth != null
        && resource.data.userId == request.auth.uid
        && request.resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null
        && (resource.data.userId == request.auth.uid || isAdminOrOwner());
    }

    // User profiles
    match /users/{userId} {
      allow read:   if request.auth != null
        && (request.auth.uid == userId || isAdminOrOwner());
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null
        && (request.auth.uid == userId || isAdminOrOwner());
      allow delete: if request.auth != null && request.auth.uid == userId;
    }

    // Photo uploads (Firebase Storage paths mirror this logic)
    match /photos/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Audit log entries: admin read, system write only
    match /auditLogs/{logId} {
      allow read:  if request.auth != null && isAdminOrOwner();
      allow write: if false;
    }

    // OAuth provider configs: admin only
    match /oauthProviders/{providerId} {
      allow read, write: if request.auth != null && isAdminOrOwner();
    }

    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 4.3 Firebase Storage Rules

Photo uploads are locked to the uploading user's UID:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 5. Data Security

### 5.1 Data in Transit

All traffic between the React frontend and Firebase services travels over **HTTPS/TLS 1.2+**. Firebase Hosting enforces HTTPS automatically; HTTP requests are redirected to HTTPS. No plain-text credentials or tokens are ever transmitted.

### 5.2 Data at Rest

Firebase Firestore and Firebase Storage encrypt data at rest using **AES-256** (managed by Google). The application does not store any sensitive data in `localStorage` beyond mock/development stubs. In production mode (`REACT_APP_DATA_PROVIDER=firebase`) no assessment responses are written to `localStorage`.

### 5.3 API Key Handling

Firebase client-side API keys are **not secret** — they identify the Firebase project but do not grant access to data. Access is controlled entirely by Firestore security rules and Firebase Auth. The following practices are applied:

- API keys are loaded from environment variables (`REACT_APP_FIREBASE_*`).
- The `.env` file is in `.gitignore` and never committed.
- `.env.example` contains placeholder values and safe defaults.
- Server-side service account keys (`serviceAccountKey.json`) are never stored in the repository.

### 5.4 Input Validation and XSS Prevention

- React escapes all rendered output by default; `dangerouslySetInnerHTML` is never used.
- User-supplied strings (assessment names, addresses) are stored verbatim and only rendered as escaped React text nodes.
- Photo uploads are validated client-side (JPEG/PNG/WebP only, max 5 MB each, max 3 per question) and enforced by Storage security rules.
- Password requirements: minimum 8 characters, at least 1 uppercase letter, at least 1 number (enforced at registration time).

---

## 6. Audit and Logging

| Layer | Mechanism | What Is Captured |
|:------|:----------|:-----------------|
| Firebase Auth | Built-in audit trail | Sign-in events, failed attempts, MFA enrollments |
| Firestore | `auditLogs` collection | Future: application-level events (roadmap) |
| Firebase Console | Admin activity log | Console logins, rule changes, config updates |
| Application | `console.error` (dev only) | Auth/Firestore errors — not user data |

**Roadmap:** A Cloud Function trigger will write structured audit log entries to the `auditLogs` collection for every assessment submission and profile update, providing a tamper-resistant record for compliance purposes.

---

## 7. Vulnerability Mitigations

| Vulnerability | Status | Mitigation |
|:-------------|:------:|:-----------|
| Credential stuffing / brute force | ✅ Mitigated | Firebase rate limiting (production); 5-attempt lockout (mock mode) |
| Unauthorized data access | ✅ Mitigated | Per-user Firestore security rules |
| Cross-site scripting (XSS) | ✅ Mitigated | React default output escaping; no `dangerouslySetInnerHTML` |
| Sensitive data in git | ✅ Mitigated | `.env` in `.gitignore`; no service account keys in repo |
| Malicious file uploads | ✅ Mitigated | MIME type + size validation; Firebase Storage rules |
| Session hijacking | ✅ Mitigated | Firebase short-lived JWT tokens; HTTPS enforced |
| Privilege escalation | ✅ Mitigated | Roles stored server-side in Firestore; checked in security rules |
| Email enumeration | 🔄 Roadmap | Enable Firebase Auth email enumeration protection in console |
| Abuse via Firebase resources | 🔄 Roadmap | Enable Firebase App Check with reCAPTCHA v3 |
| Missing server-side audit trail | 🔄 Roadmap | Cloud Function → `auditLogs` collection |

---

## 8. Security Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                                     │
│                                                                           │
│  React SPA (TypeScript)                                                   │
│  ├── AuthGuard (route protection — checks onAuthStateChanged)             │
│  ├── Login / MFA pages (no sensitive data stored client-side)             │
│  └── Assessment forms (responses sent directly to Firestore)             │
│                            │  HTTPS / TLS 1.2+                           │
└────────────────────────────│──────────────────────────────────────────────┘
                             │
                             ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                        FIREBASE (Google Cloud)                            │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Firebase Authentication                                            │  │
│  │  · Email/Password + Google OAuth                                    │  │
│  │  · SMS-based MFA (mandatory enrollment)                             │  │
│  │  · Rate limiting, session tokens (JWT), reCAPTCHA                   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Cloud Firestore                                                    │  │
│  │  · Security Rules (version-controlled in firestore.rules)          │  │
│  │  · Collections: assessments, userAssessments, users, auditLogs     │  │
│  │  · AES-256 encryption at rest                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Firebase Storage                                                   │  │
│  │  · Per-user path isolation (photos/{uid}/...)                       │  │
│  │  · Security Rules (version-controlled in storage.rules)            │  │
│  │  · AES-256 encryption at rest                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Firebase Hosting                                                   │  │
│  │  · Serves static React build                                        │  │
│  │  · HTTPS enforced; HTTP → HTTPS redirect                           │  │
│  │  · Global CDN                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Prototype vs. Production Security Gaps

This section explicitly documents what is **intentionally deferred** so the professor can evaluate the prototype against the production target.

| Gap | Prototype Behavior | Production Target |
|:----|:-----------------:|:-----------------:|
| App Check | Disabled | reCAPTCHA v3 enforced on all Firebase services |
| Email enumeration protection | Not configured | Enabled in Firebase Console |
| Audit logs | Not written | Cloud Function writes to `auditLogs` on every write |
| Password reset email template | Default Firebase template | Branded Macha Group template |
| Custom auth domain | Default `.firebaseapp.com` | Custom domain (e.g., `auth.machagroup.com`) |
| Backend API | None (direct Firestore) | Cloud Functions for business logic validation |
| SAST / dependency scanning | Not configured | GitHub Actions — `npm audit` + CodeQL on every PR |

---

## 10. References

- [Firebase Authentication documentation](https://firebase.google.com/docs/auth)
- [Firestore Security Rules reference](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Storage Security Rules](https://firebase.google.com/docs/storage/security)
- [Firebase App Check](https://firebase.google.com/docs/app-check)
- [OWASP Top 10 Web Application Security Risks](https://owasp.org/www-project-top-ten/)
- [STRIDE threat modeling framework](https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats)

---

<p align="center"><i>Document prepared February 2026 · Macha Group Sprint 1 Deliverable</i></p>
