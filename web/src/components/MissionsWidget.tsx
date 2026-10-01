"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDailyMissions, checkMissionProgress, type Mission } from "@/lib/missions";
import { getMissionStats, claimMissionReward } from "@/lib/firebase";
import { useToast } from "@/components/Toast";
import Link from "next/link";

export default function MissionsWidget() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confetti, setConfetti] = useState(false);

  const COLORS = ["#e17055", "#fdcb6e", "#00b894", "#0984e3", "#6c5ce7", "#fd79a8"];
  const pieces = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    id: i, color: COLORS[i % COLORS.length], left: `${5 + Math.random() * 90}%`, delay: `${Math.random() * 0.4}s`,
  })), []);

  const load = useCallback(async () => {
    if (!user) return;
    const missionStats = await getMissionStats(user.uid);
    setStats(missionStats);
    setMissions(getDailyMissions());
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleClaim = async (m: Mission) => {
    if (!user) return;
    try {
      await claimMissionReward(user.uid, m.id, m.xpReward, m.coinReward, m.period);
      setConfetti(true);
      setTimeout(() => setConfetti(false), 1800);
      addToast("achievement", `Missão cumprida! +${m.xpReward} XP e +${m.coinReward} moedas`);
      load(); // recarrega para atualizar o botão
    } catch (e) {
      addToast("error", "Erro ao resgatar recompensa.");
    }
  };

  if (loading) return <div className="card p-4 h-48 skeleton" />;

  const claimed = stats?.dailyStats?.claimedMissions || [];
  
  // Calcula progresso seguro
  const getProgress = (m: Mission) => {
    if (!stats || !stats.dailyStats) return { current: 0, completed: false };
    const s = m.period === "weekly" ? stats.weeklyStats : stats.dailyStats;
    const p = checkMissionProgress(m, {
      quizzes: s?.quizzes || 0,
      perfectQuizzes: s?.perfectQuizzes || 0,
      studyMinutes: s?.studyMinutes || 0,
      practiceQuestions: s?.practiceQuestions || 0,
      blitzGames: s?.blitzGames || 0,
      arenaWins: s?.arenaWins || 0,
      xpEarned: s?.xpEarned || 0,
      streak: s?.streak || 0 // Streak geralmente vem do profile, mas podemos usar se disponivel
    });
    return p;
  };

  return (
    <div className="card p-4 relative overflow-hidden hover-lift">
      {confetti && (
        <div className="confetti-container">
          {pieces.map(p => <div key={p.id} className="confetti-piece" style={{ left: p.left, top: "30%", backgroundColor: p.color, animationDelay: p.delay }} />)}
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <div>
            <p className="text-sm font-bold">Missões Diárias</p>
            <p className="text-[10px] font-semibold" style={{ color: "var(--color-text-muted)" }}>
              Ganhe XP e moedas extras
            </p>
          </div>
        </div>
        <Link href="/missions" className="text-xs font-bold px-2 py-1 rounded hover:bg-black/5" style={{ color: "var(--color-primary)" }}>
          Ver todas ▸
        </Link>
      </div>

      <div className="space-y-3 stagger-children">
        {missions.map(m => {
          const progress = getProgress(m);
          const isClaimed = claimed.includes(m.id);
          const pct = Math.min((progress.current / m.target) * 100, 100);

          return (
            <div key={m.id} className="mission-card flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] hover-lift" style={{ background: "var(--color-surface)" }}>
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl text-xl" style={{ background: "var(--color-bg)" }}>
                {m.emoji}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs font-bold truncate pr-2">{m.title}</p>
                  <p className="text-[10px] font-black whitespace-nowrap" style={{ color: "var(--color-coins)" }}>+{m.xpReward} XP</p>
                </div>
                
                {isClaimed ? (
                  <p className="text-[10px] font-bold text-[var(--color-success)] flex items-center gap-1">
                    ✓ Resgatado
                  </p>
                ) : progress.completed ? (
                  <button 
                    onClick={() => handleClaim(m)}
                    className="w-full text-[10px] font-black py-1.5 rounded uppercase tracking-wider text-white mt-1 cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ background: "var(--color-primary)" }}
                  >
                    Resgatar
                  </button>
                ) : (
                  <div>
                    <div className="flex justify-between text-[9px] font-bold mb-1" style={{ color: "var(--color-text-muted)" }}>
                      <span>{m.description}</span>
                      <span>{progress.current}/{m.target}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "var(--color-divider)" }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "var(--color-primary)" }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
