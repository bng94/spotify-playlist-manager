import type { CSSProperties } from "react";

interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  style?: CSSProperties;
  className?: string;
}

const Checkbox = ({
  checked,
  indeterminate,
  onChange,
  label,
  style,
  className,
}: CheckboxProps) => {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      className={`pm-checkbox${indeterminate ? " pm-checkbox--indeterminate" : checked ? " pm-checkbox--checked" : ""}${className ? ` ${className}` : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onChange?.(!checked);
      }}
      style={style}
    >
      {indeterminate ? "−" : checked ? "✓" : ""}
    </button>
  );
};

export default Checkbox;
