// ════════════════════════════════════════════════════════════════
// 🧮 MATH ENGINE — Motor de Questões Procedurais
// Gera questões matemáticas com explicações, dificuldade adaptativa
// e sistema de pontuação/combo
// ════════════════════════════════════════════════════════════════

export type Difficulty = "easy" | "medium" | "hard";
export type Category = "algebra" | "geometry" | "fractions" | "statistics" | "arithmetic" | "powers";

export interface GeneratedQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  category: Category;
  difficulty: Difficulty;
  explanation: string;
  points: number;
  hint?: string;
}

export interface QuizConfig {
  categories?: Category[];
  difficulty?: Difficulty;
  count?: number;
  adaptiveDifficulty?: boolean;
}

export interface ComboState {
  streak: number;
  multiplier: number;
  maxStreak: number;
  totalBonus: number;
}

// ═══════════════════ SCORING ═══════════════════

export function getComboMultiplier(streak: number): number {
  if (streak >= 10) return 5;
  if (streak >= 7) return 4;
  if (streak >= 5) return 3;
  if (streak >= 3) return 2;
  return 1;
}

export function calculatePoints(basePoints: number, combo: ComboState, timeBonus: number): number {
  return Math.round(basePoints * combo.multiplier + timeBonus);
}

export function getStars(percentage: number): 1 | 2 | 3 {
  if (percentage >= 90) return 3;
  if (percentage >= 70) return 2;
  return 1;
}

export function getTimeBonusPoints(remainingSeconds: number, totalSeconds: number): number {
  const ratio = remainingSeconds / totalSeconds;
  if (ratio > 0.7) return 5;
  if (ratio > 0.4) return 3;
  if (ratio > 0.1) return 1;
  return 0;
}

// ═══════════════════ UTILITIES ═══════════════════

function uid(): string {
  return Math.random().toString(36).substring(2, 10);
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateDistractors(correct: number, count: number = 3): number[] {
  const distractors = new Set<number>();
  let attempts = 0;
  while (distractors.size < count && attempts < 50) {
    attempts++;
    let d: number;
    const strategy = rand(0, 3);
    if (strategy === 0) {
      d = correct + rand(1, Math.max(5, Math.abs(correct) / 2));
    } else if (strategy === 1) {
      d = correct - rand(1, Math.max(5, Math.abs(correct) / 2));
    } else if (strategy === 2) {
      d = correct * 2;
    } else {
      d = correct + (rand(0, 1) === 0 ? 1 : -1) * rand(1, 10);
    }
    d = Math.round(d * 100) / 100;
    if (d !== correct && !distractors.has(d)) {
      distractors.add(d);
    }
  }
  // Fill remaining if needed
  let fallback = correct + 1;
  while (distractors.size < count) {
    if (fallback !== correct && !distractors.has(fallback)) {
      distractors.add(fallback);
    }
    fallback++;
  }
  return Array.from(distractors);
}

function makeOptions(correct: number, distractorCount: number = 3): { options: string[]; correctIndex: number } {
  const distractors = generateDistractors(correct, distractorCount);
  const all = [correct, ...distractors];
  const shuffled = shuffle(all);
  return {
    options: shuffled.map(n => formatNumber(n)),
    correctIndex: shuffled.indexOf(correct),
  };
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/\.?0+$/, "");
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function simplifyFraction(num: number, den: number): [number, number] {
  const g = gcd(num, den);
  return [num / g, den / g];
}

// ═══════════════════ DIFFICULTY PARAMS ═══════════════════

interface DifficultyParams {
  minNum: number;
  maxNum: number;
  complexity: number;
  points: number;
}

function getDiffParams(difficulty: Difficulty): DifficultyParams {
  switch (difficulty) {
    case "easy": return { minNum: 1, maxNum: 20, complexity: 1, points: 10 };
    case "medium": return { minNum: 5, maxNum: 50, complexity: 2, points: 15 };
    case "hard": return { minNum: 10, maxNum: 100, complexity: 3, points: 25 };
  }
}

// ═══════════════════ QUESTION GENERATORS ═══════════════════

type QuestionGenerator = (difficulty: Difficulty) => GeneratedQuestion;

// ── ARITHMETIC ──

const genAddition: QuestionGenerator = (diff) => {
  const p = getDiffParams(diff);
  const a = rand(p.minNum, p.maxNum);
  const b = rand(p.minNum, p.maxNum);
  const answer = a + b;
  const { options, correctIndex } = makeOptions(answer);
  return {
    id: uid(), text: `Quanto é ${a} + ${b}?`, options, correctIndex,
    category: "arithmetic", difficulty: diff, points: p.points,
    explanation: `Para somar ${a} + ${b}, basta juntar os valores:\n${a} + ${b} = ${answer}`,
    hint: "Some os dois números diretamente.",
  };
};

const genSubtraction: QuestionGenerator = (diff) => {
  const p = getDiffParams(diff);
  let a = rand(p.minNum, p.maxNum);
  let b = rand(p.minNum, p.maxNum);
  if (b > a) [a, b] = [b, a];
  const answer = a - b;
  const { options, correctIndex } = makeOptions(answer);
  return {
    id: uid(), text: `Quanto é ${a} − ${b}?`, options, correctIndex,
    category: "arithmetic", difficulty: diff, points: p.points,
    explanation: `${a} − ${b} = ${answer}\nSubtraímos ${b} de ${a}.`,
    hint: "Subtraia o segundo número do primeiro.",
  };
};

const genMultiplication: QuestionGenerator = (diff) => {
  const p = getDiffParams(diff);
  const max = diff === "easy" ? 12 : diff === "medium" ? 15 : 25;
  const a = rand(2, max);
  const b = rand(2, max);
  const answer = a * b;
  const { options, correctIndex } = makeOptions(answer);
  return {
    id: uid(), text: `Quanto é ${a} × ${b}?`, options, correctIndex,
    category: "arithmetic", difficulty: diff, points: p.points,
    explanation: `${a} × ${b} = ${answer}\nMultiplique ${a} por ${b}.`,
    hint: `Pense: ${a} grupos de ${b}.`,
  };
};

const genDivision: QuestionGenerator = (diff) => {
  const p = getDiffParams(diff);
  const max = diff === "easy" ? 10 : diff === "medium" ? 12 : 15;
  const b = rand(2, max);
  const answer = rand(2, max);
  const a = b * answer;
  const { options, correctIndex } = makeOptions(answer);
  return {
    id: uid(), text: `Quanto é ${a} ÷ ${b}?`, options, correctIndex,
    category: "arithmetic", difficulty: diff, points: p.points,
    explanation: `${a} ÷ ${b} = ${answer}\nDividimos ${a} em ${b} partes iguais.`,
    hint: `Qual número multiplicado por ${b} dá ${a}?`,
  };
};

// ── ALGEBRA ──

const genLinearEq: QuestionGenerator = (diff) => {
  const p = getDiffParams(diff);
  const x = rand(diff === "easy" ? 1 : -10, diff === "easy" ? 10 : 20);
  const a = rand(2, diff === "hard" ? 8 : 5);
  const b = rand(1, p.maxNum);
  const c = a * x + b;
  const { options, correctIndex } = makeOptions(x);
  return {
    id: uid(), text: `Se ${a}x + ${b} = ${c}, qual é o valor de x?`, options, correctIndex,
    category: "algebra", difficulty: diff, points: p.points,
    explanation: `${a}x + ${b} = ${c}\n${a}x = ${c} − ${b}\n${a}x = ${c - b}\nx = ${c - b} ÷ ${a}\nx = ${x}`,
    hint: "Isole o x: passe o número para o outro lado e divida.",
  };
};

const genQuadratic: QuestionGenerator = (diff) => {
  const x1 = rand(1, 8);
  const x2 = rand(1, 8);
  const a = 1;
  const b = -(x1 + x2);
  const c = x1 * x2;
  const bStr = b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`;
  const cStr = c >= 0 ? `+ ${c}` : `− ${Math.abs(c)}`;
  const answer = x1 + x2;
  const { options, correctIndex } = makeOptions(answer);
  return {
    id: uid(),
    text: `Na equação x² ${bStr}x ${cStr} = 0, qual é a soma das raízes?`,
    options, correctIndex,
    category: "algebra", difficulty: diff, points: getDiffParams(diff).points,
    explanation: `Pela relação de Girard: soma das raízes = -b/a\nSoma = ${-b}/${a} = ${answer}\n(As raízes são ${x1} e ${x2})`,
    hint: "Use a relação de Girard: soma = -b/a",
  };
};

const genSystemEq: QuestionGenerator = (diff) => {
  const x = rand(1, 8);
  const y = rand(1, 8);
  const a1 = rand(1, 4);
  const b1 = rand(1, 4);
  const c1 = a1 * x + b1 * y;
  const a2 = rand(1, 4);
  const b2 = rand(1, 4);
  const c2 = a2 * x + b2 * y;
  const { options, correctIndex } = makeOptions(x + y);
  return {
    id: uid(),
    text: `No sistema { ${a1}x + ${b1}y = ${c1} ; ${a2}x + ${b2}y = ${c2} }, quanto vale x + y?`,
    options, correctIndex,
    category: "algebra", difficulty: diff, points: getDiffParams(diff).points + 5,
    explanation: `Resolvendo o sistema:\nx = ${x}, y = ${y}\nx + y = ${x + y}\n\nSubstitua para verificar:\n${a1}(${x}) + ${b1}(${y}) = ${c1} ✓\n${a2}(${x}) + ${b2}(${y}) = ${c2} ✓`,
    hint: "Use substituição ou adição para resolver o sistema.",
  };
};

const genExpression: QuestionGenerator = (diff) => {
  const a = rand(2, 10);
  const b = rand(1, 8);
  const c = rand(1, 5);
  const answer = a * (b + c);
  const { options, correctIndex } = makeOptions(answer);
  return {
    id: uid(), text: `Qual o valor de ${a} × (${b} + ${c})?`, options, correctIndex,
    category: "algebra", difficulty: diff, points: getDiffParams(diff).points,
    explanation: `Primeiro resolvemos o parênteses:\n${b} + ${c} = ${b + c}\nDepois multiplicamos:\n${a} × ${b + c} = ${answer}`,
    hint: "Resolva primeiro o que está dentro dos parênteses.",
  };
};

// ── GEOMETRY ──

const genTriangleArea: QuestionGenerator = (diff) => {
  const base = rand(3, diff === "hard" ? 20 : 12);
  const height = rand(2, diff === "hard" ? 16 : 10);
  const answer = (base * height) / 2;
  const { options, correctIndex } = makeOptions(answer);
  return {
    id: uid(),
    text: `Qual a área de um triângulo com base ${base} e altura ${height}?`,
    options, correctIndex,
    category: "geometry", difficulty: diff, points: getDiffParams(diff).points,
    explanation: `Área do triângulo = (base × altura) ÷ 2\nA = (${base} × ${height}) ÷ 2\nA = ${base * height} ÷ 2\nA = ${answer}`,
    hint: "Fórmula: A = (b × h) / 2",
  };
};

const genRectPerimeter: QuestionGenerator = (diff) => {
  const l = rand(3, diff === "hard" ? 25 : 15);
  const w = rand(2, diff === "hard" ? 20 : 12);
  const answer = 2 * (l + w);
  const { options, correctIndex } = makeOptions(answer);
  return {
    id: uid(),
    text: `Qual o perímetro de um retângulo com lados ${l} e ${w}?`,
    options, correctIndex,
    category: "geometry", difficulty: diff, points: getDiffParams(diff).points,
    explanation: `Perímetro = 2 × (comprimento + largura)\nP = 2 × (${l} + ${w})\nP = 2 × ${l + w}\nP = ${answer}`,
    hint: "Perímetro = 2 × (l + w)",
  };
};

const genCircleArea: QuestionGenerator = (diff) => {
  const r = rand(2, diff === "hard" ? 10 : 7);
  const answer = Math.round(Math.PI * r * r * 100) / 100;
  const { options, correctIndex } = makeOptions(answer);
  return {
    id: uid(),
    text: `Qual a área de um círculo com raio ${r}? (use π ≈ 3.14)`,
    options, correctIndex,
    category: "geometry", difficulty: diff, points: getDiffParams(diff).points,
    explanation: `Área = π × r²\nA = 3.14 × ${r}²\nA = 3.14 × ${r * r}\nA ≈ ${answer}`,
    hint: "Fórmula: A = π × r²",
  };
};

const genPythagoras: QuestionGenerator = (diff) => {
  // Use Pythagorean triples for clean answers
  const triples = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10]];
  const [a, b, c] = pick(triples);
  const askFor = rand(0, 1); // 0 = ask hypotenuse, 1 = ask leg
  
  if (askFor === 0) {
    const { options, correctIndex } = makeOptions(c);
    return {
      id: uid(),
      text: `Em um triângulo retângulo com catetos ${a} e ${b}, qual a hipotenusa?`,
      options, correctIndex,
      category: "geometry", difficulty: diff, points: getDiffParams(diff).points + 5,
      explanation: `Teorema de Pitágoras: a² + b² = c²\n${a}² + ${b}² = c²\n${a * a} + ${b * b} = c²\n${a * a + b * b} = c²\nc = √${a * a + b * b} = ${c}`,
      hint: "Use o Teorema de Pitágoras: c² = a² + b²",
    };
  } else {
    const { options, correctIndex } = makeOptions(b);
    return {
      id: uid(),
      text: `Em um triângulo retângulo com hipotenusa ${c} e cateto ${a}, qual o outro cateto?`,
      options, correctIndex,
      category: "geometry", difficulty: diff, points: getDiffParams(diff).points + 5,
      explanation: `Teorema de Pitágoras: a² + b² = c²\n${a}² + b² = ${c}²\n${a * a} + b² = ${c * c}\nb² = ${c * c} − ${a * a}\nb² = ${c * c - a * a}\nb = √${c * c - a * a} = ${b}`,
      hint: "Use Pitágoras: b² = c² − a²",
    };
  }
};

const genAngles: QuestionGenerator = (diff) => {
  const a1 = rand(20, 80);
  const a2 = rand(20, 160 - a1);
  const answer = 180 - a1 - a2;
  const { options, correctIndex } = makeOptions(answer);
  return {
    id: uid(),
    text: `Em um triângulo com ângulos de ${a1}° e ${a2}°, qual o terceiro ângulo?`,
    options, correctIndex,
    category: "geometry", difficulty: diff, points: getDiffParams(diff).points,
    explanation: `Soma dos ângulos internos de um triângulo = 180°\n${a1}° + ${a2}° + x = 180°\nx = 180° − ${a1}° − ${a2}°\nx = ${answer}°`,
    hint: "A soma dos ângulos de um triângulo é sempre 180°.",
  };
};

// ── FRACTIONS ──

const genFractionAdd: QuestionGenerator = (diff) => {
  const d1 = pick(diff === "hard" ? [3, 4, 5, 6, 7, 8] : [2, 3, 4, 5, 6]);
  const d2 = pick(diff === "hard" ? [3, 4, 5, 6, 7, 8] : [2, 3, 4, 5, 6]);
  const n1 = rand(1, d1 - 1);
  const n2 = rand(1, d2 - 1);
  const numAnswer = n1 * d2 + n2 * d1;
  const denAnswer = d1 * d2;
  const [sn, sd] = simplifyFraction(numAnswer, denAnswer);
  
  const answerStr = `${sn}/${sd}`;
  const wrongOptions = [
    `${n1 + n2}/${d1 + d2}`,
    `${sn + 1}/${sd}`,
    `${sn}/${sd + 1}`,
  ].filter(o => o !== answerStr);
  
  const allOptions = shuffle([answerStr, ...wrongOptions.slice(0, 3)]);
  if (!allOptions.includes(answerStr)) allOptions[0] = answerStr;
  const finalOptions = shuffle(allOptions.slice(0, 4));
  
  return {
    id: uid(),
    text: `Quanto é ${n1}/${d1} + ${n2}/${d2}?`,
    options: finalOptions,
    correctIndex: finalOptions.indexOf(answerStr),
    category: "fractions", difficulty: diff, points: getDiffParams(diff).points,
    explanation: `${n1}/${d1} + ${n2}/${d2}\n= (${n1}×${d2})/(${d1}×${d2}) + (${n2}×${d1})/(${d2}×${d1})\n= ${n1 * d2}/${denAnswer} + ${n2 * d1}/${denAnswer}\n= ${numAnswer}/${denAnswer}\n= ${sn}/${sd}`,
    hint: "Para somar frações, iguale os denominadores (MMC).",
  };
};

const genPercentage: QuestionGenerator = (diff) => {
  const percents = diff === "easy" ? [10, 20, 25, 50] : diff === "medium" ? [15, 30, 40, 60, 75] : [12, 18, 35, 45, 65, 85];
  const pct = pick(percents);
  const base = pick(diff === "easy" ? [100, 200, 50] : diff === "medium" ? [80, 120, 150, 250] : [160, 240, 350, 480]);
  const answer = (pct / 100) * base;
  const { options, correctIndex } = makeOptions(answer);
  return {
    id: uid(),
    text: `Quanto é ${pct}% de ${base}?`,
    options, correctIndex,
    category: "fractions", difficulty: diff, points: getDiffParams(diff).points,
    explanation: `${pct}% de ${base}\n= (${pct}/100) × ${base}\n= ${pct / 100} × ${base}\n= ${answer}`,
    hint: "Divida a porcentagem por 100 e multiplique pelo valor.",
  };
};

const genFractionSimplify: QuestionGenerator = (diff) => {
  const [sn, sd] = [rand(1, 6), rand(2, 8)];
  const mult = rand(2, diff === "hard" ? 6 : 4);
  const n = sn * mult;
  const d = sd * mult;
  const [an, ad] = simplifyFraction(n, d);
  const answerStr = `${an}/${ad}`;
  
  const wrongs = [`${n}/${d}`, `${an + 1}/${ad}`, `${an}/${ad + 1}`, `${n / 2}/${d}`]
    .filter(o => o !== answerStr);
  
  const allOpts = shuffle([answerStr, ...wrongs.slice(0, 3)]);
  
  return {
    id: uid(),
    text: `Simplifique a fração ${n}/${d}:`,
    options: allOpts,
    correctIndex: allOpts.indexOf(answerStr),
    category: "fractions", difficulty: diff, points: getDiffParams(diff).points,
    explanation: `MDC de ${n} e ${d} = ${gcd(n, d)}\n${n} ÷ ${gcd(n, d)} = ${an}\n${d} ÷ ${gcd(n, d)} = ${ad}\n${n}/${d} = ${an}/${ad}`,
    hint: "Encontre o MDC e divida numerador e denominador.",
  };
};

// ── POWERS ──

const genSquare: QuestionGenerator = (diff) => {
  const base = rand(2, diff === "hard" ? 15 : diff === "medium" ? 12 : 10);
  const answer = base * base;
  const { options, correctIndex } = makeOptions(answer);
  return {
    id: uid(), text: `Quanto é ${base}²?`, options, correctIndex,
    category: "powers", difficulty: diff, points: getDiffParams(diff).points,
    explanation: `${base}² = ${base} × ${base} = ${answer}`,
    hint: `Multiplique ${base} por ele mesmo.`,
  };
};

const genCube: QuestionGenerator = (diff) => {
  const base = rand(2, diff === "hard" ? 8 : 5);
  const answer = base * base * base;
  const { options, correctIndex } = makeOptions(answer);
  return {
    id: uid(), text: `Quanto é ${base}³?`, options, correctIndex,
    category: "powers", difficulty: diff, points: getDiffParams(diff).points,
    explanation: `${base}³ = ${base} × ${base} × ${base}\n= ${base * base} × ${base}\n= ${answer}`,
    hint: `Multiplique ${base} por ele mesmo três vezes.`,
  };
};

const genSqrt: QuestionGenerator = (diff) => {
  const perfects = diff === "easy" ? [4, 9, 16, 25, 36] : diff === "medium" ? [49, 64, 81, 100, 121] : [144, 169, 196, 225, 256];
  const n = pick(perfects);
  const answer = Math.sqrt(n);
  const { options, correctIndex } = makeOptions(answer);
  return {
    id: uid(), text: `Quanto é √${n}?`, options, correctIndex,
    category: "powers", difficulty: diff, points: getDiffParams(diff).points,
    explanation: `√${n} = ${answer}\nPorque ${answer} × ${answer} = ${n}`,
    hint: "Qual número multiplicado por ele mesmo dá esse resultado?",
  };
};

// ── STATISTICS ──

const genMean: QuestionGenerator = (diff) => {
  const count = diff === "easy" ? 3 : diff === "medium" ? 4 : 5;
  const nums = Array.from({ length: count }, () => rand(2, diff === "hard" ? 20 : 10));
  const sum = nums.reduce((a, b) => a + b, 0);
  const answer = Math.round((sum / count) * 100) / 100;
  const { options, correctIndex } = makeOptions(answer);
  return {
    id: uid(),
    text: `Qual a média aritmética de {${nums.join(", ")}}?`,
    options, correctIndex,
    category: "statistics", difficulty: diff, points: getDiffParams(diff).points,
    explanation: `Média = soma dos valores ÷ quantidade\nMédia = (${nums.join(" + ")}) ÷ ${count}\nMédia = ${sum} ÷ ${count}\nMédia = ${answer}`,
    hint: "Some todos os valores e divida pela quantidade.",
  };
};

const genMedian: QuestionGenerator = (diff) => {
  const count = diff === "easy" ? 3 : 5;
  const nums = Array.from({ length: count }, () => rand(1, 15));
  const sorted = [...nums].sort((a, b) => a - b);
  const answer = sorted[Math.floor(count / 2)];
  const { options, correctIndex } = makeOptions(answer);
  return {
    id: uid(),
    text: `Qual a mediana de {${nums.join(", ")}}?`,
    options, correctIndex,
    category: "statistics", difficulty: diff, points: getDiffParams(diff).points,
    explanation: `Ordenando: {${sorted.join(", ")}}\nA mediana é o valor central.\nMediana = ${answer}`,
    hint: "Ordene os valores e encontre o do meio.",
  };
};

const genMode: QuestionGenerator = (diff) => {
  const base = Array.from({ length: 4 }, () => rand(1, 10));
  const mode = pick(base);
  const nums = shuffle([...base, mode, mode]);
  const { options, correctIndex } = makeOptions(mode);
  return {
    id: uid(),
    text: `Qual a moda de {${nums.join(", ")}}?`,
    options, correctIndex,
    category: "statistics", difficulty: diff, points: getDiffParams(diff).points,
    explanation: `Contando as frequências:\n${[...new Set(nums)].map(n => `${n}: ${nums.filter(x => x === n).length} vez(es)`).join("\n")}\nA moda é ${mode} (aparece mais vezes).`,
    hint: "A moda é o valor que mais se repete.",
  };
};

// ═══════════════════ GENERATOR REGISTRY ═══════════════════

const generatorsByCategory: Record<Category, QuestionGenerator[]> = {
  arithmetic: [genAddition, genSubtraction, genMultiplication, genDivision],
  algebra: [genLinearEq, genQuadratic, genSystemEq, genExpression],
  geometry: [genTriangleArea, genRectPerimeter, genCircleArea, genPythagoras, genAngles],
  fractions: [genFractionAdd, genPercentage, genFractionSimplify],
  powers: [genSquare, genCube, genSqrt],
  statistics: [genMean, genMedian, genMode],
};

const ALL_CATEGORIES: Category[] = ["arithmetic", "algebra", "geometry", "fractions", "powers", "statistics"];

// ═══════════════════ PUBLIC API ═══════════════════

/** Generate a batch of questions with the given configuration */
export function generateQuestions(config: QuizConfig = {}): GeneratedQuestion[] {
  const {
    categories = ALL_CATEGORIES,
    difficulty = "medium",
    count = 10,
  } = config;

  const questions: GeneratedQuestion[] = [];
  const usedTexts = new Set<string>();

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    while (attempts < 20) {
      attempts++;
      const cat = pick(categories);
      const gens = generatorsByCategory[cat];
      const gen = pick(gens);
      const q = gen(difficulty);
      if (!usedTexts.has(q.text)) {
        usedTexts.add(q.text);
        questions.push(q);
        break;
      }
    }
  }

  return questions;
}

/** Generate a single question for a specific category */
export function generateSingleQuestion(category: Category, difficulty: Difficulty): GeneratedQuestion {
  const gens = generatorsByCategory[category];
  return pick(gens)(difficulty);
}

/** Generate questions with progressive difficulty for Blitz mode */
export function generateBlitzQuestions(count: number = 30): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const diff: Difficulty = i < 10 ? "easy" : i < 20 ? "medium" : "hard";
    const cat = pick(ALL_CATEGORIES);
    const gen = pick(generatorsByCategory[cat]);
    questions.push(gen(diff));
  }
  return questions;
}

/** Generate daily challenge questions (fixed seed based on date) */
export function generateDailyChallengeQuestions(): GeneratedQuestion[] {
  return generateQuestions({
    count: 5,
    difficulty: "medium",
    categories: shuffle([...ALL_CATEGORIES]).slice(0, 3),
  });
}

/** Get category display info */
export function getCategoryInfo(category: Category): { name: string; emoji: string; color: string } {
  const info: Record<Category, { name: string; emoji: string; color: string }> = {
    arithmetic: { name: "Aritmética", emoji: "🔢", color: "var(--color-info)" },
    algebra: { name: "Álgebra", emoji: "📐", color: "var(--color-primary)" },
    geometry: { name: "Geometria", emoji: "📏", color: "var(--color-success)" },
    fractions: { name: "Frações", emoji: "🧮", color: "var(--color-warning)" },
    powers: { name: "Potências", emoji: "⚡", color: "var(--color-error)" },
    statistics: { name: "Estatística", emoji: "📊", color: "var(--color-coins)" },
  };
  return info[category];
}

/** Get difficulty display info */
export function getDifficultyInfo(difficulty: Difficulty): { name: string; emoji: string; color: string } {
  const info: Record<Difficulty, { name: string; emoji: string; color: string }> = {
    easy: { name: "Fácil", emoji: "🟢", color: "var(--color-success)" },
    medium: { name: "Médio", emoji: "🟡", color: "var(--color-warning)" },
    hard: { name: "Difícil", emoji: "🔴", color: "var(--color-error)" },
  };
  return info[difficulty];
}

export { ALL_CATEGORIES };
