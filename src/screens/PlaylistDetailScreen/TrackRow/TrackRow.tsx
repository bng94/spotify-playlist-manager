import type { PlaylistItem } from "../../../types";
import { formatDuration } from "../../../lib/playlistOperations";
import { useImageFallback } from "../../../hooks/useImageFallback";
import Checkbox from "../../../components/Checkbox/Checkbox";
import Icon from "../../../components/Icon/Icon";
import SpotifyLink from "../../../components/SpotifyLink/SpotifyLink";
import styles from "./TrackRow.module.css";

interface TrackRowProps {
  track: PlaylistItem;
  index: number;
  selected: boolean;
  isCurrent: boolean;
  isPaused: boolean;
  onSelect: (id: string) => void;
  onPlay: (index: number) => void;
}

const formatAddedAt = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const TrackRow = ({
  track,
  index,
  selected,
  isCurrent,
  isPaused,
  onSelect,
  onPlay,
}: TrackRowProps) => {
  const id = track.item?.id ?? "";
  const title = track.item?.name ?? "";
  const artist = track.item?.artists.map((a) => a.name).join(", ") ?? "";
  const album = track.item?.album.name;
  const albumThumb = track.item?.album.images.at(-1)?.url;
  const { failed: thumbFailed, onError: handleThumbError } =
    useImageFallback(albumThumb);
  const duration = track.item ? formatDuration(track.item.duration_ms) : "—";
  const addedAt = track.added_at ? formatAddedAt(track.added_at) : "—";

  return (
    <div className={`${styles.row} ${selected ? styles.selected : ""}`}>
      <Checkbox
        checked={selected}
        onChange={() => onSelect(id)}
        label={`Select ${title}`}
      />

      <div className={`${styles.indexCell} ${isCurrent ? styles.current : ""}`}>
        {isCurrent ? (
          <button
            type="button"
            className={styles.indexPlayBtn}
            aria-label={isPaused ? `Play ${title}` : `Pause ${title}`}
            onClick={() => onPlay(index)}
          >
            <Icon
              name={isPaused ? "player-play" : "player-pause"}
              size={14}
              color="var(--pm-green)"
            />
          </button>
        ) : (
          <>
            <span className={styles.indexNum}>{index + 1}</span>
            <button
              type="button"
              className={styles.indexHoverPlayBtn}
              aria-label={`Play ${title}`}
              onClick={() => onPlay(index)}
            >
              <Icon name="player-play" size={14} color="var(--ink-1)" />
            </button>
          </>
        )}
      </div>

      <div className={styles.titleCell}>
        <div className={styles.thumbWrap}>
          {albumThumb && !thumbFailed ? (
            <img
              src={albumThumb}
              alt=""
              className={styles.albumThumb}
              onError={handleThumbError}
            />
          ) : (
            <div className={styles.albumThumb} />
          )}
        </div>
        <div className={styles.titleMeta}>
          <div className={`${styles.titleRow} pm-truncate`}>
            <span
              className={`${styles.title} ${isCurrent ? styles.current : ""}`}
            >
              {title}
            </span>
            {track.item?.explicit && (
              <span className={styles.explicit} aria-label="Explicit">
                E
              </span>
            )}
          </div>
          <div className={`${styles.artist} pm-truncate`}>{artist}</div>
        </div>
      </div>

      <div className={`${styles.album} pm-truncate`}>{album ?? "—"}</div>

      <div className={styles.addedAt}>{addedAt}</div>

      <div className={styles.duration}>{duration}</div>

      {track.item?.external_urls.spotify ? (
        <SpotifyLink
          url={track.item?.external_urls.spotify}
          label={`Open ${title} on Spotify`}
          className={styles.openBtn}
        />
      ) : (
        <div />
      )}
    </div>
  );
};

export default TrackRow;
