import styles from "./SpotifyLink.module.css";

interface SpotifyLinkProps {
  url: string;
  label: string;
  className?: string;
}

const SpotifyLink = ({ url, label, className }: SpotifyLinkProps) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.link}${className ? ` ${className}` : ""}`}
      aria-label={label}
      onClick={(e) => e.stopPropagation()}
      title="Open on Spotify"
    >
      <svg viewBox="0 0 100 100" className={styles.icon} aria-hidden="true">
        <circle cx="50" cy="50" r="50" fill="#1DB954" />
        <path d="M22,41 C37,31 63,31 78,41" stroke="white" strokeWidth="7.5" fill="none" strokeLinecap="round" />
        <path d="M27,55 C40,47 60,47 73,55" stroke="white" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M32,69 C43,63 57,63 68,69" stroke="white" strokeWidth="6.5" fill="none" strokeLinecap="round" />
      </svg>
    </a>
  );
};

export default SpotifyLink;
