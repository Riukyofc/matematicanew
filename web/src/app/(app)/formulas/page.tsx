"use client";

import { useEffect, useState, useMemo } from "react";
import { getCustomFormulas, type Formula } from "@/lib/firebase";

const DEFAULT_FORMULAS = [
  { cat: "Álgebra", items: [
    { name: "Equação 1º Grau", formula: "ax + b = 0 → x = -b/a" },
    { name: "Equação 2º Grau", formula: "x = (-b ± √(b²-4ac)) / 2a" },
    { name: "Produto Notável", formula: "(a+b)² = a² + 2ab + b²" },
  ]},
  { cat: "Geometria", items: [
    { name: "Área do Triângulo", formula: "A = (b × h) / 2" },
    { name: "Área do Círculo", formula: "A = π × r²" },
    { name: "Pitágoras", formula: "a² = b² + c²" },
    { name: "Circunferência", formula: "C = 2 × π × r" },
  ]},
  { cat: "Estatística", items: [
    { name: "Média", formula: "M = Σx / n" },
    { name: "Porcentagem", formula: "P = (parte/total) × 100" },
  ]},
];

export default function FormulasPage() {
  const [firestoreFormulas, setFirestoreFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("favoriteFormulas");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const f = await getCustomFormulas();
        setFirestoreFormulas(f);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Group Firestore formulas by category
  const groupedFirestore = firestoreFormulas.reduce((acc, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push({ name: f.name, formula: f.formula });
    return acc;
  }, {} as Record<string, { name: string; formula: string }[]>);

  const categories = firestoreFormulas.length > 0
    ? Object.entries(groupedFirestore).map(([cat, items]) => ({ cat, items }))
    : DEFAULT_FORMULAS;

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories
      .map(cat => ({
        ...cat,
        items: cat.items.filter(it => it.name.toLowerCase().includes(q) || it.formula.toLowerCase().includes(q) || cat.cat.toLowerCase().includes(q))
      }))
      .filter(cat => cat.items.length > 0);
  }, [categories, search]);

  const copyFormula = (formula: string, name: string) => {
    navigator.clipboard.writeText(formula);
    setCopied(name);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleFavorite = (name: string) => {
    const newFavs = favorites.includes(name) ? favorites.filter(f => f !== name) : [...favorites, name];
    setFavorites(newFavs);
    localStorage.setItem("favoriteFormulas", JSON.stringify(newFavs));
  };

  return (
    <div className="max-w-4xl mx-auto py-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center text-2xl shadow-inner border border-violet-500/20 animate-float">
            ƒ
          </div>
          <div>
            <h1 className="text-2xl font-black heading-gradient">Banco de Fórmulas</h1>
            <p className="text-xs font-medium text-[var(--color-text-muted)]">Consulte rápido e mande bem</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar fórmula..."
            className="input-premium pl-9 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Favorites */}
      {favorites.length > 0 && !search && (
        <div className="mb-6 animate-fade-up" style={{ animationDelay: "0.05s" }}>
          <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="text-yellow-500">⭐</span> Favoritas
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.flatMap(cat => cat.items).filter(it => favorites.includes(it.name)).map(it => (
              <div key={it.name} className="px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-sm">
                <span className="font-bold text-[var(--color-text-primary)]">{it.name}: </span>
                <span className="font-mono text-violet-500">{it.formula}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid lg:grid-cols-2 gap-5">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 animate-fade-up">
          <div className="text-4xl mb-3 opacity-50">🔍</div>
          <p className="text-sm font-bold text-[var(--color-text-secondary)]">Nenhuma fórmula encontrada</p>
          <p className="text-xs text-[var(--color-text-muted)]">Tente outro termo de busca</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">
          {filtered.map((cat, i) => (
            <div 
              key={cat.cat} 
              className="p-5 rounded-2xl glass-card-static animate-fade-up"
              style={{ animationDelay: `${0.1 + i * 0.08}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-[var(--color-text-primary)]">{cat.cat}</h3>
                <span className="badge badge-accent">{cat.items.length} itens</span>
              </div>
              
              <div className="space-y-2">
                {cat.items.map((it) => (
                  <div key={it.name} className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-violet-500/30 transition-all group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">{it.name}</p>
                        <p className="text-base sm:text-lg font-mono font-bold text-violet-500 tracking-tight">{it.formula}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => toggleFavorite(it.name)}
                          className="p-1.5 rounded-lg hover:bg-yellow-500/10 transition-colors cursor-pointer"
                          title="Favoritar"
                        >
                          <span className="text-sm">{favorites.includes(it.name) ? "⭐" : "☆"}</span>
                        </button>
                        <button
                          onClick={() => copyFormula(it.formula, it.name)}
                          className="p-1.5 rounded-lg hover:bg-[var(--color-accent-subtle)] transition-colors cursor-pointer"
                          title="Copiar"
                        >
                          {copied === it.name ? (
                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          ) : (
                            <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
