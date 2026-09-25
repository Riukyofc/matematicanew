// ════════════════════════════════════════════════════════════════
// 🎯 MISSION SYSTEM — Missões Diárias e Semanais
// ════════════════════════════════════════════════════════════════

export type MissionType = "quiz_complete" | "quiz_perfect" | "study_time" | "practice" | "blitz" | "streak" | "arena_win" | "xp_earn";

export interface Mission {
  id: string;
  title: string;
  description: string;
  emoji: string;
  type: MissionType;
  target: number;
  xpReward: number;
  coinReward: number;
  period: "daily" | "weekly";
}

export interface MissionProgress {
  missionId: string;
  current: number;
  completed: boolean;
  claimedAt?: string;
}

// Seed-based pseudo-random for daily consistency
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function getDateSeed(date: Date): number {
  const d = date.toISOString().split("T")[0];
  let hash = 0;
  for (let i = 0; i < d.length; i++) {
    hash = ((hash << 5) - hash) + d.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getWeekSeed(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const week = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
  return getDateSeed(new Date(date.getFullYear(), 0, week * 7 + 1));
}

// ═══════════════════ MISSION POOLS ═══════════════════

const DAILY_MISSIONS: Omit<Mission, "id">[] = [
  { title: "Maratonista", description: "Complete 2 quizzes", emoji: "📝", type: "quiz_complete", target: 2, xpReward: 30, coinReward: 10, period: "daily" },
  { title: "Sem Erro", description: "Tire 100% em 1 quiz", emoji: "🎯", type: "quiz_perfect", target: 1, xpReward: 50, coinReward: 20, period: "daily" },
  { title: "Estudioso", description: "Estude por 15 minutos", emoji: "📚", type: "study_time", target: 15, xpReward: 25, coinReward: 10, period: "daily" },
  { title: "Praticante", description: "Complete 10 questões na prática", emoji: "💪", type: "practice", target: 10, xpReward: 20, coinReward: 5, period: "daily" },
  { title: "Velocista", description: "Jogue 1 partida no Blitz", emoji: "⚡", type: "blitz", target: 1, xpReward: 25, coinReward: 10, period: "daily" },
  { title: "Sequência", description: "Mantenha seu streak", emoji: "🔥", type: "streak", target: 1, xpReward: 15, coinReward: 5, period: "daily" },
  { title: "Gladiador", description: "Vença 1 duelo na arena", emoji: "⚔️", type: "arena_win", target: 1, xpReward: 40, coinReward: 15, period: "daily" },
  { title: "Coletor de XP", description: "Ganhe 50 XP hoje", emoji: "⚡", type: "xp_earn", target: 50, xpReward: 20, coinReward: 5, period: "daily" },
  { title: "Triplo Quiz", description: "Complete 3 quizzes", emoji: "🏅", type: "quiz_complete", target: 3, xpReward: 40, coinReward: 15, period: "daily" },
  { title: "Foco Total", description: "Estude por 30 minutos", emoji: "🧠", type: "study_time", target: 30, xpReward: 40, coinReward: 15, period: "daily" },
];

const WEEKLY_MISSIONS: Omit<Mission, "id">[] = [
  { title: "Dedicação", description: "Complete 10 quizzes", emoji: "📋", type: "quiz_complete", target: 10, xpReward: 150, coinReward: 50, period: "weekly" },
  { title: "Perfeccionista", description: "Tire 100% em 3 quizzes", emoji: "💎", type: "quiz_perfect", target: 3, xpReward: 200, coinReward: 75, period: "weekly" },
  { title: "Maratona de Estudo", description: "Estude 120 minutos", emoji: "⏰", type: "study_time", target: 120, xpReward: 100, coinReward: 40, period: "weekly" },
  { title: "Praticante Mestre", description: "Complete 50 questões na prática", emoji: "🎓", type: "practice", target: 50, xpReward: 120, coinReward: 45, period: "weekly" },
  { title: "Campeão da Arena", description: "Vença 5 duelos", emoji: "🏆", type: "arena_win", target: 5, xpReward: 200, coinReward: 80, period: "weekly" },
  { title: "Série de Fogo", description: "Mantenha streak de 5 dias", emoji: "🔥", type: "streak", target: 5, xpReward: 150, coinReward: 60, period: "weekly" },
  { title: "Blitz Master", description: "Jogue 5 partidas Blitz", emoji: "⚡", type: "blitz", target: 5, xpReward: 100, coinReward: 40, period: "weekly" },
  { title: "XP Hunter", description: "Ganhe 500 XP esta semana", emoji: "💰", type: "xp_earn", target: 500, xpReward: 100, coinReward: 50, period: "weekly" },
];

// ═══════════════════ PUBLIC API ═══════════════════

/** Get today's daily missions (3 missions, consistent per day) */
export function getDailyMissions(): Mission[] {
  const rng = seededRandom(getDateSeed(new Date()));
  const shuffled = [...DAILY_MISSIONS].sort(() => rng() - 0.5);
  return shuffled.slice(0, 3).map((m, i) => ({
    ...m,
    id: `daily_${new Date().toISOString().split("T")[0]}_${i}`,
  }));
}

/** Get this week's weekly missions (2 missions, consistent per week) */
export function getWeeklyMissions(): Mission[] {
  const rng = seededRandom(getWeekSeed(new Date()));
  const shuffled = [...WEEKLY_MISSIONS].sort(() => rng() - 0.5);
  return shuffled.slice(0, 2).map((m, i) => ({
    ...m,
    id: `weekly_${getWeekSeed(new Date())}_${i}`,
  }));
}

/** Get all active missions */
export function getAllMissions(): Mission[] {
  return [...getDailyMissions(), ...getWeeklyMissions()];
}

/** Check mission progress against profile data */
export function checkMissionProgress(
  mission: Mission,
  todayStats: { quizzes: number; perfectQuizzes: number; studyMinutes: number; practiceQuestions: number; blitzGames: number; arenaWins: number; xpEarned: number; streak: number }
): MissionProgress {
  let current = 0;
  switch (mission.type) {
    case "quiz_complete": current = todayStats.quizzes; break;
    case "quiz_perfect": current = todayStats.perfectQuizzes; break;
    case "study_time": current = todayStats.studyMinutes; break;
    case "practice": current = todayStats.practiceQuestions; break;
    case "blitz": current = todayStats.blitzGames; break;
    case "streak": current = todayStats.streak; break;
    case "arena_win": current = todayStats.arenaWins; break;
    case "xp_earn": current = todayStats.xpEarned; break;
  }
  return {
    missionId: mission.id,
    current: Math.min(current, mission.target),
    completed: current >= mission.target,
  };
}
