import Button from "../../components/Button/Button";
import styles from "./AppConfigErrorScreen.module.css";

const CONTACT_EMAIL = "brandon.bing.ng@gmail.com";
const EMAIL_SUBJECT = "Interested in Playlist Manager for Spotify";
const EMAIL_BODY = `Hi Brandon,\n\nI came across your Playlist Manager for Spotify app and I'm interested in using it, can you enable it? `;

const contactHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(EMAIL_SUBJECT)}&body=${encodeURIComponent(EMAIL_BODY)}`;

interface AppConfigErrorScreenProps {
  onLogout: () => void;
}

const AppConfigErrorScreen = ({
  onLogout,
}: AppConfigErrorScreenProps) => {
  return (
    <div className={styles.container}>
      <p className={styles.title}>App Configuration Issue</p>
      <p className={styles.body}>
        App developer required to have an active Spotify Premium subscription.{" "}
        <a href={contactHref} className={styles.link}>
          Contact the developer
        </a>
        .
      </p>
      <Button onClick={onLogout}>Log out</Button>
    </div>
  );
};

export default AppConfigErrorScreen;
