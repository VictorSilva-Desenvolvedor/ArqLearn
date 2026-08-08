"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { listUploadQuestions, reviewUploadQuestion } from "@/lib/api/resources/uploads";
import { mockReviewTrackTitle } from "@/lib/api/mocks/fixtures/reviewQuestions";
import { Badge } from "@/components/ui/Badge";
import { QuestionReviewCard } from "@/components/features/teacherReview/QuestionReviewCard";
import { ReviewProgressFooter } from "@/components/features/teacherReview/ReviewProgressFooter";
import type { ReviewQuestion } from "@/types/api";

export default function QuestionReviewPage() {
  const router = useRouter();
  const { uploadId } = useParams<{ uploadId: string }>();
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    listUploadQuestions(uploadId).then(({ data }) => setQuestions(data));
  }, [uploadId]);

  const reviewedCount = questions.filter((q) => q.review_status !== "pending").length;
  const approvedCount = questions.filter((q) => q.review_status === "approved" || q.review_status === "edited").length;
  const rejectedCount = questions.filter((q) => q.review_status === "rejected").length;

  const applyReview = async (questionId: string, action: "approve" | "reject" | "edit", enunciado?: string) => {
    const updated = await reviewUploadQuestion(uploadId, questionId, action, enunciado ? { enunciado } : undefined);
    setQuestions((current) => current.map((q) => (q.id === questionId ? updated : q)));
  };

  const handlePublish = async () => {
    setPublishing(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    router.push("/painel");
  };

  return (
    <div className="max-w-2xl mx-auto px-lg py-section flex flex-col gap-md pb-32">
      <div>
        <h1 className="font-display text-display-lg font-bold text-on-surface">
          {mockReviewTrackTitle[uploadId] ?? "Revisão de Perguntas"}
        </h1>
        <div className="flex items-center gap-sm mt-xs">
          <Badge tone="neutral">{questions.length} perguntas na fila</Badge>
          <Badge tone="tertiary">{approvedCount} aprovadas</Badge>
          <Badge tone="error">{rejectedCount} rejeitadas</Badge>
        </div>
      </div>

      <div className="flex flex-col gap-md">
        {questions.map((question) => (
          <QuestionReviewCard
            key={question.id}
            question={question}
            onApprove={() => applyReview(question.id, "approve")}
            onReject={() => applyReview(question.id, "reject")}
            onEdit={(enunciado) => applyReview(question.id, "edit", enunciado)}
          />
        ))}
      </div>

      <ReviewProgressFooter
        reviewed={reviewedCount}
        total={questions.length}
        onPublish={handlePublish}
        publishing={publishing}
      />
    </div>
  );
}
