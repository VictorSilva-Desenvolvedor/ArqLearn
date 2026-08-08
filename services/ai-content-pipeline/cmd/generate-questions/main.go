// Command generate-questions chama internal/geminiclient diretamente com um texto-fonte solto,
// fora do fluxo de evento content.uploaded (que depende dos estágios 1-3, ainda stub — ver
// internal/pipeline/pipeline.go). Uso enquanto a extração/RAG reais não existem: cola aqui o
// texto de uma página já extraída manualmente e gera perguntas de verdade pra revisão.
//
// Uso: GEMINI_API_KEY=... go run ./cmd/generate-questions -text=pagina.txt -page=7 -count=5
package main

import (
	"context"
	"encoding/json"
	"flag"
	"log"
	"os"

	"arqlearn/ai-content-pipeline/internal/geminiclient"
)

func main() {
	textPath := flag.String("text", "", "caminho do arquivo de texto-fonte (obrigatório)")
	page := flag.Int("page", 1, "número da página de origem, ecoado em source_page")
	count := flag.Int("count", 5, "quantidade de perguntas a gerar")
	flag.Parse()

	if *textPath == "" {
		log.Fatal("uso: generate-questions -text=arquivo.txt -page=N -count=N")
	}

	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Fatal("GEMINI_API_KEY não configurada no ambiente")
	}

	textBytes, err := os.ReadFile(*textPath)
	if err != nil {
		log.Fatalf("falha ao ler %s: %v", *textPath, err)
	}

	client := geminiclient.New(apiKey)
	questions, err := client.GenerateQuestions(context.Background(), string(textBytes), *page, *count)
	if err != nil {
		log.Fatalf("falha ao gerar perguntas: %v", err)
	}

	valid := make([]geminiclient.GeneratedQuestion, 0, len(questions))
	for i, q := range questions {
		if err := geminiclient.Validate(q); err != nil {
			log.Printf("AVISO: pergunta %d/%d reprovada na validação, descartada — %v", i+1, len(questions), err)
			continue
		}
		valid = append(valid, q)
	}
	log.Printf("%d/%d perguntas passaram na validação estrutural (ver SAD §9.5)", len(valid), len(questions))

	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	if err := enc.Encode(valid); err != nil {
		log.Fatalf("falha ao serializar saída: %v", err)
	}
}
