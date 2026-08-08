"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import type { QuestionDifficulty, QuestionType, ReviewQuestion } from "@/types/api";

const typeLabel: Record<QuestionType, string> = {
  multiple_choice: "Múltipla Escolha",
  true_false: "Verdadeiro/Falso",
  matching: "Associação",
  fill_blank: "Completar",
  image_identification: "Identificação de Imagem",
};

const difficultyTone: Record<QuestionDifficulty, "tertiary" | "secondary" | "error"> = {
  easy: "tertiary",
  medium: "secondary",
  hard: "error",
};

const difficultyLabel: Record<QuestionDifficulty, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

interface QuestionReviewCardProps {
  question: ReviewQuestion;
  onApprove: () => void;
  onReject: () => void;
  onEdit: (novoEnunciado: string) => void;
}

const statusBadge: Record<string, { label: string; tone: "tertiary" | "error" | "primary" }> = {
  approved: { label: "Aprovada", tone: "tertiary" },
  rejected: { label: "Rejeitada", tone: "error" },
  edited: { label: "Editada e aprovada", tone: "primary" },
};

export function QuestionReviewCard({ question, onApprove, onReject, onEdit }: QuestionReviewCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(question.enunciado);
  const reviewed = question.review_status !== "pending";

  return (
    <Card
      padding="md"
      radius="lg"
      className={cn("flex flex-col gap-sm", reviewed && "opacity-70")}
    >
      <div className="flex items-center gap-sm flex-wrap">
        <Badge tone="neutral">{typeLabel[question.type]}</Badge>
        <Badge tone={difficultyTone[question.difficulty]}>{difficultyLabel[question.difficulty]}</Badge>
        {reviewed && (
          <Badge tone={statusBadge[question.review_status].tone}>{statusBadge[question.review_status].label}</Badge>
        )}
      </div>

      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          className="w-full border-2 border-primary rounded-md p-sm font-question-sm text-question-sm text-on-surface outline-none"
        />
      ) : (
        <p className="font-display text-question-sm text-on-surface">{question.enunciado}</p>
      )}

      <div className="flex flex-col gap-1">
        {question.opcoes.map((opcao) => (
          <div
            key={opcao.id}
            className={cn(
              "px-sm py-2 rounded-md border font-body-md text-body-md",
              opcao.id === question.resposta_correta
                ? "border-tertiary bg-tertiary-fixed text-on-tertiary-fixed-variant"
                : "border-outline-variant text-on-surface-variant",
            )}
          >
            {opcao.label}
          </div>
        ))}
      </div>

      <blockquote className="border-l-4 border-outline-variant pl-sm font-body-sm text-body-sm text-on-surface-variant italic">
        {question.source_excerpt}
      </blockquote>

      {!reviewed && (
        <div className="flex items-center gap-sm justify-end">
          {editing ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onEdit(draft);
                  setEditing(false);
                }}
              >
                Salvar edição
              </Button>
            </>
          ) : (
            <>
              <Button variant="danger" size="sm" onClick={onReject}>
                Rejeitar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                Editar
              </Button>
              <Button variant="primary" size="sm" onClick={onApprove}>
                Aprovar
              </Button>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
