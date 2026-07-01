import type { CSSProperties, MouseEvent, ReactNode } from "react";
import Icon from "../Icon/Icon";

interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  pill?: boolean;
  icon?: string;
  children?: ReactNode;
  disabled?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  style?: CSSProperties;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const Button = ({
  variant = "secondary",
  pill,
  icon,
  children,
  disabled,
  onClick,
  style,
  type = "button",
  className,
}: ButtonProps) => {
  return (
    <button
      className={`pm-btn${variant !== "secondary" ? ` pm-btn--${variant}` : ""}${pill ? " pm-btn--pill" : ""}${className ? ` ${className}` : ""}`}
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={style}
    >
      {icon && <Icon name={icon} />}
      {children}
    </button>
  );
};

export default Button;
