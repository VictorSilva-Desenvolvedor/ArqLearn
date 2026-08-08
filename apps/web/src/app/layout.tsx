import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Hanken_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { ACCOUNT_COOKIE } from "@/lib/auth/constants";
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
        <AuthProvider initialAccountId={initialAccountId}>{children}</AuthProvider>
      </body>
    </html>
  );
}
