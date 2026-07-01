import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import styles from "./ToastContext.module.css";

interface TimedToastProps {
  message: string;
  duration?: number;
  onConfirm: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

const TimedToast = ({
  message,
  duration = 5000,
  onConfirm,
  onAction,
  actionLabel = "Undo",
}: TimedToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onConfirm, duration);
    return () => clearTimeout(timer);
  }, [duration, onConfirm]);

  return (
    <div className={styles.timedToast}>
      <span className={styles.timedMessage}>{message}</span>
      {onAction && (
        <button type="button" onClick={onAction} className={styles.actionBtn}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

interface ErrorToastProps {
  message: string;
  onDismiss: () => void;
}

const ErrorToast = ({ message, onDismiss }: ErrorToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={styles.errorToast}>
      <span className={styles.errorMessage}>{message}</span>
      <button type="button" onClick={onDismiss} className={styles.dismissBtn}>
        ×
      </button>
    </div>
  );
};

type Toast = {
  id: number;
  type: "timed" | "error";
  message: string;
  onAction?: () => void;
};

type ToastContextValue = {
  pushToast: (message: string, onAction?: () => void) => void;
  pushError: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue>({
  pushToast: () => {},
  pushError: () => {},
});

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismissToast = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const pushToast = useCallback((message: string, onAction?: () => void) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, type: "timed", message, onAction }]);
  }, []);

  const pushError = useCallback((message: string) => {
    setToasts((prev) => {
      if (prev.some((t) => t.type === "error" && t.message === message)) return prev;
      return [...prev, { id: nextId.current++, type: "error", message }];
    });
  }, []);

  return (
    <ToastContext value={{ pushToast, pushError }}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) =>
          t.type === "error" ? (
            <ErrorToast
              key={t.id}
              message={t.message}
              onDismiss={() => dismissToast(t.id)}
            />
          ) : (
            <TimedToast
              key={t.id}
              message={t.message}
              duration={5000}
              onConfirm={() => dismissToast(t.id)}
              onAction={
                t.onAction
                  ? () => {
                      t.onAction!();
                      dismissToast(t.id);
                    }
                  : undefined
              }
            />
          ),
        )}
      </div>
    </ToastContext>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  return useContext(ToastContext);
};

export default ToastProvider;
