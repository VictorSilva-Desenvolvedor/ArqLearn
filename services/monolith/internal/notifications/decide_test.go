package notifications

import (
	"testing"
	"time"
)

func TestJanelaLocalAberta(t *testing.T) {
	casos := []struct {
		nome       string
		timezone   string
		agoraUTC   time.Time
		inicioHora int
		fimHora    int
		want       bool
	}{
		{
			nome:       "dentro da janela, UTC",
			timezone:   "UTC",
			agoraUTC:   time.Date(2026, 8, 21, 20, 30, 0, 0, time.UTC),
			inicioHora: 20, fimHora: 22,
			want: true,
		},
		{
			nome:       "antes da janela, UTC",
			timezone:   "UTC",
			agoraUTC:   time.Date(2026, 8, 21, 19, 59, 0, 0, time.UTC),
			inicioHora: 20, fimHora: 22,
			want: false,
		},
		{
			nome:       "exatamente na hora final: fechada (intervalo [inicio, fim))",
			timezone:   "UTC",
			agoraUTC:   time.Date(2026, 8, 21, 22, 0, 0, 0, time.UTC),
			inicioHora: 20, fimHora: 22,
			want: false,
		},
		{
			nome:       "fuso America/Sao_Paulo (UTC-3): 23h UTC vira 20h local, dentro da janela",
			timezone:   "America/Sao_Paulo",
			agoraUTC:   time.Date(2026, 8, 21, 23, 0, 0, 0, time.UTC),
			inicioHora: 20, fimHora: 22,
			want: true,
		},
		{
			nome:       "fuso America/Sao_Paulo: 20h UTC vira 17h local, fora da janela",
			timezone:   "America/Sao_Paulo",
			agoraUTC:   time.Date(2026, 8, 21, 20, 0, 0, 0, time.UTC),
			inicioHora: 20, fimHora: 22,
			want: false,
		},
		{
			nome:       "fuso inválido cai pra UTC (mesmo fallback de gamification.HojeLocal)",
			timezone:   "nao/existe",
			agoraUTC:   time.Date(2026, 8, 21, 20, 30, 0, 0, time.UTC),
			inicioHora: 20, fimHora: 22,
			want: true,
		},
	}
	for _, c := range casos {
		t.Run(c.nome, func(t *testing.T) {
			got := janelaLocalAberta(c.timezone, c.agoraUTC, c.inicioHora, c.fimHora)
			if got != c.want {
				t.Errorf("janelaLocalAberta(%q, %v, %d, %d) = %v, esperado %v", c.timezone, c.agoraUTC, c.inicioHora, c.fimHora, got, c.want)
			}
		})
	}
}
