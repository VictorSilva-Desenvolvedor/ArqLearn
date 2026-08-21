import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import * as Crypto from "expo-crypto";
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

// { topic } é o modo por tópico de sempre; { review: true } é a fila de revisão do SRS
// ("Revisar agora", TDD §10.3) — sem tópico único, cruza tudo que já foi praticado.
export type InfiniteModeSessionParams = { topic: string } | { review: true };

export function useInfiniteModeSession(params: InfiniteModeSessionParams) {
  const router = useRouter();
  const { updateGamification } = useAuth();
  const isReview = "review" in params;
  const topic = "topic" in params ? params.topic : "";

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<InfiniteModeQuestion | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [lastResult, setLastResult] = useState<InfiniteModeAnswerResult | null>(null);
  const [notAvailable, setNotAvailable] = useState(false);
  const [levelUpTo, setLevelUpTo] = useState<number | null>(null);
  // P1 do /impeccable critique (18/08/2026, achado equivalente ao de useQuizSession.ts): a
  // versão anterior relançava (`throw err`) qualquer erro que não fosse TOPIC_NOT_AVAILABLE de
  // dentro de um `.catch()` — vira uma rejeição não tratada, `loading` nunca sai de `true`,
  // spinner infinito sem retry nem saída in-app.
  const [sessionError, setSessionError] = useState(false);
  const [sessionRetryToken, setSessionRetryToken] = useState(0);
  const questionStartRef = useRef<number>(0);
  const levelRef = useRef<number>(1);
  // Chave estável por tentativa de resposta (API Spec §2.6, v1.22) — mesmo padrão de
  // useQuizSession.ts: reaproveitada em retries de `verify()`, renovada só ao avançar de
  // pergunta (continueNext) ou ao (re)carregar a sessão.
  const idempotencyKeyRef = useRef<string | null>(null);
  const loading = sessionId === null && !notAvailable && !sessionError;

  useEffect(() => {
    let cancelled = false;
    setSessionError(false);
    startInfiniteModeSession(isReview ? { review: true } : { topic })
      .then((session) => {
        if (cancelled) return;
        setSessionId(session.session_id);
        setQuestion(session.question);
        questionStartRef.current = Date.now();
        idempotencyKeyRef.current = null;
      })
      .catch((err) => {
        if (cancelled) return;
        // REVIEW_QUEUE_EMPTY (fila de revisão vazia) reaproveita o mesmo estado "notAvailable" de
        // TOPIC_NOT_AVAILABLE — as duas telas já tratam esse branch como "nada aqui agora".
        if (err instanceof ApiError && (err.error_code === "TOPIC_NOT_AVAILABLE" || err.error_code === "REVIEW_QUEUE_EMPTY")) {
          setNotAvailable(true);
          return;
        }
        setSessionError(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReview, topic, sessionRetryToken]);

  const retrySession = useCallback(() => setSessionRetryToken((t) => t + 1), []);

  const selectOption = useCallback(
    (optionId: string) => {
      if (revealed) return;
      setSelectedOptionId(optionId);
    },
    [revealed],
  );

  const [verifyError, setVerifyError] = useState<string | null>(null);

  const verify = useCallback(async () => {
    if (!sessionId || !question || !selectedOptionId || verifying) return;
    setVerifying(true);
    setVerifyError(null);
    const timeMs = Date.now() - questionStartRef.current;
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = Crypto.randomUUID();
    }
    try {
      const result = await submitInfiniteModeAnswer(
        sessionId,
        {
          question_id: question.id,
          answer: selectedOptionId,
          time_ms: timeMs,
        },
        idempotencyKeyRef.current,
      );
      setLastResult(result);
      setRevealed(true);
      if (result.xp_ganho > 0) {
        updateGamification({});
      }
      if (result.level > levelRef.current) {
        levelRef.current = result.level;
        setLevelUpTo(result.level);
      }
    } catch (err) {
      setVerifyError(err instanceof ApiError ? err.message : "Não foi possível verificar sua resposta. Tente novamente.");
    } finally {
      setVerifying(false);
    }
  }, [sessionId, question, selectedOptionId, verifying, updateGamification]);

  const dismissLevelUp = useCallback(() => setLevelUpTo(null), []);

  const finishAndGoToSummary = useCallback(async () => {
    if (!sessionId) return;
    const end = await endInfiniteModeSession(sessionId);
    const summaryParams = {
      questions: String(end.questions_answered),
      correct: String(end.correct_count),
      accuracy: String(end.accuracy_rate),
      xp: String(end.xp_earned),
      avgTime: String(end.avg_time_ms),
      chest: String(lastResult?.daily_chest_available ?? false),
    };
    if (isReview) {
      router.push({ pathname: "/revisao/resumo", params: summaryParams });
      return;
    }
    router.push({
      pathname: "/infinito/[topic]/resumo",
      params: { topic, ...summaryParams },
    });
  }, [sessionId, router, topic, isReview, lastResult]);

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
    idempotencyKeyRef.current = null;
  }, [lastResult, finishAndGoToSummary]);

  return {
    loading,
    sessionError,
    retrySession,
    notAvailable,
    question,
    selectedOptionId,
    revealed,
    verifying,
    verifyError,
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
