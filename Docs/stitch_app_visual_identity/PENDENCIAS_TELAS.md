# Status da Identidade Visual — Telas

> **Atualização:** as 9 telas que faltavam foram geradas usando os prompts de
> `PROMPTS_TELAS_PENDENTES.md` — **a identidade visual está completa** (13 telas do mapa original do
> `arqlearn_stitch_ui_spec.md` + 3 telas fora do mapa original, já formalizadas como escopo V1). Este
> arquivo fica como registro; `PROMPTS_TELAS_PENDENTES.md` pode ser consultado no futuro caso alguma tela
> precise ser regenerada (ex.: mudança de marca) — os prompts continuam válidos.

## Resumo

| Tela (spec original, §5) | Status | Referência |
|---|---|---|
| A. Home — Mapa de Aprendizado | ✅ Concluída | `home_mapa_de_aprendizado/` |
| B. Sessão de Lição — Quiz | ✅ Concluída | `sess_o_de_li_o_quiz/` |
| C. Resumo da Lição | ✅ Concluída | `resumo_da_li_o/` |
| D. Conquista (Achievement) | ✅ Concluída | `conquista_desbloqueada/` |
| E. Sem Vidas (No Hearts) | ✅ Concluída | `sem_vidas/` |
| F. Explorar | ✅ Concluída (fundida com G) | `explorar_trilhas_e_upload/` |
| G. Upload de Material | ✅ Concluída (fundida com F) | `explorar_trilhas_e_upload/` |
| H. Revisão de Perguntas | ✅ Concluída | `revis_o_de_perguntas/` |
| I. Liga | ✅ Concluída | `liga_semanal/` |
| J. Perfil | ✅ Concluída | `perfil/` |
| K. Loja | ✅ Concluída | `loja/` |
| L. Notificações | ✅ Concluída | `notifica_es/` |
| M. Painel do Professor (web) | ✅ Concluída | `painel_do_professor/` |
| *(fora do mapa original)* Modo Infinito | ✅ Concluída | `modo_infinito_desafio_estrutural/` |
| *(fora do mapa original)* Resumo do Modo Infinito | ✅ Concluída | `resumo_modo_infinito/` |
| *(fora do mapa original)* Resumo Inteligente | ✅ Concluída | `resumo_simplificado_sistemas_construtivos/` |
| *(fora do mapa original)* Chat sobre Material | ✅ Concluída | `explica_o_e_perguntas_do_material/` |

**17 de 17 telas concluídas** (contando F+G como uma só tela gerada, fundidas por design).

## Próximo passo natural

Com a identidade visual fechada, o próximo passo deixa de ser design e passa a ser **implementação**:
extrair os tokens já usados nas 17 telas (`blueprint_narrative/DESIGN.md`) para o design system real do
app (`/apps/web`, `/apps/mobile`) conforme a estrutura definida em `CLAUDE.md`, e usar cada `code.html`
como referência de layout ao construir os componentes de produção — não copiar o HTML estático direto
(ele foi feito para preview, não para rodar em React/React Native).
