"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getSettings, saveSettings,
  getTracks, createTrack, deleteTrack,
  getAllLessons, createLesson, deleteLesson,
  getQuizzesByLessonId, createQuiz,
  getQuizQuestions, createQuestion, deleteQuestion,
  getCustomFormulas, saveCustomFormula, deleteCustomFormula,
  getAllStudents,
  seedFirestoreData,
  type Track, type Lesson, type Question, type Formula,
} from "@/lib/firebase";
import AnalyticsDashboard from "@/components/teacher/AnalyticsDashboard";
import StudentCRM from "@/components/teacher/StudentCRM";
import CourseBuilder from "@/components/teacher/CourseBuilder";
import QuizManager from "@/components/teacher/QuizManager";
import ShopManager from "@/components/teacher/ShopManager";

type Tab = "dashboard" | "tracks" | "quizzes" | "students" | "formulas" | "shop" | "settings";

interface StudentData {
  uid: string;
  name?: string;
  email?: string;
  xp?: number;
  quizzesCompleted?: number;
}

export default function TeacherPage() {
  const { profile } = useAuth();
  const isTeacher = String(profile?.role) === "TEACHER" || String(profile?.role) === "ADMIN";

  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // DATA
  const [tracks, setTracks] = useState<Track[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [waitTime, setWaitTime] = useState("20");
  const [maxInf, setMaxInf] = useState("3");

  // FORMS
  const [newTrack, setNewTrack] = useState({ title: "", description: "", icon: "📘", order: 0 });
  const [newLesson, setNewLesson] = useState<{ trackId: string; title: string; description: string; videoUrl: string; videoProvider: "YOUTUBE" | "VIMEO" | "UPLOAD"; richTextContent: string; order: number; minWatchTimeSec: number; isPublished: boolean }>({ trackId: "", title: "", description: "", videoUrl: "", videoProvider: "YOUTUBE", richTextContent: "", order: 0, minWatchTimeSec: 20, isPublished: true });
  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [newQuestion, setNewQuestion] = useState({ text: "", options: ["", "", "", ""], correctIndex: 0, order: 0, points: 10 });
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [quizId, setQuizId] = useState<string>("");
  const [newFormula, setNewFormula] = useState({ category: "", name: "", formula: "" });
  const [seeding, setSeeding] = useState(false);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [t, l, s, f, set] = await Promise.all([
        getTracks(), getAllLessons(), getAllStudents(), getCustomFormulas(), getSettings()
      ]);
      setTracks(t);
      setLessons(l);
      setStudents(s as StudentData[]);
      setFormulas(f);
      if (set?.quizWaitTime) setWaitTime(String(set.quizWaitTime));
      if (set?.maxInfractions) setMaxInf(String(set.maxInfractions));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isTeacher) {
      loadAllData();
    }
  }, [isTeacher, loadAllData]);

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  // ─── ACCESS DENIED ───
  if (!isTeacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center animate-fade-up">
        <span className="text-5xl mb-4 animate-bounce-in">⛔</span>
        <h1 className="text-2xl font-black mb-2">Acesso Negado</h1>
        <p className="text-[var(--color-text-muted)]">Você não tem permissão para acessar o painel do professor.</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "dashboard", label: "Visão Geral", icon: "📊" },
    { id: "tracks", label: "Trilhas & Aulas", icon: "📚" },
    { id: "quizzes", label: "Quizzes", icon: "❓" },
    { id: "students", label: "Alunos", icon: "👥" },
    { id: "formulas", label: "Fórmulas", icon: "ƒ" },
    { id: "shop", label: "Loja Virtual", icon: "🛒" },
    { id: "settings", label: "Config", icon: "⚙️" },
  ];

  // ─── HANDLERS ───
  const handleCreateTrack = async () => {
    if (!newTrack.title.trim()) return;
    try {
      await createTrack({ ...newTrack, order: tracks.length + 1 });
      showMsg("✅ Trilha criada!");
      setNewTrack({ title: "", description: "", icon: "📘", order: 0 });
      loadAllData();
    } catch { showMsg("❌ Erro ao criar trilha"); }
  };

  const handleDeleteTrack = async (id: string) => {
    if (!confirm("Tem certeza? Isso excluirá a trilha (aulas associadas permanecem).")) return;
    try { await deleteTrack(id); showMsg("✅ Trilha excluída!"); loadAllData(); } catch { showMsg("❌ Erro"); }
  };

  const handleCreateLesson = async () => {
    if (!newLesson.title.trim() || !newLesson.trackId) return;
    try {
      const tLessons = lessons.filter(l => l.trackId === newLesson.trackId);
      await createLesson({ ...newLesson, order: tLessons.length + 1 });
      showMsg("✅ Aula criada!");
      setNewLesson({ trackId: "", title: "", description: "", videoUrl: "", videoProvider: "YOUTUBE", richTextContent: "", order: 0, minWatchTimeSec: 20, isPublished: true });
      loadAllData();
    } catch { showMsg("❌ Erro ao criar aula"); }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm("Excluir esta aula e o quiz associado?")) return;
    try { await deleteLesson(id); showMsg("✅ Aula excluída!"); loadAllData(); } catch { showMsg("❌ Erro"); }
  };

  const handleSelectLesson = async (lessonId: string) => {
    setSelectedLesson(lessonId);
    setQuizQuestions([]);
    setQuizId("");
    try {
      const quizzes = await getQuizzesByLessonId(lessonId);
      if (quizzes.length > 0) {
        setQuizId(quizzes[0].id);
        const qs = await getQuizQuestions(quizzes[0].id);
        setQuizQuestions(qs);
      }
    } catch (err) { console.error(err); }
  };

  const handleCreateQuiz = async () => {
    if (!selectedLesson) return;
    try {
      const lesson = lessons.find(l => l.id === selectedLesson);
      const newId = await createQuiz({
        lessonId: selectedLesson,
        title: `Quiz — ${lesson?.title || ""}`,
        isTimerEnabled: true,
        timeLimitSec: 120,
        maxInfractions: Number(maxInf) || 3,
      });
      setQuizId(newId);
      showMsg("✅ Quiz criado! Agora adicione perguntas.");
    } catch { showMsg("❌ Erro ao criar quiz"); }
  };

  const handleAddQuestion = async () => {
    if (!quizId || !newQuestion.text.trim() || newQuestion.options.some(o => !o.trim())) return;
    try {
      await createQuestion(quizId, { ...newQuestion, order: quizQuestions.length + 1 });
      showMsg("✅ Pergunta adicionada!");
      setNewQuestion({ text: "", options: ["", "", "", ""], correctIndex: 0, order: 0, points: 10 });
      const qs = await getQuizQuestions(quizId);
      setQuizQuestions(qs);
    } catch { showMsg("❌ Erro ao adicionar pergunta"); }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!quizId) return;
    try {
      await deleteQuestion(quizId, qId);
      showMsg("✅ Pergunta removida!");
      const qs = await getQuizQuestions(quizId);
      setQuizQuestions(qs);
    } catch { showMsg("❌ Erro"); }
  };

  const handleSaveSettings = async () => {
    try {
      await saveSettings({ quizWaitTime: Number(waitTime) || 20, maxInfractions: Number(maxInf) || 3 });
      showMsg("✅ Configurações salvas!");
    } catch { showMsg("❌ Erro ao salvar"); }
  };

  const handleAddFormula = async () => {
    if (!newFormula.category.trim() || !newFormula.name.trim() || !newFormula.formula.trim()) return;
    try {
      await saveCustomFormula(newFormula);
      showMsg("✅ Fórmula adicionada!");
      setNewFormula({ category: "", name: "", formula: "" });
      const f = await getCustomFormulas();
      setFormulas(f);
    } catch { showMsg("❌ Erro"); }
  };

  const handleDeleteFormula = async (id: string) => {
    try {
      await deleteCustomFormula(id);
      showMsg("✅ Fórmula removida!");
      const f = await getCustomFormulas();
      setFormulas(f);
    } catch { showMsg("❌ Erro"); }
  };

  const handleSeed = async () => {
    if (!confirm("Popular o Firestore com dados de exemplo? Só funciona se estiver vazio.")) return;
    setSeeding(true);
    try {
      const result = await seedFirestoreData();
      showMsg(result.message);
      if (result.success) loadAllData();
    } catch { showMsg("❌ Erro ao popular dados"); }
    setSeeding(false);
  };

  // ─── RENDER ───
  const inputCls = "w-full px-4 py-3 rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm";
  const labelCls = "block text-[10px] font-bold text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider";
  const btnSmCls = "px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer";

  return (
    <div className="max-w-5xl mx-auto py-6 animate-fade-up">
      <h1 className="text-3xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500">Painel do Professor</h1>
      <p className="text-sm font-medium text-[var(--color-text-muted)] mb-6">Gerencie trilhas, aulas, quizzes e alunos.</p>

      {/* Message */}
      {msg && (
        <div className="mb-4 p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-sm font-bold text-[var(--color-text-primary)] animate-fade-in">
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2
              ${activeTab === tab.id ? "tab-active" : "tab-inactive"}`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-[var(--color-bg-secondary)] animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* ═══ DASHBOARD TAB ═══ */}
          {activeTab === "dashboard" && (
            <AnalyticsDashboard students={students} tracks={tracks} lessons={lessons} />
          )}

          {/* ═══ TRACKS & LESSONS TAB ═══ */}
          {activeTab === "tracks" && (
            <div className="space-y-6 animate-fade-in">
              {/* Create Track */}
              <div className="p-6 rounded-2xl glass-card-static">
                <h3 className="text-lg font-bold mb-4">Nova Trilha</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className={labelCls}>Título</label>
                    <input value={newTrack.title} onChange={e => setNewTrack({...newTrack, title: e.target.value})} placeholder="Ex: Álgebra" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Descrição</label>
                    <input value={newTrack.description} onChange={e => setNewTrack({...newTrack, description: e.target.value})} placeholder="Breve descrição" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Ícone (emoji)</label>
                    <input value={newTrack.icon} onChange={e => setNewTrack({...newTrack, icon: e.target.value})} placeholder="📘" className={inputCls} />
                  </div>
                </div>
                <button onClick={handleCreateTrack} className={`${btnSmCls} btn-primary`}>Criar Trilha</button>
              </div>

              {/* List Tracks */}
              <div className="space-y-3">
                {tracks.map(track => (
                  <div key={track.id} className="p-4 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{track.icon || "📘"}</span>
                      <div>
                        <p className="text-sm font-bold">{track.title}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{track.description} · {lessons.filter(l => l.trackId === track.id).length} aulas</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteTrack(track.id)} className={`${btnSmCls} text-red-500 hover:bg-red-500/10`}>Excluir</button>
                  </div>
                ))}
              </div>

              {/* Create Lesson */}
              <div className="p-6 rounded-2xl glass-card-static">
                <h3 className="text-lg font-bold mb-4">Nova Aula</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Trilha</label>
                      <select value={newLesson.trackId} onChange={e => setNewLesson({...newLesson, trackId: e.target.value})} className={inputCls}>
                        <option value="">Selecione...</option>
                        {tracks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Título da Aula</label>
                      <input value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} placeholder="Ex: Equações do 1º Grau" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Descrição</label>
                    <input value={newLesson.description} onChange={e => setNewLesson({...newLesson, description: e.target.value})} placeholder="Breve descrição da aula" className={inputCls} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>URL do Vídeo (YouTube)</label>
                      <input value={newLesson.videoUrl} onChange={e => setNewLesson({...newLesson, videoUrl: e.target.value})} placeholder="https://youtube.com/watch?v=..." className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Provedor</label>
                      <select value={newLesson.videoProvider} onChange={e => setNewLesson({...newLesson, videoProvider: e.target.value as "YOUTUBE" | "VIMEO" | "UPLOAD"})} className={inputCls}>
                        <option value="YOUTUBE">YouTube</option>
                        <option value="VIMEO">Vimeo</option>
                        <option value="UPLOAD">Upload Direto</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Conteúdo de Apoio (HTML)</label>
                    <textarea value={newLesson.richTextContent} onChange={e => setNewLesson({...newLesson, richTextContent: e.target.value})} placeholder="<h2>Título</h2><p>Conteúdo...</p>" rows={4} className={`${inputCls} resize-y`} />
                  </div>
                  <button onClick={handleCreateLesson} className={`${btnSmCls} btn-primary`}>Criar Aula</button>
                </div>
              </div>

              {/* List Lessons */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Aulas Cadastradas</h3>
                {lessons.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-muted)] py-4">Nenhuma aula cadastrada.</p>
                ) : lessons.map(lesson => {
                  const track = tracks.find(t => t.id === lesson.trackId);
                  return (
                    <div key={lesson.id} className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">{lesson.title}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{track?.title || "Sem trilha"} · {lesson.isPublished ? "Publicada" : "Rascunho"}</p>
                      </div>
                      <button onClick={() => handleDeleteLesson(lesson.id)} className={`${btnSmCls} text-red-500 hover:bg-red-500/10`}>Excluir</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ QUIZZES TAB ═══ */}
          {activeTab === "quizzes" && (
            <div className="space-y-6 animate-fade-in">
              {/* Select Lesson */}
              <div className="p-6 rounded-2xl glass-card-static">
                <h3 className="text-lg font-bold mb-4">Gerenciar Quiz</h3>
                <div className="mb-4">
                  <label className={labelCls}>Selecione uma aula</label>
                  <select
                    value={selectedLesson}
                    onChange={e => handleSelectLesson(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Selecione...</option>
                    {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                  </select>
                </div>

                {selectedLesson && !quizId && (
                  <button onClick={handleCreateQuiz} className={`${btnSmCls} btn-primary`}>
                    Criar Quiz para esta Aula
                  </button>
                )}

                {quizId && (
                  <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm font-bold text-emerald-600">
                    ✅ Quiz encontrado · {quizQuestions.length} perguntas
                  </div>
                )}
              </div>

              {/* Add Questions */}
              {quizId && (
                <>
                  <div className="p-6 rounded-2xl glass-card-static">
                    <h3 className="text-lg font-bold mb-4">Adicionar Pergunta</h3>
                    <div className="space-y-4">
                      <div>
                        <label className={labelCls}>Texto da Pergunta</label>
                        <textarea
                          value={newQuestion.text}
                          onChange={e => setNewQuestion({...newQuestion, text: e.target.value})}
                          placeholder="Qual é o valor de x na equação..."
                          rows={2}
                          className={`${inputCls} resize-y`}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {newQuestion.options.map((opt, i) => (
                          <div key={i}>
                            <label className={labelCls}>
                              Opção {String.fromCharCode(65 + i)}
                              {newQuestion.correctIndex === i && " ✅ (Correta)"}
                            </label>
                            <div className="flex gap-2">
                              <input
                                value={opt}
                                onChange={e => {
                                  const opts = [...newQuestion.options];
                                  opts[i] = e.target.value;
                                  setNewQuestion({...newQuestion, options: opts});
                                }}
                                placeholder={`Opção ${String.fromCharCode(65 + i)}`}
                                className={`${inputCls} flex-1`}
                              />
                              <button
                                onClick={() => setNewQuestion({...newQuestion, correctIndex: i})}
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer
                                  ${newQuestion.correctIndex === i ? "bg-emerald-500 text-white" : "bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:bg-emerald-500/10 text-[var(--color-text-muted)]"}`}
                              >
                                ✓
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button onClick={handleAddQuestion} className={`${btnSmCls} btn-primary`}>Adicionar Pergunta</button>
                    </div>
                  </div>

                  {/* Questions List */}
                  {quizQuestions.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                        Perguntas ({quizQuestions.length})
                      </h3>
                      {quizQuestions.map((q, i) => (
                        <div key={q.id} className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-xs font-bold text-[var(--color-text-muted)] mb-1">Pergunta {i + 1}</p>
                              <p className="text-sm font-semibold mb-2">{q.text}</p>
                              <div className="flex flex-wrap gap-2">
                                {q.options.map((opt, oi) => (
                                  <span
                                    key={oi}
                                    className={`text-xs px-2.5 py-1 rounded-lg font-medium
                                      ${oi === q.correctIndex ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-[var(--color-bg-card)] border border-[var(--color-border)]"}`}
                                  >
                                    {String.fromCharCode(65 + oi)}: {opt}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition cursor-pointer">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ═══ STUDENTS TAB ═══ */}
          {activeTab === "students" && (
            <StudentCRM students={students} onRefresh={loadAllData} />
          )}

          {/* ═══ SHOP TAB ═══ */}
          {activeTab === "shop" && (
            <ShopManager />
          )}

          {/* ═══ FORMULAS TAB ═══ */}
          {activeTab === "formulas" && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 rounded-2xl glass-card-static">
                <h3 className="text-lg font-bold mb-4">Adicionar Fórmula</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className={labelCls}>Categoria</label>
                    <input value={newFormula.category} onChange={e => setNewFormula({...newFormula, category: e.target.value})} placeholder="Álgebra" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Nome</label>
                    <input value={newFormula.name} onChange={e => setNewFormula({...newFormula, name: e.target.value})} placeholder="Bhaskara" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Fórmula</label>
                    <input value={newFormula.formula} onChange={e => setNewFormula({...newFormula, formula: e.target.value})} placeholder="x = (-b ± √Δ) / 2a" className={inputCls} />
                  </div>
                </div>
                <button onClick={handleAddFormula} className={`${btnSmCls} btn-primary`}>Adicionar</button>
              </div>

              <div className="space-y-2">
                {formulas.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-muted)] py-4 text-center">Nenhuma fórmula cadastrada.</p>
                ) : formulas.map(f => (
                  <div key={f.id} className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">{f.category}</p>
                      <p className="text-sm font-bold">{f.name}: <span className="font-mono text-violet-500">{f.formula}</span></p>
                    </div>
                    <button onClick={() => handleDeleteFormula(f.id)} className={`${btnSmCls} text-red-500 hover:bg-red-500/10`}>Excluir</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ SETTINGS TAB ═══ */}
          {activeTab === "settings" && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 rounded-2xl glass-card-static">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Configurações da Plataforma
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className={labelCls}>Tempo mínimo na aula (segundos)</label>
                    <p className="text-xs text-[var(--color-text-secondary)] mb-3">Define quanto tempo o aluno deve permanecer na aula antes de o quiz ser desbloqueado.</p>
                    <input type="number" value={waitTime} onChange={e => setWaitTime(e.target.value)} min={0} max={600} className={`${inputCls} max-w-xs`} />
                  </div>
                  <div>
                    <label className={labelCls}>Máximo de infrações</label>
                    <p className="text-xs text-[var(--color-text-secondary)] mb-3">Número de saídas de tela permitidas antes do quiz ser cancelado.</p>
                    <input type="number" value={maxInf} onChange={e => setMaxInf(e.target.value)} min={1} max={10} className={`${inputCls} max-w-xs`} />
                  </div>
                </div>
                <button onClick={handleSaveSettings} className={`${btnSmCls} btn-primary`}>Salvar Configurações</button>
              </div>

              <div className="p-6 rounded-2xl glass-card-static">
                <h3 className="text-lg font-bold mb-4">ℹ️ Dicas do Sistema</h3>
                <ul className="space-y-3 text-sm text-[var(--color-text-secondary)]">
                  <li className="flex items-start gap-2">
                    <span className="text-violet-500 font-bold mt-0.5">•</span>
                    <span>As infrações dos alunos ficam gravadas em <code className="text-[10px] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] px-1.5 py-0.5 rounded font-mono shadow-sm">users/{"{uid}"}/infractions</code>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-500 font-bold mt-0.5">•</span>
                    <span>Use a aba &quot;Trilhas &amp; Aulas&quot; para criar o conteúdo que os alunos vão acessar.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-500 font-bold mt-0.5">•</span>
                    <span>Cada aula pode ter um quiz. Crie o quiz na aba &quot;Quizzes&quot; após criar a aula.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-500 font-bold mt-0.5">•</span>
                    <span>O botão &quot;Popular Firestore&quot; na visão geral cria dados de exemplo automaticamente.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}





