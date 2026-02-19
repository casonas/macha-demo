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
}

/**
 * Hook to manage assessment responses
 */
export function useAssessmentResponse(
  initialResponses: ResponseData = {}
): UseAssessmentResponseReturn {
  const [responses, setResponses] = useState<ResponseData>(initialResponses);

  const updateResponse = useCallback((questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  }, []);

  const updateComment = useCallback((questionId: string, comment: string) => {
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
    return requiredQuestionIds.every(id => {
      const value = responses[id];
      return value !== undefined && value !== null && value !== '';
    });
  }, [responses]);

  const resetResponses = useCallback(() => {
    setResponses({});
  }, []);

  return {
    responses,
    updateResponse,
    updateComment,
    getResponse,
    getComment,
    isComplete,
    resetResponses
  };
}