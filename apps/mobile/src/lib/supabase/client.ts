import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as aesjs from "aes-js";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { createClient, type SupportedStorage } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

// expo-secure-store tem limite de ~2048 bytes por valor (Keychain/Keystore) — pequeno demais
// pra guardar a sessão inteira da Supabase (access_token + refresh_token + metadata do
// usuário). Padrão oficial recomendado pela Supabase pro Expo: a sessão em si vai criptografada
// pro AsyncStorage (sem limite de tamanho), e só a chave de criptografia (32 bytes) fica no
// SecureStore — mesma ideia de "cookie httpOnly" do web, adaptada pro RN. Ver
// https://supabase.com/docs/guides/auth/quickstarts/react-native.
class LargeSecureStore implements SupportedStorage {
  private async encrypt(key: string, value: string): Promise<string> {
    const encryptionKey = Crypto.getRandomBytes(32);
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(encryptionKey));
    return aesjs.utils.hex.fromBytes(encryptedBytes);
  }

  private async decrypt(key: string, value: string): Promise<string | null> {
    const encryptionKeyHex = await SecureStore.getItemAsync(key);
    if (!encryptionKeyHex) return null;
    const cipher = new aesjs.ModeOfOperation.ctr(aesjs.utils.hex.toBytes(encryptionKeyHex), new aesjs.Counter(1));
    const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(value));
    return aesjs.utils.utf8.fromBytes(decryptedBytes);
  }

  async getItem(key: string): Promise<string | null> {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;
    return this.decrypt(key, encrypted);
  }

  async setItem(key: string, value: string): Promise<void> {
    const encrypted = await this.encrypt(key, value);
    await AsyncStorage.setItem(key, encrypted);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  }
}

let cachedClient: ReturnType<typeof createClient> | null = null;

// Client único reaproveitado entre chamadas — diferente do web (createBrowserClient também é
// singleton-ish por closure de módulo, mas aqui evitamos recriar o storage/listeners a cada
// import). autoRefreshToken/persistSession: true porque não há proxy/middleware server-side
// renovando o token por fora; detectSessionInUrl: false porque não existe deep-link de callback
// OAuth nesta fase (só e-mail/senha).
export function createSupabaseClient() {
  if (cachedClient) return cachedClient;
  const { url, publishableKey } = supabaseEnv();
  cachedClient = createClient(url, publishableKey, {
    auth: {
      storage: new LargeSecureStore(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return cachedClient;
}
