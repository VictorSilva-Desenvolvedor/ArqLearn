import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "@/contexts/AuthContext";
import type { User } from "@/types/api";

// Garante `user` não-nulo pra quem chama — nas rotas protegidas o guard de _layout.tsx já
// garante que existe uma sessão ativa antes de renderizar as telas internas, então tratamos
// "sem usuário" igual a "fora do <AuthProvider>". A tela de login é a única que precisa lidar
// com user possivelmente nulo — ela usa useContext(AuthContext) direto em vez deste hook.
export function useAuth(): AuthContextValue & { user: User } {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  }
  if (!ctx.user) {
    throw new Error("useAuth chamado sem sessão ativa — esta rota deveria estar protegida pelo guard de layout");
  }
  return ctx as AuthContextValue & { user: User };
}
