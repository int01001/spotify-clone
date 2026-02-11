import type { Artist } from '../types';

type Props = {
  artist: Artist;
};

export const ArtistCard = ({ artist }: Props) => (
  <div className="rounded-2xl bg-white/5 border border-white/5 p-4 flex flex-col items-center gap-3 hover:border-emerald-400/50 transition">
    <div className="h-20 w-20 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500/30 to-emerald-700/10 border border-white/5">
      {artist.imageUrl ? (
        <img src={artist.imageUrl} alt={artist.name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-xl text-white/60">{artist.name[0]}</div>
      )}
    </div>
    <div className="text-center space-y-1">
      <p className="font-semibold">{artist.name}</p>
      {artist.trackCount !== undefined ? (
        <p className="text-xs text-white/60">{artist.trackCount} tracks</p>
      ) : null}
    </div>
  </div>
);
