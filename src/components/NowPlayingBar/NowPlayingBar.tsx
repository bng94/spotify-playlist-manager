import { useEffect, useState } from "react";
import type { SpotifyTrack } from "../../types";
import { formatDuration } from "../../lib/playlistOperations";
import Icon from "../Icon/Icon";
import IconButton from "../IconButton/IconButton";
import styles from "./NowPlayingBar.module.css";

interface NowPlayingBarProps {
  track: SpotifyTrack | undefined;
  isPlaying: boolean;
  position: number;
  volume: number;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (positionMs: number) => void;
  onVolumeChange: (volume: number) => void;
}

const volumeIcon = (v: number) => {
  if (v === 0) return "volume-off";
  if (v < 0.35) return "volume";
  if (v < 0.7) return "volume-2";
  return "volume-3";
};

const NowPlayingBar = ({
  track,
  isPlaying,
  position,
  volume,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
}: NowPlayingBarProps) => {
  const [artFailed, setArtFailed] = useState(false);
  useEffect(() => { setArtFailed(false); }, [track?.id]);

  if (!track) return null;

  const albumArt = track.album.images.at(-1)?.url;
  const duration = track.duration_ms;
  const clampedPosition = Math.min(position, duration);
  const progress = duration > 0 ? (clampedPosition / duration) * 100 : 0;

  return (
    <div className={styles.bar}>
      <div className={styles.progressRow}>
        <span className={styles.timeLabel}>{formatDuration(clampedPosition)}</span>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          <input
            type="range"
            className={styles.progressInput}
            min={0}
            max={duration}
            value={clampedPosition}
            onChange={(e) => onSeek(Number(e.target.value))}
            aria-label="Seek"
          />
        </div>
        <span className={styles.timeLabel}>{formatDuration(duration)}</span>
      </div>

      <div className={styles.controls}>
        <div className={styles.trackInfo}>
          {albumArt && !artFailed && <img src={albumArt} alt="" className={styles.albumArt} onError={() => setArtFailed(true)} />}
          <div className={styles.trackMeta}>
            <div className={`${styles.trackTitle} pm-truncate`}>{track.name}</div>
            <div className={`${styles.trackArtist} pm-truncate`}>
              {track.artists.map((a) => a.name).join(", ")}
            </div>
          </div>
        </div>

        <div className={styles.transport}>
          <IconButton icon="player-skip-back" size={18} label="Previous" onClick={onPrev} />
          <button
            type="button"
            aria-label={isPlaying ? "Pause" : "Play"}
            onClick={onTogglePlay}
            className={styles.playBtn}
          >
            <Icon
              name={isPlaying ? "player-pause" : "player-play"}
              size={17}
              color="var(--ink-on-accent)"
            />
          </button>
          <IconButton icon="player-skip-forward" size={18} label="Next" onClick={onNext} />
        </div>

        <div className={styles.secondaryControls}>
          <div className={styles.volumeControl}>
            <Icon name={volumeIcon(volume)} size={16} color="var(--ink-3)" />
            <div className={styles.volumeTrack}>
              <div className={styles.volumeFill} style={{ width: `${volume * 100}%` }} />
              <input
                type="range"
                className={styles.volumeInput}
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                aria-label="Volume"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NowPlayingBar;
