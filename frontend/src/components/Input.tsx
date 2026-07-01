import { InputHTMLAttributes, forwardRef, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, hint, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-softgray">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-steelgray">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              input-field
              ${icon ? "pl-10" : ""}
              ${error ? "border-deeprose focus:border-deeprose focus:ring-deeprose" : ""}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-deeprose">{error}</p>}
        {hint && !error && <p className="text-xs text-steelgray">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
