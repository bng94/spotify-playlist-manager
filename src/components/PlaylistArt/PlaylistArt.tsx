import { useState } from "react";
import type { Playlist } from "../../types";

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
  const [failed, setFailed] = useState(false);
  const imageUrl = playlist.images?.[0]?.url;
  return imageUrl && !failed ? (
    <img
      src={imageUrl}
      alt={playlist.name}
      onError={() => setFailed(true)}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        objectFit: "cover",
        flexShrink: 0,
        display: "block",
      }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `linear-gradient(135deg, ${idToColor(playlist.id)}, #1a1a1a)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        flexShrink: 0,
        boxShadow: "0 1px 2px rgba(0,0,0,0.4)",
        userSelect: "none",
      }}
    >
      ♪
    </div>
  );
};

export default PlaylistArt;
