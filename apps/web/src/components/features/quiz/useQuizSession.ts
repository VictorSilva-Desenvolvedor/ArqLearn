"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { explainQuestion, startLessonSession, submitAnswer } from "@/lib/api/resources/lessons";
import { ApiError } from "@/lib/api/http";
import { useAuth } from "@/hooks/useAuth";
import type { AnswerResult, LessonSession, SessionQuestion } from "@/types/api";

export function useQuizSession(trackId: string, lessonId: string) {
  const router = useRouter();
  const { gamification, updateGamification } = useAuth();

  const [session, setSession] = useState<LessonSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);
  const [hearts, setHearts] = useState(gamification.hearts_current);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionXpEarned, setSessionXpEarned] = useState(0);
  const [deepExplanation, setDeepExplanation] = useState<string | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);
  // P1 do /impeccable critique (18/08/2026, achado equivalente encontrado e corrigido antes no
  // mobile): sem isto, uma falha de rede ao iniciar a sessão deixava `loading` true pra sempre.
  const [sessionError, setSessionError] = useState(false);
  const [sessionRetryToken, setSessionRetryToken] = useState(0);
  const questionStartRef = useRef<number>(0);
  const loading = session === null && !sessionError;

  useEffect(() => {
    let cancelled = false;
    setSessionError(false);
    startLessonSession(lessonId, gamification.hearts_current)
      .then((startedSession) => {
        if (cancelled) return;
        setSession(startedSession);
        setHearts(startedSession.hearts_available);
        questionStartRef.current = Date.now();
      })
      .catch(() => {
        if (!cancelled) setSessionError(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, sessionRetryToken]);

  const retrySession = useCallback(() => setSessionRetryToken((t) => t + 1), []);

  const currentQuestion: SessionQuestion | null = session?.questions[currentIndex] ?? null;
  const totalQuestions = session?.questions.length ?? 0;

  const selectOption = useCallback(
    (optionId: string) => {
      if (revealed) return;
      setSelectedOptionId(optionId);
    },
    [revealed],
  );

  const [verifyError, setVerifyError] = useState<string | null>(null);

  const verify = useCallback(async () => {
    if (!session || !currentQuestion || !selectedOptionId || verifying) return;
    setVerifying(true);
    setVerifyError(null);
    const timeMs = Date.now() - questionStartRef.current;
    try {
      const result = await submitAnswer(lessonId, {
        session_id: session.session_id,
        question_id: currentQuestion.id,
        answer: selectedOptionId,
        time_ms: timeMs,
      });

      setLastResult(result);
      setRevealed(true);
      setHearts(result.vidas_restantes);
      setSessionXpEarned((xp) => xp + result.xp_ganho);
      if (result.correct) setCorrectCount((c) => c + 1);

      updateGamification({
        hearts_current: result.vidas_restantes,
        xp_total: gamification.xp_total + result.xp_ganho,
        xp_today: gamification.xp_today + result.xp_ganho,
        streak_current: result.streak_atual,
      });
    } catch (err) {
      // P1 do /impeccable critique (18/08/2026): antes disso, uma falha aqui era totalmente
      // silenciosa na ação mais executada do app — spinner some, nada acontece, sem retry.
      setVerifyError(err instanceof ApiError ? err.message : "Não foi possível verificar sua resposta. Tente novamente.");
    } finally {
      setVerifying(false);
    }
  }, [
    session,
    currentQuestion,
    selectedOptionId,
    verifying,
    lessonId,
    updateGamification,
    gamification.xp_total,
    gamification.xp_today,
  ]);

  const explainMore = useCallback(async () => {
    if (!currentQuestion) return;
    setExplainLoading(true);
    setExplainError(null);
    try {
      const { deep_explanation } = await explainQuestion(lessonId, currentQuestion.id, {
        selected_option_id: selectedOptionId ?? undefined,
      });
      setDeepExplanation(deep_explanation);
    } catch (err) {
      setExplainError(
        err instanceof ApiError ? err.message : "Não foi possível aprofundar a explicação agora.",
      );
    } finally {
      setExplainLoading(false);
    }
  }, [currentQuestion, lessonId, selectedOptionId]);

  const goToNextOrFinish = useCallback(() => {
    if (!session) return;
    const nextIndex = currentIndex + 1;

    if (nextIndex >= session.questions.length) {
      const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
      const params = new URLSearchParams({
        xp: String(sessionXpEarned),
        accuracy: String(accuracy),
        streak: String(gamification.streak_current),
        hearts: String(hearts),
        chest: String(lastResult?.daily_chest_available ?? false),
      });
      router.push(`/trilhas/${trackId}/${lessonId}/resumo?${params.toString()}`);
      return;
    }

    setCurrentIndex(nextIndex);
    setSelectedOptionId(null);
    setRevealed(false);
    setLastResult(null);
    setDeepExplanation(null);
    setExplainError(null);
    questionStartRef.current = Date.now();
  }, [
    session,
    currentIndex,
    totalQuestions,
    correctCount,
    sessionXpEarned,
    hearts,
    gamification.streak_current,
    lastResult,
    router,
    trackId,
    lessonId,
  ]);

  return {
    loading,
    sessionError,
    retrySession,
    currentQuestion,
    currentIndex,
    totalQuestions,
    selectedOptionId,
    revealed,
    verifying,
    verifyError,
    lastResult,
    hearts,
    gems: gamification.gems,
    noHearts: hearts <= 0,
    selectOption,
    verify,
    skip: goToNextOrFinish,
    continueNext: goToNextOrFinish,
    deepExplanation,
    explainLoading,
    explainError,
    explainMore,
  };
}
