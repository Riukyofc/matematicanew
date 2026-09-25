"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { registerUser, loginUser } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const { user, loading: authLoading, loginWithGoogle } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (!authLoading && user) router.replace("/dashboard");
  }, [user, authLoading, router]);

  const pwStr = useMemo(() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    return Math.min(s, 4);
  }, [password]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        if (!name.trim()) { setError("Nome obrigatório"); setLoading(false); return; }
        if (password.length < 6) { setError("Mínimo 6 caracteres"); setLoading(false); return; }
        await registerUser(name.trim(), email.trim(), password);
      } else {
        await loginUser(email.trim(), password);
      }
    } catch (err: unknown) {
      const c = (err as { code?: string }).code || "";
      const msgs: Record<string, string> = {
        "auth/email-already-in-use": "Email já cadastrado",
        "auth/invalid-email": "Email inválido",
        "auth/weak-password": "Senha fraca",
        "auth/invalid-credential": "Email ou senha incorretos",
      };
      setError(msgs[c] || "Erro de conexão");
      setLoading(false);
    }
  };

  const [greeting, setGreeting] = useState("Olá");

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Bom dia ☀️" : hour < 18 ? "Boa tarde 🌤️" : "Boa noite 🌙");
  }, []);

  if (authLoading || user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
      <div className="w-10 h-10 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--color-bg)" }}>
      <div className="w-full max-w-sm animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white text-2xl font-black" style={{ background: "var(--color-primary)" }}>
            S
          </div>
          <h1 className="text-2xl font-black">Saberes em Conexão</h1>
          <p className="text-xs font-bold mt-1 uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Conhecer • Conectar • Transformar</p>
        </div>

        {/* Form Card */}
        <div className="card p-6">
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>{greeting}</p>
          <h2 className="text-xl font-black mb-1">{mode === "login" ? "Entrar" : "Criar conta"}</h2>
          <p className="text-sm mb-5" style={{ color: "var(--color-text-muted)" }}>
            {mode === "login" ? "Acesse sua conta" : "Preencha seus dados"}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-xs font-bold animate-shake" style={{ background: "var(--color-error-bg)", color: "var(--color-error)", border: "2px solid var(--color-error)" }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-3">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Nome</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Seu nome" className="input-clean" autoFocus={mode === "register"} />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" className="input-clean" autoFocus={mode === "login"} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Senha</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••" minLength={6} className="input-clean pr-16" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase px-2 py-1 rounded cursor-pointer" style={{ color: "var(--color-text-muted)" }}>
                  {showPass ? "Ocultar" : "Ver"}
                </button>
              </div>
              {mode === "register" && password.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="h-1.5 flex-1 rounded-full transition-all" style={{ background: i < pwStr ? (pwStr >= 3 ? "var(--color-success)" : pwStr >= 2 ? "var(--color-warning)" : "var(--color-error)") : "var(--color-divider)" }} />
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-sm flex items-center justify-center gap-2 mt-2" style={{ borderRadius: "var(--radius)" }}>
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (mode === "login" ? "Entrar ▸" : "Criar conta ▸")}
            </button>
          </form>

          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t" style={{ borderColor: "var(--color-divider)" }}></div>
            <span className="flex-shrink-0 mx-4 text-xs font-bold uppercase" style={{ color: "var(--color-text-muted)" }}>ou</span>
            <div className="flex-grow border-t" style={{ borderColor: "var(--color-divider)" }}></div>
          </div>

          <button 
            type="button" 
            onClick={async () => {
              setLoading(true);
              try {
                await loginWithGoogle();
                // O redirecionamento ocorrerá no useEffect quando onAuthChange disparar
              } catch (e: any) {
                console.error(e);
                setLoading(false);
                if (e.code === "auth/popup-closed-by-user") {
                  setError("Login com Google cancelado.");
                } else {
                  setError("Erro ao entrar com Google.");
                }
              }
            }} 
            disabled={loading} 
            className="w-full btn-secondary py-3 text-sm flex items-center justify-center gap-2 mb-4 cursor-pointer" 
            style={{ borderRadius: "var(--radius)" }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Entrar com Google
              </>
            )}
          </button>

          <div className="mt-2 text-center">
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>
              {mode === "login" ? "Não tem conta?" : "Já tem conta?"}
              <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
                className="ml-1 font-bold underline cursor-pointer" style={{ color: "var(--color-primary)" }}>
                {mode === "login" ? "Cadastre-se" : "Fazer login"}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center mt-4 text-[10px] font-bold" style={{ color: "var(--color-text-muted)" }}>
          Projeto Interdisciplinar · Ensino Fundamental
        </p>
      </div>
    </div>
  );
}
