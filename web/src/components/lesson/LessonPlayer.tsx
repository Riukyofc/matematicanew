"use client";

import { useState, useMemo } from "react";
import { useMinTimeOnPage } from "@/hooks/useMinTimeOnPage";

// ============================================================
// Tipos
// ============================================================
interface LessonData {
  id: string;
  title: string;
  videoUrl: string;
  videoProvider: "YOUTUBE" | "VIMEO" | "UPLOAD";
  richTextContent: string;
  minWatchTimeSec: number;
  quiz?: {
    id: string;
    title: string;
    questionCount: number;
  };
}

interface LessonPlayerProps {
  lesson: LessonData;
  onStartQuiz?: (quizId: string) => void;
}

// ============================================================
// Helpers
// ============================================================

/** Extrai o ID do vídeo YouTube a partir da URL */
function getYouTubeEmbedUrl(url: string): string {
  const regex =
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1&color=white`;
  }
  return url;
}

/** Extrai o ID do vídeo Vimeo a partir da URL */
function getVimeoEmbedUrl(url: string): string {
  const regex = /vimeo\.com\/(\d+)/;
  const match = url.match(regex);
  if (match) {
    return `https://player.vimeo.com/video/${match[1]}?title=0&byline=0&portrait=0`;
  }
  return url;
}

function getEmbedUrl(url: string, provider: string): string {
  switch (provider) {
    case "YOUTUBE":
      return getYouTubeEmbedUrl(url);
    case "VIMEO":
      return getVimeoEmbedUrl(url);
    default:
      return url;
  }
}

// ============================================================
// Componente Principal: LessonPlayer
// ============================================================
export default function LessonPlayer({ lesson, onStartQuiz }: LessonPlayerProps) {
  const { progress, isUnlocked, formattedRemaining } =
    useMinTimeOnPage(lesson.minWatchTimeSec);

  const [isHoveringQuiz, setIsHoveringQuiz] = useState(false);

  const embedUrl = useMemo(
    () => getEmbedUrl(lesson.videoUrl, lesson.videoProvider),
    [lesson.videoUrl, lesson.videoProvider]
  );

  const isUpload = lesson.videoProvider === "UPLOAD";

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* ── Container Principal ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-2 text-sm mb-6 animate-float-in">
          <span className="text-[var(--color-text-muted)] hover:text-[var(--color-neon-purple)] cursor-pointer transition-colors">
            Trilhas
          </span>
          <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[var(--color-text-muted)] hover:text-[var(--color-neon-purple)] cursor-pointer transition-colors">
            Álgebra
          </span>
          <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[var(--color-text-primary)] font-medium">
            {lesson.title}
          </span>
        </nav>

        {/* ── Título da Aula ── */}
        <div className="mb-8 animate-float-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-neon-purple)] to-[var(--color-neon-blue)] flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
                {lesson.title}
              </h1>
              <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                Assista à videoaula e leia o material antes de iniciar o quiz
              </p>
            </div>
          </div>
        </div>

        {/* ── Player de Vídeo com Glow Neon ── */}
        <div
          className="relative mb-10 animate-float-in"
          style={{ animationDelay: "0.2s" }}
        >
          {/* Glow externo */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-neon-purple)] via-[var(--color-neon-blue)] to-[var(--color-neon-purple)] rounded-2xl opacity-30 blur-xl animate-neon-pulse" />

          {/* Container do vídeo */}
          <div className="relative video-glow overflow-hidden bg-black rounded-2xl border border-[var(--color-border-default)]/50">
            {isUpload ? (
              <video
                className="w-full aspect-video"
                controls
                controlsList="nodownload"
                preload="metadata"
              >
                <source src={lesson.videoUrl} type="video/mp4" />
                Seu navegador não suporta o elemento de vídeo.
              </video>
            ) : (
              <iframe
                src={embedUrl}
                className="w-full aspect-video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`Videoaula: ${lesson.title}`}
              />
            )}
          </div>

          {/* Badge do provedor */}
          <div className="absolute top-4 right-4 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-sm text-white/90 border border-white/10">
              {lesson.videoProvider === "YOUTUBE" && (
                <>
                  <svg className="w-3.5 h-3.5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  YouTube
                </>
              )}
              {lesson.videoProvider === "VIMEO" && (
                <>
                  <svg className="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197a315.065 315.065 0 003.501-3.123C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.263-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797l-.011.01z"/>
                  </svg>
                  Vimeo
                </>
              )}
              {lesson.videoProvider === "UPLOAD" && (
                <>
                  <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                  Direto
                </>
              )}
            </span>
          </div>
        </div>

        {/* ── Barra de Progresso + Botão Quiz ── */}
        <div
          className="mb-10 animate-float-in"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="glass-card p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Status de desbloqueio */}
              <div className="flex-1 w-full sm:w-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                    {isUnlocked ? (
                      <span className="flex items-center gap-2 text-[var(--color-neon-green)]">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Quiz desbloqueado!
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[var(--color-neon-purple)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Desbloqueio em {formattedRemaining}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {Math.round(progress * 100)}%
                  </span>
                </div>

                {/* Barra de progresso */}
                <div className="w-full h-2 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-linear"
                    style={{
                      width: `${progress * 100}%`,
                      background: isUnlocked
                        ? "var(--color-neon-green)"
                        : "linear-gradient(90deg, var(--color-neon-purple), var(--color-neon-blue))",
                      boxShadow: isUnlocked
                        ? "0 0 10px rgba(16, 185, 129, 0.5)"
                        : "0 0 10px rgba(139, 92, 246, 0.5)",
                    }}
                  />
                </div>
              </div>

              {/* Botão Iniciar Quiz */}
              <div className="relative shrink-0">
                {isUnlocked && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-neon-blue)] rounded-xl opacity-50 blur-md animate-gentle-pulse" />
                )}
                <button
                  id="btn-start-quiz"
                  disabled={!isUnlocked}
                  onClick={() => {
                    if (lesson.quiz && onStartQuiz) {
                      onStartQuiz(lesson.quiz.id);
                    }
                  }}
                  onMouseEnter={() => setIsHoveringQuiz(true)}
                  onMouseLeave={() => setIsHoveringQuiz(false)}
                  className={`
                    relative flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm
                    transition-all duration-300 cursor-pointer
                    ${
                      isUnlocked
                        ? "bg-gradient-to-r from-[var(--color-neon-purple)] to-[var(--color-neon-blue)] text-white shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.98]"
                        : "bg-[var(--color-bg-input)] text-[var(--color-text-muted)] cursor-not-allowed opacity-60 border border-[var(--color-border-default)]"
                    }
                  `}
                >
                  {isUnlocked ? (
                    <svg
                      className={`w-5 h-5 transition-transform duration-300 ${isHoveringQuiz ? "translate-x-0.5" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                  Iniciar Quiz
                  {lesson.quiz && (
                    <span className={`text-xs px-2 py-0.5 rounded-md ${
                      isUnlocked
                        ? "bg-white/20"
                        : "bg-[var(--color-border-default)]"
                    }`}>
                      {lesson.quiz.questionCount}q
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Conteúdo de Apoio ── */}
        <div
          className="animate-float-in"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-neon-purple)]/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-[var(--color-neon-purple)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Material de Apoio
            </h2>
          </div>

          <div className="glass-card p-6 sm:p-8">
            <div
              className="rich-text-content"
              dangerouslySetInnerHTML={{ __html: lesson.richTextContent }}
            />
          </div>
        </div>

        {/* ── Rodapé com info do quiz ── */}
        {lesson.quiz && (
          <div
            className="mt-8 mb-12 animate-float-in"
            style={{ animationDelay: "0.5s" }}
          >
            <div className="glass-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-neon-blue)]/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[var(--color-neon-blue)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  Quiz: {lesson.quiz.title || lesson.title}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {lesson.quiz.questionCount} perguntas · Múltipla escolha · Feedback imediato
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${isUnlocked ? "bg-[var(--color-neon-green)] shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-[var(--color-text-muted)]"}`} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
