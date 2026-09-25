import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-main",
});

export const metadata: Metadata = {
  title: "Saberes em Conexão — Plataforma Interativa de Matemática",
  description: "Plataforma educacional interativa de matemática para alunos do 6º ao 9º ano do Ensino Fundamental. Videoaulas, quizzes e gamificação.",
  keywords: ["matemática", "educação", "quiz", "ensino fundamental", "gamificação"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
