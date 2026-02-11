import { Play } from 'lucide-react';
import type { PlaylistSummary } from '../types';

type Props = {
  playlist: PlaylistSummary;
};

export const PlaylistCard = ({ playlist }: Props) => (
  <div className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/5 p-4 hover:-translate-y-1 hover:border-emerald-400/50 transition">
    <div className="aspect-square rounded-xl bg-gradient-to-br from-emerald-500/40 to-emerald-700/10 overflow-hidden mb-3 border border-white/5">
      {playlist.coverUrl ? (
        <img
          src={playlist.coverUrl}
          alt={playlist.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-white/50">
          ♪
        </div>
      )}
    </div>
    <div className="space-y-1">
      <p className="font-semibold">{playlist.name}</p>
      <p className="text-xs text-white/60 line-clamp-2">{playlist.description ?? 'Curated selection'}</p>
      <p className="text-[11px] text-white/50">By {playlist.owner.name}</p>
    </div>
    <button className="absolute bottom-4 right-4 h-11 w-11 rounded-full bg-emerald-500 text-black flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 shadow-glow-green transition">
      <Play size={18} />
    </button>
  </div>
);
