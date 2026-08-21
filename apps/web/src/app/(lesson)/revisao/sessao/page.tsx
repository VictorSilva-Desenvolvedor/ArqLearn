"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { InfiniteModeHeader } from "@/components/features/infiniteMode/InfiniteModeHeader";
import { InfiniteModeActionBar } from "@/components/features/infiniteMode/InfiniteModeActionBar";
import { QuestionCard } from "@/components/features/quiz/QuestionCard";
import { useInfiniteModeSession } from "@/components/features/infiniteMode/useInfiniteModeSession";
import { useQuizKeyboardShortcuts } from "@/components/features/quiz/useQuizKeyboardShortcuts";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { LoadingBlueprint } from "@/components/ui/LoadingBlueprint";
import { useToast } from "@/hooks/useToast";

// "Revisar agora" (TDD §10.3) — reaproveita o mesmo hook/loop de resposta do Modo Infinito por
// tópico (useInfiniteModeSession), só trocando o parâmetro pra { review: true }. Sem [topic] na
// rota: a fila cruza todos os tópicos já praticados, não é de um tema só.
export default function ReviewSessionPage() {
  const router = useRouter();
  const infinite = useInfiniteModeSession({ review: true });
  const { showToast } = useToast();

  useEffect(() => {
    if (infinite.levelUpTo === null) return;
    showToast(`Nível ${infinite.levelUpTo} desbloqueado! Perguntas novas liberadas.`, "success");
    infinite.dismissLevelUp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [infinite.levelUpTo]);

  // Antes de qualquer early return de propósito — hooks não podem ser condicionais.
  useQuizKeyboardShortcuts({
    enabled: !infinite.notAvailable && !infinite.loading,
    revealed: infinite.revealed,
    optionIds: infinite.question?.options.map((o) => o.id) ?? [],
    canSelect: infinite.question?.type !== "fill_blank",
    canVerify: Boolean(infinite.selectedOptionId?.trim()),
    verifying: infinite.verifying,
    onSelect: infinite.selectOption,
    onVerify: infinite.verify,
    onContinue: infinite.continueNext,
  });

  if (infinite.notAvailable) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-md px-md py-lg">
        <Icon name="task_alt" className="text-5xl text-outline" />
        <div>
          <h1 className="font-display text-headline-md font-bold text-on-surface">
            Nada pra revisar agora
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Você está em dia com tudo que já praticou. Volte mais tarde ou pratique um tema novo.
          </p>
        </div>
        <Button variant="primary" onClick={() => router.push("/explorar")}>
          Voltar para Explorar
        </Button>
      </div>
    );
  }

  if (infinite.sessionError) {
    return (
      <ErrorBanner
        message="Não foi possível carregar a revisão. Verifique sua conexão e tente novamente."
        onRetry={infinite.retrySession}
      />
    );
  }

  if (infinite.loading || !infinite.question) {
    return <LoadingBlueprint variant="fullscreen" size={160} label="Carregando revisão…" />;
  }

  return (
    <>
      <InfiniteModeHeader
        variant="review"
        topicLabel=""
        current={infinite.levelProgress}
        total={infinite.levelProgressTotal}
        level={infinite.level}
      />
      <QuestionCard
        prompt={infinite.question.prompt}
        type={infinite.question.type}
        difficulty={infinite.question.difficulty}
        imageUrl={infinite.question.image_url}
        options={infinite.question.options}
        selectedOptionId={infinite.selectedOptionId}
        revealed={infinite.revealed}
        verifying={infinite.verifying}
        isSelectedCorrect={infinite.lastResult?.correct ?? false}
        onSelect={infinite.selectOption}
      />
      <InfiniteModeActionBar
        revealed={infinite.revealed}
        xpDailyCapReached={infinite.lastResult?.xp_daily_cap_reached ?? false}
        canConfirm={Boolean(infinite.selectedOptionId?.trim())}
        verifying={infinite.verifying}
        verifyError={infinite.verifyError}
        onGiveUp={infinite.giveUp}
        onConfirm={infinite.verify}
        onContinue={infinite.continueNext}
      />
    </>
  );
}
