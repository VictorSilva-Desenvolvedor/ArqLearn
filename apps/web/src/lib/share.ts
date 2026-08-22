// Compartilhamento de conquista/recorde pessoal (ponto 1 do redesign de 2023 do Duolingo — dar
// pra compartilhar, não só acumular) — 100% cliente, sem endpoint novo: o texto é montado a partir
// de dados que o catálogo (achievementCatalog.ts/personalRecordCatalog.ts) já tem.
export interface ShareContent {
  title: string;
  text: string;
}

// shareOrCopy tenta a Web Share API nativa (comum em mobile — abre o menu de compartilhar do SO);
// quando ela não existe (a maioria dos desktops) ou o usuário cancela, cai pra copiar o texto pra
// área de transferência. onCopied só é chamado no caminho de fallback bem-sucedido — quem chama
// decide como avisar o usuário (ex.: useToast()), pra este módulo não depender de UI.
export async function shareOrCopy(content: ShareContent, onCopied: () => void): Promise<void> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(content);
      return;
    } catch (err) {
      // AbortError: usuário cancelou o menu de compartilhar — decisão dele, não cai pro fallback.
      if (err instanceof DOMException && err.name === "AbortError") return;
      // Qualquer outro erro (ex.: navegador anuncia navigator.share mas rejeita em contexto não
      // seguro): cai pro fallback de clipboard abaixo em vez de propagar.
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(`${content.title}\n\n${content.text}`);
    onCopied();
  }
}
