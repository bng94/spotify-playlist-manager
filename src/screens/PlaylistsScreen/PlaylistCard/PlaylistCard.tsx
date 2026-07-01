import type { Playlist } from "../../../types";
import PlaylistArt from "../../../components/PlaylistArt/PlaylistArt";
import IconButton from "../../../components/IconButton/IconButton";
import SpotifyLink from "../../../components/SpotifyLink/SpotifyLink";
import styles from "./PlaylistCard.module.css";

interface PlaylistCardProps {
  playlist: Playlist;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

const PlaylistCard = ({
  playlist,
  onOpen,
  onDelete,
}: PlaylistCardProps) => {
  const trackTotal = playlist.tracks?.total ?? null;

  return (
    <div className={styles.card} onClick={() => onOpen(playlist.id)}>
      <PlaylistArt playlist={playlist} size={48} radius={4} />
      <div className={styles.meta}>
        <div className={`${styles.name} pm-truncate`}>{playlist.name}</div>
        <div className={styles.trackCount}>
          {trackTotal != null
            ? `${trackTotal} ${trackTotal === 1 ? "song" : "songs"}`
            : "–"}
        </div>
      </div>
      {playlist.external_urls.spotify && (
        <SpotifyLink
          url={playlist.external_urls.spotify}
          label={`Open ${playlist.name} on Spotify`}
          className={styles.openBtn}
        />
      )}
      <div className={styles.deleteBtn}>
        <IconButton
          icon="trash"
          size={16}
          color="var(--color-danger)"
          label={`Delete ${playlist.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(playlist.id);
          }}
        />
      </div>
    </div>
  );
};

export default PlaylistCard;
