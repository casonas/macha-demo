<p align="center">
  <img src="https://img.shields.io/badge/Project-Macha_Group_Security_Platform-228b22?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Document_Type-Sprint_Deliverable-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Sprint-1__Prototype-orange?style=for-the-badge" />
</p>

<h1 align="center">🎨 UI Improvements</h1>
<h3 align="center">Macha Group — Security Assessment Platform</h3>
<p align="center"><i>Sprint Deliverable · Prototype Phase · February 2026</i></p>

---

## 1. Executive Summary

This document details the user interface (UI) improvements made during Sprint 1 and the planned improvements for future sprints. The Sprint 1 prototype transformed the application from a functional-but-unstyled skeleton into a polished, professional-grade security assessment tool.

The improvements cover:
- The **design system** (colors, typography, spacing, components)
- **Every page** in the application — before/after comparison
- **Responsive design** for desktop and mobile
- **Accessibility** foundations
- The **planned roadmap** for Sprint 2 and beyond

---

## 2. Design System

### 2.1 Color Palette

The platform uses a constrained, professional color palette rooted in forest green — chosen to convey security, trust, and authority without the connotations of danger associated with red-heavy security UIs.

| Role | Hex | Tailwind Class | Usage |
|:-----|:----|:--------------|:------|
| Brand primary | `#228b22` | `emerald-700` | Logo, primary buttons, active nav |
| Brand dark | `#142b14` | `emerald-950` | Hero banner gradient start |
| Brand deep | `#050805` | `neutral-950` | Hero banner gradient end |
| Action green | `#059669` | `emerald-600` | CTA buttons, progress bars, links |
| Action hover | `#047857` | `emerald-700` | Button hover states |
| Background | `#f8fafc` | `slate-50` | Page background |
| Surface | `#ffffff` | `white` | Cards, panels |
| Border | `#e2e8f0` | `slate-200` | Card borders, dividers |
| Text primary | `#0f172a` | `slate-900` | Headings, important values |
| Text secondary | `#64748b` | `slate-500` | Labels, metadata, captions |
| Text muted | `#94a3b8` | `slate-400` | Placeholder text, disabled states |
| Success | `#10b981` | `emerald-500` | Score gauge, completed status |
| Warning | `#f59e0b` | `amber-500` | In-progress status |
| Error | `#ef4444` | `red-500` | Form validation errors |

### 2.2 Typography

| Role | Family | Weight | Size | Class |
|:-----|:-------|:------:|:----:|:------|
| Page title | System sans-serif | 700 | 2xl–3xl | `text-3xl font-bold` |
| Section heading | System sans-serif | 700 | xl | `text-xl font-bold` |
| Card heading | System sans-serif | 700 | lg | `text-lg font-bold` |
| Body | System sans-serif | 400 | base | `text-base` |
| Label / caption | System sans-serif | 700 | sm | `text-sm font-bold uppercase tracking-widest` |
| KPI value | System sans-serif | 700 | 5xl | `text-5xl font-bold` |
| Badge | System sans-serif | 700 | xs | `text-xs font-bold uppercase tracking-wider` |

The system font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ...`) was chosen deliberately to avoid an external font network request, improving page load time and privacy.

### 2.3 Spacing Scale

All spacing follows Tailwind's 4px-base grid. Key layout decisions:

| Measurement | Value | Usage |
|:------------|:-----:|:------|
| Card padding | 3rem (48px) | All main content cards |
| Card border radius | 1.5rem (24px) | All cards and panels |
| Hero border radius | 2rem (32px) | Hero banner |
| Section gap | 1.5rem (24px) | Space between cards in a grid |
| Component gap | 1rem (16px) | Space between form fields, list items |
| Max content width | 80rem (1280px) | `max-w-7xl mx-auto` — prevents ultra-wide line lengths |

### 2.4 Icon System

All icons are **inline SVGs** using the [Feather Icons](https://feathericons.com) design language: 24×24 px, 2px stroke, `round` linecap and linejoin. No icon font library or external CDN is required — icons are rendered as React JSX `<svg>` elements with `currentColor` strokes, making them color-flexible and screen-reader-compatible via `aria-hidden`.

Icons used per page:

| Page | Icons |
|:-----|:------|
| Dashboard — KPIs | Grid (total), Check circle (completed), Clock (in-progress), Shield (avg score) |
| Dashboard — Quick actions | Shield (new inspection), Clipboard (reports), User (profile), Phone (help) |
| Navigation | Shield, Clipboard, User, Info, Mail |
| Reports | Document, Download |
| Assessment form | Camera (photo upload), Search, Arrow |

---

## 3. Page-by-Page Improvements

### 3.1 Dashboard (`/`)

**Before Sprint 1:**
- Blank white page; Tailwind CSS v4 was not applying styles
- No stats, no assessments list, no navigation structure

**After Sprint 1:**

```
┌──────────────────────────────────────────────────────────┐
│           HERO BANNER (dark gradient, rounded)           │
│  "Welcome back, [Name]"                                  │
│  + New Assessment  |  View Reports                       │
└──────────────────────────────────────────────────────────┘
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│   Total   │ │ Completed │ │In Progress│ │ Avg Score │
│     3     │ │     1     │ │     2     │ │    84%    │
└───────────┘ └───────────┘ └───────────┘ └───────────┘
┌──────────────────────────────┐ ┌──────────────────────┐
│  Latest Assessment           │ │  Quick Actions       │
│  [Score gauge]  [Name]       │ │  New Inspection      │
│  [Status badge]              │ │  View Reports        │
│  [Progress bar: 42/1381]     │ │  My Profile          │
│  [Continue / View Report]    │ │  Need Help?          │
└──────────────────────────────┘ └──────────────────────┘
```

**Key design decisions:**
- The hero banner uses a radial gradient from deep forest green to near-black, giving a dramatic, professional first impression while keeping the brand color prominent.
- The four KPI cards use a 2-column grid on mobile and a 4-column grid on desktop, with color-coded icon badges (emerald/blue/amber) to visually differentiate metrics at a glance.
- The "Latest Assessment" card uses the `ScoreGauge` SVG component — an animated circular progress indicator — for an immediate visual summary of the most recent score.
- The progress bar under the assessment shows `answered / total questions` to motivate users to complete in-progress assessments.

**Responsive behavior:**
- On screens < 640px: hero CTA buttons stack vertically; KPI cards are single-column; the bottom section stacks (assessment card above quick actions).
- On screens ≥ 640px: hero buttons are side-by-side; KPI cards 2-column.
- On screens ≥ 1280px: KPI cards are 4-column; assessment + quick actions are side-by-side (2/3 + 1/3 split).

---

### 3.2 Navigation (`AppShell`)

**Before Sprint 1:**
- 7 menu items including duplicate links
- No mobile menu

**After Sprint 1:**
- 6 clean items: Dashboard, New Assessment, Reports, My Profile, About Us, Contact Us
- Collapsible sidebar on mobile (hamburger menu)
- Active route is highlighted with an emerald left-border accent
- User's display name and avatar initial shown at the bottom of the sidebar
- Logo (`MACHA GROUP`) with branded green shield icon at the top

**Implementation:** The `AppShell` component wraps every authenticated page. It accepts `title` and `isDashboard` props. Pages use it as:
```tsx
<AppShell title="Reports">
  {/* page content */}
</AppShell>
```

---

### 3.3 Login Page (`/login`)

**Before Sprint 1:**
- Plain form with no styling
- No loading state

**After Sprint 1:**
- Split layout: branded hero panel (left) + login form (right)
- Emerald gradient hero with shield icon
- Email + password fields with clear error states
- "Sign in with Google" button (Google icon)
- "Forgot password?" and "Create account" links
- Loading spinner while Firebase Auth processes the request
- Rate-limit error message after 5 failed attempts

**MFA Challenge UI (inline, same page):**
- When Firebase throws `auth/multi-factor-auth-required`, the login form slides into a 6-digit SMS code entry field
- "Resend code" link with 60-second cooldown
- Countdown timer visible to the user

---

### 3.4 Create Account (`/register`)

**Before Sprint 1:**
- Single email + password form

**After Sprint 1:**
Organized into three clearly labeled sections:

| Section | Fields |
|:--------|:-------|
| **Personal Information** | Full name, email, phone number, organization name |
| **Address** | Street address, city, state (dropdown — all 50 US states), ZIP code |
| **Security** | Password (with strength indicator), confirm password |

Password validation feedback (shown in real-time as the user types):
- ✅ At least 8 characters
- ✅ At least one uppercase letter
- ✅ At least one number
- ✅ Passwords match

The form validates all fields before submitting. Inline error messages appear under each invalid field, not as a generic "something went wrong" alert.

---

### 3.5 New Assessment (`/create-assessment`)

**Before Sprint 1:**
- Only a name field

**After Sprint 1:**

| Field | Type | Notes |
|:------|:-----|:------|
| Assessment name | Text | Required; minimum 3 characters |
| Building address | Text | Optional |
| Building type | Select dropdown | 8 options: School, Hospital, Office Building, Government Facility, Warehouse, Retail, Multi-Family Residential, Other |

After the user fills in the form, a **Preview Card** appears showing the entered details before they click "Start Assessment." This prevents users from accidentally starting an assessment with wrong building information.

---

### 3.6 Assessment Form (`/assessment`)

The assessment form is the most complex page in the application. Key UI decisions:

**Navigation:**
- Left sidebar shows all 7 categories with a completion indicator (green check when all questions answered)
- Active category is highlighted
- Category names scroll independently of the question area

**Question Cards:**
- Each question is rendered inside a `QuestionCard` component
- Question type drives the input widget: toggle (boolean), slider (scale), text area (comment), dropdown (select), checkboxes (multiselect), file picker (file)
- Boolean questions use a pill-shaped Yes/No toggle — tapping "Yes" turns the pill green; tapping "No" turns it red
- Comment fields slide in below the answer when `hasCommentField === true`

**Photo Uploads:**
- "+ Add Photo" button opens a file picker
- Up to 3 photos per question; max 5 MB each
- Thumbnail previews appear immediately with an "×" remove button
- Accepted formats: JPEG, PNG, WebP

**Cross-Section Search:**
- Search bar at the top queries all 1,381 questions simultaneously
- Results show the category and subcategory breadcrumb
- Matching text is highlighted in yellow (`bg-yellow-200`) within each result

**Progress Save:**
- A sticky "Save Progress" button is always visible at the bottom
- Auto-saves when navigating between categories

**Submit:**
- "Submit Assessment" button at the end of the last category
- Confirmation dialog before final submit
- After submit, redirects to the report view

---

### 3.7 Report View (`/report/:id`)

**Before Sprint 1:**
- Did not exist

**After Sprint 1:**

The report view is designed to be printed as a professional PDF:

```
┌──────────────────────────────────────────────────────────┐
│  MACHA GROUP SECURITY ASSESSMENT REPORT                  │
│  [Building Name]  ·  [Date]  ·  [Address]               │
├────────────────────────────┬─────────────────────────────┤
│  SCORE GAUGE               │  EXECUTIVE SUMMARY           │
│  [Circular gauge: 84%]     │  Risk Level: Moderate        │
│                            │  Questions: 42/1381           │
│                            │  Deficiencies found: 7       │
└────────────────────────────┴─────────────────────────────┘
│  DETAILED FINDINGS                                        │
│  [Question text]  Answer: Yes/No  [Comment if any]       │
│  ...                                                      │
├──────────────────────────────────────────────────────────┤
│  [Export as PDF]  [Back to Reports]                      │
└──────────────────────────────────────────────────────────┘
```

**PDF export:** The "Export as PDF" button calls `window.print()` with a dedicated `@media print` stylesheet that:
- Hides the navigation sidebar and all buttons
- Prints the report on white with black text (no colors/gradients)
- Formats the score gauge appropriately for print
- Uses print-safe fonts and margins

**Risk level logic:**
| Score | Risk Level |
|:-----:|:----------:|
| ≥ 85 | Low |
| 70–84 | Moderate |
| < 70 | High |

---

### 3.8 Reports List (`/reports`)

**Before Sprint 1:**
- Did not exist (was the old `RecentAssessmentsTable` component, never a full page)

**After Sprint 1:**
- A sortable list of all assessments for the current user
- Each row shows: assessment name, building type, date, status badge, score
- Clicking a row navigates to the full report view
- "New Assessment" CTA at the top for empty states

---

### 3.9 User Profile (`/profile`)

**Before Sprint 1:**
- Empty placeholder page

**After Sprint 1:**
- Avatar with the user's initials (first letter of first and last name, green background)
- Read-only display of: full name, email, Firebase UID, phone, organization, address
- "Edit Profile" button (leads to editable form — Sprint 2 full implementation)
- Assessment history section: compact list of all assessments with status badges

---

### 3.10 MFA Setup (`/mfa-setup`)

**Before Sprint 1:**
- Did not exist

**After Sprint 1:**
- Step-by-step card UI
- Step 1: Enter phone number with country code picker
- Step 2: Enter 6-digit SMS code
- Countdown timer for "Resend code" (60 seconds)
- reCAPTCHA container (invisible) handled automatically by Firebase
- On success: animated checkmark + redirect to dashboard

---

### 3.11 Forgot Password (`/forgot-password`)

**After Sprint 1:**
- Clean centered card with email field
- "Send Reset Link" button triggers `sendPasswordResetEmail`
- Success state: "Check your inbox" confirmation with mail icon
- "Back to login" link

---

### 3.12 About Us and Contact Us (`/about`, `/contact`)

**After Sprint 1:**
- Both pages use `AppShell` for consistent navigation
- About Us: Company mission, platform overview, tech stack section
- Contact Us: Contact form (name, email, subject, message) — form is UI-complete; email sending is a Sprint 3 Cloud Function task

---

## 4. Component Library

The following reusable components were built during Sprint 1:

| Component | Location | Description |
|:----------|:---------|:------------|
| `AppShell` | `layout/AppShell.tsx` | Navigation shell wrapping all authenticated pages |
| `ScoreGauge` | `dashboard/ScoreGauge.tsx` | Animated SVG circular progress indicator |
| `QuestionCard` | `organisms/QuestionCard.tsx` | Renders a single question with its input widget |
| `AuthGuard` | `auth/AuthGuard.tsx` | HOC that redirects unauthenticated users to `/login` |

---

## 5. Accessibility Foundations

Sprint 1 established the following accessibility practices:

| Practice | Implementation |
|:---------|:--------------|
| Semantic HTML | `<main>`, `<nav>`, `<section>`, `<h1>`–`<h3>` used appropriately |
| Form labels | Every input has an associated `<label>` element |
| Icon accessibility | All decorative SVGs have `aria-hidden="true"` |
| Color contrast | Text meets WCAG AA contrast ratio (4.5:1) against white backgrounds |
| Focus styles | Tailwind's `focus:ring` utilities applied to all interactive elements |
| Error messages | Form errors use `role="alert"` for screen reader announcement |

**Sprint 2 additions planned:**
- Full keyboard navigation for the assessment category sidebar
- `aria-live` region on the search results for screen readers
- Skip navigation link (`<a href="#main-content">Skip to main content</a>`)

---

## 6. Responsive Design

The application supports three breakpoints using Tailwind's responsive prefix system:

| Breakpoint | Min Width | Layout Behavior |
|:-----------|:---------:|:----------------|
| Mobile (default) | 0px | Single-column; hamburger menu; stacked forms |
| Tablet (`sm:`) | 640px | 2-column KPI grid; horizontal hero buttons |
| Desktop (`lg:`) | 1024px | 3-column bottom cards; sidebar always visible |
| Wide (`xl:`) | 1280px | 4-column KPI grid |

---

## 7. Performance Considerations

| Optimization | Implementation |
|:-------------|:--------------|
| Assessment cache | Two-tier (memory + localStorage) with 60-min TTL — avoids re-fetching 1,381 questions on every page load |
| Code splitting | React Router lazy-loads each page route; only the current page's JS is parsed |
| SVG icons | Inline SVGs (no network request); controlled size via `width`/`height` props |
| No external fonts | System font stack — zero layout shift from font loading |
| Image lazy loading | Photo thumbnails use `loading="lazy"` attribute |

---

## 8. UI Improvements Roadmap (Future Sprints)

### Sprint 2

| Improvement | Description | Rationale |
|:------------|:------------|:----------|
| Dark mode | `prefers-color-scheme` CSS media query + Tailwind `dark:` prefix | Reduces eye strain for long inspection sessions |
| Editable profile | Full edit form with save / cancel for user profile | Currently display-only |
| Assessment deletion | Swipe-to-delete or confirmation modal on the reports list | Users cannot currently delete test assessments |
| Toast notifications | Non-blocking success/error messages (e.g., "Progress saved") | Currently uses `alert()` dialogs |
| Skeleton loaders | Placeholder shimmer while Firestore data loads | Improves perceived performance once Firestore reads are live |

### Sprint 3

| Improvement | Description | Rationale |
|:------------|:------------|:----------|
| Per-category score breakdown | Bar chart showing score per category in the report | Helps clients prioritize improvements |
| PDF export improvements | Dedicated print stylesheet with Macha Group header/footer | More professional deliverable |
| Photo gallery in report | Inline thumbnails for each deficiency finding | Visual evidence in the printed report |
| Contact Us email | Cloud Function sends the contact form via SendGrid | Currently form is UI-only |
| Assessment search/filter | Filter reports list by date range, building type, score | Useful once users have many assessments |

### Sprint 4

| Improvement | Description | Rationale |
|:------------|:------------|:----------|
| Admin dashboard | Separate view for admin users to see all users' assessments | Required for multi-tenant organization support |
| Building management | Add/edit/archive buildings with address and type | Foundation for multi-building organizations |
| Multi-language support | i18n via `react-i18next` | Serve non-English-speaking clients |
| Offline mode | Service Worker caches the assessment form for use without internet | Assessors may work in buildings with poor connectivity |

---

<p align="center"><i>Document prepared February 2026 · Macha Group Sprint 1 Deliverable</i></p>
