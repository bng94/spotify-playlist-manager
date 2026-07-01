import { useState } from "react";
import type { Playlist } from "../../types";
import Button from "../../components/Button/Button";
import Modal from "../../components/Modal/Modal";
import PlaylistCard from "./PlaylistCard/PlaylistCard";
import styles from "./PlaylistsScreen.module.css";

const SKELETON_WIDTHS: [string, string][] = [
  ["60%", "35%"],
  ["45%", "28%"],
  ["70%", "40%"],
  ["50%", "30%"],
  ["55%", "25%"],
];

const SkeletonRow = ({
  nameWidth,
  subWidth,
}: {
  nameWidth: string;
  subWidth: string;
}) => {
  return (
    <div className={styles.skeletonRow}>
      <div className={`pm-skeleton ${styles.skeletonArt}`} />
      <div className={styles.skeletonMeta}>
        <div
          className={`pm-skeleton ${styles.skeletonName}`}
          style={{ width: nameWidth }}
        />
        <div
          className={`pm-skeleton ${styles.skeletonSub}`}
          style={{ width: subWidth }}
        />
      </div>
    </div>
  );
};

interface PlaylistsScreenProps {
  loading: boolean;
  playlists: Playlist[];
  total: number;
  offset: number;
  onOpen: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
}

const PlaylistsScreen = ({
  loading,
  playlists,
  total,
  offset,
  onOpen,
  onCreate,
  onDelete,
  onNextPage,
  onPrevPage,
}: PlaylistsScreenProps) => {
  const [pendingDelete, setPendingDelete] = useState<Playlist | null>(null);
  const hasPrev = offset > 0;
  const hasNext = offset + playlists.length < total;
  const showPagination = total > playlists.length || offset > 0;

  return (
    <div>
      <header className={styles.header}>
        <div>
          <div className={`pm-overline-section ${styles.overlineGap}`}>
            Library
          </div>
          <h1 className={`pm-page-title ${styles.pageTitle}`}>
            Your playlists
          </h1>
          {!loading && (
            <div className={styles.count}>
              {showPagination
                ? `${offset + 1}–${offset + playlists.length} of ${total} playlists`
                : `${playlists.length} ${playlists.length === 1 ? "playlist" : "playlists"}`}
            </div>
          )}
        </div>
        <Button
          variant="primary"
          icon="plus"
          onClick={onCreate}
          disabled={loading}
        >
          New playlist
        </Button>
      </header>

      {loading ? (
        <div className={`pm-surface-card ${styles.list}`}>
          {SKELETON_WIDTHS.map(([nameWidth, subWidth], i) => (
            <SkeletonRow key={i} nameWidth={nameWidth} subWidth={subWidth} />
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <div className={`pm-surface-card ${styles.empty}`}>
          <div className={styles.emptyTitle}>No playlists.</div>
          <div className={styles.emptyHint}>Create one to get started.</div>
        </div>
      ) : (
        <div className={`pm-surface-card ${styles.list}`}>
          {playlists.map((p) => (
            <PlaylistCard
              key={p.id}
              playlist={p}
              onOpen={onOpen}
              onDelete={(id) =>
                setPendingDelete(playlists.find((pl) => pl.id === id) ?? null)
              }
            />
          ))}
        </div>
      )}

      {showPagination && !loading && (
        <div className={styles.pagination}>
          <Button icon="arrow-left" onClick={onPrevPage} disabled={!hasPrev}>
            Previous
          </Button>
          <Button icon="arrow-right" onClick={onNextPage} disabled={!hasNext}>
            Next
          </Button>
        </div>
      )}

      {pendingDelete && (
        <Modal
          title="Delete playlist"
          onClose={() => setPendingDelete(null)}
          actions={
            <>
              <Button onClick={() => setPendingDelete(null)}>Cancel</Button>
              <Button
                variant="danger"
                icon="trash"
                onClick={() => {
                  onDelete(pendingDelete.id);
                  setPendingDelete(null);
                }}
              >
                Delete
              </Button>
            </>
          }
        >
          <p>
            Are you sure you want to delete{" "}
            <strong>"{pendingDelete.name}"</strong>? You can recover it within
            90 days at{" "}
            <a
              href="https://www.spotify.com/us/account/recover-playlists/"
              target="_blank"
              rel="noreferrer"
            >
              spotify.com/account/recover-playlists
            </a>
            .
          </p>
        </Modal>
      )}
    </div>
  );
};

export default PlaylistsScreen;
