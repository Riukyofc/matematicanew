"use client";

import { useState } from "react";
import { type Track, type Lesson, createTrack, deleteTrack, createLesson, deleteLesson } from "@/lib/firebase";

interface CourseBuilderProps {
  tracks: Track[];
  lessons: Lesson[];
  onRefresh: () => void;
}

export default function CourseBuilder({ tracks, lessons, onRefresh }: CourseBuilderProps) {
  const [activeTrack, setActiveTrack] = useState<string | null>(null);
  const [isCreatingTrack, setIsCreatingTrack] = useState(false);
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const [loading, setLoading] = useState(false);

  // Formulários
  const [newTrack, setNewTrack] = useState({ title: "", description: "", icon: "📘", order: 0, grade: 6 });
  const [newLesson, setNewLesson] = useState({
    title: "", description: "", videoUrl: "", videoProvider: "YOUTUBE" as const,
    richTextContent: "", order: 0, minWatchTimeSec: 20, isPublished: true
  });

  const handleCreateTrack = async () => {
    if (!newTrack.title.trim()) return;
    setLoading(true);
    try {
      await createTrack(newTrack);
      setIsCreatingTrack(false);
      setNewTrack({ title: "", description: "", icon: "📘", order: tracks.length + 1, grade: 6 });
      onRefresh();
    } catch {}
    setLoading(false);
  };

  const handleCreateLesson = async () => {
    if (!activeTrack || !newLesson.title.trim()) return;
    setLoading(true);
    try {
      await createLesson({ ...newLesson, trackId: activeTrack });
      setIsCreatingLesson(false);
      setNewLesson(prev => ({ ...prev, title: "", description: "", videoUrl: "", richTextContent: "", order: prev.order + 1 }));
      onRefresh();
    } catch {}
    setLoading(false);
  };

  const handleDeleteTrack = async (id: string) => {
    if (!confirm("Tem certeza? Todas as aulas desta trilha podem ficar órfãs.")) return;
    await deleteTrack(id);
    if (activeTrack === id) setActiveTrack(null);
    onRefresh();
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm("Deletar aula permanentemente?")) return;
    await deleteLesson(id);
    onRefresh();
  };

  const trackLessons = lessons.filter(l => l.trackId === activeTrack).sort((a, b) => a.order - b.order);

  const inputCls = "w-full px-4 py-2.5 rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)] text-sm focus:outline-none focus:border-indigo-500 transition";

  return (
    <div className="flex flex-col md:flex-row gap-6 animate-fade-in h-[70vh]">
      
      {/* ─── LADO ESQUERDO: TRILHAS ─── */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Trilhas de Estudo</h3>
          <button 
            onClick={() => setIsCreatingTrack(!isCreatingTrack)}
            className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20"
          >
            {isCreatingTrack ? "✕" : "＋"}
          </button>
        </div>

        {isCreatingTrack && (
          <div className="card p-4 border-l-4 border-indigo-500 animate-fade-down">
            <h4 className="text-xs font-bold uppercase mb-3 text-indigo-500">Nova Trilha</h4>
            <div className="space-y-3">
              <input placeholder="Título (Ex: Álgebra)" value={newTrack.title} onChange={e => setNewTrack({...newTrack, title: e.target.value})} className={inputCls} />
              <input placeholder="Descrição curta" value={newTrack.description} onChange={e => setNewTrack({...newTrack, description: e.target.value})} className={inputCls} />
              <div className="flex gap-2">
                <input placeholder="Ícone (Emoji)" value={newTrack.icon} onChange={e => setNewTrack({...newTrack, icon: e.target.value})} className={`${inputCls} w-20 text-center`} />
                <input type="number" placeholder="Ordem" value={newTrack.order} onChange={e => setNewTrack({...newTrack, order: Number(e.target.value)})} className={`${inputCls} flex-1`} />
              </div>
              <button disabled={loading} onClick={handleCreateTrack} className="w-full py-2 bg-indigo-500 text-white rounded-xl font-bold text-sm hover:bg-indigo-600">
                Salvar Trilha
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
          {tracks.sort((a,b) => a.order - b.order).map(t => (
            <div 
              key={t.id} 
              onClick={() => setActiveTrack(t.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                activeTrack === t.id ? "bg-[var(--color-accent-subtle)] border-indigo-500 shadow-md" : "bg-[var(--color-bg-secondary)] border-[var(--color-border)] hover:border-indigo-500/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <p className="font-bold text-sm leading-tight">{t.title}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{lessons.filter(l => l.trackId === t.id).length} aulas</p>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteTrack(t.id); }}
                className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ─── LADO DIREITO: AULAS ─── */}
      <div className="w-full md:w-2/3 flex flex-col bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-inner">
        {!activeTrack ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
            <span className="text-4xl mb-4">📚</span>
            <p className="font-bold">Selecione uma Trilha</p>
            <p className="text-sm">Clique em uma trilha na lista à esquerda para gerenciar suas aulas.</p>
          </div>
        ) : (
          <>
            {/* Header da Trilha Ativa */}
            <div className="p-4 bg-[var(--color-bg)] border-b border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{tracks.find(t => t.id === activeTrack)?.icon}</span>
                <h3 className="font-bold text-lg">{tracks.find(t => t.id === activeTrack)?.title}</h3>
              </div>
              <button 
                onClick={() => setIsCreatingLesson(!isCreatingLesson)}
                className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20"
              >
                {isCreatingLesson ? "Cancelar" : "＋ Nova Aula"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {isCreatingLesson && (
                <div className="card p-5 border-l-4 border-indigo-500 mb-6 animate-fade-down">
                  <h4 className="font-bold mb-4 flex items-center gap-2"><span>📝</span> Adicionar Nova Aula</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input placeholder="Título da Aula" value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} className={inputCls} />
                    <input placeholder="Link do Vídeo (YouTube)" value={newLesson.videoUrl} onChange={e => setNewLesson({...newLesson, videoUrl: e.target.value})} className={inputCls} />
                  </div>
                  <textarea 
                    placeholder="Resumo em Rich Text (Aceita HTML/Markdown básico)" 
                    value={newLesson.richTextContent} 
                    onChange={e => setNewLesson({...newLesson, richTextContent: e.target.value})} 
                    className={`${inputCls} min-h-[100px] mb-4`} 
                  />
                  <div className="flex items-center gap-4 mb-4 bg-[var(--color-bg-input)] p-3 rounded-xl border border-[var(--color-border)]">
                    <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                      <input type="checkbox" checked={newLesson.isPublished} onChange={e => setNewLesson({...newLesson, isPublished: e.target.checked})} className="w-4 h-4 rounded text-indigo-500" />
                      Publicado (Visível aos alunos)
                    </label>
                  </div>
                  <button disabled={loading} onClick={handleCreateLesson} className="w-full py-3 bg-indigo-500 text-white rounded-xl font-bold text-sm hover:bg-indigo-600">
                    Salvar Aula no Banco
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {trackLessons.length === 0 && !isCreatingLesson ? (
                  <p className="text-center text-sm font-bold text-[var(--color-text-muted)] py-8">Nenhuma aula nesta trilha.</p>
                ) : (
                  trackLessons.map((l, i) => (
                    <div key={l.id} className="flex gap-4 p-4 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] group hover:border-indigo-500/30 transition-colors">
                      <div className="flex flex-col items-center justify-center w-8 shrink-0">
                        <span className="text-[10px] font-bold text-[var(--color-text-muted)] mb-1">AULA</span>
                        <div className="w-8 h-8 rounded-full bg-slate-500/10 flex items-center justify-center font-black text-indigo-500">
                          {i + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold">{l.title}</h4>
                          <span className={`text-[9px] font-bold px-2 py-1 rounded-md uppercase ${l.isPublished ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {l.isPublished ? 'Publicada' : 'Rascunho'}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-1">{l.description || l.videoUrl || "Sem descrição"}</p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDeleteLesson(l.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg" title="Deletar">🗑️</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
