import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Track } from '../types';

type Props = {
  track: Track | null;
};

export const NowPlaying = ({ track }: Props) => {
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
    <div className="fixed bottom-0 left-0 right-0 backdrop-blur bg-black/70 border-t border-white/10 px-4 md:px-8 py-3 flex items-center gap-4">
      <audio ref={audioRef} className="hidden" />
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="h-12 w-12 rounded-lg bg-white/10 overflow-hidden flex-shrink-0">
          {track?.album.coverUrl ? (
            <img src={track.album.coverUrl} alt={track.title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-lg text-white/60">♪</div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">{track ? track.title : 'Nothing playing'}</p>
          <p className="text-xs text-white/60 truncate">
            {track ? `${track.artist.name} • ${track.album.title}` : 'Pick a track to start listening'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          disabled={!track?.audioUrl}
          className="h-11 w-11 rounded-full bg-emerald-500 text-black flex items-center justify-center disabled:opacity-40"
          aria-label="Play or pause"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
      </div>
    </div>
  );
};
