import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { PlayerTable } from '../components/PlayerTable';
import { PlayerModal } from '../components/PlayerModal';
import { Player } from '../types';
import { format } from 'date-fns';

export const Archive: React.FC = () => {
  const { data } = useData();
  const archives = data?.archives || [];
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedArchiveId, setSelectedArchiveId] = useState<string>('');

  useEffect(() => {
    if (archives.length > 0) {
      if (!selectedArchiveId || !archives.find(a => a.id === selectedArchiveId)) {
        setSelectedArchiveId(archives[0].id);
      }
    } else {
      setSelectedArchiveId('');
    }
  }, [archives, selectedArchiveId]);

  const activeArchive = archives.find(a => a.id === selectedArchiveId);
  const playersToDisplay = activeArchive ? activeArchive.data : [];

  if (!data) return null;

  return (
    <div className="space-y-8 sm:space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2 sm:gap-4">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter lg:text-8xl italic uppercase">
          Archive
        </h1>
        <p className="text-brand-text-muted text-lg sm:text-xl font-medium tracking-tight">
          Historical snapshots of the rating.
        </p>
      </div>

      {archives.length === 0 ? (
        <div className="text-center py-24 text-brand-text-muted bg-brand-card rounded-2xl border border-brand-border border-dashed">
          No archives available.
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-brand-card border border-brand-border rounded-2xl shadow-xl">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Select Snapshot:</label>
            <select
              value={selectedArchiveId}
              onChange={(e) => setSelectedArchiveId(e.target.value)}
              className="bg-brand-bg border border-brand-border text-white text-sm rounded-xl focus:ring-white focus:border-white block p-3 min-w-[200px] outline-none transition-all hover:border-brand-text-muted/50 w-full sm:w-auto"
            >
              <option value="" disabled>Choose a snapshot</option>
              {archives.map(archive => {
                let dateDisplay = archive.date;
                try {
                  dateDisplay = format(new Date(archive.date), 'MMMM d, yyyy');
                } catch (e) {
                  // Fallback to raw date string if formatting fails
                }
                return (
                  <option key={archive.id} value={archive.id} className="bg-brand-card">
                    {archive.name || dateDisplay}
                  </option>
                );
              })}
            </select>
          </div>

          {activeArchive && (
            <div className="space-y-6 mt-12">
              <div className="flex items-end justify-between border-b border-brand-border pb-4">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-text-muted">
                  Snapshot: {activeArchive.name || activeArchive.date}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-text-muted">{playersToDisplay.length} Warriors</span>
              </div>
              <PlayerTable 
                players={playersToDisplay} 
                tournaments={data.tournaments}
                tiers={data.tiers}
                sortBy="points" 
                onPlayerClick={setSelectedPlayer} 
                showTier={true}
              />
            </div>
          )}
        </>
      )}

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
