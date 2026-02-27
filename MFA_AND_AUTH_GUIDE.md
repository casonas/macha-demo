# MFA & Auth Behavior Guide

This document is a standalone reference for three specific questions about how authentication and multi-factor authentication (MFA) work in this application, and what steps are needed to change each behavior. No application source code needs to change for any of the topics covered here.

---

## Table of Contents

1. [MFA Device Remembering for 12–24 Hours](#1-mfa-device-remembering-for-1224-hours)
2. [Preventing the Login-Screen Redirect on Page Refresh](#2-preventing-the-login-screen-redirect-on-page-refresh)
3. [Enforcing MFA for Every User](#3-enforcing-mfa-for-every-user)

---

## 1. MFA Device Remembering for 12–24 Hours

### What happens today

Every time a user signs in with email + password, Firebase fires the `auth/multi-factor-auth-required` error (caught in `src/services/auth/authService.ts` → `login()`). The login page (`LoginMock.tsx`) catches the resulting `MfaRequiredError`, calls `startMfaSignIn()` in `src/services/auth/mfaService.ts` to send an SMS, and then calls `completeMfaSignIn()` when the user types their code. This happens on **every single sign-in** — there is no memory of the device.

### How device remembering works

"Device remembering" means: after a user successfully completes MFA on a given browser, subsequent sign-ins from that same browser within a configurable time window skip the SMS challenge entirely.

The mechanism relies on a **trust token** stored in the browser's `localStorage`. After the first successful MFA sign-in, a trust record is written to `localStorage` alongside the normal Firebase session credential. On the next sign-in attempt, before the MFA challenge is surfaced, the application (or Firebase itself, depending on the approach) checks whether a valid trust record exists for this browser and this user. If it does, the MFA step is bypassed and the user is signed in with just their email and password.

---

### Option A — Firebase Identity Platform (Recommended — Zero Code Change)

Firebase Authentication with Identity Platform (required for MFA) has native built-in support for trusted-device duration. Enabling it is a single Console change.

**Prerequisites:** The project must be using **Firebase Authentication with Identity Platform**. This is a free upgrade from standard Firebase Auth — see `FIREBASE_SETUP.md` Step 6 for the upgrade steps.

**Steps to enable:**

1. Open the [Firebase Console](https://console.firebase.google.com) and select your project.
2. Go to **Build → Authentication → Settings**.
3. Scroll to the **Multi-factor authentication** section.
4. Find **Trusted device duration**.
5. Set the value to `12 hours` or `24 hours` (or any value from 1 hour to 30 days).
6. Click **Save**.

**What changes after enabling:**

- After a user successfully completes MFA (enters the SMS code and `completeMfaSignIn()` resolves), Firebase writes an opaque trust token to `localStorage` under the application's own origin using a Firebase-namespaced key.
- On the next sign-in attempt from the same browser within the configured window, `signInWithEmailAndPassword()` in `authService.ts` → `login()` resolves **successfully without throwing `auth/multi-factor-auth-required`**.
- The rest of the sign-in flow is identical to a normal non-MFA sign-in — the `user` object is returned, `notifyListeners(user)` fires, and the app navigates to `/home`.
- If the trust token is missing, has expired, or belongs to a different user UID, Firebase throws `auth/multi-factor-auth-required` as usual and the SMS challenge proceeds normally.
- The trust token is automatically cleared when the user signs out (`signOut()` in `authService.ts` → `logout()`).

**Nothing in the application source code changes.** Firebase manages the trust token internally within its own `localStorage` namespace.

---

### Option B — Custom Trust Token (Manual Implementation)

If upgrading to Identity Platform is not immediately possible, the same behavior can be implemented by hand. The key touch points in the codebase are:

| File | Function | What to change |
|---|---|---|
| `src/services/auth/mfaService.ts` | `completeMfaSignIn()` | After `resolver.resolveSignIn(assertion)` resolves, write a trust record to `localStorage` |
| `src/services/auth/authService.ts` | `login()` | Before rethrowing `auth/multi-factor-auth-required`, check for a valid trust record |
| `src/services/auth/authService.ts` | `logout()` | Clear the trust record from `localStorage` |

**Trust record structure** (stored under a key such as `macha.deviceTrust`):

```json
{
  "deviceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "userId": "firebase-uid-of-the-signed-in-user",
  "expiresAt": 1700000000000
}
```

- `deviceId` — a UUID generated once per browser (e.g. `crypto.randomUUID()`).
- `userId` — the Firebase UID of the user who completed MFA. This prevents a trust record created by User A from bypassing MFA for User B on a shared computer.
- `expiresAt` — `Date.now() + (12 * 60 * 60 * 1000)` for 12 hours, or `Date.now() + (24 * 60 * 60 * 1000)` for 24 hours.

**Sign-in check logic (conceptual):**

```
login(email, password):
  try:
    cred = signInWithEmailAndPassword(...)
    return enrichUserWithRoles(cred.user)
  catch err where err.code === 'auth/multi-factor-auth-required':
    resolver = getMultiFactorResolver(...)
    trust  = JSON.parse(localStorage.getItem('macha.deviceTrust') || 'null')
    firstHintUid = resolver.hints && resolver.hints.length > 0
                   ? resolver.hints[0].uid
                   : null
    if trust exists
       AND trust.expiresAt > Date.now()
       AND firstHintUid !== null
       AND trust.userId === firstHintUid:
      // Trust is valid — resolve MFA silently without SMS.
      // Firebase still requires a resolver.resolveSignIn() call, which
      // in turn requires a valid PhoneAuthCredential. A truly silent
      // client-side bypass is NOT possible with stock Firebase Auth.
      // See the note below.
    throw new MfaRequiredError(resolver, null)
```

> **Important limitation:** Firebase's `resolver.resolveSignIn(assertion)` always requires a freshly issued `PhoneAuthCredential`. A purely client-side trust-token check cannot skip the actual Firebase MFA challenge — the SMS is always sent and the code must be re-entered. **Option A (Identity Platform trusted-device duration) is the only way to achieve a true silent bypass.** A more robust version of Option B would involve a server-side component: after successful MFA the server issues a short-lived custom token keyed to the device ID and stores it securely. On the next sign-in the device presents that token, the server validates it and calls `createCustomToken()`, and the client signs in via `signInWithCustomToken()` (already implemented in `authService.ts`). This requires a backend and is significantly more complex than enabling the Firebase Console toggle.

---

### Security Notes for Both Options

| Concern | Behavior |
|---|---|
| Different browser | Trust token is not present → MFA challenge always required |
| Incognito / private window | `localStorage` is isolated → MFA challenge always required |
| User clears browser data | Trust token is deleted → MFA challenge on next sign-in |
| Different device | Trust token is scoped to the browser's `localStorage` → not shared across devices |
| User changes UID | `userId` check fails → MFA challenge required |
| Trust token expires | `expiresAt` check fails → MFA challenge required |
| User signs out | Trust token is cleared by `logout()` → MFA required on next sign-in |

---

## 2. Preventing the Login-Screen Redirect on Page Refresh

### What happens today

When a user refreshes the browser on any protected route (e.g. `/home`), the React application re-mounts from scratch. The `useAuth` hook (`src/hooks/useAuth.ts`) initialises with:

```ts
const [user, setUser]       = useState<User | null>(null);   // null on mount
const [loading, setLoading] = useState<boolean>(true);        // true on mount
```

`AuthGuard` (`src/services/auth/AuthGuard.tsx`) checks `loading` first:

```tsx
if (loading) {
  return <div className="auth-guard__loading">...</div>;  // shows spinner
}
if (!isAuthenticated) {
  return <Navigate to="/login" ... />;                    // would redirect — but only reached after loading is false
}
```

Because `loading` starts as `true`, the spinner is shown **before** any redirect decision is made. This protects against a false redirect during the brief async window while Firebase restores the session.

### The async Firebase session restore

Firebase Auth stores the session credential (ID token + refresh token) in `localStorage` under a namespaced key. However, `getFirebaseAuth().currentUser` is **`null` synchronously** immediately after the Firebase SDK initializes — Firebase reads the credential from `localStorage` and validates it asynchronously. Only after this validation completes does Firebase fire the `onAuthStateChanged` callback with the restored user.

The current `useAuth` hook runs two things on mount:

1. `checkAuth()` — calls `getCurrentUser()` which reads `getFirebaseAuth().currentUser`. In Firebase mode this returns `null` synchronously on first render, so `setUser(null)` is called, and then `setLoading(false)` is called in the `finally` block.
2. `subscribeToAuthState()` — registers an `onAuthStateChanged` listener. When Firebase finishes validating the stored credential (within a few milliseconds), this listener fires with the real user and calls `setUser(user)`.

In practice, Firebase resolves so quickly from `localStorage` that step 2 fires before the component re-renders after step 1. The spinner is therefore shown for only a fraction of a second and the user is never redirected to `/login`.

### Why a redirect could occur (edge case)

On very slow devices or when the Firebase SDK is initialising for the first time, the sequence can become:

1. `checkAuth()` resolves → `setUser(null)` + `setLoading(false)`
2. React re-renders → `loading` is `false`, `isAuthenticated` is `false` → `<Navigate to="/login" />` fires
3. `onAuthStateChanged` fires → `setUser(user)` — but the user is already on the login page

### The correct pattern to eliminate this edge case

The most robust fix — which does not require any code change to `AuthGuard.tsx` or any other consumer of `useAuth` — is to change `useAuth` to **not set `loading: false` until the first `onAuthStateChanged` event fires**. This means:

1. Remove the separate `checkAuth()` call.
2. Keep `loading: true` until the `onAuthStateChanged` listener is called for the first time.
3. Inside the listener, set both `user` and `loading` in a single synchronous React state update.

This pattern is the officially recommended approach in the [Firebase Authentication Web docs](https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user) for Single-Page Applications. The `onAuthStateChanged` observer is guaranteed to fire exactly once on initialisation (before any subsequent state-change events), making it the authoritative signal that Firebase has finished restoring the session.

**Conceptual diff for `src/hooks/useAuth.ts`** (illustration only — no code change required):

```diff
  useEffect(() => {
-   const checkAuth = async () => {
-     try {
-       const currentUser = await getCurrentUser();
-       setUser(currentUser);
-       if (currentUser) { setCurrentUserId(currentUser.id); startSessionMonitor(); }
-     } finally {
-       setLoading(false);
-     }
-   };
-   checkAuth();
    const unsubscribe = subscribeToAuthState((u) => {
      setUser(u);
+     setLoading(false);   // ← loading cleared here, after Firebase confirms state
      if (u) { setCurrentUserId(u.id); startSessionMonitor(); }
      else   { setCurrentUserId(''); stopSessionMonitor(); }
    });
    return () => { unsubscribe(); stopSessionMonitor(); };
  }, []);
```

With this pattern, `loading` is never `false` while `user` is transiently `null`. The `AuthGuard` spinner remains on screen until Firebase has confirmed the auth state, and the redirect to `/login` can only fire when Firebase has positively confirmed there is no session — not while Firebase is still loading.

### Firebase session persistence mode

Firebase Auth supports three persistence modes:

| Mode | `localStorage` key | Survives page refresh | Survives browser close |
|---|---|---|---|
| `LOCAL` (default) | Yes | ✅ | ✅ |
| `SESSION` | `sessionStorage` | ✅ | ❌ |
| `NONE` | Memory only | ❌ | ❌ |

The app uses the default `LOCAL` mode, which means the Firebase credential is written to `localStorage` and survives both page refreshes and browser restarts until the user explicitly signs out. **No configuration change is needed to achieve persistent sessions across page refreshes** — this is already the default.

---

## 3. Enforcing MFA for Every User

### What is in place today

MFA is currently enforced at the **application (client) level** in `src/services/auth/AuthGuard.tsx`:

```tsx
if (!isMfaEnrolled()) {
  return <Navigate to="/mfa-setup" replace />;
}
```

`isMfaEnrolled()` (in `src/services/auth/mfaService.ts`) checks `multiFactor(user).enrolledFactors.length > 0` in Firebase mode. Any authenticated user who has not enrolled a second factor is immediately redirected to `/mfa-setup` before they can reach any protected page.

This covers the UI and prevents unenrolled users from accessing protected routes. The following sections describe how to add additional server-side enforcement layers.

---

### Layer 1 — Firebase Console: Require MFA for All Users (Recommended)

This is a single toggle in the Firebase Console that enforces MFA server-side — Firebase will refuse to issue an ID token to any user who has not completed a second-factor challenge. It cannot be bypassed from the client.

**Prerequisites:** Firebase Authentication with Identity Platform must be enabled (see `FIREBASE_SETUP.md` Step 6).

**Steps:**

1. Open the [Firebase Console](https://console.firebase.google.com) and select your project.
2. Go to **Build → Authentication → Settings**.
3. Scroll to **Multi-factor authentication**.
4. Toggle **Require multi-factor authentication for all users** to **Enabled**.
5. Click **Save**.

**Effect on the sign-in flow:**

- For users **with MFA enrolled**: `signInWithEmailAndPassword()` in `authService.ts` → `login()` always throws `auth/multi-factor-auth-required`. The `MfaRequiredError` is caught, the resolver is created, and the SMS challenge is shown. After successful MFA, the user is signed in.
- For users **without MFA enrolled**: `signInWithEmailAndPassword()` throws `auth/multi-factor-auth-required` immediately. The user is shown the SMS challenge but has no enrolled factor. The app's `AuthGuard` then redirects them to `/mfa-setup` to complete enrollment.
- Any attempt to call Firebase services (Firestore, Storage) with a token from a non-MFA sign-in will be rejected.

This toggle does not require any changes to the application code.

---

### Layer 2 — Firestore Security Rules: Verify the Second-Factor Claim

Firebase Authentication with Identity Platform includes metadata about the sign-in in the decoded ID token. When MFA was used during sign-in, Firebase sets a `sign_in_second_factor` field inside the `firebase` map in the token. This claim can be checked inside `firestore.rules` to ensure that every Firestore request comes from a session that completed MFA — providing a server-side guarantee independent of the client app.

**How to add the check to `firestore.rules`:**

Add the following helper function to `firestore.rules`:

```
// Returns true if the current request's ID token was obtained using MFA.
// Requires Firebase Authentication with Identity Platform.
// Reference: https://firebase.google.com/docs/auth/admin/custom-claims
function completedMfa() {
  return request.auth != null
    && "sign_in_second_factor" in request.auth.token.firebase
    && request.auth.token.firebase.sign_in_second_factor != "";
}
```

Then add `&& completedMfa()` to any rule where MFA verification is required. For example, to protect all user-assessment reads:

```
match /userAssessments/{docId} {
  allow read: if request.auth != null
    && completedMfa()
    && (resource.data.userId == request.auth.uid || isAdminOrOwner());
  // ... existing write rules ...
}
```

After editing `firestore.rules`, deploy the changes:

```bash
firebase deploy --only firestore:rules
```

**What this adds:** Even if a client-side bug or a direct API call bypasses `AuthGuard`, Firestore will reject the request if the ID token does not contain the MFA second-factor claim.

---

### Layer 3 — Cloud Functions Blocking Function: Reject Non-MFA Sign-ins

The `functions/index.js` file already contains a `beforeUserSignedIn` blocking function (`beforesignedin`). This function runs server-side before Firebase finalises a sign-in and issues an ID token. It can be extended to reject sign-ins where an enrolled user did not complete a second factor.

**How to extend `functions/index.js`:**

```js
exports.beforesignedin = beforeUserSignedIn((event) => {
  // Check if the user has MFA enrolled.
  const mfaInfo = event.data.multiFactor || {};
  const enrolledFactors = mfaInfo.enrolledFactors || [];

  if (enrolledFactors.length > 0) {
    // `signInSecondFactor` is set by Identity Platform to the provider ID
    // of the second factor that was used (e.g. "phone").
    // If it is absent or empty, no second factor was completed.
    // Reference: https://firebase.google.com/docs/auth/admin/blocking-functions
    const secondFactor = mfaInfo.signInSecondFactor || '';
    if (!secondFactor) {
      throw new HttpsError(
        'permission-denied',
        'Multi-factor authentication is required to sign in.'
      );
    }
  }

  return {
    sessionClaims: {
      signInIpAddress: event.ipAddress || '',
    },
  };
});
```

After editing `functions/index.js`, deploy the updated function:

```bash
firebase deploy --only functions
```

**What this adds:** The blocking function fires before the ID token is issued. If it throws an `HttpsError`, the sign-in is aborted and the client receives an error — no token is ever issued. This is the strongest server-side guarantee available.

---

### Summary of All Enforcement Layers

| Layer | Location | What it prevents | Code change required? |
|---|---|---|---|
| `AuthGuard.tsx` (already in place) | Browser | Unenrolled users reaching any protected React route | No |
| Firebase Console "Require MFA" toggle | Firebase servers | ID token being issued for any non-MFA sign-in | No |
| `completedMfa()` in `firestore.rules` | Firebase servers | Firestore reads/writes without the MFA claim in the token | Add helper + `&& completedMfa()` to rules, then deploy |
| `beforesignedin` blocking function | Firebase servers | Sign-in token issuance when enrolled user skips second factor | Extend `functions/index.js`, then deploy |

For the vast majority of deployments, **enabling the Firebase Console toggle (Layer 2) together with the existing `AuthGuard` (Layer 1)** provides complete and reliable MFA enforcement with zero code changes.
