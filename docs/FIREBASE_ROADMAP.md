<p align="center">
  <img src="https://img.shields.io/badge/Project-Macha_Group_Security_Platform-228b22?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Document_Type-Sprint_Deliverable-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Sprint-1__Prototype-orange?style=for-the-badge" />
</p>

<h1 align="center">🔥 Firebase Roadmap</h1>
<h3 align="center">Macha Group — Security Assessment Platform</h3>
<p align="center"><i>Sprint Deliverable · Prototype Phase · February 2026</i></p>

---

## 1. Executive Summary

This document is the Firebase integration roadmap for the Macha Group Security Assessment Platform. It describes:

- The current state of Firebase integration in the Sprint 1 prototype.
- The gap between the prototype and a fully Firebase-backed production system.
- A sprint-by-sprint plan to close that gap.
- The specific Firebase products to be used and why each was chosen.

The overall goal is to replace every mock/localStorage component with a production-grade, cloud-native implementation while maintaining the application's current feature set and adding new capabilities enabled by Firebase's managed infrastructure.

---

## 2. Firebase Products Overview

The platform uses (or plans to use) the following Firebase products:

| Product | Purpose | Current Status |
|:--------|:--------|:--------------:|
| **Firebase Authentication** | User identity, sign-in, MFA | ✅ Active |
| **Cloud Firestore** | Primary database (user data, assessments, profiles) | 🔄 Partial (writes active; reads from localStorage) |
| **Firebase Storage** | Photo / file attachments for assessment questions | 🔄 Partial (code written; base64 fallback in use) |
| **Firebase Hosting** | Serving the React SPA and static assets | ✅ Configured (deployment scripts ready) |
| **Cloud Functions** | Server-side business logic, scoring, audit logs | 🔄 Scaffolded (functions/ directory exists) |
| **Firebase App Check** | Abuse prevention, API abuse protection | 📋 Planned (Sprint 3) |
| **Firebase Emulator Suite** | Local development and testing | 📋 Planned (Sprint 2) |

---

## 3. Current Firebase Integration Status

### 3.1 What Is Active

#### Firebase Authentication ✅

Firebase Auth is fully integrated and is the default (`REACT_APP_DATA_PROVIDER=firebase`):

- Email/password sign-in
- Google Sign-In (OAuth popup)
- SMS-based multi-factor authentication (mandatory enrollment)
- Session management via Firebase ID tokens
- Password reset via email
- Email verification on account creation

#### Firebase Firestore (Partially Active) 🔄

Assessment responses are written to Firestore every time the user saves progress or completes an assessment. The **read path for user responses** still uses `localStorage` — the app loads its initial data from the browser's local storage. However, **assessment templates** (the question bank) are already loaded directly from Firestore via `AssessmentLoader.ts`.

**Collections currently active (read + write):**
- `userAssessments/{docId}` — assessment responses (write active; read path still localStorage)
- `users/{uid}` — user profiles (on account creation)
- `assessments/{assessmentId}` — assessment template registry/metadata (read via `loadAssessmentRegistryFirebase()`)
- `assessmentNodes/{nodeId}` — flat question nodes (category/subcategory/question tree) — **read via `loadAssessmentFirebase()`; this is the primary source of the 1,381 questions**

**Collections not yet active:**
- `auditLogs/{logId}` — audit trail (defined in security rules; not yet written to)

#### Firebase Storage (Code Written, Not Default) 🔄

The `uploadPhotosToStorage()` function in `mockDb.ts` is written and calls Firebase Storage. However, photos are currently stored as base64 data URLs in `localStorage` (prototype behavior) due to the Blaze plan requirement for Storage. The code will activate automatically once the Firebase project is on the Blaze plan.

#### Firebase Hosting ✅ (Configured)

`firebase.json` and `.firebaserc` are configured and the build/deploy pipeline is documented. The app can be deployed with:
```bash
npm run build
firebase deploy
```

#### Cloud Functions (Scaffolded) 🔄

The `functions/` directory exists and is connected to the Firebase project. No production functions have been deployed yet.

---

### 3.2 Current Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SPRINT 1 PROTOTYPE — DATA FLOW                           │
│                                                                             │
│  React App                                                                  │
│  │                                                                          │
│  ├─── Auth (Firebase Auth) ─────────────────────────────────── Firebase ✅  │
│  │                                                                          │
│  ├─── Read user assessments ─ localStorage (mockDb.ts) ─────── Local 🔄   │
│  │                                                                          │
│  ├─── Write user assessments ─┬─ localStorage (always)                     │
│  │                            └─ Firestore userAssessments/ ── Firebase ✅  │
│  │                                                                          │
│  ├─── Assessment templates ──── Firestore assessmentNodes/ ─── Firebase ✅  │
│  │    (AssessmentLoader.ts)      (falls back to local JSON if              │
│  │                               REACT_APP_DATA_PROVIDER=local)            │
│  │                                                                          │
│  └─── Photo uploads ──────────── localStorage (base64 dataUrl) ─ Local 🔄  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Target Production Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PRODUCTION TARGET — DATA FLOW                            │
│                                                                             │
│  React App                                                                  │
│  │                                                                          │
│  ├─── Auth (Firebase Auth + MFA + App Check) ──────────────────── Firebase │
│  │                                                                          │
│  ├─── Read/Write assessments ──── Firestore (real-time) ────────── Firebase │
│  │                                                                          │
│  ├─── Assessment templates ──── Firestore assessments/ ─────────── Firebase │
│  │                                                                          │
│  ├─── Photo uploads ──────────── Firebase Storage ─────────────── Firebase │
│  │                                                                          │
│  ├─── Score calculation ──────── Cloud Functions (HTTPS callable) ─ Firebase│
│  │                                                                          │
│  ├─── Audit logging ──────────── Firestore auditLogs/ ─────────── Firebase  │
│  │    (written by Cloud Function triggers)                                  │
│  │                                                                          │
│  └─── Hosting ────────────────── Firebase Hosting (CDN) ────────── Firebase │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Sprint-by-Sprint Roadmap

### Sprint 2 — Complete the Core Firebase Migration

**Goal:** Every read and write in the application goes through Firebase. No data lives exclusively in `localStorage`.

#### 5.1 Complete Firestore Read Path

**File:** `src/services/data/mockDb.ts`

Replace the `listAssessmentsByUser()` function to read from Firestore instead of `localStorage`:

```typescript
export async function listAssessmentsByUser(userId: string): Promise<AssessmentRecord[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, 'userAssessments'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AssessmentRecord));
}
```

**Cascade changes required:**
- `useAssessmentResponse` hook must become async and use `useEffect` + `useState` instead of `useMemo`.
- `HomeScreen`, `PastAssessments`, and `ReportView` must handle a loading state while data fetches.

#### 5.2 Understand the Existing `assessmentNodes` Schema

**Already completed in Sprint 1:** Assessment templates are loaded from Firestore by default. `AssessmentLoader.ts` reads the `assessmentNodes` collection and assembles the full `Assessment` object at runtime. The local JSON fallback (`public/data/assessments/`) is only used when `REACT_APP_DATA_PROVIDER=local`.

**How `AssessmentLoader.ts` works:**

```typescript
// Default path (REACT_APP_DATA_PROVIDER=firebase):
//   1. Query assessmentNodes where assessmentId == id AND active == true
//   2. Separate nodes by type: category | subcategory | question
//   3. Sort each group by the `order` field
//   4. Assemble Category[] → Question[] structure expected by the UI

async function loadAssessmentFirebase(assessmentId: string): Promise<Assessment | null> {
  const db = getDb();
  const nodesSnap = await getDocs(query(
    collection(db, 'assessmentNodes'),
    where('assessmentId', '==', assessmentId),
    where('active', '==', true)
  ));
  const nodes: FirebaseNode[] = nodesSnap.docs.map(d => d.data() as FirebaseNode);
  // ... assemble categories → subcategories → questions ...
}
```

**Two-tier caching:** Results are cached in memory (60-minute TTL) and written to `localStorage` under `macha.assessmentCache.*` keys. This dramatically reduces Firestore reads on repeat visits.

**Remaining work (Sprint 2):** Add an admin UI to edit question nodes directly without requiring a Firestore Console or script.

#### 5.3 Activate Firebase Storage for Photos

Upgrade the Firebase project to the Blaze (pay-as-you-go) plan (required for Storage). Update the photo upload flow to store to Firebase Storage:

```typescript
// Replace base64 storage with Storage URL storage
async function uploadPhoto(
  userId: string,
  assessmentId: string,
  questionId: string,
  file: File
): Promise<{ name: string; storageUrl: string }> {
  const path = `photos/${userId}/${assessmentId}/${questionId}/${Date.now()}_${file.name}`;
  const storageRef = ref(getFirebaseStorage(), path);
  await uploadBytes(storageRef, file);
  const storageUrl = await getDownloadURL(storageRef);
  return { name: file.name, storageUrl };
}
```

This change also removes the 5 MB base64 bloat from `localStorage` and Firestore documents.

#### 5.4 Set Up Firebase Emulator Suite

Add emulator configuration to `firebase.json` and document the local development workflow:

```json
// firebase.json (additions)
{
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "storage": { "port": 9199 },
    "functions": { "port": 5001 },
    "ui": { "enabled": true, "port": 4000 }
  }
}
```

Local development workflow:
```bash
firebase emulators:start   # Start all emulators
npm start                  # Start the React dev server in parallel
```

The app will be configured to auto-connect to the emulators when `REACT_APP_USE_EMULATORS=true`.

---

### Sprint 3 — Cloud Functions and Scoring Engine

**Goal:** Move sensitive and complex business logic out of the browser and into Cloud Functions.

#### 5.5 Score Calculation Cloud Function

```typescript
// functions/src/calculateScore.ts
import * as functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';

exports.calculateScore = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  }
  const { assessmentId, responses } = data;
  const db = getFirestore();
  const templateSnap = await db.collection('assessments').doc(assessmentId).get();
  if (!templateSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Assessment template not found');
  }
  const template = templateSnap.data()!;
  // ... scoring logic ...
  return { total, categoryScores };
});
```

The React app calls this function after the user submits:
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';
const calculateScore = httpsCallable(getFunctions(), 'calculateScore');
const result = await calculateScore({ assessmentId, responses });
```

#### 5.6 Audit Log Cloud Function

A Firestore trigger that writes an audit log entry every time an assessment is created, updated, or deleted:

```typescript
// functions/src/auditLog.ts
exports.onAssessmentWrite = functions.firestore
  .document('userAssessments/{docId}')
  .onWrite(async (change, context) => {
    const db = getFirestore();
    const after = change.after.exists ? change.after.data()! : null;
    const before = change.before.exists ? change.before.data()! : null;
    const action = !before ? 'assessment.create'
      : !after ? 'assessment.delete'
      : 'assessment.update';
    await db.collection('auditLogs').add({
      action,
      userId: after?.userId ?? before?.userId,
      resourceId: context.params.docId,
      timestamp: new Date(),
    });
  });
```

#### 5.7 Email Notification Cloud Function

Send an automated email confirmation when an assessment is completed:

```typescript
// functions/src/sendCompletionEmail.ts
exports.onAssessmentComplete = functions.firestore
  .document('userAssessments/{docId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status !== 'completed' && after.status === 'completed') {
      // Send email via SendGrid / Firebase Extensions
    }
  });
```

---

### Sprint 4 — Multi-Tenant Organization Support

**Goal:** Support multiple organizations (schools, districts, companies) each with their own set of buildings and assessors.

#### 5.8 Buildings Collection

```
Firestore structure:
organizations/{orgId}/
  buildings/{buildingId}/
    userAssessments/{docId}
```

Users will be assigned to organizations via `users/{uid}.organizationId`. Firestore security rules will be updated to scope reads to the user's organization.

#### 5.9 Real-Time Dashboard Updates

Replace the current poll-on-load pattern with Firestore real-time listeners:

```typescript
// useAssessments.ts
useEffect(() => {
  if (!user) return;
  const q = query(
    collection(db, 'userAssessments'),
    where('userId', '==', user.id),
    orderBy('updatedAt', 'desc')
  );
  const unsubscribe = onSnapshot(q, (snap) => {
    setAssessments(snap.docs.map(d => ({ id: d.id, ...d.data() } as AssessmentRecord)));
  });
  return () => unsubscribe();
}, [user]);
```

This makes the dashboard update instantly when any assessment changes — on any device.

#### 5.10 Firebase App Check

Enable App Check with reCAPTCHA v3 to prevent unauthorized clients from accessing Firebase services:

```typescript
// src/services/firebaseConfig.ts (addition)
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

if (process.env.REACT_APP_RECAPTCHA_SITE_KEY) {
  initializeAppCheck(getApp(), {
    provider: new ReCaptchaV3Provider(process.env.REACT_APP_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}
```

---

## 6. Firebase Products — Rationale

### Why Firebase Authentication?

| Alternative | Reason Not Chosen |
|:------------|:------------------|
| Custom JWT backend | Would require maintaining a server, handling token refresh, and building MFA from scratch |
| Auth0 | Paid; adds external dependency; Firebase Auth integrates natively with Firestore rules |
| Supabase Auth | Would require migrating the entire database to PostgreSQL |
| Clerk | Paid at scale; less native Firestore integration |

Firebase Auth was chosen because it: (1) integrates seamlessly with Firestore security rules through `request.auth`, (2) supports phone-based MFA out of the box, (3) handles token lifecycle (refresh, revocation) automatically, and (4) is free up to 10,000 monthly active users.

### Why Cloud Firestore?

| Alternative | Reason Not Chosen |
|:------------|:------------------|
| Firebase Realtime Database | Firestore has richer query capabilities, better security rules, and better scalability |
| PostgreSQL (Supabase/Neon) | Requires managing SQL schema migrations and a server-side API |
| MongoDB Atlas | No native integration with Firebase Auth; adds billing complexity |

Firestore's native `request.auth` support in security rules is a critical differentiator — it allows access control rules to be expressed directly at the database level without a backend API layer.

### Why Firebase Storage?

The assessment platform requires photo upload and retrieval. Firebase Storage integrates natively with Firebase Auth (the `request.auth.uid` variable is available in Storage rules) and supports direct browser-to-cloud uploads, eliminating the need to proxy file data through a backend server.

### Why Cloud Functions?

Business logic that should not run in the browser (score calculation, audit logging, email notifications) needs a server-side runtime. Cloud Functions is the natural choice because it:
- Runs in the same Google Cloud project as the other Firebase products.
- Scales to zero — no always-on server cost.
- Has native access to Firebase Admin SDK (bypasses security rules for server-side operations).

---

## 7. Firebase Cost Estimate

The current prototype operates within Firebase's **Spark (free) plan** limits. The following is a production cost projection based on estimated usage:

| Product | Metric | Estimated Monthly Volume | Cost |
|:--------|:-------|:------------------------:|:-----|
| Authentication | MAU | 500 users | Free (up to 10,000) |
| Firestore | Reads | 50,000/day × 30 = 1.5M | ~$0.90 |
| Firestore | Writes | 5,000/day × 30 = 150K | ~$0.27 |
| Firestore | Storage | 500 MB | Free (up to 1 GB) |
| Firebase Storage | Storage | 5 GB (photos) | ~$0.13 |
| Firebase Storage | Downloads | 10 GB/month | ~$1.20 |
| Cloud Functions | Invocations | 100K/month | Free (up to 2M/month) |
| Firebase Hosting | Bandwidth | 1 GB/month | Free (up to 10 GB/month) |
| **Total Estimate** | | | **~$2.50 / month** |

> These estimates are based on 500 active users each completing 2–3 assessments per month with an average of 5 photos per assessment. Full cost modeling is documented in `PHOTO_STORAGE_COSTS.md`.

---

## 8. Environment Configuration Reference

| Variable | Required | Description | Example |
|:---------|:--------:|:------------|:--------|
| `REACT_APP_FIREBASE_API_KEY` | ✅ | Firebase API key | `AIzaSy...` |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | ✅ | Auth domain | `macha-demo.firebaseapp.com` |
| `REACT_APP_FIREBASE_PROJECT_ID` | ✅ | Project ID | `macha-demo` |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | ✅ | Storage bucket | `macha-demo.firebasestorage.app` |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | ✅ | Messaging sender ID | `345709514301` |
| `REACT_APP_FIREBASE_APP_ID` | ✅ | Web app ID | `1:345709...` |
| `REACT_APP_DATA_PROVIDER` | | `firebase` or `local` | `firebase` |
| `REACT_APP_USE_EMULATORS` | | Enable local emulators | `true` |
| `REACT_APP_RECAPTCHA_SITE_KEY` | | App Check reCAPTCHA key | `6Lc...` |
| `REACT_APP_MAX_LOGIN_ATTEMPTS` | | Lock threshold (default: 5) | `5` |
| `REACT_APP_SESSION_TIMEOUT_MS` | | Session timeout in ms (default: 3600000) | `3600000` |

---

## 9. Deployment Pipeline (Target)

```
Developer pushes to main branch
        │
        ▼
GitHub Actions CI
  ├── npm run build
  ├── npm test
  ├── firebase deploy --only firestore:rules
  ├── firebase deploy --only storage
  └── firebase deploy --only hosting
        │
        ▼
Live at https://macha-demo.web.app
```

The CI pipeline will also run `firebase deploy --only functions` when changes are detected in the `functions/` directory.

---

## 10. Rollout Milestones

| Milestone | Sprint | Success Criteria |
|:----------|:------:|:----------------|
| Auth fully integrated | ✅ Sprint 1 | Login, register, MFA, Google Sign-In working |
| Templates in Firestore | ✅ Sprint 1 | `assessmentNodes` queried by `AssessmentLoader.ts`; local JSON is fallback only |
| Firestore read path active | Sprint 2 | `listAssessmentsByUser` reads from Firestore |
| Storage active | Sprint 2 | Photos upload to Storage; no base64 in Firestore |
| Cloud Functions deployed | Sprint 3 | Score calculated server-side; audit logs written |
| App Check enabled | Sprint 3 | reCAPTCHA v3 enforced on all Firebase services |
| Real-time dashboard | Sprint 4 | `onSnapshot` listeners replace one-time fetches |
| Multi-tenant support | Sprint 4 | Organizations and buildings collections active |

---

<p align="center"><i>Document prepared February 2026 · Macha Group Sprint 1 Deliverable</i></p>
