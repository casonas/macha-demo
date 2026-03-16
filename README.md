# Macha Group — Security Assessment Platform

A React-based security assessment dashboard for The Macha Group.

## Run in the Browser — No Local Setup Required

You can open and run this project entirely in the browser using **GitHub Codespaces**:

1. Click the green **`<> Code`** button at the top of the repository page on GitHub.
2. Select the **Codespaces** tab.
3. Click **"Create codespace on main"** (or your branch).
4. Wait ~1 minute for the environment to build — VS Code opens automatically in your browser.
5. Fill in your Firebase credentials in the `.env.local` file that was created for you (copy the values from `.env.example`).
6. In the terminal at the bottom, run:
   ```bash
   npm start
   ```
7. A pop-up will appear asking you to **Open in Browser** — click it and the app loads.

> **Tip:** Codespaces is free for personal accounts up to 60 hours/month. You can stop or delete a Codespace at any time from the Codespaces tab.

### Fast GitHub Workflow (No Re-Download Each Change)

1. Create **one** Codespace once (same branch each time).
2. After that, use **Resume Codespace** instead of creating a new one.
3. In terminal, run:
   ```bash
   git pull
   npm start
   ```
4. Make edits, test, and commit from that same Codespace.
5. Next session, resume the same Codespace again (your files and installed `node_modules` stay there).

If Codespaces RAM is high:
- Use a **2-core or 4-core** machine size (avoid larger unless needed).
- Keep only one dev server running.
- Close unused browser preview tabs and VS Code extensions.
- Rebuild container only when dependencies or devcontainer settings change.

## Local Quick Start

```bash
npm install
npm start
```

The app opens at **http://localhost:3000**.

## Demo Credentials

| Role  | Email                  | Password  |
|-------|------------------------|-----------|
| Admin | admin@machagroup.com   | admin123  |
| User  | user@school.edu        | user123   |

## Available Scripts

| Command         | Description                        |
|-----------------|------------------------------------|
| `npm start`     | Run the dev server (localhost:3000) |
| `npm run build` | Create a production build          |
| `npm test`      | Run tests                          |

## Secure Session + Face ID (WebAuthn)

This repo now includes a Firebase Functions auth API under `/api/**` with:

- `POST /api/preAuthCheck` (trusted device + risk decision)
- `POST /api/sessionLogin` (24h `createSessionCookie`, suspicious-login reCAPTCHA)
- `POST /api/webauthn/registerOptions`, `POST /api/webauthn/register`
- `POST /api/webauthn/authOptions`, `POST /api/webauthn/auth`
- `GET/POST /api/account/trustedDevices*` and `GET/POST /api/account/webauthnCredentials*`

### Firestore schema additions

- `users/{uid}/trustedDevices/{deviceHash}`
  - `createdAt`, `expiresAt`, `lastSeenIP`, `lastSeenUA`, `label`, `deviceHash`
- `users/{uid}/webauthn/{credIdHash}`
  - `credIdHash`, `publicKey`, `counter`, `transports`, `createdAt`, `lastUsedAt`, `revoked`
- `securityConfig/auth`
  - `recaptchaMinScore`, `maxTrustedDevices`

### Required env vars

Client (`.env.local`):

- `REACT_APP_AUTH_API_BASE=/api`
- `REACT_APP_RECAPTCHA_SITE_KEY=...` (recommended for suspicious-login checks)
- `REACT_APP_ENABLE_PASSKEY=true` (to show Face ID / passkey UI)

Functions (`firebase functions:config:set` or runtime env):

- `RECAPTCHA_SECRET_KEY`
- `RECAPTCHA_MIN_SCORE` (default `0.5`)
- `MAX_TRUSTED_DEVICES` (default `5`)
- `WEBAUTHN_RP_ID` (must match your HTTPS domain)
- `WEBAUTHN_ORIGIN` (e.g., `https://your-domain.com`)
- `WEBAUTHN_RP_NAME` (optional)

### Security defaults

- Session cookie flags: `Secure; HttpOnly; SameSite=Strict; Path=/`
- Device IDs and WebAuthn credential IDs are SHA-256 hashed before storage
- WebAuthn RP ID + origin are enforced on verification
- Suspicious patterns (unknown/expired device, UA/IP drift, velocity/impossible travel) trigger reCAPTCHA

### IAM least-privilege notes (Firebase Functions)

- Use the default Functions service account only with:
  - `Firebase Authentication Admin` (token verification/custom token/session cookie operations)
  - `Cloud Datastore User` (Firestore read/write for `users/*`, config, and challenge docs)
- Avoid broad roles such as `Editor` in production.
- Restrict who can deploy Functions and who can edit runtime secrets.

### Test commands

- Client tests: `CI=true npm test -- --watchAll=false --passWithNoTests`
- Functions risk/unit tests: `cd functions && node --test test/authApi.test.js`

## Deploying to Firebase

```bash
# Install Firebase CLI (one-time)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy Firestore rules only
firebase deploy --only firestore:rules

# Deploy Firestore rules + indexes
firebase deploy --only firestore

# Build and deploy everything (rules + hosting)
npm run build
firebase deploy

# Deploy hosting only (after building)
npm run build
firebase deploy --only hosting
```

## Tech Stack

- React 18 + TypeScript
- React Router 6
- Tailwind CSS 4
- Firebase (auth & data)

---

## Firebase Implementation Guide

### Step 1 — Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/) and click **Add Project**.
2. Name it (e.g. `macha-security-platform`), disable Google Analytics if not needed, and click **Create Project**.
3. In the project dashboard, click the **Web** icon (`</>`) to register a web app.
4. Copy the config object — you'll need it in Step 2.

### Step 2 — Add Firebase Config to the App

Create a file `src/services/firebase.ts` (or update the existing one):

```ts
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const auth = getAuth(app);
export async function initFirebaseAuthPersistence() {
  await setPersistence(auth, browserLocalPersistence);
}
```

For MFA trusted-device behavior details and troubleshooting, see `/docs/FIREBASE_MFA_PERSISTENCE.md`.

Add your keys to a `.env` file at the project root (never commit this file). Create React App automatically exposes variables prefixed with `REACT_APP_`:

```
REACT_APP_FIREBASE_API_KEY=your-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Step 3 — Enable Authentication

1. In Firebase Console → **Authentication** → **Sign-in method**.
2. Enable **Email/Password**.
3. Replace the mock auth service (`src/services/auth/authService.ts`) with real Firebase calls:

```ts
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';

export async function login(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return mapUser(cred.user);
}

export async function register({ displayName, email, password }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  return mapUser(cred.user);
}

export async function logout() {
  await signOut(auth);
}

export function subscribeToAuthState(callback) {
  return onAuthStateChanged(auth, (user) => callback(user ? mapUser(user) : null));
}

function mapUser(fbUser) {
  return {
    id: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName || '',
  };
}
```

### Step 4 — Set Up Firestore for Data

1. In Firebase Console → **Firestore Database** → **Create Database** → Start in **production mode**.
2. Replace the localStorage mock (`src/services/data/mockDb.ts`) with Firestore calls:

```ts
import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, query, orderBy } from 'firebase/firestore';

export async function listAssessments(userId: string) {
  const q = query(collection(db, 'users', userId, 'assessments'), orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveAssessment(userId: string, record: AssessmentRecord) {
  await setDoc(doc(db, 'users', userId, 'assessments', record.id), record);
}
```

### Step 5 — Deploy to Firebase Hosting

```bash
# Install Firebase CLI (one-time)
npm install -g firebase-tools

# Login
firebase login

# Initialize hosting (select your project, set build dir to "build")
firebase init hosting

# Build and deploy
npm run build
firebase deploy --only hosting
```

Your app will be live at `https://your-project-id.web.app`.

---

## Security Risks & Mitigations

| Risk | Description | Mitigation |
|------|-------------|------------|
| **Exposed API Keys** | Firebase config is visible in client-side code. | API keys alone can't access data — use Firestore Security Rules to lock down access. Never store server-side keys (like `serviceAccountKey.json`) in the frontend or commit them to git. |
| **No Firestore Rules** | Default open rules let anyone read/write all data. | Write strict rules: users can only access their own documents. See example below. |
| **Weak Passwords** | No password strength enforcement. | Use Firebase's built-in password policy settings, or validate minimum length (8+ chars) on the client before calling `createUserWithEmailAndPassword`. |
| **No Rate Limiting** | Brute-force login attempts are possible. | Firebase Auth has built-in rate limiting, but also consider adding reCAPTCHA via Firebase App Check. |
| **Service Account Key in Repo** | `serviceAccountKey.json` is currently committed. | **Delete it from the repo immediately.** Rotate the key in Google Cloud Console. Add it to `.gitignore`. Use environment variables or CI/CD secrets instead. |
| **XSS via User Input** | Assessment names/addresses could contain scripts. | React escapes output by default. Never use `dangerouslySetInnerHTML`. Sanitize on the server side with Firestore rules or Cloud Functions. |
| **No HTTPS Enforcement** | Data could be intercepted in transit. | Firebase Hosting serves over HTTPS by default. No action needed if using Firebase Hosting. |

### Recommended Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Block all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Code Reduction Opportunities

The current codebase has several areas where code can be significantly reduced:

### 1. Remove Mock Auth & Data Services
Once Firebase is connected, delete the entire mock layer:
- `src/services/auth/authService.ts` — Replace with ~30 lines of real Firebase Auth calls (shown above).
- `src/services/data/mockDb.ts` — Replace localStorage with ~20 lines of Firestore calls.
- **Savings: ~150+ lines removed.**

### 2. Consolidate Duplicate SVG Icons
The same SVG icons (shield, clipboard, user, credit card) are duplicated across `HomeScreen.tsx` and `ActionTiles.tsx`. Extract them into a single `src/components/icons/` folder:
```tsx
// src/components/icons/ShieldIcon.tsx
export const ShieldIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" ...>...</svg>
);
```
- **Savings: ~60 lines of duplicate SVG markup.**

### 3. Extract Reusable Card Components
KPI cards in `HomeScreen.tsx` repeat the same structure 4 times. Use the existing `KpiCard` component instead:
```tsx
<KpiCard title="Total" value={total} subtitle="Assessments" />
<KpiCard title="Completed" value={completed} subtitle="Finished reports" />
```
- **Savings: ~80 lines of repeated card markup.**

### 4. Unify Quick Actions Data
Quick action definitions are duplicated between `HomeScreen.tsx` and `ActionTiles.tsx`. Move them to a shared config:
```ts
// src/config/quickActions.ts
export const quickActions = [
  { label: 'New Inspection', href: '/create-assessment', icon: ShieldIcon, description: '...' },
  // ...
];
```
- **Savings: ~30 lines.**

### 5. Remove Unused Imports & Dead Code
- `import-questions.js` and `purge-uncategorized.js` in the project root are one-time scripts — move them out or delete.
- `serviceAccountKey.json` should never be in the repo — remove it (also a security fix).
- **Savings: Files removed from the repo, cleaner project structure.**

### 6. Merge Duplicate CSS Files
`pages.css`, `AssessmentDemo.css`, and `auth-pages.css` contain overlapping styles. Consolidate into a single stylesheet or rely entirely on Tailwind utility classes.
- **Savings: ~50 lines of CSS.**

### Summary of Potential Reductions

| Area | Estimated Lines Saved |
|------|-----------------------|
| Mock services → Firebase | ~150 |
| Duplicate SVG icons | ~60 |
| Reusable card components | ~80 |
| Shared quick actions config | ~30 |
| Dead code & scripts | ~100 |
| CSS consolidation | ~50 |
| **Total** | **~470 lines** |
