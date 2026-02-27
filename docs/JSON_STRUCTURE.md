<p align="center">
  <img src="https://img.shields.io/badge/Project-Macha_Group_Security_Platform-228b22?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Document_Type-Sprint_Deliverable-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Sprint-1__Prototype-orange?style=for-the-badge" />
</p>

<h1 align="center">🗂️ JSON & Data Structure</h1>
<h3 align="center">Macha Group — Security Assessment Platform</h3>
<p align="center"><i>Sprint Deliverable · Prototype Phase · February 2026</i></p>

---

## 1. Purpose of This Document

This document describes every data structure used by the Macha Group Security Assessment Platform — both on the client side (TypeScript interfaces) and in the cloud database (Firestore collections). It covers:

- The **assessment template** format (question bank)
- The **user assessment response** format (answers saved per user)
- The **user profile** format
- The **Firestore collection schemas**
- Field-by-field annotations explaining every property

Understanding these structures is essential for evaluating the data model, planning Firebase integration, and ensuring consistent API contracts between the frontend and backend.

---

## 2. High-Level Data Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          DATA FLOW OVERVIEW                                │
│                                                                            │
│  Public / Static Data                   User-Specific Data                │
│  ─────────────────────                  ──────────────────                 │
│                                                                            │
│  AssessmentTemplate (JSON file)  ──►  User fills out form                 │
│  · 7 categories                        │                                   │
│  · 87 subsections                       ▼                                  │
│  · 1,381 questions                  AssessmentRecord                       │
│                                     (saved to Firestore userAssessments/  │
│                                      and localStorage in prototype)        │
│                                                                            │
│  Firebase Auth ──────────────────►  users/{uid} (Firestore)               │
│  · UID                              · Profile fields                       │
│  · Email                            · Role array                           │
│  · DisplayName                                                             │
│                                                                            │
│  Firebase Storage ◄──────────────── Photo uploads                         │
│  photos/{uid}/{assessmentId}/       (base64 → Storage in production)      │
│  {questionId}/{index}_{filename}                                           │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. TypeScript Type Definitions

All types are defined in `src/types/assessment.ts` and `src/services/data/mockDb.ts`.

### 3.1 Question Types

```typescript
type QuestionType =
  | 'boolean'      // Yes / No
  | 'scale'        // Numeric slider (e.g., 1–5 or 1–10)
  | 'text'         // Free-form text input
  | 'select'       // Single-choice dropdown
  | 'multiselect'  // Multiple-choice checkboxes
  | 'comment'      // Long-form text (textarea)
  | 'file';        // File / photo upload
```

### 3.2 `ValidationRule`

Applied to `text` and `comment` question types to enforce input constraints.

```typescript
interface ValidationRule {
  minLength?: number;   // Minimum character count
  maxLength?: number;   // Maximum character count
  pattern?: string;     // Regex pattern the value must match
  customMessage?: string; // Human-readable error shown when validation fails
}
```

### 3.3 `ConditionalLogic`

Makes a question visible only when a prior question meets a condition.

```typescript
interface ConditionalLogic {
  dependsOn: string;                       // ID of the controlling question
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains';  // Comparison operator
  value: any;                              // Value to compare against
}
```

**Example:** Show a follow-up "Describe the issue" text field only when the prior boolean question is answered `false` (indicating a deficiency).

### 3.4 `SelectOption`

Used by `select` and `multiselect` question types.

```typescript
interface SelectOption {
  value: string;    // Machine-readable key stored in response
  label: string;    // Human-readable text shown in the UI
  score?: number;   // Optional contribution to the section score
}
```

### 3.5 `Question`

The core unit of an assessment — a single evaluable question.

```typescript
interface Question {
  id: string;                        // Unique identifier (e.g., "phys-1-cam-001")
  type: QuestionType;                // Input widget type (see 3.1)
  text: string;                      // Question text shown to the assessor
  helpText?: string;                 // Optional tooltip / guidance text
  required: boolean;                 // Whether the question must be answered
  conditional?: ConditionalLogic;    // Show/hide logic (see 3.3)
  validation?: ValidationRule;       // Input constraints (see 3.2)
  options?: SelectOption[];          // Choices for select / multiselect (see 3.4)
  hasCommentField: boolean;          // Whether an additional comment box is shown
  commentPrompt: string;             // Label for the comment box (empty string if none)
}
```

### 3.6 `Category`

A grouping of related questions (e.g., "Physical Security", "Cybersecurity").

```typescript
interface Category {
  id: string;           // Unique identifier (e.g., "physical-security")
  title: string;        // Display title
  description?: string; // Summary of what this category evaluates
  icon?: string;        // Icon name or SVG key (used in UI)
  questions: Question[]; // Ordered list of questions in this category
}
```

### 3.7 `AssessmentMetadata`

Descriptive information about an assessment template.

```typescript
interface AssessmentMetadata {
  title: string;               // Template name (e.g., "K-12 School Security Assessment")
  description: string;         // What the assessment evaluates
  lastUpdated: string;         // ISO 8601 date of last template revision
  author?: string;             // Creator of the template
  estimatedDuration?: number;  // Estimated completion time in minutes
  tags?: string[];             // Free-form tags for filtering/search
}
```

### 3.8 `Assessment` (Template)

The full assessment template as loaded from a JSON file or Firestore.

```typescript
interface Assessment {
  id: string;                  // Template identifier (e.g., "school-security-v1")
  version: string;             // Semantic version string (e.g., "1.0.0")
  metadata: AssessmentMetadata; // See 3.7
  categories: Category[];      // Ordered list of categories (see 3.6)
}
```

### 3.9 `AssessmentRecord` (User Response)

A user's instance of filling out an assessment — their answers, metadata, and score.

```typescript
interface AssessmentRecord {
  id: string;                    // Unique record ID (e.g., "AS-1708540800000")
  name: string;                  // User-supplied name for this inspection
  buildingId: string;            // Identifier of the building being assessed
  assessmentId: string;          // References the Assessment template ID (see 3.8)
  status: 'draft' | 'in-progress' | 'completed'; // Lifecycle stage
  score?: number;                // Calculated score (0–100) — present after completion
  createdAt: string;             // ISO 8601 timestamp of record creation
  updatedAt: string;             // ISO 8601 timestamp of last save
  responses: Record<string, ResponseValue>; // Map of questionId → answer value
  address?: string;              // Street address of the building
  buildingType?: string;         // Building category (e.g., "School", "Hospital")
  userId?: string;               // Firebase UID of the assessor
  photos?: Record<string, PhotoAttachment[]>; // Map of questionId → photo list
}
```

### 3.10 `ResponseValue`

The union type of all possible answer values.

```typescript
type ResponseValue = boolean | string | number | string[];
// boolean    → for QuestionType 'boolean' (yes/no)
// string     → for 'text', 'comment', 'select'
// number     → for 'scale'
// string[]   → for 'multiselect'
```

### 3.11 `PhotoAttachment`

A photo attached to a specific question answer.

```typescript
interface PhotoAttachment {
  name: string;      // Original filename (e.g., "entrance-door.jpg")
  dataUrl: string;   // Base64-encoded data URL (prototype) or Storage URL (production)
}
```

### 3.12 `User`

The application user model, derived from the Firebase Auth user object.

```typescript
interface User {
  id: string;                                     // Firebase UID
  email: string;                                  // Verified email address
  displayName: string;                            // Full name
  roles: ('admin' | 'user' | 'manager')[];        // Role array (see Security Architecture)
  assignedBuildings: string[];                    // Building IDs this user can assess
}
```

---

## 4. Full Example: Assessment Template JSON

Below is an abbreviated but complete example of a single-category assessment template demonstrating every field:

```json
{
  "id": "school-security-v1",
  "version": "1.0.0",
  "metadata": {
    "title": "K-12 School Security Assessment",
    "description": "Comprehensive evaluation of physical security, emergency preparedness, and cybersecurity controls for K-12 educational facilities.",
    "lastUpdated": "2026-02-01",
    "author": "Macha Group",
    "estimatedDuration": 180,
    "tags": ["school", "k-12", "physical-security", "emergency-preparedness"]
  },
  "categories": [
    {
      "id": "physical-security",
      "title": "Physical Security",
      "description": "Evaluation of perimeter, entry points, surveillance, and access control systems.",
      "icon": "shield",
      "questions": [
        {
          "id": "phys-entry-001",
          "type": "boolean",
          "text": "Is there a single, controlled point of entry for visitors during school hours?",
          "helpText": "Visitors should be directed to a designated entry point monitored by staff or a security system.",
          "required": true,
          "hasCommentField": true,
          "commentPrompt": "Describe the entry point procedure"
        },
        {
          "id": "phys-entry-002",
          "type": "select",
          "text": "What type of access control is used at the main entrance?",
          "required": true,
          "options": [
            { "value": "none",        "label": "No access control",          "score": 0  },
            { "value": "buzzer",      "label": "Door buzzer / intercom",     "score": 2  },
            { "value": "badge",       "label": "Badge / key card reader",    "score": 4  },
            { "value": "biometric",   "label": "Biometric (fingerprint/face)","score": 5 }
          ],
          "hasCommentField": false,
          "commentPrompt": ""
        },
        {
          "id": "phys-entry-003",
          "type": "text",
          "text": "Describe the visitor sign-in process.",
          "required": false,
          "conditional": {
            "dependsOn": "phys-entry-001",
            "operator": "eq",
            "value": true
          },
          "validation": {
            "minLength": 20,
            "maxLength": 500,
            "customMessage": "Please provide at least a brief description (20 characters minimum)."
          },
          "hasCommentField": false,
          "commentPrompt": ""
        },
        {
          "id": "phys-cam-001",
          "type": "scale",
          "text": "Rate the coverage of exterior security cameras (1 = minimal, 5 = comprehensive).",
          "required": true,
          "options": [
            { "value": "1", "label": "1 — Less than 25% of perimeter covered",  "score": 1 },
            { "value": "2", "label": "2 — 25–50% covered",                       "score": 2 },
            { "value": "3", "label": "3 — 50–75% covered",                       "score": 3 },
            { "value": "4", "label": "4 — 75–90% covered",                       "score": 4 },
            { "value": "5", "label": "5 — 90–100% covered",                      "score": 5 }
          ],
          "hasCommentField": true,
          "commentPrompt": "Note any specific blind spots or coverage gaps"
        },
        {
          "id": "phys-cam-photo-001",
          "type": "file",
          "text": "Upload photos of the main entrance camera placement.",
          "required": false,
          "hasCommentField": false,
          "commentPrompt": ""
        }
      ]
    }
  ]
}
```

---

## 5. Full Example: User Assessment Response JSON

This is how a completed or in-progress `AssessmentRecord` looks when persisted.

```json
{
  "id": "AS-1708540800000",
  "name": "Lincoln Elementary — Spring 2026 Inspection",
  "buildingId": "building-001",
  "assessmentId": "school-security-v1",
  "status": "in-progress",
  "createdAt": "2026-02-21T10:00:00.000Z",
  "updatedAt": "2026-02-21T11:30:00.000Z",
  "userId": "Xu7mK9pQ2LVdNwRjTf3e",
  "address": "1234 Elm Street, Springfield, IL 62701",
  "buildingType": "School",
  "responses": {
    "phys-entry-001": true,
    "phys-entry-001Comment": "Visitors enter through the main office only. A buzzer is used after 8:30 AM.",
    "phys-entry-002": "buzzer",
    "phys-entry-003": "Visitors must sign in on paper log and receive a visitor badge from the front desk.",
    "phys-cam-001": "3",
    "phys-cam-001Comment": "South parking lot has no camera coverage.",
    "phys-cam-photo-001": ""
  },
  "photos": {
    "phys-cam-photo-001": [
      {
        "name": "main-entrance-cam.jpg",
        "dataUrl": "data:image/jpeg;base64,/9j/4AAQ..."
      }
    ]
  }
}
```

**Key observations:**
- Comment fields use the convention `{questionId}Comment` as the key.
- Boolean answers are stored as actual `true`/`false` JSON booleans, not strings.
- Photo `dataUrl` values store base64-encoded images in the prototype; in production these will be replaced by Firebase Storage download URLs.
- The `score` field is absent while the status is `in-progress` and is calculated upon `completeAssessment()`.

---

## 6. Firestore Collection Schemas

The following tables document every Firestore collection used by the application.

### 6.1 `users/{uid}` — User Profile

| Field | Type | Required | Description |
|:------|:----:|:--------:|:------------|
| `uid` | string | ✅ | Firebase UID — mirrors the document ID |
| `email` | string | ✅ | User's email address |
| `displayName` | string | ✅ | Full name |
| `phone` | string | | Phone number (used for MFA enrollment) |
| `organization` | string | | Organization / school the user belongs to |
| `address` | string | | User's address |
| `roles` | string[] | ✅ | Array of role strings (e.g., `["user"]`) |
| `assignedBuildings` | string[] | | Building IDs the user is authorized to assess |
| `createdAt` | Timestamp | ✅ | Server timestamp set on document creation |
| `updatedAt` | Timestamp | ✅ | Server timestamp updated on every write |

**Example document** (`users/Xu7mK9pQ2LVdNwRjTf3e`):
```json
{
  "uid": "Xu7mK9pQ2LVdNwRjTf3e",
  "email": "inspector@lincoln-elementary.edu",
  "displayName": "Maria Chen",
  "phone": "+1-555-012-3456",
  "organization": "Lincoln Elementary School",
  "address": "1234 Elm Street, Springfield, IL 62701",
  "roles": ["user"],
  "assignedBuildings": ["building-001"],
  "createdAt": { "_seconds": 1740139200, "_nanoseconds": 0 },
  "updatedAt": { "_seconds": 1740139200, "_nanoseconds": 0 }
}
```

---

### 6.2 `userAssessments/{docId}` — Assessment Response

| Field | Type | Required | Description |
|:------|:----:|:--------:|:------------|
| `id` | string | ✅ | Matches the document ID; format `AS-{timestamp}` |
| `name` | string | ✅ | Inspection label (user-supplied) |
| `userId` | string | ✅ | Firebase UID of the assessor — enforced by security rule |
| `assessmentId` | string | ✅ | References the assessment template ID |
| `buildingId` | string | ✅ | Building being assessed |
| `address` | string | | Street address of the building |
| `buildingType` | string | | Category (e.g., `School`, `Hospital`) |
| `status` | string | ✅ | One of `draft`, `in-progress`, `completed` |
| `score` | number | | Final score 0–100; set when status becomes `completed` |
| `responses` | map | ✅ | Map of `questionId` → response value |
| `createdAt` | string | ✅ | ISO 8601 timestamp of creation |
| `updatedAt` | Timestamp | ✅ | Server timestamp updated on every save |

**Security rule requirement:** The `create` rule verifies that `name`, `userId`, and `status` are all present. Any write that omits these fields will be rejected at the database level.

---

### 6.3 `assessments/{assessmentId}` — Assessment Template Registry

This collection stores **metadata/registry records** for each assessment template. It is queried by `loadAssessmentRegistryFirebase()` to populate the template picker. The actual question content lives in `assessmentNodes` (see 6.4).

| Field | Type | Required | Description |
|:------|:----:|:--------:|:------------|
| `id` | string | ✅ | Template identifier — matches document ID |
| `title` | string | ✅ | Human-readable template name |
| `description` | string | | What the assessment evaluates |
| `version` | string | ✅ | Semantic version string |
| `lastUpdated` | string | | ISO 8601 date of last template revision |
| `estimatedDuration` | number | | Estimated completion time in minutes |

---

### 6.4 `assessmentNodes/{nodeId}` — Question Node Tree *(Primary Question Store)*

This is the **primary, active data source** for the 1,381-question assessment content. `AssessmentLoader.ts` queries this collection by default (when `REACT_APP_DATA_PROVIDER=firebase`, which is the default). The loader queries all documents where `assessmentId == <id>` and `active == true`, then assembles them into the `Category[]` → `Question[]` structure the UI expects.

Each node represents one of three types in a parent-child hierarchy:

```
assessmentId="school-security-v1"
├── type: "category"    (e.g., "Physical Security")
│   └── type: "subcategory"  (e.g., "Bullet Cameras")
│       └── type: "question"  (individual evaluable question)
```

| Field | Type | Present On | Description |
|:------|:----:|:----------:|:------------|
| `assessmentId` | string | All | Parent template ID |
| `type` | string | All | `"category"`, `"subcategory"`, or `"question"` |
| `parentId` | string\|null | All | Key of parent node; `null` for top-level categories |
| `key` | string | All | Unique identifier for this node (used as `parentId` by children) |
| `title` | string | category, subcategory | Display title |
| `text` | string | question | Question text shown to the assessor |
| `order` | number | All | Sort order within sibling nodes |
| `active` | boolean | All | Only nodes with `active == true` are loaded |
| `questionType` | string | question | Maps to `QuestionType` (e.g., `"boolean"`, `"scale"`) |
| `required` | boolean | question | Whether the question must be answered |
| `hasCommentField` | boolean | question | Whether an additional comment box is shown |

**Assembly logic in `AssessmentLoader.ts`:**
1. Query all nodes where `assessmentId == id` and `active == true`.
2. Partition nodes into `categories`, `subcategories`, and `questions` arrays, each sorted by `order`.
3. For each category, find its subcategories, then find each subcategory's questions.
4. Flatten subcategory questions into a single `category.questions[]` array (the UI `Category` type has no nested subcategory level).
5. The subcategory `title` is preserved as `question.helpText` (e.g., `"Section: Bullet Cameras"`).

**Two-tier caching:** Assembled results are cached in memory (60-minute TTL) and persisted to `localStorage` under `macha.assessmentCache.*` keys to reduce repeat Firestore reads.

**Example `assessmentNodes` documents:**

```json
// Category node
{
  "assessmentId": "school-security-v1",
  "type": "category",
  "parentId": null,
  "key": "physical-security",
  "title": "Physical Security",
  "order": 1,
  "active": true
}

// Subcategory node
{
  "assessmentId": "school-security-v1",
  "type": "subcategory",
  "parentId": "physical-security",
  "key": "bullet-cameras",
  "title": "Bullet Cameras",
  "order": 3,
  "active": true
}

// Question node
{
  "assessmentId": "school-security-v1",
  "type": "question",
  "parentId": "bullet-cameras",
  "key": "phys-cam-bullet-001",
  "text": "Are bullet cameras installed at all exterior entry points?",
  "order": 1,
  "active": true,
  "questionType": "boolean",
  "required": true,
  "hasCommentField": true
}
```

---

### 6.5 `auditLogs/{logId}` — Audit Trail *(Roadmap)*

This collection is defined in the Firestore security rules but not yet populated by the prototype. It will be written by Cloud Functions in a future sprint.

| Field | Type | Description |
|:------|:----:|:------------|
| `logId` | string | Auto-generated Firestore document ID |
| `action` | string | Event type (e.g., `assessment.complete`, `profile.update`) |
| `userId` | string | UID of the user who triggered the event |
| `resourceId` | string | ID of the affected resource |
| `timestamp` | Timestamp | Server timestamp |
| `metadata` | map | Additional context (IP address, user agent — future) |

---

## 7. Score Calculation Algorithm

When a user completes an assessment, a score is calculated using the following formula in the current prototype:

```typescript
const answered = Object.values(responses).filter(
  v => v !== '' && v !== null && v !== undefined
).length;
const score = Math.max(60, Math.min(100, Math.round(60 + answered * 1.2)));
```

**Prototype behavior:** This is a simplified placeholder formula. It produces a score between 60 and 100 based purely on answer count — not answer quality.

**Production target:** The scoring engine will be moved to a Cloud Function that:
1. Loads the template from Firestore.
2. Evaluates each answer against the question's `SelectOption.score` values.
3. Calculates a weighted score per category.
4. Returns a breakdown: `{ total: number, categoryScores: { [categoryId]: number } }`.

---

## 8. Local Storage Keys (Prototype Only)

During the prototype phase, when `REACT_APP_DATA_PROVIDER=local`, data is persisted in `localStorage` using namespaced keys:

| Key | Format | Contents |
|:----|:-------|:---------|
| `macha.assessments.{uid}` | JSON array | Array of `AssessmentRecord` for this user |
| `macha.activeAssessmentId` | string | ID of the currently open assessment |
| `macha.profile` | JSON object | `UserProfileRecord` |
| `macha.currentUserId` | string | Current user's UID |
| `mockAuthSession` | JSON object | `AuthSession` (mock mode only) |
| `macha.mfaEnrolled` | string `"true"` | Whether mock MFA is enrolled |

**These keys are only used when `REACT_APP_DATA_PROVIDER` is set to `local`.** In the default Firebase mode, all data is read from and written to Firestore.

---

## 9. Data Model Evolution Plan

| Sprint | Change | Impact |
|:-------|:-------|:-------|
| Sprint 1 (current) | `assessmentNodes` queried from Firestore by `AssessmentLoader.ts` | ✅ Done — 1,381 questions served from cloud |
| Sprint 1 (current) | Flat `responses` map; base64 photo storage | Prototype only — not scalable for large responses |
| Sprint 2 | Complete Firestore read path for `listAssessmentsByUser` | Assessments visible on any device |
| Sprint 2 | Replace base64 photos with Storage URLs | Reduce Firestore document size |
| Sprint 3 | Add `categoryScores` to `userAssessments` | Enable per-category report breakdowns |
| Sprint 3 | Add `auditLogs` Cloud Function | Tamper-resistant audit trail |
| Sprint 4 | Add `buildings/{buildingId}` collection | Multi-building management with history |
| Sprint 4 | Add `organizations/{orgId}` collection | Multi-tenant organization support |

---

<p align="center"><i>Document prepared February 2026 · Macha Group Sprint 1 Deliverable</i></p>
