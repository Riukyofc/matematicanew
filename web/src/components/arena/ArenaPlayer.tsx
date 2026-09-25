"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Duel, submitDuelResult } from "@/lib/firebase";

interface ArenaPlayerProps {
  duel: Duel;
  onClose: () => void;
}

export default function ArenaPlayer({ duel, onClose }: ArenaPlayerProps) {
  const { user } = useAuth();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [finished, setFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const questions = duel.questions || [];
  const currentQ = questions[currentIdx];
  const total = questions.length;
  const progress = ((currentIdx + (showAnswer ? 1 : 0)) / total) * 100;

  useEffect(() => {
    setStartTime(Date.now());
  }, []);

  const handleSelect = (idx: number) => {
    if (showAnswer || finished) return;
    setSelectedOption(idx);
    setShowAnswer(true);

    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) setScore(s => s + 10);

    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(c => c + 1);
        setSelectedOption(null);
        setShowAnswer(false);
      } else {
        handleFinish(score + (isCorrect ? 10 : 0));
      }
    }, 1200);
  };

  const handleFinish = async (finalScore: number) => {
    if (!user) return;
    setFinished(true);
    setIsSubmitting(true);
    const timeMs = Date.now() - startTime;
    
    try {
      await submitDuelResult(duel.id, user.uid, finalScore, timeMs);
    } catch (err) {
      console.error(err);
    }
    setIsSubmitting(false);
  };

  if (!user) return null;

  // Finished screen
  if (finished) {
    return (
      <div className="max-w-sm mx-auto text-center py-12 animate-fade-up">
        <p className="text-5xl mb-3">{isSubmitting ? "⚔️" : "🎯"}</p>
        <h2 className="text-2xl font-black mb-2">
          {isSubmitting ? "Calculando..." : "Duelo Concluído!"}
        </h2>
        
        {!isSubmitting && (
          <div className="card p-6 mt-4">
            <p className="text-sm font-semibold mb-2" style={{ color: "var(--color-text-muted)" }}>Sua pontuação:</p>
            <p className="text-5xl font-black mb-1" style={{ color: "var(--color-primary)" }}>{score}</p>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--color-text-muted)" }}>Pontos</p>
            
            <p className="text-xs mb-5 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
              O resultado será calculado quando seu oponente finalizar. Se ele já jogou, você ganhou moedas e XP!
            </p>

            <button onClick={onClose} className="btn-primary w-full py-3 text-sm">
              ← Voltar para a Arena
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!currentQ) return null;

  return (
    <div className="max-w-lg mx-auto py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
            ⚔️ Duelo · 🪙 {duel.coinsReward}
          </p>
        </div>
        <span className="text-sm font-extrabold" style={{ color: "var(--color-primary)" }}>
          {currentIdx + 1}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="progress-bar progress-bar-sm mb-5">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Question */}
      <div className="card p-5 mb-4">
        <h3 className="text-xl font-bold text-center">{currentQ.text}</h3>
      </div>
      
      {/* Options */}
      <div className="space-y-2.5">
        {currentQ.options.map((opt, i) => {
          const isSelected = selectedOption === i;
          const isCorrect = i === currentQ.correctIndex;
          
          let bg = "var(--color-surface)";
          let border = "var(--color-border)";
          let color = "var(--color-text)";
          
          if (showAnswer) {
            if (isCorrect) { bg = "var(--color-success-bg)"; border = "var(--color-success)"; color = "var(--color-success)"; }
            else if (isSelected) { bg = "var(--color-error-bg)"; border = "var(--color-error)"; color = "var(--color-error)"; }
            else { bg = "var(--color-bg)"; color = "var(--color-text-muted)"; }
          }

          return (
            <button
              key={i}
              disabled={showAnswer}
              onClick={() => handleSelect(i)}
              className="w-full p-3.5 rounded-xl text-left font-bold text-base transition-all cursor-pointer flex items-center gap-3"
              style={{ background: bg, border: `2px solid ${border}`, color }}
            >
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0" style={{
                background: showAnswer && isCorrect ? "var(--color-success)" : showAnswer && isSelected ? "var(--color-error)" : "var(--color-divider)",
                color: (showAnswer && (isCorrect || isSelected)) ? "white" : "var(--color-text-muted)",
              }}>
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Score */}
      <p className="text-center mt-4 text-xs font-bold" style={{ color: "var(--color-text-muted)" }}>
        Pontuação: <span style={{ color: "var(--color-primary)" }}>{score}</span>
      </p>
    </div>
  );
}
