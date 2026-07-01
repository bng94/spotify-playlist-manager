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
}

const IconButton = ({
  icon,
  size = 16,
  label,
  onClick,
  color,
  style,
}: IconButtonProps) => {
  const baseColor = color ?? "var(--ink-3)";
  return (
    <button
      aria-label={label}
      type="button"
      onClick={onClick}
      className={styles.iconBtn}
      style={{ "--icon-color": baseColor, ...style } as CSSProperties}
    >
      <Icon name={icon} size={size} />
    </button>
  );
};

export default IconButton;
