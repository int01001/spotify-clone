import { Library, ListMusic, Plus, Radio, Search, Home as HomeIcon } from 'lucide-react';
import React from 'react';

type SidebarProps = {
  onCreatePlaylist?: () => void;
};

const navItems = [
  { label: 'Home', icon: HomeIcon },
  { label: 'Search', icon: Search },
  { label: 'Radio', icon: Radio },
  { label: 'Library', icon: Library },
];

export const Sidebar: React.FC<SidebarProps> = ({ onCreatePlaylist }) => {
  return (
    <aside className="hidden lg:flex w-64 flex-col gap-6 bg-[#0b0b0b]/80 backdrop-blur border-r border-white/5 p-6">
      <div className="flex items-center gap-3 text-xl font-semibold">
        <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center font-bold text-black">
          ♪
        </span>
        <span>Spotify Clone</span>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 rounded-lg hover:bg-white/5 transition"
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="pt-2 border-t border-white/5">
        <div className="flex items-center justify-between text-sm text-white/70 mb-3">
          <div className="flex items-center gap-2 font-semibold">
            <ListMusic size={16} />
            <span>Your Playlists</span>
          </div>
          <button
            onClick={onCreatePlaylist}
            className="p-1 rounded-lg hover:bg-white/5 text-white/70 transition"
            aria-label="Create playlist"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="space-y-2 text-sm text-white/60">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Focus Flow
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Late Night Drive
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Today's Vibes
          </div>
        </div>
      </div>
    </aside>
  );
};
