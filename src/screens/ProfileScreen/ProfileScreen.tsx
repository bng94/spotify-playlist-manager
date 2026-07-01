import { useCallback, useEffect, useState } from "react";
import Button from "../../components/Button/Button";
import PageHeader from "../../components/PageHeader/PageHeader";
import UserAvatar from "../../components/UserAvatar/UserAvatar";
import { useUser } from "../../contexts/UserContext/UserContext";
import {
  getTopArtists,
  getTopTracks,
  spotifyFetch,
} from "../../lib/spotifyApi";
import type { TopArtist, SpotifyTrack } from "../../types";
import TopItemsModal from "./TopItemsModal";
import styles from "./ProfileScreen.module.css";

interface ProfileScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

const Stat = ({
  value,
  label,
}: {
  value: string | number | null;
  label: string;
}) => (
  <div className={styles.stat}>
    <span className={styles.statValue}>{value ?? "—"}</span>
    <span className={styles.statLabel}>{label}</span>
  </div>
);

const ProfileScreen = ({ onBack, onLogout }: ProfileScreenProps) => {
  const { user } = useUser();
  const avatarUrl = user?.images?.[0]?.url;

  const [topArtists, setTopArtists] = useState<TopArtist[]>([]);
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [loadingTopItems, setLoadingTopItems] = useState(true);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [playlistsCount, setPlaylistsCount] = useState<number | null>(null);

  const [showArtistsModal, setShowArtistsModal] = useState(false);
  const [showTracksModal, setShowTracksModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingTopItems(true);
      const [artistsRes, tracksRes, followingRes, playlistsRes] =
        await Promise.all([
          getTopArtists("long_term", 3),
          getTopTracks("long_term", 3),
          spotifyFetch<{ artists: { total: number } }>(
            "/me/following?type=artist&limit=1",
          ),
          spotifyFetch<{ total: number }>("/me/playlists?limit=1"),
        ]);
      if (!cancelled) {
        setTopArtists(artistsRes.data?.items ?? []);
        setTopTracks(tracksRes.data?.items ?? []);
        setFollowingCount(followingRes.data?.artists.total ?? null);
        setPlaylistsCount(playlistsRes.data?.total ?? null);
        setLoadingTopItems(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCloseArtists = useCallback(() => setShowArtistsModal(false), []);
  const handleCloseTracks = useCallback(() => setShowTracksModal(false), []);

  const plan = user?.product
    ? user.product.charAt(0).toUpperCase() + user.product.slice(1)
    : null;

  return (
    <>
      <div>
        <PageHeader overline="Account" title="Profile" />

        <div className={`pm-surface-card ${styles.avatarCard}`}>
          <div className={`app-nav__avatar ${styles.avatar}`}>
            <UserAvatar imageUrl={avatarUrl} displayName={user?.display_name} />
          </div>
          <div className={styles.info}>
            <div className={`${styles.displayName} pm-truncate`}>
              {user?.display_name ?? "—"}
            </div>
            <div className={`${styles.email} pm-truncate`}>
              {user?.email ?? "—"}
            </div>
          </div>
        </div>

        <div className={`pm-surface-card ${styles.statsCard}`}>
          <Stat value={plan} label="Plan" />
          <Stat value={playlistsCount} label="Playlists" />
          <Stat value={user?.followers?.total ?? null} label="Followers" />
          <Stat value={followingCount} label="Following" />
        </div>

        <div className={styles.topSection}>
          <div className={`pm-overline-section ${styles.topSectionLabel}`}>
            Top Picks · All Time
          </div>

          <div className={styles.topColumns}>
            <div className={`pm-surface-card ${styles.topColumn}`}>
              <div className={styles.topColumnHead}>
                <span className={styles.topColumnLabel}>Artists</span>
                <Button
                  variant="secondary"
                  pill
                  disabled={loadingTopItems}
                  onClick={() => setShowArtistsModal(true)}
                >
                  See More
                </Button>
              </div>

              {loadingTopItems ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={`${styles.topSkeletonRow} pm-skeleton`}
                  />
                ))
              ) : topArtists.length === 0 ? (
                <p className={styles.topEmpty}>Not enough data yet</p>
              ) : (
                topArtists.slice(0, 3).map((a, i) => {
                  const img = a.images.at(-1)?.url;
                  return (
                    <div key={a.id} className={styles.topItem}>
                      <span className={styles.topRank}>{i + 1}</span>
                      {img ? (
                        <img
                          className={`${styles.topImg} ${styles.topImgCircle}`}
                          src={img}
                          alt={a.name}
                        />
                      ) : (
                        <div
                          className={`${styles.topImg} ${styles.topImgCircle} ${styles.topImgFallback}`}
                        />
                      )}
                      <span className={`${styles.topName} pm-truncate`}>
                        {a.name}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className={`pm-surface-card ${styles.topColumn}`}>
              <div className={styles.topColumnHead}>
                <span className={styles.topColumnLabel}>Tracks</span>
                <Button
                  variant="secondary"
                  pill
                  disabled={loadingTopItems}
                  onClick={() => setShowTracksModal(true)}
                >
                  See More
                </Button>
              </div>

              {loadingTopItems ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={`${styles.topSkeletonRow} pm-skeleton`}
                  />
                ))
              ) : topTracks.length === 0 ? (
                <p className={styles.topEmpty}>Not enough data yet</p>
              ) : (
                topTracks.slice(0, 3).map((t, i) => {
                  const img = t.album.images.at(-1)?.url;
                  return (
                    <div key={t.id} className={styles.topItem}>
                      <span className={styles.topRank}>{i + 1}</span>
                      {img ? (
                        <img
                          className={`${styles.topImg} ${styles.topImgSquare}`}
                          src={img}
                          alt={t.name}
                        />
                      ) : (
                        <div
                          className={`${styles.topImg} ${styles.topImgSquare} ${styles.topImgFallback}`}
                        />
                      )}
                      <div className={styles.topTrackInfo}>
                        <span className={`${styles.topName} pm-truncate`}>
                          {t.name}
                        </span>
                        <span className={`${styles.topSub} pm-truncate`}>
                          {t.artists[0]?.name}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <Button onClick={onBack}>Back to playlists</Button>
          <Button variant="ghost" icon="logout" onClick={onLogout}>
            Log out
          </Button>
        </div>
      </div>

      {showArtistsModal && (
        <TopItemsModal type="artists" onClose={handleCloseArtists} />
      )}
      {showTracksModal && (
        <TopItemsModal type="tracks" onClose={handleCloseTracks} />
      )}
    </>
  );
};

export default ProfileScreen;
