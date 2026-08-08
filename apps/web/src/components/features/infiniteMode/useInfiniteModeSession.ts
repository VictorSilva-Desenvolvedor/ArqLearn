"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  endInfiniteModeSession,
  startInfiniteModeSession,
  submitInfiniteModeAnswer,
} from "@/lib/api/resources/infiniteMode";
import { useAuth } from "@/hooks/useAuth";
import type { InfiniteModeAnswerResult, InfiniteModeQuestion } from "@/types/api";

// Mesmo tamanho de MAX_QUESTIONS do mock em lib/api/mocks/fixtures/infiniteModeSessions.ts —
// só para dar uma referência de progresso à barra; a API real não devolve um total fixo.
const PROGRESS_HINT_TOTAL = 9;

export function useInfiniteModeSession(topic: string) {
  const router = useRouter();
  const { updateGamification } = useAuth();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<InfiniteModeQuestion | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [lastResult, setLastResult] = useState<InfiniteModeAnswerResult | null>(null);
  const questionStartRef = useRef<number>(0);
  const loading = sessionId === null;

  useEffect(() => {
    let cancelled = false;
    startInfiniteModeSession(topic).then((session) => {
      if (cancelled) return;
      setSessionId(session.session_id);
      setQuestion(session.question);
      questionStartRef.current = Date.now();
    });
    return () => {
      cancelled = true;
    };
  }, [topic]);

  const selectOption = useCallback(
    (optionId: string) => {
      if (revealed) return;
      setSelectedOptionId(optionId);
    },
    [revealed],
  );

  const verify = useCallback(async () => {
    if (!sessionId || !question || !selectedOptionId) return;
    const timeMs = Date.now() - questionStartRef.current;
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
  }, [sessionId, question, selectedOptionId, updateGamification]);

  const finishAndGoToSummary = useCallback(async () => {
    if (!sessionId) return;
    const end = await endInfiniteModeSession(sessionId);
    const params = new URLSearchParams({
      questions: String(end.questions_answered),
      correct: String(end.correct_count),
      accuracy: String(end.accuracy_rate),
      xp: String(end.xp_earned),
      avgTime: String(end.avg_time_ms),
      topic,
    });
    router.push(`/infinito/${topic}/resumo?${params.toString()}`);
  }, [sessionId, router, topic]);

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
    question,
    selectedOptionId,
    revealed,
    lastResult,
    questionsAnswered: lastResult?.questions_answered ?? 0,
    progressHintTotal: PROGRESS_HINT_TOTAL,
    selectOption,
    verify,
    continueNext,
    giveUp,
  };
}
