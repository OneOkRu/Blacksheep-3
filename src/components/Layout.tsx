import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { cn } from '../lib/utils';
import { Trophy, Swords, Medal, History, Settings, User } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data } = useData();
  const location = useLocation();

  if (!data) return <div className="min-h-screen bg-brand-bg text-brand-text-muted flex flex-col items-center justify-center gap-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Loading blacksheep rating...</p>
  </div>;

  const tabs = [
    { id: 'overall', name: 'Tiers', path: '/', icon: Trophy },
    { id: 'elo', name: 'ELO Rating', path: '/elo', icon: Swords },
    { id: 'tournaments', name: 'Tournaments', path: '/tournaments', icon: Medal },
    { id: 'archive', name: 'Archive', path: '/archive', icon: History },
  ].filter(tab => data.settings.visibleTabs.includes(tab.id));

  return (
    <div className="min-h-screen bg-brand-bg text-white font-sans selection:bg-white/10">
      <header className="sticky top-0 z-50 w-full border-b border-brand-border bg-brand-bg/80 backdrop-blur supports-[backdrop-filter]:bg-brand-bg/60">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-black text-2xl tracking-tighter italic uppercase">
            <span className="text-white">black</span>
            <span className="text-brand-text-muted">sheep</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                to={tab.path}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.2em] transition-colors hover:text-white flex items-center gap-2",
                  location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path))
                    ? "text-white"
                    : "text-brand-text-muted"
                )}
              >
                {tab.name}
              </Link>
            ))}
            <Link
              to="/admin"
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted hover:text-white transition-colors flex items-center gap-2 ml-4"
            >
              <Settings className="w-3 h-3" />
              Admin
            </Link>
          </nav>
        </div>
      </header>
      
      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-brand-border bg-brand-card z-50 flex justify-around p-2 pb-safe">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            to={tab.path}
            className={cn(
              "flex flex-col items-center p-2 text-[10px] font-bold uppercase tracking-widest",
              location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path))
                ? "text-white"
                : "text-brand-text-muted"
            )}
          >
            <tab.icon className="w-5 h-5 mb-1" />
            {tab.name}
          </Link>
        ))}
      </div>

      <main className="container mx-auto px-4 py-12 pb-24 md:pb-12">
        {children}
      </main>
    </div>
  );
};
