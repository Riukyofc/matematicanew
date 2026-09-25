"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getQuizHistory } from "@/lib/firebase";

interface HistoryItem {
  quizId: string;
  lessonTitle?: string;
  trackTitle?: string;
  score: number;
  total: number;
  xpEarned: number;
  completedAt: { toDate?: () => Date };
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "perfect" | "passed" | "failed">("all");

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const h = await getQuizHistory(user.uid);
        setHistory(h as unknown as HistoryItem[]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const getPercentage = (item: HistoryItem) => item.total > 0 ? Math.round((item.score / item.total) * 100) : 0;
  
  const filtered = history.filter(item => {
    const pct = getPercentage(item);
    if (filter === "perfect") return pct === 100;
    if (filter === "passed") return pct >= 60 && pct < 100;
    if (filter === "failed") return pct < 60;
    return true;
  });

  const avgScore = history.length > 0
    ? Math.round(history.reduce((acc, h) => acc + getPercentage(h), 0) / history.length)
    : 0;
  
  const perfectCount = history.filter(h => getPercentage(h) === 100).length;
  const totalXp = history.reduce((acc, h) => acc + (h.xpEarned || 0), 0);

  return (
    <div className="max-w-3xl mx-auto py-6 animate-fade-up">
      <div className="mb-8">
        <h1 className="text-3xl font-black heading-gradient mb-1">Histórico</h1>
        <p className="text-sm font-medium text-[var(--color-text-muted)]">Acompanhe seu desempenho ao longo do tempo</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 animate-fade-up" style={{ animationDelay: "0.05s" }}>
        {[
          { label: "Quizzes", value: history.length, icon: "📝", color: "text-indigo-500" },
          { label: "Média", value: `${avgScore}%`, icon: "📊", color: "text-violet-500" },
          { label: "Perfeitos", value: perfectCount, icon: "💯", color: "text-emerald-500" },
          { label: "XP Ganho", value: totalXp, icon: "⚡", color: "text-yellow-500" },
        ].map((s, i) => (
          <div key={s.label} className="stat-card p-4 text-center animate-fade-up" style={{ animationDelay: `${0.05 + i * 0.04}s` }}>
            <div className="text-lg mb-0.5">{s.icon}</div>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-5 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        {([
          { id: "all", label: `Todos (${history.length})` },
          { id: "perfect", label: "Perfeitos 💯" },
          { id: "passed", label: "Aprovados ✅" },
          { id: "failed", label: "Revisitar 📖" },
        ] as { id: typeof filter; label: string }[]).map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === f.id ? "tab-active" : "tab-inactive"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* History List */}
      <div className="glass-card-static rounded-2xl p-5">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 skeleton" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3 animate-float">{filter === "all" ? "📭" : "🔍"}</div>
            <p className="text-base font-bold text-[var(--color-text-secondary)]">
              {filter === "all" ? "Nenhum quiz realizado ainda" : "Nenhum resultado nesta categoria"}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              {filter === "all" ? "Complete quizzes para ver seu histórico aqui!" : "Tente outro filtro"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item, i) => {
              const pct = getPercentage(item);
              const date = item.completedAt?.toDate ? item.completedAt.toDate().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
              const time = item.completedAt?.toDate ? item.completedAt.toDate().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";

              return (
                <div
                  key={`${item.quizId}-${i}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-all animate-fade-up"
                  style={{ animationDelay: `${0.15 + i * 0.03}s` }}
                >
                  {/* Score Circle */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-black shrink-0 shadow-inner border ${
                    pct === 100 ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/20" :
                    pct >= 60 ? "bg-blue-500/15 text-blue-500 border-blue-500/20" :
                    "bg-red-500/15 text-red-500 border-red-500/20"
                  }`}>
                    {pct}%
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{item.lessonTitle || "Quiz"}</p>
                    <div className="flex items-center gap-2 text-[10px] font-medium text-[var(--color-text-muted)]">
                      {item.trackTitle && <span>{item.trackTitle}</span>}
                      <span>·</span>
                      <span>{item.score}/{item.total} acertos</span>
                    </div>
                  </div>

                  {/* Date & XP */}
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-[var(--color-text-secondary)]">{date}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">{time}</p>
                    {item.xpEarned > 0 && (
                      <span className="text-[10px] font-bold text-yellow-500">+{item.xpEarned} XP</span>
                    )}
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
