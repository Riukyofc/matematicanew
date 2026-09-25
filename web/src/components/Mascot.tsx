"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const MASCOTS = {
  dragon: { emoji: "🐲", name: "Drako, o Sábio", quote: "A matemática é o fogo que ilumina a mente!" },
  owl: { emoji: "🦉", name: "Professor Coruja", quote: "Cada erro é um passo em direção à sabedoria." },
  robot: { emoji: "🤖", name: "M4T-3", quote: "Cálculos precisos! Bip bop!" }
};

interface MascotProps {
  state?: "idle" | "happy" | "sad" | "thinking";
  size?: "sm" | "md" | "lg";
}

export default function Mascot({ state = "idle", size = "md" }: MascotProps) {
  const { profile } = useAuth();
  const [frame, setFrame] = useState(0);
  
  // Mascote padrão é a coruja se não houver no profile
  const mascotId = (profile?.equippedMascot as keyof typeof MASCOTS) || "owl";
  const mascot = MASCOTS[mascotId];

  // Animação de flutuação
  useEffect(() => {
    const t = setInterval(() => setFrame(f => (f + 1) % 4), 600);
    return () => clearInterval(t);
  }, []);

  const sizeClasses = {
    sm: "w-12 h-12 text-2xl",
    md: "w-20 h-20 text-4xl",
    lg: "w-32 h-32 text-7xl"
  };

  const getAnimationClass = () => {
    if (state === "happy") return "animate-bounce";
    if (state === "sad") return "animate-shake grayscale";
    if (state === "thinking") return "animate-pulse";
    return frame % 2 === 0 ? "translate-y-1" : "-translate-y-1";
  };

  return (
    <div className={`relative flex flex-col items-center justify-center transition-transform duration-500`}>
      <div 
        className={`flex items-center justify-center rounded-full shadow-xl transition-all duration-300 ${sizeClasses[size]} ${getAnimationClass()}`}
        style={{ 
          background: "linear-gradient(135deg, var(--color-surface), var(--color-bg))",
          border: "4px solid var(--color-primary)" 
        }}
      >
        {mascot.emoji}
      </div>
      
      {state === "idle" && size !== "sm" && (
        <div className="absolute top-full mt-2 w-48 p-2 text-[10px] font-bold text-center rounded-xl animate-fade-in" 
             style={{ background: "var(--color-surface)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}>
          "{mascot.quote}"
        </div>
      )}
    </div>
  );
}
