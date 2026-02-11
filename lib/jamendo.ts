import { Track } from './types';

const JAMENDO_BASE = 'https://api.jamendo.com/v3.0';

const clientId = process.env.JAMENDO_CLIENT_ID;

if (!clientId) {
  // eslint-disable-next-line no-console
  console.warn('Missing JAMENDO_CLIENT_ID in environment. Jamendo audio will not work.');
}

type JamendoTrack = {
  id: string;
  name: string;
  artist_name: string;
  duration: number;
  audio: string;
  album_name: string;
  image: string;
};

export async function fetchJamendoTracks(limit = 20, query?: string): Promise<Track[]> {
  if (!clientId) return [];

  const params = new URLSearchParams({
    client_id: clientId,
    format: 'json',
    audioformat: 'mp32',
    limit: String(limit),
    order: 'popularity_total',
  });

  if (query && query.trim()) {
    const q = query.trim();
    params.set('search', q);       // searches in track name, artist, tags
    params.set('namesearch', q);   // stricter name match
  }

  const res = await fetch(`${JAMENDO_BASE}/tracks/?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    console.error('Jamendo tracks fetch failed', res.status, res.statusText);
    return [];
  }

  const data = await res.json();
  const list: JamendoTrack[] = data?.results ?? [];

  return list.map((t) => ({
    id: Number(t.id),
    title: t.name,
    durationSeconds: t.duration,
    audioUrl: t.audio,
    artist: { id: Number(t.id), name: t.artist_name },
    album: {
      id: Number(t.id),
      title: t.album_name || 'Jamendo Single',
      coverUrl: t.image,
      artist: { id: Number(t.id), name: t.artist_name },
    },
  }));
}
