import type { Album, HomeResponse, PlaylistSummary, SearchResponse, Track } from './types';

const base = '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getHome: () => request<HomeResponse>('/api/home'),
  getTracks: (limit = 30) => request<Track[]>(`/api/tracks?limit=${limit}`),
  getPlaylists: () => request<PlaylistSummary[]>('/api/playlists'),
  search: (q: string) => request<SearchResponse>(`/api/search?q=${encodeURIComponent(q)}`),
  createPlaylist: (payload: { name: string; description?: string; coverUrl?: string }) =>
    request<PlaylistSummary>('/api/playlists', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  addTrackToPlaylist: (playlistId: number, trackId: number) =>
    request(`/api/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ trackId }),
    }),
};

export type { Album, PlaylistSummary, Track };
