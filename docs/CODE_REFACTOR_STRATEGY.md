<p align="center">
  <img src="https://img.shields.io/badge/Project-Macha_Group_Security_Platform-228b22?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Document_Type-Sprint_Deliverable-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Sprint-1__Prototype-orange?style=for-the-badge" />
</p>

<h1 align="center">🔨 Code Refactor Strategy</h1>
<h3 align="center">Macha Group — Security Assessment Platform</h3>
<p align="center"><i>Sprint Deliverable · Prototype Phase · February 2026</i></p>

---

## 1. Executive Summary

This document describes the code refactoring strategy for the Macha Group Security Assessment Platform. It covers:

- **What has already been refactored** during Sprint 1 and why.
- **What remains to be refactored** in future sprints.
- The architectural principles guiding every refactoring decision.
- Concrete code examples showing before/after states.

The goal of this document is to demonstrate that the Sprint 1 prototype was built with a clear, deliberate code quality strategy — not just as a throwaway demo — and that the path to a production-quality codebase is well-understood and planned.

---

## 2. Architectural Principles

All refactoring decisions are guided by five core principles:

| Principle | Description |
|:----------|:------------|
| **Single Responsibility** | Every module, component, and function does one thing. A page component renders; a service fetches data; a hook manages state. |
| **DRY (Don't Repeat Yourself)** | Any logic or markup duplicated more than twice is extracted into a shared utility, component, or constant. |
| **Layered Architecture** | The application is divided into clear layers (Pages → Components → Hooks → Services → Firebase) with dependencies flowing downward only. |
| **Replaceability** | Mock implementations and Firebase implementations share the same interface so either can be swapped without touching consuming code. |
| **Progressive Enhancement** | The prototype works without Firebase (using `localStorage`) and upgrades seamlessly to Firebase by changing a single environment variable. |

---

## 3. Layered Architecture

The current architecture follows a four-layer pattern:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      LAYER 1: PAGES / SCREENS                           │
│  HomeScreen, LoginMock, CreateAssessment, AssessmentDemo,               │
│  ReportView, PastAssessments, UserProfile, CreateAccount,               │
│  ForgotPassword, MfaSetup, AboutUs, ContactUs                           │
│                                                                         │
│  Responsibility: Compose components, handle navigation, read            │
│  auth/data state via hooks. No direct Firebase calls.                   │
├─────────────────────────────────────────────────────────────────────────┤
│                      LAYER 2: COMPONENTS                                │
│  atoms/       → Button, Badge, Input, Label (primitive UI)              │
│  molecules/   → FormField, SearchBar (composed from atoms)              │
│  organisms/   → QuestionCard, AssessmentForm (domain components)        │
│  layout/      → AppShell, Navbar, Sidebar (structural)                  │
│  dashboard/   → ScoreGauge (specialized chart components)               │
│                                                                         │
│  Responsibility: Pure, reusable UI logic. No data fetching.             │
│  No direct Firebase calls.                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                      LAYER 3: HOOKS                                     │
│  useAuth           → user state, login, logout                          │
│  useAssessment     → load assessment template by ID                     │
│  useAssessmentResponse → save/load user responses                       │
│                                                                         │
│  Responsibility: Encapsulate stateful logic for use in pages/           │
│  components. Bridge between UI and services.                            │
├─────────────────────────────────────────────────────────────────────────┤
│                      LAYER 4: SERVICES                                  │
│  services/firebaseConfig.ts  → Firebase app initialization (singleton)  │
│  services/auth/authService.ts → login, register, MFA, session           │
│  services/auth/mfaService.ts  → MFA enrollment and verification         │
│  services/data/mockDb.ts      → AssessmentRecord CRUD (local + Firebase) │
│  services/data/AssessmentLoader.ts → Load assessment template JSON      │
│                                                                         │
│  Responsibility: All I/O, Firebase SDK calls, localStorage.             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Refactoring Completed in Sprint 1

### 4.1 Firebase Config Deduplication

**Problem:** The Firebase configuration object (`apiKey`, `projectId`, etc.) was duplicated in multiple files. If a value changed, it had to be updated in multiple places, creating risk of configuration drift.

**Before:**
```typescript
// src/components/pages/LoginMock.tsx
import { initializeApp } from 'firebase/app';
const app = initializeApp({ apiKey: 'ABC123', projectId: 'macha-demo', ... });

// src/services/auth/authService.ts
import { initializeApp } from 'firebase/app';
const app = initializeApp({ apiKey: 'ABC123', projectId: 'macha-demo', ... });
```

**After:** A single file (`src/services/firebaseConfig.ts`) initializes the Firebase app once (singleton pattern) and exports typed accessor functions used everywhere:
```typescript
// src/services/firebaseConfig.ts
export function getFirebaseAuth(): Auth { ... }
export function getFirebaseDb(): Firestore { ... }
export function getFirebaseStorage(): FirebaseStorage { ... }

// Every other file:
import { getFirebaseAuth } from '../firebaseConfig';
const auth = getFirebaseAuth();
```

**Impact:** Configuration is defined in one place. Changing a key updates all consumers automatically.

---

### 4.2 Dead Code Removal (~585 Lines)

Several components from an earlier architectural prototype were replaced by the current design but left in the codebase. These were removed:

| Removed Component | Lines | Reason |
|:-----------------|------:|:-------|
| `HomeDashboardContent` | ~180 | Replaced by `HomeScreen` |
| `ActionTiles` | ~120 | Folded directly into `HomeScreen` |
| `KpiCard` | ~80 | Replaced by inline cards in `HomeScreen` |
| `RecentAssessmentsTable` | ~150 | Replaced by the Reports page |
| `PricingModels` page | ~55 | Removed from the product scope |
| **Total** | **~585** | |

Removing dead code reduces cognitive load for developers reading the codebase and eliminates the risk of accidentally importing and using outdated components.

---

### 4.3 Mock/Firebase Abstraction Layer

**Problem:** Early versions of the app contained Firebase SDK calls scattered throughout page components. This made it impossible to run the app without a live Firebase project and made testing very difficult.

**After:** All I/O is abstracted behind a service layer that checks `REACT_APP_DATA_PROVIDER`:

```typescript
// src/services/data/mockDb.ts
const USE_FIREBASE = (process.env.REACT_APP_DATA_PROVIDER || 'firebase') === 'firebase';

export function upsertAssessment(record: AssessmentRecord) {
  // Always write to localStorage (prototype persistence)
  const key = userAssessKey(record.userId);
  const all = load<AssessmentRecord[]>(key, []);
  // ... upsert logic ...
  save(key, all);
}

async function saveAssessmentToFirestore(record: AssessmentRecord) {
  if (!USE_FIREBASE) return;  // No-op in local mode
  // Firebase write here
}
```

**Effect:** Developers can set `REACT_APP_DATA_PROVIDER=local` to work entirely offline. The default (`firebase`) uses the real database. The consuming hooks and components are completely unaware of which mode is active.

---

### 4.4 Component Atomic Design Structure

**Problem:** All components were in a single flat `src/components/` directory. With 40+ files, it became difficult to find components and understand their purpose and scope.

**After:** Components are organized by Atomic Design level:

```
src/components/
├── atoms/        Smallest reusable pieces: Button, Badge, Input
├── molecules/    Compositions of atoms: FormField, SearchBar
├── organisms/    Domain components: QuestionCard, AssessmentForm, ScoreGauge
├── layout/       Structural: AppShell, Navbar
├── dashboard/    Dashboard-specific: ScoreGauge
└── pages/        Full screen views: HomeScreen, LoginMock, ReportView ...
```

This structure allows a new developer to immediately locate the correct component category and understand how components relate to each other.

---

### 4.5 Authentication Guard Extraction

**Problem:** Authentication state checks and redirect logic were duplicated inside multiple page components. Each protected page had its own version of:
```typescript
if (!user) { navigate('/login'); return null; }
```

**After:** A dedicated `AuthGuard` component wraps all protected routes:
```typescript
// src/services/auth/AuthGuard.tsx
export const AuthGuard: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// App.tsx
<Route path="/dashboard" element={<AuthGuard><HomeScreen /></AuthGuard>} />
```

**Impact:** Authentication logic lives in one place. Adding a new protected route is a one-line change.

---

### 4.6 CSS Reduction and Tailwind Adoption

**Problem:** The app accumulated multiple CSS files (`pages.css`, `AssessmentDemo.css`, `auth-pages.css`, `LoginMock.css`) with overlapping styles, many of which duplicated Tailwind utility patterns.

**Progress made in Sprint 1:**
- Removed all inline-style duplications that were replaced by Tailwind classes.
- Reduced `pages.css` to only styles that genuinely cannot be expressed in Tailwind (e.g., complex animations and `::before`/`::after` pseudo-elements).

**Remaining (Sprint 2):** Further consolidation of the remaining 4 CSS files into a single `custom.css` for non-Tailwind overrides.

---

### 4.7 Environment Variable Validation

**Problem:** Missing environment variables would cause silent failures where the app would attempt to connect to Firebase with empty strings, producing cryptic errors.

**After:** `firebaseConfig.ts` validates required variables at startup:
```typescript
function cleanEnv(value: string | undefined): string {
  return (value || '').trim().replace(/^["']|["']$/g, '');
}

export const firebaseConfig = {
  apiKey: cleanEnv(process.env.REACT_APP_FIREBASE_API_KEY),
  // ...
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    'Firebase configuration is missing. Copy .env.example to .env.local and fill in your project values.'
  );
}
```

**Impact:** Developers get a clear error message in the browser console instead of mysterious Firebase SDK errors.

---

## 5. Refactoring Remaining (Future Sprints)

### 5.1 Score Calculation — Move to Cloud Function

**Current state:** Score calculation is performed in the browser with a naive formula:
```typescript
const score = Math.max(60, Math.min(100, Math.round(60 + answered * 1.2)));
```

**Problem:** 
- The formula ignores answer quality (a "No" answer scores the same as a "Yes" answer).
- Running it in the browser allows a motivated user to manipulate the result by modifying the JavaScript.
- The `SelectOption.score` fields in the question templates are never used.

**Target (Sprint 3):**
```typescript
// Cloud Function (Node.js)
exports.calculateScore = functions.https.onCall(async (data, context) => {
  const { assessmentId, responses } = data;
  const template = await getAssessmentTemplate(assessmentId);
  let totalPoints = 0;
  let maxPoints = 0;
  const categoryScores: Record<string, number> = {};

  for (const category of template.categories) {
    let catPoints = 0;
    let catMax = 0;
    for (const question of category.questions) {
      const answer = responses[question.id];
      const selectedOption = question.options?.find(o => o.value === String(answer));
      const points = selectedOption?.score ?? (answer === true ? 5 : 0);
      const max = Math.max(...(question.options?.map(o => o.score ?? 0) ?? [5]));
      catPoints += points;
      catMax += max;
    }
    categoryScores[category.id] = catMax > 0 ? Math.round((catPoints / catMax) * 100) : 0;
    totalPoints += catPoints;
    maxPoints += catMax;
  }

  return {
    total: maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0,
    categoryScores,
  };
});
```

---

### 5.2 Complete Firestore Read Path for User Responses

**Current state:** `listAssessmentsByUser()` reads from `localStorage`. Even in Firebase mode, the read path is localStorage; Firestore is only written to asynchronously.

> **Note:** Assessment *templates* (the question bank) are already read directly from Firestore via `AssessmentLoader.ts` → `loadAssessmentFirebase()`, which queries the `assessmentNodes` collection. This was implemented in Sprint 1.

**Remaining problem:** If a user signs in on a new device, they see no *responses* — their saved assessment answers live in the browser that originally created them, not yet read back from Firestore.

**Target (Sprint 2):**
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

This change also makes all hooks that call `listAssessmentsByUser()` need to become async, which requires converting from `useMemo` to `useEffect + useState` with a loading state.

---

### 5.3 Photo Storage — Replace Base64 with Storage URLs

**Current state:** Photos are stored as base64-encoded data URLs inside the `AssessmentRecord.photos` map. This:
- Bloats Firestore documents (each photo can be hundreds of KB of base64 text).
- Puts binary data where Firestore was designed for structured text.
- Hits Firestore's 1 MB document size limit for assessments with many photos.

**Target (Sprint 2):** Store photos in Firebase Storage and store only the download URL in the Firestore document:
```typescript
async function uploadPhoto(userId: string, assessmentId: string, questionId: string, file: File): Promise<string> {
  const path = `photos/${userId}/${assessmentId}/${questionId}/${Date.now()}_${file.name}`;
  const storageRef = ref(getFirebaseStorage(), path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}
```

The `photos` field in `AssessmentRecord` would change from:
```typescript
photos?: Record<string, { name: string; dataUrl: string }[]>
```
to:
```typescript
photos?: Record<string, { name: string; storageUrl: string }[]>
```

---

### 5.4 CSS Consolidation

**Current state:** Four CSS files with overlapping content:
- `pages.css`
- `AssessmentDemo.css`
- `auth-pages.css`
- `LoginMock.css`

**Target (Sprint 2):**
1. Audit every CSS rule and mark as either:
   - **Redundant with Tailwind** → delete.
   - **Genuinely needed** → move to `src/custom.css`.
2. Delete the four files and import only `custom.css`.

Estimated savings: ~50 lines of CSS.

---

### 5.5 Shared Quick Actions Configuration

**Current state:** The quick-action button definitions (New Inspection, View Reports, My Profile, Need Help?) are hard-coded inside `HomeScreen.tsx`. If a new action is added or an existing one renamed, `HomeScreen.tsx` must be edited.

**Target (Sprint 2):**
```typescript
// src/config/quickActions.ts
import { ShieldIcon, ClipboardIcon, UserIcon, PhoneIcon } from '../components/icons';

export const quickActions = [
  { label: 'New Inspection', href: '/create-assessment', Icon: ShieldIcon },
  { label: 'View Reports',   href: '/reports',           Icon: ClipboardIcon },
  { label: 'My Profile',     href: '/profile',           Icon: UserIcon },
  { label: 'Need Help?',     href: '/contact',           Icon: PhoneIcon },
];
```

```tsx
// HomeScreen.tsx
import { quickActions } from '../../config/quickActions';
// ...
{quickActions.map((action, i) => (
  <QuickActionButton key={i} {...action} />
))}
```

---

### 5.6 Inline SVG Icon Extraction

**Current state:** SVG icon path strings are written inline inside `HomeScreen.tsx` and other pages, making them hard to maintain and reuse.

**Target (Sprint 2):**
```tsx
// src/components/icons/ShieldIcon.tsx
export const ShieldIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
```

Estimated savings: ~60 lines of repeated SVG markup.

---

### 5.7 Replace `localStorage` Backend with Firestore Reads

**Current state:** `listAssessmentsByUser()` reads from `localStorage`. Even in Firebase mode, the read path is localStorage; Firestore is only written to asynchronously.

**Problem:** If a user signs in on a new device, they see no assessments — their data lives in the browser that originally created it.

**Target (Sprint 2):**
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

This change also makes all hooks that call `listAssessmentsByUser()` need to become async, which requires converting from `useMemo` to `useEffect + useState` with a loading state.

---

## 6. Refactoring Metrics

### 6.1 Sprint 1 Completed

| Category | Before | After | Change |
|:---------|-------:|------:|-------:|
| Dead code removed | 0 | ~585 lines | −585 |
| Duplicated Firebase config | 2 locations | 1 location | −1 |
| Protected route auth checks | In each page | 1 `AuthGuard` | −11 duplicates |
| CSS files | N/A | 4 (reduced) | Ongoing |
| Mock/real code separation | Mixed | Service layer | Clean |

### 6.2 Sprint 2 Target

| Category | Action | Estimated Impact |
|:---------|:-------|:----------------|
| Inline SVG icons | Extract to `components/icons/` | −60 lines |
| Quick actions config | Extract to `config/quickActions.ts` | −30 lines |
| CSS consolidation | 4 files → 1 | −50 lines |
| Base64 photos | Replace with Storage URLs | Removes MB-scale localStorage bloat |
| Score calculation | Move to Cloud Function | Removes ~20 lines of client logic |
| Firestore read path | `listAssessmentsByUser` reads from Firestore | Cross-device data access |
| **Total estimate** | | **~160 lines removed** |

---

## 7. Code Quality Standards

All refactored code must meet the following standards before merging:

| Standard | Rule |
|:---------|:-----|
| TypeScript strict mode | No `any` types except where Firebase SDK types are unavoidable |
| No implicit `any` returns | All functions must declare return types |
| No console.log in production | Only `console.error` for actual failures; remove debug logs before merging |
| Component file size | Pages < 300 lines; components < 150 lines; hooks < 100 lines |
| Service function purity | Service functions do not import React hooks |
| Tailwind-first styling | CSS files only for styles not expressible in Tailwind |
| Prop types | Every component interface declares all props; no optional props without a documented default |

---

## 8. Testing Strategy *(Roadmap)*

The prototype does not yet have automated tests. The following testing plan will be executed in Sprint 3 using **React Testing Library** and **Jest**:

| Test Type | Coverage Target | Tools |
|:----------|:--------------:|:------|
| Unit tests (services) | Auth service, mockDb functions | Jest |
| Unit tests (hooks) | `useAuth`, `useAssessment` | Jest + React Testing Library |
| Component tests | `QuestionCard`, `AuthGuard`, `ScoreGauge` | React Testing Library |
| Integration tests | Full assessment flow (create → answer → complete → report) | React Testing Library |
| Security rule tests | Firestore rules emulator | Firebase Emulator Suite |

---

<p align="center"><i>Document prepared February 2026 · Macha Group Sprint 1 Deliverable</i></p>
