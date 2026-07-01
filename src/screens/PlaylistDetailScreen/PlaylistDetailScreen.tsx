import { useEffect, useMemo, useRef, useState } from "react";
import type { Playlist, PlaylistItem, SpotifyTrack } from "../../types";
import {
  removePlaylistTracks,
  addTracksToPlaylist,
} from "../../lib/spotifyApi";
import {
  removeTracksFromList,
  addTrackToList,
} from "../../lib/playlistOperations";
import { useToast } from "../../contexts/ToastContext/ToastContext";
import Button from "../../components/Button/Button";
import Checkbox from "../../components/Checkbox/Checkbox";
import Icon from "../../components/Icon/Icon";
import Modal from "../../components/Modal/Modal";
import PlaylistArt from "../../components/PlaylistArt/PlaylistArt";
import TrackRow from "./TrackRow/TrackRow";
import SearchPanel from "./SearchPanel/SearchPanel";
import styles from "./PlaylistDetailScreen.module.css";

interface PlaylistDetailScreenProps {
  playlist: Playlist;
  items: PlaylistItem[];
  loadingTracks: boolean;
  onBack: () => void;
  onRename: (name: string) => void;
  onPlay: (id: string) => void;
  currentTrackId: string;
  totalTracks: number;
  hasMore: boolean;
  loadingMore: boolean;
  loadMoreError: boolean;
  onLoadMore: () => void;
}

const trackToPlaylistItem = (track: SpotifyTrack): PlaylistItem => ({
  added_at: new Date().toISOString(),
  added_by: {
    external_urls: { spotify: "" },
    href: "",
    id: "",
    type: "user",
    uri: "",
  },
  is_local: false,
  primary_color: null,
  item: track,
  video_thumbnail: { url: null },
});

function totalDuration(items: PlaylistItem[]): string {
  const totalMs = items.reduce(
    (sum, pi) => sum + (pi.item?.duration_ms ?? 0),
    0,
  );
  const totalSec = Math.floor(totalMs / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.round((totalSec % 3600) / 60);
  return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;
}

const PlaylistDetailScreen = ({
  playlist,
  items,
  loadingTracks,
  onBack,
  onRename,
  onPlay,
  currentTrackId,
  totalTracks,
  hasMore,
  loadingMore,
  loadMoreError,
  onLoadMore,
}: PlaylistDetailScreenProps) => {
  const { pushToast, pushError } = useToast();
  const [tracks, setTracks] = useState<PlaylistItem[]>(items);
  const [snapshotId, setSnapshotId] = useState(playlist.snapshot_id);

  const [selection, setSelection] = useState<Set<string>>(() => new Set());
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(playlist.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Trigger loadMore when the sentinel scrolls into view
  useEffect(() => {
    const el = bottomRef.current;
    if (!el || !hasMore || loadingMore || loadingTracks) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore();
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadingTracks, onLoadMore]);

  // Sync local track list when the parent fetches a new playlist
  useEffect(() => {
    setTracks(items);
    setSelection(new Set());
  }, [items]);

  useEffect(() => {
    setDraftName(playlist.name);
  }, [playlist.name]);
  useEffect(() => {
    setSnapshotId(playlist.snapshot_id);
  }, [playlist.id, playlist.snapshot_id]);

  const commitRename = () => {
    setEditingName(false);
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== playlist.name) onRename(trimmed);
    else setDraftName(playlist.name);
  };

  const existingIds = useMemo(
    () => new Set(tracks.map((t) => t.item?.id ?? "").filter(Boolean)),
    [tracks],
  );

  const anyChecked = selection.size > 0;
  const allChecked = selection.size > 0 && selection.size === tracks.length;
  const someChecked = selection.size > 0 && !allChecked;

  const toggleAll = () => {
    if (anyChecked) setSelection(new Set());
    else
      setSelection(
        new Set(tracks.map((t) => t.item?.id ?? "").filter(Boolean)),
      );
  };

  const toggleOne = (id: string) => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRemove = async () => {
    const ids = Array.from(selection);
    setSelection(new Set());
    const { tracks: updated, removed } = removeTracksFromList(tracks, ids);
    setTracks(updated);

    const trackUris = removed
      .map((t) => t.item?.uri)
      .filter((uri): uri is string => Boolean(uri));
    if (trackUris.length > 0) {
      const result = await removePlaylistTracks(
        playlist.id,
        trackUris,
        snapshotId,
      );
      if (result.error) {
        pushError(result.error);
      } else if (result.data) {
        setSnapshotId(result.data.snapshot_id);
      }
    }
    pushToast(
      `Removed ${removed.length} ${removed.length === 1 ? "song" : "songs"}`,
    );
  };

  const handleAddTrack = async (track: SpotifyTrack) => {
    const playlistItem = trackToPlaylistItem(track);
    const updated = addTrackToList(tracks, playlistItem);
    setTracks(updated);
    if (track.uri) {
      const result = await addTracksToPlaylist(playlist.id, [track.uri]);
      if (result.error) {
        pushError(result.error);
      } else if (result.data) {
        setSnapshotId(result.data.snapshot_id);
      }
    }
  };

  return (
    <div>
      <button type="button" onClick={onBack} className={styles.backBtn}>
        <Icon name="arrow-left" size={14} /> All playlists
      </button>

      <div className={styles.header}>
        <PlaylistArt playlist={playlist} size={160} radius={6} />
        <div className={styles.headerMeta}>
          <div className={`pm-overline-section ${styles.overlineGap}`}>
            Playlist
          </div>
          {editingName ? (
            <input
              ref={inputRef}
              className={`pm-page-title ${styles.playlistTitle} ${styles.titleInput}`}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") {
                  setDraftName(playlist.name);
                  setEditingName(false);
                }
              }}
              autoFocus
            />
          ) : (
            <h1
              className={`pm-page-title ${styles.playlistTitle}`}
              onClick={() => setEditingName(true)}
              title="Click to rename"
              style={{ cursor: "text" }}
            >
              {playlist.name}
            </h1>
          )}
          <div className={styles.trackCount}>
            {loadingTracks
              ? "Loading…"
              : `${totalTracks} ${totalTracks === 1 ? "song" : "songs"} · about ${totalDuration(tracks)}`}
          </div>
        </div>
      </div>

      <div className={styles.actionBar}>
        <Button icon={anyChecked ? "square" : "check"} onClick={toggleAll}>
          {anyChecked ? "Deselect all" : "Select all"}
        </Button>
        <Button
          variant="primary"
          icon="trash"
          disabled={selection.size === 0}
          onClick={() => setConfirmRemove(true)}
        >
          Remove selected ({selection.size})
        </Button>
        <Button
          icon="search"
          onClick={() => setSearchOpen(true)}
          style={{ marginLeft: "auto" }}
        >
          Add songs
        </Button>
      </div>

      {!loadingTracks && tracks.length === 0 ? (
        <div className={styles.emptyTracks}>
          No songs yet.{" "}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className={styles.addSomeBtn}
          >
            Add some.
          </button>
        </div>
      ) : (
        <>
          <div className={styles.tableHeader}>
            <Checkbox
              checked={allChecked}
              indeterminate={someChecked}
              onChange={() => toggleAll()}
              label="Select all"
            />
            <div className={styles.colCenter}>#</div>
            <div>Title</div>
            <div>Album</div>
            <div>Date added</div>
            <div className={styles.colRight}>Duration</div>
            <div />
          </div>

          {loadingTracks ? (
            <div className={styles.skeletonList}>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={styles.skeletonRow} />
              ))}
            </div>
          ) : (
            <div className={styles.trackList}>
              {tracks.map((track, i) => (
                <TrackRow
                  key={i}
                  track={track}
                  index={i}
                  selected={selection.has(track.item?.id ?? "")}
                  isCurrent={track.item?.id === currentTrackId}
                  onSelect={toggleOne}
                  onPlay={onPlay}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Infinite-scroll sentinel — IntersectionObserver fires onLoadMore when this enters view */}
      <div ref={bottomRef} />
      {loadingMore && (
        <div className={styles.loadMoreIndicator}>Loading more songs…</div>
      )}
      {loadMoreError && !loadingMore && (
        <div className={styles.loadMoreError}>
          <span className={styles.loadMoreErrorText}>
            Failed to fetch next tracks
          </span>
          <Button onClick={onLoadMore}>Try again</Button>
        </div>
      )}

      <SearchPanel
        open={searchOpen}
        playlistName={playlist.name}
        existingIds={existingIds}
        onAdd={handleAddTrack}
        onClose={() => setSearchOpen(false)}
      />

      {confirmRemove && (
        <Modal
          title={`Remove ${selection.size} ${selection.size === 1 ? "song" : "songs"}?`}
          onClose={() => setConfirmRemove(false)}
          actions={
            <>
              <Button onClick={() => setConfirmRemove(false)}>Cancel</Button>
              <Button
                variant="danger"
                icon="trash"
                onClick={() => {
                  setConfirmRemove(false);
                  handleRemove();
                }}
              >
                Remove
              </Button>
            </>
          }
        >
          <p>
            {selection.size === 1 ? "This song" : "These songs"} will be removed
            from <strong>"{playlist.name}"</strong>. You'll have to search and
            re-add {selection.size === 1 ? "it" : "them"} manually if you change
            your mind.
          </p>
        </Modal>
      )}
    </div>
  );
};

export default PlaylistDetailScreen;
