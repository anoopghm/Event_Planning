interface ButtonProps {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "danger";
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

function Button({
  children,
  type = "button",
  variant = "primary",
  fullWidth = false,
  disabled = false,
  onClick,
  className = "",
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer";

  const variants = {
    primary:
      "bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/20",
    secondary:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/20",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}

export default Button;