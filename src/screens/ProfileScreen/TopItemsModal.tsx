import { useEffect, useRef, useState } from "react";
import { getTopArtists, getTopTracks } from "../../lib/spotifyApi";
import type { TimeRange } from "../../lib/spotifyApi";
import type { TopArtist, SpotifyTrack } from "../../types";
import Icon from "../../components/Icon/Icon";
import styles from "./TopItemsModal.module.css";

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: "long_term", label: "All Time" },
  { key: "medium_term", label: "Last 6 Months" },
  { key: "short_term", label: "Last Month" },
];

type TabState = {
  items: (TopArtist | SpotifyTrack)[];
  loading: boolean;
};

type TabCache = Record<TimeRange, TabState>;

interface TopItemsModalProps {
  type: "artists" | "tracks";
  onClose: () => void;
}

const emptyTab = (): TabState => ({ items: [], loading: false });

const initialCache = (): TabCache => ({
  long_term: emptyTab(),
  medium_term: emptyTab(),
  short_term: emptyTab(),
});

const ArtistRow = ({ item, rank }: { item: TopArtist; rank: number }) => {
  const img = item.images.at(-1)?.url;
  return (
    <div className={styles.item}>
      <span className={styles.rank}>{rank}</span>
      {img ? (
        <img
          className={`${styles.img} ${styles.imgCircle}`}
          src={img}
          alt={item.name}
        />
      ) : (
        <div
          className={`${styles.img} ${styles.imgCircle} ${styles.imgFallback}`}
        />
      )}
      <span className={`${styles.name} pm-truncate`}>{item.name}</span>
      <a
        href={item.external_urls.spotify}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.openBtn}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Open ${item.name} on Spotify`}
      >
        Open on Spotify
      </a>
    </div>
  );
};

const TrackRow = ({ item, rank }: { item: SpotifyTrack; rank: number }) => {
  const img = item.album.images.at(-1)?.url;
  return (
    <div className={styles.item}>
      <span className={styles.rank}>{rank}</span>
      {img ? (
        <img
          className={`${styles.img} ${styles.imgSquare}`}
          src={img}
          alt={item.name}
        />
      ) : (
        <div
          className={`${styles.img} ${styles.imgSquare} ${styles.imgFallback}`}
        />
      )}
      <div className={styles.info}>
        <div className={`${styles.name} pm-truncate`}>{item.name}</div>
        <div className={`${styles.sub} pm-truncate`}>
          {item.artists[0]?.name} · {item.album.name}
        </div>
      </div>
      <a
        href={item.uri}
        className={styles.openBtn}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Play ${item.name} on Spotify`}
      >
        Play on Spotify
      </a>
    </div>
  );
};

function TopItemsModal({ type, onClose }: TopItemsModalProps) {
  const [activeTab, setActiveTab] = useState<TimeRange>("long_term");
  const [cache, setCache] = useState<TabCache>(initialCache);

  const fetchedRef = useRef<Set<TimeRange>>(new Set());

  useEffect(() => {
    if (fetchedRef.current.has(activeTab)) return;
    fetchedRef.current.add(activeTab);
    let cancelled = false;
    setCache((prev) => ({ ...prev, [activeTab]: { items: [], loading: true } }));
    (async () => {
      const res = type === "artists"
        ? await getTopArtists(activeTab, 10)
        : await getTopTracks(activeTab, 10);
      if (cancelled) return;
      setCache((prev) => ({
        ...prev,
        [activeTab]: { items: res.data?.items ?? [], loading: false },
      }));
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, type]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const current = cache[activeTab];
  const title = type === "artists" ? "Top 10 Artists" : "Top 10 Tracks";

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.box} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className={styles.tabs}>
          {TIME_RANGES.map(({ key, label }) => (
            <button
              key={key}
              className={`${styles.tab} ${activeTab === key ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.body}>
          {current.loading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={`${styles.skeletonRow} pm-skeleton`} />
            ))
          ) : current.items.length === 0 ? (
            <p className={styles.empty}>
              No listening data for this period yet.
            </p>
          ) : (
            <>
              {type === "artists"
                ? (current.items as TopArtist[]).map((a, i) => (
                    <ArtistRow key={a.id} item={a} rank={i + 1} />
                  ))
                : (current.items as SpotifyTrack[]).map((t, i) => (
                    <TrackRow key={t.id} item={t} rank={i + 1} />
                  ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TopItemsModal;
