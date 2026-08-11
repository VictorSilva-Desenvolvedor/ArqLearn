package questiongen

import "embed"

//go:embed sourcetext/*.txt
var sourceTextFS embed.FS

// SourceTextForUnit devolve o texto-fonte (excertos reais dos PDFs de Maquetes, Docs/ignorar/)
// pra unitNumber (1-4) — mesmo corpus já usado pra gerar as ~163 perguntas curadas de
// track_s02_maquetes nesta sessão. Não é o PDF inteiro, é um recorte já lido/conferido; ok == false
// quando unitNumber está fora do intervalo suportado.
func SourceTextForUnit(unitNumber int) (text string, ok bool) {
	if unitNumber < 1 || unitNumber > 4 {
		return "", false
	}
	b, err := sourceTextFS.ReadFile(sourceTextPath(unitNumber))
	if err != nil {
		return "", false
	}
	return string(b), true
}

func sourceTextPath(unitNumber int) string {
	names := map[int]string{1: "unidade1.txt", 2: "unidade2.txt", 3: "unidade3.txt", 4: "unidade4.txt"}
	return "sourcetext/" + names[unitNumber]
}
