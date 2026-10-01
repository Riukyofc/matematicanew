"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  Cell, PieChart, Pie
} from "recharts";

interface AnalyticsDashboardProps {
  students: any[];
  tracks: any[];
  lessons: any[];
  onSeed?: () => void;
  seeding?: boolean;
}

const COLORS = ["#6c5ce7", "#0984e3", "#00b894", "#e17055", "#fdcb6e", "#a29bfe", "#fd79a8", "#55efc4"];

export default function AnalyticsDashboard({ students, tracks, lessons, onSeed, seeding }: AnalyticsDashboardProps) {

  // ── REAL DATA AGGREGATION ──
  const stats = useMemo(() => {
    const totalXP = students.reduce((a, s) => a + (Number(s.xp) || 0), 0);
    const totalCoins = students.reduce((a, s) => a + (Number(s.coins) || 0), 0);
    const totalQuizzes = students.reduce((a, s) => a + (Number(s.quizzesCompleted) || 0), 0);
    const totalPerfect = students.reduce((a, s) => a + (Number(s.perfectQuizzes) || 0), 0);
    const totalStudyMin = students.reduce((a, s) => a + (Number(s.totalStudyMinutes) || 0), 0);
    const avgLevel = students.length > 0 ? Math.round(totalXP / students.length / 500) + 1 : 1;
    const activeStreaks = students.filter(s => (Number(s.streak) || 0) > 0).length;
    const avgQuizScore = totalQuizzes > 0 && students.length > 0 ? Math.round(totalPerfect / Math.max(totalQuizzes, 1) * 100) : 0;

    return { totalXP, totalCoins, totalQuizzes, totalPerfect, totalStudyMin, avgLevel, activeStreaks, avgQuizScore };
  }, [students]);

  // ── TOP 5 STUDENTS BY XP ──
  const topStudents = useMemo(() => {
    return [...students]
      .filter(s => s.uid !== "bot-mestre")
      .sort((a, b) => (Number(b.xp) || 0) - (Number(a.xp) || 0))
      .slice(0, 5)
      .map(s => ({ name: (s.name || "Aluno").split(" ")[0], xp: Number(s.xp) || 0 }));
  }, [students]);

  // ── LEVEL DISTRIBUTION ──
  const levelDist = useMemo(() => {
    const dist: Record<string, number> = {};
    students.filter(s => s.uid !== "bot-mestre").forEach(s => {
      const xp = Number(s.xp) || 0;
      const lvl = Math.floor(xp / 500) + 1;
      const range = lvl <= 2 ? "Nv 1-2" : lvl <= 5 ? "Nv 3-5" : lvl <= 10 ? "Nv 6-10" : "Nv 11+";
      dist[range] = (dist[range] || 0) + 1;
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [students]);

  // ── AT-RISK STUDENTS ──
  const atRiskStudents = useMemo(() => {
    return students
      .filter(s => s.uid !== "bot-mestre" && (Number(s.streak) || 0) === 0)
      .sort((a, b) => (Number(a.xp) || 0) - (Number(b.xp) || 0))
      .slice(0, 5);
  }, [students]);

  // ── RECENT ACTIVITY (REAL DATA) ──
  const recentActivity = useMemo(() => {
    const activities: { icon: string; color: string; label: string; text: string }[] = [];
    const realStudents = students.filter(s => s.uid !== "bot-mestre");

    // Find top performer
    const top = [...realStudents].sort((a, b) => (Number(b.xp) || 0) - (Number(a.xp) || 0))[0];
    if (top) {
      activities.push({
        icon: "🏆", color: "text-yellow-500", label: "TOP",
        text: `${top.name || "Aluno"} é o líder com ${Number(top.xp) || 0} XP!`
      });
    }

    // Find highest streak
    const streakLeader = [...realStudents].sort((a, b) => (Number(b.streak) || 0) - (Number(a.streak) || 0))[0];
    if (streakLeader && (Number(streakLeader.streak) || 0) > 0) {
      activities.push({
        icon: "🔥", color: "text-orange-500", label: "STREAK",
        text: `${streakLeader.name || "Aluno"} tem sequência de ${Number(streakLeader.streak)} dias!`
      });
    }

    // Quiz champion
    const quizChamp = [...realStudents].sort((a, b) => (Number(b.quizzesCompleted) || 0) - (Number(a.quizzesCompleted) || 0))[0];
    if (quizChamp && (Number(quizChamp.quizzesCompleted) || 0) > 0) {
      activities.push({
        icon: "✅", color: "text-emerald-500", label: "QUIZ",
        text: `${quizChamp.name || "Aluno"} completou ${Number(quizChamp.quizzesCompleted)} quizzes!`
      });
    }

    // Summary
    activities.push({
      icon: "📊", color: "text-blue-500", label: "RESUMO",
      text: `${realStudents.length} alunos, ${stats.totalQuizzes} quizzes feitos, ${stats.activeStreaks} streaks ativas.`
    });

    return activities;
  }, [students, stats]);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ─── KPIs ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
        {[
          { label: "Total de Alunos", value: students.filter(s => s.uid !== "bot-mestre").length, icon: "👥", color: "border-indigo-500" },
          { label: "Quizzes Resolvidos", value: stats.totalQuizzes, icon: "📝", color: "border-violet-500" },
          { label: "Nível Médio", value: stats.avgLevel, icon: "⭐", color: "border-emerald-500" },
          { label: "Streaks Ativas", value: stats.activeStreaks, icon: "🔥", color: "border-rose-500" },
        ].map(kpi => (
          <div key={kpi.label} className={`card p-4 border-l-4 ${kpi.color} hover-lift`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{kpi.icon}</span>
              <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase">{kpi.label}</p>
            </div>
            <p className="text-3xl font-black">{kpi.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* ─── SECONDARY KPIs ─── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 stagger-children">
        {[
          { label: "XP Total", value: stats.totalXP.toLocaleString(), icon: "⚡" },
          { label: "Moedas", value: stats.totalCoins.toLocaleString(), icon: "🪙" },
          { label: "Perfeitos", value: stats.totalPerfect, icon: "💯" },
          { label: "Trilhas", value: tracks.length, icon: "📚" },
          { label: "Aulas", value: lessons.length, icon: "🎬" },
          { label: "Estudo (h)", value: Math.round(stats.totalStudyMin / 60), icon: "⏱️" },
        ].map(s => (
          <div key={s.label} className="card-flat p-3 text-center hover-scale">
            <span className="text-lg">{s.icon}</span>
            <p className="text-base font-black mt-0.5">{s.value}</p>
            <p className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── TOP STUDENTS CHART ─── */}
        <div className="lg:col-span-2 card p-5 flex flex-col min-h-[300px]">
          <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><span>🏆</span> Top 5 Alunos por XP</h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">Ranking dos estudantes mais engajados</p>
          {topStudents.length > 0 ? (
            <div className="flex-1 w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topStudents} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '12px' }}
                    itemStyle={{ color: 'var(--color-text)' }}
                  />
                  <Bar dataKey="xp" name="XP" radius={[8, 8, 0, 0]}>
                    {topStudents.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center opacity-50">
              <p className="text-sm font-bold">Nenhum aluno ainda</p>
            </div>
          )}
        </div>

        {/* ─── LEVEL DISTRIBUTION ─── */}
        <div className="card p-5">
          <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><span>📊</span> Distribuição por Nível</h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">Faixas de nível dos alunos</p>
          {levelDist.length > 0 ? (
            <>
              <div className="w-full h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={levelDist} cx="50%" cy="50%" innerRadius={40} outerRadius={70}
                      paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`}
                      labelLine={false}
                    >
                      {levelDist.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {levelDist.map((d, i) => (
                  <span key={d.name} className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: `${COLORS[i % COLORS.length]}20`, color: COLORS[i % COLORS.length] }}>
                    {d.name}: {d.value}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[180px] opacity-50">
              <p className="text-sm font-bold">Sem dados</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── AT-RISK STUDENTS ─── */}
        <div className="card p-5">
          <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><span>⚠️</span> Alerta de Evasão</h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">Alunos sem streak ativa (risco de abandono)</p>

          <div className="space-y-2">
            {atRiskStudents.length > 0 ? (
              atRiskStudents.map((s, i) => (
                <div key={s.uid || i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] hover-lift">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center font-bold text-xs">
                      {(s.name || "A")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold truncate max-w-[140px]">{s.name || "Aluno"}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">{Number(s.xp) || 0} XP · {Number(s.quizzesCompleted) || 0} quizzes</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-rose-500/10 text-rose-500">Inativo</span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center opacity-50 flex flex-col items-center">
                <span className="text-3xl mb-2">🎉</span>
                <p className="text-sm font-bold">Todos os alunos estão ativos!</p>
              </div>
            )}
          </div>
        </div>

        {/* ─── LIVE CONSOLE ─── */}
        <div className="card p-5">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><span>📡</span> Console ao Vivo</h3>
          <div className="space-y-2 font-mono text-xs">
            {recentActivity.map((a, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <span className={`${a.color} font-bold`}>[{a.label}]</span>{" "}
                <span className="text-[var(--color-text)]">{a.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── SEED BUTTON ─── */}
      {onSeed && (
        <div className="card p-5 border-l-4 border-amber-500">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <span>🌱</span> Popular Dados de Exemplo
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">
            Cria trilhas, aulas, quizzes, fórmulas e itens da loja automaticamente. Só funciona se o banco estiver vazio.
          </p>
          <button
            onClick={onSeed}
            disabled={seeding}
            className="px-5 py-2.5 rounded-xl text-sm font-bold btn-primary disabled:opacity-50"
          >
            {seeding ? "Populando..." : "🌱 Popular Firestore com Dados de Exemplo"}
          </button>
        </div>
      )}
    </div>
  );
}
