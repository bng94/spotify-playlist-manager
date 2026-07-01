import { useState } from "react";
import type { Playlist } from "../../types";
import Button from "../../components/Button/Button";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import PageHeader from "../../components/PageHeader/PageHeader";
import PlaylistCard from "./PlaylistCard/PlaylistCard";
import styles from "./PlaylistsScreen.module.css";

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
      <PageHeader
        overline="Library"
        title="Your playlists"
        action={
          <Button
            variant="primary"
            icon="plus"
            onClick={onCreate}
            disabled={loading}
          >
            New playlist
          </Button>
        }
      >
        {!loading && (
          <div className={styles.count}>
            {showPagination
              ? `${offset + 1}–${offset + playlists.length} of ${total} playlists`
              : `${playlists.length} ${playlists.length === 1 ? "playlist" : "playlists"}`}
          </div>
        )}
      </PageHeader>

      {loading ? (
        <div className={`pm-surface-card ${styles.list}`}>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className={`${styles.skeletonRow} pm-skeleton`} />
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
              onDelete={() => setPendingDelete(p)}
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
        <ConfirmModal
          title="Delete playlist"
          confirmLabel="Delete"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            onDelete(pendingDelete.id);
            setPendingDelete(null);
          }}
          message={
            <>
              Are you sure you want to delete{" "}
              <strong>"{pendingDelete.name}"</strong>? You can recover it
              within 90 days at{" "}
              <a
                href="https://www.spotify.com/us/account/recover-playlists/"
                target="_blank"
                rel="noreferrer"
              >
                spotify.com/account/recover-playlists
              </a>
              .
            </>
          }
        />
      )}
    </div>
  );
};

export default PlaylistsScreen;
