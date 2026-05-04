

## `frontend/src/api.ts`

```ts
import type { HomeResponse, PlaylistSummary, SearchResponse, Track } from './types';

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
};
```

## `frontend/src/types.ts`

```ts
export type Artist = {
  id: number;
  name: string;
  imageUrl?: string | null;
  trackCount?: number;
};

export type Album = {
  id: number;
  title: string;
  coverUrl?: string | null;
  year?: number | null;
  artist: Artist;
};

export type Track = {
  id: number;
  title: string;
  durationSeconds: number;
  audioUrl?: string | null;
  artist: Artist;
  album: Album;
};

export type PlaylistSummary = {
  id: number;
  name: string;
  description?: string | null;
  coverUrl?: string | null;
  owner: { id: number; name: string };
  tracks: Array<{
    id: number;
    title: string;
    artist: string;
    album: string;
    durationSeconds: number;
  }>;
};

export type HomeResponse = {
  featuredPlaylists: PlaylistSummary[];
  newReleases: Album[];
  topArtists: Artist[];
  trendingTracks: Track[];
};

export type SearchResponse = {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
};
```

## `frontend/src/App.tsx`

```tsx
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Loader2, Sparkles, Plus } from 'lucide-react';
import './index.css';
import { api } from './api';
import { Sidebar } from './components/Sidebar';
import { PlaylistCard } from './components/PlaylistCard';
import { AlbumCard } from './components/AlbumCard';
import { TrackRow } from './components/TrackRow';
import { ArtistCard } from './components/ArtistCard';
import { NowPlaying } from './components/NowPlaying';
import type { HomeResponse, PlaylistSummary, SearchResponse, Track } from './types';

function App() {
  const [homeData, setHomeData] = useState<HomeResponse | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Track | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [query, setQuery] = useState('');
  const [newPlaylist, setNewPlaylist] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [home, library] = await Promise.all([api.getHome(), api.getPlaylists()]);
        setHomeData(home);
        setPlaylists(library);
        setNowPlaying(home.trendingTracks[0] ?? null);
      } catch {
        setError('Unable to load data from the API. Is the backend running?');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return setSearchResults(null);

    try {
      setSearchResults(await api.search(query));
    } catch {
      setError('Search failed. Please try again.');
    }
  };

  const handleCreatePlaylist = async (event: FormEvent) => {
    event.preventDefault();
    if (!newPlaylist.name.trim()) return;

    try {
      setCreating(true);
      await api.createPlaylist(newPlaylist);
      setPlaylists(await api.getPlaylists());
      setNewPlaylist({ name: '', description: '' });
    } catch {
      setError('Could not create playlist.');
    } finally {
      setCreating(false);
    }
  };

  const heroTrack = useMemo(() => homeData?.trendingTracks[0], [homeData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark text-white">
        <Loader2 className="animate-spin" />
        <span className="ml-3">Loading your music...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <div className="flex pb-24">
        <Sidebar onCreatePlaylist={() => document.getElementById('create-playlist-form')?.scrollIntoView()} />

        <main className="flex-1 p-4 md:p-8 space-y-8">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-white/60 text-sm">11 February 2026</p>
              <h1 className="text-3xl md:text-4xl font-semibold flex items-center gap-2">
                Your daily mix <Sparkles className="text-emerald-400" size={22} />
              </h1>
              <p className="text-white/60 text-sm mt-1">
                Fresh drops, trending picks, and your saved vibes.
              </p>
            </div>

            <form onSubmit={handleSearch} className="w-full md:w-96">
              <div className="flex rounded-full bg-white/5 border border-white/10 px-4">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search songs, artists, albums"
                  className="flex-1 bg-transparent py-3 outline-none text-sm"
                />
                <button className="ml-2 px-3 py-2 text-sm rounded-full bg-emerald-500 text-black font-semibold">
                  Search
                </button>
              </div>
            </form>
          </header>

          {error && <div className="border border-red-500/40 bg-red-500/10 p-4 text-sm">{error}</div>}

          <section className="rounded-3xl border border-white/5 bg-gradient-to-r from-emerald-600/60 to-transparent p-8">
            <h2 className="text-3xl md:text-4xl font-semibold">Discover new music faster</h2>
            <p className="text-white/80 md:w-2/3 mt-3">
              Tap into curated playlists, genre-bending electronica, and glossy pop without leaving the browser.
            </p>
            <button
              onClick={() => heroTrack && setNowPlaying(heroTrack)}
              className="mt-4 px-4 py-3 rounded-full bg-black border border-white/10 font-semibold"
            >
              Play featured
            </button>
          </section>

          {homeData && (
            <>
              <section>
                <h3 className="text-xl font-semibold mb-3">Featured Playlists</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {homeData.featuredPlaylists.map((playlist) => (
                    <PlaylistCard key={playlist.id} playlist={playlist} />
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3">Trending Tracks</h3>
                <div className="rounded-2xl border border-white/5 bg-white/5 divide-y divide-white/5">
                  {homeData.trendingTracks.map((track, index) => (
                    <TrackRow key={track.id} track={track} index={index} onPlay={setNowPlaying} />
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3">New Releases</h3>
                <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
                  {homeData.newReleases.map((album) => <AlbumCard key={album.id} album={album} />)}
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3">Top Artists</h3>
                <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
                  {homeData.topArtists.map((artist) => <ArtistCard key={artist.id} artist={artist} />)}
                </div>
              </section>
            </>
          )}

          <section id="create-playlist-form">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Plus size={18} className="text-emerald-400" /> Your Library
            </h3>

            <form onSubmit={handleCreatePlaylist} className="grid md:grid-cols-3 gap-3 my-4">
              <input
                value={newPlaylist.name}
                onChange={(e) => setNewPlaylist((p) => ({ ...p, name: e.target.value }))}
                placeholder="Playlist name"
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm"
                required
              />
              <input
                value={newPlaylist.description}
                onChange={(e) => setNewPlaylist((p) => ({ ...p, description: e.target.value }))}
                placeholder="Description"
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm md:col-span-2"
              />
              <button disabled={creating} className="md:col-span-3 rounded-xl bg-emerald-500 text-black py-3 font-semibold">
                {creating ? 'Saving...' : 'Create playlist'}
              </button>
            </form>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {playlists.map((playlist) => <PlaylistCard key={playlist.id} playlist={playlist} />)}
            </div>
          </section>

          {searchResults && (
            <section>
              <h3 className="text-xl font-semibold mb-3">Search Results</h3>
              {searchResults.tracks.map((track, index) => (
                <TrackRow key={track.id} track={track} index={index} onPlay={setNowPlaying} />
              ))}
            </section>
          )}
        </main>
      </div>

      <NowPlaying track={nowPlaying} />
    </div>
  );
}

export default App;
```

## Key Components

```tsx
// TrackRow.tsx
import { Play } from 'lucide-react';
import type { Track } from '../types';

const formatDuration = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

export const TrackRow = ({ track, index, onPlay }: {
  track: Track;
  index?: number;
  onPlay?: (track: Track) => void;
}) => (
  <div className="group flex items-center gap-4 px-3 py-2 rounded-xl hover:bg-white/5">
    <div className="w-8 text-sm text-white/40">{index !== undefined ? index + 1 : null}</div>
    <button onClick={() => onPlay?.(track)} className="h-10 w-10 rounded-full bg-white/10">
      <Play size={16} />
    </button>
    <div className="flex-1 min-w-0">
      <p className="font-semibold truncate">{track.title}</p>
      <p className="text-xs text-white/60 truncate">{track.artist.name} - {track.album.title}</p>
    </div>
    <div className="text-xs text-white/50">{formatDuration(track.durationSeconds)}</div>
  </div>
);
```

```tsx
// PlaylistCard.tsx
import { Play } from 'lucide-react';
import type { PlaylistSummary } from '../types';

export const PlaylistCard = ({ playlist }: { playlist: PlaylistSummary }) => (
  <div className="group relative rounded-2xl bg-white/5 border border-white/5 p-4">
    <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-emerald-700/20">
      {playlist.coverUrl ? (
        <img src={playlist.coverUrl} alt={playlist.name} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-3xl">Music</div>
      )}
    </div>
    <p className="font-semibold">{playlist.name}</p>
    <p className="text-xs text-white/60 line-clamp-2">{playlist.description ?? 'Curated selection'}</p>
    <p className="text-[11px] text-white/50">By {playlist.owner.name}</p>
    <button className="absolute bottom-4 right-4 h-11 w-11 rounded-full bg-emerald-500 text-black">
      <Play size={18} />
    </button>
  </div>
);
```

```tsx
// NowPlaying.tsx
import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Track } from '../types';

export const NowPlaying = ({ track }: { track: Track | null }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;

    if (track?.audioUrl) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  }, [track]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => undefined);
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/70 border-t border-white/10 px-8 py-3 flex items-center gap-4">
      <audio ref={audioRef} className="hidden" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{track ? track.title : 'Nothing playing'}</p>
        <p className="text-xs text-white/60 truncate">
          {track ? `${track.artist.name} - ${track.album.title}` : 'Pick a track to start listening'}
        </p>
      </div>
      <button onClick={toggle} disabled={!track?.audioUrl} className="h-11 w-11 rounded-full bg-emerald-500 text-black">
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
      </button>
    </div>
  );
};
```
