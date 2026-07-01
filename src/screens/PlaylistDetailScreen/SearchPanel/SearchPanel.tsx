import { useEffect, useState } from "react";
import type { SpotifyTrack } from "../../../types";
import { searchTracks } from "../../../lib/spotifyApi";
import { useToast } from "../../../contexts/ToastContext/ToastContext";
import IconButton from "../../../components/IconButton/IconButton";
import styles from "./SearchPanel.module.css";

interface SearchPanelProps {
  open: boolean;
  playlistName: string;
  existingIds: Set<string>;
  onAdd: (track: SpotifyTrack) => void;
  onClose: () => void;
}

const SearchPanel = ({
  open,
  playlistName,
  existingIds,
  onAdd,
  onClose,
}: SearchPanelProps) => {
  const { pushError } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [addedThisSession, setAddedThisSession] = useState(new Set<string>());

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoadingResults(true);
      const result = await searchTracks(query);
      if (cancelled) return;
      setLoadingResults(false);
      if (result.data) setResults(result.data);
      else if (result.error) pushError(result.error);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, pushError]);

  // Reset state when panel closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setAddedThisSession(new Set());
    }
  }, [open]);

  const handleAdd = (track: SpotifyTrack) => {
    setAddedThisSession((prev) => new Set(prev).add(track.id));
    onAdd(track);
  };

  if (!open) return null;

  return (
    <>
      <div className={styles.scrim} onClick={onClose} />

      <aside className={styles.panel}>
        <header className={styles.panelHeader}>
          <div className={styles.panelTitle}>Add songs to {playlistName}</div>
          <IconButton
            icon="x"
            size={16}
            label="Close search"
            onClick={onClose}
          />
        </header>

        <div className={styles.searchBar}>
          <input
            autoFocus
            type="text"
            className="pm-input"
            placeholder="Search Spotify catalog…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>

        <div className="pm-overline-section" style={{ padding: "0 18px" }}>
          {loadingResults
            ? "Searching…"
            : query.trim()
              ? `${results.length} ${results.length === 1 ? "result" : "results"}`
              : "Type to search"}
        </div>

        <div className={styles.results}>
          {!loadingResults && query.trim() && results.length === 0 ? (
            <div className={styles.noResults}>
              No matches. Try a different search.
            </div>
          ) : (
            results.map((track) => {
              const already =
                existingIds.has(track.id) || addedThisSession.has(track.id);
              return (
                <div key={track.id} className={styles.resultItem}>
                  {track.album.images[0]?.url ? (
                    <img
                      src={track.album.images[0].url}
                      alt=""
                      className={styles.resultArt}
                    />
                  ) : (
                    <div className={styles.resultArtPlaceholder} />
                  )}
                  <div className={styles.resultMeta}>
                    <div className={`${styles.resultTitle} pm-truncate`}>
                      {track.name}
                    </div>
                    <div className={`${styles.resultArtist} pm-truncate`}>
                      {track.artists.map((a) => a.name).join(", ")}
                    </div>
                  </div>
                  {already ? (
                    <span className={styles.addedLabel}>Added</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAdd(track)}
                      className={styles.addBtn}
                    >
                      + Add
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};

export default SearchPanel;
