"use client";

import { useState, useMemo, useEffect } from "react";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db, updateUserProfile, getStudentInfractions } from "@/lib/firebase";

interface StudentData {
  uid: string;
  name?: string;
  email?: string;
  xp?: number;
  level?: number;
  quizzesCompleted?: number;
  perfectQuizzes?: number;
  coins?: number;
  streak?: number;
  studyMinutes?: number;
  lastActiveDate?: any;
  role?: string;
  equippedTitle?: string;
}

interface StudentCRMProps {
  students: StudentData[];
  onRefresh: () => void;
}

type SortKey = "name" | "xp" | "level" | "quizzesCompleted";

export default function StudentCRM({ students, onRefresh }: StudentCRMProps) {
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingAction, setLoadingAction] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Inputs para ações individuais
  const [xpInput, setXpInput] = useState<number | "">("");
  const [coinInput, setCoinInput] = useState<number | "">("");

  // Inputs para ações em massa
  const [bulkXpInput, setBulkXpInput] = useState<number | "">("");
  const [bulkCoinInput, setBulkCoinInput] = useState<number | "">("");

  // Infrações do estudante selecionado
  const [infractions, setInfractions] = useState<any[]>([]);
  const [showInfractions, setShowInfractions] = useState(false);
  const [loadingInfractions, setLoadingInfractions] = useState(false);

  useEffect(() => {
    setXpInput("");
    setCoinInput("");
    setShowInfractions(false);
    setInfractions([]);
  }, [selectedStudent]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const filteredAndSortedStudents = useMemo(() => {
    let result = students.filter(s =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      let valA: any = a[sortKey] ?? (sortKey === "name" ? "" : 0);
      let valB: any = b[sortKey] ?? (sortKey === "name" ? "" : 0);

      if (typeof valA === "string" && typeof valB === "string") {
        return sortDirection === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return sortDirection === "asc" ? valA - valB : valB - valA;
    });

    return result;
  }, [students, searchTerm, sortKey, sortDirection]);

  const toggleSelectStudent = (uid: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(uid)) {
      newSelected.delete(uid);
    } else {
      newSelected.add(uid);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedStudents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedStudents.map(s => s.uid)));
    }
  };

  const handleGiveReward = async (uid: string, amount: number, type: "coins" | "xp") => {
    if (!amount || amount <= 0) return;
    try {
      const field = type === "coins" ? { coins: increment(amount) } : { xp: increment(amount) };
      await updateDoc(doc(db, "users", uid), field);
    } catch (e: any) {
      console.error("Erro ao enviar recompensa:", e);
      throw e;
    }
  };

  const handleIndividualReward = async (type: "coins" | "xp") => {
    if (!selectedStudent) return;
    const amountStr = type === "coins" ? coinInput : xpInput;
    const amount = Number(amountStr);
    if (!amount || amount <= 0) {
      alert("Por favor, insira um valor válido maior que zero.");
      return;
    }

    setLoadingAction(true);
    try {
      await handleGiveReward(selectedStudent.uid, amount, type);
      alert(`✅ ${amount} ${type.toUpperCase()} enviados para ${selectedStudent.name}!`);
      
      // Update local state temporarily for snappy UI
      setSelectedStudent(prev => prev ? { 
        ...prev, 
        [type]: (Number(prev[type as keyof StudentData]) || 0) + amount 
      } : null);
      
      if (type === "coins") setCoinInput("");
      else setXpInput("");

      onRefresh();
    } catch (e: any) {
      alert("❌ Erro ao enviar recompensa: " + e.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleBulkReward = async (type: "coins" | "xp") => {
    if (selectedIds.size === 0) return;
    const amountStr = type === "coins" ? bulkCoinInput : bulkXpInput;
    const amount = Number(amountStr);
    
    if (!amount || amount <= 0) {
      alert("Por favor, insira um valor válido maior que zero.");
      return;
    }

    if (!confirm(`Tem certeza que deseja enviar ${amount} ${type.toUpperCase()} para ${selectedIds.size} aluno(s)?`)) {
      return;
    }

    setLoadingAction(true);
    try {
      // Execute all updates in parallel
      const promises = Array.from(selectedIds).map(uid => 
        handleGiveReward(uid, amount, type)
      );
      await Promise.all(promises);
      
      alert(`✅ ${amount} ${type.toUpperCase()} enviados para ${selectedIds.size} aluno(s)!`);
      
      if (type === "coins") setBulkCoinInput("");
      else setBulkXpInput("");
      
      setSelectedIds(new Set()); // clear selection
      onRefresh();
    } catch (e: any) {
      alert("❌ Erro ao enviar recompensas em massa: " + e.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleResetProgress = async () => {
    if (!selectedStudent) return;
    if (!confirm(`⚠️ ATENÇÃO: Tem certeza que deseja zerar o progresso (XP, Nível, Quizzes, Moedas) de ${selectedStudent.name}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setLoadingAction(true);
    try {
      await updateUserProfile(selectedStudent.uid, {
        xp: 0,
        level: 1,
        quizzesCompleted: 0,
        perfectQuizzes: 0,
        coins: 0,
        streak: 0,
        studyMinutes: 0
      });
      alert(`✅ Progresso de ${selectedStudent.name} zerado com sucesso.`);
      onRefresh();
      setSelectedStudent(null);
    } catch (e: any) {
      alert("❌ Erro ao zerar progresso: " + e.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleViewInfractions = async () => {
    if (!selectedStudent) return;
    
    if (showInfractions) {
      setShowInfractions(false);
      return;
    }

    setLoadingInfractions(true);
    setShowInfractions(true);
    try {
      const data = await getStudentInfractions(selectedStudent.uid);
      setInfractions(data || []);
    } catch (e) {
      console.error("Erro ao carregar infrações:", e);
      setInfractions([]);
    } finally {
      setLoadingInfractions(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Nome", "Email", "XP", "Nivel", "Moedas", 
      "Streak", "Quizzes Completados", "Quizzes Perfeitos", 
      "Minutos de Estudo", "Ultimo Acesso"
    ];
    
    const rows = students.map(s => {
      const lastActive = s.lastActiveDate 
        ? (typeof s.lastActiveDate?.toDate === 'function' 
            ? s.lastActiveDate.toDate().toLocaleString() 
            : String(s.lastActiveDate)) 
        : "N/A";
        
      return [
        `"${s.name || ''}"`,
        `"${s.email || ''}"`,
        s.xp || 0,
        s.level || 1,
        s.coins || 0,
        s.streak || 0,
        s.quizzesCompleted || 0,
        s.perfectQuizzes || 0,
        s.studyMinutes || 0,
        `"${lastActive}"`
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "alunos_saberes_em_conexao.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── HEADER & BUSCA ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl glass-card-static border border-[var(--color-border)]">
        <div>
          <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
            <span className="text-indigo-500">👥</span> Gestão de Alunos
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            {students.length} alunos matriculados. Selecione um aluno para gerenciar.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Buscar por nome ou e-mail..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 px-4 py-2.5 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button 
            onClick={exportToCSV}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-all shrink-0"
          >
            <span>📊</span> Exportar CSV
          </button>
        </div>
      </div>

      {/* ─── AÇÕES EM MASSA (Mostrado apenas se houver seleção) ─── */}
      {selectedIds.size > 0 && (
        <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 animate-fade-up flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-indigo-400">
            <span>✅</span> {selectedIds.size} aluno(s) selecionado(s)
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                placeholder="Qtd XP"
                value={bulkXpInput}
                onChange={(e) => setBulkXpInput(e.target.value ? Number(e.target.value) : "")}
                className="w-24 px-3 py-1.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              />
              <button 
                disabled={loadingAction}
                onClick={() => handleBulkReward("xp")}
                className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white font-bold text-sm hover:bg-indigo-600 transition-all disabled:opacity-50"
              >
                Dar XP
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                placeholder="Qtd Moedas"
                value={bulkCoinInput}
                onChange={(e) => setBulkCoinInput(e.target.value ? Number(e.target.value) : "")}
                className="w-28 px-3 py-1.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:border-yellow-500"
              />
              <button 
                disabled={loadingAction}
                onClick={() => handleBulkReward("coins")}
                className="px-3 py-1.5 rounded-lg bg-yellow-500 text-white font-bold text-sm hover:bg-yellow-600 transition-all disabled:opacity-50"
              >
                Dar Moedas
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── LISTA DE ALUNOS ─── */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          
          {/* Ordenação */}
          <div className="flex items-center gap-2 p-3 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] text-sm font-medium overflow-x-auto custom-scrollbar">
            <span className="text-[var(--color-text-muted)] shrink-0">Ordenar por:</span>
            {[
              { key: "name", label: "Nome" },
              { key: "xp", label: "XP" },
              { key: "level", label: "Nível" },
              { key: "quizzesCompleted", label: "Quizzes" }
            ].map(sortOption => (
              <button
                key={sortOption.key}
                onClick={() => handleSort(sortOption.key as SortKey)}
                className={`px-3 py-1 rounded-lg transition-all whitespace-nowrap ${
                  sortKey === sortOption.key 
                    ? "bg-[var(--color-accent)] text-white font-bold" 
                    : "hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-white"
                }`}
              >
                {sortOption.label}
                {sortKey === sortOption.key && (
                  <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </button>
            ))}
          </div>

          {/* Cabeçalho da Lista para Selecionar Todos */}
          <div className="flex items-center gap-3 px-4 py-2">
            <input 
              type="checkbox" 
              checked={selectedIds.size > 0 && selectedIds.size === filteredAndSortedStudents.length}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-bg-input)] accent-indigo-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              Selecionar Todos
            </span>
          </div>

          <div className="space-y-2 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredAndSortedStudents.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[var(--color-border)] rounded-2xl">
                <p className="text-sm font-bold text-[var(--color-text-muted)]">Nenhum aluno encontrado.</p>
              </div>
            ) : (
              filteredAndSortedStudents.map(s => (
                <div 
                  key={s.uid} 
                  className={`p-3 sm:p-4 rounded-xl border flex items-center justify-between transition-all group ${
                    selectedStudent?.uid === s.uid 
                      ? "bg-[var(--color-accent-subtle)] border-indigo-500 shadow-md" 
                      : "bg-[var(--color-bg-secondary)] border-[var(--color-border)] hover:border-indigo-500/50 hover:bg-[var(--color-bg-input)]"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(s.uid)}
                      onChange={() => toggleSelectStudent(s.uid)}
                      className="w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-bg-input)] accent-indigo-500 cursor-pointer shrink-0"
                    />
                    
                    <div 
                      onClick={() => setSelectedStudent(s)}
                      className="flex items-center gap-3 cursor-pointer w-full"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {(s.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-bold truncate">{s.name || "Sem nome"}</p>
                        <p className="text-xs text-[var(--color-text-muted)] truncate">{s.email}</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setSelectedStudent(s)}
                    className="flex items-center gap-3 sm:gap-5 text-right cursor-pointer shrink-0"
                  >
                    <div className="hidden sm:block">
                      <p className="text-sm font-black text-amber-500">Nv. {s.level || 1}</p>
                      <p className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase">Nível</p>
                    </div>
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
        </div>

        {/* ─── FICHA DO ALUNO (DETALHES) ─── */}
        <div className="lg:col-span-1">
          {selectedStudent ? (
            <div className="card p-5 border-t-4 border-t-indigo-500 lg:border-t-0 lg:border-l-4 lg:border-l-indigo-500 animate-fade-in sticky top-6 bg-[var(--color-bg-secondary)] border-[var(--color-border)] shadow-xl">
              
              {/* Info Básica */}
              <div className="text-center mb-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center text-2xl sm:text-3xl font-black mb-3 shadow-lg relative">
                  {(selectedStudent.name || "?").charAt(0).toUpperCase()}
                  <div className="absolute -bottom-2 -right-2 bg-[var(--color-bg-primary)] rounded-full p-1 border-2 border-indigo-500">
                    <span className="text-xs px-1.5 font-bold text-indigo-500">Nv.{selectedStudent.level || 1}</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold mt-4">{selectedStudent.name}</h3>
                <p className="text-xs text-[var(--color-text-muted)] mb-2">{selectedStudent.email}</p>
                
                <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                  {selectedStudent.role === "ADMIN" && (
                    <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-bold rounded uppercase border border-red-500/20">
                      ADMIN
                    </span>
                  )}
                  {selectedStudent.equippedTitle && (
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded uppercase border border-amber-500/20">
                      {selectedStudent.equippedTitle}
                    </span>
                  )}
                </div>
              </div>

              {/* Estatísticas Grade */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                <div className="p-2 sm:p-3 bg-[var(--color-bg-primary)] rounded-xl text-center border border-[var(--color-border)]">
                  <p className="text-base sm:text-lg font-black text-indigo-500">{selectedStudent.xp || 0}</p>
                  <p className="text-[9px] font-bold uppercase text-[var(--color-text-muted)]">XP Total</p>
                </div>
                <div className="p-2 sm:p-3 bg-[var(--color-bg-primary)] rounded-xl text-center border border-[var(--color-border)]">
                  <p className="text-base sm:text-lg font-black text-yellow-500">{selectedStudent.coins || 0}</p>
                  <p className="text-[9px] font-bold uppercase text-[var(--color-text-muted)]">Moedas</p>
                </div>
                <div className="p-2 sm:p-3 bg-[var(--color-bg-primary)] rounded-xl text-center border border-[var(--color-border)]">
                  <p className="text-base sm:text-lg font-black text-orange-500">{selectedStudent.streak || 0}🔥</p>
                  <p className="text-[9px] font-bold uppercase text-[var(--color-text-muted)]">Streak (Dias)</p>
                </div>
                <div className="p-2 sm:p-3 bg-[var(--color-bg-primary)] rounded-xl text-center border border-[var(--color-border)]">
                  <p className="text-base sm:text-lg font-black text-emerald-500">{selectedStudent.quizzesCompleted || 0}</p>
                  <p className="text-[9px] font-bold uppercase text-[var(--color-text-muted)]">Quizzes Feitos</p>
                </div>
              </div>

              {/* Mais Informações */}
              <div className="bg-[var(--color-bg-primary)] p-3 rounded-xl border border-[var(--color-border)] mb-5 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)] font-medium">Quizzes Perfeitos:</span>
                  <span className="font-bold text-amber-500">{selectedStudent.perfectQuizzes || 0} 🏆</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)] font-medium">Minutos de Estudo:</span>
                  <span className="font-bold text-blue-400">{selectedStudent.studyMinutes || 0} min ⏱️</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)] font-medium">Último Acesso:</span>
                  <span className="font-bold">
                    {selectedStudent.lastActiveDate 
                      ? (typeof selectedStudent.lastActiveDate?.toDate === 'function' 
                          ? selectedStudent.lastActiveDate.toDate().toLocaleDateString() 
                          : String(selectedStudent.lastActiveDate)) 
                      : "Nunca"}
                  </span>
                </div>
              </div>

              {/* Ações Individuais */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-wider border-b border-[var(--color-border)] pb-1">
                  Gerenciar Aluno
                </h4>
                
                {/* Dar XP */}
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    placeholder="XP..."
                    value={xpInput}
                    onChange={(e) => setXpInput(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <button 
                    disabled={loadingAction}
                    onClick={() => handleIndividualReward("xp")}
                    className="px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-bold text-sm hover:bg-indigo-500/20 transition-all shrink-0 disabled:opacity-50"
                  >
                    Dar XP
                  </button>
                </div>

                {/* Dar Moedas */}
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    placeholder="Moedas..."
                    value={coinInput}
                    onChange={(e) => setCoinInput(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:border-yellow-500"
                  />
                  <button 
                    disabled={loadingAction}
                    onClick={() => handleIndividualReward("coins")}
                    className="px-4 py-2 rounded-xl bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-bold text-sm hover:bg-yellow-500/20 transition-all shrink-0 disabled:opacity-50"
                  >
                    Dar Moedas
                  </button>
                </div>

                {/* Ver Infrações */}
                <div className="bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border)] overflow-hidden">
                  <button 
                    onClick={handleViewInfractions}
                    className="w-full p-3 flex items-center justify-between font-bold text-xs hover:bg-[var(--color-bg-hover)] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span>🚩</span> Histórico de Infrações
                    </span>
                    <span>{showInfractions ? "▲" : "▼"}</span>
                  </button>
                  
                  {showInfractions && (
                    <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                      {loadingInfractions ? (
                        <p className="text-xs text-center text-[var(--color-text-muted)]">Carregando...</p>
                      ) : infractions.length === 0 ? (
                        <p className="text-xs text-center text-emerald-500 font-medium">Nenhuma infração registrada. 🎉</p>
                      ) : (
                        <ul className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                          {infractions.map((inf, i) => (
                            <li key={i} className="text-[11px] p-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md flex justify-between items-center">
                              <span>{inf.reason || "Conduta indevida"}</span>
                              <span className="text-[var(--color-text-muted)] ml-2 shrink-0">
                                {inf.date ? new Date(inf.date).toLocaleDateString() : ""}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                {/* Reset Progress */}
                <button 
                  disabled={loadingAction}
                  onClick={handleResetProgress}
                  className="w-full p-3 rounded-xl border border-red-500/20 text-red-500 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-500/10 transition-all"
                >
                  <span>⚠️</span> Zerar Progresso do Aluno
                </button>
              </div>

            </div>
          ) : (
            <div className="card p-8 text-center flex flex-col items-center justify-center h-full border-dashed border-2 border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <div className="w-16 h-16 rounded-full bg-[var(--color-bg-input)] flex items-center justify-center mb-4 border border-[var(--color-border)]">
                <span className="text-2xl">👈</span>
              </div>
              <h4 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">
                Nenhum aluno selecionado
              </h4>
              <p className="text-xs text-[var(--color-text-muted)] max-w-[200px]">
                Selecione um aluno na lista ao lado para visualizar os detalhes e gerenciar recompensas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
