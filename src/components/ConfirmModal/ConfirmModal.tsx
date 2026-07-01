import type { ReactNode } from "react";
import Button from "../Button/Button";
import Modal from "../Modal/Modal";

interface ConfirmModalProps {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  confirmIcon?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal = ({
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmIcon = "trash",
  onConfirm,
  onCancel,
}: ConfirmModalProps) => (
  <Modal
    title={title}
    onClose={onCancel}
    actions={
      <>
        <Button onClick={onCancel}>{cancelLabel}</Button>
        <Button variant="danger" icon={confirmIcon} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </>
    }
  >
    <p>{message}</p>
  </Modal>
);

export default ConfirmModal;
