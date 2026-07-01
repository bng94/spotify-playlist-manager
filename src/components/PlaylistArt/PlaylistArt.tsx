import type { Playlist } from "../../types";
import { useImageFallback } from "../../hooks/useImageFallback";
import styles from "./PlaylistArt.module.css";

interface PlaylistArtProps {
  playlist: Playlist;
  size?: number;
  radius?: number;
}

const FALLBACK_COLORS = [
  "#3a2e5f", "#5f3a2e", "#2e5f3a", "#5f5f2e",
  "#2e3f5f", "#5f2e4a", "#3a5f2e", "#2e5f5f",
];

const idToColor = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
};

const PlaylistArt = ({
  playlist,
  size = 40,
  radius = 4,
}: PlaylistArtProps) => {
  const imageUrl = playlist.images?.[0]?.url;
  const { failed, onError } = useImageFallback(imageUrl);
  return imageUrl && !failed ? (
    <img
      src={imageUrl}
      alt={playlist.name}
      onError={onError}
      className={styles.art}
      style={{ width: size, height: size, borderRadius: radius }}
    />
  ) : (
    <div
      className={styles.fallback}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `linear-gradient(135deg, ${idToColor(playlist.id)}, var(--bg-surface))`,
        fontSize: size * 0.4,
      }}
    >
      ♪
    </div>
  );
};

export default PlaylistArt;
