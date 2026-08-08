# ESTRATÉGIA DE BOOTSTRAP (FASE INICIAL — CUSTO MÍNIMO)
## ArqLearn

Como operar as Fases 0–2 do roadmap (SAD §18) com **5–20 usuários nos primeiros 3 meses**, sem pagar por
capacidade que ninguém vai usar.

Versão 1.0 | Agosto de 2026
Documento complementar ao SAD — não substitui nem contradiz a arquitetura-alvo, só define **como chegar
lá aos poucos, sem custo de infraestrutura antes de haver tração real**.

### Controle de Versão

| Versão | Data | Autor | Descrição |
|---|---|---|---|
| 1.0 | 08/08/2026 | Equipe de Arquitetura | Versão inicial — estratégia de custo mínimo para a fase de validação |
| 1.1 | 08/08/2026 | Equipe de Arquitetura | §4 revista — provedor de IA trocado de Anthropic/Claude para Gemini + Groq (critério "sem cartão", ver `CLAUDE.md`) |
| 1.2 | 08/08/2026 | Equipe de Arquitetura | §4 — remove DeepSeek da divisão: testado ao vivo (`402 Insufficient Balance`) e confirmado pelo usuário que uso real exige cartão, mesmo com o crédito inicial |

---

## 1. Premissa

O SAD (Seções 5–18) descreve a **arquitetura-alvo**: microsserviços orientados a eventos, Kubernetes,
multi-AZ, HPA, service mesh, SLA de 99,9%, picos de 50x. Isso é dimensionado para escala — e escala é
exatamente o que **não existe ainda**. Com 5–20 usuários nos primeiros 3 meses, essa infraestrutura custa
dinheiro real todo mês para servir uma fração do tráfego que uma única instância gratuita já absorve
folgadamente.

Este documento não é uma arquitetura alternativa — é a mesma arquitetura do SAD (mesmos domínios de
serviço descritos em §8, mesmos contratos de API/dados do TDD/Database Design/API Specification), rodando
sobre uma **topologia de implantação mais simples e gratuita**, com gatilhos claros de quando abandonar
cada atalho e seguir o SAD à risca.

**Regra prática:** nenhuma decisão aqui muda schema, contrato de API ou algoritmo de negócio — só *onde*
e *como* o código roda. Se uma escolha deste documento exigir mudar um desses três, ela está fora de
escopo aqui e deve ser proposta como mudança arquitetural normal (ver `CLAUDE.md`, seção correspondente).

> **Nota sobre validade dos valores:** todos os limites de free tier abaixo são os praticados no momento
> da redação (agosto de 2026) e **mudam com frequência** — confirme o limite atual do provedor antes de
> depender dele em produção.

## 2. Princípio central: Monólito Modular primeiro

Implantar os 8 serviços do SAD §8 (`api-gateway`, `users-auth-svc`, `learning-svc`, `gamification-svc`,
`ingestion-svc`, `ai-content-pipeline`, `notifications-svc`, `analytics-svc`) como 8 deployments
separados, cada um com seu próprio pipeline de CI/CD, variáveis de ambiente, dashboard e rede entre
serviços, é overhead operacional puro para 5–20 usuários — sem nenhum benefício de isolamento que
realmente importe nessa escala.

**Recomendação:** um único binário Go (`services/monolith`), organizado internamente pelos mesmos pacotes
de domínio que os futuros serviços (`internal/users`, `internal/learning`, `internal/gamification`,
`internal/ingestion`, `internal/notifications`, `internal/analytics`), comunicando-se por chamada de
função em vez de rede. O AI Content Pipeline continua como processo assíncrono separado (mesmo na Fase
0), pois já nasce desacoplado por fila (SAD §9) — isso não muda.

Por que isso é seguro: como os limites de pacote já seguem os limites de domínio do SAD §8, "quebrar" o
monólito em serviços de verdade mais tarde é extração de pacote para novo deployment, não reescrita. O
contrato de API externo (API Specification) não muda em nenhum momento — quem consome a API nunca sabe se
por trás tem 1 processo ou 8.

## 3. Tabela de substituição por camada

| Camada (SAD §12) | Alvo (escala) | Escolha para 5–20 usuários | Free tier aproximado | Gatilho de graduação |
|---|---|---|---|---|
| Orquestração/compute | Kubernetes (EKS/GKE) | **Google Cloud Run** (ou Fly.io como alternativa) — contêiner Go, escala a zero | Cloud Run: ~2M requisições/mês grátis, permanente | Tráfego sustentado que não escala a zero, ou necessidade real de orquestrar múltiplos serviços com políticas próprias |
| Banco relacional + vetorial | PostgreSQL + pgvector gerenciado | **Supabase** ou **Neon** (Postgres com pgvector no free tier) | ~500MB–3GB de storage grátis, permanente | Storage ou conexões simultâneas no limite do plano gratuito |
| Banco de documentos | MongoDB gerenciado | **MongoDB Atlas M0** | 512MB grátis, permanente | Storage no limite, ou necessidade de sharding |
| Cache | Redis gerenciado | **Upstash Redis** (serverless, pay-per-request) | Free tier cobre folgadamente baixo volume | Custo de request começa a aparecer na fatura |
| Object storage | Amazon S3 | **Cloudflare R2** — free tier com **egress gratuito** (importante para servir vídeo/mídia) | 10GB de storage grátis | Storage acima de 10GB ou volume de download alto |
| Mensageria | Amazon SQS/SNS (já decidido) | **O mesmo** — SQS/SNS já tem free tier permanente generoso (~1M requisições/mês cada) | Já cobre esta fase sem mudança nenhuma | Volume de eventos acima do free tier (improvável nesta fase) |
| API Gateway | Kong / AWS API Gateway (pendente) | Nenhum — expor o monólito direto atrás do HTTPS do Cloud Run | — | Quando o monólito virar múltiplos serviços de verdade (Seção 2) |
| CI/CD | GitHub Actions | **O mesmo** — já gratuito para uso nesta escala | 2.000 min/mês grátis (privado) | Minutos de build/teste excedendo o free tier |
| Observabilidade | OpenTelemetry + Prometheus/Grafana + ELK + Sentry | **Sentry free tier** (erros) + **Grafana Cloud free tier** (métricas/logs básicos) | Sentry: ~5k eventos/mês. Grafana Cloud: free tier cobre poucos serviços | Necessidade de retenção longa ou volume de log alto |
| Mensageria de push/e-mail | — | **Resend** ou **Amazon SES sandbox** (e-mail) + **Expo Push Notifications** (push, grátis) | SES sandbox: 100 e-mails/dia grátis (fora do sandbox: ~62k/mês grátis nos primeiros 12 meses via free tier AWS) | Volume de notificação diária acima do sandbox |

*Tabela 1 — Substituição de camada por opção gratuita e o gatilho para migrar ao alvo do SAD.*

## 4. Pipeline de IA — dividido por tarefa entre dois provedores gratuitos, sem cartão

*(v1.1 — revisão da decisão original desta seção, que previa Anthropic/Claude com custo por token.
Critério fechado com o usuário: excluir qualquer provedor que exija cartão cadastrado pra funcionar —
isso descartou Claude e OpenAI, ver `CLAUDE.md` para os detalhes de cada teste.)*

Ao contrário do que a v1.0 desta seção previa, hoje dá para operar o pipeline de IA **sem custo e sem
cartão** nesta fase, dividindo por tarefa entre dois provedores com tier grátis genuíno:

- **Geração de perguntas** (SAD §9.4) → **Gemini** (Google AI Studio, `GEMINI_API_KEY`) — lê texto/imagem
  nativamente (útil para PDF com foto/diagrama) e tem saída JSON estruturada confiável. Baixo volume
  (lote esporádico), mas é o ativo mais importante do produto — por isso vale usar o modelo com melhor
  compreensão multimodal disponível de graça, mesmo que a chamada em si seja mais lenta.
- **"Explique melhor" / chat sob demanda** (Persona Prompt §5) → **Groq** (`GROQ_API_KEY`) — modelos
  open-weight (Llama 3.3 70B), mas com latência muito menor (~100ms) que importa numa chamada síncrona
  que o usuário está esperando responder. Volume mais alto, exigência de qualidade menor (é reforço
  ancorado no material já mostrado, não geração do zero).
- **DeepSeek foi avaliado e descartado** *(v1.2)* — na prática, a chave autenticava mas toda chamada de
  geração retornava `402 Insufficient Balance`; o usuário confirmou no dashboard do DeepSeek que uso real
  exige cartão cadastrado, mesmo com o crédito inicial anunciado. Não usar de novo sem revisitar essa
  decisão.
- **Custo real da divisão em dois provedores:** dois SDKs, dois system prompts pra calibrar (o mesmo
  texto não rende igual em modelo diferente), duas chaves/dashboard de billing — aceitável aqui porque os
  dois perfis de uso (baixo volume/alta exigência vs. alto volume/latência crítica) são genuinely
  diferentes, não é separação só por separar.
- **OCR**: começar com **Tesseract** (open source, self-hosted, roda no mesmo processo/contêiner do
  monólito) em vez de uma API de OCR paga. Qualidade inferior a uma API comercial, mas suficiente para
  validar o produto com poucos uploads.
- **Speech-to-Text**: começar com **Whisper** (modelo open source, self-hosted em CPU) para os vídeos de
  aula. Mais lento que uma API gerenciada, mas sem custo por minuto — aceitável no volume desta fase
  (poucos uploads de vídeo por semana).
- **Orçamento sugerido**: definir um teto mensal de gasto em API de LLM (ex.: alarme de billing) desde o
  primeiro dia, mesmo sendo um valor baixo — hábito de FinOps que o SAD já pede em escala (§4.2, "Custo
  de IA") e que custa nada implementar cedo.

## 5. Apps mobile/web — testar sem pagar taxa de loja

- **React Native via Expo** (Expo Go / EAS Build free tier) para rodar nos aparelhos dos 5–20 usuários
  sem precisar publicar nas lojas.
- **Android**: distribuir APK diretamente ou usar a faixa de "Teste interno" do Google Play Console (taxa
  única de US$25 — a única cobrança de loja necessária nesta fase, e só se quiser passar pelo Play Store
  em vez de instalar o APK manualmente).
- **iOS**: TestFlight exige conta Apple Developer Program (US$99/ano) — **não é gratuito e não tem
  alternativa real** para distribuir a usuários iOS fora de dispositivo próprio de desenvolvimento. Se o
  público inicial dos 5–20 usuários puder ser majoritariamente Android, adiar o custo da Apple até
  validar o produto é uma escolha legítima; documentar essa decisão quando tomada.
- **Web**: hospedagem do Next.js em **Vercel free tier** (ou Cloudflare Pages) — cobre esta fase sem
  custo.

## 6. O que realmente não é gratuito (honestidade acima de otimismo)

| Item | Custo aproximado | Dá para adiar? |
|---|---|---|
| Domínio (`arqlearn.com` ou similar) | ~US$10–15/ano | Não recomendado adiar — necessário para e-mail transacional confiável e para a própria credibilidade do produto |
| Apple Developer Program | US$99/ano | Sim, se o público inicial não incluir usuários iOS |
| Uso de API de LLM (Anthropic) | Variável, por token | Não — é o motor do produto; mitigar com escolha de modelo (Seção 4), não eliminar |
| Google Play Console | US$25 (taxa única) | Sim, usando distribuição de APK direto no lugar da loja |

*Tabela 2 — Custos inevitáveis ou de baixo valor, para não prometer "100% grátis" de forma irreal.*

## 7. Gatilhos de graduação (quando voltar a seguir o SAD à risca)

Não é uma data — é a primeira condição abaixo que acontecer:

- Qualquer free tier da Tabela 1 estourado de forma sustentada (não um pico isolado).
- Usuários ativos ultrapassando a ordem de centenas (muito acima da faixa de 5–20 desta fase).
- Necessidade real de escalar um domínio (ex.: geração de conteúdo) independente dos demais — o motivo
  original para microsserviços no SAD §5.2.
- Entrada de mais de 1–2 pessoas no time de engenharia, quando limites de propriedade de código passam a
  importar mais do que economia de infraestrutura.

Ao cruzar qualquer um desses pontos, seguir o roadmap do SAD §18 normalmente (Fase 3 em diante já assume
uma base de usuários maior) — a extração de serviços a partir do monólito modular (Seção 2) é o primeiro
passo dessa transição, não uma reescrita.

— Fim do documento —
