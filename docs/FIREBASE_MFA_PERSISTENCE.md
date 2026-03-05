# Firebase Auth Persistence for MFA Trusted Devices

Firebase MFA trusted-device behavior depends on Auth persistence.
If persistence is session-only, users can be challenged for MFA again after reload/restart.

## Required setting

Set Firebase Auth persistence to **local** before any sign-in flow runs.

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
