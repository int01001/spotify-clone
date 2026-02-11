import type { Album } from '../lib/types';

type Props = {
  album: Album;
};

export const AlbumCard = ({ album }: Props) => (
  <div className="rounded-2xl bg-white/5 border border-white/5 p-4 hover:border-emerald-400/50 hover:-translate-y-1 transition flex flex-col gap-3">
    <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-white/5 to-white/0 border border-white/5">
      {album.coverUrl ? (
        <img src={album.coverUrl} alt={album.title} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-2xl text-white/50">Album</div>
      )}
    </div>
    <div className="space-y-1">
      <p className="font-semibold">{album.title}</p>
      <p className="text-xs text-white/60">{album.artist.name}</p>
      {album.year ? <p className="text-[11px] text-white/50">{album.year}</p> : null}
    </div>
  </div>
);
