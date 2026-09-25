"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/Toast";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const THEMES = [
  { id: "light", label: "Claro", icon: "☀️", preview: "bg-gradient-to-br from-slate-50 to-slate-200" },
  { id: "dark", label: "Escuro", icon: "🌙", preview: "bg-gradient-to-br from-slate-900 to-slate-800" },
  { id: "ocean", label: "Oceano", icon: "🌊", preview: "bg-gradient-to-br from-sky-900 to-cyan-800" },
  { id: "sunset", label: "Pôr-do-sol", icon: "🌅", preview: "bg-gradient-to-br from-purple-900 to-pink-800" },
  { id: "matrix", label: "Matrix", icon: "💊", preview: "bg-gradient-to-br from-black to-emerald-900" },
  { id: "cyberpunk", label: "Cyberpunk", icon: "🌃", preview: "bg-gradient-to-br from-purple-950 to-pink-800" },
  { id: "galaxy", label: "Galáxia", icon: "🌌", preview: "bg-gradient-to-br from-indigo-950 to-violet-900" },
];

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { addToast } = useToast();
  
  const [currentTheme, setCurrentTheme] = useState("dark");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setCurrentTheme(String(profile.equippedTheme || localStorage.getItem("theme") || "dark"));
      setDisplayName(String(profile.name || ""));
    }
  }, [profile]);

  const applyTheme = async (themeId: string) => {
    setCurrentTheme(themeId);
    
    if (themeId === "light") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", themeId);
    }
    localStorage.setItem("theme", themeId);

    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), { equippedTheme: themeId });
        addToast("success", `Tema "${THEMES.find(t => t.id === themeId)?.label}" aplicado!`);
      } catch {
        addToast("error", "Erro ao salvar tema");
      }
    }
  };

  const saveName = async () => {
    if (!user || !displayName.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { name: displayName.trim() });
      await refreshProfile();
      addToast("success", "Nome atualizado!");
    } catch {
      addToast("error", "Erro ao atualizar nome");
    }
    setSaving(false);
  };

  const handleExportData = () => {
    if (!profile) return;
    const data = {
      name: profile.name,
      email: user?.email,
      xp: profile.xp,
      level: Math.floor((Number(profile.xp) || 0) / 500) + 1,
      streak: profile.streak,
      quizzesCompleted: profile.quizzesCompleted,
      coins: profile.coins,
      studyMinutes: profile.totalStudyMinutes,
      equippedTheme: profile.equippedTheme,
      equippedTitle: profile.equippedTitle,
      role: profile.role,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `saberes-dados-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("success", "Dados exportados com sucesso!");
  };

  return (
    <div className="max-w-3xl mx-auto py-6 animate-fade-up">
      <div className="mb-8">
        <h1 className="text-3xl font-black heading-gradient mb-1">Configurações</h1>
        <p className="text-sm font-medium text-[var(--color-text-muted)]">Personalize sua experiência na plataforma</p>
      </div>

      {/* Account Info */}
      <section className="glass-card-static p-6 rounded-2xl mb-6 animate-fade-up" style={{ animationDelay: "0.05s" }}>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          Informações da Conta
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">Nome</label>
            <div className="flex gap-2">
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="input-premium flex-1"
                placeholder="Seu nome"
              />
              <button
                onClick={saveName}
                disabled={saving}
                className="px-4 py-2 rounded-xl btn-primary text-xs font-bold disabled:opacity-50"
              >
                {saving ? "..." : "Salvar"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">Email</label>
            <div className="px-4 py-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)]">
              {user?.email || "—"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">Conta Criada</label>
              <div className="px-4 py-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)]">
                {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString("pt-BR") : "—"}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider">Função</label>
              <div className="px-4 py-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)]">
                {String(profile?.role) === "ADMIN" ? "Administrador" : String(profile?.role) === "TEACHER" ? "Professor" : "Aluno"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Theme Selector */}
      <section className="glass-card-static p-6 rounded-2xl mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
          Aparência
        </h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-5">Escolha o tema visual da interface</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => applyTheme(theme.id)}
              className={`group p-3 rounded-xl border-2 transition-all cursor-pointer text-center ${
                currentTheme === theme.id
                  ? "border-[var(--color-accent)] shadow-md shadow-[var(--color-accent-glow)]"
                  : "border-[var(--color-border)] hover:border-[var(--color-border-hover)]"
              }`}
            >
              <div className={`w-full h-12 rounded-lg mb-2 ${theme.preview} shadow-inner`} />
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-sm">{theme.icon}</span>
                <span className="text-xs font-bold">{theme.label}</span>
              </div>
              {currentTheme === theme.id && (
                <div className="mt-1.5">
                  <span className="badge badge-accent text-[8px]">Ativo</span>
                </div>
              )}
            </button>
          ))}
        </div>

        <p className="text-[10px] text-[var(--color-text-muted)] mt-3">💡 Mais temas disponíveis na Lojinha!</p>
      </section>

      {/* Data & Privacy */}
      <section className="glass-card-static p-6 rounded-2xl mb-6 animate-fade-up" style={{ animationDelay: "0.15s" }}>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Dados e Privacidade
        </h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
            <div>
              <p className="text-sm font-bold">Exportar Progresso</p>
              <p className="text-xs text-[var(--color-text-muted)]">Baixe seus dados em formato JSON</p>
            </div>
            <button onClick={handleExportData} className="px-4 py-2 rounded-xl btn-secondary text-xs font-bold">
              📥 Exportar
            </button>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="glass-card-static p-6 rounded-2xl animate-fade-up" style={{ animationDelay: "0.2s" }}>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Sobre
        </h2>
        <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
          <p><strong className="text-[var(--color-text-primary)]">Saberes em Conexão</strong> — Plataforma Interativa de Matemática</p>
          <p className="text-xs">Projeto Interdisciplinar · Versão 6.0</p>
          <p className="text-xs text-[var(--color-text-muted)]">Desenvolvido com Next.js, Firebase e muito ❤️</p>
        </div>
      </section>
      {/* Developer Tools */}
      <div className="card p-6 border-l-4 border-red-500 mb-6">
        <h2 className="text-xl font-bold mb-1 flex items-center gap-2"><span>🛠️</span> Ferramentas de Admin</h2>
        <p className="text-sm font-medium text-[var(--color-text-muted)] mb-4">Apenas para professores/admins</p>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={async () => {
              const { seedFirestoreData } = await import("@/lib/firebase");
              const res = await seedFirestoreData();
              addToast(res.success ? "success" : "error", res.message);
            }} 
            className="px-4 py-2 bg-red-500/20 text-red-500 rounded-xl font-bold hover:bg-red-500/30 transition-colors"
          >
            🔥 Gerar Dados Iniciais (Loja, Fórmulas, Aulas)
          </button>

          <button 
            onClick={async () => {
              if (user) {
                const { increment } = await import("firebase/firestore");
                await updateDoc(doc(db, "users", user.uid), { coins: increment(10000) });
                await refreshProfile();
                addToast("achievement", "💰 10.000 Moedas Adicionadas!");
              }
            }} 
            className="px-4 py-2 bg-yellow-500/20 text-yellow-500 rounded-xl font-bold hover:bg-yellow-500/30 transition-colors"
          >
            💰 Hack: Ganhar 10.000 Moedas
          </button>
        </div>
      </div>

    </div>
  );
}
