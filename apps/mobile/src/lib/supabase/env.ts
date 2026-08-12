// URL/chave do mesmo projeto Supabase usado por services/monolith e apps/web — ver .env.local
// (EXPO_PUBLIC_SUPABASE_URL/EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, nunca commitado).
export function supabaseEnv() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      "EXPO_PUBLIC_SUPABASE_URL/EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ausentes — ver apps/mobile/.env.local",
    );
  }
  return { url, publishableKey };
}
