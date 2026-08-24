import { Share } from "react-native";
import type { AchievementCatalogEntry } from "./gamification/achievementCatalog";
import type { PersonalRecordCatalogEntry } from "./gamification/personalRecordCatalog";

// Compartilhamento de conquista/recorde pessoal (ponto 1 do redesign de 2023 do Duolingo — dar
// pra compartilhar, não só acumular) — 100% cliente, sem endpoint novo. Usa o `Share` built-in do
// react-native (abre o menu nativo do SO), não `expo-sharing` (esse é pra arquivo/imagem, não
// texto — já usado em perfil/configuracoes.tsx pra exportação LGPD, propósito diferente deste).
// Sem fallback de clipboard: diferente da Web Share API, o Share nativo está sempre disponível
// nas duas plataformas, não precisa de detecção de suporte.
async function share(title: string, message: string): Promise<void> {
  try {
    await Share.share({ title, message });
  } catch {
    // Falha genuína (raro) — usuário só não vê o menu abrir; não há uma ação de recuperação
    // melhor que valha a complexidade de mais um estado de erro pra isso.
  }
}

export function shareAchievement(entry: AchievementCatalogEntry, onShared?: () => void): void {
  share(entry.title, `🏛️ Desbloqueei "${entry.title}" no ArqLearn! ${entry.description}`).then(onShared);
}

export function shareRecordEntry(entry: PersonalRecordCatalogEntry, valueLabel: string, onShared?: () => void): void {
  share(entry.title, `🏛️ ${entry.title}: ${valueLabel} — meu recorde pessoal no ArqLearn!`).then(onShared);
}
