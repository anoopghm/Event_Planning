interface ButtonProps {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "danger";
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

function Button({
  children,
  type = "button",
  variant = "primary",
  fullWidth = false,
  disabled = false,
  onClick,
}: ButtonProps) {
  const baseStyles =
    "rounded-[10px] px-4 py-3 text-sm font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";

  const variants = {
    primary: "bg-red-500 text-white hover:bg-red-600",
    secondary:
      "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${
        fullWidth ? "w-full" : ""
      }`}
    >
      {children}
    </button>
  );
}

export default Button;