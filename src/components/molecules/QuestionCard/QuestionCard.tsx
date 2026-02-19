import React from 'react';
import { Question } from '../../../types/assessment';
import './QuestionCard.css';

interface QuestionCardProps {
  question: Question;
  value: any;
  comment: string;
  onChange: (value: any) => void;
  onCommentChange: (comment: string) => void;
  error?: string;
}

/**
 * Molecule: QuestionCard
 * Renders a single question with its input type and optional comment
 */
export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  value,
  comment,
  onChange,
  onCommentChange,
  error
}) => {
  const renderInput = () => {
    switch (question.type) {
      case 'boolean':
        return (
          <div className="question-card__boolean">
            <label className={`boolean-option ${value === true ? 'boolean-option--selected' : ''}`}>
              <input
                type="radio"
                name={question.id}
                checked={value === true}
                onChange={() => onChange(true)}
              />
              <span className="boolean-option__text">Yes</span>
            </label>
            <label className={`boolean-option ${value === false ? 'boolean-option--selected' : ''}`}>
              <input
                type="radio"
                name={question.id}
                checked={value === false}
                onChange={() => onChange(false)}
              />
              <span className="boolean-option__text">No</span>
            </label>
          </div>
        );
      
      case 'scale':
        return (
          <div className="question-card__scale">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                className={`scale-button ${value === num ? 'scale-button--selected' : ''}`}
                onClick={() => onChange(num)}
              >
                {num}
              </button>
            ))}
          </div>
        );
      
      case 'text':
        return (
          <textarea
            className="question-card__textarea"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your answer..."
            rows={4}
          />
        );
      
      default:
        return (
          <input
            type="text"
            className="question-card__input"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your answer..."
          />
        );
    }
  };

  return (
    <div className={`question-card ${error ? 'question-card--error' : ''}`}>
      <div className="question-card__header">
        <h3 className="question-card__text">
          {question.text}
          {question.required && <span className="question-card__required">*</span>}
        </h3>
        {question.helpText && (
          <p className="question-card__help">{question.helpText}</p>
        )}
      </div>
      
      <div className="question-card__input-wrapper">
        {renderInput()}
      </div>
      
      {question.hasCommentField && (
        <div className="question-card__comment">
          <label className="question-card__comment-label">
            {question.commentPrompt}
          </label>
          <textarea
            className="question-card__comment-input"
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            rows={2}
            placeholder="Add additional details (optional)..."
          />
        </div>
      )}
      
      {error && (
        <span className="question-card__error">{error}</span>
      )}
    </div>
  );
};

export default QuestionCard;