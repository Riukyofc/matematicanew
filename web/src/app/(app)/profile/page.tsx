"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { logoutUser } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { ACHIEVEMENTS } from "@/lib/achievements";

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  const [xpWidth, setXpWidth] = useState(0);

  useEffect(() => {
    if (profile?.xp) {
      setXpWidth(((Number(profile.xp) % 500) / 500) * 100);
    }
  }, [profile?.xp]);

  if (!user || !profile) return null;

  const name = user.displayName || String(profile.name) || "Aluno";
  const email = user.email || "";
  const xp = Number(profile.xp) || 0;
  const level = Math.floor(xp / 500) + 1;
  const streak = Number(profile.streak) || 0;
  const quizzesCompleted = Number(profile.quizzesCompleted) || 0;
  const coins = Number(profile.coins) || 0;
  const studyMin = Number(profile.totalStudyMinutes) || 0;
  const equippedTitle = profile.equippedTitle as string | undefined;
  const equippedTheme = profile.equippedTheme as string | undefined;
  const equippedBorder = profile.equippedBorder as string | undefined;
  const role = String(profile.role) || "STUDENT";
  const joinedDate = user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString("pt-BR") : "—";

  const unlockedIds = (profile.unlockedAchievements as string[]) || [];
  const unlockedAchievements = ACHIEVEMENTS.filter(a => unlockedIds.includes(a.id) || a.check(profile, {}));

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
  };

  const handleExportData = () => {
    const data = {
      name, email, xp, level, streak, quizzesCompleted, coins,
      studyMinutes: studyMin, equippedTitle, equippedTheme,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `saberes-${name.replace(/\s/g, "_")}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("success", "Dados exportados com sucesso!");
  };

  return (
    <div className="max-w-3xl mx-auto py-6 animate-fade-up">
      {/* Profile Banner */}
      <div className="relative rounded-3xl overflow-hidden mb-8 glass-card-premium animate-scale-in">
        {/* Gradient Banner */}
        <div className="h-32 bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-purple-500/20 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-card)] to-transparent" />
        </div>
        
        {/* Avatar + Info */}
        <div className="px-6 pb-6 -mt-14 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-4xl font-black shadow-xl shadow-indigo-500/20 border-4 border-[var(--color-bg-card)] ${equippedBorder || ''}`}>
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-black">{name}</h1>
              {equippedTitle && <p className="text-sm font-black heading-gradient-warm">{equippedTitle}</p>}
              <p className="text-xs text-[var(--color-text-muted)]">{email}</p>
              <div className="flex gap-2 mt-1">
                <span className="badge badge-accent">{role === "ADMIN" ? "Admin" : role === "TEACHER" ? "Professor" : "Aluno"}</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">Desde {joinedDate}</span>
              </div>
            </div>
            <button onClick={handleExportData} className="px-4 py-2 rounded-xl btn-secondary text-xs font-bold">
              📥 Exportar Dados
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {[
          { label: "XP", value: xp.toLocaleString(), icon: "⚡", color: "text-indigo-500" },
          { label: "Nível", value: level, icon: "🎯", color: "text-violet-500" },
          { label: "Streak", value: `${streak}d`, icon: "🔥", color: "text-orange-500" },
          { label: "Quizzes", value: quizzesCompleted, icon: "📝", color: "text-emerald-500" },
          { label: "Moedas", value: coins, icon: "🟡", color: "text-yellow-500" },
          { label: "Estudo", value: `${studyMin}m`, icon: "📚", color: "text-cyan-500" },
        ].map((s, i) => (
          <div key={s.label} className="stat-card p-3 text-center animate-fade-up transition-transform duration-300 hover:scale-110" style={{ animationDelay: `${0.1 + i * 0.1}s`, animationFillMode: "both" }}>
            <div className="text-lg mb-0.5">{s.icon}</div>
            <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
            <p className="text-[8px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* XP Progress to Next Level */}
      <div className="glass-card-static p-5 rounded-2xl mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold">Progresso do Nível {level}</p>
          <p className="text-sm font-bold text-[var(--color-accent)]">{xp % 500}/500 XP</p>
        </div>
        <div className="progress-bar progress-bar-lg">
          <div className="progress-bar-fill transition-all duration-1000 ease-out" style={{ width: `${xpWidth}%` }} />
        </div>
        <p className="text-[10px] text-[var(--color-text-muted)] mt-2">Faltam {500 - (xp % 500)} XP para o nível {level + 1}</p>
      </div>

      {/* Equipped Items */}
      <div className="glass-card-static p-5 rounded-2xl mb-6">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <span>🎨</span> Itens Equipados
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center">
            <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Tema</p>
            <p className="text-sm font-bold">{equippedTheme || "Padrão"}</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center">
            <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Título</p>
            <p className="text-sm font-bold">{equippedTitle || "Nenhum"}</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-center">
            <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Borda</p>
            <p className="text-sm font-bold">{equippedBorder ? "Equipada" : "Nenhuma"}</p>
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="glass-card-static p-5 rounded-2xl mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold flex items-center gap-2"><span>🏆</span> Conquistas</h3>
          <button onClick={() => router.push("/achievements")} className="text-xs font-bold text-[var(--color-accent)] hover:underline cursor-pointer">
            Ver todas →
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(unlockedAchievements.length > 0 ? unlockedAchievements.slice(0, 4) : ACHIEVEMENTS.slice(0, 4)).map(a => {
            const isUnlocked = unlockedIds.includes(a.id) || a.check(profile, {});
            return (
              <div key={a.id} className={`p-3 rounded-xl text-center transition-all ${
                isUnlocked ? "bg-[var(--color-accent-subtle)] border border-[var(--color-accent-glow)]" : "bg-[var(--color-bg-secondary)] border border-[var(--color-border)] opacity-50"
              }`}>
                <div className="text-2xl mb-1">{a.emoji}</div>
                <p className="text-[10px] font-bold truncate">{a.title}</p>
                {isUnlocked && <span className="text-[8px] text-emerald-500 font-bold">✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => router.push("/settings")} className="px-5 py-2.5 rounded-xl btn-secondary text-xs font-bold flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Configurações
        </button>
        <button onClick={handleLogout} className="px-5 py-2.5 rounded-xl text-xs font-bold text-red-500 border border-red-500/20 hover:bg-red-500/10 transition-all cursor-pointer flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Sair da Conta
        </button>
      </div>
    </div>
  );
}
