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

function now() {
  return new Date().toISOString();
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

export function listAssessments(): AssessmentRecord[] {
  return load<AssessmentRecord[]>(ASSESS_KEY, []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function upsertAssessment(record: AssessmentRecord) {
  const all = listAssessments();
  const idx = all.findIndex(x => x.id === record.id);
  if (idx >= 0) all[idx] = record;
  else all.unshift(record);
  save(ASSESS_KEY, all);
}

export function createAssessment(input: { name: string; buildingId: string; assessmentId: string; address?: string; buildingType?: string }): AssessmentRecord {
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
    buildingType: input.buildingType
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
  upsertAssessment({ ...found, responses, status: 'in-progress', updatedAt: now() });
}

export function completeAssessment(id: string, responses: Record<string, any>) {
  const found = getAssessmentById(id);
  if (!found) return;
  const answered = Object.values(responses).filter(v => v !== '' && v !== null && v !== undefined).length;
  const score = Math.max(60, Math.min(100, Math.round(60 + answered * 1.2)));
  upsertAssessment({ ...found, responses, status: 'completed', score, updatedAt: now() });
}

export function getProfile(): UserProfileRecord {
  return load<UserProfileRecord>(PROFILE_KEY, { displayName: '' });
}

export function saveProfile(profile: UserProfileRecord) {
  save(PROFILE_KEY, profile);
}
