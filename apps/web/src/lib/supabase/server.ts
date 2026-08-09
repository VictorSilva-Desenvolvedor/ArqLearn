import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

// Cliente Supabase pro servidor (Server Components, layout raiz) — lê a sessão dos cookies da
// requisição atual. Só leitura aqui (root layout não seta cookie); quem escreve cookie de sessão
// é o cliente browser (login) e o proxy.ts (refresh de token).
export async function createServerSupabaseClient() {
  const { url, publishableKey } = supabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Server Components não podem escrever cookie (Next.js lança se tentar) — refresh de
        // sessão de verdade acontece no proxy.ts, que roda antes e pode escrever.
      },
    },
  });
}

// Usado pelas páginas Server Component (Home/Liga/Perfil) pra repassar o token real da sessão
// pros resources (apiFetch) — ver comentário em lib/api/http.ts sobre por que isso não pode
// depender do provider client-side (setAccessTokenProvider). undefined quando não há sessão real
// (conta mockada de demonstração ou ninguém logado) — os resources caem no modo mock nesse caso.
export async function getServerAccessToken(): Promise<string | undefined> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token;
}
