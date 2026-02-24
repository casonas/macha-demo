/**
 * Cloud Functions for Macha Demo
 *
 * Auth triggers:
 *   - sendWelcomeEmail: Fires on user creation to save the profile and (optionally) send a welcome email.
 *   - cleanupUser: Fires on user deletion to remove associated data.
 *
 * Blocking functions (require Firebase Authentication with Identity Platform):
 *   - beforeUserCreated: Validates new registrations (e.g. domain restrictions).
 *   - beforeUserSignedIn: Attaches session claims such as sign-in IP address.
 */

const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const functions = require("firebase-functions");
const {
  beforeUserCreated,
  beforeUserSignedIn,
  HttpsError,
} = require("firebase-functions/v2/identity");

initializeApp();

// ---------------------------------------------------------------------------
// 1. Auth trigger – user creation
// ---------------------------------------------------------------------------

exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  const db = getFirestore();
  const userRef = db.collection("users").doc(user.uid);

  // Persist a user profile if one doesn't already exist.
  const snap = await userRef.get();
  if (!snap.exists) {
    await userRef.set({
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      roles: ["user"],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  // Write an audit log entry for the new registration.
  await db.collection("auditLogs").add({
    action: "user.created",
    userId: user.uid,
    email: user.email || "",
    timestamp: FieldValue.serverTimestamp(),
  });
});

// ---------------------------------------------------------------------------
// 2. Auth trigger – user deletion
// ---------------------------------------------------------------------------

exports.onUserDeleted = functions.auth.user().onDelete(async (user) => {
  const db = getFirestore();

  // Remove the user's Firestore profile.
  await db.collection("users").doc(user.uid).delete();

  // Write an audit log entry for the deletion.
  await db.collection("auditLogs").add({
    action: "user.deleted",
    userId: user.uid,
    email: user.email || "",
    timestamp: FieldValue.serverTimestamp(),
  });
});

// ---------------------------------------------------------------------------
// 3. Blocking function – before user creation
//    Validates new registrations. Uncomment the domain check below to
//    restrict sign-ups to a specific domain.
// ---------------------------------------------------------------------------

exports.beforecreated = beforeUserCreated((event) => {
  const user = event.data;

  // Example: restrict registration to a specific email domain.
  // Uncomment and adjust the domain to enable this check.
  // if (user.email && !user.email.endsWith("@machagroup.com")) {
  //   throw new HttpsError("invalid-argument", "Unauthorized email domain.");
  // }

  // Set a default display name if one was not provided.
  return {
    displayName: user.displayName || "Macha User",
  };
});

// ---------------------------------------------------------------------------
// 4. Blocking function – before user sign-in
//    Attaches the sign-in IP address as a session claim so it can be
//    verified server-side to detect suspicious activity.
// ---------------------------------------------------------------------------

exports.beforesignedin = beforeUserSignedIn((event) => {
  return {
    sessionClaims: {
      signInIpAddress: event.ipAddress || "",
    },
  };
});
