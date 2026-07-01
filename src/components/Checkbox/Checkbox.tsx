import type { CSSProperties } from "react";

interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  style?: CSSProperties;
}

const Checkbox = ({
  checked,
  indeterminate,
  onChange,
  label,
  style,
}: CheckboxProps) => {
  const cls = ["pm-checkbox"];
  if (indeterminate) cls.push("pm-checkbox--indeterminate");
  else if (checked) cls.push("pm-checkbox--checked");
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      className={cls.join(" ")}
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
