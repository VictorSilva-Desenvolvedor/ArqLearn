import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCOUNT_COOKIE } from "@/lib/auth/constants";
import { getAccountById } from "@/lib/api/mocks/fixtures/accounts";

// Rotas restritas a professor+admin, e a admin sozinho. Tudo que não está aqui só exige
// qualquer conta logada (aluno/professor/admin).
const TEACHER_OR_ADMIN_PREFIXES = ["/painel", "/revisao"];
const ADMIN_ONLY_PREFIXES = ["/admin"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accountId = request.cookies.get(ACCOUNT_COOKIE)?.value;
  const account = getAccountById(accountId);

  if (pathname === "/login") {
    // Já logado tentando abrir /login de novo — manda direto pra área da própria conta.
    if (account) {
      return NextResponse.redirect(new URL(account.landingPath, request.url));
    }
    return NextResponse.next();
  }

  if (!account) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = account.user.role;

  if (ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && role !== "admin") {
    return NextResponse.redirect(new URL(account.landingPath, request.url));
  }

  if (
    TEACHER_OR_ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix)) &&
    role !== "teacher" &&
    role !== "admin"
  ) {
    return NextResponse.redirect(new URL(account.landingPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|ico|webp)$).*)"],
};
