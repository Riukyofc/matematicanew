"use client";

import { useAuth } from "@/contexts/AuthContext";
import { ACHIEVEMENTS, type AchievementCategory } from "@/lib/achievements";
import { useState } from "react";
import Link from "next/link";

const CATEGORIES: { id: AchievementCategory | "all", label: string, emoji: string }[] = [
  { id: "all", label: "Todas", emoji: "⭐" },
  { id: "study", label: "Aprendizado", emoji: "📚" },
  { id: "performance", label: "Performance", emoji: "⚡" },
  { id: "arena", label: "Arena", emoji: "⚔️" },
  { id: "social", label: "Consistência", emoji: "🔥" },
];

export default function AchievementsPage() {
  const { profile } = useAuth();
  const [filter, setFilter] = useState<AchievementCategory | "all">("all");
  
  const unlockedIds = (profile?.unlockedAchievements as string[]) || [];
  
  const achievements = ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: unlockedIds.includes(a.id) || a.check(profile, {}),
  }));
  
  const filtered = filter === "all" ? achievements : achievements.filter(a => a.category === filter);
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const progress = Math.round((unlockedCount / achievements.length) * 100) || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link href="/dashboard" className="w-10 h-10 rounded-full bg-[var(--color-surface)] flex items-center justify-center hover:bg-[var(--color-border)] transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <div>
          <h1 className="text-3xl font-black">Conquistas Épicas</h1>
          <p className="text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>
            Colecione medalhas mostrando suas habilidades matemáticas
          </p>
        </div>
      </div>

      {/* Progress Banner */}
      <div className="card p-6 border-b-4 flex flex-col sm:flex-row items-center gap-6" style={{ borderColor: "var(--color-primary)" }}>
        <div className="w-20 h-20 flex-shrink-0 rounded-full flex items-center justify-center text-4xl shadow-inner" style={{ background: "var(--color-primary-bg)" }}>
          🏆
        </div>
        <div className="flex-grow w-full text-center sm:text-left">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-2xl font-black">Progresso Global</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: "var(--color-text-muted)" }}>{unlockedCount} de {achievements.length} medalhas conquistadas</p>
            </div>
            <span className="text-2xl font-black" style={{ color: "var(--color-primary)" }}>{progress}%</span>
          </div>
          <div className="h-3 w-full rounded-full overflow-hidden" style={{ background: "var(--color-divider)" }}>
            <div className="h-full rounded-full transition-all duration-1000 relative" style={{ width: `${progress}%`, background: "var(--color-primary)" }}>
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id as AchievementCategory | "all")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border-2"
            style={{
              background: filter === c.id ? "var(--color-primary-bg)" : "var(--color-surface)",
              color: filter === c.id ? "var(--color-primary)" : "var(--color-text)",
              borderColor: filter === c.id ? "var(--color-primary)" : "var(--color-border)"
            }}
          >
            <span>{c.emoji}</span>
            {c.label}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(a => {
          const isSecret = a.category === "secret" && !a.unlocked;
          
          return (
            <div 
              key={a.id} 
              className={`p-5 rounded-2xl border-2 flex gap-4 transition-all ${a.unlocked ? 'hover:-translate-y-1 shadow-sm hover:shadow-md' : 'opacity-60 grayscale'}`}
              style={{ 
                background: a.unlocked ? "var(--color-surface)" : "var(--color-bg)",
                borderColor: a.unlocked ? "var(--color-primary)" : "var(--color-border)" 
              }}
            >
              <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-2xl text-3xl shadow-inner relative" style={{ background: a.unlocked ? "var(--color-primary-bg)" : "var(--color-divider)" }}>
                {isSecret ? "❓" : a.emoji}
                {a.unlocked && <div className="absolute -bottom-1 -right-1 text-xs">✨</div>}
              </div>
              
              <div className="flex-grow min-w-0 flex flex-col justify-center">
                <h3 className="font-black text-lg truncate" style={{ color: "var(--color-text)" }}>
                  {isSecret ? "Conquista Secreta" : a.title}
                </h3>
                <p className="text-[11px] font-bold leading-tight mt-1" style={{ color: "var(--color-text-muted)" }}>
                  {isSecret ? "Continue jogando para descobrir..." : a.desc}
                </p>
                {a.unlocked && (
                  <div className="mt-2 text-[9px] font-black uppercase px-2 py-1 inline-block rounded self-start" style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}>
                    ✓ Desbloqueada
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
