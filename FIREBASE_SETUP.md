# Firebase Setup Guide — Step by Step

Follow these steps in the Firebase Console to get everything working.

---

## 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project **macha-demo** (or create one if it doesn't exist)
3. Make sure you're on the **Blaze (pay-as-you-go)** plan if you need Storage

---

## 2. Enable Authentication

1. In Firebase Console, go to **Build → Authentication**
2. Click **Get Started** (if not already enabled)
3. Go to the **Sign-in method** tab
4. Enable the following providers:

### Email/Password
- Click **Email/Password**
- Toggle **Enable** to ON
- Click **Save**

### Google Sign-In
- Click **Google**
- Toggle **Enable** to ON
- Enter a **Project support email** (your email)
- Click **Save**

### Phone (Required for MFA)
- Click **Phone**
- Toggle **Enable** to ON
- Click **Save**

> **Note:** Phone authentication is required for SMS-based multi-factor authentication.

---

## 3. Enable Multi-Factor Authentication (MFA)

MFA is **mandatory** for all users. Follow these steps to enable it:

1. In Firebase Console, go to **Build → Authentication**
2. Click the **Settings** tab
3. Scroll down to **Multi-factor authentication**
4. Click **Enable**
5. Under **SMS**, ensure it is toggled to **Enabled**
6. Click **Save**

### Important Notes
- Users cannot access the app without completing MFA enrollment
- During account creation, users must provide a phone number and verify it via SMS
- During login, users with MFA enrolled will be prompted for an SMS code
- The app automatically redirects users to `/mfa-setup` if MFA is not enrolled

### Configure 24-Hour MFA Device Remembering (Required to Avoid Repeated MFA Prompts)
To skip SMS MFA prompts on the same browser/device for 24 hours after a successful MFA sign-in, you must enable trusted devices in Firebase:

1. Go to **Build → Authentication → Settings**
2. Scroll to **Multi-factor authentication**
3. Set **Trusted device duration** to **24 hours**
4. Click **Save**

After this is enabled, Firebase mode manages the trusted-device token automatically. No additional server-side code is required for this Firebase behavior.

### reCAPTCHA Configuration
Firebase uses reCAPTCHA to prevent abuse of SMS. The app uses invisible reCAPTCHA.
- No additional configuration needed — reCAPTCHA is handled automatically by Firebase
- If you see reCAPTCHA errors, add your domain to **Authentication → Settings → Authorized domains**

---

## 4. Configure Password Reset Email

1. In **Authentication**, go to the **Templates** tab
2. Click **Password reset**
3. Customize the fields:
   - **Sender name**: `The Macha Group` (or your preferred name)
   - **From**: `noreply@macha-demo.firebaseapp.com` (default)
   - **Reply to**: `noreply` (or your support email)
   - **Subject**: `Reset your password for %APP_NAME%`
   - **Message**: Keep the default or customize:
     ```
     Hello,

     Follow this link to reset your %APP_NAME% password for your %EMAIL% account.

     %LINK%

     If you didn't ask to reset your password, you can ignore this email.

     Thanks,

     Your %APP_NAME% team
     ```
4. Click **Save**

### Set Your App Name (shown in emails as %APP_NAME%)
1. Go to **Project Settings** (gear icon at top-left)
2. Under **General**, find **Public-facing name**
3. Set it to `Macha Group Security Platform`
4. Click **Save**

---

## 5. Set Up Cloud Firestore

1. Go to **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode**
4. Select a region close to your users (e.g., `us-central1`)
5. Click **Enable**

### Deploy Security Rules
The security rules are already defined in `firestore.rules` in the repo. Deploy them:

```bash
firebase deploy --only firestore:rules
```

Or manually paste the rules in **Firestore → Rules** tab:

```
rules_version='2'

service cloud.firestore {
  match /databases/{database}/documents {
    match /assessments/{assessmentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null
        && resource.data.userId == request.auth.uid
        && request.resource.data.userId == request.auth.uid;
    }

    match /assessmentNodes/{nodeId} {
      allow read: if request.auth != null;
    }

    match /userAssessments/{docId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.keys().hasAll(['name', 'userId', 'status']);
      allow update: if request.auth != null
        && resource.data.userId == request.auth.uid
        && request.resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null
        && resource.data.userId == request.auth.uid;
    }

    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /photos/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Deny all other access by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Click **Publish**.

### Collections Created Automatically

The app will automatically create these collections when users interact with it:

| Collection | Created When | Contents |
|---|---|---|
| `users` | User creates account or signs in with Google | User profile (name, email, phone, org, address) |
| `userAssessments` | User saves or completes an assessment | Assessment responses, score, metadata |

---

## 6. Set Up Firebase Storage (for Photos)

1. Go to **Build → Storage**
2. Click **Get Started**
3. Choose **Start in production mode**
4. Select the same region as Firestore
5. Click **Done**

### Deploy Storage Security Rules
In the **Storage → Rules** tab, paste:

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

Click **Publish**.

---

## 7. Additional Security Recommendations

### App Check (Recommended)
App Check protects your Firebase resources from abuse:

1. Go to **Build → App Check** in Firebase Console
2. Click **Get Started**
3. For Web apps, select **reCAPTCHA v3** as the provider
4. Register your app with a reCAPTCHA v3 site key from [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
5. Once registered, click **Enforce** for Firestore, Storage, and Authentication

### Email Enumeration Protection
1. Go to **Authentication → Settings**
2. Under **User actions**, ensure **Email enumeration protection** is enabled
3. This prevents attackers from discovering valid email addresses

### Authorized Domains
1. Go to **Authentication → Settings → Authorized domains**
2. Remove any domains you don't use
3. Keep only: `localhost`, your Firebase Hosting domain, and any custom domains

### Abuse Prevention
1. Go to **Authentication → Settings**
2. Set up **SMS abuse protection** to limit SMS verification attempts
3. Configure **User account deletion** policies as needed

---

## 8. Configure Your App's Firebase Settings

Your Firebase config is already in `src/services/firebaseConfig.ts`. Verify the values match your project:

1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps** → select your web app
3. Copy the config values and verify they match:

```typescript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "macha-demo.firebaseapp.com",
  projectId: "macha-demo",
  storageBucket: "macha-demo.firebasestorage.app",
  messagingSenderId: "345709514301",
  appId: "YOUR_APP_ID",
};
```

You can also set these via environment variables in `.env`:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=macha-demo.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=macha-demo
REACT_APP_FIREBASE_STORAGE_BUCKET=macha-demo.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=345709514301
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_DATA_PROVIDER=firebase
```

---

## 9. Deploy to Firebase Hosting

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Build the app
npm run build

# Deploy everything (hosting + rules)
firebase deploy
```

---

## 10. Verify Everything Works

### ✅ User Registration + MFA
1. Go to your app and click **Create Account**
2. Fill in the form with a valid phone number and submit
3. You will be redirected to the **MFA Setup** page
4. Enter the 6-digit code sent to your phone via SMS
5. After verification, you will be redirected to the dashboard
6. Check **Firebase Console → Authentication → Users** — the new user should appear with MFA enrolled
7. Check **Firestore → users** collection — a document with the user's UID should exist

### ✅ Login with MFA
1. Log in with email and password
2. If MFA is enrolled, you will receive an SMS code
3. Enter the code to complete sign-in
4. If MFA is not enrolled, you will be redirected to `/mfa-setup`

### ✅ Verify 24-Hour Trusted Device Behavior
1. Complete a normal MFA login once (email/password + SMS code)
2. Sign out
3. Sign in again from the same browser/device within 24 hours
4. Confirm you are not asked for another SMS code
5. Test from a different browser or after 24 hours to confirm MFA is required again

### ✅ Google Sign-In + MFA
1. Click **Sign in with Google** on the login page
2. Complete the Google OAuth flow
3. If MFA is not enrolled, you will be redirected to `/mfa-setup`
4. Complete phone verification
5. Check **Authentication → Users** — the Google account should appear

### ✅ Forgot Password
1. Click **Forgot password** on the login page
2. Enter a registered email and click **Send Reset Link**
3. Check the email inbox for the reset email from Firebase
4. Click the link in the email to reset the password
5. Log in with the new password

### ✅ Assessment Data
1. Create and complete an assessment
2. Check **Firestore → userAssessments** — a document with the assessment data should appear
3. In-progress assessments are also saved to Firestore
4. If photos were attached, check **Storage → photos/{userId}/{assessmentId}/** — uploaded images should appear

### ✅ Reports
1. After submitting an assessment, you should be automatically redirected to the report
2. The report should display in professional black & white format with all 8 executive summary sections
3. Click **Export as PDF** to print/save the report

---

## Troubleshooting

| Issue | Solution |
|---|---|
| "auth/network-request-failed" | Check that your Firebase API key and auth domain are correct |
| "auth/unauthorized-domain" | Add your domain to **Authentication → Settings → Authorized domains** |
| Google Sign-In not working | Verify Google provider is enabled and your domain is authorized |
| Password reset email not received | Check spam folder; verify email exists in Authentication → Users |
| Firestore permission denied | Verify security rules are published and user is authenticated |
| Photos not uploading | Verify Storage rules are published and Storage is enabled |
| MFA SMS not received | Verify Phone provider is enabled in Authentication → Sign-in method |
| reCAPTCHA errors | Add your domain to Authentication → Settings → Authorized domains |
| "auth/requires-recent-login" for MFA enrollment | User needs to re-authenticate before enrolling MFA |
