"use client";

import { useState } from "react";

export default function CalculatorPage() {
  const [d, setD] = useState("0");
  const [prev, setPrev] = useState("");
  const [op, setOp] = useState("");
  const [fresh, setFresh] = useState(true);
  const [scientific, setScientific] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const input = (v: string) => { 
    if (fresh) { 
      setD(v === "." ? "0." : v); 
      setFresh(false); 
    } else { 
      if (v === "." && d.includes(".")) return; 
      setD(d === "0" && v !== "." ? v : d + v); 
    } 
  };
  
  const operate = (o: string) => { 
    setPrev(d); 
    setOp(o); 
    setFresh(true); 
  };
  
  const calc = () => { 
    const a = parseFloat(prev), b = parseFloat(d); 
    if (isNaN(a)) return; 
    let r = 0; 
    switch (op) { 
      case "+": r = a + b; break; 
      case "-": r = a - b; break; 
      case "×": r = a * b; break; 
      case "÷": r = b !== 0 ? a / b : 0; break; 
    } 
    const result = String(parseFloat(r.toFixed(10)));
    setHistory(h => [`${prev} ${op} ${d} = ${result}`, ...h].slice(0, 10));
    setD(result); 
    setPrev(""); 
    setOp(""); 
    setFresh(true); 
  };
  
  const clear = () => { 
    setD("0"); 
    setPrev(""); 
    setOp(""); 
    setFresh(true); 
  };

  const sciOp = (fn: (n: number) => number, label: string) => {
    const n = parseFloat(d);
    if (isNaN(n)) return;
    const result = String(parseFloat(fn(n).toFixed(10)));
    setHistory(h => [`${label}(${d}) = ${result}`, ...h].slice(0, 10));
    setD(result);
    setFresh(true);
  };

  const B = (l: string, fn: () => void, c?: string) => (
    <button 
      onClick={fn} 
      className={`h-12 sm:h-14 rounded-xl font-bold text-base sm:text-lg transition-all active:scale-95 cursor-pointer relative overflow-hidden
        ${c || "bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-input)] hover:border-[var(--color-accent-glow)] text-[var(--color-text-primary)]"}`}
    >
      {l}
    </button>
  );

  return (
    <div className="max-w-md mx-auto py-6 animate-fade-up">
      <div className="text-center mb-6">
        <div className="inline-block p-3 rounded-2xl bg-[var(--color-accent-subtle)] text-[var(--color-accent)] mb-3 shadow-inner animate-float">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
        </div>
        <h1 className="text-2xl font-black heading-gradient">Calculadora</h1>
        <p className="text-xs font-medium text-[var(--color-text-muted)]">Ferramenta de auxílio matemático</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <button 
          onClick={() => setScientific(false)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${!scientific ? "tab-active" : "tab-inactive"}`}
        >
          Básica
        </button>
        <button 
          onClick={() => setScientific(true)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${scientific ? "tab-active" : "tab-inactive"}`}
        >
          Científica
        </button>
      </div>

      <div className="p-5 rounded-2xl glass-card-static shadow-lg">
        {/* Display */}
        <div className="mb-4 p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] shadow-inner text-right min-h-[80px] flex flex-col justify-end overflow-hidden relative">
          {op && <div className="text-xs font-bold text-[var(--color-text-muted)] absolute top-3 right-4">{prev} {op}</div>}
          <div className="text-3xl sm:text-4xl font-black text-[var(--color-text-primary)] tracking-tight truncate">
            {d}
          </div>
        </div>

        {/* Scientific Row */}
        {scientific && (
          <div className="grid grid-cols-5 gap-2 mb-3 animate-slide-down">
            {B("√", () => sciOp(Math.sqrt, "√"), "bg-violet-500/10 text-violet-500 border border-violet-500/20 text-sm")}
            {B("x²", () => sciOp(n => n * n, "²"), "bg-violet-500/10 text-violet-500 border border-violet-500/20 text-sm")}
            {B("π", () => { setD(String(Math.PI)); setFresh(true); }, "bg-violet-500/10 text-violet-500 border border-violet-500/20 text-sm")}
            {B("sin", () => sciOp(n => Math.sin(n * Math.PI / 180), "sin"), "bg-violet-500/10 text-violet-500 border border-violet-500/20 text-sm")}
            {B("cos", () => sciOp(n => Math.cos(n * Math.PI / 180), "cos"), "bg-violet-500/10 text-violet-500 border border-violet-500/20 text-sm")}
            {B("tan", () => sciOp(n => Math.tan(n * Math.PI / 180), "tan"), "bg-violet-500/10 text-violet-500 border border-violet-500/20 text-sm")}
            {B("log", () => sciOp(Math.log10, "log"), "bg-violet-500/10 text-violet-500 border border-violet-500/20 text-sm")}
            {B("ln", () => sciOp(Math.log, "ln"), "bg-violet-500/10 text-violet-500 border border-violet-500/20 text-sm")}
            {B("1/x", () => sciOp(n => n !== 0 ? 1/n : 0, "1/"), "bg-violet-500/10 text-violet-500 border border-violet-500/20 text-sm")}
            {B("±", () => { setD(String(-parseFloat(d))); }, "bg-violet-500/10 text-violet-500 border border-violet-500/20 text-sm")}
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {B("C", clear, "bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20")}
          {B("⌫", () => setD(d.length > 1 ? d.slice(0, -1) : "0"), "bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500/20")}
          {B("%", () => sciOp(n => n / 100, "%"), "bg-[var(--color-bg-secondary)] border border-[var(--color-border)]")}
          {B("÷", () => operate("÷"), "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-glow)] hover:bg-[var(--color-accent-glow)]")}
          
          {B("7", () => input("7"))}
          {B("8", () => input("8"))}
          {B("9", () => input("9"))}
          {B("×", () => operate("×"), "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-glow)] hover:bg-[var(--color-accent-glow)]")}
          
          {B("4", () => input("4"))}
          {B("5", () => input("5"))}
          {B("6", () => input("6"))}
          {B("-", () => operate("-"), "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-glow)] hover:bg-[var(--color-accent-glow)]")}
          
          {B("1", () => input("1"))}
          {B("2", () => input("2"))}
          {B("3", () => input("3"))}
          {B("+", () => operate("+"), "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-glow)] hover:bg-[var(--color-accent-glow)]")}
          
          <button onClick={() => input("0")} className="col-span-2 h-12 sm:h-14 rounded-xl font-bold text-base sm:text-lg transition-all active:scale-95 cursor-pointer bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-input)] text-[var(--color-text-primary)]">0</button>
          {B(".", () => input("."))}
          {B("=", calc, "bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] text-white shadow-md shadow-[var(--color-accent-glow)] hover:shadow-lg")}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="mt-4 p-4 rounded-xl glass-card-static animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Histórico</p>
            <button onClick={() => setHistory([])} className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer">Limpar</button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {history.map((h, i) => (
              <p key={i} className="text-xs font-mono text-[var(--color-text-secondary)] py-1 border-b border-[var(--color-border)] last:border-0">{h}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
