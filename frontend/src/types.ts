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
