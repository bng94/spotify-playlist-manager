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
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
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
  onPlay: (index: number) => void;
  currentTrackId: string;
  currentIndex: number | undefined;
  isPaused: boolean;
  totalTracks: number;
  hasMore: boolean;
  loadingMore: boolean;
  loadMoreError: boolean;
  onLoadMore: () => void;
  tracksForbidden: boolean;
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

const PlaylistDetailScreen = ({
  playlist,
  items,
  loadingTracks,
  onBack,
  onRename,
  onPlay,
  currentTrackId,
  currentIndex,
  isPaused,
  totalTracks,
  hasMore,
  loadingMore,
  loadMoreError,
  onLoadMore,
  tracksForbidden,
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

  const totalTrack =
    totalTracks === 0 ? (playlist.items?.total ?? 0) : totalTracks;

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

  // App.tsx's nowPlayingTracks (used to build play requests) only contains
  // tracks with a playable item, so a row's onPlay index must be its
  // position in that filtered list, not its raw position in `tracks` —
  // otherwise any null-item track (local/unavailable) before it would
  // shift every index after it out of sync with what actually gets played.
  const playableIndexes = useMemo(() => {
    let next = 0;
    return tracks.map((t) => (t.item ? next++ : -1));
  }, [tracks]);

  const anyChecked = selection.size > 0;
  const allChecked = selection.size > 0 && selection.size === tracks.length;
  const someChecked = selection.size > 0 && !allChecked;

  const toggleAll = () => {
    if (tracks.length === 0) {
      setSelection(new Set());
      return;
    }
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
              : `${totalTrack} ${totalTrack === 1 ? "song" : "songs"}`}
          </div>
        </div>
        {!tracksForbidden && playlist.external_urls.spotify && (
          <a
            href={playlist.external_urls.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className={`pm-btn pm-btn--primary pm-btn--pill ${styles.headerSpotifyBtn}`}
            aria-label={`Open ${playlist.name} on Spotify`}
          >
            Open playlist on Spotify
          </a>
        )}
      </div>

      {tracksForbidden ? (
        <div className={styles.forbiddenState}>
          <p className={styles.forbiddenText}>
            Spotify won't let this app read the songs in{" "}
            <strong>"{playlist.name}"</strong> since it belongs to another user.
            You can still view it directly on Spotify.
          </p>
          <a
            href={playlist.external_urls.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className={`pm-btn pm-btn--primary pm-btn--pill ${styles.forbiddenBtn}`}
          >
            Open on Spotify
          </a>
        </div>
      ) : (
        <>
          <div className={styles.actionBar}>
            <Button
              icon={anyChecked ? "square" : "check"}
              onClick={toggleAll}
              disabled={tracks.length === 0}
            >
              {anyChecked ? "Deselect all" : "Select all"}
            </Button>
            {selection.size !== 0 && (
              <Button
                variant="danger"
                icon="trash"
                onClick={() => setConfirmRemove(true)}
              >
                Remove selected ({selection.size})
              </Button>
            )}
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
                      index={playableIndexes[i]}
                      selected={selection.has(track.item?.id ?? "")}
                      isCurrent={
                        currentIndex !== undefined
                          ? playableIndexes[i] === currentIndex
                          : track.item?.id === currentTrackId
                      }
                      isPaused={isPaused}
                      onSelect={toggleOne}
                      onPlay={onPlay}
                    />
                  ))}
                </div>
              )}
            </>
          )}

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
        </>
      )}

      {confirmRemove && (
        <ConfirmModal
          title={`Remove ${selection.size} ${selection.size === 1 ? "song" : "songs"}?`}
          confirmLabel="Remove"
          onCancel={() => setConfirmRemove(false)}
          onConfirm={() => {
            setConfirmRemove(false);
            handleRemove();
          }}
          message={
            <>
              {selection.size === 1 ? "This song" : "These songs"} will be
              removed from <strong>"{playlist.name}"</strong>. You'll have to
              search and re-add {selection.size === 1 ? "it" : "them"} manually
              if you change your mind.
            </>
          }
        />
      )}
    </div>
  );
};

export default PlaylistDetailScreen;
