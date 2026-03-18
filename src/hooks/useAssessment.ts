/**
 * Custom hook for loading and managing assessment data
 */

import { useState, useEffect, useCallback } from 'react';
import { Assessment, ResponseData } from '../types/assessment';
import { loadAssessment } from '../services/data/AssessmentLoader';

interface UseAssessmentReturn {
  assessment: Assessment | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to load an assessment by ID
 */
export function useAssessment(assessmentId: string | null): UseAssessmentReturn {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessment = useCallback(async () => {
    if (!assessmentId) {
      setAssessment(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await loadAssessment(assessmentId);
      if (data) {
        setAssessment(data);
      } else {
        setError(`Assessment "${assessmentId}" not found`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    fetchAssessment();
  }, [fetchAssessment]);

  return {
    assessment,
    loading,
    error,
    refetch: fetchAssessment
  };
}

interface UseAssessmentResponseReturn {
  responses: ResponseData;
  updateResponse: (questionId: string, value: any) => void;
  updateComment: (questionId: string, comment: string) => void;
  getResponse: (questionId: string) => any;
  getComment: (questionId: string) => string;
  isComplete: (requiredQuestionIds: string[]) => boolean;
  resetResponses: () => void;
  photos: Record<string, { name: string; dataUrl: string }[]>;
  updatePhotos: (questionId: string, photos: { name: string; dataUrl: string }[]) => void;
  getPhotos: (questionId: string) => { name: string; dataUrl: string }[];
}

/**
 * Hook to manage assessment responses
 */
export function useAssessmentResponse(
  initialResponses: ResponseData = {}
): UseAssessmentResponseReturn {
  const [responses, setResponses] = useState<ResponseData>(initialResponses);
  // Photo attachments are tracked separately from the main response object so
  // text/boolean answers can stay lightweight and serializable on their own.
  const [photos, setPhotos] = useState<Record<string, { name: string; dataUrl: string }[]>>({});

  const updateResponse = useCallback((questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  }, []);

  const updateComment = useCallback((questionId: string, comment: string) => {
    // Comment fields are flattened into the same response bag using a derived
    // key so reports/storage can look them up without a separate schema.
    const commentKey = `${questionId}Comment`;
    setResponses(prev => ({
      ...prev,
      [commentKey]: comment
    }));
  }, []);

  const getResponse = useCallback((questionId: string) => {
    return responses[questionId];
  }, [responses]);

  const getComment = useCallback((questionId: string): string => {
    const value = responses[`${questionId}Comment`];
    return typeof value === 'string' ? value : '';
  }, [responses]);

  const isComplete = useCallback((requiredQuestionIds: string[]) => {
    // Completion here only checks required answer slots; optional comments and
    // photo attachments do not affect whether a section is considered complete.
    return requiredQuestionIds.every(id => {
      const value = responses[id];
      return value !== undefined && value !== null && value !== '';
    });
  }, [responses]);

  const resetResponses = useCallback(() => {
    setResponses({});
    setPhotos({});
  }, []);

  const updatePhotos = useCallback((questionId: string, questionPhotos: { name: string; dataUrl: string }[]) => {
    setPhotos(prev => ({ ...prev, [questionId]: questionPhotos }));
  }, []);

  const getPhotos = useCallback((questionId: string): { name: string; dataUrl: string }[] => {
    return photos[questionId] || [];
  }, [photos]);

  return {
    responses,
    updateResponse,
    updateComment,
    getResponse,
    getComment,
    isComplete,
    resetResponses,
    photos,
    updatePhotos,
    getPhotos
  };
}
