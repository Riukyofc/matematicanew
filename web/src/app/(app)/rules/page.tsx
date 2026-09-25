"use client";

import { useState } from "react";

const sections = [
  {
    icon: "📜",
    title: "Código de Conduta",
    color: "from-indigo-500/10 to-violet-500/10",
    borderColor: "border-indigo-500/20",
    iconBg: "bg-indigo-500/10 text-indigo-500",
    items: [
      { icon: "✍️", text: "Responda quizzes individualmente." },
      { icon: "🤝", text: "Trate todos com respeito." },
      { icon: "📅", text: "Cumpra os prazos do professor." },
      { icon: "📚", text: "Use a plataforma para fins educacionais." },
    ],
  },
  {
    icon: "🛡️",
    title: "Anti-Fraude",
    color: "from-red-500/10 to-orange-500/10",
    borderColor: "border-red-500/20",
    iconBg: "bg-red-500/10 text-red-500",
    items: [
      { icon: "🚫", text: "Cópia (Ctrl+C) desabilitada nos quizzes." },
      { icon: "👁️", text: "Saídas de tela são detectadas automaticamente." },
      { icon: "⛔", text: "3ª saída cancela o quiz (nota zero)." },
      { icon: "📋", text: "Infrações ficam registradas no banco de dados." },
    ],
  },
  {
    icon: "⚠️",
    title: "Penalidades",
    color: "from-yellow-500/10 to-amber-500/10",
    borderColor: "border-yellow-500/20",
    iconBg: "bg-yellow-500/10 text-yellow-600",
    items: [
      { icon: "1️⃣", text: "1ª infração: Alerta na tela." },
      { icon: "2️⃣", text: "2ª infração: Notificação ao professor." },
      { icon: "3️⃣", text: "3ª infração: Quiz cancelado, nota zero." },
      { icon: "👨‍🏫", text: "Professor pode aplicar punições adicionais." },
    ],
  },
  {
    icon: "🎮",
    title: "Gamificação",
    color: "from-emerald-500/10 to-teal-500/10",
    borderColor: "border-emerald-500/20",
    iconBg: "bg-emerald-500/10 text-emerald-500",
    items: [
      { icon: "⚡", text: "10 XP por pergunta correta." },
      { icon: "📈", text: "500 XP = 1 nível." },
      { icon: "🏅", text: "Conquistas por desafios especiais." },
      { icon: "🏆", text: "Ranking em tempo real." },
    ],
  },
  {
    icon: "💡",
    title: "Como Funciona",
    color: "from-blue-500/10 to-cyan-500/10",
    borderColor: "border-blue-500/20",
    iconBg: "bg-blue-500/10 text-blue-500",
    items: [
      { icon: "🗂️", text: "Conteúdo em trilhas temáticas." },
      { icon: "🎬", text: "Assista a videoaula antes do quiz." },
      { icon: "⏱️", text: "Tempo mínimo configurado pelo professor." },
      { icon: "📝", text: "Faça anotações durante as aulas." },
    ],
  },
];

export default function RulesPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="max-w-3xl mx-auto py-6 animate-fade-up">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-block p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 mb-3 shadow-inner animate-float">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
        </div>
        <h1 className="text-3xl font-black heading-gradient mb-2">Regras e Diretrizes</h1>
        <p className="text-sm font-medium text-[var(--color-text-muted)] max-w-md mx-auto">
          Saiba como utilizar a plataforma corretamente e tirar o máximo proveito!
        </p>
      </div>

      {/* Quick Summary */}
      <div className="glass-card-premium p-5 mb-6 animate-fade-up" style={{ animationDelay: "0.05s" }}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-lg">📌</span>
          <h3 className="text-sm font-bold">Resumo Rápido</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: "✅", label: "Jogue limpo", desc: "Sem trapaças" },
            { icon: "📖", label: "Estude bem", desc: "Aula antes do quiz" },
            { icon: "🏆", label: "Ganhe XP", desc: "10 por acerto" },
            { icon: "⚠️", label: "3 chances", desc: "Saídas de tela" },
          ].map(s => (
            <div key={s.label} className="text-center p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <div className="text-xl mb-1">{s.icon}</div>
              <p className="text-[10px] font-bold text-[var(--color-text-primary)]">{s.label}</p>
              <p className="text-[9px] text-[var(--color-text-muted)]">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="space-y-3">
        {sections.map((s, i) => (
          <div 
            key={s.title} 
            className={`rounded-2xl overflow-hidden transition-all duration-300 animate-fade-up ${
              open === i 
                ? `glass-card-static shadow-lg border ${s.borderColor}` 
                : "bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)]"
            }`}
            style={{ animationDelay: `${0.1 + i * 0.05}s` }}
          >
            <button 
              onClick={() => setOpen(open === i ? null : i)} 
              className="w-full flex items-center gap-4 p-5 text-left cursor-pointer transition-colors"
            >
              <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center text-xl shrink-0 shadow-inner border ${s.borderColor}`}>
                {s.icon}
              </div>
              <span className="flex-1 text-sm font-bold text-[var(--color-text-primary)]">{s.title}</span>
              <span className={`text-[var(--color-text-muted)] transition-transform duration-300 ${open === i ? "rotate-180" : ""}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </span>
            </button>
            
            <div className={`overflow-hidden transition-all duration-400 ease-in-out ${open === i ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
              <div className={`px-5 pb-5 pt-2 space-y-2 border-t ${s.borderColor} bg-gradient-to-br ${s.color}`}>
                {s.items.map((item, j) => (
                  <div key={j} className="flex gap-3 p-3 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow">
                    <span className="text-lg shrink-0">{item.icon}</span>
                    <span className="text-sm font-medium text-[var(--color-text-secondary)] leading-relaxed">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
