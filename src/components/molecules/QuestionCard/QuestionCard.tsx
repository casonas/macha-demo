import React, { useRef } from 'react';
import { Question } from '../../../types/assessment';
import './QuestionCard.css';

const MAX_PHOTOS = 3;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface PhotoAttachment {
  name: string;
  dataUrl: string;
}

interface QuestionCardProps {
  question: Question;
  value: any;
  comment: string;
  onChange: (value: any) => void;
  onCommentChange: (comment: string) => void;
  error?: string;
  searchQuery?: string;
  photos?: PhotoAttachment[];
  onPhotosChange?: (photos: PhotoAttachment[]) => void;
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query || !query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="question-card__highlight">{part}</mark> : part
  );
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
  error,
  searchQuery,
  photos = [],
  onPhotosChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !onPhotosChange) return;
    const remaining = MAX_PHOTOS - photos.length;
    const files = Array.from(e.target.files).slice(0, remaining);

    files.forEach((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) return;
      if (file.size > MAX_FILE_SIZE_BYTES) return;

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        onPhotosChange([...photos, { name: file.name, dataUrl }]);
      };
      reader.readAsDataURL(file);
    });

    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    if (!onPhotosChange) return;
    onPhotosChange(photos.filter((_, i) => i !== index));
  };
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
          {highlightText(question.text, searchQuery || '')}
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

      {onPhotosChange && (
        <div className="question-card__photos">
          <div className="question-card__photos-header">
            <span className="question-card__photos-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              Photos ({photos.length}/{MAX_PHOTOS})
            </span>
            {photos.length < MAX_PHOTOS && (
              <button type="button" className="question-card__photos-add" onClick={() => fileInputRef.current?.click()}>
                + Add Photo
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              onChange={handleFileSelect}
              className="question-card__photos-input"
              aria-label="Upload photo"
            />
          </div>
          {photos.length > 0 && (
            <div className="question-card__photos-grid">
              {photos.map((photo, i) => (
                <div key={i} className="question-card__photo-thumb">
                  <img src={photo.dataUrl} alt={photo.name} />
                  <button type="button" className="question-card__photo-remove" onClick={() => removePhoto(i)} aria-label={`Remove ${photo.name}`}>✕</button>
                  <span className="question-card__photo-name">{photo.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {error && (
        <span className="question-card__error">{error}</span>
      )}
    </div>
  );
};

export default QuestionCard;