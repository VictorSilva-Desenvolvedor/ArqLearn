"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { InfiniteModeHeader } from "@/components/features/infiniteMode/InfiniteModeHeader";
import { InfiniteModeActionBar } from "@/components/features/infiniteMode/InfiniteModeActionBar";
import { QuestionCard } from "@/components/features/quiz/QuestionCard";
import { useInfiniteModeSession } from "@/components/features/infiniteMode/useInfiniteModeSession";
import { getThemeByTopic } from "@/lib/api/mocks/fixtures/themes";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";

export default function InfiniteModeSessionPage() {
  const router = useRouter();
  const { topic } = useParams<{ topic: string }>();
  const infinite = useInfiniteModeSession(topic);
  const themeLabel = getThemeByTopic(topic).label;
  const { showToast } = useToast();

  useEffect(() => {
    if (infinite.levelUpTo === null) return;
    showToast(`Nível ${infinite.levelUpTo} desbloqueado! Perguntas novas liberadas.`, "success");
    infinite.dismissLevelUp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [infinite.levelUpTo]);

  if (infinite.notAvailable) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-md px-md py-lg">
        <Icon name="construction" className="text-5xl text-outline" />
        <div>
          <h1 className="font-display text-headline-md font-bold text-on-surface">
            Modo Infinito de {themeLabel} ainda não está pronto
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Estamos preparando as perguntas deste tema. Escolha outro tema ou tente de novo mais tarde.
          </p>
        </div>
        <Button variant="primary" onClick={() => router.push("/explorar")}>
          Voltar para Explorar
        </Button>
      </div>
    );
  }

  if (infinite.loading || !infinite.question) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="font-body-lg text-body-lg text-on-surface-variant">Carregando desafio…</p>
      </div>
    );
  }

  return (
    <>
      <InfiniteModeHeader
        topicLabel={themeLabel}
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
        isSelectedCorrect={infinite.lastResult?.correct ?? false}
        onSelect={infinite.selectOption}
      />
      <InfiniteModeActionBar
        revealed={infinite.revealed}
        xpDailyCapReached={infinite.lastResult?.xp_daily_cap_reached ?? false}
        canConfirm={Boolean(infinite.selectedOptionId?.trim())}
        onGiveUp={infinite.giveUp}
        onConfirm={infinite.verify}
        onContinue={infinite.continueNext}
      />
    </>
  );
}
