package questiongen

import "embed"

//go:embed all:sourcetext
var sourceTextFS embed.FS

// generationTopics lista os tópicos com texto-fonte real embutido (único requisito pra Modo
// Infinito gerar lotes novos dinamicamente — ver internal/learning/infinitemode_generation.go).
// Cada um tem uma subpasta sourcetext/<topic>/unidade{1..4}.txt com excertos reais das apostilas
// (Docs/DocsFaculdade, git-ignorado — só o recorte já lido/conferido é commitado aqui, decisão
// consciente do usuário de manter o mesmo padrão já usado pra "maquetes", 08/2026).
var generationTopics = map[string]bool{
	"maquetes":                         true,
	"construcoes_sustentaveis":         true,
	"desenho_arquitetura_urbanismo":    true,
	"projeto_arquitetura_cultural":     true,
	"informatica_projecoes_ortogonais": true,
}

// HasSourceText reporta se topic tem texto-fonte real embutido — é essa checagem que decide se um
// tópico participa da geração dinâmica do Modo Infinito ou fica só no pool fixo (Docs/PENDENCIAS_IA.md
// #7: gerar "do conhecimento geral" pros demais violaria a regra de nunca inventar sem lastro).
func HasSourceText(topic string) bool {
	return generationTopics[topic]
}

// SourceTextForUnit devolve o texto-fonte de topic pra unitNumber (1-4) — ok == false quando o
// tópico não tem texto-fonte embutido ou unitNumber está fora do intervalo suportado.
func SourceTextForUnit(topic string, unitNumber int) (text string, ok bool) {
	if !HasSourceText(topic) || unitNumber < 1 || unitNumber > 4 {
		return "", false
	}
	b, err := sourceTextFS.ReadFile(sourceTextPath(topic, unitNumber))
	if err != nil {
		return "", false
	}
	return string(b), true
}

func sourceTextPath(topic string, unitNumber int) string {
	names := map[int]string{1: "unidade1.txt", 2: "unidade2.txt", 3: "unidade3.txt", 4: "unidade4.txt"}
	return "sourcetext/" + topic + "/" + names[unitNumber]
}
