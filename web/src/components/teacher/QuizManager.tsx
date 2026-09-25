"use client";

import { useState } from "react";
import { type Lesson, type Question, getQuizzesByLessonId, createQuiz, getQuizQuestions, createQuestion, deleteQuestion } from "@/lib/firebase";

interface QuizManagerProps {
  lessons: Lesson[];
  onRefresh: () => void;
}

export default function QuizManager({ lessons }: QuizManagerProps) {
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [quizId, setQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ text: "", options: ["", "", "", ""], correctIndex: 0, points: 10 });

  const loadQuiz = async (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setLoading(true);
    setQuizId(null);
    setQuestions([]);
    try {
      const quizzes = await getQuizzesByLessonId(lessonId);
      if (quizzes.length > 0) {
        setQuizId(quizzes[0].id);
        const qs = await getQuizQuestions(quizzes[0].id);
        setQuestions(qs.sort((a,b) => a.order - b.order));
      }
    } catch {}
    setLoading(false);
  };

  const handleCreateQuiz = async () => {
    if (!selectedLessonId) return;
    setLoading(true);
    try {
      const lesson = lessons.find(l => l.id === selectedLessonId);
      const newId = await createQuiz({
        lessonId: selectedLessonId,
        title: `Quiz — ${lesson?.title || "Nova Aula"}`,
        isTimerEnabled: true,
        timeLimitSec: 120,
        maxInfractions: 3,
      });
      setQuizId(newId);
      setQuestions([]);
    } catch {}
    setLoading(false);
  };

  const handleAddQuestion = async () => {
    if (!quizId || !newQuestion.text.trim() || newQuestion.options.some(o => !o.trim())) return;
    setLoading(true);
    try {
      await createQuestion(quizId, { ...newQuestion, order: questions.length + 1 });
      setNewQuestion({ text: "", options: ["", "", "", ""], correctIndex: 0, points: 10 });
      const qs = await getQuizQuestions(quizId);
      setQuestions(qs.sort((a,b) => a.order - b.order));
    } catch {}
    setLoading(false);
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!quizId) return;
    setLoading(true);
    try {
      await deleteQuestion(quizId, qId);
      const qs = await getQuizQuestions(quizId);
      setQuestions(qs.sort((a,b) => a.order - b.order));
    } catch {}
    setLoading(false);
  };

  const updateOption = (index: number, val: string) => {
    const opts = [...newQuestion.options];
    opts[index] = val;
    setNewQuestion({ ...newQuestion, options: opts });
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] text-sm focus:outline-none focus:border-indigo-500 transition";

  return (
    <div className="flex flex-col md:flex-row gap-6 animate-fade-in h-[75vh]">
      
      {/* ─── COLUNA 1: AULAS E CRIADOR DE QUIZ ─── */}
      <div className="w-full md:w-1/3 flex flex-col gap-4 border-r border-[var(--color-border)] pr-4">
        <h3 className="text-lg font-bold">Gerenciador de Quizzes</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">Selecione uma aula para criar ou editar seu quiz (Modo Boss/Prova suportado).</p>
        
        <select 
          value={selectedLessonId} 
          onChange={(e) => loadQuiz(e.target.value)}
          className={inputCls}
        >
          <option value="">Selecione uma Aula...</option>
          {lessons.map(l => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>

        {selectedLessonId && !loading && !quizId && (
          <div className="mt-8 text-center p-6 bg-[var(--color-bg-secondary)] rounded-2xl border border-dashed border-[var(--color-border)]">
            <span className="text-4xl mb-4 block">❓</span>
            <p className="font-bold mb-2">Sem Quiz</p>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">Esta aula ainda não tem um quiz associado.</p>
            <button onClick={handleCreateQuiz} className="w-full py-2 bg-indigo-500 text-white font-bold rounded-xl text-sm shadow-md hover:bg-indigo-600 transition-colors">
              Criar Quiz Agora
            </button>
          </div>
        )}

        {quizId && (
          <div className="mt-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <p className="text-sm font-bold text-indigo-500 flex items-center gap-2"><span>✅</span> Quiz Ativo</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">{questions.length} perguntas cadastradas.</p>
            
            <div className="mt-4 pt-4 border-t border-indigo-500/20">
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded text-indigo-500" />
                Modo Prova (Bloquear saídas da tela)
              </label>
            </div>
          </div>
        )}
      </div>

      {/* ─── COLUNA 2: PERGUNTAS ─── */}
      <div className="w-full md:w-2/3 flex flex-col">
        {!quizId ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-50 text-center p-8">
            <span className="text-4xl mb-4">🕹️</span>
            <p className="font-bold">Nenhum Quiz Selecionado</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="mb-6 card p-5 border-l-4 border-emerald-500 shrink-0">
              <h4 className="font-bold mb-4 flex items-center gap-2"><span>➕</span> Adicionar Pergunta</h4>
              <input 
                placeholder="Ex: Qual é a raiz quadrada de 144?" 
                value={newQuestion.text} 
                onChange={e => setNewQuestion({...newQuestion, text: e.target.value})} 
                className={`${inputCls} mb-4 font-bold`} 
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="correct" 
                      checked={newQuestion.correctIndex === i} 
                      onChange={() => setNewQuestion({...newQuestion, correctIndex: i})} 
                      className="w-4 h-4 text-emerald-500 cursor-pointer"
                    />
                    <input 
                      placeholder={`Opção ${i+1}`} 
                      value={newQuestion.options[i]} 
                      onChange={e => updateOption(i, e.target.value)} 
                      className={`${inputCls} py-2 ${newQuestion.correctIndex === i ? 'border-emerald-500 bg-emerald-500/5' : ''}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-[var(--color-bg-secondary)] px-3 py-2 rounded-xl border border-[var(--color-border)]">
                  <span className="text-xs font-bold text-[var(--color-text-muted)]">XP/Pontos:</span>
                  <input type="number" value={newQuestion.points} onChange={e => setNewQuestion({...newQuestion, points: Number(e.target.value)})} className="w-16 bg-transparent outline-none font-bold text-indigo-500" />
                </div>
                <button disabled={loading} onClick={handleAddQuestion} className="flex-1 py-2.5 bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-md hover:bg-emerald-600 transition-colors">
                  Salvar Pergunta
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 pb-8">
              {questions.length === 0 ? (
                <p className="text-center text-xs font-bold text-[var(--color-text-muted)] py-8">Ainda não há perguntas neste quiz.</p>
              ) : (
                questions.map((q, i) => (
                  <div key={q.id} className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-500/10 flex items-center justify-center font-black text-indigo-500 shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm mb-2">{q.text}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className={`px-2 py-1.5 rounded-lg text-xs flex items-center gap-2 border ${oIdx === q.correctIndex ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 font-bold' : 'bg-[var(--color-bg)] border-[var(--color-border)] opacity-70'}`}>
                            {oIdx === q.correctIndex && <span>✓</span>}
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg shrink-0">🗑️</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
