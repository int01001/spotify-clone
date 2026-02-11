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
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [query, setQuery] = useState('');
  const [newPlaylist, setNewPlaylist] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [home, lib] = await Promise.all([api.getHome(), api.getPlaylists()]);
        setHomeData(home);
        setPlaylists(lib);
        setNowPlaying(home.trendingTracks[0] ?? null);
      } catch (err) {
        setError('Unable to load data from the API. Is the backend running?');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const results = await api.search(query);
      setSearchResults(results);
    } catch (err) {
      setError('Search failed. Please try again.');
    }
  };

  const handleCreatePlaylist = async (event: FormEvent) => {
    event.preventDefault();
    if (!newPlaylist.name.trim()) return;
    try {
      setCreating(true);
      await api.createPlaylist({
        name: newPlaylist.name,
        description: newPlaylist.description,
      });
      const updated = await api.getPlaylists();
      setPlaylists(updated);
      setNewPlaylist({ name: '', description: '' });
    } catch (err) {
      setError('Could not create playlist.');
    } finally {
      setCreating(false);
    }
  };

  const heroTrack = useMemo(() => homeData?.trendingTracks[0], [homeData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark text-white">
        <div className="flex items-center gap-3 text-lg">
          <Loader2 className="animate-spin" />
          Loading your music...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <div className="flex lg:pr-0 pb-24">
        <Sidebar onCreatePlaylist={() => document.getElementById('create-playlist-form')?.scrollIntoView({ behavior: 'smooth' })} />
        <main className="flex-1 p-4 md:p-8 space-y-8">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-white/60 text-sm">11 February 2026</p>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl md:text-4xl font-semibold">Your daily mix</h1>
                <Sparkles className="text-emerald-400" size={22} />
              </div>
              <p className="text-white/60 text-sm mt-1">Fresh drops, trending picks, and your saved vibes.</p>
            </div>
            <form onSubmit={handleSearch} className="w-full md:w-96">
              <div className="flex items-center rounded-full bg-white/5 border border-white/10 px-4">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search songs, artists, albums"
                  className="flex-1 bg-transparent py-3 outline-none text-sm"
                />
                <button
                  type="submit"
                  className="ml-2 px-3 py-2 text-sm rounded-full bg-emerald-500 text-black font-semibold"
                >
                  Search
                </button>
              </div>
            </form>
          </header>

          {error ? (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-r from-emerald-600/60 via-emerald-500/20 to-transparent p-8 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1 space-y-3">
              <p className="text-sm uppercase tracking-[0.25em] text-white/70">Listen now</p>
              <h2 className="text-3xl md:text-4xl font-semibold">Discover new music faster</h2>
              <p className="text-white/80 md:w-2/3">
                Tap into curated playlists, genre-bending electronica, and glossy pop without leaving the browser.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => heroTrack && setNowPlaying(heroTrack)}
                  className="px-4 py-3 rounded-full bg-black text-white font-semibold border border-white/10 hover:border-emerald-400/60 shadow-glow-green"
                >
                  Play featured
                </button>
                {heroTrack ? (
                  <div className="text-sm text-white/70">
                    Up next: <span className="font-semibold text-white">{heroTrack.title}</span> by{' '}
                    {heroTrack.artist.name}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="hidden md:block h-40 w-px bg-gradient-to-b from-transparent via-white/40 to-transparent" />
            <div className="md:w-64 space-y-2 bg-black/20 border border-white/10 p-4 rounded-2xl">
              <p className="text-sm text-white/70">Live stats</p>
              <div className="flex justify-between text-sm">
                <span>Playlists</span>
                <span className="font-semibold">{homeData?.featuredPlaylists.length ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>New releases</span>
                <span className="font-semibold">{homeData?.newReleases.length ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Artists</span>
                <span className="font-semibold">{homeData?.topArtists.length ?? 0}</span>
              </div>
            </div>
          </section>

          {homeData ? (
            <>
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Featured Playlists</h3>
                  <span className="text-xs text-white/50">Auto-synced from the API</span>
                </div>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {homeData.featuredPlaylists.map((playlist) => (
                    <PlaylistCard key={playlist.id} playlist={playlist} />
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Trending Tracks</h3>
                  <span className="text-xs text-white/50">Updated from your database seed</span>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 divide-y divide-white/5">
                  {homeData.trendingTracks.map((track, idx) => (
                    <TrackRow key={track.id} track={track} index={idx} onPlay={setNowPlaying} />
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">New Releases</h3>
                  <span className="text-xs text-white/50">Fresh albums</span>
                </div>
                <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
                  {homeData.newReleases.map((album) => (
                    <AlbumCard key={album.id} album={album} />
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Top Artists</h3>
                  <span className="text-xs text-white/50">Based on track counts</span>
                </div>
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {homeData.topArtists.map((artist) => (
                    <ArtistCard key={artist.id} artist={artist} />
                  ))}
                </div>
              </section>
            </>
          ) : null}

          <section className="space-y-4" id="create-playlist-form">
            <div className="flex items-center gap-2">
              <Plus size={18} className="text-emerald-400" />
              <h3 className="text-xl font-semibold">Your Library</h3>
            </div>
            <form onSubmit={handleCreatePlaylist} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={newPlaylist.name}
                onChange={(e) => setNewPlaylist((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Playlist name"
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm"
                required
              />
              <input
                value={newPlaylist.description}
                onChange={(e) => setNewPlaylist((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Description (optional)"
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm md:col-span-2"
              />
              <button
                type="submit"
                disabled={creating}
                className="md:col-span-3 px-4 py-3 rounded-xl bg-emerald-500 text-black font-semibold hover:shadow-glow-green disabled:opacity-50"
              >
                {creating ? 'Saving...' : 'Create playlist'}
              </button>
            </form>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {playlists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </div>
          </section>

          {searchResults ? (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Search Results</h3>
                <button className="text-xs text-white/50" onClick={() => setSearchResults(null)}>
                  Clear
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2 rounded-2xl border border-white/5 bg-white/5 divide-y divide-white/5">
                  {searchResults.tracks.length ? (
                    searchResults.tracks.map((track, idx) => (
                      <TrackRow key={track.id} track={track} index={idx} onPlay={setNowPlaying} />
                    ))
                  ) : (
                    <p className="p-4 text-sm text-white/60">No tracks found.</p>
                  )}
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-white/70">Artists</p>
                  <div className="grid grid-cols-2 gap-3">
                    {searchResults.artists.length ? (
                      searchResults.artists.map((artist) => <ArtistCard key={artist.id} artist={artist} />)
                    ) : (
                      <p className="text-sm text-white/60">No artists yet.</p>
                    )}
                  </div>
                  <p className="text-sm text-white/70 pt-2">Albums</p>
                  <div className="grid grid-cols-2 gap-3">
                    {searchResults.albums.length ? (
                      searchResults.albums.map((album) => <AlbumCard key={album.id} album={album} />)
                    ) : (
                      <p className="text-sm text-white/60">No albums yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </main>
      </div>
      <NowPlaying track={nowPlaying} />
    </div>
  );
}

export default App;
