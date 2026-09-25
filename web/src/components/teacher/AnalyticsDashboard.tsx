"use client";

import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";

interface AnalyticsDashboardProps {
  students: any[];
  tracks: any[];
  lessons: any[];
}

export default function AnalyticsDashboard({ students, tracks, lessons }: AnalyticsDashboardProps) {
  
  // Simulated data for engagement graph (since we don't have historical data natively yet)
  const engagementData = useMemo(() => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return days.map(d => ({
      name: d,
      ativos: Math.floor(Math.random() * (students.length || 10) + 1),
      quizzes: Math.floor(Math.random() * 50 + 10),
    }));
  }, [students.length]);

  // Aggregate student stats
  const totalXP = students.reduce((acc, s) => acc + (Number(s.xp) || 0), 0);
  const totalQuizzes = students.reduce((acc, s) => acc + (Number(s.quizzesCompleted) || 0), 0);
  const avgLevel = students.length > 0 ? Math.floor(totalXP / students.length / 500) + 1 : 1;
  
  // Find at-risk students (e.g. mock missing > 7 days)
  const atRiskStudents = students.filter(s => (Number(s.streak) || 0) === 0).slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ─── KPIS ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-indigo-500">
          <p className="text-xs text-[var(--color-text-muted)] font-bold uppercase mb-1">Total de Alunos</p>
          <p className="text-3xl font-black">{students.length}</p>
        </div>
        <div className="card p-4 border-l-4 border-violet-500">
          <p className="text-xs text-[var(--color-text-muted)] font-bold uppercase mb-1">Quizzes Resolvidos</p>
          <p className="text-3xl font-black">{totalQuizzes}</p>
        </div>
        <div className="card p-4 border-l-4 border-emerald-500">
          <p className="text-xs text-[var(--color-text-muted)] font-bold uppercase mb-1">Nível Médio</p>
          <p className="text-3xl font-black">{avgLevel}</p>
        </div>
        <div className="card p-4 border-l-4 border-rose-500">
          <p className="text-xs text-[var(--color-text-muted)] font-bold uppercase mb-1">Trilhas Ativas</p>
          <p className="text-3xl font-black">{tracks.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── ENGAGEMENT CHART ─── */}
        <div className="lg:col-span-2 card p-5 flex flex-col min-h-[300px]">
          <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><span>📈</span> Engajamento Semanal</h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-6">Média de acessos e resolução de quizzes</p>
          <div className="flex-1 w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={engagementData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', borderRadius: '12px' }}
                  itemStyle={{ color: 'var(--color-text)' }}
                />
                <Line type="monotone" name="Alunos Ativos" dataKey="ativos" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" name="Quizzes Feitos" dataKey="quizzes" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ─── ALUNOS EM RISCO ─── */}
        <div className="card p-5">
          <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><span>⚠️</span> Alerta de Evasão</h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">Alunos sem streak (risco de abandono)</p>
          
          <div className="space-y-3">
            {atRiskStudents.length > 0 ? (
              atRiskStudents.map((s, i) => (
                <div key={s.uid || i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center font-bold text-xs">
                      {(s.name || "A")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold truncate max-w-[120px]">{s.name || "Aluno"}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] truncate max-w-[120px]">{s.email}</p>
                    </div>
                  </div>
                  <button className="text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20">
                    Acordar 🔔
                  </button>
                </div>
              ))
            ) : (
              <div className="py-8 text-center opacity-50 flex flex-col items-center">
                <span className="text-3xl mb-2">🎉</span>
                <p className="text-sm font-bold">Todos os alunos estão ativos!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── LIVE FEED (MOCK) ─── */}
      <div className="card p-5 border-l-4 border-blue-500">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><span>📡</span> Console ao Vivo</h3>
        <div className="space-y-2 font-mono text-xs">
          <div className="p-2 rounded bg-slate-500/5 text-[var(--color-text)]">
            <span className="text-emerald-500 font-bold">[SUCESSO]</span> O aluno <b>{(students[0]?.name) || "Alex"}</b> concluiu o quiz de Álgebra. (+100 XP)
          </div>
          <div className="p-2 rounded bg-slate-500/5 text-[var(--color-text)]">
            <span className="text-rose-500 font-bold">[FALHA]</span> O aluno <b>{(students[1]?.name) || "Maria"}</b> errou a questão #3 de Frações.
          </div>
          <div className="p-2 rounded bg-slate-500/5 text-[var(--color-text)]">
            <span className="text-amber-500 font-bold">[SISTEMA]</span> Resumo diário: 15 alunos entraram na última hora.
          </div>
        </div>
      </div>

    </div>
  );
}
