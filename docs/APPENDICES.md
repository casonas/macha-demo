<p align="center">
  <img src="https://img.shields.io/badge/Project-Macha_Group_Security_Platform-228b22?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Document_Type-Appendices-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Sprint-1__Prototype-orange?style=for-the-badge" />
</p>

<h1 align="center">📎 Appendices</h1>
<h3 align="center">Macha Group — Security Assessment Platform</h3>
<p align="center"><i>Sprint Deliverable · Prototype Phase · February 2026</i></p>

---

## Table of Contents

- [Appendix A — AI Prompts Used in Development](#appendix-a--ai-prompts-used-in-development)
- [Appendix B — Firebase Resources & Technical References](#appendix-b--firebase-resources--technical-references)
- [Appendix C — JSON & Data Structure Reference](#appendix-c--json--data-structure-reference)
- [Appendix D — Firestore Security Rules Reference](#appendix-d--firestore-security-rules-reference)
- [Appendix E — Sprint Session Log](#appendix-e--sprint-session-log)
- [Appendix F — Full APA Reference List](#appendix-f--full-apa-reference-list)

---

## Appendix A — AI Prompts Used in Development

This appendix documents the AI-assisted development prompts used throughout Sprint 1 with **GitHub Copilot** (powered by GPT-4o). Each entry shows the session context, the prompt given, and the outcome it produced.

---

### A.1 Architecture & Planning Prompts

**Session 1 — Project Architecture Design**

> *Prompt:* "We are building a security assessment platform for K-12 schools and similar buildings. The client needs a React + TypeScript SPA that lets assessors walk through a structured questionnaire, save their progress, and generate a PDF report. We want to use Firebase for auth and data. Help me design the overall folder structure, data model, and Firebase collections."

*Outcome:* Established the core folder layout (`src/services/`, `src/components/`, `src/pages/`, `src/types/`), the `Assessment` / `AssessmentRecord` type hierarchy, and the Firestore collection schema (`userAssessments/`, `assessmentNodes/`, `users/`).

---

**Session 1 — JSON-Driven Assessment Engine**

> *Prompt:* "Right now our assessment questions are hard-coded as React components. I want to move to a JSON-driven approach where questions are stored in Firestore and the UI renders them dynamically. Design the JSON schema for a question that can be one of the following types: boolean, scale, text, select, multiselect, comment, file. Each question should support conditional show/hide logic based on another question's answer."

*Outcome:* Produced the `Question`, `ConditionalLogic`, `ValidationRule`, and `SelectOption` TypeScript interfaces now defined in `src/types/assessment.ts`. See **Appendix C** for the full schema.

---

### A.2 Firebase Integration Prompts

**Session 2 — Firebase Authentication Setup**

> *Prompt:* "Help me replace the mock login in our React app with real Firebase Authentication. We need email/password sign-in, Google Sign-In, and mandatory SMS-based multi-factor authentication (MFA). Show me the authService.ts file and explain how MFA errors are caught and routed."

*Outcome:* Generated `src/services/auth/authService.ts` with `login()`, `register()`, `logout()`, `subscribeToAuthState()`, and the `MfaRequiredError` class. MFA is enforced by catching `auth/multi-factor-auth-required` and redirecting to an SMS challenge flow.

---

**Session 2 — Firestore Data Service**

> *Prompt:* "Write a TypeScript service that saves and loads assessment records using Cloud Firestore. The collection should be `userAssessments`. Each document must include the user's Firebase UID, timestamps, the assessment template ID, and a map of question responses. Include a fallback to localStorage for the prototype phase."

*Outcome:* Produced the dual-write implementation in `src/services/data/mockDb.ts`: every save writes to both `localStorage` (immediate UI feedback) and `userAssessments/` in Firestore (cloud persistence). The read path still uses `localStorage` and is scheduled for the Firestore migration in Sprint 2.

---

**Session 2 — Firestore Security Rules**

> *Prompt:* "Write Firestore security rules for our platform. Users should only be able to read and write their own assessment records. Admins (identified by a `roles` array in their user document) should be able to read anyone's data. Assessment templates stored in `assessmentNodes/` should be readable by any authenticated user but not writable from the client."

*Outcome:* Generated the `firestore.rules` file that is now deployed to the project. Rules cover: `userAssessments/` (user-scoped read/write), `assessmentNodes/` (authenticated read-only), `users/` (self-scoped read/write), `photos/` (user-scoped), and a top-level deny-all catch.

---

### A.3 Assessment Loader Prompts

**Session 3 — AssessmentLoader with Firebase**

> *Prompt:* "We have 1,381 assessment questions stored across documents in a Firestore collection called `assessmentNodes`. Each document has: `assessmentId`, `type` (category | subcategory | question), `parentId`, `order`, `active`, and question-specific fields. Write a TypeScript function that queries these nodes, assembles them into the nested Category → Question structure our UI expects, and caches the result in localStorage with a 60-minute TTL to reduce Firestore reads."

*Outcome:* Produced `src/services/data/AssessmentLoader.ts` with `loadAssessmentFirebase()`, in-memory caching, localStorage TTL caching, and a local-JSON fallback controlled by the `REACT_APP_DATA_PROVIDER` environment variable.

---

### A.4 Security Architecture Prompts

**Session 3 — MFA Architecture Review**

> *Prompt:* "Explain how Firebase SMS-based MFA works end-to-end — from the user entering their password to receiving the SMS code to the Firebase ID token being issued. Then describe two options for implementing device-remembering (12–24 hours) so users do not have to enter an SMS code on every login: Option A using Firebase Identity Platform's native trusted-device feature, and Option B using a custom localStorage trust token. List the exact code files that would need to change for each option."

*Outcome:* Produced the content that became `MFA_AND_AUTH_GUIDE.md`, including the trust record JSON structure, the conceptual login-check pseudocode, and the side-by-side comparison table of Option A vs. Option B.

---

**Session 3 — Photo Upload Security**

> *Prompt:* "Our assessment platform allows users to upload up to 3 photos per question. What are the security risks of client-side file uploads and how do we mitigate them? Cover: malicious file uploads, XSS via image metadata, DoS via large files, and PII in photos. Then write the Firebase Storage security rules to restrict uploads to the owning user."

*Outcome:* Produced `PHOTO_UPLOAD_SECURITY.md` (risk table with mitigations) and the Storage security rules in `storage.rules`. The max file size (5 MB), accepted MIME types allowlist, and server-side re-encoding recommendation all originated from this prompt.

---

### A.5 UI & Design Prompts

**Session 1 — Visual Redesign**

> *Prompt:* "The app currently renders plain, unstyled HTML because Tailwind CSS v4 isn't loading correctly. Fix the Tailwind setup and then redesign every page — Dashboard, New Assessment, User Profile, Reports — using a professional green color palette that conveys security and trust. Each page should work on both desktop and mobile. Replace all emoji icons with inline SVG icons using the Feather Icons style."

*Outcome:* Produced the full design system (color palette, typography scale, spacing grid) now documented in `docs/UI_IMPROVEMENTS.md` and applied to all page components.

---

**Session 1 — KPI Dashboard**

> *Prompt:* "Add a KPI statistics section to the dashboard home screen showing: total assessments, completed assessments, in-progress assessments, and average score. Pull the numbers from the user's assessment records. Show a 'no assessments yet' empty state when the list is empty."

*Outcome:* Added the four stat cards to `HomeScreen.tsx` with real-time calculations from assessment records and an empty-state illustration.

---

### A.6 Documentation Prompts

**Session 4 — Firebase Roadmap**

> *Prompt:* "Write a comprehensive Firebase integration roadmap document for our security assessment platform. It should describe what is currently active (Firebase Auth, partial Firestore writes, Firestore assessment template reads, Firebase Hosting), what is scaffolded but not live (Cloud Functions, Firebase Storage), and what is planned (App Check, Emulator Suite). Include ASCII architecture diagrams for the current state and the production target. Break the remaining work into sprints with specific file names and function names."

*Outcome:* Produced `docs/FIREBASE_ROADMAP.md` — the primary sprint planning document.

---

**Session 4 — Client Migration Guide**

> *Prompt:* "Write a step-by-step guide for moving this entire application into a client's own Firebase project. The guide should require no code changes — only environment variable updates and Firebase Console configuration. Cover: creating the Firebase project, registering a web app, copying config into `.env.local`, updating `.firebaserc`, enabling auth providers, upgrading to Identity Platform for MFA, deploying Firestore rules, uploading the question bank to Firestore, and deploying to Firebase Hosting."

*Outcome:* Produced `CLIENT_MIGRATION_GUIDE.md` — the handoff document given to clients.

---

## Appendix B — Firebase Resources & Technical References

The following Firebase documentation pages were consulted directly during development. All URLs were accessed February 19–27, 2026.

---

### B.1 Firebase Authentication

| Resource | URL |
|:---------|:----|
| Firebase Authentication overview | https://firebase.google.com/docs/auth |
| Sign in with email/password | https://firebase.google.com/docs/auth/web/password-auth |
| Sign in with Google (OAuth popup) | https://firebase.google.com/docs/auth/web/google-signin |
| Multi-factor authentication (SMS) | https://firebase.google.com/docs/auth/web/multi-factor-auth |
| Manage users in Firebase Auth | https://firebase.google.com/docs/auth/web/manage-users |
| onAuthStateChanged listener | https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user |
| Password reset via email | https://firebase.google.com/docs/auth/web/manage-users#send_a_password_reset_email |
| Firebase Auth error codes | https://firebase.google.com/docs/auth/admin/errors |
| Firebase Authentication with Identity Platform (MFA trusted devices) | https://cloud.google.com/identity-platform/docs/web/mfa |

---

### B.2 Cloud Firestore

| Resource | URL |
|:---------|:----|
| Cloud Firestore overview | https://firebase.google.com/docs/firestore |
| Get started with Firestore | https://firebase.google.com/docs/firestore/quickstart |
| Add and manage data | https://firebase.google.com/docs/firestore/manage-data/add-data |
| Get data (queries, getDocs) | https://firebase.google.com/docs/firestore/query-data/get-data |
| Real-time listeners (onSnapshot) | https://firebase.google.com/docs/firestore/query-data/listen |
| Firestore security rules | https://firebase.google.com/docs/firestore/security/get-started |
| Firestore security rules reference | https://firebase.google.com/docs/reference/rules/rules |
| Firestore indexes | https://firebase.google.com/docs/firestore/query-data/index-overview |
| Firestore data model | https://firebase.google.com/docs/firestore/data-model |
| Manage data offline | https://firebase.google.com/docs/firestore/manage-data/enable-offline |

---

### B.3 Firebase Storage

| Resource | URL |
|:---------|:----|
| Firebase Storage overview | https://firebase.google.com/docs/storage |
| Upload files to Firebase Storage | https://firebase.google.com/docs/storage/web/upload-files |
| Download files from Firebase Storage | https://firebase.google.com/docs/storage/web/download-files |
| Firebase Storage security rules | https://firebase.google.com/docs/storage/security |
| Firebase Storage pricing (Blaze plan) | https://firebase.google.com/pricing |

---

### B.4 Firebase Hosting

| Resource | URL |
|:---------|:----|
| Firebase Hosting overview | https://firebase.google.com/docs/hosting |
| Deploy to Firebase Hosting | https://firebase.google.com/docs/hosting/deploying |
| Configure Firebase Hosting (firebase.json) | https://firebase.google.com/docs/hosting/full-config |
| Custom domains on Firebase Hosting | https://firebase.google.com/docs/hosting/custom-domain |

---

### B.5 Cloud Functions

| Resource | URL |
|:---------|:----|
| Cloud Functions for Firebase overview | https://firebase.google.com/docs/functions |
| HTTPS callable functions | https://firebase.google.com/docs/functions/callable |
| Firestore trigger functions (onCreate, onUpdate) | https://firebase.google.com/docs/functions/firestore-events |
| Deploying Cloud Functions | https://firebase.google.com/docs/functions/manage-functions |

---

### B.6 Firebase App Check

| Resource | URL |
|:---------|:----|
| Firebase App Check overview | https://firebase.google.com/docs/app-check |
| App Check with reCAPTCHA v3 (web) | https://firebase.google.com/docs/app-check/web/recaptcha-provider |

---

### B.7 Firebase Console & Project Management

| Resource | URL |
|:---------|:----|
| Firebase Console | https://console.firebase.google.com |
| Firebase CLI reference | https://firebase.google.com/docs/cli |
| Firebase project configuration | https://firebase.google.com/docs/projects/learn-more |
| Firebase pricing overview | https://firebase.google.com/pricing |
| Firebase Blaze (pay-as-you-go) plan | https://firebase.google.com/support/faq#expandable-17 |
| Google Cloud Console (service accounts, IAM) | https://console.cloud.google.com |

---

### B.8 Firebase Emulator Suite

| Resource | URL |
|:---------|:----|
| Firebase Emulator Suite overview | https://firebase.google.com/docs/emulator-suite |
| Emulator Suite quickstart | https://firebase.google.com/docs/emulator-suite/install_and_configure |
| Connect your app to Emulator Suite | https://firebase.google.com/docs/emulator-suite/connect_firestore |

---

## Appendix C — JSON & Data Structure Reference

This appendix provides a condensed, printable reference of every data structure used by the platform. Full documentation is in `docs/JSON_STRUCTURE.md`.

---

### C.1 Assessment Template (Firestore: `assessmentNodes/`)

Each Firestore document in `assessmentNodes/` represents one node in the question tree.

```json
{
  "nodeId": "phys-1-cam-001",
  "assessmentId": "school-security-v1",
  "type": "question",
  "parentId": "phys-cameras-sub",
  "order": 1,
  "active": true,

  "questionType": "boolean",
  "text": "Are all entry points monitored by functioning CCTV cameras?",
  "helpText": "Include interior corridors and parking areas.",
  "required": true,
  "hasCommentField": true,
  "commentPrompt": "Describe the coverage gaps, if any.",

  "conditional": {
    "dependsOn": "phys-1-000",
    "operator": "eq",
    "value": true
  },

  "options": [],

  "validation": {
    "minLength": 0,
    "maxLength": 500
  }
}
```

**Node type values:**

| `type` | Description |
|:-------|:------------|
| `category` | Top-level grouping (e.g., "Physical Security") |
| `subcategory` | Second-level grouping (e.g., "Camera Systems") |
| `question` | A leaf node — a single evaluable question |

---

### C.2 User Assessment Response (Firestore: `userAssessments/`)

```json
{
  "id": "AS-1708540800000",
  "userId": "firebase-uid-abc123",
  "assessmentId": "school-security-v1",
  "name": "Lincoln Elementary — Spring Inspection",
  "address": "123 Main Street, Springfield, IL 62701",
  "buildingType": "K-12 School",
  "status": "completed",
  "score": 78,
  "createdAt": "2026-02-21T10:00:00.000Z",
  "updatedAt": "2026-02-21T14:30:00.000Z",
  "responses": {
    "phys-1-cam-001": true,
    "phys-1-cam-002": false,
    "phys-1-cam-003": "Cameras installed but no recording hardware present.",
    "emerg-1-drill-001": 4
  },
  "photos": {
    "phys-1-cam-002": [
      {
        "id": "photo-001",
        "fileName": "north-entrance.jpg",
        "storageUrl": "https://storage.googleapis.com/...",
        "uploadedAt": "2026-02-21T11:15:00.000Z"
      }
    ]
  }
}
```

---

### C.3 User Profile (Firestore: `users/{uid}`)

```json
{
  "uid": "firebase-uid-abc123",
  "displayName": "Jane Smith",
  "email": "jane.smith@machagroup.com",
  "phone": "+15551234567",
  "organization": "The Macha Group",
  "address": "456 Office Park Dr, Chicago, IL 60601",
  "roles": ["user"],
  "mfaEnrolled": true,
  "createdAt": "2026-01-15T09:00:00.000Z"
}
```

**Valid `roles` values:** `"user"` (standard assessor), `"admin"` (platform administrator), `"owner"` (organization owner).

---

### C.4 Question Type Reference

| `questionType` | UI Widget | Response Value Type |
|:--------------|:----------|:--------------------|
| `boolean` | Yes / No toggle | `boolean` |
| `scale` | Numeric slider (1–5 or 1–10) | `number` |
| `text` | Single-line text input | `string` |
| `select` | Single-choice dropdown | `string` (option value) |
| `multiselect` | Multiple-choice checkboxes | `string[]` (option values) |
| `comment` | Multi-line textarea | `string` |
| `file` | Photo / file upload | Stored in `photos` map |

---

### C.5 Assessment Template Registry (Firestore: `assessments/`)

```json
{
  "id": "school-security-v1",
  "version": "1.0.0",
  "title": "K-12 School Security Assessment",
  "description": "Comprehensive evaluation of physical, cyber, and procedural security for K-12 educational facilities.",
  "lastUpdated": "2026-02-01",
  "author": "The Macha Group",
  "estimatedDuration": 90,
  "tags": ["school", "K-12", "physical-security", "emergency-preparedness"],
  "active": true,
  "questionCount": 1381,
  "categoryCount": 7
}
```

---

## Appendix D — Firestore Security Rules Reference

This appendix contains the complete, deployed Firestore security rules. The same content is in `firestore.rules` in the repository root.

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ─── Assessment templates (read for all authenticated users; ────────────
    // ─── write restricted to document owner — production note: ───────────────
    // ─── template writes should move to Cloud Functions only) ────────────────
    match /assessments/{assessmentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null
        && resource.data.userId == request.auth.uid
        && request.resource.data.userId == request.auth.uid;
    }

    // ─── Assessment question nodes (read-only for all authenticated users) ──
    match /assessmentNodes/{nodeId} {
      allow read: if request.auth != null;
    }

    // ─── User assessment responses (user-scoped read/write) ─────────────────
    match /userAssessments/{docId} {
      allow read: if request.auth != null
        && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.keys().hasAll(['name', 'userId', 'status']);
      allow update: if request.auth != null
        && resource.data.userId == request.auth.uid
        && request.resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null
        && resource.data.userId == request.auth.uid;
    }

    // ─── User profiles (self-scoped read/write) ──────────────────────────────
    match /users/{userId} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }

    // ─── Photo metadata records (user-scoped) ────────────────────────────────
    match /photos/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }

    // ─── Audit logs (write-only from Cloud Functions; no client reads) ───────
    match /auditLogs/{logId} {
      allow read, write: if false;
    }

    // ─── Deny all other access ───────────────────────────────────────────────
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

### D.1 Firebase Storage Security Rules

The following rules are deployed in `storage.rules`:

```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {

    // ─── User photos: only the owning user can read or write ────────────────
    match /photos/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }

    // ─── Deny all other access ──────────────────────────────────────────────
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Appendix E — Sprint Session Log

This appendix documents every work session during Sprint 1, the problems addressed, and the deliverables produced.

---

### Session 1 — Full Visual Redesign & Project Architecture

**Date:** February 19, 2026  
**Pull Request:** [#1](https://github.com/casonas/macha-demo/pull/1) — *+2,433 lines, 17 files changed*

**Problems addressed:**
- Tailwind CSS v4 was not loading — all pages appeared completely unstyled
- Navigation menu had duplicate links
- Creating an assessment only asked for a name (no address or building type)
- User profile page was an empty placeholder
- No report page existed after completing an assessment

**Deliverables:**
- Fully styled Dashboard with KPI stat cards, quick-action buttons, and activity feed
- New Assessment page with building address and type fields
- User Profile page with avatar, contact info, and assessment history
- Reports page with executive summary, score gauge, and per-question detail view
- Design system documentation (color palette, typography, spacing, icon system)

---

### Session 2 — Assessment Loading & Firebase Data Integration

**Date:** February 19, 2026 (continued)  
**Pull Request:** [#2](https://github.com/casonas/macha-demo/pull/2) — *+12,610 lines, 7 files changed*

**Problems addressed:**
- Clicking "Start Assessment" threw an error — the app could not locate assessment data
- Icons were emojis, which appeared unprofessional
- Content aligned to the far left on wide desktop screens

**Deliverables:**
- Converted 1,381-question database into the `assessmentNodes` Firestore schema
- Replaced all emoji icons with Feather-style inline SVG icons
- Applied `max-w-7xl mx-auto` centered layout to all pages
- Connected `AssessmentLoader.ts` to Firestore (Firebase-first with local JSON fallback)

**Assessment database breakdown at this session:**

| Category | Subsections | Questions |
|:---------|:-----------:|:---------:|
| Physical Security | 29 | 587 |
| Emergency Preparedness | 22 | 453 |
| Personnel Training & Awareness | 7 | 151 |
| Cybersecurity | 20 | 34 |
| Policy & Compliance | 1 | 16 |
| Community Partnership | 6 | 109 |
| Continuous Improvement | 2 | 31 |
| **Total** | **87** | **1,381** |

---

### Session 3 — Firebase Authentication, MFA & Security Architecture

**Date:** February 19–20, 2026  
**Pull Requests:** [#3](https://github.com/casonas/macha-demo/pull/3), [#4](https://github.com/casonas/macha-demo/pull/4)

**Problems addressed:**
- App used a mock localStorage-based auth system (no real identity validation)
- No multi-factor authentication — a critical gap for a platform handling sensitive building security data
- Firestore had no security rules — any authenticated user could read any document
- Photos were not persisted — they were lost on page refresh

**Deliverables:**
- `src/services/auth/authService.ts` — full Firebase Auth integration (email/password + Google OAuth)
- `src/services/auth/mfaService.ts` — SMS-based MFA with enrollment and challenge flows
- `firestore.rules` — user-scoped Firestore security rules (deployed)
- `storage.rules` — user-scoped Firebase Storage rules (deployed)
- `PHOTO_UPLOAD_SECURITY.md` — security risk analysis for photo uploads
- `PHOTO_STORAGE_COSTS.md` — Firebase Storage cost projections for 50 active users

---

### Session 4 — Documentation, Roadmap & Sprint Planning

**Date:** February 20, 2026  
**Pull Requests:** [#5](https://github.com/casonas/macha-demo/pull/5) through [#8](https://github.com/casonas/macha-demo/pull/8)

**Problems addressed:**
- No documentation existed for handing the project off to a client
- No clear plan for migrating from the prototype to production
- Assessment read path still used localStorage (not Firestore)
- Firebase Storage photos needed a Blaze plan upgrade path documented

**Deliverables:**
- `docs/FIREBASE_ROADMAP.md` — sprint-by-sprint Firebase integration plan
- `docs/JSON_STRUCTURE.md` — complete data model reference with field-by-field annotations
- `docs/SECURITY_ARCHITECTURE.md` — threat model, STRIDE analysis, and auth flow diagrams
- `docs/CODE_REFACTOR_STRATEGY.md` — technical debt list and refactor plan (~470 lines of savings identified)
- `docs/UI_IMPROVEMENTS.md` — design system documentation and before/after page comparisons
- `CLIENT_MIGRATION_GUIDE.md` — step-by-step guide to move the app into a client's Firebase project
- `MFA_AND_AUTH_GUIDE.md` — detailed explanation of MFA device-remembering options
- `FIREBASE_SETUP.md` — step-by-step Firebase Console configuration guide
- `README.md` — updated with Codespaces quickstart, tech stack, and security risk table

---

### Session 5 — Copilot Architecture Session (Current Sprint)

**Date:** February 27, 2026  
**Branch:** `copilot/build-security-assessment-foundation`

**Goal:** Build the foundation for a scalable security assessment platform with three core deliverables:
1. JSON-driven assessment engine (dynamic questions without code deployments)
2. Firebase backend security (rules, MFA, identity management)
3. Phased roadmap for migrating from prototype to production

**Deliverables:**
- This `docs/APPENDICES.md` document
- `docs/FIREBASE_ROADMAP.md` (refined sprint plan)
- `docs/SECURITY_ARCHITECTURE.md` (STRIDE analysis and auth flows)
- `docs/JSON_STRUCTURE.md` (full data schema reference)

---

## Appendix F — Full APA Reference List

*All references formatted in APA 7th edition. URLs accessed February 19–27, 2026.*

---

Google LLC. (2024a). *Firebase Authentication overview*. Firebase. https://firebase.google.com/docs/auth

Google LLC. (2024b). *Sign in users with email addresses and passwords*. Firebase. https://firebase.google.com/docs/auth/web/password-auth

Google LLC. (2024c). *Authenticate using Google Sign-In with JavaScript*. Firebase. https://firebase.google.com/docs/auth/web/google-signin

Google LLC. (2024d). *Enroll users in multi-factor authentication*. Firebase. https://firebase.google.com/docs/auth/web/multi-factor-auth

Google LLC. (2024e). *Manage users in Firebase*. Firebase. https://firebase.google.com/docs/auth/web/manage-users

Google LLC. (2024f). *Firebase Authentication error codes*. Firebase. https://firebase.google.com/docs/auth/admin/errors

Google LLC. (2024g). *Cloud Firestore overview*. Firebase. https://firebase.google.com/docs/firestore

Google LLC. (2024h). *Get started with Cloud Firestore*. Firebase. https://firebase.google.com/docs/firestore/quickstart

Google LLC. (2024i). *Add data to Cloud Firestore*. Firebase. https://firebase.google.com/docs/firestore/manage-data/add-data

Google LLC. (2024j). *Get data with Cloud Firestore*. Firebase. https://firebase.google.com/docs/firestore/query-data/get-data

Google LLC. (2024k). *Listen to real-time updates*. Firebase. https://firebase.google.com/docs/firestore/query-data/listen

Google LLC. (2024l). *Get started with Cloud Firestore Security Rules*. Firebase. https://firebase.google.com/docs/firestore/security/get-started

Google LLC. (2024m). *Cloud Firestore Security Rules reference*. Firebase. https://firebase.google.com/docs/reference/rules/rules

Google LLC. (2024n). *Cloud Firestore data model*. Firebase. https://firebase.google.com/docs/firestore/data-model

Google LLC. (2024o). *Firebase Storage overview*. Firebase. https://firebase.google.com/docs/storage

Google LLC. (2024p). *Upload files with Cloud Storage on Web*. Firebase. https://firebase.google.com/docs/storage/web/upload-files

Google LLC. (2024q). *Download files with Cloud Storage on Web*. Firebase. https://firebase.google.com/docs/storage/web/download-files

Google LLC. (2024r). *Firebase Storage Security Rules*. Firebase. https://firebase.google.com/docs/storage/security

Google LLC. (2024s). *Firebase Hosting overview*. Firebase. https://firebase.google.com/docs/hosting

Google LLC. (2024t). *Deploy to Firebase Hosting*. Firebase. https://firebase.google.com/docs/hosting/deploying

Google LLC. (2024u). *Configure Firebase Hosting behavior*. Firebase. https://firebase.google.com/docs/hosting/full-config

Google LLC. (2024v). *Cloud Functions for Firebase overview*. Firebase. https://firebase.google.com/docs/functions

Google LLC. (2024w). *Call functions from your app*. Firebase. https://firebase.google.com/docs/functions/callable

Google LLC. (2024x). *Trigger functions with Cloud Firestore*. Firebase. https://firebase.google.com/docs/functions/firestore-events

Google LLC. (2024y). *Firebase App Check overview*. Firebase. https://firebase.google.com/docs/app-check

Google LLC. (2024z). *Use the Firebase Emulator Suite*. Firebase. https://firebase.google.com/docs/emulator-suite

Google LLC. (2024aa). *Firebase CLI reference*. Firebase. https://firebase.google.com/docs/cli

Google LLC. (2024ab). *Firebase pricing*. Firebase. https://firebase.google.com/pricing

Google LLC. (2024ac). *Multi-factor authentication with Identity Platform*. Google Cloud. https://cloud.google.com/identity-platform/docs/web/mfa

Microsoft Corporation. (2024). *GitHub Copilot documentation*. GitHub Docs. https://docs.github.com/en/copilot

OpenAI. (2024). *GPT-4o technical report*. OpenAI. https://openai.com/research/gpt-4o

React. (2024). *React documentation*. Meta Open Source. https://react.dev

TypeScript. (2024). *TypeScript handbook*. Microsoft. https://www.typescriptlang.org/docs/handbook/intro.html

Wieruch, R. (2023). *The road to Firebase*. Robin Wieruch. https://www.robinwieruch.de/firebase-tutorial

---

*Appendices document prepared by The Macha Group development team. Sprint 1 — February 2026.*
