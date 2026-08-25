---
name: mocks-com-data-congelada
description: Fixtures de mock com data literal (ex. week_reference "2026-W32") fazem toda UI dependente de tempo nascer num estado-limite errado — e só a recaptura pós-correção revela isso
metadata:
  type: project
---

Os fixtures de mock deste projeto guardam datas como string literal. `mockLeague.week_reference`
era `"2026-W32"` — congelado três semanas no passado, então a contagem regressiva da Liga
renderizava `"0m"` em toda demonstração. Corrigido em 25/08/2026 (rodada 3) para derivar da semana
ISO corrente, mas **o padrão provavelmente se repete em outros fixtures** — conferir antes de
julgar qualquer tela com contagem regressiva, "expira em", streak ou prazo.

Dois aprendizados que valem além deste caso:

1. **Trocar um valor hardcoded por um cálculo real expõe o estado-limite que ninguém desenhou.**
   Ao substituir o `"2d 14h 32m"` literal do web pela contagem real, apareceu que *nenhum dos dois
   apps* tinha estado para "ciclo já encerrado". O defeito era latente no mobile desde 18/08/2026 e
   nunca tinha sido visto — porque não há screenshot possível no mobile (pendência #1). Sempre
   perguntar "e quando esse número chegar a zero?" ao ligar um contador de verdade.
2. **A recaptura do Passo 6 não é formalidade.** Neste caso ela achou dois defeitos que a inspeção
   inicial não tinha como achar, porque só existiam *depois* da correção (o "0m", e o rótulo do
   rodapé de revisão quebrando em duas linhas ao ficar finalmente visível).

**Why:** a rodada 3 quase fechou a tela da Liga como "corrigida" com base no código e no `tsc`
limpo; o screenshot pós-correção é que mostrou `0m` na tela.

**How to apply:** nunca declarar corrigida uma tela com tempo/contador sem recapturar a imagem, e
desconfiar de qualquer data literal em `lib/api/mocks/fixtures/`.

Relacionado: [[armadilhas-ambiente-varredura-ui]], [[registrar-avaliacao-ideal]]
