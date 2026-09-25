"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDailyMissions, getWeeklyMissions, checkMissionProgress, type Mission } from "@/lib/missions";
import { getMissionStats, claimMissionReward } from "@/lib/firebase";
import { useToast } from "@/components/Toast";
import Link from "next/link";

export default function MissionsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [daily, setDaily] = useState<Mission[]>([]);
  const [weekly, setWeekly] = useState<Mission[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const missionStats = await getMissionStats(user.uid);
    setStats(missionStats);
    setDaily(getDailyMissions());
    setWeekly(getWeeklyMissions());
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleClaim = async (m: Mission) => {
    if (!user) return;
    try {
      await claimMissionReward(user.uid, m.id, m.xpReward, m.coinReward, m.period);
      addToast("achievement", `Missão cumprida! +${m.xpReward} XP e +${m.coinReward} moedas`);
      load();
    } catch (e) {
      addToast("error", "Erro ao resgatar recompensa.");
    }
  };

  const getProgress = (m: Mission) => {
    if (!stats || !stats.dailyStats) return { current: 0, completed: false };
    const s = m.period === "weekly" ? stats.weeklyStats : stats.dailyStats;
    return checkMissionProgress(m, {
      quizzes: s?.quizzes || 0,
      perfectQuizzes: s?.perfectQuizzes || 0,
      studyMinutes: s?.studyMinutes || 0,
      practiceQuestions: s?.practiceQuestions || 0,
      blitzGames: s?.blitzGames || 0,
      arenaWins: s?.arenaWins || 0,
      xpEarned: s?.xpEarned || 0,
      streak: s?.streak || 0
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="h-32 skeleton" />
        <div className="h-64 skeleton" />
      </div>
    );
  }

  const claimed = [...(stats?.dailyStats?.claimedMissions || []), ...(stats?.weeklyStats?.claimedMissions || [])];
  const claimedCount = claimed.length;
  const totalMissions = daily.length + weekly.length;

  const renderMission = (m: Mission) => {
    const progress = getProgress(m);
    const isClaimed = claimed.includes(m.id);
    const pct = Math.min((progress.current / m.target) * 100, 100);

    return (
      <div key={m.id} className="mission-card flex items-center gap-4 p-4 rounded-2xl border-2 border-[var(--color-border)] transition-all hover:-translate-y-1" style={{ background: "var(--color-surface)" }}>
        <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-2xl text-3xl" style={{ background: "var(--color-bg)" }}>
          {m.emoji}
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-start mb-1">
            <div>
              <p className="text-sm font-black text-[var(--color-text)]">{m.title}</p>
              <p className="text-[11px] font-bold" style={{ color: "var(--color-text-muted)" }}>{m.description}</p>
            </div>
            <div className="text-right flex gap-2">
              <span className="text-[10px] font-black px-2 py-1 rounded bg-[var(--color-primary)]/10" style={{ color: "var(--color-primary)" }}>
                +{m.xpReward} XP
              </span>
              <span className="text-[10px] font-black px-2 py-1 rounded bg-[var(--color-coins)]/10" style={{ color: "var(--color-coins)" }}>
                +{m.coinReward} 🪙
              </span>
            </div>
          </div>
          
          <div className="mt-3">
            {isClaimed ? (
              <div className="w-full flex justify-center py-2 rounded-lg" style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}>
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-2">✓ Recompensa Resgatada</span>
              </div>
            ) : progress.completed ? (
              <button 
                onClick={() => handleClaim(m)}
                className="w-full btn-primary py-2 text-xs flex items-center justify-center gap-2 animate-pulse"
                style={{ borderRadius: "var(--radius)" }}
              >
                Resgatar Recompensa ▸
              </button>
            ) : (
              <div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                  <span>Progresso</span>
                  <span>{progress.current} / {m.target}</span>
                </div>
                <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "var(--color-divider)" }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "var(--color-primary)" }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link href="/dashboard" className="w-10 h-10 rounded-full bg-[var(--color-surface)] flex items-center justify-center hover:bg-[var(--color-border)] transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <div>
          <h1 className="text-3xl font-black">Missões e Objetivos</h1>
          <p className="text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>
            Complete tarefas para ganhar mais experiência
          </p>
        </div>
      </div>

      {/* Progress Banner */}
      <div className="card p-6 border-b-4" style={{ borderColor: "var(--color-primary)" }}>
        <div className="flex flex-col sm:flex-row gap-6 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ background: "var(--color-primary-bg)" }}>
              🎯
            </div>
            <div>
              <p className="text-xl font-black">Missões Concluídas</p>
              <p className="text-sm font-bold mt-1" style={{ color: "var(--color-text-muted)" }}>{claimedCount} de {totalMissions} resgatadas</p>
            </div>
          </div>
          
          <div className="w-full sm:w-1/3">
            <div className="h-3 w-full rounded-full overflow-hidden" style={{ background: "var(--color-divider)" }}>
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(claimedCount/totalMissions)*100}%`, background: "var(--color-primary)" }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Daily Missions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-black">Missões Diárias</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase" style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>24h</span>
          </div>
          {daily.map(renderMission)}
        </div>

        {/* Weekly Missions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-black">Missões Semanais</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase" style={{ background: "var(--color-warning-bg)", color: "var(--color-warning)" }}>7 Dias</span>
          </div>
          {weekly.map(renderMission)}
        </div>
      </div>
    </div>
  );
}
