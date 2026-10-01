"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDuelsForUser, joinArenaQueue, leaveArenaQueue, Duel, getAllStudents } from "@/lib/firebase";
import ArenaPlayer from "@/components/arena/ArenaPlayer";
import { useToast } from "@/components/Toast";
import { sounds } from "@/lib/soundEngine";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ArenaPage() {
  const { user, profile } = useAuth();
  const { addToast } = useToast();
  const [duels, setDuels] = useState<Duel[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDuel, setActiveDuel] = useState<Duel | null>(null);
  
  // Fila
  const [inQueue, setInQueue] = useState(false);
  const [queueTimer, setQueueTimer] = useState(0);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [userDuels, allStudents] = await Promise.all([
        getDuelsForUser(user.uid),
        getAllStudents()
      ]);
      setDuels(userDuels);
      setStudents(allStudents);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listener para quando estiver na fila
  useEffect(() => {
    if (!inQueue || !user) return;
    
    let interval = setInterval(() => setQueueTimer(t => t + 1), 1000);
    
    // Escuta no documento de arena_queue_match para ver se fomos escolhidos
    const unsub = onSnapshot(doc(db, "arena_queue_match", user.uid), async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.duelId) {
          sounds.playWin();
          addToast("success", "⚔️ Oponente encontrado!");
          setInQueue(false);
          await loadData();
          
          // Achar o duelo novo
          setTimeout(async () => {
             const userDuels = await getDuelsForUser(user.uid);
             const newDuel = userDuels.find(d => d.id === data.duelId);
             if (newDuel) setActiveDuel(newDuel);
          }, 500);
        }
      }
    });

    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [inQueue, user, addToast, loadData]);

  // Cleanup na saída
  useEffect(() => {
    return () => {
      if (inQueue && user) {
        leaveArenaQueue(user.uid);
      }
    };
  }, [inQueue, user]);

  if (!user || !profile) return null;

  if (activeDuel) {
    return <ArenaPlayer duel={activeDuel} onClose={() => { setActiveDuel(null); loadData(); }} />;
  }

  const handleJoinQueue = async () => {
    sounds.playClick();
    setInQueue(true);
    setQueueTimer(0);
    try {
      const myName = user.displayName || profile.name || "Você";
      const result = await joinArenaQueue(user.uid, myName);
      
      if (!result.waiting && result.duelId) {
        // Já achou alguém logo de cara
        sounds.playWin();
        addToast("success", "⚔️ Oponente encontrado imediatamente!");
        setInQueue(false);
        await loadData();
        const userDuels = await getDuelsForUser(user.uid);
        const newDuel = userDuels.find(d => d.id === result.duelId);
        if (newDuel) setActiveDuel(newDuel);
      }
    } catch (err) {
      console.error(err);
      addToast("error", "Erro ao entrar na fila");
      setInQueue(false);
    }
  };

  const handleCancelQueue = async () => {
    sounds.playClick();
    setInQueue(false);
    await leaveArenaQueue(user.uid);
  };

  const pendingDuels = duels.filter(d => d.status === "pending" || d.status === "in_progress");
  const completedDuels = duels.filter(d => d.status === "completed");

  const myTurnDuels = pendingDuels.filter(d => {
    const isChallenger = d.challengerId === user.uid;
    if (isChallenger) return !d.challengerResult;
    return !d.opponentResult;
  });

  const waitingForOpponent = pendingDuels.filter(d => {
    const isChallenger = d.challengerId === user.uid;
    if (isChallenger) return !!d.challengerResult;
    return !!d.opponentResult;
  });

  const duelsPlayed = Number(profile.duelsPlayed) || 0;
  const duelsWon = Number(profile.duelsWon) || 0;
  const duelsLost = Number(profile.duelsLost) || 0;
  const winRate = duelsPlayed > 0 ? Math.round((duelsWon / duelsPlayed) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-4xl animate-bounce-in">⚔️</span>
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Arena</h1>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>Desafie alunos online e ganhe recompensas!</p>
          </div>
        </div>
        
        {inQueue ? (
          <button onClick={handleCancelQueue} className="btn-primary hover-scale px-6 py-3 rounded-full flex items-center justify-center gap-2" style={{ background: "var(--color-error)" }}>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Buscando Oponente ({queueTimer}s)
          </button>
        ) : (
          <button onClick={handleJoinQueue} className="btn-primary hover-scale hover-glow px-6 py-3 rounded-full flex items-center justify-center gap-2">
            <span>🎮</span> Procurar Partida
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-children">
        {[
          { label: "Vitórias", value: duelsWon, icon: "🏆", color: "text-amber-500" },
          { label: "Derrotas", value: duelsLost, icon: "💀", color: "text-red-500" },
          { label: "Total Jogado", value: duelsPlayed, icon: "⚔️", color: "text-indigo-500" },
          { label: "Taxa de Vitória", value: `${winRate}%`, icon: "📈", color: "text-emerald-500" }
        ].map((stat, i) => (
          <div key={i} className="card p-4 hover-lift">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xl ${stat.color}`}>{stat.icon}</span>
              <p className="text-2xl font-black">{stat.value}</p>
            </div>
            <p className="text-[10px] font-bold text-right uppercase" style={{ color: "var(--color-text-muted)" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Active Duels */}
      {!loading && pendingDuels.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* My Turn */}
          <div className="card p-5" style={{ borderTop: "3px solid var(--color-success)" }}>
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              Sua Vez de Jogar
              {myTurnDuels.length > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-500">{myTurnDuels.length}</span>}
            </h2>
            <div className="space-y-3">
              {myTurnDuels.length === 0 ? (
                <div className="text-center py-8 opacity-50">
                  <p className="text-3xl mb-2">😴</p>
                  <p className="text-sm font-bold">Nenhum duelo esperando você</p>
                </div>
              ) : (
                myTurnDuels.map(duel => {
                  const opponent = duel.challengerId === user.uid ? duel.opponentId : duel.challengerId;
                  const oppName = students.find(s => s.uid === opponent)?.name || "Oponente";
                  return (
                    <div key={duel.id} className="flex items-center justify-between p-4 rounded-xl border-2 border-[var(--color-success)] bg-[var(--color-bg)] hover-lift">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm bg-rose-500 shadow-md">
                          {oppName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-sm">vs {oppName}</p>
                          <p className="text-xs font-bold" style={{ color: "var(--color-text-muted)" }}>💰 {duel.coinsReward} moedas</p>
                        </div>
                      </div>
                      <button onClick={() => { sounds.playClick(); setActiveDuel(duel); }} className="btn-primary px-4 py-2 text-xs hover-scale">
                        Jogar ⚔️
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Waiting for Opponent */}
          <div className="card p-5" style={{ borderTop: "3px solid var(--color-warning)" }}>
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              Aguardando Oponente
              {waitingForOpponent.length > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-500">{waitingForOpponent.length}</span>}
            </h2>
            <div className="space-y-3">
              {waitingForOpponent.length === 0 ? (
                <div className="text-center py-8 opacity-50">
                  <p className="text-3xl mb-2">👀</p>
                  <p className="text-sm font-bold">Nenhum duelo na espera</p>
                </div>
              ) : (
                waitingForOpponent.map(duel => {
                  const opponent = duel.challengerId === user.uid ? duel.opponentId : duel.challengerId;
                  const oppName = students.find(s => s.uid === opponent)?.name || "Oponente";
                  return (
                    <div key={duel.id} className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-[var(--color-warning)] bg-[var(--color-bg)] opacity-75">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm bg-amber-500">
                        {oppName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-sm">Aguardando {oppName}</p>
                        <p className="text-xs font-bold" style={{ color: "var(--color-text-muted)" }}>Você já jogou</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completed Duels History */}
      {!loading && completedDuels.length > 0 && (
        <div className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <span>📜</span> Histórico de Batalhas
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {completedDuels.slice(0, 9).map((duel, i) => {
              const iWon = duel.winnerId === user.uid;
              const isDraw = !duel.winnerId;
              const opponent = duel.challengerId === user.uid ? duel.opponentId : duel.challengerId;
              const oppName = students.find(s => s.uid === opponent)?.name || "Oponente";
              
              const borderCol = iWon ? "border-emerald-500" : isDraw ? "border-amber-500" : "border-rose-500";
              const bgCol = iWon ? "bg-emerald-500" : isDraw ? "bg-amber-500" : "bg-rose-500";
              
              return (
                <div key={duel.id} className={`card p-4 border-l-4 ${borderCol} hover-lift`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-1 rounded text-[9px] font-black text-white ${bgCol}`}>
                      {iWon ? "VITÓRIA" : isDraw ? "EMPATE" : "DERROTA"}
                    </span>
                    {iWon && <span className="text-xs font-black text-amber-500 animate-pulse">+{duel.coinsReward} 💰</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${bgCol}`}>
                      {oppName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black">vs {oppName}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
