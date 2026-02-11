import { Play } from 'lucide-react';
import type { Track } from '../types';

type Props = {
  track: Track;
  index?: number;
  onPlay?: (track: Track) => void;
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const TrackRow = ({ track, index, onPlay }: Props) => (
  <div className="group flex items-center gap-4 px-3 py-2 rounded-xl hover:bg-white/5 transition">
    <div className="w-8 text-sm text-white/40">{index !== undefined ? index + 1 : null}</div>
    <button
      onClick={() => onPlay?.(track)}
      className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition"
      aria-label={`Play ${track.title}`}
    >
      <Play size={16} />
    </button>
    <div className="flex-1 min-w-0">
      <p className="font-semibold truncate">{track.title}</p>
      <p className="text-xs text-white/60 truncate">
        {track.artist.name} • {track.album.title}
      </p>
    </div>
    <div className="text-xs text-white/50">{formatDuration(track.durationSeconds)}</div>
  </div>
);
