import type { UploadSummary } from "@/types/api";

export const mockUploadSummaries: Record<string, UploadSummary> = {
  "upload-nbr15575": {
    upload_id: "upload-nbr15575",
    title: "Sistemas Construtivos",
    synopsis:
      "Visão geral dos sistemas de alvenaria estrutural e de vedação exigidos pela NBR 15575, com foco em modulação e passagem de instalações.",
    key_points: [
      {
        title: "Alvenaria Estrutural vs. Vedação",
        explanation:
          "Na alvenaria estrutural, os blocos recebem e transmitem cargas verticais direto às fundações — não se pode 'furar' a parede livremente. Na alvenaria de vedação, quem estrutura é o pilar/viga, e a parede só fecha o vão.",
      },
      {
        title: "Modulação",
        explanation:
          "O projeto deve seguir a modulação do bloco (geralmente múltiplos de 15cm/20cm) desde a concepção arquitetônica, evitando cortes e ajustes que enfraquecem a parede estrutural.",
      },
      {
        title: "Instalações Embutidas",
        explanation:
          "Em alvenaria estrutural, tubulações elétricas/hidráulicas devem passar por shafts ou blocos hidráulicos previstos em projeto — nunca por rasgos feitos depois de erguida a parede.",
      },
    ],
    architect_tip:
      "Sempre compatibilize a modulação estrutural com o projeto de instalações antes da execução — um rasgo não previsto em alvenaria estrutural pode comprometer a capacidade de carga da parede.",
    generated_at: "2026-07-21T10:00:00Z",
  },
  "upload-planta-baixa": {
    upload_id: "upload-planta-baixa",
    title: "Planta Baixa Residencial",
    synopsis:
      "Leitura de uma planta baixa residencial padrão, com foco em organização de setores (íntimo, social, serviço) e circulação.",
    key_points: [
      {
        title: "Setorização",
        explanation:
          "A planta separa claramente setor social (sala, varanda), íntimo (quartos, banheiros) e de serviço (cozinha, área de serviço), reduzindo cruzamento de fluxos.",
      },
      {
        title: "Circulação",
        explanation:
          "Corredores e halls de distribuição conectam os setores sem obrigar a atravessar ambientes privados para chegar a áreas comuns.",
      },
    ],
    architect_tip:
      "Ao ler uma planta, trace mentalmente o percurso de um visitante até a sala — se ele passar por um quarto no caminho, a setorização provavelmente tem um problema.",
    generated_at: "2026-07-16T14:00:00Z",
  },
};
