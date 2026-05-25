import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Player, Tournament, ArchiveSnapshot, Match } from '../types';
import { X, Swords } from 'lucide-react';
import { cn } from '../lib/utils';

interface PlayerModalProps {
  player: Player | null;
  tournaments?: Tournament[];
  archives?: ArchiveSnapshot[];
  matches?: Match[];
  players?: Player[];
  onClose: () => void;
}

export const PlayerModal: React.FC<PlayerModalProps> = ({ player, tournaments = [], archives = [], matches = [], players = [], onClose }) => {
  if (!player) return null;

  // Build evolution data from archives + current state + player history
  const evolutionData = [
    ...(player.history || []).map(h => ({
      date: h.date,
      name: 'Match',
      points: h.points
    })),
    ...(archives || []).map(archive => {
      const historicalPlayer = archive.data.find(p => p.id === player.id);
      return {
        date: archive.date,
        name: archive.name,
        points: historicalPlayer?.points || 0
      };
    }),
    {
      date: new Date().toISOString().split('T')[0],
      name: 'Current',
      points: player.points
    }
  ].reduce((acc: any[], curr) => {
    // Remove duplicates by date, preferring archive/current over match history
    const existingIndex = acc.findIndex(item => item.date === curr.date);
    if (existingIndex >= 0) {
      if (curr.name !== 'Match') {
        acc[existingIndex] = curr;
      }
    } else {
      acc.push(curr);
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-bg/90 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-brand-card border border-brand-border rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          <div className="p-4 sm:p-8 border-b border-brand-border flex items-start justify-between bg-white/[0.02]">
            <div className="flex items-center gap-4 sm:gap-6">
              <img
                src={`https://mc-heads.net/avatar/${player.skinNickname || player.nickname}/96`}
                alt={player.nickname}
                className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl pixelated bg-brand-bg shadow-2xl border border-brand-border flex-shrink-0"
              />
              <div>
                <h2 className="text-2xl sm:text-4xl font-black text-white flex items-center gap-2 sm:gap-3 flex-wrap tracking-tighter italic uppercase">
                  {player.nickname}
                  {player.badge && <span className="text-[8px] sm:text-[10px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 uppercase tracking-[0.2em]">{player.badge}</span>}
                </h2>
                <div className="flex gap-3 sm:gap-4 mt-2 sm:mt-3 flex-wrap">
                  <div className="flex flex-col">
                    <span className="text-[7px] sm:text-[8px] font-bold text-brand-text-muted uppercase tracking-widest">Points</span>
                    <span className="text-lg sm:text-xl font-black text-white tracking-tighter italic">{player.points}</span>
                  </div>
                  {player.eloScores && Object.entries(player.eloScores).map(([tierId, score]) => {
                    const isNA = tierId !== 'overall' && (player.tierScores?.[tierId] === 'N/A' || score === undefined || score === null);
                    return (
                      <div key={tierId} className="flex flex-col">
                        <span className="text-[7px] sm:text-[8px] font-bold text-brand-text-muted uppercase tracking-widest">{tierId} ELO</span>
                        <span className="text-lg sm:text-xl font-black text-white tracking-tighter italic">{isNA ? 'N/A' : score}</span>
                      </div>
                    );
                  })}
                  <div className="flex flex-col">
                    <span className="text-[7px] sm:text-[8px] font-bold text-brand-text-muted uppercase tracking-widest">Main Tier</span>
                    <span className={cn(
                      "text-lg sm:text-xl font-black tracking-tighter italic",
                      player.tier === 'S' ? "text-tier-s" :
                      player.tier === 'A' ? "text-tier-a" :
                      player.tier === 'B' ? "text-tier-b" :
                      player.tier === 'C' ? "text-tier-c" :
                      player.tier === 'D' ? "text-tier-d" :
                      "text-white"
                    )}>{player.tier}</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/5 text-brand-text-muted hover:text-white transition-all border border-transparent hover:border-brand-border"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-4 sm:p-8 space-y-6 sm:space-y-10">
            <div>
              <h3 className="text-[9px] sm:text-[10px] font-bold text-brand-text-muted uppercase tracking-[0.3em] mb-4 sm:mb-6">Rating Evolution</h3>
              <div className="h-48 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolutionData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d2828" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#a19b9b" 
                      fontSize={10} 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                    />
                    <YAxis 
                      stroke="#a19b9b" 
                      fontSize={10} 
                      tickLine={false}
                      axisLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#221d1d', borderColor: '#2d2828', borderRadius: '12px', color: '#ffffff', fontSize: '12px' }}
                      itemStyle={{ color: '#facc15' }}
                      labelStyle={{ color: '#a19b9b', marginBottom: '4px', fontWeight: 'bold' }}
                      labelFormatter={(label, items) => {
                        const item = items[0]?.payload;
                        return `${new Date(label).toLocaleDateString()} ${item?.name ? `(${item.name})` : ''}`;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="points" 
                      name="Points"
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }} 
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h3 className="text-[9px] sm:text-[10px] font-bold text-brand-text-muted uppercase tracking-[0.3em] mb-4 sm:mb-6 flex items-center gap-2">
                <Swords className="w-3 h-3" />
                Recent Matches
              </h3>
              <div className="grid gap-2 sm:gap-3">
                {matches
                  .filter(m => m.player1Id === player.id || m.player2Id === player.id)
                  .slice(0, 5)
                  .map(m => {
                    const isP1 = m.player1Id === player.id;
                    const opponentId = isP1 ? m.player2Id : m.player1Id;
                    const opponent = players.find(p => p.id === opponentId);
                    const myScore = isP1 ? m.score1 : m.score2;
                    const oppScore = isP1 ? m.score2 : m.score1;
                    const myEloChange = isP1 ? m.eloChange1 : m.eloChange2;
                    const isWin = myScore! > oppScore!;
                    const isDraw = myScore === oppScore;

                    return (
                      <div key={m.id} className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-white/[0.02] border border-brand-border group hover:border-brand-text-muted/30 transition-all">
                        <div className="flex items-center gap-2 sm:gap-4">
                          <div className={cn(
                            "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black italic text-xs sm:text-sm border tracking-tighter flex-shrink-0",
                            isWin ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                            isDraw ? "bg-white/5 text-brand-text-muted border-brand-border" : 
                            "bg-red-500/10 text-red-400 border-red-500/20"
                          )}>
                            {isWin ? 'W' : isDraw ? 'D' : 'L'}
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <img src={`https://mc-heads.net/avatar/${opponent?.skinNickname || opponent?.nickname || 'Unknown'}/32`} alt="" className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg pixelated border border-brand-border shadow-lg flex-shrink-0" />
                            <span className="font-bold text-white tracking-tight truncate text-sm sm:text-base">{opponent?.nickname || 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-6">
                          <span className="font-black italic text-base sm:text-lg text-white tracking-tighter">{myScore ?? '?'}-{oppScore ?? '?'}</span>
                          <span className={cn(
                            "font-black italic text-base sm:text-lg w-12 sm:w-16 text-right tracking-tighter",
                            myEloChange > 0 ? "text-emerald-400" : "text-red-400"
                          )}>
                            {myEloChange > 0 ? '+' : ''}{myEloChange}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                {matches.filter(m => m.player1Id === player.id || m.player2Id === player.id).length === 0 && (
                  <div className="text-center py-12 text-brand-text-muted bg-brand-bg/50 rounded-3xl border border-dashed border-brand-border italic text-xs">
                    No matches recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
