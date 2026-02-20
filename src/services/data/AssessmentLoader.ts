/**
* Assessment Data Service
* Supports:
* - local JSON files (default)
* - Firebase Firestore (when REACT_APP_DATA_PROVIDER=firebase)
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

const DATA_BASE_PATH = '/data';
const DATA_PROVIDER = process.env.REACT_APP_DATA_PROVIDER || 'firebase';

// Simple in-memory cache
const cache = new Map<string, any>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
data: T;
timestamp: number;
}

function getCached<T>(key: string): T | null {
const entry = cache.get(key) as CacheEntry<T> | undefined;
if (!entry) return null;

if (Date.now() - entry.timestamp > CACHE_DURATION) {
cache.delete(key);
return null;
}

return entry.data;
}

function setCached<T>(key: string, data: T): void {
cache.set(key, { data, timestamp: Date.now() });
}

/** ---------- Firebase Helpers ---------- */

function getDb() {
const firebaseConfig = {
apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyAOfLCpcP-Lq3QXUhrGNbeUdys-CsCPvrM',
authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'macha-demo.firebaseapp.com',
projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'macha-demo',
storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'macha-demo.firebasestorage.app',
messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '345709514301',
appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:345709514301:web:d1bbb63d8274a50cf42454'
};

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
}
