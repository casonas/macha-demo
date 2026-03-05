# Firebase Auth Persistence for MFA Trusted Devices

Firebase MFA trusted-device behavior depends on Auth persistence.
If persistence is session-only, users can be challenged for MFA again after reload/restart.

## Required setting

Set Firebase Auth persistence to **local** before any sign-in flow runs.
In this repo, it is initialized both at app startup and before sign-in methods, so it applies automatically for any account without server-side setup.

### Modular SDK (v9+)

```ts
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

const auth = getAuth(app);
await setPersistence(auth, browserLocalPersistence);
```

### Compat / v8 reference

```ts
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
```

> This repository currently uses the modular SDK in `src/services/firebaseConfig.ts`.  
> No compat/v8 runtime auth initialization file is present.

## Troubleshooting checklist

- Use a normal browser profile (not incognito/private mode).
- Do not clear cookies/site data between login and reload.
- Ensure login and reload are on the same domain/authDomain.
- Confirm persistence is local (not session).
- Google Cloud Security Command Center organization access is **not required** for this Firebase Auth persistence behavior.

## Local e2e check

Run:

```bash
npm run test:e2e:auth-persistence
```

Optional env overrides:

- `E2E_BASE_URL`
- `E2E_USE_EXISTING_SERVER=true`
- `E2E_TEST_EMAIL`
- `E2E_TEST_PASSWORD`
- `E2E_TEST_PHONE`
- `E2E_TEST_MFA_CODE`

This test uses a non-incognito Puppeteer profile and validates that, after completing MFA once in the login flow, a page reload keeps the user authenticated without showing MFA again.

## FAQ

### If a user logs out and logs back in within 24 hours, will MFA be skipped?

- **Firebase mode:** No. Logging out (`signOut`) ends the Firebase session, and the next sign-in is a new auth event that can require MFA again.
- **Mock mode in this repo:** A 24-hour trusted-device shortcut exists for local development simulation.

Local persistence solves the "reload/browser restart while still signed in" case. It does not, by itself, create a post-logout MFA bypass in Firebase web auth.

### How do we reduce repetitive login prompts within short idle windows?

- This app now avoids client-side inactivity auto-logout for Firebase sessions.
- With local persistence enabled, refresh/reopen behavior should keep users signed in unless they explicitly sign out, clear browser data, or their auth state is revoked server-side.
- For non-Firebase/mock mode, inactivity timeout default is set to **4 hours** (override with `REACT_APP_SESSION_TIMEOUT_MS` if needed).

### How do we add Face ID / biometrics for mobile and desktop users?

On the web, "Face ID" is typically implemented as a **passkey (WebAuthn)** using the platform authenticator:

- iOS/macOS: Face ID / Touch ID
- Android: fingerprint / face unlock
- Windows: Windows Hello

Recommended direction:

1. Add passkey registration and sign-in (WebAuthn) in your auth flow.
2. Treat passkeys as the primary passwordless sign-in or as a strong MFA option.
3. Keep SMS MFA as fallback for users/devices that do not support passkeys.

Firebase Auth email/password + SMS MFA does not automatically expose browser Face ID as a drop-in second factor. Face ID support on web generally requires a passkey/WebAuthn implementation path.

### Easy step-by-step rollout (optional, supported devices only)

This keeps current config stable and does **not** force biometric auth on desktop users.

1. **Keep current login as default**  
   Do not remove email/password or SMS MFA. Passkeys should be an optional extra button.

2. **Show passkey UI only when supported**  
   In browser code, gate passkey buttons with capability checks:
   - `window.PublicKeyCredential` exists
   - (optional stronger check) `PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()`

3. **Never block sign-in if passkey is unavailable**  
   If unsupported (or user cancels), continue normal login flow.  
   This ensures desktop users on unsupported browsers are never forced into Face ID.

4. **Add enrollment in profile/settings first**  
   Start with "Add passkey" in authenticated settings, then later add "Sign in with passkey" on login.

5. **Use a backend endpoint for WebAuthn challenge verify**  
   WebAuthn requires server-side challenge generation/verification for production security.
   Keep this endpoint optional until enabled.

6. **Roll out behind a client feature flag**  
   Example: `REACT_APP_ENABLE_PASSKEY=false` by default, then enable gradually.

7. **Fallback remains unchanged**  
   Email/password + existing MFA remains primary until passkeys are fully validated.

### Apple Sign-In note

Apple Sign-In is separate from passkeys and requires additional setup.

- **Yes, you can add it as optional** (recommended).  
- **No, it should not be required for desktop users.**

High-level Apple Sign-In steps:

1. In Apple Developer, create/configure a **Services ID** and set allowed return URLs.
2. In Firebase Console → Authentication → Sign-in method, enable **Apple**.
3. Add Apple provider handling in the client login page (show button only when enabled).
4. Keep existing login methods as fallback.
5. Test on supported Apple devices/browsers and verify non-Apple desktop flow is unchanged.

### Which providers do you actually need?

Given your current setup (Email/Password, Phone, Google, Apple enabled + SMS MFA):

- You already have everything needed for your **current** auth flows.
- For **Face ID / biometrics via passkeys**, there is **no additional Firebase sign-in provider** to enable.
- Passkeys/WebAuthn are implemented as an app flow (client + backend challenge verification), not a Firebase provider toggle.

Recommended minimal provider strategy:

1. Keep **Email/Password** (primary fallback).
2. Keep **Phone + SMS MFA** (existing second factor).
3. Keep **Google** (optional social sign-in).
4. Keep **Apple** only if you want Apple users to have one-click federated login.
5. Do **not** add extra providers (Facebook/GitHub/Microsoft/etc.) unless your users explicitly need them.

This keeps configuration simple and reduces maintenance risk while preserving optional sign-in choices.
