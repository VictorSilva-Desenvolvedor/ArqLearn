import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Hanken_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { AnimatedBlueprintBackground } from "@/components/layout/AnimatedBlueprintBackground";
import { LevelUpCelebration } from "@/components/features/gamification/LevelUpCelebration";
import { StreakAtRiskPrompt } from "@/components/features/gamification/StreakAtRiskPrompt";
import { Toast } from "@/components/ui/Toast";
import { ACCOUNT_COOKIE } from "@/lib/auth/constants";
import { THEME_COOKIE } from "@/lib/theme/constants";
import { getServerAccessToken } from "@/lib/supabase/server";
import { getMe } from "@/lib/api/resources/users";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-label",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "ArqLearn",
  description: "Plataforma gamificada de aprendizado de Arquitetura e Urbanismo",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const initialAccountId = cookieStore.get(ACCOUNT_COOKIE)?.value ?? null;
  const initialTopic = cookieStore.get(THEME_COOKIE)?.value ?? null;

  // Busca a sessão real (se existir) aqui, uma vez, pro primeiro render do cliente já vir com
  // `user` preenchido — sem isso, toda sessão real teria uma janela client-side com `user: null`
  // até o useEffect do AuthContext resolver, e useAuth() (usado por TopAppBar e outros) explode
  // nesse meio-tempo achando que é uma rota desprotegida. Conta mockada nunca teve esse problema
  // porque já vinha síncrona via initialAccountId.
  const accessToken = await getServerAccessToken();
  const initialMe = accessToken ? await getMe(accessToken).catch(() => null) : null;

  return (
    <html
      lang="pt-BR"
      className={`${hankenGrotesk.variable} ${inter.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- regra é da Pages Router (_document.js); no App Router o root layout já é o lugar correto para isto */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AnimatedBlueprintBackground />
        <ToastProvider>
          <AuthProvider initialAccountId={initialAccountId} initialMe={initialMe}>
            <ThemeProvider initialTopic={initialTopic}>{children}</ThemeProvider>
            <LevelUpCelebration />
            <StreakAtRiskPrompt />
          </AuthProvider>
          <Toast />
        </ToastProvider>
      </body>
    </html>
  );
}
