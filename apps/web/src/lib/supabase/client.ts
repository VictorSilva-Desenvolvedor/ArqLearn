"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "./env";

// Cliente Supabase pro browser — usado pelo AuthContext pra login/logout real e pra ler a
// sessão atual. Guarda a sessão em cookies (não localStorage), pro proxy.ts conseguir ler no
// servidor também (mesmo padrão recomendado pelo @supabase/ssr pro App Router).
export function createClient() {
  const { url, publishableKey } = supabaseEnv();
  return createBrowserClient(url, publishableKey);
}
