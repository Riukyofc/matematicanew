"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getLeaderboard } from "@/lib/firebase";

export default function LeaderboardPage() {
  const { user, profile } = useAuth();
  const userName = profile?.name as string | undefined;

  const [players, setPlayers] = useState<{ uid: string; name: string; xp: number; level: number; pos: number; equippedTitle?: string; equippedBorder?: string; coins?: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getLeaderboard(20);
        setPlayers(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const myPosition = players.findIndex(p => p.uid === user?.uid) + 1;
  const top3 = players.slice(0, 3);
  const rest = players.slice(3);

  return (
    <div className="max-w-3xl mx-auto py-4 animate-fade-up">
      {/* Header */}
      <div className="text-center mb-6">
        <span className="text-4xl">🏆</span>
        <h1 className="text-2xl font-black mt-2">Ranking</h1>
        <p className="text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>Os alunos mais dedicados!</p>
      </div>

      {/* Your Position */}
      {myPosition > 0 && (
        <div className="glass-card-premium p-4 mb-6 flex items-center justify-between animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-subtle)] flex items-center justify-center font-black text-[var(--color-accent)] border border-[var(--color-accent-glow)]">
              #{myPosition}
            </div>
            <div>
              <p className="text-sm font-bold">Sua Posição</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {myPosition <= 3 ? "🎉 Você está no pódio!" : myPosition <= 10 ? "💪 Top 10!" : "Continue subindo!"}
              </p>
            </div>
          </div>
          <p className="text-xl font-black heading-gradient">{Number(profile?.xp) || 0} XP</p>
        </div>
      )}

      {/* Podium (Top 3) */}
      {!loading && top3.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-8 animate-fade-up" style={{ animationDelay: "0.15s" }}>
          {/* 2nd Place */}
          <div className="flex flex-col items-center w-28">
            <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 text-white flex items-center justify-center font-bold text-lg shadow-md mb-2 ${top3[1].equippedBorder || ''}`}>
              {top3[1].name.charAt(0).toUpperCase()}
            </div>
            <p className="text-xs font-bold truncate w-full text-center">{top3[1].name}</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">{top3[1].xp} XP</p>
            <div className="w-full h-16 mt-2 rounded-t-xl podium-silver flex items-center justify-center">
              <span className="text-2xl">🥈</span>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center w-32">
            <div className="relative mb-2">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-white flex items-center justify-center font-bold text-xl shadow-lg animate-glow-pulse ${top3[0].equippedBorder || ''}`}>
                {top3[0].name.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -top-3 -right-1 text-xl animate-float">👑</div>
            </div>
            <p className="text-sm font-black truncate w-full text-center">{top3[0].name}</p>
            {top3[0].equippedTitle && (
              <p className="text-[9px] font-black heading-gradient-warm">{top3[0].equippedTitle}</p>
            )}
            <p className="text-[10px] font-bold text-yellow-500">{top3[0].xp} XP</p>
            <div className="w-full h-24 mt-2 rounded-t-xl podium-gold flex items-center justify-center">
              <span className="text-3xl">🥇</span>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center w-28">
            <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-orange-600 to-orange-700 text-white flex items-center justify-center font-bold text-lg shadow-md mb-2 ${top3[2].equippedBorder || ''}`}>
              {top3[2].name.charAt(0).toUpperCase()}
            </div>
            <p className="text-xs font-bold truncate w-full text-center">{top3[2].name}</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">{top3[2].xp} XP</p>
            <div className="w-full h-12 mt-2 rounded-t-xl podium-bronze flex items-center justify-center">
              <span className="text-2xl">🥉</span>
            </div>
          </div>
        </div>
      )}

      {/* Rest of Leaderboard */}
      <div className="glass-card-static rounded-2xl p-5">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 skeleton" />
            ))}
          </div>
        ) : rest.length === 0 && top3.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3 animate-float">🏆</div>
            <p className="text-[var(--color-text-muted)] font-medium">Nenhum aluno cadastrado ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rest.map((p, i) => {
              const isYou = p.uid === user?.uid;
              
              return (
                <div 
                  key={p.uid} 
                  className={`flex items-center gap-4 p-3.5 rounded-xl transition-all duration-300
                    ${isYou ? "bg-[var(--color-accent-subtle)] border border-[var(--color-accent-glow)]" : "bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)]"} animate-fade-up`}
                  style={{ animationDelay: `${0.3 + i * 0.03}s` }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black bg-[var(--color-bg-card)] text-[var(--color-text-muted)] shrink-0">
                    {i + 4}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0 ${p.equippedBorder || ''}`}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate flex items-center gap-2">
                        {p.name}
                        {isYou && <span className="badge badge-accent text-[8px]">Você</span>}
                      </p>
                      {p.equippedTitle && (
                        <p className="text-[9px] font-black heading-gradient-warm">{p.equippedTitle}</p>
                      )}
                      <p className="text-[10px] font-bold text-[var(--color-text-muted)]">Nível {p.level}</p>
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <p className="text-base font-black text-[var(--color-accent)]">{p.xp.toLocaleString()}</p>
                    <p className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">XP</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
