"use client";

import React, { useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname, redirect } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { logoutUser } from "@/lib/firebase";

interface NavItem {
  id: string;
  label: string;
  emoji: string;
  section?: string;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (profile && profile.equippedTheme) {
      document.documentElement.setAttribute("data-theme", String(profile.equippedTheme));
    } else {
      const saved = localStorage.getItem("theme");
      if (saved === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else if (saved === "light") {
        document.documentElement.removeAttribute("data-theme");
      } else {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
      }
    }
  }, [profile?.equippedTheme]);

  useEffect(() => {
    if (!loading && !user) redirect("/login");
  }, [user, loading]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold" style={{ color: "var(--color-text-muted)" }}>Carregando...</p>
        </div>
      </div>
    );
  }

  const name = user.displayName || String(profile?.name) || "Aluno";
  const xp = Number(profile?.xp) || 0;
  const level = Math.floor(xp / 500) + 1;
  const streak = Number(profile?.streak) || 0;
  const coins = Number(profile?.coins) || 0;
  const xpInLevel = xp % 500;
  const xpPercent = (xpInLevel / 500) * 100;
  const equippedBorder = String(profile?.equippedBorder || "");
  const equippedTitle = String(profile?.equippedTitle || "");
  const equippedTheme = String(profile?.equippedTheme || "");
  const isTeacher = String(profile?.role) === "TEACHER" || String(profile?.role) === "ADMIN";

  const navItems: NavItem[] = [
    { id: "/dashboard", label: "Início", emoji: "🏠", section: "APRENDER" },
    { id: "/practice", label: "Prática", emoji: "💪" },
    { id: "/blitz", label: "Blitz", emoji: "⚡" },
    { id: "/achievements", label: "Conquistas", emoji: "⭐" },
    { id: "/leaderboard", label: "Ranking", emoji: "🏆" },
    { id: "/arena", label: "Arena", emoji: "⚔️" },
    { id: "/shop", label: "Lojinha", emoji: "🛍️", section: "FERRAMENTAS" },
    { id: "/calculator", label: "Calculadora", emoji: "🧮" },
    { id: "/formulas", label: "Fórmulas", emoji: "📐" },
    { id: "/notes", label: "Anotações", emoji: "📝" },
    { id: "/history", label: "Histórico", emoji: "📋", section: "CONTA" },
    { id: "/rules", label: "Regras", emoji: "📜" },
    { id: "/settings", label: "Configurações", emoji: "⚙️" },
    { id: "/profile", label: "Meu Perfil", emoji: "👤" },
  ];

  if (isTeacher) {
    navItems.push({ id: "/teacher", label: "Professor", emoji: "📚", section: "PROFESSOR" });
  }

  const isActive = (id: string) => pathname === id || pathname.startsWith(id + "/");

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
  };

  const navigate = (id: string) => {
    router.push(id);
    setMenuOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-bg)" }}>
      {/* Mobile overlay */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMenuOpen(false)} />
      )}

      {/* ═══ SIDEBAR ═══ */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[var(--sidebar-w)] flex flex-col border-r transition-transform duration-250 ease-in-out ${
        menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`} style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black" style={{ background: "var(--color-primary)" }}>
              S
            </div>
            <div>
              <p className="text-sm font-extrabold leading-tight" style={{ color: "var(--color-text)" }}>Saberes</p>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>em Conexão</p>
            </div>
          </div>
          <button onClick={() => setMenuOpen(false)} className="lg:hidden p-1 rounded-lg cursor-pointer" style={{ color: "var(--color-text-muted)" }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* User Card */}
        <div className="px-3 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0 ${equippedBorder}`} style={{ background: "var(--color-primary)" }}>
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{name}</p>
              {equippedTitle && <p className="text-[10px] font-bold" style={{ color: "var(--color-coins)" }}>{equippedTitle}</p>}
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold" style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>
              ⚡ Nv.{level}
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold" style={{ background: "var(--color-warning-bg)", color: "#d4a017" }}>
              🪙 {coins}
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold" style={{ background: "var(--color-error-bg)", color: "var(--color-error)" }}>
                🔥 {streak}
              </div>
            )}
          </div>

          {/* XP Bar */}
          <div className="progress-bar progress-bar-sm">
            <div className="progress-fill progress-fill-xp" style={{ width: `${xpPercent}%` }} />
          </div>
          <p className="text-[9px] font-bold mt-1 flex justify-between" style={{ color: "var(--color-text-muted)" }}>
            <span>{xpInLevel} / 500 XP</span>
            <span>Nível {level + 1}</span>
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-1 px-2">
          {navItems.map((item) => (
            <React.Fragment key={item.id}>
              {item.section && <div className="nav-section-label">{item.section}</div>}
              <button
                onClick={() => navigate(item.id)}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-bold transition-all cursor-pointer mb-0.5"
                style={{
                  background: isActive(item.id) ? "var(--color-primary-bg)" : "transparent",
                  color: isActive(item.id) ? "var(--color-primary)" : "var(--color-text-secondary)",
                  border: isActive(item.id) ? "2px solid var(--color-primary)" : "2px solid transparent",
                }}
              >
                <span className="text-base">{item.emoji}</span>
                <span>{item.label}</span>
              </button>
            </React.Fragment>
          ))}
        </nav>

        {/* Theme + Logout */}
        <div className="px-3 py-3 space-y-2" style={{ borderTop: "1px solid var(--color-border)" }}>
          {equippedTheme && (
            <p className="text-[10px] font-bold px-1 flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
              🎨 Tema: <span className="capitalize" style={{ color: "var(--color-primary)" }}>{equippedTheme}</span>
            </p>
          )}
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-bold cursor-pointer transition-colors" style={{ color: "var(--color-error)" }}>
            <span>🚪</span> Sair
          </button>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Top Bar */}
        <header className="lg:hidden flex items-center justify-between px-3 py-2.5" style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}>
          <div className="flex items-center gap-2">
            <button onClick={() => setMenuOpen(true)} className="p-1.5 rounded-lg cursor-pointer" style={{ color: "var(--color-text)" }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="text-sm font-extrabold" style={{ color: "var(--color-primary)" }}>Saberes</span>
          </div>

          {/* Mobile quick stats */}
          <div className="flex items-center gap-1.5">
            {streak > 0 && (
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full" style={{ background: "var(--color-error-bg)", color: "var(--color-error)" }}>
                🔥 {streak}
              </span>
            )}
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full" style={{ background: "var(--color-warning-bg)", color: "#d4a017" }}>
              🪙 {coins}
            </span>
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full" style={{ background: "var(--color-primary-bg)", color: "var(--color-primary)" }}>
              Nv.{level}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8">
          <div className="max-w-4xl mx-auto w-full animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
