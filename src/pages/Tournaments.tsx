import React from 'react';
import { useData } from '../context/DataContext';
import { format } from 'date-fns';
import { Trophy, Medal } from 'lucide-react';

export const Tournaments: React.FC = () => {
  const { data } = useData();

  if (!data) return null;

  const getPlayer = (id: string) => {
    return data.players.find(p => p.id === id);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4">
        <h1 className="text-6xl font-black tracking-tighter lg:text-8xl italic uppercase">
          Tournaments
        </h1>
        <p className="text-brand-text-muted text-xl font-medium tracking-tight">
          Recent tournaments and their winners.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {data.tournaments.length === 0 ? (
          <div className="col-span-full text-center py-24 text-brand-text-muted bg-brand-card rounded-3xl border border-brand-border border-dashed italic">
            No tournaments found.
          </div>
        ) : (
          data.tournaments.map((tournament) => (
            <div key={tournament.id} className="bg-brand-card border border-brand-border rounded-3xl p-8 hover:border-brand-text-muted/30 transition-all shadow-2xl group">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
                    {tournament.name}
                    {tournament.shortName && <span className="text-[10px] font-bold px-2 py-0.5 bg-white/5 text-brand-text-muted rounded border border-brand-border uppercase tracking-widest align-middle">{tournament.shortName}</span>}
                  </h3>
                  <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-[0.2em] mt-1">{format(new Date(tournament.date), 'MMMM d, yyyy')}</p>
                </div>
                <Trophy className="w-8 h-8 text-yellow-500/50 group-hover:text-yellow-500 transition-colors" />
              </div>
              
              <div className="space-y-4">
                {/* 1st Place */}
                <div className="flex flex-col gap-3 p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/10">
                  <div className="flex items-center gap-2">
                    <Medal className="w-4 h-4 text-yellow-500" />
                    <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em]">1st Place</span>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {tournament.places[1]?.map(id => {
                      const p = getPlayer(id);
                      return (
                        <div key={id} className="flex items-center gap-3">
                          <img src={`https://mc-heads.net/avatar/${p?.skinNickname || p?.nickname || 'Unknown'}/32`} alt="" className="w-8 h-8 rounded-lg pixelated border border-yellow-500/20 shadow-lg" />
                          <span className="font-bold text-white text-sm tracking-tight">{p?.nickname || 'Unknown'}</span>
                        </div>
                      );
                    })}
                    {(!tournament.places[1] || tournament.places[1].length === 0) && <span className="text-brand-text-muted text-xs italic">No winner</span>}
                  </div>
                </div>

                {/* 2nd Place */}
                <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white/[0.02] border border-brand-border">
                  <div className="flex items-center gap-2">
                    <Medal className="w-4 h-4 text-brand-text-muted" />
                    <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-[0.2em]">2nd Place</span>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {tournament.places[2]?.map(id => {
                      const p = getPlayer(id);
                      return (
                        <div key={id} className="flex items-center gap-3">
                          <img src={`https://mc-heads.net/avatar/${p?.skinNickname || p?.nickname || 'Unknown'}/32`} alt="" className="w-8 h-8 rounded-lg pixelated border border-brand-border shadow-lg" />
                          <span className="font-bold text-white text-sm tracking-tight">{p?.nickname || 'Unknown'}</span>
                        </div>
                      );
                    })}
                    {(!tournament.places[2] || tournament.places[2].length === 0) && <span className="text-brand-text-muted text-xs italic">None</span>}
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col gap-3 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10">
                  <div className="flex items-center gap-2">
                    <Medal className="w-4 h-4 text-orange-500" />
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">3rd Place</span>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {tournament.places[3]?.map(id => {
                      const p = getPlayer(id);
                      return (
                        <div key={id} className="flex items-center gap-3">
                          <img src={`https://mc-heads.net/avatar/${p?.skinNickname || p?.nickname || 'Unknown'}/32`} alt="" className="w-8 h-8 rounded-lg pixelated border border-orange-500/20 shadow-lg" />
                          <span className="font-bold text-white text-sm tracking-tight">{p?.nickname || 'Unknown'}</span>
                        </div>
                      );
                    })}
                    {(!tournament.places[3] || tournament.places[3].length === 0) && <span className="text-brand-text-muted text-xs italic">None</span>}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
