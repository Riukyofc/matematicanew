export type AchievementCategory = "study" | "performance" | "arena" | "social" | "secret";

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  category: AchievementCategory;
  xpReward: number;
  check: (profile: any, stats: any) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  // ESTUDO E TRILHAS
  { id: "st_1", title: "Primeiros Passos", desc: "Complete 1 aula", emoji: "🌱", category: "study", xpReward: 50, check: (p) => (p?.lessonsCompleted || 0) >= 1 },
  { id: "st_2", title: "Estudioso", desc: "Complete 10 aulas", emoji: "📚", category: "study", xpReward: 150, check: (p) => (p?.lessonsCompleted || 0) >= 10 },
  { id: "st_3", title: "Rato de Biblioteca", desc: "Estude por 1 hora no total", emoji: "📖", category: "study", xpReward: 100, check: (p) => (p?.totalStudyMinutes || 0) >= 60 },
  { id: "st_4", title: "O Sábio", desc: "Estude por 10 horas no total", emoji: "🧙‍♂️", category: "study", xpReward: 500, check: (p) => (p?.totalStudyMinutes || 0) >= 600 },
  { id: "st_5", title: "Praticante", desc: "Faça 100 questões na prática", emoji: "💪", category: "study", xpReward: 200, check: (p) => (p?.practiceQuestions || 0) >= 100 },

  // PERFORMANCE E QUIZZES
  { id: "pf_1", title: "Sem Erros", desc: "Gabarite 1 quiz", emoji: "🎯", category: "performance", xpReward: 50, check: (p) => (p?.perfectQuizzes || 0) >= 1 },
  { id: "pf_2", title: "Gênio", desc: "Gabarite 10 quizzes", emoji: "🧠", category: "performance", xpReward: 300, check: (p) => (p?.perfectQuizzes || 0) >= 10 },
  { id: "pf_3", title: "Maratonista", desc: "Complete 25 quizzes", emoji: "🏃‍♂️", category: "performance", xpReward: 400, check: (p) => (p?.quizzesCompleted || 0) >= 25 },
  { id: "pf_4", title: "Velocista Relâmpago", desc: "Ganhe 500 pontos em um Blitz", emoji: "⚡", category: "performance", xpReward: 200, check: (p) => (p?.blitzRecord || 0) >= 500 },

  // ARENA
  { id: "ar_1", title: "Primeiro Sangue", desc: "Vença seu primeiro duelo", emoji: "🗡️", category: "arena", xpReward: 100, check: (p) => (p?.duelsWon || 0) >= 1 },
  { id: "ar_2", title: "Gladiador", desc: "Vença 10 duelos", emoji: "⚔️", category: "arena", xpReward: 300, check: (p) => (p?.duelsWon || 0) >= 10 },
  { id: "ar_3", title: "Invicto", desc: "Vença 50 duelos", emoji: "🏆", category: "arena", xpReward: 1000, check: (p) => (p?.duelsWon || 0) >= 50 },

  // CONSISTÊNCIA E SOCIAL
  { id: "sc_1", title: "O Retorno", desc: "Jogue por 3 dias seguidos", emoji: "🔥", category: "social", xpReward: 50, check: (p) => (p?.bestStreak || p?.streak || 0) >= 3 },
  { id: "sc_2", title: "Implacável", desc: "Mantenha uma ofensiva de 14 dias", emoji: "☄️", category: "social", xpReward: 500, check: (p) => (p?.bestStreak || p?.streak || 0) >= 14 },
  { id: "sc_3", title: "Milionário", desc: "Acumule 1000 moedas", emoji: "💰", category: "social", xpReward: 100, check: (p) => (p?.coins || 0) >= 1000 },
  { id: "sc_4", title: "Shopaholic", desc: "Compre 5 itens na loja", emoji: "🛍️", category: "social", xpReward: 150, check: (p) => ((p?.ownedItems as string[]) || []).length >= 5 },

  // SECRETAS
  { id: "se_1", title: "O Erro Ensina", desc: "Errar faz parte do processo", emoji: "🦉", category: "secret", xpReward: 50, check: (p) => (p?.quizzesFailed || 0) >= 5 },
];

export function checkNewAchievements(profile: any, stats: any): Achievement[] {
  const unlockedIds = profile?.unlockedAchievements || [];
  return ACHIEVEMENTS.filter(a => !unlockedIds.includes(a.id) && a.check(profile, stats));
}
