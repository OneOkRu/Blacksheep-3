/// <reference types="vite/client" />
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { RatingData, Player, Tournament, Tier, Match, ArchiveSnapshot } from '../types';
import { Button } from '../components/ui/button';
import { Download, Upload, Save, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { recalculateEloRatings, generateMinecraftJudgeComment } from '../lib/eloCalculator';

export const Admin: React.FC = () => {
  const { data, updateData } = useData();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'players' | 'matches' | 'tournaments' | 'tiers' | 'archives' | 'settings'>('players');
  const [localData, setLocalData] = useState<RatingData | null>(null);
  const [livePreview, setLivePreview] = useState(false);

  // Custom UI for confirm/alert
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [alertState, setAlertState] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({ title, message, onConfirm });
  };

  const showAlert = (title: string, message: string) => {
    setAlertState({ title, message });
  };

  // Load from session draft or context
  useEffect(() => {
    if (data && !localData) {
      const sessionDraft = localStorage.getItem('admin_session_draft');
      if (sessionDraft) {
        try {
          setLocalData(JSON.parse(sessionDraft));
        } catch (e) {
          setLocalData(JSON.parse(JSON.stringify(data)));
        }
      } else {
        setLocalData(JSON.parse(JSON.stringify(data)));
      }
    }
  }, [data, localData]);

  // Auto-save to session draft and optional live preview
  useEffect(() => {
    if (localData) {
      localStorage.setItem('admin_session_draft', JSON.stringify(localData));
      if (livePreview) {
        updateData(localData);
      }
    }
  }, [localData, livePreview, updateData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd check against an env variable.
    // For this demo, we'll accept 'Lazer' or whatever is in NEXT_PUBLIC_ADMIN_PASSWORD
    const envPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'Lazer';
    if (password === envPassword) {
      setIsAuthenticated(true);
    } else {
      showAlert('Error', 'Incorrect password');
    }
  };

  const handleExport = () => {
    if (!localData) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "rating.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        setLocalData(importedData);
        updateData(importedData);
        showAlert('Success', 'Data imported successfully!');
      } catch (err) {
        showAlert('Error', 'Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleSave = () => {
    if (localData) {
      updateData(localData);
      localStorage.removeItem('admin_session_draft'); // Clear session draft after permanent save
      showAlert('Success', 'Changes applied to preview! To make them permanent in the codebase, use "Export" and replace rating.json.');
    }
  };

  useEffect(() => {
    if (data && !data.tiers.find(t => t.id === 'axe')) {
      setLocalData(prev => {
        if (!prev) return prev;
        if (prev.tiers.find(t => t.id === 'axe')) return prev;
        return {
          ...prev,
          tiers: [...prev.tiers, { id: 'axe', name: 'Axe PvP', icon: '🪓' }]
        };
      });
    }
  }, [data]);

  const handleReset = () => {
    showConfirm(
      'Reset Data',
      'Are you sure you want to discard all unsaved changes and reset to server data?',
      () => {
        localStorage.removeItem('admin_session_draft');
        setLocalData(JSON.parse(JSON.stringify(data)));
      }
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-brand-card border border-brand-border p-10 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-500">
          <h1 className="text-4xl font-black tracking-tighter italic uppercase mb-8 text-center">Admin Access</h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border text-white rounded-xl p-4 focus:ring-white focus:border-white outline-none transition-all"
                placeholder="••••••••"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full bg-white text-brand-bg font-black italic uppercase tracking-widest py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
            >
              Unlock Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!localData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-brand-text-muted">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-12 space-y-8 sm:space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-brand-card p-6 sm:p-8 rounded-3xl border border-brand-border shadow-2xl">
        <div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-white italic uppercase">Admin Panel</h1>
          <p className="text-brand-text-muted mt-1 sm:mt-2 font-medium tracking-tight text-sm sm:text-base">Manage players, matches, and site data.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-3 bg-brand-bg px-4 py-2 rounded-xl border border-brand-border mr-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted cursor-pointer flex items-center gap-3">
              <input type="checkbox" checked={livePreview} onChange={e => setLivePreview(e.target.checked)} className="w-4 h-4 rounded bg-brand-card border-brand-border text-white focus:ring-white" />
              Live Preview
            </label>
          </div>
          <Button onClick={handleSave} variant="outline" className="gap-2 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 bg-emerald-500/5 rounded-xl uppercase text-[10px] font-bold tracking-widest"><Save className="w-4 h-4"/> Save Changes</Button>
          <Button onClick={handleReset} variant="outline" className="gap-2 border-red-500/20 text-red-400 hover:bg-red-500/10 bg-red-500/5 rounded-xl uppercase text-[10px] font-bold tracking-widest"><X className="w-4 h-4"/> Reset</Button>
          <Button onClick={handleExport} variant="outline" className="gap-2 border-brand-border text-brand-text-muted hover:text-white hover:bg-white/5 rounded-xl uppercase text-[10px] font-bold tracking-widest"><Download className="w-4 h-4"/> Export JSON</Button>
          <div className="relative">
            <input type="file" accept=".json" onChange={handleImport} className="absolute inset-0 opacity-0 cursor-pointer" />
            <Button variant="outline" className="gap-2 border-brand-border text-brand-text-muted hover:text-white hover:bg-white/5 rounded-xl uppercase text-[10px] font-bold tracking-widest"><Upload className="w-4 h-4"/> Import JSON</Button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {['players', 'matches', 'tournaments', 'tiers', 'archives', 'settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={cn(
              "px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] transition-all border whitespace-nowrap",
              activeTab === tab 
                ? "bg-white text-brand-bg border-white shadow-xl scale-105" 
                : "bg-brand-card text-brand-text-muted border-brand-border hover:border-brand-text-muted/50"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-brand-card border border-brand-border rounded-3xl p-4 sm:p-8 shadow-2xl">
        {activeTab === 'players' && <PlayersAdmin data={localData} setData={setLocalData} showConfirm={showConfirm} showAlert={showAlert} />}
        {activeTab === 'matches' && <MatchesAdmin data={localData} setData={setLocalData} showConfirm={showConfirm} showAlert={showAlert} />}
        {activeTab === 'tournaments' && <TournamentsAdmin data={localData} setData={setLocalData} showConfirm={showConfirm} showAlert={showAlert} />}
        {activeTab === 'tiers' && <TiersAdmin data={localData} setData={setLocalData} showConfirm={showConfirm} showAlert={showAlert} />}
        {activeTab === 'archives' && <ArchivesAdmin data={localData} setData={setLocalData} showConfirm={showConfirm} showAlert={showAlert} />}
        {activeTab === 'settings' && <SettingsAdmin data={localData} setData={setLocalData} showConfirm={showConfirm} showAlert={showAlert} />}
      </div>

      {/* Custom Confirm Modal */}
      {confirmState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-bg/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-brand-card border border-brand-border rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black tracking-tighter italic uppercase text-white">{confirmState.title}</h3>
            <p className="text-brand-text-muted font-medium tracking-tight">{confirmState.message}</p>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setConfirmState(null)} className="rounded-xl border-brand-border text-brand-text-muted hover:text-white uppercase text-[10px] font-bold tracking-widest">Cancel</Button>
              <Button onClick={() => { confirmState.onConfirm(); setConfirmState(null); }} className="rounded-xl bg-white text-brand-bg hover:scale-105 uppercase text-[10px] font-bold tracking-widest">Confirm</Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {alertState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-bg/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-brand-card border border-brand-border rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black tracking-tighter italic uppercase text-white">{alertState.title}</h3>
            <p className="text-brand-text-muted font-medium tracking-tight">{alertState.message}</p>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setAlertState(null)} className="rounded-xl bg-white text-brand-bg hover:scale-105 uppercase text-[10px] font-bold tracking-widest px-8">OK</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-components for Admin Tabs ---

const MatchesAdmin: React.FC<{ 
  data: RatingData, 
  setData: React.Dispatch<React.SetStateAction<RatingData | null>>,
  showConfirm: (title: string, message: string, onConfirm: () => void) => void,
  showAlert: (title: string, message: string) => void
}> = ({ data, setData, showConfirm, showAlert }) => {
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [p1Score, setP1Score] = useState(10);
  const [p2Score, setP2Score] = useState(3);
  const eligibleTiers = data.tiers.filter(t => t.id !== 'overall');
  const [matchTier, setMatchTier] = useState<string>(eligibleTiers[0]?.id || '');
  const [judgeCommentary, setJudgeCommentary] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('arena_judge_logs') || '[]');
  });

  const handleRecordMatch = () => {
    if (!p1 || !p2) return showAlert('Validation Error', 'Select both players');
    if (p1 === p2) return showAlert('Validation Error', 'Players must be different');
    
    const numMatches = p1Score + p2Score;
    if (numMatches === 0) return showAlert('Validation Error', 'Total score cannot be zero');

    const player1 = data.players.find(p => p.id === p1);
    const player2 = data.players.find(p => p.id === p2);
    if (!player1 || !player2) return;

    // Create the match
    const newMatch: Match = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      tierId: matchTier === 'overall' ? undefined : matchTier,
      player1Id: p1,
      player2Id: p2,
      winnerId: p1Score > p2Score ? p1 : (p1Score < p2Score ? p2 : null),
      eloChange1: 0, 
      eloChange2: 0, 
      score1: p1Score,
      score2: p2Score
    };

    setData(prev => {
      if (!prev) return prev;
      const nextDataWithoutRecalc = {
        ...prev,
        matches: [newMatch, ...(prev.matches || [])]
      };
      
      const recalculated = recalculateEloRatings(nextDataWithoutRecalc);
      
      const calculatedMatch = recalculated.matches?.find(m => m.id === newMatch.id);
      const change1 = calculatedMatch?.eloChange1 ?? 0;
      const change2 = calculatedMatch?.eloChange2 ?? 0;

      const tierObj = prev.tiers.find(t => t.id === matchTier);
      const tName = tierObj ? tierObj.name : 'Unknown';

      const comment = generateMinecraftJudgeComment(
        player1.nickname,
        player2.nickname,
        p1Score,
        p2Score,
        change1,
        change2,
        tName
      );

      const nextComments = [comment, ...judgeCommentary].slice(0, 10);
      setJudgeCommentary(nextComments);
      localStorage.setItem('arena_judge_logs', JSON.stringify(nextComments));

      setTimeout(() => {
        showAlert('🛡️ Судейский Вердикт', comment);
      }, 50);

      return recalculated;
    });

    setP1('');
    setP2('');
    setP1Score(10);
    setP2Score(3);
  };

  const handleDeleteMatch = (matchId: string) => {
    showConfirm('Delete Series', 'Are you sure you want to delete this series? Ratings will be completely recalculated.', () => {
      setData(prev => {
        if (!prev) return prev;
        const nextDataWithoutMatch = {
          ...prev,
          matches: (prev.matches || []).filter(m => m.id !== matchId)
        };
        return recalculateEloRatings(nextDataWithoutMatch);
      });
    });
  };

  return (
    <div className="space-y-10">
      <div className="bg-brand-bg p-8 rounded-3xl border border-brand-border space-y-8 shadow-inner">
        <h3 className="text-2xl font-black tracking-tighter italic uppercase text-white">Record New Match</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Tier / Category</label>
            <select className="w-full bg-brand-card border border-brand-border text-white rounded-xl p-3 focus:ring-white focus:border-white outline-none transition-all" value={matchTier} onChange={e => setMatchTier(e.target.value)}>
              {eligibleTiers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Player 1</label>
            <select className="w-full bg-brand-card border border-brand-border text-white rounded-xl p-3 focus:ring-white focus:border-white outline-none transition-all" value={p1} onChange={e => setP1(e.target.value)}>
              <option value="">Select...</option>
              {data.players.map(p => {
                const elo = p.eloScores?.[matchTier] ?? 50;
                return <option key={p.id} value={p.id}>{p.nickname} ({elo})</option>;
              })}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Player 2</label>
            <select className="w-full bg-brand-card border border-brand-border text-white rounded-xl p-3 focus:ring-white focus:border-white outline-none transition-all" value={p2} onChange={e => setP2(e.target.value)}>
              <option value="">Select...</option>
              {data.players.map(p => {
                const elo = p.eloScores?.[matchTier] ?? 50;
                return <option key={p.id} value={p.id}>{p.nickname} ({elo})</option>;
              })}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">P1 Score</label>
            <input 
              type="number" 
              className="w-full bg-brand-card border border-brand-border text-white rounded-xl p-3 focus:ring-white focus:border-white outline-none transition-all" 
              value={p1Score} 
              onChange={e => setP1Score(parseInt(e.target.value) || 0)} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">P2 Score</label>
            <input 
              type="number" 
              className="w-full bg-brand-card border border-brand-border text-white rounded-xl p-3 focus:ring-white focus:border-white outline-none transition-all" 
              value={p2Score} 
              onChange={e => setP2Score(parseInt(e.target.value) || 0)} 
            />
          </div>
        </div>
        <Button onClick={handleRecordMatch} className="w-full bg-white text-brand-bg font-black italic uppercase tracking-widest py-4 rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl">
          Record Series & Update ELO
        </Button>
      </div>

      {judgeCommentary.length > 0 && (
        <div className="bg-[#140c06] border-2 border-[#d3a03e] rounded-2xl p-6 font-mono text-[11px] space-y-3 text-[#ffb82b] shadow-2xl">
          <div className="flex items-center gap-2 border-b border-[#d3a03e]/30 pb-2 text-xs font-black uppercase tracking-wider">
            📜 СУДЕЙСКИЙ ЖУРНАЛ (Minecraft Arena Judge Logs)
          </div>
          <div className="space-y-2 divide-y divide-[#d3a03e]/10">
            {judgeCommentary.slice(0, 5).map((comment, index) => (
              <div key={index} className="leading-relaxed bg-[#1f1309] p-3 rounded-lg border border-[#d3a03e]/20 text-[#f5d082] mt-1">
                {comment}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h3 className="text-2xl font-black tracking-tighter italic uppercase text-white">Recent Matches</h3>
        <div className="grid gap-4">
          {(data.matches || []).map(m => {
            const player1 = data.players.find(p => p.id === m.player1Id);
            const player2 = data.players.find(p => p.id === m.player2Id);
            const tier = data.tiers.find(t => t.id === m.tierId);
            return (
              <div key={m.id} className="flex items-center justify-between p-6 rounded-3xl bg-brand-bg border border-brand-border group hover:border-brand-text-muted/30 transition-all">
                <div className="flex items-center gap-8">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-brand-text-muted uppercase tracking-widest mb-1">Category</span>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{tier?.name || 'Overall'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <img src={`https://mc-heads.net/avatar/${player1?.skinNickname || player1?.nickname || 'Unknown'}/32`} alt="" className="w-8 h-8 rounded-lg pixelated border border-brand-border shadow-lg" />
                      <span className={cn("font-bold tracking-tight", m.winnerId === m.player1Id ? "text-white" : "text-brand-text-muted")}>
                        {player1?.nickname || 'Unknown'}
                      </span>
                    </div>
                    <div className="px-4 py-2 bg-brand-card rounded-xl border border-brand-border font-black italic text-lg tracking-tighter text-white">
                      {m.score1 ?? '?'}-{m.score2 ?? '?'}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("font-bold tracking-tight", m.winnerId === m.player2Id ? "text-white" : "text-brand-text-muted")}>
                        {player2?.nickname || 'Unknown'}
                      </span>
                      <img src={`https://mc-heads.net/avatar/${player2?.skinNickname || player2?.nickname || 'Unknown'}/32`} alt="" className="w-8 h-8 rounded-lg pixelated border border-brand-border shadow-lg" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] font-bold text-brand-text-muted uppercase tracking-widest mb-1">ELO Change</span>
                    <div className="flex gap-4 font-black italic tracking-tighter">
                      <span className={cn(m.eloChange1 > 0 ? "text-emerald-400" : "text-red-400")}>{m.eloChange1 > 0 ? '+' : ''}{m.eloChange1}</span>
                      <span className={cn(m.eloChange2 > 0 ? "text-emerald-400" : "text-red-400")}>{m.eloChange2 > 0 ? '+' : ''}{m.eloChange2}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteMatch(m.id)} className="p-3 rounded-xl hover:bg-red-500/10 text-brand-text-muted hover:text-red-400 transition-all border border-transparent hover:border-red-500/20">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {!(data.matches?.length) && <div className="text-brand-text-muted text-sm italic">No matches recorded yet.</div>}
        </div>
      </div>
    </div>
  );
};

const PlayersAdmin: React.FC<{ 
  data: RatingData, 
  setData: React.Dispatch<React.SetStateAction<RatingData | null>>,
  showConfirm: (title: string, message: string, onConfirm: () => void) => void,
  showAlert: (title: string, message: string) => void
}> = ({ data, setData, showConfirm, showAlert }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Player>>({});

  const handleAdd = () => {
    const newPlayer: Player = {
      id: Math.random().toString(36).substr(2, 9),
      nickname: 'NewPlayer',
      skinNickname: '',
      points: 0,
      tournamentPoints: 0,
      elo: 1000,
      badge: '',
      tier: 'C',
      tierScores: {},
      history: []
    };
    setData(prev => {
      if (!prev) return prev;
      return { ...prev, players: [...prev.players, newPlayer] };
    });
    setEditingId(newPlayer.id);
    setEditForm(newPlayer);
  };

  const handleSave = () => {
    if (!editingId) return;
    
    let calculatedPoints = editForm.tournamentPoints || data.players.find(p => p.id === editingId)?.tournamentPoints || 0;
    if (editForm.tierScores) {
      Object.values(editForm.tierScores).forEach(t => {
        calculatedPoints += data.settings.tierValues?.[t as string] || 0;
      });
    }

    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        players: prev.players.map(p => p.id === editingId ? { ...p, ...editForm, points: calculatedPoints } as Player : p)
      };
    });
    setEditingId(null);
  };

  const handleRecalculate = () => {
    setData(prev => {
      if (!prev) return prev;
      const updatedPlayers = prev.players.map(p => {
        let pts = p.tournamentPoints || 0;
        if (p.tierScores) {
          Object.values(p.tierScores).forEach(t => {
            pts += prev.settings.tierValues?.[t as string] || 0;
          });
        }
        return { ...p, points: pts };
      });
      return { ...prev, players: updatedPlayers };
    });
    showAlert('Success', 'Points recalculated successfully!');
  };

  const handleDelete = (id: string) => {
    setData(prev => {
      if (!prev) return prev;
      return { ...prev, players: prev.players.filter(p => p.id !== id) };
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black tracking-tighter italic uppercase text-white">Players Management</h2>
        <div className="flex gap-3">
          <button onClick={handleRecalculate} className="px-6 py-3 bg-brand-bg border border-brand-border text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted hover:text-white hover:border-brand-text-muted/50 rounded-xl transition-all">
            Recalculate Points
          </button>
          <button onClick={handleAdd} className="px-8 py-3 bg-white text-brand-bg text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2">
            <Plus className="w-3 h-3"/> Add Player
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-3xl border border-brand-border bg-brand-bg shadow-inner">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-brand-border bg-white/[0.02]">
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Nickname / Skin</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Points</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Tourney Pts</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">ELO (All Tiers)</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Tier (All Tiers)</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Badge</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {data.players.map(player => (
              <tr key={player.id} className="group hover:bg-white/[0.01] transition-colors">
                {editingId === player.id ? (
                  <>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <input className="w-full bg-brand-card border border-brand-border text-white rounded-xl p-2 text-sm focus:ring-white focus:border-white outline-none" placeholder="Nickname" value={editForm.nickname || ''} onChange={e => setEditForm({...editForm, nickname: e.target.value})} />
                        <input className="w-full bg-brand-card border border-brand-border text-brand-text-muted rounded-xl p-2 text-xs focus:ring-white focus:border-white outline-none" placeholder="Skin Nickname" value={editForm.skinNickname || ''} onChange={e => setEditForm({...editForm, skinNickname: e.target.value})} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-brand-text-muted text-xs font-bold italic uppercase">Auto</td>
                    <td className="px-6 py-4">
                      <input type="number" className="w-24 bg-brand-card border border-brand-border text-white rounded-xl p-2 text-sm focus:ring-white focus:border-white outline-none" value={editForm.tournamentPoints || 0} onChange={e => setEditForm({...editForm, tournamentPoints: parseInt(e.target.value)})} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {data.tiers.map(t => {
                          if (t.id === 'overall') return null; // Hide overall ELO
                          return (
                            <div key={t.id} className="flex items-center gap-3">
                              <span className="text-[8px] font-bold text-brand-text-muted uppercase tracking-widest w-16 truncate">{t.name}</span>
                              <input 
                                type="number"
                                className="w-20 bg-brand-card border border-brand-border text-white rounded-lg p-1 text-xs focus:ring-white focus:border-white outline-none" 
                                placeholder="ELO" 
                                value={editForm.eloScores?.[t.id] || 1000} 
                                onChange={e => {
                                  const val = parseInt(e.target.value) || 0;
                                  setEditForm({...editForm, eloScores: {...(editForm.eloScores || {}), [t.id]: val}});
                                }} 
                              />
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {data.tiers.map(t => (
                          <div key={t.id} className="flex items-center gap-3">
                            <span className="text-[8px] font-bold text-brand-text-muted uppercase tracking-widest w-16 truncate">{t.name}</span>
                            <input 
                              className="w-20 bg-brand-card border border-brand-border text-white rounded-lg p-1 text-xs focus:ring-white focus:border-white outline-none" 
                              placeholder="Tier" 
                              value={t.id === 'overall' ? editForm.tier || '' : editForm.tierScores?.[t.id] || ''} 
                              onChange={e => {
                                if (t.id === 'overall') {
                                  setEditForm({...editForm, tier: e.target.value as any});
                                } else {
                                  setEditForm({...editForm, tierScores: {...(editForm.tierScores || {}), [t.id]: e.target.value}});
                                }
                              }} 
                            />
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4"><input className="w-24 bg-brand-card border border-brand-border text-white rounded-xl p-2 text-sm focus:ring-white focus:border-white outline-none" value={editForm.badge || ''} onChange={e => setEditForm({...editForm, badge: e.target.value})} /></td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <div className="flex justify-end gap-2">
                        <button onClick={handleSave} className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={`https://mc-heads.net/avatar/${player.skinNickname || player.nickname}/32`} alt="" className="w-8 h-8 rounded-lg pixelated border border-brand-border shadow-lg" />
                        <div className="flex flex-col">
                          <span className="font-bold text-white tracking-tight">{player.nickname}</span>
                          {player.skinNickname && <span className="text-[8px] font-bold text-brand-text-muted uppercase tracking-widest">{player.skinNickname}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black italic text-lg text-white tracking-tighter">{player.points}</td>
                    <td className="px-6 py-4 font-black italic text-lg text-white tracking-tighter">{player.tournamentPoints || 0}</td>
                     <td className="px-6 py-4">
                       <div className="flex flex-col gap-1">
                         {data.tiers.map(t => {
                           if (t.id === 'overall') return null; // Hide overall ELO
                           const val = player.eloScores?.[t.id];
                           if (val === undefined) return null;
                           return (
                             <div key={t.id} className="flex items-center gap-2 text-[8px] font-bold text-brand-text-muted uppercase tracking-widest">
                               <span>{t.name}:</span>
                               <span className="text-white">{val || 1000}</span>
                             </div>
                           );
                         })}
                       </div>
                     </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {data.tiers.map(t => {
                          const val = t.id === 'overall' ? player.tier : player.tierScores?.[t.id];
                          if (!val) return null;
                          const isMain = t.id === 'overall';
                          return (
                            <div 
                              key={t.id} 
                              className={cn(
                                "flex items-center gap-1 rounded px-1.5 py-0.5 border text-[8px] font-bold uppercase tracking-widest",
                                isMain ? "bg-white/10 border-white/20 text-white" : "bg-brand-card border-brand-border text-brand-text-muted scale-90 origin-left"
                              )}
                            >
                              {!isMain && <span className="opacity-60">{t.name}:</span>}
                              <span>{val}</span>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white font-bold text-xs italic">{player.badge}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setEditingId(player.id); setEditForm(player); }} className="p-2 rounded-xl hover:bg-white/5 text-brand-text-muted hover:text-white transition-all border border-transparent hover:border-brand-border">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => showConfirm('Delete Player', `Are you sure you want to delete ${player.nickname}?`, () => handleDelete(player.id))} className="p-2 rounded-xl hover:bg-red-500/10 text-brand-text-muted hover:text-red-400 transition-all border border-transparent hover:border-red-500/20">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TournamentsAdmin: React.FC<{ 
  data: RatingData, 
  setData: React.Dispatch<React.SetStateAction<RatingData | null>>,
  showConfirm: (title: string, message: string, onConfirm: () => void) => void,
  showAlert: (title: string, message: string) => void
}> = ({ data, setData, showConfirm, showAlert }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Tournament>>({});

  const handleAdd = () => {
    const newTournament: Tournament = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Tournament',
      date: new Date().toISOString().split('T')[0],
      places: { 1: [], 2: [], 3: [] }
    };
    setData(prev => {
      if (!prev) return prev;
      return { ...prev, tournaments: [...prev.tournaments, newTournament] };
    });
    setEditingId(newTournament.id);
    setEditForm(newTournament);
  };

  const handleSave = () => {
    if (!editingId) return;
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tournaments: prev.tournaments.map(t => t.id === editingId ? { ...t, ...editForm } as Tournament : t)
      };
    });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setData(prev => {
      if (!prev) return prev;
      return { ...prev, tournaments: prev.tournaments.filter(t => t.id !== id) };
    });
  };

  const handleApplyPoints = (tournament: Tournament) => {
    setData(prev => {
      if (!prev) return prev;
      const coeffs = prev.settings.tournamentCoefficients;
      const updatedPlayers = prev.players.map(p => {
        let addedPoints = 0;
        if (tournament.places[1]?.includes(p.id)) addedPoints = coeffs[1] || 0;
        if (tournament.places[2]?.includes(p.id)) addedPoints = coeffs[2] || 0;
        if (tournament.places[3]?.includes(p.id)) addedPoints = coeffs[3] || 0;
        
        if (addedPoints > 0) {
          const newTourneyPts = (p.tournamentPoints || 0) + addedPoints;
          const newTotalPts = p.points + addedPoints;
          return {
            ...p,
            tournamentPoints: newTourneyPts,
            points: newTotalPts,
            history: [
              ...p.history,
              { date: new Date().toISOString().split('T')[0], points: newTotalPts, elo: p.elo, position: 0 }
            ]
          };
        }
        return p;
      });
      return { ...prev, players: updatedPlayers };
    });
    showAlert('Success', 'Points applied successfully!');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black tracking-tighter italic uppercase text-white">Tournaments Management</h2>
        <button onClick={handleAdd} className="px-8 py-3 bg-white text-brand-bg text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2">
          <Plus className="w-3 h-3"/> Add Tournament
        </button>
      </div>
      <div className="overflow-x-auto rounded-3xl border border-brand-border bg-brand-bg shadow-inner">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-brand-border bg-white/[0.02]">
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Name</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Short Name</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Date</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">1st Place</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">2nd Place</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">3rd Place</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {data.tournaments.map(tournament => (
              <tr key={tournament.id} className="group hover:bg-white/[0.01] transition-colors">
                {editingId === tournament.id ? (
                  <>
                    <td className="px-6 py-4"><input className="w-full bg-brand-card border border-brand-border text-white rounded-xl p-2 text-sm focus:ring-white focus:border-white outline-none" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} /></td>
                    <td className="px-6 py-4"><input className="w-24 bg-brand-card border border-brand-border text-white rounded-xl p-2 text-sm focus:ring-white focus:border-white outline-none" placeholder="e.g. S1" value={editForm.shortName || ''} onChange={e => setEditForm({...editForm, shortName: e.target.value})} /></td>
                    <td className="px-6 py-4"><input type="date" className="w-32 bg-brand-card border border-brand-border text-white rounded-xl p-2 text-sm focus:ring-white focus:border-white outline-none" value={editForm.date || ''} onChange={e => setEditForm({...editForm, date: e.target.value})} /></td>
                    <td className="px-6 py-4">
                      <select 
                        multiple 
                        className="w-32 h-24 bg-brand-card border border-brand-border text-white rounded-xl p-2 text-xs focus:ring-white focus:border-white outline-none custom-scrollbar" 
                        value={editForm.places?.[1] || []} 
                        onChange={e => {
                          const values = Array.from((e.target as HTMLSelectElement).selectedOptions, option => option.value);
                          setEditForm({...editForm, places: { ...editForm.places!, 1: values }});
                        }}
                      >
                        {data.players.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        multiple 
                        className="w-32 h-24 bg-brand-card border border-brand-border text-white rounded-xl p-2 text-xs focus:ring-white focus:border-white outline-none custom-scrollbar" 
                        value={editForm.places?.[2] || []} 
                        onChange={e => {
                          const values = Array.from((e.target as HTMLSelectElement).selectedOptions, option => option.value);
                          setEditForm({...editForm, places: { ...editForm.places!, 2: values }});
                        }}
                      >
                        {data.players.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        multiple 
                        className="w-32 h-24 bg-brand-card border border-brand-border text-white rounded-xl p-2 text-xs focus:ring-white focus:border-white outline-none custom-scrollbar" 
                        value={editForm.places?.[3] || []} 
                        onChange={e => {
                          const values = Array.from((e.target as HTMLSelectElement).selectedOptions, option => option.value);
                          setEditForm({...editForm, places: { ...editForm.places!, 3: values }});
                        }}
                      >
                        {data.players.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={handleSave} className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 font-bold text-white tracking-tight">{tournament.name}</td>
                    <td className="px-6 py-4 text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">{tournament.shortName}</td>
                    <td className="px-6 py-4 text-xs font-bold text-brand-text-muted">{tournament.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[120px]">
                        {tournament.places[1]?.map(id => (
                          <span key={id} className="bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded border border-yellow-500/20 text-[8px] font-bold uppercase tracking-widest">
                            {data.players.find(p => p.id === id)?.nickname || id}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[120px]">
                        {tournament.places[2]?.map(id => (
                          <span key={id} className="bg-white/10 text-white px-2 py-1 rounded border border-white/20 text-[8px] font-bold uppercase tracking-widest">
                            {data.players.find(p => p.id === id)?.nickname || id}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[120px]">
                        {tournament.places[3]?.map(id => (
                          <span key={id} className="bg-orange-500/10 text-orange-400 px-2 py-1 rounded border border-orange-500/20 text-[8px] font-bold uppercase tracking-widest">
                            {data.players.find(p => p.id === id)?.nickname || id}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => handleApplyPoints(tournament)} className="px-3 py-1.5 bg-brand-card border border-brand-border text-[8px] font-bold uppercase tracking-widest text-brand-text-muted hover:text-white rounded-lg transition-all">
                          Apply Pts
                        </button>
                        <button onClick={() => { setEditingId(tournament.id); setEditForm(tournament); }} className="p-2 rounded-xl hover:bg-white/5 text-brand-text-muted hover:text-white transition-all border border-transparent hover:border-brand-border">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => showConfirm('Delete Tournament', `Are you sure?`, () => handleDelete(tournament.id))} className="p-2 rounded-xl hover:bg-red-500/10 text-brand-text-muted hover:text-red-400 transition-all border border-transparent hover:border-red-500/20">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TiersAdmin: React.FC<{ 
  data: RatingData, 
  setData: React.Dispatch<React.SetStateAction<RatingData | null>>,
  showConfirm: (title: string, message: string, onConfirm: () => void) => void,
  showAlert: (title: string, message: string) => void
}> = ({ data, setData, showConfirm, showAlert }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Tier>>({});

  const handleAdd = () => {
    const newTier: Tier = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Tier List'
    };
    setData(prev => {
      if (!prev) return prev;
      return { ...prev, tiers: [...prev.tiers, newTier] };
    });
    setEditingId(newTier.id);
    setEditForm(newTier);
  };

  const handleSave = () => {
    if (!editingId) return;
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tiers: prev.tiers.map(t => t.id === editingId ? { ...t, ...editForm } as Tier : t)
      };
    });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (id === 'overall') {
      showAlert('Error', 'Cannot delete overall tier');
      return;
    }
    setData(prev => {
      if (!prev) return prev;
      return { ...prev, tiers: prev.tiers.filter(t => t.id !== id) };
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black tracking-tighter italic uppercase text-white">Tier Lists Management</h2>
        <button onClick={handleAdd} className="px-8 py-3 bg-white text-brand-bg text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2">
          <Plus className="w-3 h-3"/> Add Tier List
        </button>
      </div>
      <div className="overflow-x-auto rounded-3xl border border-brand-border bg-brand-bg shadow-inner">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-brand-border bg-white/[0.02]">
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">ID</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Name</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Icon</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {data.tiers.map(tier => (
              <tr key={tier.id} className="group hover:bg-white/[0.01] transition-colors">
                {editingId === tier.id ? (
                  <>
                    <td className="px-6 py-4"><input className="w-full bg-brand-card border border-brand-border text-white rounded-xl p-2 text-sm focus:ring-white focus:border-white outline-none" value={editForm.id || ''} onChange={e => setEditForm({...editForm, id: e.target.value})} disabled={tier.id === 'overall'} /></td>
                    <td className="px-6 py-4"><input className="w-full bg-brand-card border border-brand-border text-white rounded-xl p-2 text-sm focus:ring-white focus:border-white outline-none" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} /></td>
                    <td className="px-6 py-4"><input className="w-24 bg-brand-card border border-brand-border text-white rounded-xl p-2 text-sm focus:ring-white focus:border-white outline-none" placeholder="e.g. 🪓" value={editForm.icon || ''} onChange={e => setEditForm({...editForm, icon: e.target.value})} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={handleSave} className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">{tier.id}</td>
                    <td className="px-6 py-4 font-bold text-white tracking-tight">{tier.name}</td>
                    <td className="px-6 py-4 text-2xl">{tier.icon}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setEditingId(tier.id); setEditForm(tier); }} className="p-2 rounded-xl hover:bg-white/5 text-brand-text-muted hover:text-white transition-all border border-transparent hover:border-brand-border">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {tier.id !== 'overall' && (
                          <button onClick={() => showConfirm('Delete Tier List', `Are you sure?`, () => handleDelete(tier.id))} className="p-2 rounded-xl hover:bg-red-500/10 text-brand-text-muted hover:text-red-400 transition-all border border-transparent hover:border-red-500/20">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ArchivesAdmin: React.FC<{ 
  data: RatingData, 
  setData: React.Dispatch<React.SetStateAction<RatingData | null>>,
  showConfirm: (title: string, message: string, onConfirm: () => void) => void,
  showAlert: (title: string, message: string) => void
}> = ({ data, setData, showConfirm, showAlert }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ArchiveSnapshot>>({});
  const [newArchiveName, setNewArchiveName] = useState('');
  const [newArchiveDate, setNewArchiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingArchivePlayersId, setEditingArchivePlayersId] = useState<string | null>(null);

  const handleSave = () => {
    if (!editingId) return;
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        archives: (prev.archives || []).map(a => a.id === editingId ? { ...a, ...editForm } as ArchiveSnapshot : a)
      };
    });
    setEditingId(null);
    showAlert('Success', 'Archive updated locally.');
  };

  const handleArchive = () => {
    if (!newArchiveName) return showAlert('Validation Error', 'Enter a name for the archive (e.g., Winter 2024)');
    showConfirm(
      'Create Archive',
      `Archive current players state as "${newArchiveName}" (${newArchiveDate})?`,
      () => {
        setData(prev => {
          if (!prev) return prev;
          const newArchive: ArchiveSnapshot = {
            id: Math.random().toString(36).substr(2, 9),
            name: newArchiveName,
            date: newArchiveDate,
            data: JSON.parse(JSON.stringify(prev.players))
          };
          return {
            ...prev,
            archives: [...(prev.archives || []), newArchive]
          };
        });
        setNewArchiveName('');
        showAlert('Success', 'Archive created successfully! Remember to "Save Changes" to apply it to the site.');
      }
    );
  };

  const handleDelete = (id: string) => {
    showConfirm(
      'Delete Archive',
      'Are you sure you want to delete this archive?',
      () => {
        setData(prev => {
          if (!prev) return prev;
          return { ...prev, archives: (prev.archives || []).filter(a => a.id !== id) };
        });
      }
    );
  };

  if (editingArchivePlayersId) {
    const archive = data.archives?.find(a => a.id === editingArchivePlayersId);
    if (!archive) return null;

    return (
      <div className="space-y-8">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setEditingArchivePlayersId(null)}
            className="px-6 py-3 bg-brand-card border border-brand-border text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted hover:text-white rounded-xl transition-all flex items-center gap-2"
          >
            ← Back to Archives
          </button>
          <h3 className="text-2xl font-black tracking-tighter italic uppercase text-white">
            Editing: <span className="text-brand-text-muted">{archive.name || archive.date}</span>
          </h3>
        </div>
        <div className="bg-brand-card/30 rounded-3xl border border-brand-border p-8">
          <PlayersAdmin 
            data={{ ...data, players: archive.data }} 
            showConfirm={showConfirm}
            showAlert={showAlert}
            setData={(update) => {
              setData(prev => {
                if (!prev) return prev;
                const currentArchive = prev.archives?.find(a => a.id === editingArchivePlayersId);
                if (!currentArchive) return prev;
                
                // Handle both functional and object updates
                let newDataPlayers: Player[];
                if (typeof update === 'function') {
                  const result = (update as any)({ ...prev, players: currentArchive.data });
                  newDataPlayers = result.players;
                } else {
                  newDataPlayers = (update as any).players;
                }

                return {
                  ...prev,
                  archives: (prev.archives || []).map(a => a.id === editingArchivePlayersId ? { ...a, data: newDataPlayers } : a)
                };
              });
            }} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="bg-brand-card rounded-3xl border border-brand-border p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <h3 className="text-xl font-black tracking-tighter italic uppercase text-white mb-6">Create New Archive Snapshot</h3>
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 space-y-2 w-full">
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Season Name</label>
            <input 
              className="w-full bg-brand-bg border border-brand-border text-white rounded-xl px-4 py-3 text-sm focus:ring-white focus:border-white outline-none transition-all" 
              value={newArchiveName} 
              onChange={e => setNewArchiveName(e.target.value)} 
              placeholder="e.g. Winter 2024"
            />
          </div>
          <div className="w-full md:w-48 space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Snapshot Date</label>
            <input 
              type="date"
              className="w-full bg-brand-bg border border-brand-border text-white rounded-xl px-4 py-3 text-sm focus:ring-white focus:border-white outline-none transition-all" 
              value={newArchiveDate} 
              onChange={e => setNewArchiveDate(e.target.value)} 
            />
          </div>
          <button 
            onClick={handleArchive} 
            className="w-full md:w-auto px-8 py-3 bg-white text-brand-bg text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
          >
            <Plus className="w-3 h-3"/> Snapshot State
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-black tracking-tighter italic uppercase text-white px-2">Existing Archives</h3>
        <div className="overflow-x-auto rounded-3xl border border-brand-border bg-brand-bg shadow-inner">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-border bg-white/[0.02]">
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Name</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Date</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Players Count</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {(data.archives || []).map(archive => (
                <tr key={archive.id} className="group hover:bg-white/[0.01] transition-colors">
                  {editingId === archive.id ? (
                    <>
                      <td className="px-6 py-4"><input className="w-full bg-brand-card border border-brand-border text-white rounded-xl p-2 text-sm focus:ring-white focus:border-white outline-none" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} /></td>
                      <td className="px-6 py-4"><input type="date" className="w-32 bg-brand-card border border-brand-border text-white rounded-xl p-2 text-sm focus:ring-white focus:border-white outline-none" value={editForm.date || ''} onChange={e => setEditForm({...editForm, date: e.target.value})} /></td>
                      <td className="px-6 py-4 text-xs font-bold text-brand-text-muted">{archive.data.length}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={handleSave} className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 font-bold text-white tracking-tight">{archive.name || 'Legacy Archive'}</td>
                      <td className="px-6 py-4 text-xs font-bold text-brand-text-muted">{archive.date}</td>
                      <td className="px-6 py-4 text-xs font-bold text-brand-text-muted">{archive.data.length}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => setEditingArchivePlayersId(archive.id)} className="px-3 py-1.5 bg-brand-card border border-brand-border text-[8px] font-bold uppercase tracking-widest text-brand-text-muted hover:text-white rounded-lg transition-all">
                            Edit Players
                          </button>
                          <button onClick={() => { setEditingId(archive.id); setEditForm(archive); }} className="p-2 rounded-xl hover:bg-white/5 text-brand-text-muted hover:text-white transition-all border border-transparent hover:border-brand-border">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => showConfirm('Delete Archive', 'Are you sure?', () => handleDelete(archive.id))} className="p-2 rounded-xl hover:bg-red-500/10 text-brand-text-muted hover:text-red-400 transition-all border border-transparent hover:border-red-500/20">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {(!data.archives || data.archives.length === 0) && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-brand-text-muted text-xs font-bold uppercase tracking-widest italic">No archives found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SettingsAdmin: React.FC<{ 
  data: RatingData, 
  setData: React.Dispatch<React.SetStateAction<RatingData | null>>,
  showConfirm: (title: string, message: string, onConfirm: () => void) => void,
  showAlert: (title: string, message: string) => void
}> = ({ data, setData, showConfirm, showAlert }) => {
  const [settings, setSettings] = useState(data.settings);

  const handleSave = () => {
    setData(prev => {
      if (!prev) return prev;
      return { ...prev, settings };
    });
    showAlert('Success', 'Settings updated locally. Click Save Changes to persist.');
  };

  return (
    <div className="space-y-12 max-w-2xl">
      <div className="space-y-8">
        <div className="space-y-3">
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Site Name</label>
          <input 
            className="w-full bg-brand-card border border-brand-border text-white rounded-2xl px-6 py-4 text-sm focus:ring-white focus:border-white outline-none transition-all shadow-inner"
            value={settings.siteName}
            onChange={e => setSettings({...settings, siteName: e.target.value})}
          />
        </div>
        <div className="space-y-3">
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Description</label>
          <textarea 
            className="w-full bg-brand-card border border-brand-border text-white rounded-2xl px-6 py-4 h-32 text-sm focus:ring-white focus:border-white outline-none transition-all shadow-inner custom-scrollbar"
            value={settings.description}
            onChange={e => setSettings({...settings, description: e.target.value})}
          />
        </div>
        <div className="space-y-3">
          <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">Tier Values (Points per tier)</label>
          <input 
            className="w-full bg-brand-card border border-brand-border text-white rounded-2xl px-6 py-4 font-mono text-xs focus:ring-white focus:border-white outline-none transition-all shadow-inner"
            placeholder="S:10, A:8, B:6, C:4, D:2"
            value={Object.entries(settings.tierValues || {}).map(([k,v]) => `${k}:${v}`).join(', ')}
            onChange={e => {
              const vals: Record<string, number> = {};
              e.target.value.split(',').forEach(pair => {
                const [k, v] = pair.split(':').map(s => s.trim());
                if (k && !isNaN(Number(v))) vals[k] = Number(v);
              });
              setSettings({...settings, tierValues: vals});
            }}
          />
          <p className="text-[10px] text-brand-text-muted italic">Format: TIER_NAME:POINTS, ...</p>
        </div>
      </div>
      <div className="pt-6">
        <button 
          onClick={handleSave}
          className="px-12 py-4 bg-white text-brand-bg text-[10px] font-bold uppercase tracking-[0.2em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl"
        >
          Update Settings
        </button>
      </div>
    </div>
  );
};
