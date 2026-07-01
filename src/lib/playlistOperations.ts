import type { Playlist, PlaylistItem } from "../types";

export const formatDuration = (ms: number): string => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
};

export const removePlaylist = (playlists: Playlist[], id: string): Playlist[] =>
  playlists.filter((p) => p.id !== id);

export const removeTracksFromList = (
  items: PlaylistItem[],
  trackIds: string[],
): { tracks: PlaylistItem[]; removed: PlaylistItem[] } => {
  const removed = items.filter((t) => trackIds.includes(t.item?.id ?? ""));
  return { tracks: items.filter((t) => !trackIds.includes(t.item?.id ?? "")), removed };
};

export const addTrackToList = (items: PlaylistItem[], item: PlaylistItem): PlaylistItem[] => {
  if (items.find((t) => t.item?.id === item.item?.id)) return items;
  return [...items, item];
};

