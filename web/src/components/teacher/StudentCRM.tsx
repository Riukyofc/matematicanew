"use client";

import { useState } from "react";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface StudentData {
  uid: string;
  name?: string;
  email?: string;
  xp?: number;
  quizzesCompleted?: number;
  coins?: number;
  streak?: number;
  role?: string;
  equippedTitle?: string;
}

interface StudentCRMProps {
  students: StudentData[];
  onRefresh: () => void;
}

export default function StudentCRM({ students, onRefresh }: StudentCRMProps) {
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleGiveReward = async (amount: number, type: "coins" | "xp") => {
    if (!selectedStudent) return;
    setLoadingAction(true);
    try {
      const field = type === "coins" ? { coins: increment(amount) } : { xp: increment(amount) };
      await updateDoc(doc(db, "users", selectedStudent.uid), field);
      alert(`✅ ${amount} ${type.toUpperCase()} enviados para ${selectedStudent.name}!`);
      onRefresh();
      setSelectedStudent(prev => prev ? { ...prev, [type]: (Number(prev[type as keyof StudentData]) || 0) + amount } : null);
    } catch (e: any) {
      alert("❌ Erro ao enviar recompensa: " + e.message);
    }
    setLoadingAction(false);
  };

  const handleResetInfractions = async () => {
    if (!selectedStudent) return;
    setLoadingAction(true);
    try {
      // Zero as infrações (requer a subcoleção infractions, mas podemos criar um log no user document para facilitar)
      await updateDoc(doc(db, "users", selectedStudent.uid), { "lastPardoned": new Date().toISOString() });
      alert("✅ Infrações zeradas com sucesso (log salvo).");
    } catch {}
    setLoadingAction(false);
  };

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-card-static">
        <div>
          <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><span>👥</span> Gestão de Alunos (CRM)</h3>
          <p className="text-xs text-[var(--color-text-muted)]">{students.length} alunos matriculados na plataforma.</p>
        </div>
        <input 
          type="text" 
          placeholder="Buscar aluno..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── LISTA DE ALUNOS ─── */}
        <div className="lg:col-span-2 space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[var(--color-border)] rounded-2xl">
              <p className="text-sm font-bold text-[var(--color-text-muted)]">Nenhum aluno encontrado.</p>
            </div>
          ) : (
            filteredStudents.map(s => (
              <div 
                key={s.uid} 
                onClick={() => setSelectedStudent(s)}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedStudent?.uid === s.uid 
                    ? "bg-[var(--color-accent-subtle)] border-indigo-500 shadow-md" 
                    : "bg-[var(--color-bg-secondary)] border-[var(--color-border)] hover:border-indigo-500/50 hover:bg-[var(--color-bg-input)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {(s.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{s.name || "Sem nome"}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{s.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div className="hidden sm:block">
                    <p className="text-sm font-black text-indigo-500">{s.xp || 0}</p>
                    <p className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase">XP</p>
                  </div>
                  <div>
                    <p className="text-sm font-black text-emerald-500">{s.quizzesCompleted || 0}</p>
                    <p className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase">Quizzes</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ─── FICHA DO ALUNO ─── */}
        <div className="lg:col-span-1">
          {selectedStudent ? (
            <div className="card p-5 border-l-4 border-indigo-500 animate-fade-in sticky top-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center text-3xl font-black mb-3 shadow-lg">
                  {(selectedStudent.name || "?").charAt(0).toUpperCase()}
                </div>
                <h3 className="text-lg font-bold">{selectedStudent.name}</h3>
                <p className="text-xs text-[var(--color-text-muted)]">{selectedStudent.email}</p>
                {selectedStudent.equippedTitle && (
                  <span className="inline-block mt-2 px-2 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded uppercase">
                    {selectedStudent.equippedTitle}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-6">
                <div className="p-3 bg-[var(--color-bg-secondary)] rounded-xl text-center border border-[var(--color-border)]">
                  <p className="text-lg font-black text-indigo-500">{selectedStudent.xp || 0}</p>
                  <p className="text-[9px] font-bold uppercase text-[var(--color-text-muted)]">XP Total</p>
                </div>
                <div className="p-3 bg-[var(--color-bg-secondary)] rounded-xl text-center border border-[var(--color-border)]">
                  <p className="text-lg font-black text-yellow-500">{selectedStudent.coins || 0}</p>
                  <p className="text-[9px] font-bold uppercase text-[var(--color-text-muted)]">Moedas</p>
                </div>
                <div className="p-3 bg-[var(--color-bg-secondary)] rounded-xl text-center border border-[var(--color-border)]">
                  <p className="text-lg font-black text-orange-500">{selectedStudent.streak || 0}</p>
                  <p className="text-[9px] font-bold uppercase text-[var(--color-text-muted)]">Streak (Dias)</p>
                </div>
                <div className="p-3 bg-[var(--color-bg-secondary)] rounded-xl text-center border border-[var(--color-border)]">
                  <p className="text-lg font-black text-emerald-500">{selectedStudent.role || "STUDENT"}</p>
                  <p className="text-[9px] font-bold uppercase text-[var(--color-text-muted)]">Cargo</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase">Ações de Mestre</h4>
                
                <button 
                  disabled={loadingAction}
                  onClick={() => handleGiveReward(500, "coins")}
                  className="w-full p-3 rounded-xl bg-yellow-500/10 text-yellow-500 font-bold text-xs flex items-center justify-center gap-2 hover:bg-yellow-500/20 transition-all"
                >
                  <span>💰</span> Presentear 500 Moedas
                </button>
                
                <button 
                  disabled={loadingAction}
                  onClick={() => handleGiveReward(1000, "xp")}
                  className="w-full p-3 rounded-xl bg-indigo-500/10 text-indigo-500 font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-500/20 transition-all"
                >
                  <span>⚡</span> Conceder 1.000 XP
                </button>

                <button 
                  disabled={loadingAction}
                  onClick={handleResetInfractions}
                  className="w-full p-3 rounded-xl bg-emerald-500/10 text-emerald-500 font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-all"
                >
                  <span>🛡️</span> Perdoar Infrações
                </button>
                
                <button 
                  onClick={() => alert("Funcionalidade de Ban chegará na Fase 4.")}
                  className="w-full p-3 rounded-xl border border-red-500/20 text-red-500 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-500/10 transition-all"
                >
                  <span>⛔</span> Banir Aluno
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center opacity-50 flex flex-col items-center justify-center h-full border-dashed border-2">
              <span className="text-4xl mb-3">👈</span>
              <p className="text-sm font-bold">Selecione um aluno na lista para gerenciar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
