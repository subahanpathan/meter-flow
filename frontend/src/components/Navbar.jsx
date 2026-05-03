import React from 'react';
import { Bell, Search, Command } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Navbar = () => {
  const { user } = useAuthStore();

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-40 border-b border-white/[0.08]">
      <div className="flex items-center gap-6 flex-1">
        <div className="relative w-full max-w-md hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search APIs, logs, or metrics..."
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-md pl-10 pr-12 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors text-white placeholder:text-slate-500"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/10 text-xs text-slate-400">
            <Command size={12} />
            <span>K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="text-slate-400 hover:text-white relative transition-colors">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full border border-[#0a0a0a]"></span>
        </button>

        <div className="h-6 w-px bg-white/10 hidden sm:block"></div>

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">{user?.name || 'User'}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm border border-blue-500">
            {user?.name?.[0] || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
