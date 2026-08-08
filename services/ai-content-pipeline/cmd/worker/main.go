// Command worker consome eventos content.uploaded (TDD §7.1) da fila e executa o
// AI Content Pipeline (SAD §9). Continua como processo separado do monólito mesmo
// na fase bootstrap — já nasce desacoplado por fila (ver Docs/CLAUDE.md, "Estrutura
// de repositório esperada").
package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"arqlearn/ai-content-pipeline/internal/pipeline"
)

func main() {
	log.Println("ai-content-pipeline worker iniciado")

	// TODO: substituir por uma goroutine de polling real da fila SQS (ver
	// Docs/ArqLearn_Estrategia_Bootstrap.md §3 — mensageria já roda em Amazon SQS/SNS
	// desde a fase bootstrap, sem equivalente a trocar depois).
	//
	// Exemplo do formato esperado de cada mensagem, uma vez decodificada:
	_ = pipeline.ContentUploaded{}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
	log.Println("ai-content-pipeline worker encerrando")
}
