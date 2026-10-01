"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getTracks, getLessonsByTrack, getQuizzesByLessonId, getCompletedQuizIds, getAnnouncements, type Track, type Lesson, type Announcement } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import DailyChallenge from "@/components/DailyChallenge";
import StudyTimer from "@/components/StudyTimer";
import MissionsWidget from "@/components/MissionsWidget";
import Mascot from "@/components/Mascot";

interface TrackWithLessons extends Track {
  lessons: (Lesson & { completed: boolean; quizId?: string })[];
}

function AnimatedNum({ value }: { value: number }) {
  const [n, setN] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const start = performance.now();
    const run = (now: number) => {
      const p = Math.min((now - start) / 800, 1);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }, [value]);
  return <>{n.toLocaleString()}</>;
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [tracks, setTracks] = useState<TrackWithLessons[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const [allTracks, allAnnouncements, completedIds] = await Promise.all([
        getTracks(),
        getAnnouncements(),
        getCompletedQuizIds(user.uid)
      ]);
      setAnnouncements(allAnnouncements);
      const result: TrackWithLessons[] = [];
      for (const track of allTracks) {
        const lessons = await getLessonsByTrack(track.id);
        const mapped = await Promise.all(
          lessons.filter(l => l.isPublished).map(async (lesson) => {
            const quizzes = await getQuizzesByLessonId(lesson.id);
            const quizId = quizzes.length > 0 ? quizzes[0].id : undefined;
            return { ...lesson, completed: quizId ? completedIds.includes(quizId) : false, quizId };
          })
        );
        if (mapped.length > 0) result.push({ ...track, lessons: mapped });
      }
      setTracks(result);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  if (!user) return null;

  const firstName = (user.displayName || String(profile?.name) || "Aluno").split(" ")[0];
  const xp = Number(profile?.xp) || 0;
  const level = Math.floor(xp / 500) + 1;
  const streak = Number(profile?.streak) || 0;
  const coins = Number(profile?.coins) || 0;
  const quizzes = Number(profile?.quizzesCompleted) || 0;
  const studyMin = Number(profile?.totalStudyMinutes) || 0;

  const totalLessons = tracks.reduce((a, t) => a + t.lessons.length, 0);
  const doneLessons = tracks.reduce((a, t) => a + t.lessons.filter(l => l.completed).length, 0);
  const progress = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
  const nextLesson = tracks.flatMap(t => t.lessons).find(l => !l.completed);

  const [greeting, setGreeting] = useState("Olá");

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite");
  }, []);

  return (
    <div className="space-y-5">
      {/* Greeting & Mascot */}
      <div className="animate-slide-down flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black animate-gradient-text" style={{ backgroundImage: "linear-gradient(45deg, var(--color-primary), var(--color-info))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>
            {greeting}, {firstName}! 👋
          </h1>
          <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {streak > 0 ? `🔥 ${streak} dias em sequência! Continue assim!` : "Vamos começar a estudar hoje?"}
          </p>
        </div>
        <div className="hidden sm:block mr-4">
          <Mascot size="md" />
        </div>
      </div>

      {/* Continue Button */}
      {nextLesson && (
        <button
          onClick={() => router.push(`/lesson/${nextLesson.id}`)}
          className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2 px-5 py-3 text-sm animate-bounce-in hover-scale"
          style={{ animationDelay: "0.05s" }}
        >
          ▶ Continuar: {nextLesson.title}
        </button>
      )}

      {/* Stats Grid — 2x2 on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 stagger-children" style={{ animationDelay: "0.1s" }}>
        {[
          { emoji: "⚡", label: "XP Total", value: xp, color: "var(--color-primary)" },
          { emoji: "🏆", label: "Nível", value: level, color: "var(--color-success)" },
          { emoji: "🪙", label: "Moedas", value: coins, color: "#d4a017" },
          { emoji: "📝", label: "Quizzes", value: quizzes, color: "var(--color-info)" },
        ].map((s) => (
          <div key={s.label} className="card-flat p-3 text-center hover-lift">
            <span className="text-xl">{s.emoji}</span>
            <p className="text-xl font-black mt-0.5" style={{ color: s.color }}>
              <AnimatedNum value={s.value} />
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Avisos / Announcements */}
      {announcements.length > 0 && (
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0.12s" }}>
          <h2 className="text-lg font-black flex items-center gap-2">
            <span className="text-xl">📢</span> Avisos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger-children">
            {announcements.map((ann) => (
              <div 
                key={ann.id} 
                className={`card p-4 hover-lift ${ann.priority === 'urgent' ? 'border-[var(--color-error)] border-l-4' : ann.priority === 'warning' ? 'border-[var(--color-warning)] border-l-4' : 'border-[var(--color-info)] border-l-4'}`}
              >
                <h3 className="font-bold text-sm mb-1" style={{ color: ann.priority === 'urgent' ? 'var(--color-error)' : ann.priority === 'warning' ? 'var(--color-warning)' : 'var(--color-info)' }}>{ann.title}</h3>
                <p className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>{ann.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall Progress */}
      <div className="card p-4 animate-slide-up hover-glow" style={{ animationDelay: "0.15s" }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold">📊 Progresso Geral</p>
          <span className="text-sm font-black" style={{ color: "var(--color-primary)" }}>{progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill progress-fill-xp" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[11px] font-semibold mt-1.5" style={{ color: "var(--color-text-muted)" }}>
          {doneLessons} de {totalLessons} aulas concluídas
        </p>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 stagger-children" style={{ animationDelay: "0.2s" }}>
        <div className="hover-lift">
          <DailyChallenge />
        </div>
        <div className="hover-lift">
          <StudyTimer />
        </div>
        <div className="hover-lift">
          <MissionsWidget />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 stagger-children" style={{ animationDelay: "0.3s" }}>
        {[
          { emoji: "💪", label: "Prática", href: "/practice" },
          { emoji: "⚡", label: "Blitz", href: "/blitz" },
          { emoji: "⚔️", label: "Arena", href: "/arena" },
          { emoji: "🏆", label: "Ranking", href: "/leaderboard" },
          { emoji: "🛍️", label: "Lojinha", href: "/shop" },
          { emoji: "📐", label: "Fórmulas", href: "/formulas" },
        ].map((a) => (
          <button
            key={a.label}
            onClick={() => router.push(a.href)}
            className="card-flat p-3 text-center cursor-pointer transition-all hover:border-[var(--color-primary)] hover-scale hover-lift"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <span className="text-2xl">{a.emoji}</span>
            <p className="text-[10px] font-bold mt-1">{a.label}</p>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="h-40 skeleton" />)}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="card p-8 text-center">
          <p className="text-3xl mb-2">⚠️</p>
          <p className="font-bold mb-3">{error}</p>
          <button onClick={loadData} className="btn-primary px-5 py-2 text-sm">Tentar novamente</button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && tracks.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-lg font-bold">Nenhuma trilha disponível</p>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>O professor ainda não adicionou conteúdo.</p>
        </div>
      )}

      {/* Tracks */}
      {!loading && !error && tracks.map((track, ti) => {
        const tDone = track.lessons.filter(l => l.completed).length;
        const tTotal = track.lessons.length;
        const tPct = Math.round((tDone / tTotal) * 100);

        return (
          <div key={track.id} className="card overflow-hidden animate-slide-up hover-lift" style={{ animationDelay: `${0.35 + ti * 0.08}s` }}>
            {/* Track Header */}
            <div className="p-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--color-divider)" }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{track.icon || "📘"}</span>
                <div>
                  <h3 className="text-base font-bold">{track.title}</h3>
                  <p className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>{track.description}</p>
                </div>
              </div>
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-full" style={{
                background: tPct === 100 ? "var(--color-success-bg)" : "var(--color-primary-bg)",
                color: tPct === 100 ? "var(--color-success)" : "var(--color-primary)",
              }}>
                {tPct === 100 ? "✓ Completo" : `${tDone}/${tTotal}`}
              </span>
            </div>

            {/* Progress */}
            <div className="px-4 pt-3">
              <div className="progress-bar progress-bar-sm">
                <div className="progress-fill" style={{ width: `${tPct}%`, background: tPct === 100 ? "var(--color-success)" : undefined }} />
              </div>
            </div>

            {/* Lessons */}
            <div className="p-3 space-y-1.5 stagger-children">
              {track.lessons.map((lesson, li) => (
                <div key={lesson.id} className="flex items-center gap-2.5 p-2.5 rounded-xl transition-colors hover-lift" style={{ background: "var(--color-bg)" }}>
                  {/* Step */}
                  {lesson.completed ? (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs" style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}>✓</div>
                  ) : (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: "var(--color-divider)", color: "var(--color-text-muted)" }}>{li + 1}</div>
                  )}

                  <span className="flex-1 text-sm font-semibold truncate min-w-0">{lesson.title}</span>

                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => router.push(`/lesson/${lesson.id}`)} className="px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer" style={{ background: "var(--color-divider)", color: "var(--color-text-secondary)" }}>
                      Aula
                    </button>
                    {lesson.quizId && (
                      <button onClick={() => router.push(`/quiz/${lesson.quizId}`)} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${lesson.completed ? "" : "text-white"}`} style={{
                        background: lesson.completed ? "var(--color-success-bg)" : "var(--color-primary)",
                        color: lesson.completed ? "var(--color-success)" : "white",
                      }}>
                        Quiz
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Study minutes footer */}
      {studyMin > 0 && (
        <p className="text-center text-xs font-bold pb-4" style={{ color: "var(--color-text-muted)" }}>
          📚 Total estudado: {studyMin} minutos
        </p>
      )}
    </div>
  );
}
