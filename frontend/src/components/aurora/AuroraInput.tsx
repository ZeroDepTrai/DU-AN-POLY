import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

interface AuroraInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const AuroraInput = forwardRef<HTMLInputElement, AuroraInputProps>(function AuroraInput(
  { label, hint, error, className = "", id, ...rest },
  ref,
) {
  const inputId = id ?? `aurora-input-${rest.name ?? Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-softgray">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={["aurora-input", error ? "border-deeprose/60 focus:ring-deeprose/30" : "", className].join(" ")}
        {...rest}
      />
      {hint && !error && <p className="text-xs text-steelgray">{hint}</p>}
      {error && <p className="text-xs text-deeprose">{error}</p>}
    </div>
  );
});

interface AuroraTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const AuroraTextarea = forwardRef<HTMLTextAreaElement, AuroraTextareaProps>(function AuroraTextarea(
  { label, hint, error, className = "", id, ...rest },
  ref,
) {
  const inputId = id ?? `aurora-textarea-${rest.name ?? Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-softgray">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        ref={ref}
        className={["aurora-input resize-none", error ? "border-deeprose/60 focus:ring-deeprose/30" : "", className].join(" ")}
        {...rest}
      />
      {hint && !error && <p className="text-xs text-steelgray">{hint}</p>}
      {error && <p className="text-xs text-deeprose">{error}</p>}
    </div>
  );
});

export default AuroraInput;