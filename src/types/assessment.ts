/**
 * TypeScript type definitions for the Assessment system
 */

// Question Types
export type QuestionType = 'boolean' | 'scale' | 'text' | 'select' | 'multiselect' | 'comment' | 'file';

// Validation Rules
export interface ValidationRule {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customMessage?: string;
}

// Conditional Logic
export interface ConditionalLogic {
  dependsOn: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains';
  value: any;
}

// Select Option
export interface SelectOption {
  value: string;
  label: string;
  score?: number;
}

// Question Definition
export interface Question {
  // This interface is broader than the current UI renderer: some fields support
  // future schema-driven behaviors that are not yet fully surfaced in forms.
  id: string;
  type: QuestionType;
  text: string;
  helpText?: string;
  required: boolean;
  conditional?: ConditionalLogic;
  validation?: ValidationRule;
  options?: SelectOption[];
  hasCommentField: boolean;
  commentPrompt: string;
}

// Category Definition
export interface Category {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  questions: Question[];
}

// Assessment Metadata
export interface AssessmentMetadata {
  title: string;
  description: string;
  lastUpdated: string;
  author?: string;
  estimatedDuration?: number;
  tags?: string[];
}

// Full Assessment
export interface Assessment {
  id: string;
  version: string;
  metadata: AssessmentMetadata;
  categories: Category[];
}

// Response Types
export type ResponseValue = boolean | string | number | string[];

export interface ResponseData {
  // Runtime code may also store comment values under derived keys such as
  // `${questionId}Comment`, even though the type models primary answers only.
  [questionId: string]: ResponseValue;
}

export interface AssessmentResponse {
  id?: string;
  assessmentId: string;
  buildingId: string;
  userId?: string;
  submittedAt?: string;
  completedAt?: string;
  status: 'in-progress' | 'completed' | 'exported';
  responses: ResponseData;
  scores?: {
    total: number;
    categoryScores: { [categoryId: string]: number };
  };
}

// Assessment Registry Entry (for index.json)
export interface AssessmentRegistryEntry {
  id: string;
  title: string;
  description: string;
  version: string;
  lastUpdated: string;
  estimatedDuration: number;
  fileName: string;
}

export interface AssessmentRegistry {
  assessments: AssessmentRegistryEntry[];
}
