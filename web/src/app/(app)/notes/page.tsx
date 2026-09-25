"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllNotes, saveNote, deleteNote } from "@/lib/firebase";
import { useToast } from "@/components/Toast";

interface NoteData { id: string; content?: string; updatedAt?: unknown; }

export default function NotesPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNote, setActiveNote] = useState<string>("geral");
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [newNoteName, setNewNoteName] = useState("");
  const [showNewNote, setShowNewNote] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadNotes = useCallback(async () => {
    if (!user) return;
    try {
      const allNotes = await getAllNotes(user.uid);
      setNotes(allNotes as NoteData[]);
      const current = allNotes.find((n: NoteData) => n.id === activeNote);
      if (current) setContent(String((current as NoteData).content || ""));
      else if (allNotes.length > 0) {
        setActiveNote(allNotes[0].id);
        setContent(String(((allNotes[0] as NoteData).content) || ""));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user, activeNote]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleContentChange = (value: string) => {
    setContent(value);
    setSaveStatus("unsaved");

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (!user) return;
      setSaveStatus("saving");
      try {
        await saveNote(user.uid, activeNote, value);
        setSaveStatus("saved");
      } catch {
        addToast("error", "Erro ao salvar nota");
        setSaveStatus("unsaved");
      }
    }, 1500);
  };

  const switchNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    setActiveNote(noteId);
    setContent(String(note?.content || ""));
    setSaveStatus("saved");
  };

  const createNote = async () => {
    if (!user || !newNoteName.trim()) return;
    const id = newNoteName.trim().toLowerCase().replace(/\s+/g, "-");
    try {
      await saveNote(user.uid, id, "");
      setShowNewNote(false);
      setNewNoteName("");
      await loadNotes();
      setActiveNote(id);
      setContent("");
      addToast("success", "Caderno criado!");
    } catch {
      addToast("error", "Erro ao criar caderno");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user || noteId === "geral") return;
    try {
      await deleteNote(user.uid, noteId);
      addToast("success", "Caderno excluído!");
      setActiveNote("geral");
      await loadNotes();
    } catch {
      addToast("error", "Erro ao excluir");
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 animate-fade-up flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-end justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black heading-gradient-warm mb-1">Bloco de Notas</h1>
          <p className="text-xs font-medium text-[var(--color-text-muted)]">Organize suas anotações e lembretes</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Save Status */}
          <span className={`badge ${saveStatus === "saved" ? "badge-success" : saveStatus === "saving" ? "badge-warning" : "badge-info"}`}>
            {saveStatus === "saved" ? "✓ Salvo" : saveStatus === "saving" ? "Salvando..." : "Não salvo"}
          </span>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 min-h-0 flex gap-4">
        {/* Note Sidebar */}
        <div className="w-48 shrink-0 hidden md:flex flex-col gap-2">
          <button
            onClick={() => setShowNewNote(true)}
            className="w-full py-2 rounded-xl btn-primary text-xs font-bold flex items-center justify-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Novo Caderno
          </button>

          {showNewNote && (
            <div className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] animate-scale-in">
              <input
                value={newNoteName}
                onChange={e => setNewNoteName(e.target.value)}
                placeholder="Nome do caderno"
                className="input-premium text-xs mb-2"
                onKeyDown={e => e.key === "Enter" && createNote()}
              />
              <div className="flex gap-1">
                <button onClick={createNote} className="flex-1 py-1.5 rounded-lg btn-primary text-[10px] font-bold">Criar</button>
                <button onClick={() => setShowNewNote(false)} className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-[var(--color-text-muted)] hover:bg-[var(--color-bg-card)] cursor-pointer">✕</button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-1">
            {/* Default "geral" note */}
            <button
              onClick={() => switchNote("geral")}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeNote === "geral" ? "bg-orange-500/10 text-orange-600 border border-orange-500/20" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)]"
              }`}
            >
              <span>📋</span> Geral
            </button>

            {notes.filter(n => n.id !== "geral").map(note => (
              <div key={note.id} className="group relative">
                <button
                  onClick={() => switchNote(note.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                    activeNote === note.id ? "bg-orange-500/10 text-orange-600 border border-orange-500/20" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)]"
                  }`}
                >
                  <span>📝</span>
                  <span className="truncate">{note.id}</span>
                </button>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-red-500 transition-all cursor-pointer"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 min-h-0 relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-2xl -z-10 group-focus-within:from-amber-500/10 group-focus-within:to-orange-500/10 transition-colors" />
          <textarea 
            value={content}
            onChange={e => handleContentChange(e.target.value)}
            placeholder={loading ? "Carregando..." : "Digite suas anotações, ideias ou dúvidas aqui..."}
            disabled={loading}
            className="w-full h-full p-5 sm:p-6 rounded-2xl glass-card-static border border-[var(--color-border)] focus:outline-none focus:border-orange-500/50 resize-none font-mono text-sm leading-relaxed placeholder:text-[var(--color-text-muted)] transition-all disabled:opacity-50"
          />
          
          {/* Character count */}
          <div className="absolute bottom-3 right-4 text-[9px] font-bold text-[var(--color-text-muted)]">
            {content.length} caracteres
          </div>
        </div>
      </div>
    </div>
  );
}
