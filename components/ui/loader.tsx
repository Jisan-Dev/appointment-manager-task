type LoaderProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  ariaLabel?: string;
};

const sizeMap: Record<NonNullable<LoaderProps["size"]>, string> = {
  sm: "w-4 h-4 border-2",
  md: "w-5 h-5 border-2",
  lg: "w-6 h-6 border-2",
};

export default function Loader({
  size = "sm",
  className = "",
  ariaLabel = "Loading",
}: LoaderProps) {
  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={`${sizeMap[size]} border-t-transparent rounded-full animate-spin inline-block ${className}`}
    />
  );
}
