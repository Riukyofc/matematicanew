"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/Toast";
import { addStudyTime } from "@/lib/firebase";

const PRESETS = [
  { label: "15 min", mins: 15, brk: 3 },
  { label: "25 min", mins: 25, brk: 5 },
  { label: "45 min", mins: 45, brk: 10 },
];

export default function StudyTimer() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<"study" | "break">("study");
  const [preset, setPreset] = useState(1);
  const [time, setTime] = useState(25 * 60);
  const [studied, setStudied] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);

  const studyTime = PRESETS[preset].mins * 60;
  const breakTime = PRESETS[preset].brk * 60;
  const total = mode === "study" ? studyTime : breakTime;
  const pct = ((total - time) / total) * 100;

  const save = useCallback(async () => {
    if (!user || studied < 60) return;
    const m = Math.floor(studied / 60);
    try { await addStudyTime(user.uid, m); addToast("success", `📚 ${m} min registrados!`); setStudied(0); } catch (e) { console.error(e); }
  }, [user, studied, addToast]);

  useEffect(() => {
    if (running) {
      startRef.current = Date.now();
      ref.current = setInterval(() => {
        setTime(p => {
          if (p <= 1) {
            setRunning(false);
            if (mode === "study") {
              setStudied(s => s + studyTime);
              addToast("success", "⏰ Estudo finalizado! Pausa.");
              setMode("break");
              return breakTime;
            } else {
              addToast("info", "☕ Pausa acabou!");
              setMode("study");
              return studyTime;
            }
          }
          return p - 1;
        });
      }, 1000);
    } else {
      if (ref.current) {
        clearInterval(ref.current);
        if (mode === "study" && startRef.current > 0) {
          const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
          if (elapsed > 5) setStudied(s => s + elapsed);
        }
      }
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running, mode, addToast, studyTime, breakTime]);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const reset = async () => {
    setRunning(false);
    if (studied >= 60) await save();
    setMode("study");
    setTime(studyTime);
    setStudied(0);
    startRef.current = 0;
  };

  return (
    <div className="card p-4" style={{ borderTop: `3px solid ${mode === "study" ? "var(--color-primary)" : "var(--color-success)"}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{mode === "study" ? "📖" : "☕"}</span>
          <div>
            <p className="text-sm font-bold">{mode === "study" ? "Estudo" : "Pausa"}</p>
            <p className="text-[10px] font-semibold" style={{ color: "var(--color-text-muted)" }}>
              Pomodoro · {PRESETS[preset].mins}/{PRESETS[preset].brk} min
            </p>
          </div>
        </div>
        {running && <span className="badge badge-primary text-[9px] animate-pulse">● ATIVO</span>}
      </div>

      {/* Presets */}
      {!running && (
        <div className="flex gap-1.5 mb-3">
          {PRESETS.map((p, i) => (
            <button key={p.label} onClick={() => { setPreset(i); setMode("study"); setTime(p.mins * 60); }}
              className="flex-1 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all"
              style={{
                background: i === preset ? "var(--color-primary-bg)" : "var(--color-bg)",
                color: i === preset ? "var(--color-primary)" : "var(--color-text-muted)",
                border: `2px solid ${i === preset ? "var(--color-primary)" : "var(--color-border)"}`,
              }}>
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Timer */}
      <div className="text-center mb-3">
        <p className="text-4xl font-black tracking-tight" style={{ color: running ? "var(--color-text)" : "var(--color-text-muted)" }}>
          {fmt(time)}
        </p>
        {/* Progress bar */}
        <div className="progress-bar progress-bar-sm mt-2">
          <div className="progress-fill" style={{ width: `${pct}%`, background: mode === "study" ? "var(--color-primary)" : "var(--color-success)" }} />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <button onClick={() => setRunning(!running)}
          className={`px-5 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all ${running ? "" : "text-white"}`}
          style={{
            background: running ? "var(--color-bg)" : "var(--color-primary)",
            color: running ? "var(--color-text)" : "white",
            border: running ? "2px solid var(--color-border)" : "none",
            boxShadow: running ? "none" : "0 3px 0 color-mix(in srgb, var(--color-primary) 70%, black)",
          }}>
          {running ? "⏸ Pausar" : "▶ Iniciar"}
        </button>
        <button onClick={reset} className="px-3 py-2 rounded-xl text-sm font-bold cursor-pointer" style={{ color: "var(--color-text-muted)" }}>
          ↻
        </button>
      </div>

      {/* Studied */}
      {studied >= 60 && (
        <div className="mt-3 p-2.5 rounded-lg flex items-center justify-between animate-fade-in" style={{ background: "var(--color-bg)" }}>
          <span className="text-[11px] font-bold" style={{ color: "var(--color-text-muted)" }}>📊 Sessão: {Math.floor(studied / 60)} min</span>
          <button onClick={save} className="text-[11px] font-bold cursor-pointer px-2 py-0.5 rounded" style={{ color: "var(--color-primary)", background: "var(--color-primary-bg)" }}>
            Salvar ✓
          </button>
        </div>
      )}
    </div>
  );
}
