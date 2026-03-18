export type AssessmentStatus = 'draft' | 'in-progress' | 'completed';

export interface AssessmentRecord {
  id: string;
  name: string;
  buildingId: string;
  assessmentId: string;
  status: AssessmentStatus;
  score?: number;
  createdAt: string;
  updatedAt: string;
  responses: Record<string, any>;
  address?: string;
  buildingType?: string;
  userId?: string;
  photos?: Record<string, { name: string; dataUrl: string }[]>;
}

export interface UserProfileRecord {
  displayName: string;
  phone?: string;
  address?: string;
  userId?: string;
}

const ASSESS_KEY = 'macha.assessments';
const ACTIVE_KEY = 'macha.activeAssessmentId';
const PROFILE_KEY = 'macha.profile';
const CURRENT_USER_KEY = 'macha.currentUserId';

// Match the same default as authService.ts — set REACT_APP_DATA_PROVIDER=local for offline development
const USE_FIREBASE = (process.env.REACT_APP_DATA_PROVIDER || 'firebase') === 'firebase';

function now() {
  return new Date().toISOString();
}

function getCurrentUserId(): string {
  return localStorage.getItem(CURRENT_USER_KEY) || '';
}

export function setCurrentUserId(userId: string) {
  localStorage.setItem(CURRENT_USER_KEY, userId);
}

function userAssessKey(userId?: string): string {
  const uid = userId || getCurrentUserId();
  return uid ? `${ASSESS_KEY}.${uid}` : ASSESS_KEY;
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function saveAssessmentToFirestore(record: AssessmentRecord) {
  if (!USE_FIREBASE) return;
  try {
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const { getFirebaseDb } = await import('../firebaseConfig');
    const db = getFirebaseDb();
    // Keep localStorage as the primary write path for the demo UX, then mirror
    // the structured assessment record to Firestore without embedding photo data.
    const { photos, ...data } = record;
    await setDoc(doc(db, 'userAssessments', record.id), {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Failed to save assessment to Firestore:', err);
  }
}

async function uploadPhotosToStorage(userId: string, assessmentId: string, photos: Record<string, { name: string; dataUrl: string }[]>) {
  if (!USE_FIREBASE) return;
  try {
    const { ref, uploadString } = await import('firebase/storage');
    const { getFirebaseStorage } = await import('../firebaseConfig');
    const storage = getFirebaseStorage();
    for (const [questionId, photoList] of Object.entries(photos)) {
      for (let i = 0; i < photoList.length; i++) {
        const photo = photoList[i];
        const storagePath = `photos/${userId}/${assessmentId}/${questionId}/${i}_${photo.name}`;
        const storageRef = ref(storage, storagePath);
        await uploadString(storageRef, photo.dataUrl, 'data_url');
      }
    }
  } catch (err) {
    console.error('Failed to upload photos to Firebase Storage:', err);
  }
}

export function listAssessments(): AssessmentRecord[] {
  return load<AssessmentRecord[]>(userAssessKey(), []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listAssessmentsByUser(userId: string): AssessmentRecord[] {
  return load<AssessmentRecord[]>(userAssessKey(userId), []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function deleteAssessment(id: string): void {
  const all = listAssessments().filter(a => a.id !== id);
  save(userAssessKey(), all);
}

export function upsertAssessment(record: AssessmentRecord) {
  // Assessments are partitioned by the active user when available so local demo
  // data does not bleed across accounts sharing the same browser.
  const key = userAssessKey(record.userId);
  const all = load<AssessmentRecord[]>(key, []);
  const idx = all.findIndex(x => x.id === record.id);
  if (idx >= 0) all[idx] = record;
  else all.unshift(record);
  save(key, all);
}

export function createAssessment(input: { name: string; buildingId: string; assessmentId: string; address?: string; buildingType?: string; userId?: string }): AssessmentRecord {
  const id = `AS-${Date.now()}`;
  const rec: AssessmentRecord = {
    id,
    name: input.name,
    buildingId: input.buildingId,
    assessmentId: input.assessmentId,
    status: 'in-progress',
    createdAt: now(),
    updatedAt: now(),
    responses: {},
    address: input.address,
    buildingType: input.buildingType,
    userId: input.userId
  };
  upsertAssessment(rec);
  setActiveAssessmentId(id);
  return rec;
}

export function getAssessmentById(id: string): AssessmentRecord | null {
  return listAssessments().find(x => x.id === id) ?? null;
}

export function setActiveAssessmentId(id: string) {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function getActiveAssessmentId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function saveAssessmentProgress(id: string, responses: Record<string, any>) {
  const found = getAssessmentById(id);
  if (!found) return;
  const updated = { ...found, responses, status: 'in-progress' as AssessmentStatus, updatedAt: now() };
  upsertAssessment(updated);
  saveAssessmentToFirestore(updated);
}

export function completeAssessment(id: string, responses: Record<string, any>, photos?: Record<string, { name: string; dataUrl: string }[]>) {
  const found = getAssessmentById(id);
  if (!found) return;
  const answered = Object.values(responses).filter(v => v !== '' && v !== null && v !== undefined).length;
  // Demo scoring is intentionally lightweight: completion volume maps to a
  // bounded score until a domain-specific scoring model replaces it.
  const score = Math.max(60, Math.min(100, Math.round(60 + answered * 1.2)));
  const updated: AssessmentRecord = { ...found, responses, status: 'completed', score, updatedAt: now(), photos };
  upsertAssessment(updated);
  saveAssessmentToFirestore(updated);
  if (photos && found.userId) {
    uploadPhotosToStorage(found.userId, id, photos);
  }
}

export function getProfile(): UserProfileRecord {
  return load<UserProfileRecord>(PROFILE_KEY, { displayName: '' });
}

export function saveProfile(profile: UserProfileRecord) {
  save(PROFILE_KEY, profile);
}
