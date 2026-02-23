/**
* Assessment Data Service
* Supports:
* - Firebase Firestore (default)
* - local JSON files (when REACT_APP_DATA_PROVIDER=local)
*/

import {
Assessment,
AssessmentRegistry,
AssessmentRegistryEntry,
Question,
QuestionType,
Category
} from '../../types/assessment';

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseConfig } from '../firebaseConfig';

const DATA_BASE_PATH = '/data';
const DATA_PROVIDER = process.env.REACT_APP_DATA_PROVIDER || 'firebase';

// Two-tier cache: in-memory + localStorage for persistence across page reloads
const cache = new Map<string, any>();
const CACHE_DURATION = 60 * 60 * 1000; // 60 minutes (reduced Firestore reads)
const LS_CACHE_PREFIX = 'macha.assessmentCache.';

interface CacheEntry<T> {
data: T;
timestamp: number;
}

function getCached<T>(key: string): T | null {
// Check in-memory cache first
const entry = cache.get(key) as CacheEntry<T> | undefined;
if (entry) {
  if (Date.now() - entry.timestamp > CACHE_DURATION) {
    cache.delete(key);
  } else {
    return entry.data;
  }
}

// Fall back to localStorage
try {
  const stored = localStorage.getItem(LS_CACHE_PREFIX + key);
  if (stored) {
    const parsed = JSON.parse(stored) as CacheEntry<T>;
    if (Date.now() - parsed.timestamp <= CACHE_DURATION) {
      cache.set(key, parsed); // Promote to in-memory
      return parsed.data;
    }
    localStorage.removeItem(LS_CACHE_PREFIX + key);
  }
} catch { /* ignore parse errors */ }

return null;
}

function setCached<T>(key: string, data: T): void {
const entry: CacheEntry<T> = { data, timestamp: Date.now() };
cache.set(key, entry);
try {
  localStorage.setItem(LS_CACHE_PREFIX + key, JSON.stringify(entry));
} catch { /* ignore quota errors */ }
}

/** ---------- Firebase Helpers ---------- */

function getDb() {
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }

return getFirestore();
}

type NodeType = 'category' | 'subcategory' | 'question';

interface FirebaseNode {
assessmentId: string;
type: NodeType;
parentId: string | null;
key: string;
title?: string;
text?: string;
order?: number;
active?: boolean;
questionType?: string;
required?: boolean;
hasCommentField?: boolean;
}

function sortByOrder<T extends { order?: number }>(arr: T[]): T[] {
return [...arr].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function toQuestionType(value?: string): QuestionType {
const v = (value || '').toLowerCase();
if (
v === 'boolean' ||
v === 'scale' ||
v === 'text' ||
v === 'select' ||
v === 'multiselect' ||
v === 'comment' ||
v === 'file'
) {
return v;
}
return 'boolean';
}

/** ---------- LOCAL (existing behavior) ---------- */

async function loadAssessmentRegistryLocal(): Promise<AssessmentRegistry> {
const response = await fetch(`${DATA_BASE_PATH}/assessments/index.json`);
if (!response.ok) {
throw new Error(`Failed to load registry: ${response.status}`);
}
return await response.json();
}

async function loadAssessmentLocal(assessmentId: string): Promise<Assessment | null> {
const response = await fetch(`${DATA_BASE_PATH}/assessments/${assessmentId}.json`);
if (!response.ok) {
throw new Error(`Failed to load assessment: ${response.status}`);
}

const data = await response.json();

// Basic validation
if (!data.id || !data.categories || !Array.isArray(data.categories)) {
throw new Error('Invalid assessment structure');
}

return data as Assessment;
}

/** ---------- FIREBASE ---------- */

async function loadAssessmentRegistryFirebase(): Promise<AssessmentRegistry> {
const db = getDb();
const snap = await getDocs(query(collection(db, 'assessments')));

const assessments: AssessmentRegistryEntry[] = snap.docs.map((d): AssessmentRegistryEntry => {
const v = d.data() as any;
return {
id: d.id,
title: v.title || d.id,
description: v.description || '',
version: v.version || '1.0.0',
lastUpdated: v.lastUpdated || new Date().toISOString(),
estimatedDuration: Number(v.estimatedDuration || 30),
fileName: `${d.id}.json`
};
});

return { assessments };
}

async function loadAssessmentFirebase(assessmentId: string): Promise<Assessment | null> {
const db = getDb();
const nodesSnap = await getDocs(
query(
collection(db, 'assessmentNodes'),
where('assessmentId', '==', assessmentId),
where('active', '==', true)
)
);

const nodes: FirebaseNode[] = nodesSnap.docs.map((d) => d.data() as FirebaseNode);
if (!nodes.length) return null;

const categories = sortByOrder(nodes.filter((n) => n.type === 'category'));
const subcategories = sortByOrder(nodes.filter((n) => n.type === 'subcategory'));
const questions = sortByOrder(nodes.filter((n) => n.type === 'question'));

// NOTE: Your Category type expects questions[] directly (no nested subcategories).
// So we flatten each category's subcategory questions into one category.questions[].
const mappedCategories: Category[] = categories.map((cat) => {
const catSubs = subcategories.filter((s) => s.parentId === cat.key);

const catQuestions: Question[] = sortByOrder(
questions.filter((q) => catSubs.some((s) => s.key === q.parentId))
).map((q) => {
const parentSub = catSubs.find((s) => s.key === q.parentId);

return {
id: q.key,
type: toQuestionType(q.questionType),
text: q.text || q.key,
helpText: parentSub?.title ? `Section: ${parentSub.title}` : undefined,
required: !!q.required,
hasCommentField: !!q.hasCommentField,
commentPrompt: 'Add additional details (optional).'
};
});

return {
id: cat.key,
title: cat.title || cat.key,
description: '',
questions: catQuestions
};
});

const assessment: Assessment = {
id: assessmentId,
version: '1.0.0',
metadata: {
title: 'School Security Assessment',
description: '',
lastUpdated: new Date().toISOString(),
estimatedDuration: 30
},
categories: mappedCategories
};

return assessment;
}

/** ---------- Public API ---------- */

export async function loadAssessmentRegistry(): Promise<AssessmentRegistry> {
const cacheKey = `assessment-registry-${DATA_PROVIDER}`;
const cached = getCached<AssessmentRegistry>(cacheKey);
if (cached) return cached;

try {
const data =
DATA_PROVIDER === 'firebase'
? await loadAssessmentRegistryFirebase()
: await loadAssessmentRegistryLocal();

setCached(cacheKey, data);
return data;
} catch (error) {
console.error('Error loading assessment registry:', error);
return { assessments: [] };
}
}

export async function loadAssessment(assessmentId: string): Promise<Assessment | null> {
const cacheKey = `assessment-${DATA_PROVIDER}-${assessmentId}`;
const cached = getCached<Assessment>(cacheKey);
if (cached) return cached;

try {
const data =
DATA_PROVIDER === 'firebase'
? await loadAssessmentFirebase(assessmentId)
: await loadAssessmentLocal(assessmentId);

if (data) setCached(cacheKey, data);
return data;
} catch (error) {
console.error(`Error loading assessment ${assessmentId}:`, error);
return null;
}
}

export async function getAssessmentMetadata(
assessmentId: string
): Promise<AssessmentRegistryEntry | null> {
const registry = await loadAssessmentRegistry();
return registry.assessments.find((a) => a.id === assessmentId) || null;
}

export async function preloadAssessments(assessmentIds: string[]): Promise<void> {
await Promise.all(assessmentIds.map((id) => loadAssessment(id)));
}

export function clearAssessmentCache(): void {
cache.clear();
try {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(LS_CACHE_PREFIX)) keysToRemove.push(key);
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
} catch { /* ignore */ }
}
