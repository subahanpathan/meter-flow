import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Globe, 
  BarChart3, 
  CreditCard, 
  PlayCircle,
  LogOut,
  ChevronRight,
  Activity
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const SidebarLink = ({ to, icon: Icon, label, active }) => (
  <Link
    to={to}
    className="relative group block"
  >
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-200 ${
        active 
          ? 'bg-blue-600/10 text-blue-500 font-medium' 
          : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
      }`}
    >
      <Icon size={18} className={active ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-300'} />
      <span className="text-sm">{label}</span>
      
      {active && (
        <div className="ml-auto">
          <ChevronRight size={14} className="text-blue-500 opacity-50" />
        </div>
      )}
    </div>
  </Link>
);

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/apis', icon: Globe, label: 'API Gateway' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/billing', icon: CreditCard, label: 'Billing' },
    { to: '/playground', icon: PlayCircle, label: 'API Explorer' },
  ];

  return (
    <aside className="w-64 h-screen hidden md:flex flex-col z-50 sticky top-0 border-r border-white/[0.08] bg-[#0a0a0a]">
      <div className="p-6 mb-2 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-sm">
          <Activity size={18} className="text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white">MeterFlow</span>
      </div>

      <nav className="flex-1 px-3 space-y-1 custom-scrollbar overflow-y-auto">
        <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 mt-4">Overview</p>
        {links.map((link) => (
          <SidebarLink
            key={link.to}
            to={link.to}
            icon={link.icon}
            label={link.label}
            active={location.pathname === link.to || (link.to !== '/dashboard' && location.pathname.startsWith(link.to))}
          />
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-white/[0.08]">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-medium text-sm">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate text-white">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.plan || 'Free'} Plan</p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors text-sm"
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
