import type { CSSProperties, MouseEvent } from "react";
import Icon from "../Icon/Icon";
import styles from "./IconButton.module.css";

interface IconButtonProps {
  icon: string;
  size?: number;
  label?: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  color?: string;
  style?: CSSProperties;
  className?: string;
  filled?: boolean;
}

const IconButton = ({
  icon,
  size = 16,
  label,
  onClick,
  color,
  style,
  className,
  filled,
}: IconButtonProps) => {
  const baseColor = color ?? "var(--ink-3)";
  return (
    <button
      aria-label={label}
      type="button"
      onClick={onClick}
      className={`${styles.iconBtn}${className ? ` ${className}` : ""}`}
      style={{ "--icon-color": baseColor, ...style } as CSSProperties}
    >
      <Icon name={icon} size={size} filled={filled} />
    </button>
  );
};

export default IconButton;
