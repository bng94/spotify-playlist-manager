export interface SpotifyUser {
  account_id: string;
  country: string;
  display_name: string;
  email: string;
  explicit_content: {
    filter_enabled: boolean;
    filter_locked: boolean;
  };
  external_urls: {
    spotify: string;
  };
  followers: {
    href: string | null;
    total: number;
  };
  href: string;
  id: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  product: string;
  type: string;
  uri: string;
}

export interface PlaylistOwner {
  external_urls: { spotify: string };
  href: string;
  id: string;
  type: string;
  uri: string;
  display_name: string;
}

export interface Playlist {
  collaborative: boolean;
  description: string;
  external_urls: { spotify: string };
  href: string;
  id: string;
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }> | null;
  name: string;
  owner: PlaylistOwner;
  public: boolean;
  snapshot_id: string;
  tracks?: PlaylistTracksPage | null;
  type: string;
  uri: string;
}

export interface SpotifyExternalUrls {
  spotify: string;
}

export interface SpotifyArtist {
  external_urls: SpotifyExternalUrls;
  href: string;
  id: string;
  name: string;
  type: string;
  uri: string;
}

export interface SpotifyImage {
  url: string;
  width: number;
  height: number;
}

export interface SpotifyAlbum {
  is_playable: boolean;
  type: string;
  album_type: string;
  href: string;
  id: string;
  images: SpotifyImage[];
  name: string;
  release_date: string;
  release_date_precision: string;
  uri: string;
  artists: SpotifyArtist[];
  external_urls: SpotifyExternalUrls;
  total_tracks: number;
}

export interface SpotifyTrack {
  is_playable: boolean;
  explicit: boolean;
  type: string;
  episode: boolean;
  track: boolean;
  album: SpotifyAlbum;
  artists: SpotifyArtist[];
  disc_number: number;
  track_number: number;
  duration_ms: number;
  external_ids: { isrc?: string };
  external_urls: SpotifyExternalUrls;
  href: string;
  id: string;
  name: string;
  uri: string;
  is_local: boolean;
}

export interface SpotifyAddedBy {
  external_urls: SpotifyExternalUrls;
  href: string;
  id: string;
  type: string;
  uri: string;
}

export interface PlaylistItem {
  added_at: string;
  added_by: SpotifyAddedBy;
  is_local: boolean;
  primary_color: string | null;
  item: SpotifyTrack | null;
  video_thumbnail: { url: string | null };
}

export interface PlaylistTracksPage {
  href: string;
  total: number;
  limit?: number;
  next: string | null;
  previous: string | null;
  offset?: number;
  items?: PlaylistItem[];
}

export interface TopArtist {
  id: string;
  name: string;
  images: SpotifyImage[];
  external_urls: SpotifyExternalUrls;
  uri: string;
  type: "artist";
  genres: string[];
  popularity: number;
}

export interface SpotifyPlaylistsPage {
  href: string;
  limit: number;
  next: string | null;
  previous: string | null;
  offset: number;
  total: number;
  items: Playlist[];
}

