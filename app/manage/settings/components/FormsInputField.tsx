import React from 'react';
import { UseFormRegisterReturn, FieldError } from 'react-hook-form';

interface FormInputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
}

export const FormInputField: React.FC<FormInputFieldProps> = ({
  label,
  registration,
  error,
  type = 'text',
  className = '',
  ...props
}) => {
  return (
    <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-space-xs border border-outline-variant/30">
      <label className="font-label-lg text-label-lg font-semibold text-on-surface flex items-center justify-between">
        <span>{label}</span>
      </label>
      <input
        type={type}
        {...registration}
        {...props}
        className={`w-full bg-surface-container-lowest text-primary font-numeric-data text-headline-sm px-space-md py-space-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-container border border-outline-variant/40 mt-1 ${className}`}
      />
      {error?.message && (
        <p className="text-red-500 text-xs mt-1">{error.message}</p>
      )}
    </div>
  );
};