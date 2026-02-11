'use client';

import Link from 'next/link';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Sparkles, Plus } from 'lucide-react';
import { api } from '../lib/api';
import type { HomeResponse, PlaylistSummary, SearchResponse, Track, User } from '../lib/types';
import { Sidebar } from '../components/Sidebar';
import { PlaylistCard } from '../components/PlaylistCard';
import { AlbumCard } from '../components/AlbumCard';
import { TrackRow } from '../components/TrackRow';
import { ArtistCard } from '../components/ArtistCard';
import { NowPlaying } from '../components/NowPlaying';

export default function Page() {
  const [homeData, setHomeData] = useState<HomeResponse | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [query, setQuery] = useState('');
  const [newPlaylist, setNewPlaylist] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [history, setHistory] = useState<
    { id: number; trackTitle: string; trackArtist: string; trackAlbum?: string | null; playedAt: string }[]
  >([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [home, lib] = await Promise.all([api.getHome(), api.getPlaylists()]);
        setHomeData(home);
        setPlaylists(lib);
        const initial = home.trendingTracks[0] ?? null;
        setNowPlaying(initial);
        setQueue(home.trendingTracks);
        setQueueIndex(0);

        try {
          const meRes = await fetch('/api/auth/me').then((r) => r.json());
          if (meRes?.user) {
            setCurrentUser(meRes.user);
            const hist = await fetch('/api/history').then((r) => r.json());
            setHistory(hist.history ?? []);
          }
        } catch {
          // ignore auth errors
        }
      } catch (err) {
        setError('Unable to load data from the API. Is the database running?');
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

  const recordHistory = async (track: Track) => {
    if (!currentUser) return;
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackTitle: track.title,
          trackArtist: track.artist.name,
          trackAlbum: track.album.title,
          audioUrl: track.audioUrl,
        }),
      });
      const hist = await fetch('/api/history').then((r) => r.json());
      setHistory(hist.history ?? []);
    } catch {
      /* ignore */
    }
  };

  const playTrack = (track: Track, list?: Track[]) => {
    const activeList = list ?? queue;
    setQueue(activeList);
    const index = activeList.findIndex((t) => t.id === track.id);
    setQueueIndex(index >= 0 ? index : 0);
    setNowPlaying(track);
    if (!track.audioUrl) {
      setError('This track has no audio file available.');
      return;
    }
    if (audioRef.current) {
      audioRef.current.src = track.audioUrl;
      audioRef.current
        .play()
        .then(() => setError(null))
        .catch(() => setError('Browser blocked autoplay. Press play in the bottom bar.'));
    }
    recordHistory(track);
  };

  const playNext = () => {
    if (!queue.length) return;
    const nextIndex = (queueIndex + 1) % queue.length;
    setQueueIndex(nextIndex);
    playTrack(queue[nextIndex], queue);
  };

  const playPrev = () => {
    if (!queue.length) return;
    const prevIndex = (queueIndex - 1 + queue.length) % queue.length;
    setQueueIndex(prevIndex);
    playTrack(queue[prevIndex], queue);
  };

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
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="text-sm text-white/80">Hi, {currentUser.name}</div>
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    setCurrentUser(null);
                    setHistory([]);
                  }}
                  className="text-sm font-semibold text-black bg-white rounded-full px-4 py-2 border border-white/20 shadow-sm"
                >
                  Log out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-semibold text-black bg-white rounded-full px-4 py-2 border border-white/20 shadow-sm"
              >
                Sign in
              </Link>
            )}
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
                  onClick={() => heroTrack && playTrack(heroTrack, homeData?.trendingTracks ?? [])}
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

          {history.length > 0 && currentUser ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Recently played</h3>
                <span className="text-xs text-white/50">For {currentUser.name}</span>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/5 divide-y divide-white/5">
                {history.map((h, idx) => (
                  <div key={h.id} className="px-4 py-2 text-sm text-white/80 flex justify-between">
                    <span>
                      {idx + 1}. {h.trackTitle} — {h.trackArtist}
                    </span>
                    <span className="text-white/50 text-xs">{new Date(h.playedAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

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
                    <TrackRow
                      key={track.id}
                      track={track}
                      index={idx}
                      onPlay={(t) => playTrack(t, homeData.trendingTracks)}
                    />
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
                      <TrackRow
                        key={track.id}
                        track={track}
                        index={idx}
                        onPlay={(t) => playTrack(t, searchResults.tracks)}
                      />
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
      <NowPlaying track={nowPlaying} audioRef={audioRef} onNext={playNext} onPrev={playPrev} />
    </div>
  );
}
