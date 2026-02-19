import React from 'react';
import './Input.css';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'textarea';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  type?: InputType;
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
}

/**
 * Atomic Input Component
 * Text input with label and error handling
 */
export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  fullWidth = false,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseClasses = 'input';
  const errorClass = error ? 'input--error' : '';
  const widthClass = fullWidth ? 'input--full-width' : '';
  
  const classes = [baseClasses, errorClass, widthClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      {label && (
        <label htmlFor={inputId} className="input__label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className="input__field"
        {...props}
      />
      {error ? (
        <span className="input__error">{error}</span>
      ) : helperText ? (
        <span className="input__helper">{helperText}</span>
      ) : null}
    </div>
  );
};

export default Input;