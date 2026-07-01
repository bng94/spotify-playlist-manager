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
  const cls = ["pm-btn"];
  if (variant === "primary") cls.push("pm-btn--primary");
  if (variant === "ghost") cls.push("pm-btn--ghost");
  if (variant === "danger") cls.push("pm-btn--danger");
  if (pill) cls.push("pm-btn--pill");
  if (className) cls.push(className);
  return (
    <button
      className={cls.join(" ")}
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
