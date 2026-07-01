import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, children, className = "", disabled, ...props }, ref) => {
    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm gap-1.5",
      md: "px-5 py-2.5 text-sm gap-2",
      lg: "px-6 py-3 text-base gap-2",
    };

    const variantClasses = {
      primary: "bg-crimson text-white hover:bg-raspberry active:bg-deeprose disabled:opacity-50",
      secondary: "border border-gunmetal bg-graphite text-warmwhite hover:border-silvergray hover:bg-gunmetal disabled:opacity-50",
      ghost: "text-softgray hover:bg-gunmetal hover:text-warmwhite disabled:opacity-50",
      danger: "bg-deeprose text-white hover:bg-raspberry active:bg-winered disabled:opacity-50",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-rose focus:ring-offset-2 focus:ring-offset-charcoal disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {loading && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
