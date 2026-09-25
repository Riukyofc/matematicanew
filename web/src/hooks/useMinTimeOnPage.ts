"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook para controlar tempo mínimo de permanência na página.
 *
 * Conta o tempo que o aluno passou na página e retorna
 * se o requisito mínimo foi atingido, junto com o progresso.
 *
 * @param minTimeSeconds - Tempo mínimo em segundos
 * @returns { elapsed, remaining, progress, isUnlocked }
 */
export function useMinTimeOnPage(minTimeSeconds: number) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  const isUnlocked = elapsed >= minTimeSeconds;
  const remaining = Math.max(0, minTimeSeconds - elapsed);
  const progress = Math.min(1, elapsed / minTimeSeconds);

  // Formatar tempo restante como "Xm Ys"
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs.toString().padStart(2, "0")}s`;
    }
    return `${secs}s`;
  }, []);

  useEffect(() => {
    if (isUnlocked) return;

    if (startTimeRef.current === 0) {
      startTimeRef.current = Date.now();
    }

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const totalElapsed =
        pausedTimeRef.current +
        Math.floor((now - startTimeRef.current) / 1000);
      setElapsed(totalElapsed);
    }, 1000);

    // Pausar quando a aba perde o foco (Page Visibility API)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pausar
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        const now = Date.now();
        pausedTimeRef.current +=
          Math.floor((now - startTimeRef.current) / 1000);
      } else {
        // Retomar
        startTimeRef.current = Date.now();
        if (!intervalRef.current) {
          intervalRef.current = setInterval(() => {
            const now = Date.now();
            const totalElapsed =
              pausedTimeRef.current +
              Math.floor((now - startTimeRef.current) / 1000);
            setElapsed(totalElapsed);
          }, 1000);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isUnlocked]);

  return {
    elapsed,
    remaining,
    progress,
    isUnlocked,
    formattedRemaining: formatTime(remaining),
    formattedElapsed: formatTime(elapsed),
  };
}
