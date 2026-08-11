# Build multi-stage — imagem final não carrega toolchain Go nem código-fonte, só o binário
# estático. Alvo: Fly.io (Docs/ArqLearn_Estrategia_Bootstrap.md §3/§8) — mesma imagem funciona em
# qualquer runtime de contêiner (Cloud Run, etc.) sem alteração, já que lê PORT do ambiente
# (cmd/server/main.go) em vez de expor uma porta fixa.

FROM golang:1.26-alpine AS builder
WORKDIR /src

# Copia só os manifestos primeiro — cache de camada do Docker não invalida em toda mudança de
# código, só quando as dependências mudam.
COPY go.mod go.sum ./
RUN go mod download

COPY . .
# CGO_ENABLED=0: binário estático, roda sem libc na imagem final (distroless/alpine mínimo).
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/server ./cmd/server

FROM alpine:3.20
# ca-certificates: exigido pelas chamadas HTTPS de saída (Supabase, MongoDB Atlas, Gemini, Groq,
# R2) — sem isso toda requisição TLS de saída falha por CA desconhecida.
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /out/server ./server
COPY migrations ./migrations

# Não roda como root — nem toolchain de build nem privilégio nenhum são necessários em runtime.
RUN adduser -D -u 1000 appuser
USER appuser

# Cloud Run/Fly.io injetam $PORT — main.go já lê isso com fallback 8080 (ver
# Docs/ArqLearn_Estrategia_Bootstrap.md §8), então nenhuma porta fixa é declarada aqui.
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["./server"]
