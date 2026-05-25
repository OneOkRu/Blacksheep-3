import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { PlayerTable } from '../components/PlayerTable';
import { PlayerModal } from '../components/PlayerModal';
import { Player } from '../types';
import { Swords } from 'lucide-react';
import { cn } from '../lib/utils';

export const Elo: React.FC = () => {
  const { data } = useData();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const eligibleTiers = data?.tiers || [];
  const [activeTierId, setActiveTierId] = useState<string>('overall');

  if (!data) return null;

  const matches = activeTierId === 'overall'
    ? (data.matches || [])
    : (data.matches || []).filter(m => m.tierId === activeTierId);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2 sm:gap-4">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter lg:text-8xl italic uppercase">
          ELO Rating
        </h1>
        <p className="text-brand-text-muted text-lg sm:text-xl font-medium tracking-tight">
          Rankings based on the Elo rating system.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {eligibleTiers.map(tier => (
          <button
            key={tier.id}
            onClick={() => setActiveTierId(tier.id)}
            className={cn(
              "px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all border whitespace-nowrap",
              activeTierId === tier.id 
                ? "bg-white text-brand-bg border-white shadow-xl" 
                : "bg-brand-card text-brand-text-muted border-brand-border hover:border-brand-text-muted/50"
            )}
          >
            ELO {tier.name}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        <PlayerTable 
          players={data.players} 
          tournaments={data.tournaments}
          tiers={data.tiers}
          sortBy="elo" 
          tierId={activeTierId}
          onPlayerClick={setSelectedPlayer} 
          showTier={false}
        />
      </div>

      <div className="space-y-6 pt-12 border-t border-brand-border">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-text-muted flex items-center gap-2">
          <Swords className="w-3 h-3" />
          Recent Matches - {data.tiers.find(t => t.id === activeTierId)?.name}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {matches.slice(0, 10).map(m => {
            const p1 = data.players.find(p => p.id === m.player1Id);
            const p2 = data.players.find(p => p.id === m.player2Id);
            const tierName = m.tierId ? (data.tiers.find(t => t.id === m.tierId)?.name || m.tierId) : 'Overall';
            
            return (
              <div key={m.id} className="bg-brand-card border border-brand-border rounded-2xl p-4 sm:p-6 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-2 sm:gap-4 flex-1">
                  <div className="flex flex-col items-center gap-1 min-w-[60px] sm:min-w-[70px]">
                    <img src={`https://mc-heads.net/avatar/${p1?.skinNickname || p1?.nickname || 'Unknown'}/48`} alt="" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg shadow-lg pixelated border border-brand-border flex-shrink-0" />
                    <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-tight truncate max-w-[60px] sm:max-w-[70px] text-white/80">{p1?.nickname || 'Unknown'}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-[7px] sm:text-[8px] font-black px-1.5 sm:px-2 py-0.5 bg-white/5 text-brand-text-muted rounded uppercase tracking-[0.2em] border border-brand-border">{tierName}</span>
                    <span className="text-xl sm:text-2xl font-black text-white italic tracking-tighter">{m.score1 ?? '?'}:{m.score2 ?? '?'}</span>
                    <span className="text-[7px] sm:text-[8px] font-bold text-brand-text-muted uppercase tracking-widest">{new Date(m.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 min-w-[60px] sm:min-w-[70px]">
                    <img src={`https://mc-heads.net/avatar/${p2?.skinNickname || p2?.nickname || 'Unknown'}/48`} alt="" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg shadow-lg pixelated border border-brand-border flex-shrink-0" />
                    <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-tight truncate max-w-[60px] sm:max-w-[70px] text-white/80">{p2?.nickname || 'Unknown'}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-3 sm:ml-6 border-l border-brand-border pl-3 sm:pl-6">
                  <div className="flex items-center gap-1 text-xs">
                    <span className={cn("font-black italic tracking-tighter", m.eloChange1 > 0 ? "text-emerald-400" : "text-red-400")}>
                      {m.eloChange1 > 0 ? '+' : ''}{m.eloChange1}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className={cn("font-black italic tracking-tighter", m.eloChange2 > 0 ? "text-emerald-400" : "text-red-400")}>
                      {m.eloChange2 > 0 ? '+' : ''}{m.eloChange2}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {!(data.matches?.length) && (
            <div className="col-span-full text-center py-12 text-brand-text-muted bg-brand-card rounded-3xl border border-dashed border-brand-border italic text-xs">
              No matches recorded yet.
            </div>
          )}
        </div>
      </div>

      <PlayerModal 
        player={selectedPlayer} 
        tournaments={data.tournaments}
        archives={data.archives}
        matches={data.matches}
        players={data.players}
        onClose={() => setSelectedPlayer(null)} 
      />
    </div>
  );
};
