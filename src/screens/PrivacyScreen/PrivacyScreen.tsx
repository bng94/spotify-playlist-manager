import Button from "../../components/Button/Button";
import PageHeader from "../../components/PageHeader/PageHeader";
import styles from "./PrivacyScreen.module.css";

interface PrivacyScreenProps {
  onBack: () => void;
}

const PrivacyScreen = ({ onBack }: PrivacyScreenProps) => {
  return (
    <div>
      <PageHeader overline="Legal" title="Privacy Policy" />

      <div className={styles.body}>
        <div className={styles.section}>
          <p className={styles.paragraph}>
            Spotify Playlist Manager is a personal, non-commercial project. This
            policy explains what it does with your data.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>What it accesses</h2>
          <p className={styles.paragraph}>
            When you log in, Spotify asks you to approve the following
            permissions: viewing your profile and email, viewing your private
            playlists, and creating or modifying playlists on your behalf.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>What it stores</h2>
          <p className={styles.paragraph}>
            Your Spotify access token is kept only in your browser for the
            duration of your session. No playlist data, listening history, or
            personal information is collected, stored on a server, or shared
            with any third party.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Contact</h2>
          <p className={styles.paragraph}>
            This is a personal project with no organization behind it. Questions
            can be sent to{" "}
            <a
              href="mailto:brandon.bing.ng@gmail.com"
              className={styles.link}
            >
              brandon.bing.ng@gmail.com
            </a>
            .
          </p>
        </div>

        <div className={styles.actions}>
          <Button onClick={onBack}>Back</Button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyScreen;
