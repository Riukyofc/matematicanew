"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LessonPlayer from "@/components/lesson/LessonPlayer";
import { useEffect, useState, useCallback } from "react";
import { getLessonById, getQuizzesByLessonId, getQuizQuestions, getSettings, type Lesson } from "@/lib/firebase";

export default function LessonPage() {
  const { id } = useParams();
  const router = useRouter();
  useAuth();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [quiz, setQuiz] = useState<{ id: string; title: string; questionCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [waitTime, setWaitTime] = useState(20);

  const loadLesson = useCallback(async (lessonId: string) => {
    setLoading(true);
    setError("");
    try {
      // Load settings for wait time
      const settings = await getSettings();
      if (settings?.quizWaitTime) setWaitTime(Number(settings.quizWaitTime));

      // Load lesson from Firestore
      const lessonData = await getLessonById(lessonId);
      if (!lessonData) {
        setError("Aula não encontrada.");
        setLoading(false);
        return;
      }
      setLesson(lessonData);

      // Load associated quiz
      const quizzes = await getQuizzesByLessonId(lessonId);
      if (quizzes.length > 0) {
        const questions = await getQuizQuestions(quizzes[0].id);
        setQuiz({
          id: quizzes[0].id,
          title: quizzes[0].title || lessonData.title,
          questionCount: questions.length,
        });
      }
    } catch (err) {
      console.error("Error loading lesson:", err);
      setError("Erro ao carregar a aula.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    loadLesson(id);
  }, [id, loadLesson]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6 space-y-6 animate-fade-in">
        <div className="h-8 w-32 bg-[var(--color-bg-secondary)] rounded-lg animate-pulse" />
        <div className="h-10 w-3/4 bg-[var(--color-bg-secondary)] rounded-xl animate-pulse" />
        <div className="aspect-video bg-[var(--color-bg-secondary)] rounded-2xl animate-pulse" />
        <div className="h-32 bg-[var(--color-bg-secondary)] rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center animate-fade-up">
        <div className="text-5xl mb-4">📭</div>
        <h2 className="text-2xl font-black text-[var(--color-text-primary)] mb-2">{error || "Aula não encontrada"}</h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">Esta aula pode ter sido removida ou o link está incorreto.</p>
        <button 
          onClick={() => router.push("/dashboard")}
          className="px-6 py-3 rounded-xl btn-primary text-sm font-bold"
        >
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  const lessonData = {
    ...lesson,
    videoUrl: lesson.videoUrl || "",
    videoProvider: lesson.videoProvider || "YOUTUBE" as const,
    richTextContent: lesson.richTextContent || "<p>Material em breve.</p>",
    minWatchTimeSec: waitTime,
    quiz: quiz || undefined,
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <button 
          onClick={() => router.push("/dashboard")}
          className="text-xs font-bold text-[var(--color-text-secondary)] hover:text-indigo-500 transition-colors flex items-center gap-1 mb-4 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Voltar para Trilhas
        </button>
        <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500">
          {lesson.title}
        </h1>
        {lesson.description && (
          <p className="text-sm font-medium text-[var(--color-text-muted)] mt-1">{lesson.description}</p>
        )}
      </div>

      <LessonPlayer 
        lesson={lessonData} 
        onStartQuiz={(quizId) => router.push(`/quiz/${quizId}`)}
      />
    </div>
  );
}
