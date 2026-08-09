import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCOUNT_COOKIE } from "@/lib/auth/constants";
import { getAccountById } from "@/lib/api/mocks/fixtures/accounts";
import { refreshSupabaseSession } from "@/lib/supabase/middleware";

// Rotas restritas a professor+admin, e a admin sozinho. Tudo que não está aqui só exige
// qualquer sessão logada (real ou conta mockada de demonstração).
const TEACHER_OR_ADMIN_PREFIXES = ["/painel", "/revisao"];
const ADMIN_ONLY_PREFIXES = ["/admin"];

// Dois jeitos de estar "logado" nesta fase: sessão real do Supabase Auth (ex.: Maria, aluna) ou
// a conta mockada de demonstração (professor/admin — sem conta real ainda, ver
// Docs/CLAUDE.md). O papel (role) só existe de verdade em `users.role` (Postgres), que o Proxy
// não consulta (Next.js recomenda só checagem otimista aqui, sem ida ao banco) — então rotas
// restritas a professor/admin só reconhecem o papel vindo da conta mockada; uma sessão real
// tentando acessar `/painel`/`/admin` cai no landingPath padrão (aluno), nunca é liberada.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const { supabaseResponse, user: realUser } = await refreshSupabaseSession(request);
  const accountId = request.cookies.get(ACCOUNT_COOKIE)?.value;
  const mockAccount = getAccountById(accountId);

  const isAuthenticated = Boolean(realUser) || Boolean(mockAccount);
  const landingPath = mockAccount?.landingPath ?? "/";

  if (pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(landingPath, request.url));
    }
    return supabaseResponse;
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = mockAccount?.user.role ?? null;

  if (ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && role !== "admin") {
    return NextResponse.redirect(new URL(landingPath, request.url));
  }

  if (
    TEACHER_OR_ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix)) &&
    role !== "teacher" &&
    role !== "admin"
  ) {
    return NextResponse.redirect(new URL(landingPath, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|ico|webp)$).*)"],
};
