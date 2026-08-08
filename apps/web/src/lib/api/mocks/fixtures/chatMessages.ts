import type { ChatMessage } from "@/types/api";

export const mockChatHistory: Record<string, ChatMessage[]> = {
  "upload-nbr15575": [
    {
      message_id: "chat-seed-1",
      role: "user",
      message: "Qual a diferença entre concreto e aço para vedação nesse sistema?",
      created_at: "2026-07-22T09:00:00Z",
    },
    {
      message_id: "chat-seed-2",
      role: "assistant",
      message:
        "O concreto tem ótima resistência à compressão mas baixa à tração, exigindo armadura de aço nos pontos tracionados. O aço estrutural resiste bem a ambos, mas tem custo e manutenção contra corrosão maiores. No sistema descrito no documento, a alvenaria estrutural resolve a compressão com os blocos, e o aço aparece só como armadura de reforço nas vergas e contravergas.",
      created_at: "2026-07-22T09:00:05Z",
    },
  ],
};

// Respostas "canned" por palavra-chave — simula uma resposta RAG ancorada no documento sem
// depender de um LLM real nesta fase mockada.
export function mockChatAnswerFor(message: string): { answer: string; source_excerpt: string } {
  const lower = message.toLowerCase();

  if (lower.includes("modula") ) {
    return {
      answer:
        "A modulação define a malha dimensional (normalmente múltiplos de 15cm ou 20cm, conforme o bloco adotado) que orienta todo o projeto arquitetônico — paredes, vãos de porta/janela e posição de shafts já nascem alinhados a essa malha, evitando cortes de bloco em obra.",
      source_excerpt:
        "\"Trecho do Documento — Capítulo 4.2\": \"A modulação deve ser respeitada desde o estudo preliminar, evitando ajustes dimensionais durante a execução da alvenaria estrutural.\"",
    };
  }

  if (lower.includes("instala") || lower.includes("tubula") || lower.includes("elétric") || lower.includes("hidráulic")) {
    return {
      answer:
        "Em alvenaria estrutural, instalações elétricas e hidráulicas devem passar por blocos hidráulicos ou shafts já previstos em projeto — abrir rasgos depois de erguida a parede compromete a capacidade de carga.",
      source_excerpt:
        "\"Trecho do Documento — Capítulo 4.2\": \"Tubulações não previstas em projeto não devem ser embutidas em paredes estruturais sem análise do engenheiro responsável.\"",
    };
  }

  return {
    answer:
      "Com base no material enviado, a alvenaria estrutural transmite cargas verticais diretamente aos blocos e fundações, diferente da alvenaria de vedação, que apenas fecha vãos definidos pela estrutura de pilares e vigas.",
    source_excerpt:
      "\"Trecho do Documento — Capítulo 4.2\": \"Na alvenaria estrutural, os blocos participam do sistema de contraventamento e resistência às cargas verticais e horizontais da edificação.\"",
  };
}
