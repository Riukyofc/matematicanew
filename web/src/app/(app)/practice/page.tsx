"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { addStudyTime, updateUserProfile } from "@/lib/firebase";
import { 
  ALL_CATEGORIES, 
  Category, 
  Difficulty, 
  GeneratedQuestion, 
  generateSingleQuestion, 
  getCategoryInfo, 
  getDifficultyInfo 
} from "@/lib/mathEngine";
import Link from "next/link";
import { increment } from "firebase/firestore";

type SessionState = "select" | "playing" | "summary";

interface CategoryStats {
  correct: number;
  wrong: number;
}

interface PracticeStats {
  questionsAnswered: number;
  correct: number;
  wrong: number;
  streak: number;
  xpEarned: number;
  categoryStats: Partial<Record<Category, CategoryStats>>;
}

export default function PracticePage() {
  const { user, profile, refreshProfile } = useAuth();
  
  // Selection state
  const [sessionState, setSessionState] = useState<SessionState>("select");
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("medium");
  
  // Playing state
  const [currentQuestion, setCurrentQuestion] = useState<GeneratedQuestion | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  // Stats state
  const [stats, setStats] = useState<PracticeStats>({
    questionsAnswered: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    xpEarned: 0,
    categoryStats: {}
  });

  const difficulties: Difficulty[] = ["easy", "medium", "hard"];

  const startSession = () => {
    setStats({
      questionsAnswered: 0,
      correct: 0,
      wrong: 0,
      streak: 0,
      xpEarned: 0,
      categoryStats: {}
    });
    setStartTime(new Date());
    nextQuestion();
    setSessionState("playing");
  };

  const nextQuestion = () => {
    const categoryToUse = selectedCategory === "all" 
      ? ALL_CATEGORIES[Math.floor(Math.random() * ALL_CATEGORIES.length)] 
      : selectedCategory;
      
    const q = generateSingleQuestion(categoryToUse, selectedDifficulty);
    setCurrentQuestion(q);
    setAnswered(false);
    setIsCorrect(null);
    setSelectedOptionIndex(null);
  };

  const handleAnswer = (index: number) => {
    if (answered || !currentQuestion) return;
    
    const correct = index === currentQuestion.correctIndex;
    setAnswered(true);
    setIsCorrect(correct);
    setSelectedOptionIndex(index);
    
    setStats(prev => {
      const cat = currentQuestion.category;
      const catStats = prev.categoryStats[cat] || { correct: 0, wrong: 0 };
      
      return {
        ...prev,
        questionsAnswered: prev.questionsAnswered + 1,
        correct: prev.correct + (correct ? 1 : 0),
        wrong: prev.wrong + (correct ? 0 : 1),
        streak: correct ? prev.streak + 1 : 0,
        xpEarned: prev.xpEarned + (correct ? 1 : 0),
        categoryStats: {
          ...prev.categoryStats,
          [cat]: {
            correct: catStats.correct + (correct ? 1 : 0),
            wrong: catStats.wrong + (correct ? 0 : 1)
          }
        }
      };
    });
  };

  const endSession = async () => {
    setSessionState("summary");
    
    if (user && startTime) {
      const endTime = new Date();
      const minutes = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 60000));
      
      try {
        await addStudyTime(user.uid, minutes);
        await updateUserProfile(user.uid, {
          xp: increment(stats.xpEarned),
          practiceQuestions: increment(stats.questionsAnswered)
        });
        
        const { updateTodayStats } = await import("@/lib/firebase");
        await updateTodayStats(user.uid, {
          practiceQuestions: stats.questionsAnswered,
          xpEarned: stats.xpEarned,
          studyMinutes: minutes
        });
        
        await refreshProfile();
      } catch (err) {
        console.error("Failed to save practice stats", err);
      }
    }
  };

  if (sessionState === "select") {
    return (
      <div className="animate-fade-in" style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-text)", marginBottom: "8px" }}>
            Modo Prática 🎯
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "1.1rem" }}>
            Treine matemática sem tempo, sem pressão. Apenas aprenda!
          </p>
        </div>

        <div className="card" style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "16px" }}>1. Escolha a Categoria</h2>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", 
            gap: "12px" 
          }}>
            <button
              onClick={() => setSelectedCategory("all")}
              style={{
                padding: "16px",
                borderRadius: "var(--radius-lg)",
                border: `2px solid ${selectedCategory === "all" ? "var(--color-primary)" : "var(--color-border)"}`,
                backgroundColor: selectedCategory === "all" ? "var(--color-primary-bg)" : "var(--color-surface)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s"
              }}
            >
              <span style={{ fontSize: "2rem" }}>🎲</span>
              <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text)" }}>Todas as categorias</span>
            </button>
            
            {ALL_CATEGORIES.map(cat => {
              const info = getCategoryInfo(cat);
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: "16px",
                    borderRadius: "var(--radius-lg)",
                    border: `2px solid ${isSelected ? info.color : "var(--color-border)"}`,
                    backgroundColor: isSelected ? `${info.color}15` : "var(--color-surface)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s"
                  }}
                >
                  <span style={{ fontSize: "2rem" }}>{info.emoji}</span>
                  <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text)" }}>{info.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "16px" }}>2. Escolha a Dificuldade</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {difficulties.map(diff => {
              const info = getDifficultyInfo(diff);
              const isSelected = selectedDifficulty === diff;
              return (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  style={{
                    flex: 1,
                    minWidth: "100px",
                    padding: "12px",
                    borderRadius: "var(--radius-full)",
                    border: `2px solid ${isSelected ? info.color : "var(--color-border)"}`,
                    backgroundColor: isSelected ? `${info.color}15` : "var(--color-surface)",
                    color: "var(--color-text)",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.2s"
                  }}
                >
                  <span>{info.emoji}</span>
                  {info.name}
                </button>
              );
            })}
          </div>
        </div>

        <button 
          className="btn-primary" 
          onClick={startSession}
          style={{ width: "100%", padding: "16px", fontSize: "1.2rem", borderRadius: "var(--radius-full)" }}
        >
          Começar Prática 🚀
        </button>
      </div>
    );
  }

  if (sessionState === "playing" && currentQuestion) {
    const catInfo = getCategoryInfo(currentQuestion.category);
    const diffInfo = getDifficultyInfo(currentQuestion.difficulty);
    const accuracy = stats.questionsAnswered > 0 ? Math.round((stats.correct / stats.questionsAnswered) * 100) : 0;

    return (
      <div className="animate-fade-in" style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px" }}>
        
        {/* Header Stats */}
        <div style={{ 
          display: "flex", 
          flexWrap: "wrap",
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "24px",
          gap: "16px",
          backgroundColor: "var(--color-surface)",
          padding: "16px",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{ display: "flex", gap: "16px" }}>
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: 600 }}>Questões</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>{stats.questionsAnswered}</div>
            </div>
            <div style={{ color: "var(--color-success)" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>Acertos</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>{stats.correct}</div>
            </div>
            <div style={{ color: "var(--color-error)" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>Erros</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>{stats.wrong}</div>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: 600 }}>Precisão</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: accuracy >= 70 ? "var(--color-success)" : accuracy >= 40 ? "var(--color-warning)" : "var(--color-text)" }}>
                {accuracy}%
              </div>
            </div>
            <div className="badge" style={{ backgroundColor: "var(--color-warning-bg)", color: "var(--color-warning)" }}>
              🔥 Combo: {stats.streak}
            </div>
            <button className="btn-ghost" onClick={endSession} style={{ padding: "8px 16px" }}>
              Encerrar
            </button>
          </div>
        </div>

        <div className="card-game animate-pop-in">
          {/* Question Badges */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            <span className="badge" style={{ backgroundColor: `${catInfo.color}20`, color: catInfo.color }}>
              {catInfo.emoji} {catInfo.name}
            </span>
            <span className="badge" style={{ backgroundColor: `${diffInfo.color}20`, color: diffInfo.color }}>
              {diffInfo.emoji} {diffInfo.name}
            </span>
          </div>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "32px", color: "var(--color-text)" }}>
            {currentQuestion.text}
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
            {currentQuestion.options.map((opt, i) => {
              const btnStyle: React.CSSProperties = {
                padding: "16px",
                borderRadius: "var(--radius-lg)",
                border: "2px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
                fontSize: "1.1rem",
                fontWeight: 600,
                cursor: answered ? "default" : "pointer",
                textAlign: "left",
                transition: "all 0.2s"
              };

              if (answered) {
                if (i === currentQuestion.correctIndex) {
                  btnStyle.backgroundColor = "var(--color-success-bg)";
                  btnStyle.borderColor = "var(--color-success)";
                  btnStyle.color = "var(--color-success)";
                } else if (i === selectedOptionIndex) {
                  btnStyle.backgroundColor = "var(--color-error-bg)";
                  btnStyle.borderColor = "var(--color-error)";
                  btnStyle.color = "var(--color-error)";
                } else {
                  btnStyle.opacity = "0.5";
                }
              }

              return (
                <button 
                  key={i} 
                  onClick={() => handleAnswer(i)}
                  style={btnStyle}
                  disabled={answered}
                  className={!answered ? "hover:border-[var(--color-primary)]" : ""}
                >
                  {String.fromCharCode(65 + i)}) {opt}
                </button>
              );
            })}
          </div>

          {answered && (
            <div className="animate-fade-up" style={{
              padding: "20px",
              borderRadius: "var(--radius-lg)",
              backgroundColor: isCorrect ? "var(--color-success-bg)" : "var(--color-error-bg)",
              borderLeft: `4px solid ${isCorrect ? "var(--color-success)" : "var(--color-error)"}`,
              marginBottom: "24px"
            }}>
              <h3 style={{ 
                fontSize: "1.2rem", 
                fontWeight: 700, 
                marginBottom: "8px",
                color: isCorrect ? "var(--color-success)" : "var(--color-error)",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                {isCorrect ? "✅ Correto!" : "❌ Incorreto!"}
              </h3>
              
              <div style={{ 
                color: "var(--color-text)", 
                whiteSpace: "pre-line", 
                lineHeight: 1.6,
                padding: "12px",
                backgroundColor: "rgba(255,255,255,0.5)",
                borderRadius: "var(--radius)"
              }}>
                {currentQuestion.explanation}
              </div>
            </div>
          )}

          {answered && (
            <button 
              className="btn-primary" 
              onClick={nextQuestion}
              style={{ width: "100%", padding: "16px", fontSize: "1.2rem", borderRadius: "var(--radius-full)" }}
            >
              Próxima Questão ➡️
            </button>
          )}
        </div>
      </div>
    );
  }

  if (sessionState === "summary") {
    const accuracy = stats.questionsAnswered > 0 ? Math.round((stats.correct / stats.questionsAnswered) * 100) : 0;
    
    return (
      <div className="animate-pop-in" style={{ maxWidth: "600px", margin: "40px auto", padding: "24px" }}>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "4rem", marginBottom: "16px" }}>
            {accuracy >= 80 ? "🏆" : accuracy >= 50 ? "👍" : "📚"}
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "8px", color: "var(--color-text)" }}>
            Sessão Concluída!
          </h1>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "32px" }}>
            Aqui está o seu desempenho na prática livre.
          </p>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr", 
            gap: "16px",
            marginBottom: "32px"
          }}>
            <div style={{ backgroundColor: "var(--color-surface)", padding: "16px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", fontWeight: 600 }}>Respondidas</div>
              <div style={{ fontSize: "2rem", fontWeight: 800 }}>{stats.questionsAnswered}</div>
            </div>
            <div style={{ backgroundColor: "var(--color-surface)", padding: "16px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", fontWeight: 600 }}>Precisão</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: accuracy >= 70 ? "var(--color-success)" : "var(--color-text)" }}>
                {accuracy}%
              </div>
            </div>
            <div style={{ backgroundColor: "var(--color-success-bg)", padding: "16px", borderRadius: "var(--radius-lg)" }}>
              <div style={{ fontSize: "0.9rem", color: "var(--color-success)", fontWeight: 600 }}>Acertos</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-success)" }}>{stats.correct}</div>
            </div>
            <div style={{ backgroundColor: "var(--color-error-bg)", padding: "16px", borderRadius: "var(--radius-lg)" }}>
              <div style={{ fontSize: "0.9rem", color: "var(--color-error)", fontWeight: 600 }}>Erros</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-error)" }}>{stats.wrong}</div>
            </div>
          </div>

          {stats.xpEarned > 0 && (
            <div style={{ 
              backgroundColor: "var(--color-info-bg)", 
              padding: "16px", 
              borderRadius: "var(--radius-lg)",
              marginBottom: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              color: "var(--color-info)"
            }}>
              <span style={{ fontSize: "1.5rem" }}>⭐</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>+{stats.xpEarned} XP ganho nesta sessão!</span>
            </div>
          )}

          {Object.keys(stats.categoryStats).length > 0 && (
            <div style={{ textAlign: "left", marginBottom: "32px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px" }}>Desempenho por Categoria</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {Object.entries(stats.categoryStats).map(([cat, cStats]) => {
                  const info = getCategoryInfo(cat as Category);
                  const total = cStats.correct + cStats.wrong;
                  const acc = Math.round((cStats.correct / total) * 100);
                  
                  return (
                    <div key={cat} style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between",
                      padding: "12px",
                      backgroundColor: "var(--color-surface)",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--color-border)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>{info.emoji}</span>
                        <span style={{ fontWeight: 600 }}>{info.name}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <span style={{ color: "var(--color-success)", fontWeight: 700 }}>{cStats.correct} ✓</span>
                        <span style={{ color: "var(--color-error)", fontWeight: 700 }}>{cStats.wrong} ✗</span>
                        <span style={{ fontWeight: 800, width: "40px", textAlign: "right" }}>{acc}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button 
              className="btn-primary" 
              onClick={() => setSessionState("select")}
              style={{ width: "100%", padding: "16px", borderRadius: "var(--radius-full)", fontSize: "1.1rem" }}
            >
              Nova Sessão de Prática 🔄
            </button>
            <Link href="/dashboard" style={{ width: "100%" }}>
              <button className="btn-secondary" style={{ width: "100%", padding: "16px", borderRadius: "var(--radius-full)", fontSize: "1.1rem" }}>
                Voltar ao Dashboard 🏠
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
