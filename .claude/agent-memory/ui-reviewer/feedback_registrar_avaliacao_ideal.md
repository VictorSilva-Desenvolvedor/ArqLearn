---
name: registrar-avaliacao-ideal
description: Toda tela auditada precisa de um julgamento explícito de "o que seria ideal", registrado no log — não só a lista de bugs encontrados
metadata:
  type: feedback
---

Em cada tela revisada, além dos defeitos, escrever explicitamente se ela **poderia ser mais
polida/clara/agradável** mesmo sem bug evidente — e registrar esse julgamento tanto na tabela do
relatório final quanto em `Docs/UI_AUDIT_STATUS.md`. Quando a conclusão for "já está no ideal, nada
a fazer", isso também tem que ficar escrito.

**Why:** pedido explícito do usuário na rodada 1 da varredura completa do catálogo (25/08/2026). A
preocupação dele é que uma auditoria que só caça bug óbvio e roda suíte automatizada deixa passar
tela "sem defeito e sem graça" — e, pior, esse julgamento se perde entre rodadas se não for gravado,
fazendo a próxima varredura reavaliar do zero.

**How to apply:** vale em modo varredura e em modo demanda. Inclui também justificar divergências
conscientes da referência do Stitch (por que manter) em vez de omiti-las — uma divergência não
mencionada é indistinguível de uma não vista.

Relacionado: [[como-renderizar-home-autenticada]], [[armadilhas-ambiente-varredura-ui]]
