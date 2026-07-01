import Icon from "../../components/Icon/Icon";
import LoginScreen from "../LoginScreen/LoginScreen";
import styles from "./CallbackScreen.module.css";

interface CallbackScreenProps {
  status: "loading" | "error";
  errorMessage?: string;
  onRetry: () => void;
}

const CallbackScreen = ({
  status,
  errorMessage,
  onRetry,
}: CallbackScreenProps) => {
  return (
    <div className={styles.container}>
      {status === "loading" ? (
        <>
          <Icon
            name="loader-2"
            size={28}
            color="var(--ink-3)"
            style={{ animation: "pm-spin 0.8s linear infinite" }}
          />
          <div className={styles.loadingText}>Connecting to Spotify…</div>
        </>
      ) : (
        <LoginScreen
          onConnect={onRetry}
          connectError={errorMessage ?? "Spotify sign-in didn't complete."}
        />
      )}
    </div>
  );
};

export default CallbackScreen;
