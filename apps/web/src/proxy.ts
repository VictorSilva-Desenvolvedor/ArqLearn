import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCOUNT_COOKIE } from "@/lib/auth/constants";
import { getAccountById } from "@/lib/api/mocks/fixtures/accounts";
import { refreshSupabaseSession } from "@/lib/supabase/middleware";

// Dois jeitos de estar "logado" nesta fase: sessão real do Supabase Auth (Maria, Marina, Admin —
// ver Docs/CLAUDE.md) ou a conta mockada de demonstração (fallback pra quem ainda não tem conta
// real). Proxy só faz a checagem OTIMISTA de autenticação (existe sessão?) — não decide papel
// aqui. O papel (`users.role`, Postgres) exige ida ao banco pra sessão real, e a documentação do
// Next.js é explícita: isso não deve rodar no Proxy (roda em toda rota, inclusive prefetch) — vai
// no Data Access Layer de cada página/layout protegido (ver app/(teacher)/layout.tsx e
// app/admin/layout.tsx, que chamam GET /v1/users/me e redirecionam se o papel não bater).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const { supabaseResponse, user: realUser } = await refreshSupabaseSession(request);
  const accountId = request.cookies.get(ACCOUNT_COOKIE)?.value;
  const mockAccount = getAccountById(accountId);

  const isAuthenticated = Boolean(realUser) || Boolean(mockAccount);

  if (pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(mockAccount?.landingPath ?? "/", request.url));
    }
    return supabaseResponse;
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|ico|webp)$).*)"],
};
