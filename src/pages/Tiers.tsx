import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { PlayerTable } from '../components/PlayerTable';
import { PlayerModal } from '../components/PlayerModal';
import { Player } from '../types';
import { cn } from '../lib/utils';

export const Tiers: React.FC = () => {
  const { data } = useData();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [activeTierId, setActiveTierId] = useState<string>('overall');

  if (!data) return null;

  const filteredPlayers = useMemo(() => {
    if (activeTierId === 'overall') return data.players;
    return data.players.filter(p => p.tierScores && p.tierScores[activeTierId]);
  }, [data.players, activeTierId]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4">
        <h1 className="text-6xl font-black tracking-tighter lg:text-8xl italic uppercase">
          Tiers
        </h1>
        <p className="text-brand-text-muted text-xl font-medium tracking-tight">
          Player rankings by specific categories.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        {data.tiers.map(tier => (
          <button
            key={tier.id}
            onClick={() => setActiveTierId(tier.id)}
            className={cn(
              "px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all border flex items-center gap-2",
              activeTierId === tier.id 
                ? "bg-white text-brand-bg border-white shadow-lg scale-105" 
                : "bg-brand-card text-brand-text-muted border-brand-border hover:border-brand-text-muted/50"
            )}
          >
            {tier.icon && <span className="text-lg">{tier.icon}</span>}
            {tier.name}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex items-end justify-between border-b border-brand-border pb-4">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-text-muted">
            {activeTierId === 'overall' ? 'Overall Rankings' : `${data.tiers.find(t => t.id === activeTierId)?.name} Rankings`}
          </h2>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-text-muted">{filteredPlayers.length} Warriors</span>
        </div>

        <PlayerTable 
          players={filteredPlayers} 
          tournaments={data.tournaments}
          tiers={data.tiers}
          sortBy="points" 
          onPlayerClick={setSelectedPlayer} 
          showTier={true}
          tierId={activeTierId}
        />
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
