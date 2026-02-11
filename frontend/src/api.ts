import type { Album, HomeResponse, PlaylistSummary, SearchResponse, Track } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
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
