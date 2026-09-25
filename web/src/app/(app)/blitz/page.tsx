"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { addStudyTime, updateUserProfile, updateTodayStats } from "@/lib/firebase";
import { increment } from "firebase/firestore";
import {
  generateBlitzQuestions,
  getComboMultiplier,
  getCategoryInfo,
  getDifficultyInfo,
  type GeneratedQuestion,
  type Difficulty,
} from "@/lib/mathEngine";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ScreenState = "start" | "countdown" | "game" | "result";

export default function BlitzPage() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();

  // Screen management
  const [screen, setScreen] = useState<ScreenState>("start");
  
  // Record
  const [record, setRecord] = useState<number>(0);

  // Game state
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  // Interaction state
  const [countdown, setCountdown] = useState(3);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Result state
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);

  // Audio references (optional, if we had sounds)
  // const correctSound = useRef<HTMLAudioElement | null>(null);

  // Load record on mount
  useEffect(() => {
    const savedRecord = localStorage.getItem("blitzRecord");
    if (savedRecord) {
      setRecord(parseInt(savedRecord, 10));
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (screen === "game" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [screen, timeLeft]);

  const startGame = () => {
    setQuestions(generateBlitzQuestions(150)); // Generate plenty of questions
    setCurrentIndex(0);
    setTimeLeft(60);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCorrectCount(0);
    setWrongCount(0);
    setFeedback(null);
    setSelectedOption(null);
    setIsProcessing(false);
    setIsNewRecord(false);
    setCountdown(3);
    setScreen("countdown");
  };

  // Countdown logic
  useEffect(() => {
    if (screen === "countdown") {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 800);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => setScreen("game"), 800);
        return () => clearTimeout(timer);
      }
    }
  }, [screen, countdown]);

  const handleOptionClick = (index: number) => {
    if (isProcessing || screen !== "game") return;
    
    setIsProcessing(true);
    setSelectedOption(index);
    
    const question = questions[currentIndex];
    const isCorrect = index === question.correctIndex;
    
    if (isCorrect) {
      setFeedback("correct");
      const multiplier = getComboMultiplier(streak + 1);
      const pointsEarned = question.points * multiplier;
      
      setScore((prev) => prev + pointsEarned);
      setStreak((prev) => {
        const newStreak = prev + 1;
        if (newStreak > maxStreak) setMaxStreak(newStreak);
        return newStreak;
      });
      setCorrectCount((prev) => prev + 1);
      setTimeLeft((prev) => prev + 1); // +1 second
    } else {
      setFeedback("wrong");
      setStreak(0);
      setWrongCount((prev) => prev + 1);
      setTimeLeft((prev) => Math.max(0, prev - 2)); // -2 seconds
    }
    
    setTimeout(() => {
      setFeedback(null);
      setSelectedOption(null);
      setIsProcessing(false);
      setCurrentIndex((prev) => prev + 1);
    }, 400);
  };

  const endGame = useCallback(async () => {
    setScreen("result");
    
    // Calculate rewards
    const xp = correctCount * 2;
    const coins = Math.floor(correctCount / 3);
    setXpEarned(xp);
    setCoinsEarned(coins);

    // Update record
    setScore((currentScore) => {
      if (currentScore > record) {
        setIsNewRecord(true);
        setRecord(currentScore);
        localStorage.setItem("blitzRecord", currentScore.toString());
      }
      return currentScore;
    });

    // Save to Firebase
    if (user) {
      try {
        await addStudyTime(user.uid, 1);
        if (xp > 0 || coins > 0) {
          await updateUserProfile(user.uid, {
            xp: increment(xp),
            coins: increment(coins)
          });
          
          await updateTodayStats(user.uid, {
            blitzGames: 1,
            xpEarned: xp,
            studyMinutes: 1
          });
          
          refreshProfile();
        }
      } catch (error) {
        console.error("Failed to save blitz results to Firebase:", error);
      }
    }
  }, [correctCount, record, user, refreshProfile]);

  // Current question safely
  const q = questions[currentIndex];

  return (
    <div className="min-h-screen pb-20 pt-6 px-4" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-2xl mx-auto h-full flex flex-col">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="btn-ghost" style={{ color: "var(--color-text-secondary)" }}>
            ◀ Voltar
          </Link>
          <div className="font-black text-xl flex items-center gap-2" style={{ color: "var(--color-warning)" }}>
            ⚡ BLITZ
          </div>
          <div className="w-16"></div> {/* Spacer for balance */}
        </div>

        {/* --- START SCREEN --- */}
        {screen === "start" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in gap-8">
            <div className="space-y-4">
              <div className="text-6xl animate-bounce">⚡</div>
              <h1 className="text-5xl font-black italic tracking-tighter uppercase" style={{ color: "var(--color-text)", textShadow: "0 4px 0 var(--color-warning)" }}>
                Modo Blitz
              </h1>
              <p className="text-lg max-w-md mx-auto" style={{ color: "var(--color-text-secondary)" }}>
                60 segundos. Máximo de questões. Quanto mais acerta, mais difícil fica!
              </p>
            </div>

            <div className="card-flat p-6 w-full max-w-sm" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <div className="text-sm font-bold uppercase mb-2" style={{ color: "var(--color-text-muted)" }}>Seu Recorde</div>
              <div className="text-4xl font-black" style={{ color: "var(--color-warning)" }}>{record} <span className="text-lg">pts</span></div>
            </div>

            <div className="space-y-3 text-left w-full max-w-sm card-flat p-5" style={{ backgroundColor: "var(--color-info-bg)" }}>
              <h3 className="font-bold flex items-center gap-2" style={{ color: "var(--color-info)" }}>
                <span>📜</span> Regras
              </h3>
              <ul className="text-sm space-y-2 font-medium" style={{ color: "var(--color-text-secondary)" }}>
                <li className="flex items-center gap-2"><span>🟢</span> +1 segundo por acerto</li>
                <li className="flex items-center gap-2"><span>🔴</span> -2 segundos por erro</li>
                <li className="flex items-center gap-2"><span>🔥</span> Combos multiplicam pontos</li>
              </ul>
            </div>

            <button 
              onClick={startGame}
              className="btn-primary w-full max-w-sm text-xl py-4 animate-pulse uppercase font-black tracking-widest"
              style={{ backgroundColor: "var(--color-warning)", color: "#000" }}
            >
              Iniciar ⚡
            </button>
          </div>
        )}

        {/* --- COUNTDOWN SCREEN --- */}
        {screen === "countdown" && (
          <div className="flex-1 flex items-center justify-center">
            <div 
              key={countdown} 
              className="text-9xl font-black animate-pop-in italic"
              style={{ 
                color: countdown === 0 ? "var(--color-success)" : "var(--color-warning)",
                textShadow: "0 8px 0 var(--color-text)"
              }}
            >
              {countdown > 0 ? countdown : "GO!"}
            </div>
          </div>
        )}

        {/* --- GAME SCREEN --- */}
        {screen === "game" && q && (
          <div className="flex-1 flex flex-col gap-6 animate-fade-in relative">
            
            {/* Top Bar: Timer & Score */}
            <div className="flex justify-between items-center bg-opacity-50 p-4 rounded-2xl backdrop-blur-sm" style={{ backgroundColor: "var(--color-surface)" }}>
              
              {/* Score & Streak */}
              <div className="flex flex-col gap-1">
                <div className="text-sm font-bold" style={{ color: "var(--color-text-muted)" }}>PONTOS</div>
                <div className="text-3xl font-black" style={{ color: "var(--color-text)" }}>{score}</div>
                
                {streak > 1 && (
                  <div className="text-xs font-bold animate-pop-in flex items-center gap-1" style={{ color: "var(--color-error)" }}>
                    🔥 {streak}x COMBO
                  </div>
                )}
              </div>

              {/* Timer Circular */}
              <div className="relative flex items-center justify-center w-24 h-24">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="40" fill="none" strokeWidth="8" stroke="var(--color-border)" />
                  <circle 
                    cx="48" cy="48" r="40" 
                    fill="none" strokeWidth="8" 
                    stroke={timeLeft <= 10 ? "var(--color-error)" : "var(--color-warning)"} 
                    strokeLinecap="round"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * (timeLeft / 60))}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div 
                  className={`text-3xl font-black absolute ${timeLeft <= 10 ? 'animate-pulse' : ''}`}
                  style={{ color: timeLeft <= 10 ? "var(--color-error)" : "var(--color-text)" }}
                >
                  {timeLeft}
                </div>
              </div>
            </div>

            {/* Question Card */}
            <div 
              className={`card-game flex-1 flex flex-col justify-center transition-all duration-300 ${
                feedback === "correct" ? "border-4 scale-105" : feedback === "wrong" ? "border-4 animate-shake" : ""
              }`}
              style={{ 
                borderColor: feedback === "correct" ? "var(--color-success)" : feedback === "wrong" ? "var(--color-error)" : "var(--color-border)"
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <span className="badge" style={{ backgroundColor: getDifficultyInfo(q.difficulty).color + '20', color: getDifficultyInfo(q.difficulty).color }}>
                  {getDifficultyInfo(q.difficulty).emoji} {getDifficultyInfo(q.difficulty).name}
                </span>
                <span className="text-sm font-bold" style={{ color: "var(--color-text-muted)" }}>
                  Q{currentIndex + 1}
                </span>
              </div>
              
              <div className="text-center py-8">
                <h2 className="text-2xl sm:text-3xl font-bold leading-tight" style={{ color: "var(--color-text)" }}>
                  {q.text}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
                {q.options.map((opt, i) => {
                  let btnStyle: React.CSSProperties = { 
                    backgroundColor: "var(--color-surface)", 
                    color: "var(--color-text)",
                    borderColor: "var(--color-border)"
                  };
                  
                  if (feedback) {
                    if (i === q.correctIndex) {
                      btnStyle = { backgroundColor: "var(--color-success)", color: "#fff", borderColor: "var(--color-success)" };
                    } else if (i === selectedOption) {
                      btnStyle = { backgroundColor: "var(--color-error)", color: "#fff", borderColor: "var(--color-error)" };
                    } else {
                      btnStyle.opacity = 0.5;
                    }
                  } else if (i === selectedOption) {
                    btnStyle = { backgroundColor: "var(--color-primary)", color: "#fff", borderColor: "var(--color-primary)" };
                  }

                  return (
                    <button
                      key={i}
                      disabled={isProcessing}
                      onClick={() => handleOptionClick(i)}
                      className="card-flat py-5 text-xl font-bold transition-all active:scale-95"
                      style={btnStyle}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* --- RESULT SCREEN --- */}
        {screen === "result" && (
          <div className="flex-1 flex flex-col items-center justify-center animate-fade-up gap-6 text-center">
            
            <div className="text-6xl mb-2 animate-bounce">💥</div>
            <h1 className="text-4xl font-black italic uppercase" style={{ color: "var(--color-error)" }}>
              Tempo Esgotado!
            </h1>

            {isNewRecord && (
              <div className="badge-primary px-4 py-2 text-lg font-bold animate-pulse" style={{ backgroundColor: "var(--color-warning)", color: "#000" }}>
                🎉 NOVO RECORDE! 🎉
              </div>
            )}

            <div className="card-flat w-full p-8 flex flex-col items-center gap-2 relative overflow-hidden" style={{ backgroundColor: "var(--color-surface)" }}>
              <div className="text-sm font-bold" style={{ color: "var(--color-text-muted)" }}>PONTUAÇÃO FINAL</div>
              <div className="text-7xl font-black" style={{ color: "var(--color-text)" }}>{score}</div>
              
              <div className="w-full h-px my-4" style={{ backgroundColor: "var(--color-divider)" }}></div>
              
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="flex flex-col">
                  <span className="text-sm font-bold" style={{ color: "var(--color-text-muted)" }}>Acertos</span>
                  <span className="text-2xl font-bold" style={{ color: "var(--color-success)" }}>{correctCount}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold" style={{ color: "var(--color-text-muted)" }}>Erros</span>
                  <span className="text-2xl font-bold" style={{ color: "var(--color-error)" }}>{wrongCount}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold" style={{ color: "var(--color-text-muted)" }}>Precisão</span>
                  <span className="text-2xl font-bold" style={{ color: "var(--color-info)" }}>
                    {correctCount + wrongCount > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0}%
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold" style={{ color: "var(--color-text-muted)" }}>Combo Máx</span>
                  <span className="text-2xl font-bold" style={{ color: "var(--color-warning)" }}>{maxStreak}🔥</span>
                </div>
              </div>
            </div>

            {/* Rewards */}
            <div className="flex gap-4 w-full justify-center">
              <div className="card-flat px-6 py-3 flex items-center gap-2" style={{ backgroundColor: "var(--color-info-bg)" }}>
                <span className="text-2xl">✨</span>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold" style={{ color: "var(--color-text-muted)" }}>XP Ganho</span>
                  <span className="font-bold" style={{ color: "var(--color-info)" }}>+{xpEarned} XP</span>
                </div>
              </div>
              <div className="card-flat px-6 py-3 flex items-center gap-2" style={{ backgroundColor: "var(--color-coins-bg)" }}>
                <span className="text-2xl">🪙</span>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold" style={{ color: "var(--color-text-muted)" }}>Moedas</span>
                  <span className="font-bold" style={{ color: "var(--color-coins)" }}>+{coinsEarned}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
              <button onClick={startGame} className="btn-primary flex-1 py-4 text-lg">
                Jogar Novamente
              </button>
              <Link href="/" className="btn-secondary flex-1 py-4 text-lg text-center flex items-center justify-center">
                Voltar ao Início
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
