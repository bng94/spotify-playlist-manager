import Button from "../../components/Button/Button";
import Icon from "../../components/Icon/Icon";
import styles from "./LoginScreen.module.css";

interface LoginScreenProps {
  onConnect: () => void;
  connectError?: string | null;
}

const LoginScreen = ({ onConnect, connectError }: LoginScreenProps) => {
  return (
    <div className={styles.container}>
      <h1 className={`pm-page-title ${styles.title}`}>Spotify Playlist Manager</h1>

      {connectError && (
        <div className={styles.error}>
          <Icon
            name="alert-triangle"
            size={16}
            color="var(--color-danger)"
            style={{ flexShrink: 0 }}
          />
          <span>{connectError}</span>
        </div>
      )}

      <Button
        variant="primary"
        pill
        onClick={onConnect}
        style={{ padding: "12px 28px", fontSize: 14 }}
      >
        Login to Spotify
      </Button>
    </div>
  );
};

export default LoginScreen;
