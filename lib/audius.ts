import type { Track } from './types';

const AUDIOUS_BASE = process.env.AUDIOUS_BASE_URL ?? 'https://discoveryprovider.audius.co/v1';
const AUDIOUS_APP_NAME = process.env.AUDIOUS_APP_NAME ?? 'spotify_clone_web';

type AudiusArtwork = {
  '150x150'?: string;
  '480x480'?: string;
  '1000x1000'?: string;
};

type AudiusArtist = {
  id?: string | number;
  name?: string;
  profile_picture?: AudiusArtwork;
};

type AudiusTrack = {
  id?: string;
  track_id?: number;
  title?: string;
  duration?: number;
  stream?: { url?: string };
  artwork?: AudiusArtwork;
  user?: AudiusArtist;
  genre?: string;
};

type AudiusResponse = {
  data?: AudiusTrack[];
};

function toTrack(item: AudiusTrack): Track | null {
  const title = item.title?.trim();
  const artistName = item.user?.name?.trim();
  const durationSeconds = Number(item.duration ?? 0);
  const audioUrl = item.stream?.url?.trim();

  if (!title || !artistName || !audioUrl) return null;
  if (!Number.isFinite(durationSeconds) || durationSeconds < 60 || durationSeconds > 600) return null;

  const id = Number(item.track_id ?? item.id ?? Math.floor(Math.random() * 1000000000));
  const art =
    item.artwork?.['1000x1000'] ??
    item.artwork?.['480x480'] ??
    item.artwork?.['150x150'] ??
    item.user?.profile_picture?.['480x480'] ??
    item.user?.profile_picture?.['150x150'] ??
    null;

  return {
    id,
    title,
    durationSeconds,
    audioUrl,
    artist: {
      id: Number(item.user?.id ?? id),
      name: artistName,
      imageUrl: art,
    },
    album: {
      id,
      title: item.genre?.trim() ? `${item.genre} Picks` : 'Audius Track',
      coverUrl: art,
      artist: {
        id: Number(item.user?.id ?? id),
        name: artistName,
        imageUrl: art,
      },
    },
  };
}

function normalize(list: AudiusTrack[], limit: number): Track[] {
  const out: Track[] = [];
  const seen = new Set<string>();

  for (const item of list) {
    const mapped = toTrack(item);
    if (!mapped) continue;

    const key = `${mapped.title.toLowerCase()}::${mapped.artist.name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(mapped);
    if (out.length >= limit) break;
  }

  return out;
}

export async function fetchAudiusTrendingTracks(limit = 20): Promise<Track[]> {
  const params = new URLSearchParams({
    app_name: AUDIOUS_APP_NAME,
    limit: String(Math.min(Math.max(limit * 3, 30), 100)),
  });

  const res = await fetch(`${AUDIOUS_BASE}/tracks/trending?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    console.error('Audius trending fetch failed', res.status, res.statusText);
    return [];
  }

  const data = (await res.json()) as AudiusResponse;
  return normalize(data.data ?? [], limit);
}

export async function fetchAudiusSearchTracks(query: string, limit = 30): Promise<Track[]> {
  const q = query.trim();
  if (!q) return [];

  const params = new URLSearchParams({
    app_name: AUDIOUS_APP_NAME,
    query: q,
    limit: String(Math.min(Math.max(limit * 3, 30), 100)),
  });

  const res = await fetch(`${AUDIOUS_BASE}/tracks/search?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    console.error('Audius search fetch failed', res.status, res.statusText);
    return [];
  }

  const data = (await res.json()) as AudiusResponse;
  return normalize(data.data ?? [], limit);
}
