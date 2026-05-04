import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { Track } from '../lib/types';

type Props = {
  track: Track | null;
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  onPrev?: () => void;
  onNext?: () => void;
};

const formatTime = (seconds: number) => {
  if (!seconds || !Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const NowPlaying = ({ track, audioRef, onPrev, onNext }: Props) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Keep state in sync with audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updatePlayState = () => setIsPlaying(!audio.paused);
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      onNext?.(); // Auto-play next track
    };

    audio.addEventListener('play', updatePlayState);
    audio.addEventListener('pause', updatePlayState);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', updatePlayState);
      audio.removeEventListener('pause', updatePlayState);
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioRef, onNext]);

  const toggle = () => {
    if (!audioRef.current || !track?.audioUrl) return;
    
    // Set src manually if not set yet to ensure it plays
    if (!audioRef.current.src.includes(track.audioUrl)) {
      audioRef.current.src = track.audioUrl;
    }

    if (audioRef.current.paused) {
      audioRef.current.play().catch(console.warn);
    } else {
      audioRef.current.pause();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 backdrop-blur bg-black/95 border-t border-white/10 px-4 md:px-8 py-3 flex flex-col md:flex-row items-center gap-4 z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
      <audio ref={audioRef} className="hidden" />
      
      {/* Track Info */}
      <div className="flex items-center gap-3 w-full md:w-1/3 min-w-0">
        <div className="h-14 w-14 rounded-lg bg-white/10 overflow-hidden flex-shrink-0 shadow-lg">
          {track?.album.coverUrl ? (
            <img src={track.album.coverUrl} alt={track.title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xl text-white/60">♪</div>
          )}
        </div>
        <div className="min-w-0 flex flex-col justify-center">
          <p className="font-semibold truncate text-sm text-white">{track ? track.title : 'Nothing playing'}</p>
          <p className="text-xs text-white/60 truncate hover:text-white/80 transition-colors cursor-default">
            {track ? `${track.artist.name}` : 'Pick a track to start listening'}
          </p>
        </div>
      </div>
      
      {/* Controls & Progress */}
      <div className="flex-1 w-full flex flex-col items-center justify-center gap-1.5">
        <div className="flex items-center gap-5">
          <button
            onClick={onPrev}
            disabled={!track}
            className="text-white/60 hover:text-white disabled:opacity-30 disabled:hover:text-white/60 transition-colors"
            aria-label="Previous track"
          >
            <SkipBack size={20} fill="currentColor" />
          </button>
          
          <button
            onClick={toggle}
            disabled={!track?.audioUrl}
            className="h-9 w-9 rounded-full bg-white text-black flex items-center justify-center disabled:opacity-50 hover:scale-105 transition-transform shadow-md"
            aria-label="Play or pause"
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
          </button>
          
          <button
            onClick={onNext}
            disabled={!track}
            className="text-white/60 hover:text-white disabled:opacity-30 disabled:hover:text-white/60 transition-colors"
            aria-label="Next track"
          >
            <SkipForward size={20} fill="currentColor" />
          </button>
        </div>
        
        <div className="w-full flex items-center gap-3 text-[11px] text-white/50 max-w-xl font-mono">
          <span className="w-10 text-right">{formatTime(currentTime)}</span>
          <div className="relative flex-1 flex items-center group">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              disabled={!track}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {/* Custom slider track */}
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 group-hover:bg-emerald-400 transition-colors" 
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            {/* Custom slider thumb (appears on hover) */}
            <div 
              className="absolute h-3 w-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `calc(${duration ? (currentTime / duration) * 100 : 0}% - 6px)` }}
            />
          </div>
          <span className="w-10">{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Empty space for layout balance */}
      <div className="hidden md:flex w-1/3 justify-end items-center px-4">
        {/* Placeholder for future volume controls */}
      </div>
    </div>
  );
};
