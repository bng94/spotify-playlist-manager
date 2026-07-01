import type { CSSProperties } from "react";

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: CSSProperties;
}

const Icon = ({ name, size, color, style }: IconProps) => {
  return (
    <i
      className={`ti ti-${name}`}
      aria-hidden="true"
      style={{
        fontSize: size ?? 14,
        color: color ?? "inherit",
        lineHeight: 1,
        ...style,
      }}
    />
  );
};

export default Icon;
