"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDuelsForUser, createDuel, getAllStudents, Duel } from "@/lib/firebase";
import ArenaPlayer from "@/components/arena/ArenaPlayer";
import { useToast } from "@/components/Toast";

interface Student {
  uid: string;
  name?: string;
  level?: number;
}

export default function ArenaPage() {
  const { user, profile } = useAuth();
  const { addToast } = useToast();
  const [duels, setDuels] = useState<Duel[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDuel, setActiveDuel] = useState<Duel | null>(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [searchStudent, setSearchStudent] = useState("");

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [userDuels, allStudents] = await Promise.all([
        getDuelsForUser(user.uid),
        getAllStudents()
      ]);
      setDuels(userDuels);
      setStudents(allStudents.filter(s => s.uid !== user.uid));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user || !profile) return null;

  if (activeDuel) {
    return <ArenaPlayer duel={activeDuel} onClose={() => { setActiveDuel(null); loadData(); }} />;
  }

  const handleChallenge = async (opponentId: string) => {
    setChallengeLoading(true);
    try {
      const oppName = students.find(s => s.uid === opponentId)?.name || "Oponente";
      const myName = user.displayName || profile.name || "Você";
      await createDuel(user.uid, myName as string, opponentId, oppName);
      setShowChallengeModal(false);
      addToast("success", `⚔️ Duelo criado contra ${oppName}!`);
      loadData();
    } catch (err) {
      console.error("Erro ao criar duelo", err);
      addToast("error", "Erro ao criar duelo");
    }
    setChallengeLoading(false);
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

  const filteredStudents = students.filter(s => 
    !searchStudent.trim() || (s.name || "").toLowerCase().includes(searchStudent.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚔️</span>
          <div>
            <h1 className="text-2xl font-black">Arena</h1>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>Desafie alunos e ganhe XP!</p>
          </div>
        </div>
        <button
          onClick={() => setShowChallengeModal(true)}
          className="btn-primary flex items-center justify-center gap-2 px-5 py-2.5 text-sm"
        >
          ⚡ Desafiar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {[
          { label: "Jogados", value: duelsPlayed, emoji: "🎮" },
          { label: "Vitórias", value: duelsWon, emoji: "🏆" },
          { label: "Derrotas", value: duelsLost, emoji: "💔" },
          { label: "Win Rate", value: `${winRate}%`, emoji: "📊" },
          { label: "Moedas", value: Number(profile.coins) || 0, emoji: "🪙" },
        ].map((s) => (
          <div key={s.label} className="card-flat p-3 text-center">
            <span className="text-base">{s.emoji}</span>
            <p className="text-lg font-black" style={{ color: "var(--color-text)" }}>{s.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => <div key={i} className="h-40 skeleton" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          {/* My Turn */}
          <div className="card p-4" style={{ borderTop: "3px solid var(--color-success)" }}>
            <h2 className="text-base font-black mb-3 flex items-center gap-2">
              ▶️ Sua Vez
              {myTurnDuels.length > 0 && <span className="badge badge-success text-[9px]">{myTurnDuels.length}</span>}
            </h2>
            <div className="space-y-2">
              {myTurnDuels.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-2xl mb-1">😴</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>Nenhum duelo pendente</p>
                </div>
              ) : (
                myTurnDuels.map(duel => {
                  const opponent = duel.challengerId === user.uid ? duel.opponentId : duel.challengerId;
                  const oppName = students.find(s => s.uid === opponent)?.name || 
                                  (duel.challengerId === user.uid ? "Oponente" : "Desafiante");
                  return (
                    <div key={duel.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--color-bg)", border: "2px solid var(--color-success)" }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: "var(--color-error)" }}>
                          {oppName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm">vs {oppName}</p>
                          <p className="text-[10px] font-semibold" style={{ color: "var(--color-text-muted)" }}>🪙 {duel.coinsReward} moedas</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setActiveDuel(duel)} 
                        className="btn-primary px-3 py-1.5 text-xs"
                      >
                        Jogar ⚡
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Waiting for Opponent */}
          <div className="card p-4" style={{ borderTop: "3px solid var(--color-warning)" }}>
            <h2 className="text-base font-black mb-3 flex items-center gap-2">
              ⏳ Aguardando
              {waitingForOpponent.length > 0 && <span className="badge badge-warning text-[9px]">{waitingForOpponent.length}</span>}
            </h2>
            <div className="space-y-2">
              {waitingForOpponent.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-2xl mb-1">✅</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>Nenhum duelo na espera</p>
                </div>
              ) : (
                waitingForOpponent.map(duel => {
                  const opponent = duel.challengerId === user.uid ? duel.opponentId : duel.challengerId;
                  const oppName = students.find(s => s.uid === opponent)?.name || "Oponente";
                  return (
                    <div key={duel.id} className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: "var(--color-bg)", border: "2px dashed var(--color-warning)" }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: "var(--color-warning)" }}>
                        {oppName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm">Aguardando {oppName}</p>
                        <p className="text-[10px] font-semibold" style={{ color: "var(--color-text-muted)" }}>Você já jogou ✓</p>
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {completedDuels.slice(0, 6).map((duel, i) => {
              const iWon = duel.winnerId === user.uid;
              const isDraw = !duel.winnerId;
              const opponent = duel.challengerId === user.uid ? duel.opponentId : duel.challengerId;
              const oppName = students.find(s => s.uid === opponent)?.name || "Oponente";
              
              return (
                <div key={duel.id} className="card-flat p-3 animate-fade-up" style={{ animationDelay: `${0.15 + i * 0.04}s`, borderLeft: `3px solid ${iWon ? "var(--color-success)" : isDraw ? "var(--color-warning)" : "var(--color-error)"}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`badge ${iWon ? "badge-success" : isDraw ? "badge-warning" : "badge-error"}`}>
                      {iWon ? "VITÓRIA" : isDraw ? "EMPATE" : "DERROTA"}
                    </span>
                    {iWon && <span className="text-xs font-bold" style={{ color: "#d4a017" }}>+{duel.coinsReward} 🪙</span>}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ background: iWon ? "var(--color-success)" : isDraw ? "var(--color-warning)" : "var(--color-error)" }}>
                      {oppName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold">vs {oppName}</p>
                      <p className="text-[10px] font-semibold" style={{ color: "var(--color-text-muted)" }}>🪙 {duel.coinsReward}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Challenge Modal */}
      {showChallengeModal && (
        <div className="modal-backdrop" onClick={() => setShowChallengeModal(false)}>
          <div className="card p-5 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚔️</span>
                <h3 className="text-lg font-black">Escolher Oponente</h3>
              </div>
              <button onClick={() => setShowChallengeModal(false)} className="p-1.5 rounded-lg cursor-pointer text-lg" style={{ color: "var(--color-text-muted)" }}>✕</button>
            </div>

            <input
              value={searchStudent}
              onChange={e => setSearchStudent(e.target.value)}
              placeholder="Buscar aluno..."
              className="input-clean mb-3 shrink-0"
            />
            
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-2xl mb-1">🔍</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>Nenhum aluno encontrado</p>
                </div>
              ) : (
                filteredStudents.map(student => (
                  <div key={student.uid} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ background: "var(--color-primary)" }}>
                        {(student.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-sm">{student.name}</span>
                    </div>
                    <button
                      disabled={challengeLoading}
                      onClick={() => handleChallenge(student.uid)}
                      className="btn-primary px-3 py-1.5 text-xs disabled:opacity-50"
                    >
                      ⚔️ Desafiar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
