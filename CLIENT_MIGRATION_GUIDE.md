# Client Firebase Migration Guide

This document covers four topics:

1. **How to move this entire app into a client's Firebase project** — step-by-step, without changing or affecting any functionality.
2. **How MFA device-remembering (12–24 hours) works** — an in-depth explanation of the mechanism and what enabling it would require.
3. **How to stop users from being redirected to the login screen on page refresh** — how the current auth-state persistence works and how to ensure a seamless reload experience.
4. **How to make MFA enforceable for every user** — both at the Firebase-console level and at the application level.

---

## Part 1 — Migrating to a Client's Firebase Project

All Firebase configuration in this codebase is driven by environment variables (`.env.local`) and two project-level files (`.firebaserc`, `firebase.json`). Migrating to a different Firebase project means creating a new project on the client's Google/Firebase account, copying the credentials into those files, and redeploying. **No application source code needs to change.**

### Step 1 — Create a New Firebase Project in the Client's Account

1. Log in to [https://console.firebase.google.com](https://console.firebase.google.com) using the **client's** Google account (or an account that belongs to their organization).
2. Click **Add project**.
3. Enter a project name (e.g. `acme-security-platform`). A unique project ID is generated automatically — note it down.
4. Choose whether to enable Google Analytics (optional). Click **Create project**.
5. Upgrade the project to the **Blaze (pay-as-you-go)** plan. This is required for Cloud Functions, Storage, and Identity Platform. Click the spark-plug icon in the lower-left → **Upgrade**.

---

### Step 2 — Register a Web App and Copy the Config

1. In the Firebase Console, click the **</>** (Web) icon to add a web app.
2. Give the app a nickname (e.g. `acme-web`).
3. Check **Also set up Firebase Hosting** if you plan to host on Firebase.
4. Click **Register app**.
5. Firebase displays a config object like this:

   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "acme-security-platform.firebaseapp.com",
     projectId: "acme-security-platform",
     storageBucket: "acme-security-platform.firebasestorage.app",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abc123",
   };
   ```

   Copy all six values — you will paste them into the `.env.local` file in the next step.

---

### Step 3 — Update the Environment Variables

In the root of the repository, copy the example file to create your local config:

```bash
cp .env.example .env.local
```

Open `.env.local` and replace the placeholder values with the client's project values:

```
REACT_APP_DATA_PROVIDER=firebase
REACT_APP_FIREBASE_API_KEY=AIza...
REACT_APP_FIREBASE_AUTH_DOMAIN=acme-security-platform.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=acme-security-platform
REACT_APP_FIREBASE_STORAGE_BUCKET=acme-security-platform.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:abc123
```

> **Important:** Do **not** add quotes or spaces around the `=` sign. The `firebaseConfig.ts` file strips them, but it is safest to avoid them entirely.

---

### Step 4 — Update `.firebaserc` to Point to the Client's Project

Open `.firebaserc` at the root of the repository and change the project alias:

```json
{
  "projects": {
    "default": "acme-security-platform"
  }
}
```

This tells the Firebase CLI which project to target for all `firebase deploy` commands.

---

### Step 5 — Enable Authentication Providers

In the Firebase Console for the client's project:

1. Go to **Build → Authentication → Sign-in method**.
2. Enable **Email/Password** — toggle ON, click Save.
3. Enable **Google** — toggle ON, enter a support email, click Save.
4. Enable **Phone** — toggle ON, click Save. (Required for SMS-based MFA.)

---

### Step 6 — Upgrade to Firebase Authentication with Identity Platform (Required for MFA)

Standard Firebase Authentication does not support multi-factor authentication. The app requires **Firebase Authentication with Identity Platform**, which is a free upgrade.

1. In the Firebase Console, go to **Build → Authentication**.
2. Click the banner **"Upgrade to Identity Platform"** (or find it under **Settings → Multi-factor authentication**).
3. Complete the upgrade wizard. This enables the Identity Platform APIs at no additional base cost (usage-based billing still applies for SMS).

---

### Step 7 — Enable Multi-Factor Authentication

After upgrading to Identity Platform:

1. Go to **Build → Authentication → Settings**.
2. Scroll to **Multi-factor authentication**.
3. Toggle **Enable** to ON.
4. Under **SMS**, ensure SMS is enabled.
5. Click **Save**.

---

### Step 8 — Add Authorized Domains

Firebase only allows sign-in redirects (including Google OAuth) from explicitly authorized domains.

1. Go to **Build → Authentication → Settings → Authorized domains**.
2. Add:
   - `localhost` (for local development)
   - `acme-security-platform.firebaseapp.com` (Firebase Hosting default domain)
   - `acme-security-platform.web.app` (alternate Firebase Hosting domain)
   - Any custom domain the client will use (e.g. `app.acmesecurity.com`)

---

### Step 9 — Set Up Firestore Database

1. Go to **Build → Firestore Database → Create database**.
2. Select **Start in production mode**.
3. Choose a region close to the client's users (e.g. `us-central1` for the US, `europe-west1` for Europe).
4. Click **Enable**.

Deploy the security rules that are already in the repository:

```bash
firebase deploy --only firestore:rules
```

This deploys `firestore.rules` to the client's project. The rules enforce that users can only read/write their own data, and admins have elevated access — no changes are needed.

---

### Step 10 — Set Up Firebase Storage

1. Go to **Build → Storage → Get started**.
2. Select **Start in production mode**.
3. Choose the **same region** as Firestore.
4. Click **Done**.

Deploy the storage security rules:

```bash
firebase deploy --only storage
```

This deploys `storage.rules` to the client's project.

---

### Step 11 — Deploy Cloud Functions

The `functions/` directory contains auth triggers (welcome email on user creation, cleanup on deletion) and blocking functions (domain restriction, IP session claims).

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

> **Note:** Cloud Functions require the Blaze plan, which was already set up in Step 1.

---

### Step 12 — Configure Email Templates (Optional but Recommended)

Firebase sends password-reset and email-verification emails. Customize them to use the client's branding:

1. Go to **Build → Authentication → Templates**.
2. For each template (Email address verification, Password reset):
   - Set **Sender name** to the client's company name.
   - Set **Subject** to a branded message.
   - Customize the email body as needed.
3. Go to **Project Settings (gear icon) → General → Public-facing name** and set it to the client's app name. This populates the `%APP_NAME%` placeholder in templates.

---

### Step 13 — Build and Deploy to Firebase Hosting

```bash
# Install dependencies (first time only)
npm install

# Build the production bundle
npm run build

# Deploy the app and all Firebase resources
firebase deploy
```

After deploying, the app is live at:

- `https://acme-security-platform.web.app`
- `https://acme-security-platform.firebaseapp.com`

---

### Step 14 — Verify the Migration

| Check | How to verify |
|---|---|
| User can create an account | Go to the app → Create Account. Confirm user appears in **Authentication → Users** in the console. |
| Firestore profile is created | Check **Firestore → users** collection for the new user's document. |
| Email verification is sent | Complete registration and check inbox for a verification email from `noreply@acme-security-platform.firebaseapp.com`. |
| MFA enrollment works | After email verification, complete the MFA phone setup. Confirm SMS arrives. |
| Login with MFA works | Log in — after entering email/password, you should be prompted for an SMS code. |
| Google Sign-In works | Click "Sign in with Google" — the OAuth popup should complete without errors. |
| Assessment data saves | Create and submit an assessment. Check **Firestore → userAssessments**. |

---

## Part 2 — MFA Device Remembering (12–24 Hours)

### How It Works

When a user completes MFA (enters the correct SMS code), Firebase Authentication issues a **session credential** for that user. Under the default Firebase behavior, this session credential is stored in the browser's `localStorage` (the default persistence mode). The credential includes an **ID token** (valid for 1 hour) and a **refresh token** (valid indefinitely until revoked).

This means that Firebase already "remembers" the user's authenticated state across browser sessions and page refreshes — the user will not be asked for their email/password again until they explicitly log out or the refresh token is revoked. However, Firebase does **not** natively skip the MFA challenge for "remembered" devices by default. Every new sign-in event requires the MFA code.

To add a 12–24 hour MFA bypass for trusted devices, the mechanism works as follows:

---

### Option A — Firebase Authentication with Identity Platform (Recommended, No Code Change)

Firebase Authentication with Identity Platform (already required for MFA, as described in Part 1) supports **trusted device duration** natively in the Firebase Console.

1. In the Firebase Console, go to **Build → Authentication → Settings**.
2. Under **Multi-factor authentication**, find the **Trusted device duration** setting.
3. Set the duration to the desired value — for example, `12 hours` or `24 hours`.
4. Click **Save**.

With this setting enabled, after a user successfully completes MFA on a given browser/device, Firebase stores a **trust token** in the browser's `localStorage` (under the Firebase Auth namespace). On the next sign-in from the same device within the configured time window, Firebase detects the trust token and does not prompt for the MFA code. The sign-in completes after email/password alone.

**What this looks like from the application's perspective:**

- The user enters email + password.
- Firebase checks for a valid trust token in `localStorage`.
- If a valid token exists and has not expired (within 12–24 hours), the `signInWithEmailAndPassword` call resolves successfully **without** throwing `auth/multi-factor-auth-required`.
- The app receives the user object normally — the MFA challenge never fires.
- If the token is missing or expired, Firebase throws `auth/multi-factor-auth-required` as usual, and the app shows the SMS code entry screen.

No application code changes are needed for Option A — it is entirely managed by Firebase.

---

### Option B — Custom Trust Token in localStorage (No Identity Platform Upgrade Required)

If upgrading to Identity Platform is not immediately feasible, the same behavior can be implemented manually. The high-level mechanism is:

1. **After successful MFA sign-in** — once `completeMfaSignIn()` resolves without error (in `mfaService.ts`), write a record to `localStorage` that contains:
   - A randomly generated device ID (UUID).
   - The user's UID.
   - An expiry timestamp set to `Date.now() + (12 * 60 * 60 * 1000)` for 12 hours, or `24 * 60 * 60 * 1000` for 24 hours.

   Example structure:
   ```json
   {
     "deviceId": "a1b2c3d4-...",
     "userId": "abc123",
     "expiresAt": 1700000000000
   }
   ```

2. **Before prompting for MFA during sign-in** — in the `login()` function in `authService.ts`, after `signInWithEmailAndPassword` throws `auth/multi-factor-auth-required`, check `localStorage` for a trust record. If the record exists, belongs to the same user, and has not expired, skip the MFA challenge entirely and complete the sign-in.

3. **On logout** — clear the trust record from `localStorage` so the user must re-verify MFA on the next sign-in from this device.

4. **On MFA enrollment change** — if a user unenrolls or re-enrolls MFA, invalidate any existing trust records.

This approach is entirely client-side and requires only changes to `authService.ts` and `mfaService.ts` — the rest of the application is unaffected.

---

### Security Considerations for Device Remembering

- **`localStorage` is scoped to the browser origin** — a different browser or incognito window will not have the trust token, so MFA will always be required there.
- **The trust record does not survive a browser data clear** — if the user clears cookies/storage, they will be prompted for MFA on the next sign-in.
- **The trust record is not shared across devices** — signing in on a phone and on a laptop are treated independently.
- **Always tie the trust record to the specific user UID** — this prevents a record left by one user from bypassing MFA for a different user on the same shared computer.
- **Set a conservative expiry** — 12 hours is appropriate for sensitive applications; 24 hours is reasonable for lower-sensitivity internal tools.

---

## Part 3 — Preventing the Login-Screen Redirect on Page Refresh

### Why It Happens

When a user loads or refreshes any protected page (e.g. `/home`), the React application starts fresh. The `useAuth` hook initializes with `loading: true` and `user: null`. `AuthGuard` checks `loading` first — while loading is `true` it renders a spinner instead of redirecting. This is the key mechanism that prevents the flicker.

However, there is a subtle timing difference between how Firebase and the mock mode restore the session:

- **Mock mode** — `getCurrentUser()` reads synchronously from `localStorage`, so the user is available immediately. Loading is set to `false` with the correct user, and the spinner is shown for only a moment.
- **Firebase mode** — `getCurrentUser()` calls `getFirebaseAuth().currentUser`, which is `null` synchronously on first SDK initialization. Firebase then asynchronously restores the session from `localStorage` and fires the `onAuthStateChanged` callback. If `loading` is set to `false` before this callback fires, `isAuthenticated` will briefly be `false` and `AuthGuard` will redirect to `/login`.

### How the Current Code Handles This

The `useAuth` hook (in `src/hooks/useAuth.ts`) sets up both an initial `checkAuth()` call and an `onAuthStateChanged` subscription via `subscribeToAuthState`. The `loading` flag starts as `true` and is only set to `false` after `checkAuth()` resolves. The `AuthGuard` (in `src/services/auth/AuthGuard.tsx`) renders a loading spinner while `loading` is `true`, so there is a safe window during which Firebase can restore the session.

In practice, Firebase restores the session within a few milliseconds of SDK initialization (reading from `localStorage`), so the spinner is visible for only a fraction of a second and the user is never actually redirected to the login screen.

### The Correct Pattern to Guarantee No Redirect

The most robust pattern — which eliminates even the brief moment where `user` is `null` after `loading` becomes `false` — is to delay setting `loading: false` until the **first `onAuthStateChanged` event fires**, rather than after `getCurrentUser()` returns. In this pattern:

1. `useAuth` starts with `loading: true`.
2. It does **not** call `checkAuth()` separately. Instead, it sets up the `onAuthStateChanged` listener.
3. When `onAuthStateChanged` fires for the first time (with either a user object or `null`), **then** set `loading: false` and `user` simultaneously.
4. This guarantees that `loading` is never `false` while `user` is transiently `null` due to the async Firebase restore.

The `onAuthStateChanged` function in the Firebase JS SDK is documented to fire exactly once on initialization (with the persisted user or `null`), and then again on any subsequent auth-state change. Relying on this first event is the standard Firebase-recommended pattern for SPA routing guards.

Because the `AuthGuard` already correctly renders a loading spinner while `loading: true`, any implementation that keeps `loading: true` until Firebase confirms the auth state will prevent the login redirect on page refresh with zero changes to routing logic.

---

## Part 4 — Enforcing MFA for All Users

MFA is currently enforced at the **application level** — `AuthGuard.tsx` redirects any authenticated user who has not enrolled MFA to `/mfa-setup`. This means a user cannot reach any protected page without completing MFA enrollment.

To additionally enforce MFA at the **Firebase platform level** (so that API calls to Firestore also require MFA), two layers are available:

---

### Layer 1 — Firebase Console Enforcement (Recommended)

Firebase Authentication with Identity Platform allows you to require MFA for all users without any code change:

1. In the Firebase Console, go to **Build → Authentication → Settings**.
2. Under **Multi-factor authentication**, find **"Require multi-factor authentication for all users"**.
3. Toggle this to **Enabled**.
4. Click **Save**.

With this setting, Firebase will reject any sign-in that did not complete a second factor. The `signInWithEmailAndPassword` call will always throw `auth/multi-factor-auth-required` for users who have MFA enrolled, and users without MFA enrolled cannot sign in at all — they must enroll MFA before their first successful sign-in. This is enforced server-side by Firebase and cannot be bypassed from the client.

---

### Layer 2 — Firestore Security Rules Enforcement

Firebase Authentication with Identity Platform includes the second-factor method used during sign-in as a claim inside the decoded ID token. You can check this claim in `firestore.rules` to verify that any Firestore request was made by a session that completed MFA. This ensures that even if someone obtains a valid (non-MFA) Firebase ID token through other means, they cannot read or write Firestore data.

The claim lives at `request.auth.token.firebase.sign_in_second_factor`. Firebase sets this to a non-empty string (e.g. `"phone"`) when a second factor was verified during sign-in, and leaves it absent when no second factor was used. Example helper function to add to `firestore.rules`:

```
// Only allow access if the user completed MFA during sign-in
// Requires Firebase Authentication with Identity Platform.
// Verify the exact claim path against the Identity Platform custom-claims
// documentation: https://firebase.google.com/docs/auth/admin/custom-claims
function completedMfa() {
  return request.auth != null
    && "sign_in_second_factor" in request.auth.token.firebase
    && request.auth.token.firebase.sign_in_second_factor != "";
}
```

You would then add `&& completedMfa()` to any rule where MFA verification is required. This is an optional additional layer — the application-level enforcement in `AuthGuard.tsx` is already sufficient for protecting the UI.

---

### Layer 3 — Cloud Functions Enforcement (Blocking Function)

The `functions/index.js` file already contains a `beforeUserSignedIn` blocking function (`beforesignedin`). This function fires server-side before every sign-in is finalized. You can add a check here to reject sign-ins that did not include a second factor for users who have MFA enrolled.

In the Firebase blocking function `beforeUserSignedIn`, the `event.data` object is the `UserRecord` for the signing-in user. The `multiFactor.enrolledFactors` array on the `UserRecord` lists the factors the user has enrolled. To detect whether the current sign-in actually completed a second factor, check `event.credential.signInMethod` — for MFA-resolved sign-ins the credential will reflect the second factor provider. Because the exact shape of `event.credential` can vary by SDK version, always consult the [Identity Platform blocking functions reference](https://firebase.google.com/docs/auth/admin/blocking-functions) when implementing this check. A simplified illustrative example:

```js
// In functions/index.js — beforesignedin blocking function
exports.beforesignedin = beforeUserSignedIn((event) => {
  const enrolledFactors = (event.data.multiFactor && event.data.multiFactor.enrolledFactors) || [];
  // If the user has MFA enrolled, verify that a second factor was used.
  // Consult the blocking functions API reference for the exact field that
  // signals a completed second-factor challenge for your SDK version.
  if (enrolledFactors.length > 0) {
    const provider = (event.credential && event.credential.signInMethod) || '';
    if (!provider) {
      throw new HttpsError("permission-denied", "MFA is required to sign in.");
    }
  }
  return {
    sessionClaims: {
      signInIpAddress: event.ipAddress || "",
    },
  };
});
```

This is a server-side guard that blocks sign-in before the ID token is issued. Combined with the Firebase Console toggle and the `AuthGuard` client-side check, this creates three independent layers of MFA enforcement.

---

### Summary of MFA Enforcement Layers

| Layer | Where it runs | What it blocks |
|---|---|---|
| `AuthGuard.tsx` | Browser (client) | Unenrolled users from reaching protected pages |
| Firebase Console → Identity Platform "Require MFA" | Firebase servers | Any sign-in that did not complete a second factor |
| Firestore Security Rules `completedMfa()` | Firebase servers | Firestore reads/writes without MFA in the ID token |
| `beforeUserSignedIn` Cloud Function | Firebase servers (blocking) | Sign-in token issuance without a second factor |

For most applications, enabling the Firebase Console toggle (Layer 2) combined with the existing `AuthGuard` (Layer 1) provides robust MFA enforcement with no code changes required.
