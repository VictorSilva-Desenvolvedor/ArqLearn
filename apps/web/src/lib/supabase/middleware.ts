import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "./env";

// Padrão oficial do @supabase/ssr pra Proxy (ver node_modules/next/dist/docs — Middleware virou
// Proxy no Next.js 16, a lib ainda chama de "middleware" no nome do pacote/exemplos, mas a ideia
// é a mesma): refresca o token expirado ANTES de qualquer handler rodar, reescrevendo o cookie
// tanto na request (pro resto desta execução) quanto na response (pro browser).
export async function refreshSupabaseSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const { url, publishableKey } = supabaseEnv();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser() (não getSession()) porque valida o token contra o servidor Supabase — getSession()
  // só lê o cookie local, que pode estar adulterado; é a checagem "otimista" recomendada pro
  // Proxy (Docs Next.js "Authorization" — não faz query no nosso próprio banco aqui, só valida o
  // JWT com o Supabase, que é rápido o bastante pra rodar em toda rota).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}
