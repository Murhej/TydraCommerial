import "./button.css";

export default function Button({
  type = "button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  children,
  ...rest
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`ui-btn ${variant} ${size} ${className}`.trim()}
      {...rest}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
