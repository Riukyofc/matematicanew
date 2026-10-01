"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { 
  saveQuizResult, 
  saveInfraction, 
  getQuizById, 
  getQuizQuestions, 
  updateUserProfile,
  getUserProfile,
  type Question 
} from "@/lib/firebase";
import { getComboMultiplier, calculatePoints, getStars } from "@/lib/mathEngine";
import Mascot from "@/components/Mascot";

// --- Confetti & Animation Helpers ---

const Confetti = ({ active }: { active: boolean }) => {
  if (!active) return null;
  return (
    <div className="confetti-burst">
      {Array.from({ length: 40 }).map((_, i) => {
        const style = {
          backgroundColor: ["var(--color-success)", "var(--color-primary)", "var(--color-warning)", "var(--color-info)"][Math.floor(Math.random() * 4)],
          left: "50%",
          top: "50%",
          "--tx": `${(Math.random() - 0.5) * 300}px`,
          "--ty": `${(Math.random() - 0.5) * 300}px`,
          "--r": `${Math.random() * 360}deg`
        } as React.CSSProperties;
        return <div key={i} style={style} className="confetti-particle" />;
      })}
    </div>
  );
};

const FloatingXP = ({ amount, active }: { amount: number, active: boolean }) => {
  if (!active) return null;
  return (
    <div className="float-xp right-10 top-0">
      <span className="font-black text-2xl" style={{ color: "var(--color-success)", textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
        +{amount} XP
      </span>
    </div>
  );
};

export default function QuizPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const uid = user?.uid;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizTitle, setQuizTitle] = useState("Quiz");
  const [quizLoading, setQuizLoading] = useState(true);
  const [quizError, setQuizError] = useState("");

  const [cur, setCur] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [done, setDone] = useState(false);
  
  // Results & Stats
  const [results, setResults] = useState<(boolean | null)[]>([]);
  const [xpEarned, setXpEarned] = useState(0);
  const [coinsSpent, setCoinsSpent] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [totalTimeMs, setTotalTimeMs] = useState(0);
  
  const [time, setTime] = useState(120);
  const [initialTime, setInitialTime] = useState(120);
  const [warns, setWarns] = useState(0);
  const [maxInfractions, setMaxInfractions] = useState(3);
  const [resultSaved, setResultSaved] = useState(false);
  
  // Visual effects
  const [showConfetti, setShowConfetti] = useState(false);
  const [floatingXpAmount, setFloatingXpAmount] = useState(0);
  
  const [showHint, setShowHint] = useState(false);
  const [userCoins, setUserCoins] = useState(0);
  
  const startTimeRef = useRef(Date.now());

  const loadQuiz = useCallback(async (quizId: string) => {
    if (!uid) return;
    setQuizLoading(true);
    try {
      const profile = await getUserProfile(uid);
      if (profile) {
        setUserCoins(Number(profile.coins) || 0);
      }

      const quiz = await getQuizById(quizId);
      if (!quiz) {
        setQuizError("Quiz não encontrado.");
        setQuizLoading(false); return;
      }
      setQuizTitle(quiz.title || "Quiz");
      if (quiz.maxInfractions) setMaxInfractions(quiz.maxInfractions);
      if (quiz.isTimerEnabled && quiz.timeLimitSec) {
        setTime(quiz.timeLimitSec);
        setInitialTime(quiz.timeLimitSec);
      }

      const qs = await getQuizQuestions(quizId);
      if (qs.length === 0) {
        setQuizError("Este quiz não tem perguntas.");
        setQuizLoading(false); return;
      }
      setQuestions(qs);
      setResults(qs.map(() => null));
      startTimeRef.current = Date.now();
    } catch (err) {
      console.error(err);
      setQuizError("Erro ao carregar o quiz.");
    } finally {
      setQuizLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    if (id && typeof id === "string") loadQuiz(id);
  }, [id, loadQuiz]);

  const q = questions[cur];

  // Timer Effect
  useEffect(() => {
    if (done || quizLoading || questions.length === 0) return;
    const t = setInterval(() => {
      setTime(v => {
        if (v <= 1) {
          clearInterval(t);
          setDone(true);
          setTotalTimeMs(Date.now() - startTimeRef.current);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [done, quizLoading, questions.length]);

  // Anti-cheat
  useEffect(() => {
    if (quizLoading || questions.length === 0) return;
    const h = () => {
      if (document.hidden && !done) {
        setWarns(w => {
          const n = w + 1;
          if (uid) saveInfraction(uid, "SCREEN_EXIT", `Saída ${n}`).catch(() => {});
          if (n >= maxInfractions) {
            setDone(true);
            setTotalTimeMs(Date.now() - startTimeRef.current);
          }
          return n;
        });
      }
    };
    document.addEventListener("visibilitychange", h);
    return () => document.removeEventListener("visibilitychange", h);
  }, [done, uid, quizLoading, questions.length, maxInfractions]);

  useEffect(() => {
    const h = (e: Event) => e.preventDefault();
    document.addEventListener("copy", h);
    document.addEventListener("contextmenu", h);
    return () => {
      document.removeEventListener("copy", h);
      document.removeEventListener("contextmenu", h);
    };
  }, []);

  const saveResult = useCallback(async () => {
    if (!uid || questions.length === 0 || typeof id !== "string") return;
    const finalScore = results.filter(r => r === true).length;
    const isPerfect = finalScore === questions.length;
    
    try {
      await saveQuizResult(uid, id, finalScore, questions.length, xpEarned);
      if (coinsSpent > 0) {
        const currentProfile = await getUserProfile(uid);
        if (currentProfile) {
          await updateUserProfile(uid, { coins: Math.max(0, (Number(currentProfile.coins) || 0) - coinsSpent) });
        }
      }
      
      const { updateTodayStats, addStudyTime } = await import("@/lib/firebase");
      const minutes = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000));
      
      await addStudyTime(uid, minutes);
      await updateTodayStats(uid, {
        quizzes: 1,
        perfectQuizzes: isPerfect ? 1 : 0,
        xpEarned: xpEarned,
        studyMinutes: minutes
      });
      
      await refreshProfile();
    } catch (err) {
      console.error(err);
    }
  }, [uid, questions.length, id, results, xpEarned, coinsSpent, refreshProfile]);

  useEffect(() => {
    if (done && !resultSaved) {
      setResultSaved(true);
      setTotalTimeMs(Date.now() - startTimeRef.current);
      saveResult();
    }
  }, [done, resultSaved, saveResult]);

  const useHint = () => {
    if (showHint || userCoins < 5 || answered) return;
    setUserCoins(c => c - 5);
    setCoinsSpent(c => c + 5);
    setShowHint(true);
  };

  const confirm = () => {
    if (sel === null || !q || answered) return;
    
    const isCorrect = sel === q.correctIndex;
    const newResults = [...results];
    newResults[cur] = isCorrect;
    setResults(newResults);
    setAnswered(true);
    
    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak(Math.max(maxStreak, newStreak));
      
      const mult = getComboMultiplier(newStreak);
      setComboMultiplier(mult);
      
      const basePoints = q.points || 10;
      const pts = calculatePoints(basePoints, { streak: newStreak, multiplier: mult, maxStreak: maxStreak, totalBonus: 0 }, 0);
      
      setXpEarned(x => x + pts);
      setFloatingXpAmount(pts);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    } else {
      setStreak(0);
      setComboMultiplier(1);
    }
  };

  const next = () => {
    if (cur < questions.length - 1) {
      setCur(c => c + 1);
      setSel(null);
      setAnswered(false);
      setShowHint(false);
    } else {
      setDone(true);
      setTotalTimeMs(Date.now() - startTimeRef.current);
    }
  };

  if (quizLoading) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6 animate-fade-in flex flex-col items-center">
        <div className="skeleton w-64 h-8 rounded-lg" style={{ backgroundColor: "var(--color-bg-secondary)" }} />
        <div className="flex gap-2 w-full">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton flex-1 h-3 rounded-full" style={{ backgroundColor: "var(--color-bg-secondary)" }} />)}
        </div>
        <div className="skeleton w-full h-80 rounded-3xl" style={{ backgroundColor: "var(--color-bg-secondary)" }} />
      </div>
    );
  }

  if (quizError || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-up px-4">
        <div className="text-6xl mb-6 animate-bounce">❓</div>
        <h2 className="text-3xl font-black mb-3" style={{ color: "var(--color-text)" }}>{quizError || "Quiz indisponível"}</h2>
        <p className="text-base font-semibold mb-8" style={{ color: "var(--color-text-muted)" }}>O professor precisa adicionar perguntas a este quiz.</p>
        <button onClick={() => router.push("/dashboard")} className="px-8 py-4 rounded-xl btn-primary text-base font-bold shadow-md transition-transform hover:scale-105 active:scale-95">
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  if (!uid) return null;

  // ==== RESULT SCREEN ====
  if (done) {
    const finalScore = results.filter(r => r === true).length;
    const pct = Math.round((finalScore / questions.length) * 100);
    const wasCancelled = warns >= maxInfractions;
    const stars = wasCancelled ? 0 : getStars(pct);
    const totalCoins = finalScore === questions.length ? 15 : 10; // Simple coin logic from DB
    
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-up">
        <div className="card-game p-8 text-center relative overflow-hidden" style={{ backgroundColor: "var(--color-surface)", border: "2px solid var(--color-border)" }}>
          {wasCancelled && (
            <div className="mb-6 p-4 rounded-xl animate-shake font-bold" style={{ backgroundColor: "var(--color-error-bg)", color: "var(--color-error)", border: "2px solid var(--color-error)" }}>
              ⚠ Quiz Cancelado: Limite de saídas de tela excedido ({warns}/{maxInfractions})
            </div>
          )}
          
          <div className="star-container mb-6">
            {[1, 2, 3].map(s => (
              <div key={s} className={`star-icon ${s <= stars ? 'earned' : 'empty'}`}>
                ⭐
              </div>
            ))}
          </div>

          <h2 className="text-4xl font-black mb-2" style={{ color: "var(--color-text)" }}>
            {wasCancelled ? "Cancelado!" : pct >= 90 ? "Impressionante!" : pct >= 70 ? "Muito Bem!" : "Continue Tentando!"}
          </h2>
          <p className="text-lg font-bold mb-8" style={{ color: "var(--color-text-muted)" }}>
            Você acertou {finalScore} de {questions.length} ({pct}%)
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="card-flat p-4 flex flex-col items-center justify-center">
              <span className="text-2xl mb-1">✨</span>
              <span className="text-xl font-black" style={{ color: "var(--color-primary)" }}>+{xpEarned}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>XP</span>
            </div>
            <div className="card-flat p-4 flex flex-col items-center justify-center">
              <span className="text-2xl mb-1">🪙</span>
              <span className="text-xl font-black" style={{ color: "var(--color-coins)" }}>+{totalCoins}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Moedas</span>
            </div>
            <div className="card-flat p-4 flex flex-col items-center justify-center">
              <span className="text-2xl mb-1">🔥</span>
              <span className="text-xl font-black" style={{ color: "var(--color-warning)" }}>{maxStreak}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Max Combo</span>
            </div>
            <div className="card-flat p-4 flex flex-col items-center justify-center">
              <span className="text-2xl mb-1">⏱️</span>
              <span className="text-xl font-black" style={{ color: "var(--color-info)" }}>{Math.floor(totalTimeMs/1000/60)}:{(Math.floor(totalTimeMs/1000)%60).toString().padStart(2, '0')}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Tempo</span>
            </div>
          </div>

          <div className="mb-8" id="revisar">
            <h4 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "var(--color-text-muted)" }}>Resumo das Perguntas</h4>
            <div className="flex flex-wrap justify-center gap-2">
              {results.map((r, i) => (
                <div key={i} className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-sm"
                  style={{
                    backgroundColor: r === true ? "var(--color-success-bg)" : r === false ? "var(--color-error-bg)" : "var(--color-surface)",
                    color: r === true ? "var(--color-success)" : r === false ? "var(--color-error)" : "var(--color-text-muted)",
                    border: `2px solid ${r === true ? "var(--color-success)" : r === false ? "var(--color-error)" : "var(--color-border)"}`
                  }}>
                  {r === true ? "✓" : r === false ? "✗" : "-"}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => window.location.reload()} className="btn-secondary px-6 py-4 rounded-xl font-bold flex-1">
              Tentar Novamente
            </button>
            <button onClick={() => {
              document.getElementById('revisar')?.scrollIntoView({ behavior: 'smooth' })
            }} className="btn-secondary px-6 py-4 rounded-xl font-bold flex-1">
              Revisar Erros
            </button>
            <button onClick={() => router.push("/dashboard")} className="btn-primary px-6 py-4 rounded-xl font-bold flex-1">
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==== IN PROGRESS QUIZ ====

  const r = 20;
  const circ = 2 * Math.PI * r;
  const dashoffset = circ - (time / initialTime) * circ;
  const isTimeLow = time <= 10;
  const timerColor = time > initialTime / 2 ? "var(--color-success)" : time > 10 ? "var(--color-warning)" : "var(--color-error)";

  const isCorrectSel = answered && sel === q.correctIndex;
  const isWrongSel = answered && sel !== q.correctIndex && sel !== null;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 animate-fade-in relative min-h-screen pb-24">
      <Confetti active={showConfetti} />
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push("/dashboard")} className="font-bold text-sm hover:opacity-80 transition-opacity flex items-center gap-2" style={{ color: "var(--color-text-muted)" }}>
          ← Sair
        </button>
        
        <div className="flex items-center gap-6">
          {warns > 0 && (
            <div className="px-3 py-1 rounded-lg font-bold text-xs animate-pulse" style={{ backgroundColor: "var(--color-warning-bg)", color: "var(--color-warning)", border: "1px solid var(--color-warning)" }}>
              ⚠ {warns}/{maxInfractions}
            </div>
          )}
          
          <div className="flex items-center gap-2 font-black text-xl" style={{ color: "var(--color-primary)" }}>
            ✨ {xpEarned} XP
          </div>

          <div className="hidden sm:block">
            <Mascot size="sm" state={answered ? (isCorrectSel ? "happy" : "sad") : "thinking"} />
          </div>

          {/* Circular Timer */}
          <div className={`relative flex items-center justify-center w-14 h-14 ${isTimeLow ? 'timer-urgent' : ''}`}>
            <svg className="w-full h-full transform -rotate-90 timer-circle">
              <circle cx="28" cy="28" r="20" fill="none" strokeWidth="4" stroke="var(--color-border)" />
              <circle cx="28" cy="28" r="20" fill="none" strokeWidth="4" stroke={timerColor}
                strokeDasharray={circ} strokeDashoffset={dashoffset}
                className="transition-all duration-1000 ease-linear" strokeLinecap="round" />
            </svg>
            <span className="absolute font-black text-sm" style={{ color: timerColor }}>
              {time}
            </span>
          </div>
        </div>
      </div>

      {/* Progress & Combo */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 flex gap-1.5 h-3">
          {questions.map((_, i) => (
            <div key={i} className="flex-1 rounded-full transition-all duration-300"
              style={{
                backgroundColor: i < cur 
                  ? (results[i] ? "var(--color-success)" : "var(--color-error)") 
                  : i === cur ? "var(--color-primary)" : "var(--color-border)",
                opacity: i === cur ? (answered ? 0.5 : 1) : 1,
                boxShadow: i === cur && !answered ? "0 0 8px var(--color-primary)" : "none"
              }} 
            />
          ))}
        </div>
        {streak > 1 && (
          <div className="combo-badge" style={{ color: "var(--color-primary)", backgroundColor: "var(--color-primary-bg)" }}>
            🔥 {comboMultiplier}x
          </div>
        )}
      </div>

      {/* Main Question Card */}
      <div className="relative mb-6">
        <FloatingXP amount={floatingXpAmount} active={showConfetti} />
        
        <div className="card-game p-6 sm:p-8 relative rounded-3xl" style={{ 
          backgroundColor: "var(--color-surface)", 
          border: answered ? (isCorrectSel ? "2px solid var(--color-success)" : "2px solid var(--color-error)") : "2px solid var(--color-border)",
          boxShadow: answered && isCorrectSel ? "0 0 20px rgba(16, 185, 129, 0.2)" : "var(--shadow-card)",
          transition: "all 0.3s ease"
        }}>
          
          <div className="flex justify-between items-start mb-6">
            <span className="font-bold text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
              Pergunta {cur + 1} de {questions.length}
            </span>
            <button 
              onClick={useHint} 
              disabled={showHint || answered || userCoins < 5}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${showHint || answered || userCoins < 5 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95 cursor-pointer'}`}
              style={{ 
                backgroundColor: showHint ? "var(--color-info-bg)" : "transparent",
                borderColor: showHint ? "var(--color-info)" : "var(--color-coins)",
                color: showHint ? "var(--color-info)" : "var(--color-coins)"
              }}>
              💡 Dica (5 moedas)
            </button>
          </div>
          
          <h3 className="text-2xl sm:text-3xl font-black mb-8 leading-tight" style={{ color: "var(--color-text)" }}>
            {q.text}
          </h3>

          {showHint && (
            <div className="mb-6 p-4 rounded-xl animate-fade-down border-l-4" style={{ backgroundColor: "var(--color-info-bg)", borderColor: "var(--color-info)", color: "var(--color-text)" }}>
              <p className="font-semibold text-sm">💡 Dica: {(q as any).hint || "Preste atenção aos detalhes da questão."}</p>
            </div>
          )}

          <div className="space-y-4">
            {q.options.map((opt, idx) => {
              const isSelected = sel === idx;
              const isCorrectOpt = idx === q.correctIndex;
              
              let btnStyle = {
                backgroundColor: "transparent",
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
              };
              let letterStyle = {
                backgroundColor: "var(--color-bg)",
                color: "var(--color-text-muted)",
              };

              if (answered) {
                if (isCorrectOpt) {
                  btnStyle = { backgroundColor: "var(--color-success-bg)", borderColor: "var(--color-success)", color: "var(--color-success)" };
                  letterStyle = { backgroundColor: "var(--color-success)", color: "white" };
                } else if (isSelected) {
                  btnStyle = { backgroundColor: "var(--color-error-bg)", borderColor: "var(--color-error)", color: "var(--color-error)" };
                  letterStyle = { backgroundColor: "var(--color-error)", color: "white" };
                }
              } else if (isSelected) {
                btnStyle = { backgroundColor: "var(--color-primary-bg)", borderColor: "var(--color-primary)", color: "var(--color-primary)" };
                letterStyle = { backgroundColor: "var(--color-primary)", color: "white" };
              }

              return (
                <button 
                  key={idx} 
                  onClick={() => !answered && setSel(idx)} 
                  disabled={answered}
                  className={`w-full flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 text-left font-bold text-lg sm:text-xl transition-all duration-200 
                    ${!answered && !isSelected ? "hover:border-blue-300 hover-scale" : ""} 
                    ${!answered ? "cursor-pointer active:scale-[0.98]" : ""}
                    ${answered && isSelected && !isCorrectOpt ? "animate-shake" : ""}`}
                  style={btnStyle}
                >
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg transition-colors shadow-sm" style={letterStyle}>
                    {answered && isCorrectOpt ? "✓" : answered && isSelected && !isCorrectOpt ? "✗" : String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Explanation Panel (Shows when wrong) */}
        {answered && !isCorrectSel && (
          <div className="explanation-panel mt-4 p-6 rounded-2xl shadow-md border-2" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-error)" }}>
            <h4 className="font-black text-lg flex items-center gap-2 mb-2" style={{ color: "var(--color-error)" }}>
              <span>✗</span> Resposta Incorreta
            </h4>
            <div className="font-semibold text-base" style={{ color: "var(--color-text)" }}>
              <p className="whitespace-pre-line">
                {/* Fallback to simple explanation if it doesn't exist */}
                {(q as any).explanation || `Resposta correta: ${q.options[q.correctIndex]}`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions fixed */}
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t flex justify-center items-center z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        <div className="max-w-3xl w-full flex justify-end">
          {!answered ? (
            <button 
              onClick={confirm} 
              disabled={sel === null} 
              className={`px-10 py-4 rounded-xl text-lg font-black transition-all shadow-md w-full sm:w-auto
                ${sel !== null 
                  ? "btn-primary cursor-pointer active:scale-95" 
                  : "opacity-50 cursor-not-allowed"}`
              }
              style={sel === null ? { backgroundColor: "var(--color-bg)", color: "var(--color-text-muted)" } : {}}
            >
              Confirmar
            </button>
          ) : (
            <button 
              onClick={next} 
              className="px-10 py-4 rounded-xl btn-primary text-lg font-black shadow-md w-full sm:w-auto active:scale-95 animate-pulse"
            >
              {cur < questions.length - 1 ? "Próxima Pergunta →" : "Ver Resultado Final 🏆"}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
