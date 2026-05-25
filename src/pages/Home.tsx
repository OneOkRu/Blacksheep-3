import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { PlayerTable } from '../components/PlayerTable';
import { PlayerModal } from '../components/PlayerModal';
import { Player } from '../types';

export const Home: React.FC = () => {
  const { data } = useData();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  if (!data) return null;

  return (
    <div className="space-y-8 sm:space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2 sm:gap-4">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter lg:text-8xl italic uppercase">
          {data.settings.siteName}
        </h1>
        <p className="text-brand-text-muted text-lg sm:text-xl font-medium tracking-tight max-w-2xl">
          {data.settings.description}
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-end justify-between border-b border-brand-border pb-4">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-text-muted">Overall Rating</h2>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-text-muted">{data.players.length} Warriors</span>
        </div>
        
        <PlayerTable 
          players={data.players} 
          tournaments={data.tournaments}
          tiers={data.tiers}
          sortBy="points" 
          onPlayerClick={setSelectedPlayer} 
          showTier={true}
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
