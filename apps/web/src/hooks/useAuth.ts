"use client";

import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "@/contexts/AuthContext";
import type { User } from "@/types/api";

// Garante `user` não-nulo pra quem chama — nas rotas protegidas o middleware já garante que
// existe uma conta logada, então tratamos "sem usuário" igual a "fora do <AuthProvider>". A
// tela de login é a única que precisa lidar com user possivelmente nulo — ela usa
// useContext(AuthContext) direto em vez deste hook.
export function useAuth(): AuthContextValue & { user: User } {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  }
  if (!ctx.user) {
    throw new Error("useAuth chamado sem sessão ativa — esta rota deveria estar protegida pelo middleware");
  }
  return ctx as AuthContextValue & { user: User };
}
