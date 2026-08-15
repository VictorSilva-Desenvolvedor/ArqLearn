import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { StreakDialog } from "./StreakDialog";

// TDD §5.2 (aviso preventivo): abre o StreakDialog sozinho assim que o app carrega um usuário
// logado com gamification.streak_at_risk (streak positiva, ainda sem prática hoje) — sem esperar
// a pessoa procurar a tela Perfil pra descobrir que ia perder a sequência. Fica montada uma vez
// no root layout (dentro do AuthProvider), espelha o padrão de LevelUpCelebration. Um `hasPrompted`
// por sessão evita reabrir sozinho toda vez que `gamification` for re-buscado enquanto a pessoa
// ainda não praticou nem usou o bloqueio (streak_at_risk continuaria true até lá).
export function StreakAtRiskPrompt() {
  const auth = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const hasPromptedRef = useRef(false);

  const isLoggedIn = Boolean(auth?.user);
  const streakAtRisk = auth?.gamification.streak_at_risk ?? false;

  useEffect(() => {
    if (!auth?.isResolved || !isLoggedIn) return;
    if (streakAtRisk && !hasPromptedRef.current) {
      hasPromptedRef.current = true;
      setOpen(true);
    }
  }, [auth?.isResolved, isLoggedIn, streakAtRisk]);

  useEffect(() => {
    if (!isLoggedIn) hasPromptedRef.current = false;
  }, [isLoggedIn]);

  // StreakDialog usa o useAuth() estrito (lança sem sessão) — só monta depois de logado. Fica
  // montado uma vez logado (não desmonta se streakAtRisk virar false por baixo, ex.: freeze usado
  // com o diálogo já aberto) pra não perder o estado de `open` a meio da interação.
  if (!isLoggedIn) return null;

  return <StreakDialog open={open} onOpenChange={setOpen} />;
}
