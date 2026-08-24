---
name: como-renderizar-home-autenticada
description: Único jeito hoje de ver uma tela autenticada do apps/web localmente para auditoria visual (conta demo por cookie + mocks), e por que o mobile não tem equivalente
metadata:
  type: project
---

Para auditar visualmente qualquer tela dentro de `(shell)` no `apps/web` sem credencial real:
injetar o cookie `arqlearn_mock_account=student-alex` no contexto do Playwright **e** esvaziar
temporariamente `NEXT_PUBLIC_API_REAL_RESOURCES` em `apps/web/.env.local` (fazer backup e
restaurar antes de terminar — nunca deixar commitado).

Sem esvaziar essa var, a conta demo renderiza o error boundary ("Algo deu errado"): os server
components chamam a API real com token nulo e recebem `ApiError: Token ausente ou mal formatado`.

`apps/mobile` **não tem equivalente** — `AuthContext` só aceita sessão real do Supabase Auth, sem
modo demonstração. Auditoria visual de tela autenticada no mobile fica bloqueada até existir uma
credencial de teste; ver `Docs/UI_AUDIT_STATUS.md` §1.

**Why:** descoberto na varredura da tela Home (24/08/2026), depois de perder tempo tentando achar
credencial de teste versionada (não existe — a senha de `maria.aluna@arqlearn.test` foi passada
verbalmente pelo usuário numa sessão antiga e nunca guardada).

**How to apply:** toda execução em modo varredura de uma tela autenticada começa por aqui, em vez
de tentar login real ou assumir que a rota renderiza sem sessão.

Relacionado: [[armadilhas-ambiente-varredura-ui]]
