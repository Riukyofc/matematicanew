import { initializeApp, getApps } from "firebase/app";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile, type User, GoogleAuthProvider, signInWithPopup
} from "firebase/auth";
import {
  getFirestore, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  collection, query, orderBy, limit, serverTimestamp, increment, addDoc,
  where, arrayUnion
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// ── Emails que são professores ──
const TEACHER_EMAILS = [
  "alexcastrocutrim@gmail.com",
];

// ════════════════════ AUTH ════════════════════
export async function registerUser(name: string, email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });

  const role = TEACHER_EMAILS.includes(email.toLowerCase().trim()) ? "TEACHER" : "STUDENT";

  await setDoc(doc(db, "users", cred.user.uid), {
    name, email, role,
    xp: 0, level: 1, streak: 0, bestStreak: 0,
    quizzesCompleted: 0, perfectQuizzes: 0, lessonsCompleted: 0,
    totalStudyMinutes: 0, coins: 0,
    ownedItems: [], equippedTheme: "", equippedBorder: "", equippedTitle: "",
    duelsWon: 0, duelsLost: 0, duelsPlayed: 0,
    lastActiveDate: serverTimestamp(), createdAt: serverTimestamp(),
  });
  return cred.user;
}

export async function loginUser(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  try { await updateStreak(cred.user.uid); } catch {}
  return cred.user;
}

export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  const user = cred.user;
  const userRef = doc(db, "users", user.uid);
  
  try {
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      const emailStr = user.email || "";
      const role = TEACHER_EMAILS.includes(emailStr.toLowerCase().trim()) ? "TEACHER" : "STUDENT";
      
      await setDoc(userRef, {
        name: user.displayName || "Usuário", 
        email: emailStr, 
        role: role,
        xp: 0, level: 1, streak: 0, bestStreak: 0,
        quizzesCompleted: 0, perfectQuizzes: 0, lessonsCompleted: 0,
        totalStudyMinutes: 0, coins: 0,
        ownedItems: [], equippedTheme: "", equippedBorder: "", equippedTitle: "",
        duelsWon: 0, duelsLost: 0, duelsPlayed: 0,
        lastActiveDate: serverTimestamp(), createdAt: serverTimestamp(),
      });
    } else {
      const emailStr = user.email || "";
      const isTeacher = TEACHER_EMAILS.includes(emailStr.toLowerCase().trim());
      if (isTeacher && userDoc.data()?.role !== "TEACHER") {
        await updateDoc(userRef, { role: "TEACHER" });
      }
      try { await updateStreak(user.uid); } catch {}
    }
  } catch (error) {
    console.error("Erro ao verificar/criar usuário no Firestore:", error);
    throw error;
  }
  
  return user;
}

export async function logoutUser() { await signOut(auth); }
export function onAuthChange(cb: (user: User | null) => void) { return onAuthStateChanged(auth, cb); }

// ════════════════════ USER PROFILE ════════════════════
export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserProfile(uid: string, data: Record<string, unknown>) {
  await updateDoc(doc(db, "users", uid), data);
}

// ════════════════════ DAILY & WEEKLY STATS & MISSIONS ════════════════════
export async function getMissionStats(uid: string) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  const today = new Date().toISOString().split("T")[0];
  
  const start = new Date(new Date().getFullYear(), 0, 1);
  const weekNum = Math.floor((new Date().getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const currentWeek = `${new Date().getFullYear()}_W${weekNum}`;
  
  let needsUpdate = false;
  const updates: any = {};
  
  let dailyStats = data.dailyStats;
  if (dailyStats?.date !== today) {
    dailyStats = {
      date: today,
      quizzes: 0, perfectQuizzes: 0, studyMinutes: 0,
      practiceQuestions: 0, blitzGames: 0, arenaWins: 0,
      xpEarned: 0, claimedMissions: []
    };
    updates.dailyStats = dailyStats;
    needsUpdate = true;
  }

  let weeklyStats = data.weeklyStats;
  if (weeklyStats?.week !== currentWeek) {
    weeklyStats = {
      week: currentWeek,
      quizzes: 0, perfectQuizzes: 0, studyMinutes: 0,
      practiceQuestions: 0, blitzGames: 0, arenaWins: 0,
      xpEarned: 0, claimedMissions: []
    };
    updates.weeklyStats = weeklyStats;
    needsUpdate = true;
  }
  
  if (needsUpdate) {
    await updateDoc(userRef, updates);
  }
  
  return { dailyStats, weeklyStats };
}

export async function updateTodayStats(uid: string, stats: Partial<{ quizzes: number, perfectQuizzes: number, studyMinutes: number, practiceQuestions: number, blitzGames: number, arenaWins: number, xpEarned: number }>) {
  const missionStats = await getMissionStats(uid);
  if (!missionStats) return;
  const updates: Record<string, any> = {};
  for (const [k, v] of Object.entries(stats)) {
    updates[`dailyStats.${k}`] = increment(v as number);
    updates[`weeklyStats.${k}`] = increment(v as number);
  }
  if (Object.keys(updates).length > 0) {
    await updateDoc(doc(db, "users", uid), updates);
  }
}

export async function claimMissionReward(uid: string, missionId: string, xp: number, coins: number, period: "daily" | "weekly") {
  const userRef = doc(db, "users", uid);
  const field = period === "weekly" ? "weeklyStats.claimedMissions" : "dailyStats.claimedMissions";
  await updateDoc(userRef, {
    [field]: arrayUnion(missionId),
    xp: increment(xp),
    coins: increment(coins)
  });
}

// ════════════════════ STREAK ════════════════════
export async function updateStreak(uid: string) {
  const profile = await getUserProfile(uid);
  if (!profile) return;
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const lastActive = profile.lastActiveDate;
  let lastDate = "";
  if (lastActive && typeof lastActive === "object" && "seconds" in lastActive) {
    lastDate = new Date((lastActive as { seconds: number }).seconds * 1000).toISOString().split("T")[0];
  }
  if (lastDate === today) return;
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const newStreak = lastDate === yesterday.toISOString().split("T")[0] ? (Number(profile.streak) || 0) + 1 : 1;
  await updateDoc(doc(db, "users", uid), {
    streak: newStreak,
    bestStreak: Math.max(newStreak, Number(profile.bestStreak) || 0),
    lastActiveDate: serverTimestamp(),
  });
}

// ════════════════════ TRACKS (Trilhas) ════════════════════
export interface Track {
  id: string;
  title: string;
  description?: string;
  grade?: number;
  order: number;
  iconUrl?: string;
  icon?: string;
}

export async function getTracks(): Promise<Track[]> {
  const q = query(collection(db, "tracks"), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Track));
}

export async function createTrack(data: Omit<Track, "id">) {
  const ref = await addDoc(collection(db, "tracks"), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateTrack(id: string, data: Partial<Track>) {
  await updateDoc(doc(db, "tracks", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteTrack(id: string) {
  await deleteDoc(doc(db, "tracks", id));
}

// ════════════════════ LESSONS (Aulas) ════════════════════
export interface Lesson {
  id: string;
  trackId: string;
  title: string;
  description?: string;
  videoUrl?: string;
  videoProvider?: "YOUTUBE" | "VIMEO" | "UPLOAD";
  richTextContent?: string;
  order: number;
  minWatchTimeSec: number;
  isPublished: boolean;
}

export async function getLessonsByTrack(trackId: string): Promise<Lesson[]> {
  const q = query(collection(db, "lessons"), where("trackId", "==", trackId));
  const snap = await getDocs(q);
  const lessons = snap.docs.map(d => ({ id: d.id, ...d.data() } as Lesson));
  return lessons.sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function getAllLessons(): Promise<Lesson[]> {
  const q = query(collection(db, "lessons"), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Lesson));
}

export async function getLessonById(id: string): Promise<Lesson | null> {
  const snap = await getDoc(doc(db, "lessons", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } as Lesson : null;
}

export async function createLesson(data: Omit<Lesson, "id">) {
  const ref = await addDoc(collection(db, "lessons"), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateLesson(id: string, data: Partial<Lesson>) {
  await updateDoc(doc(db, "lessons", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteLesson(id: string) {
  // Also delete associated quiz and questions
  const quizzes = await getQuizzesByLessonId(id);
  for (const quiz of quizzes) {
    await deleteQuiz(quiz.id);
  }
  await deleteDoc(doc(db, "lessons", id));
}

// ════════════════════ QUIZZES ════════════════════
export interface Quiz {
  id: string;
  lessonId: string;
  title?: string;
  isTimerEnabled: boolean;
  timeLimitSec?: number;
  maxInfractions: number;
}

export async function getQuizzesByLessonId(lessonId: string): Promise<Quiz[]> {
  const q = query(collection(db, "quizzes"), where("lessonId", "==", lessonId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Quiz));
}

export async function getQuizById(id: string): Promise<Quiz | null> {
  const snap = await getDoc(doc(db, "quizzes", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } as Quiz : null;
}

export async function createQuiz(data: Omit<Quiz, "id">) {
  const ref = await addDoc(collection(db, "quizzes"), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateQuiz(id: string, data: Partial<Quiz>) {
  await updateDoc(doc(db, "quizzes", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteQuiz(id: string) {
  // Delete all questions first
  const questions = await getQuizQuestions(id);
  for (const q of questions) {
    await deleteDoc(doc(db, "quizzes", id, "questions", q.id));
  }
  await deleteDoc(doc(db, "quizzes", id));
}

// ════════════════════ QUESTIONS ════════════════════
export interface Question {
  id: string;
  quizId: string;
  text: string;
  imageUrl?: string;
  options: string[];
  correctIndex: number;
  order: number;
  points: number;
}

export async function getQuizQuestions(quizId: string): Promise<Question[]> {
  const q = query(collection(db, "quizzes", quizId, "questions"), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, quizId, ...d.data() } as Question));
}

export async function createQuestion(quizId: string, data: Omit<Question, "id" | "quizId">) {
  const ref = await addDoc(collection(db, "quizzes", quizId, "questions"), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateQuestion(quizId: string, questionId: string, data: Partial<Question>) {
  await updateDoc(doc(db, "quizzes", quizId, "questions", questionId), data);
}

export async function deleteQuestion(quizId: string, questionId: string) {
  await deleteDoc(doc(db, "quizzes", quizId, "questions", questionId));
}

// ════════════════════ QUIZ RESULTS ════════════════════
export async function saveQuizResult(uid: string, quizId: string, score: number, total: number, xpEarned: number) {
  await addDoc(collection(db, "users", uid, "quizResults"), {
    quizId, score, total, percentage: Math.round((score / total) * 100),
    xpEarned, completedAt: serverTimestamp(),
  });
  const coinsEarned = 15;
  const updates: Record<string, unknown> = {
    xp: increment(xpEarned),
    coins: increment(coinsEarned),
    quizzesCompleted: increment(1),
    lastActiveDate: serverTimestamp(),
  };
  if (score === total) updates.perfectQuizzes = increment(1);
  await updateDoc(doc(db, "users", uid), updates);
}

export async function getQuizHistory(uid: string) {
  const q = query(collection(db, "users", uid, "quizResults"), orderBy("completedAt", "desc"), limit(20));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Check if a student completed a specific lesson's quiz
export async function hasCompletedQuiz(uid: string, quizId: string): Promise<boolean> {
  const q = query(collection(db, "users", uid, "quizResults"), where("quizId", "==", quizId));
  const snap = await getDocs(q);
  return !snap.empty;
}

// Get all completed quiz IDs for a student
export async function getCompletedQuizIds(uid: string): Promise<string[]> {
  const snap = await getDocs(collection(db, "users", uid, "quizResults"));
  return snap.docs.map(d => d.data().quizId as string);
}

// ════════════════════ ACHIEVEMENTS ════════════════════
export interface Achievement {
  id: string; icon: string; title: string; desc: string;
  check: (profile: Record<string, unknown>) => boolean;
}

export const ACHIEVEMENT_DEFS: Achievement[] = [
  { id: "a1", icon: "🏆", title: "Primeiro Passo", desc: "Complete seu primeiro quiz", check: p => (Number(p.quizzesCompleted) || 0) >= 1 },
  { id: "a2", icon: "🔥", title: "Em Chamas", desc: "Sequência de 3 dias", check: p => (Number(p.streak) || 0) >= 3 },
  { id: "a3", icon: "⚡", title: "Veloz", desc: "Complete 5 quizzes", check: p => (Number(p.quizzesCompleted) || 0) >= 5 },
  { id: "a4", icon: "🎯", title: "Perfeição", desc: "100% em um quiz", check: p => (Number(p.perfectQuizzes) || 0) >= 1 },
  { id: "a5", icon: "💎", title: "Dedicado", desc: "Acumule 1000 XP", check: p => (Number(p.xp) || 0) >= 1000 },
  { id: "a6", icon: "👑", title: "Mestre", desc: "Acumule 5000 XP", check: p => (Number(p.xp) || 0) >= 5000 },
  { id: "a7", icon: "📝", title: "Anotador", desc: "Salve 3 anotações", check: () => false },
  { id: "a8", icon: "🔟", title: "Dez em Dez", desc: "Complete 10 quizzes", check: p => (Number(p.quizzesCompleted) || 0) >= 10 },
];

// ════════════════════ NOTES ════════════════════
export async function saveNote(uid: string, lessonId: string, content: string) {
  await setDoc(doc(db, "users", uid, "notes", lessonId), { content, lessonId, updatedAt: serverTimestamp() });
}
export async function getNote(uid: string, lessonId: string) {
  const snap = await getDoc(doc(db, "users", uid, "notes", lessonId));
  return snap.exists() ? snap.data() : null;
}
export async function getAllNotes(uid: string) {
  const snap = await getDocs(collection(db, "users", uid, "notes"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function deleteNote(uid: string, lessonId: string) {
  await deleteDoc(doc(db, "users", uid, "notes", lessonId));
}

// ════════════════════ INFRACTIONS ════════════════════
export async function saveInfraction(uid: string, type: string, description: string) {
  await addDoc(collection(db, "users", uid, "infractions"), {
    type, description, automatic: true, createdAt: serverTimestamp(),
  });
}

export async function getStudentInfractions(uid: string) {
  const q = query(collection(db, "users", uid, "infractions"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ════════════════════ LEADERBOARD ════════════════════
export async function getLeaderboard(limitCount: number = 10) {
  const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d, i) => {
    const data = d.data();
    return {
      uid: d.id,
      name: data.name || "Sem Nome",
      xp: data.xp || 0,
      level: Math.floor((data.xp || 0) / 500) + 1,
      pos: i + 1,
      equippedTitle: data.equippedTitle || "",
      equippedBorder: data.equippedBorder || "",
      coins: data.coins || 0
    };
  });
}

// ════════════════════ ALL STUDENTS ════════════════════
export async function getAllStudents() {
  const q = query(collection(db, "users"), where("role", "==", "STUDENT"));
  const snap = await getDocs(q);
  const students = snap.docs.map(d => ({ uid: d.id, ...(d.data() as { name?: string }) }));
  
  // Inject a dummy student so the user can test the Arena even if they are alone
  if (!students.find(s => s.uid === "bot-mestre")) {
    students.push({ uid: "bot-mestre", name: "Bot Mestre 🤖" });
  }
  
  return students.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
}

export async function getAllUsers() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

// ════════════════════ TEACHER: PLATFORM SETTINGS ════════════════════
export async function getSettings() {
  const snap = await getDoc(doc(db, "settings", "platform"));
  return snap.exists() ? snap.data() : null;
}
export async function saveSettings(data: Record<string, unknown>) {
  await setDoc(doc(db, "settings", "platform"), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// ════════════════════ TEACHER: CUSTOM FORMULAS ════════════════════
export interface Formula {
  id: string;
  category: string;
  name: string;
  formula: string;
}

export async function getCustomFormulas(): Promise<Formula[]> {
  const snap = await getDocs(collection(db, "formulas"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Formula));
}
export async function saveCustomFormula(data: { category: string; name: string; formula: string }) {
  await addDoc(collection(db, "formulas"), { ...data, createdAt: serverTimestamp() });
}
export async function deleteCustomFormula(id: string) {
  await deleteDoc(doc(db, "formulas", id));
}

// ════════════════════ STUDY TIME ════════════════════
export async function addStudyTime(uid: string, minutes: number) {
  await updateDoc(doc(db, "users", uid), { totalStudyMinutes: increment(minutes), lastActiveDate: serverTimestamp() });
}

// ════════════════════════════════════════════════════════════════
// ⚔️ ARENA MATEMÁTICA — Duelos PvP
// ════════════════════════════════════════════════════════════════

export interface ArenaQuestion {
  text: string;
  options: string[];
  correctIndex: number;
}

export interface Duel {
  id: string;
  challengerId: string;
  challengerName: string;
  opponentId: string;
  opponentName: string;
  status: "pending" | "in_progress" | "completed" | "declined" | "expired";
  questions: ArenaQuestion[];
  challengerResult?: { score: number; timeMs: number };
  opponentResult?: { score: number; timeMs: number };
  winnerId?: string | null;
  xpReward: number;
  coinsReward: number;
  createdAt: unknown;
  completedAt?: unknown;
}

/** Generate 5 random math questions for Arena duels */
export function generateArenaQuestions(): ArenaQuestion[] {
  const questions: ArenaQuestion[] = [];

  for (let i = 0; i < 5; i++) {
    const type = Math.floor(Math.random() * 4);

    if (type === 0) {
      const a = Math.floor(Math.random() * 50) + 10;
      const b = Math.floor(Math.random() * 30) + 5;
      const op = Math.random() > 0.5 ? "+" : "-";
      const answer = op === "+" ? a + b : a - b;
      const options = generateOptions(answer);
      questions.push({ text: `Quanto é ${a} ${op} ${b}?`, options, correctIndex: options.indexOf(String(answer)) });
    } else if (type === 1) {
      const a = Math.floor(Math.random() * 12) + 2;
      const b = Math.floor(Math.random() * 12) + 2;
      const answer = a * b;
      const options = generateOptions(answer);
      questions.push({ text: `Quanto é ${a} × ${b}?`, options, correctIndex: options.indexOf(String(answer)) });
    } else if (type === 2) {
      const x = Math.floor(Math.random() * 10) + 1;
      const a = Math.floor(Math.random() * 5) + 2;
      const b = Math.floor(Math.random() * 20) + 1;
      const c = a * x + b;
      const options = generateOptions(x);
      questions.push({ text: `Se ${a}x + ${b} = ${c}, qual o valor de x?`, options, correctIndex: options.indexOf(String(x)) });
    } else {
      const base = Math.floor(Math.random() * 10) + 2;
      const answer = base * base;
      const options = generateOptions(answer);
      questions.push({ text: `Quanto é ${base}²?`, options, correctIndex: options.indexOf(String(answer)) });
    }
  }
  return questions;
}

function generateOptions(correct: number): string[] {
  const opts = new Set<number>([correct]);
  while (opts.size < 4) {
    const offset = Math.floor(Math.random() * 10) + 1;
    const variant = Math.random() > 0.5 ? correct + offset : correct - offset;
    if (variant > 0) opts.add(variant);
    else opts.add(correct + Math.floor(Math.random() * 15) + 1);
  }
  const arr = Array.from(opts).sort(() => Math.random() - 0.5);
  return arr.map(String);
}

export async function createDuel(challengerId: string, challengerName: string, opponentId: string, opponentName: string): Promise<string> {
  const questions = generateArenaQuestions();
  const ref = await addDoc(collection(db, "duels"), {
    challengerId, challengerName, opponentId, opponentName,
    status: "pending", questions, xpReward: 50, coinsReward: 25,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getDuelsForUser(uid: string): Promise<Duel[]> {
  const q1 = query(collection(db, "duels"), where("challengerId", "==", uid));
  const snap1 = await getDocs(q1);
  const q2 = query(collection(db, "duels"), where("opponentId", "==", uid));
  const snap2 = await getDocs(q2);

  const duels = [
    ...snap1.docs.map(d => ({ id: d.id, ...d.data() } as Duel)),
    ...snap2.docs.map(d => ({ id: d.id, ...d.data() } as Duel)),
  ];

  return duels.sort((a, b) => {
    const aT = a.createdAt && typeof a.createdAt === "object" && "seconds" in (a.createdAt as Record<string, unknown>) ? (a.createdAt as { seconds: number }).seconds : 0;
    const bT = b.createdAt && typeof b.createdAt === "object" && "seconds" in (b.createdAt as Record<string, unknown>) ? (b.createdAt as { seconds: number }).seconds : 0;
    return bT - aT;
  });
}

export async function acceptDuel(duelId: string) {
  await updateDoc(doc(db, "duels", duelId), { status: "in_progress" });
}

export async function declineDuel(duelId: string) {
  await updateDoc(doc(db, "duels", duelId), { status: "declined" });
}

export async function submitDuelResult(duelId: string, uid: string, score: number, timeMs: number) {
  const duelSnap = await getDoc(doc(db, "duels", duelId));
  if (!duelSnap.exists()) return;
  const duel = { id: duelSnap.id, ...duelSnap.data() } as Duel;

  const isChallenger = uid === duel.challengerId;
  const resultField = isChallenger ? "challengerResult" : "opponentResult";
  const updateData: Record<string, unknown> = { [resultField]: { score, timeMs } };

  const otherResult = isChallenger ? duel.opponentResult : duel.challengerResult;

  if (otherResult) {
    let winnerId: string | null = null;
    if (score > otherResult.score) winnerId = uid;
    else if (otherResult.score > score) winnerId = isChallenger ? duel.opponentId : duel.challengerId;
    else if (timeMs < otherResult.timeMs) winnerId = uid;
    else if (otherResult.timeMs < timeMs) winnerId = isChallenger ? duel.opponentId : duel.challengerId;

    updateData.status = "completed";
    updateData.winnerId = winnerId;
    updateData.completedAt = serverTimestamp();
    await updateDoc(doc(db, "duels", duelId), updateData);

    if (winnerId) {
      const loserUid = winnerId === duel.challengerId ? duel.opponentId : duel.challengerId;
      await updateDoc(doc(db, "users", winnerId), { xp: increment(duel.xpReward), coins: increment(duel.coinsReward), duelsWon: increment(1), duelsPlayed: increment(1) });
      await updateDoc(doc(db, "users", loserUid), { xp: increment(10), duelsLost: increment(1), duelsPlayed: increment(1) });
    } else {
      await updateDoc(doc(db, "users", duel.challengerId), { xp: increment(30), coins: increment(10), duelsPlayed: increment(1) });
      await updateDoc(doc(db, "users", duel.opponentId), { xp: increment(30), coins: increment(10), duelsPlayed: increment(1) });
    }
  } else {
    await updateDoc(doc(db, "duels", duelId), updateData);
  }
}

// ════════════════════════════════════════════════════════════════
// 🛒 LOJINHA DE CUSTOMIZAÇÃO
// ════════════════════════════════════════════════════════════════

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: "theme" | "border" | "title";
  price: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  icon: string;
  preview: string;
  isActive: boolean;
}

export async function getShopItems(): Promise<ShopItem[]> {
  const snap = await getDocs(collection(db, "shopItems"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ShopItem)).filter(i => i.isActive);
}

export async function purchaseItem(uid: string, item: ShopItem): Promise<{ success: boolean; message: string }> {
  const profile = await getUserProfile(uid);
  if (!profile) return { success: false, message: "Perfil não encontrado." };
  const coins = Number(profile.coins) || 0;
  if (coins < item.price) return { success: false, message: "Moedas insuficientes!" };
  const owned = (profile.ownedItems as string[]) || [];
  if (owned.includes(item.id)) return { success: false, message: "Você já possui este item!" };
  await updateDoc(doc(db, "users", uid), { coins: increment(-item.price), ownedItems: [...owned, item.id] });
  return { success: true, message: `✅ ${item.name} comprado!` };
}

export async function equipItem(uid: string, item: ShopItem) {
  const field = item.category === "theme" ? "equippedTheme" : item.category === "border" ? "equippedBorder" : "equippedTitle";
  await updateDoc(doc(db, "users", uid), { [field]: item.preview });
}

export async function unequipItem(uid: string, category: "theme" | "border" | "title") {
  const field = category === "theme" ? "equippedTheme" : category === "border" ? "equippedBorder" : "equippedTitle";
  await updateDoc(doc(db, "users", uid), { [field]: "" });
}

// ════════════════════ SEED DATA ════════════════════
export async function seedFirestoreData() {
  const tracksSnap = await getDocs(collection(db, "tracks"));
  if (!tracksSnap.empty) return { success: false, message: "Dados já existem. Seed cancelado." };

  const tracks = [
    { title: "Álgebra", description: "Equações, sistemas e inequações", order: 1, icon: "📐", grade: 8 },
    { title: "Geometria", description: "Formas, ângulos e medidas", order: 2, icon: "📏", grade: 7 },
    { title: "Frações", description: "Operações e porcentagem", order: 3, icon: "🔢", grade: 6 },
    { title: "Estatística", description: "Médias, gráficos e dados", order: 4, icon: "📊", grade: 9 },
  ];
  const trackIds: string[] = [];
  for (const t of tracks) { const r = await addDoc(collection(db, "tracks"), { ...t, createdAt: serverTimestamp() }); trackIds.push(r.id); }

  const lessons = [
    { trackId: trackIds[0], title: "Equações do 1º Grau", description: "Resolução de equações simples", videoUrl: "https://www.youtube.com/watch?v=DhJwnVAbsYA", videoProvider: "YOUTUBE", richTextContent: "<h2>Equações do 1º Grau</h2><p>ax + b = 0</p>", order: 1, minWatchTimeSec: 20, isPublished: true },
    { trackId: trackIds[0], title: "Equações do 2º Grau", description: "Bhaskara", videoUrl: "https://www.youtube.com/watch?v=0MrlzKrNbMo", videoProvider: "YOUTUBE", richTextContent: "<h2>Equações do 2º Grau</h2><p>x = (-b ± √Δ) / 2a</p>", order: 2, minWatchTimeSec: 20, isPublished: true },
    { trackId: trackIds[0], title: "Sistemas de Equações", description: "Sistemas lineares", videoUrl: "https://www.youtube.com/watch?v=DhJwnVAbsYA", videoProvider: "YOUTUBE", richTextContent: "<h2>Sistemas</h2><p>Substituição e adição.</p>", order: 3, minWatchTimeSec: 20, isPublished: true },
    { trackId: trackIds[1], title: "Ângulos e Triângulos", description: "Classificação", videoUrl: "https://www.youtube.com/watch?v=DhJwnVAbsYA", videoProvider: "YOUTUBE", richTextContent: "<h2>Ângulos</h2><p>Soma internos triângulo = 180°</p>", order: 1, minWatchTimeSec: 20, isPublished: true },
    { trackId: trackIds[1], title: "Circunferência", description: "Raio, diâmetro, área", videoUrl: "https://www.youtube.com/watch?v=DhJwnVAbsYA", videoProvider: "YOUTUBE", richTextContent: "<h2>Circunferência</h2><p>C = 2πr, A = πr²</p>", order: 2, minWatchTimeSec: 20, isPublished: true },
    { trackId: trackIds[2], title: "Operações com Frações", description: "Soma, subtração, multiplicação", videoUrl: "https://www.youtube.com/watch?v=DhJwnVAbsYA", videoProvider: "YOUTUBE", richTextContent: "<h2>Frações</h2><p>Iguale denominadores.</p>", order: 1, minWatchTimeSec: 20, isPublished: true },
    { trackId: trackIds[2], title: "Porcentagem", description: "Cálculos de %", videoUrl: "https://www.youtube.com/watch?v=DhJwnVAbsYA", videoProvider: "YOUTUBE", richTextContent: "<h2>Porcentagem</h2><p>P = (parte/total) × 100</p>", order: 2, minWatchTimeSec: 20, isPublished: true },
    { trackId: trackIds[3], title: "Média, Moda e Mediana", description: "Tendência central", videoUrl: "https://www.youtube.com/watch?v=DhJwnVAbsYA", videoProvider: "YOUTUBE", richTextContent: "<h2>Média</h2><p>M = Σx / n</p>", order: 1, minWatchTimeSec: 20, isPublished: true },
  ];
  const lessonIds: string[] = [];
  for (const l of lessons) { const r = await addDoc(collection(db, "lessons"), { ...l, createdAt: serverTimestamp() }); lessonIds.push(r.id); }

  const quizData = [
    { li: 0, title: "Quiz — Equações 1º Grau", qs: [
      { text: "2x + 6 = 0, x = ?", options: ["3", "-3", "6", "-6"], correctIndex: 1, order: 1, points: 10 },
      { text: "3x - 9 = 6, x = ?", options: ["3", "-5", "5", "1"], correctIndex: 2, order: 2, points: 10 },
      { text: "5x + 10 = 0, x = ?", options: ["2", "-2", "5", "-10"], correctIndex: 1, order: 3, points: 10 },
    ]},
    { li: 3, title: "Quiz — Ângulos", qs: [
      { text: "Soma dos ângulos internos de um triângulo:", options: ["90°", "180°", "360°", "270°"], correctIndex: 1, order: 1, points: 10 },
      { text: "Ângulo de 90° é:", options: ["Agudo", "Obtuso", "Reto", "Raso"], correctIndex: 2, order: 2, points: 10 },
    ]},
    { li: 5, title: "Quiz — Frações", qs: [
      { text: "1/2 + 1/3 = ?", options: ["2/5", "5/6", "1/5", "2/3"], correctIndex: 1, order: 1, points: 10 },
      { text: "Simplifique 6/8:", options: ["2/4", "3/4", "3/8", "6/4"], correctIndex: 1, order: 2, points: 10 },
    ]},
  ];
  for (const qd of quizData) {
    const qr = await addDoc(collection(db, "quizzes"), { lessonId: lessonIds[qd.li], title: qd.title, isTimerEnabled: true, timeLimitSec: 120, maxInfractions: 3, createdAt: serverTimestamp() });
    for (const q of qd.qs) { await addDoc(collection(db, "quizzes", qr.id, "questions"), q); }
  }

  const formulas = [
    { category: "Álgebra", name: "Equação 1º Grau", formula: "ax + b = 0 → x = -b/a" },
    { category: "Álgebra", name: "Bhaskara", formula: "x = (-b ± √(b²-4ac)) / 2a" },
    { category: "Geometria", name: "Área Triângulo", formula: "A = (b × h) / 2" },
    { category: "Geometria", name: "Área Círculo", formula: "A = π × r²" },
    { category: "Geometria", name: "Pitágoras", formula: "a² = b² + c²" },
    { category: "Estatística", name: "Média", formula: "M = Σx / n" },
  ];
  for (const f of formulas) { await addDoc(collection(db, "formulas"), { ...f, createdAt: serverTimestamp() }); }

  const shopItems: Omit<ShopItem, "id">[] = [
    { name: "🌊 Oceano", description: "Azul profundo com ciano", category: "theme", price: 100, rarity: "common", icon: "🌊", preview: "ocean", isActive: true },
    { name: "🌅 Pôr do Sol", description: "Laranja quente com rosa", category: "theme", price: 150, rarity: "rare", icon: "🌅", preview: "sunset", isActive: true },
    { name: "🟢 Matrix", description: "Verde neon sobre preto", category: "theme", price: 200, rarity: "rare", icon: "🟢", preview: "matrix", isActive: true },
    { name: "⚡ Cyberpunk", description: "Rosa neon com roxo intenso", category: "theme", price: 350, rarity: "epic", icon: "⚡", preview: "cyberpunk", isActive: true },
    { name: "🌌 Galáxia", description: "Gradiente cósmico", category: "theme", price: 500, rarity: "legendary", icon: "🌌", preview: "galaxy", isActive: true },
    { name: "🔥 Fogo", description: "Aura vermelha pulsante", category: "border", price: 75, rarity: "common", icon: "🔥", preview: "border-fire", isActive: true },
    { name: "❄️ Gelo", description: "Aura azul cristalina", category: "border", price: 75, rarity: "common", icon: "❄️", preview: "border-ice", isActive: true },
    { name: "🌈 Arco-íris", description: "Rotação cromática", category: "border", price: 200, rarity: "rare", icon: "🌈", preview: "border-rainbow", isActive: true },
    { name: "⚡ Neon", description: "Glow neon pulsante", category: "border", price: 300, rarity: "epic", icon: "⚡", preview: "border-neon", isActive: true },
    { name: "👑 Real", description: "Borda dourada", category: "border", price: 500, rarity: "legendary", icon: "👑", preview: "border-royal", isActive: true },
    { name: "📐 Aprendiz", description: "Aprendiz de Matemática", category: "title", price: 50, rarity: "common", icon: "📐", preview: "Aprendiz de Matemática", isActive: true },
    { name: "🧠 Gênio", description: "Gênio dos Números", category: "title", price: 150, rarity: "rare", icon: "🧠", preview: "Gênio dos Números", isActive: true },
    { name: "⚔️ Gladiador", description: "Gladiador Matemático", category: "title", price: 250, rarity: "epic", icon: "⚔️", preview: "Gladiador Matemático", isActive: true },
    { name: "👑 Lendário", description: "Lenda dos Saberes", category: "title", price: 500, rarity: "legendary", icon: "👑", preview: "Lenda dos Saberes", isActive: true },
  ];
  for (const item of shopItems) { await addDoc(collection(db, "shopItems"), { ...item, createdAt: serverTimestamp() }); }

  await setDoc(doc(db, "settings", "platform"), { quizWaitTime: 20, maxInfractions: 3, updatedAt: serverTimestamp() });

  return { success: true, message: `Seed completo! ${tracks.length} trilhas, ${lessons.length} aulas, ${quizData.length} quizzes, ${shopItems.length} itens da loja.` };
}


// ════════════════════ ANNOUNCEMENTS ════════════════════
export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: "info" | "warning" | "urgent";
  createdAt: unknown;
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
}

export async function createAnnouncement(data: { title: string; message: string; priority: string }) {
  const ref = await addDoc(collection(db, "announcements"), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function deleteAnnouncement(id: string) {
  await deleteDoc(doc(db, "announcements", id));
}

// ════════════════════ TEACHER: STUDENT MANAGEMENT ════════════════════

export async function updateStudentXP(uid: string, amount: number) {
  await updateDoc(doc(db, "users", uid), { xp: increment(amount) });
}

export async function updateStudentCoins(uid: string, amount: number) {
  await updateDoc(doc(db, "users", uid), { coins: increment(amount) });
}

export async function resetStudentProgress(uid: string) {
  await updateDoc(doc(db, "users", uid), {
    xp: 0, level: 1, streak: 0, bestStreak: 0,
    quizzesCompleted: 0, perfectQuizzes: 0, lessonsCompleted: 0,
    totalStudyMinutes: 0, coins: 0,
    duelsWon: 0, duelsLost: 0, duelsPlayed: 0,
  });
}

// ════════════════════ TEACHER: SITE BRANDING ════════════════════

export async function getSiteConfig() {
  const snap = await getDoc(doc(db, "settings", "siteConfig"));
  return snap.exists() ? snap.data() : null;
}

export async function saveSiteConfig(data: Record<string, unknown>) {
  await setDoc(doc(db, "settings", "siteConfig"), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}
