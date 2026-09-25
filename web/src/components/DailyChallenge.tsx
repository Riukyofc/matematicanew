"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/Toast";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Q { text: string; options: string[]; correctIndex: number; }

function genQ(seed: number): Q {
  const types = [
    () => { const a = (seed % 15) + 5, b = ((seed * 7) % 20) + 3, ans = a * b; return { text: `Quanto é ${a} × ${b}?`, ans: String(ans), opts: [String(ans), String(ans + 5), String(ans - 3), String(ans + 8)] }; },
    () => { const x = (seed % 8) + 2, a = ((seed * 3) % 5) + 2, b = ((seed * 11) % 15) + 1, c = a * x + b; return { text: `Se ${a}x + ${b} = ${c}, x = ?`, ans: String(x), opts: [String(x), String(x + 2), String(x - 1), String(x + 4)] }; },
    () => { const base = (seed % 12) + 3, ans = base * base; return { text: `Quanto é ${base}²?`, ans: String(ans), opts: [String(ans), String(ans + base), String(ans - base), String(ans + 2 * base)] }; },
  ];
  const r = types[seed % types.length]();
  let s = seed; const sh = [...r.opts]; for (let i = sh.length - 1; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [sh[i], sh[j]] = [sh[j], sh[i]]; }
  return { text: r.text, options: sh, correctIndex: sh.indexOf(r.ans) };
}

function getSeed() { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }

function timeToMidnight() {
  const now = new Date(), mid = new Date(now); mid.setHours(24, 0, 0, 0);
  const d = mid.getTime() - now.getTime(); return `${Math.floor(d / 3600000)}h ${Math.floor((d % 3600000) / 60000)}m`;
}

const COLORS = ["#e17055", "#fdcb6e", "#00b894", "#0984e3", "#6c5ce7", "#fd79a8"];

export default function DailyChallenge() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [q] = useState(() => genQ(getSeed()));
  const [sel, setSel] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<"ok" | "fail" | null>(null);
  const [confetti, setConfetti] = useState(false);

  const pieces = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    id: i, color: COLORS[i % COLORS.length], left: `${5 + Math.random() * 90}%`, delay: `${Math.random() * 0.4}s`,
  })), []);

  const check = useCallback(async () => {
    if (!user) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const snap = await getDoc(doc(db, "users", user.uid, "dailyChallenge", today));
      if (snap.exists()) { setDone(true); setResult(snap.data().correct ? "ok" : "fail"); }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [user]);

  useEffect(() => { check(); }, [check]);

  const answer = async (i: number) => {
    if (!user || done || sel !== null) return;
    setSel(i);
    const ok = i === q.correctIndex;
    setResult(ok ? "ok" : "fail");
    setDone(true);
    if (ok) { setConfetti(true); setTimeout(() => setConfetti(false), 1800); }
    try {
      const today = new Date().toISOString().split("T")[0];
      await setDoc(doc(db, "users", user.uid, "dailyChallenge", today), { correct: ok, answer: i, completedAt: serverTimestamp() });
      if (ok) {
        const { updateDoc, increment } = await import("firebase/firestore");
        await updateDoc(doc(db, "users", user.uid), { xp: increment(30), coins: increment(10) });
        addToast("achievement", "🎯 +30 XP e +10 moedas!");
      } else {
        addToast("info", "Tente novamente amanhã! 💪");
      }
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="card p-4"><div className="h-32 skeleton" /></div>;

  return (
    <div className="card p-4 relative overflow-hidden" style={{ borderTop: done ? undefined : "3px solid var(--color-coins)" }}>
      {confetti && (
        <div className="confetti-container">
          {pieces.map(p => <div key={p.id} className="confetti-piece" style={{ left: p.left, top: "30%", backgroundColor: p.color, animationDelay: p.delay }} />)}
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <div>
            <p className="text-sm font-bold">Desafio Diário</p>
            <p className="text-[10px] font-semibold" style={{ color: "var(--color-text-muted)" }}>
              {done ? (result === "ok" ? "Concluído! ✨" : "Tente amanhã") : `Renova em ${timeToMidnight()}`}
            </p>
          </div>
        </div>
        {!done && <span className="badge badge-warning text-[9px]">+30 XP</span>}
      </div>

      {done ? (
        <div className="p-4 rounded-xl text-center" style={{
          background: result === "ok" ? "var(--color-success-bg)" : "var(--color-error-bg)",
        }}>
          <p className="text-3xl mb-1">{result === "ok" ? "🎉" : "😢"}</p>
          <p className="text-base font-extrabold" style={{ color: result === "ok" ? "var(--color-success)" : "var(--color-error)" }}>
            {result === "ok" ? "Acertou!" : "Errou!"}
          </p>
          {result === "fail" && <p className="text-xs font-semibold mt-1" style={{ color: "var(--color-text-muted)" }}>Resposta: {q.options[q.correctIndex]}</p>}
        </div>
      ) : (
        <>
          <p className="text-sm font-bold mb-3 p-2.5 rounded-lg" style={{ background: "var(--color-bg)" }}>{q.text}</p>
          <div className="grid grid-cols-2 gap-2">
            {q.options.map((o, i) => (
              <button key={i} onClick={() => answer(i)} disabled={sel !== null}
                className="px-3 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all"
                style={{
                  background: sel === i ? (i === q.correctIndex ? "var(--color-success-bg)" : "var(--color-error-bg)") : "var(--color-bg)",
                  color: sel === i ? (i === q.correctIndex ? "var(--color-success)" : "var(--color-error)") : "var(--color-text)",
                  border: `2px solid ${sel === i ? (i === q.correctIndex ? "var(--color-success)" : "var(--color-error)") : "var(--color-border)"}`,
                }}>
                <span className="text-[10px] font-black" style={{ color: "var(--color-text-muted)" }}>{String.fromCharCode(65 + i)} </span>
                {o}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
