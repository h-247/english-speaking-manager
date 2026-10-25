import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, id, required, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-gray-300">
            {label}
            {required && <span className="text-rose-400 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          className={`w-full bg-[#1a1a1a] text-[#ececec] border rounded-lg px-3.5 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-1 transition-all ${
            error
              ? 'border-rose-500/80 focus:ring-rose-500 focus:border-rose-500'
              : 'border-[#383838] focus:border-gray-400 focus:ring-gray-400'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-xs text-rose-400 mt-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-gray-400 mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
