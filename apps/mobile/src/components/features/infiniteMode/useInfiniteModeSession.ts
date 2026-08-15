import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  endInfiniteModeSession,
  startInfiniteModeSession,
  submitInfiniteModeAnswer,
} from "@/lib/api/resources/infiniteMode";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api/http";
import type { InfiniteModeAnswerResult, InfiniteModeQuestion } from "@/types/api";

// Tamanho do bloco de "nível" — mesma conta do backend real (genBatchSize,
// internal/learning/infinitemode_generation.go). A barra de progresso mostra o avanço dentro do
// nível atual, não o total histórico da sessão. Espelha
// apps/web/src/components/features/infiniteMode/useInfiniteModeSession.ts.
const LEVEL_BATCH_SIZE = 20;

export function useInfiniteModeSession(topic: string) {
  const router = useRouter();
  const { updateGamification } = useAuth();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<InfiniteModeQuestion | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [lastResult, setLastResult] = useState<InfiniteModeAnswerResult | null>(null);
  const [notAvailable, setNotAvailable] = useState(false);
  const [levelUpTo, setLevelUpTo] = useState<number | null>(null);
  const questionStartRef = useRef<number>(0);
  const levelRef = useRef<number>(1);
  const loading = sessionId === null && !notAvailable;

  useEffect(() => {
    let cancelled = false;
    startInfiniteModeSession(topic)
      .then((session) => {
        if (cancelled) return;
        setSessionId(session.session_id);
        setQuestion(session.question);
        questionStartRef.current = Date.now();
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.error_code === "TOPIC_NOT_AVAILABLE") {
          setNotAvailable(true);
          return;
        }
        throw err;
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  const selectOption = useCallback(
    (optionId: string) => {
      if (revealed) return;
      setSelectedOptionId(optionId);
    },
    [revealed],
  );

  const verify = useCallback(async () => {
    if (!sessionId || !question || !selectedOptionId || verifying) return;
    setVerifying(true);
    const timeMs = Date.now() - questionStartRef.current;
    try {
      const result = await submitInfiniteModeAnswer(sessionId, {
        question_id: question.id,
        answer: selectedOptionId,
        time_ms: timeMs,
      });
      setLastResult(result);
      setRevealed(true);
      if (result.xp_ganho > 0) {
        updateGamification({});
      }
      if (result.level > levelRef.current) {
        levelRef.current = result.level;
        setLevelUpTo(result.level);
      }
    } finally {
      setVerifying(false);
    }
  }, [sessionId, question, selectedOptionId, verifying, updateGamification]);

  const dismissLevelUp = useCallback(() => setLevelUpTo(null), []);

  const finishAndGoToSummary = useCallback(async () => {
    if (!sessionId) return;
    const end = await endInfiniteModeSession(sessionId);
    router.push({
      pathname: "/infinito/[topic]/resumo",
      params: {
        topic,
        questions: String(end.questions_answered),
        correct: String(end.correct_count),
        accuracy: String(end.accuracy_rate),
        xp: String(end.xp_earned),
        avgTime: String(end.avg_time_ms),
        chest: String(lastResult?.daily_chest_available ?? false),
      },
    });
  }, [sessionId, router, topic, lastResult]);

  const giveUp = useCallback(() => {
    finishAndGoToSummary();
  }, [finishAndGoToSummary]);

  const continueNext = useCallback(() => {
    if (!lastResult) return;
    if (!lastResult.next_question) {
      finishAndGoToSummary();
      return;
    }
    setQuestion(lastResult.next_question);
    setSelectedOptionId(null);
    setRevealed(false);
    setLastResult(null);
    questionStartRef.current = Date.now();
  }, [lastResult, finishAndGoToSummary]);

  return {
    loading,
    notAvailable,
    question,
    selectedOptionId,
    revealed,
    verifying,
    lastResult,
    questionsAnswered: lastResult?.questions_answered ?? 0,
    levelProgress: (lastResult?.questions_answered ?? 0) % LEVEL_BATCH_SIZE || (lastResult ? LEVEL_BATCH_SIZE : 0),
    levelProgressTotal: LEVEL_BATCH_SIZE,
    level: lastResult?.level ?? 1,
    levelUpTo,
    dismissLevelUp,
    selectOption,
    verify,
    continueNext,
    giveUp,
  };
}
