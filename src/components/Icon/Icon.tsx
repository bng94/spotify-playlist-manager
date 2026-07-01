import type { CSSProperties } from "react";

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: CSSProperties;
  className?: string;
  filled?: boolean;
}

const Icon = ({ name, size, color, style, className, filled }: IconProps) => {
  return (
    <i
      className={`ti ti-${name}${className ? ` ${className}` : ""}`}
      aria-hidden="true"
      style={{
        fontSize: size ?? 14,
        color: color ?? "inherit",
        lineHeight: 1,
        ...(filled ? { fontFamily: '"tabler-icons-filled"' } : {}),
        ...style,
      }}
    />
  );
};

export default Icon;
