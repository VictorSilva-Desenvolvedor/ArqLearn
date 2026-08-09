// Package pdfextract extrai texto de PDFs baseados em texto (não escaneados/imagem — sem OCR,
// ver Docs do plano de ingestão real: os PDFs de estudo usados até agora são todos texto puro,
// OCR fica pra quando um PDF escaneado aparecer de verdade). Usa
// github.com/ledongthuc/pdf (pure Go, sem dependência de binário externo tipo poppler/pdftotext).
//
// Limitação conhecida (confirmada testando ao vivo contra um PDF real de Maquetes): títulos/capas
// que usam uma fonte customizada embutida às vezes saem com o mapeamento de glifo errado (texto
// ilegível), enquanto o corpo do texto (fonte padrão) extrai corretamente. O corpo é a parte que
// carrega o conteúdo de verdade pra geração de pergunta, então isso não bloqueia o uso — revisitar
// com outra biblioteca só se aparecer um PDF cujas páginas inteiras usem fonte customizada.
package pdfextract

import (
	"bytes"
	"fmt"
	"strings"

	"github.com/ledongthuc/pdf"
)

// Page é uma página extraída — 1 página = 1 chunk no estágio de RAG (internal/pgstore), mesmo
// grão já usado manualmente com cmd/generate-questions desde o início do projeto.
type Page struct {
	Number int
	Text   string
}

// ErrNoExtractableText sinaliza um PDF sem texto extraível (provável scan/imagem) — chamador
// deve tratar isso como "ingestão não suportada ainda", não como bug (ver guardrail do Persona
// Prompt §9, "não force a geração" quando o conteúdo é insuficiente).
var ErrNoExtractableText = fmt.Errorf("pdfextract: nenhum texto extraível encontrado (PDF pode ser digitalizado/imagem — OCR não suportado nesta fase)")

// ExtractPages lê um PDF inteiro (bytes, já baixado do object storage) e devolve o texto de
// cada página não-vazia. Páginas em branco/decorativas (capa, sumário sem texto real) são
// simplesmente omitidas do resultado.
func ExtractPages(data []byte) ([]Page, error) {
	reader, err := pdf.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return nil, fmt.Errorf("pdfextract: falha ao abrir PDF: %w", err)
	}

	var pages []Page
	for i := 1; i <= reader.NumPage(); i++ {
		p := reader.Page(i)
		if p.V.IsNull() {
			continue
		}
		text, err := p.GetPlainText(nil)
		if err != nil {
			return nil, fmt.Errorf("pdfextract: falha ao extrair página %d: %w", i, err)
		}
		text = strings.TrimSpace(text)
		if text == "" {
			continue
		}
		pages = append(pages, Page{Number: i, Text: text})
	}

	if len(pages) == 0 {
		return nil, ErrNoExtractableText
	}
	return pages, nil
}
