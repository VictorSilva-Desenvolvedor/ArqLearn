"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import type { ReviewQueueRow } from "@/lib/api/mocks/fixtures/teacherAnalytics";

const statusTone = { pending: "neutral", approved: "tertiary", rejected: "error" } as const;
const statusLabel = { pending: "Pendente", approved: "Aprovada", rejected: "Rejeitada" } as const;

type SortKey = "student_name" | "question_id" | "topic" | "status";
type SortDirection = "asc" | "desc";

const columns: { key: SortKey; label: string }[] = [
  { key: "student_name", label: "Aluno" },
  { key: "question_id", label: "Questão ID" },
  { key: "topic", label: "Tópico" },
  { key: "status", label: "Status" },
];

export function ReviewQueueTable({ rows }: { rows: ReviewQueueRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("student_name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortedRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => a[sortKey].localeCompare(b[sortKey]));
    return sortDirection === "asc" ? sorted : sorted.reverse();
  }, [rows, sortKey, sortDirection]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  if (rows.length === 0) {
    return (
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Nenhuma questão pendente de revisão nesta turma.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border-2 border-outline-variant rounded-lg">
      <table className="w-full text-left">
        <thead className="bg-surface-gray">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-md py-sm">
                <button
                  type="button"
                  onClick={() => toggleSort(column.key)}
                  className="flex items-center gap-1 font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface"
                  aria-label={`Ordenar por ${column.label}`}
                >
                  {column.label}
                  <Icon
                    name={sortKey === column.key && sortDirection === "desc" ? "arrow_upward" : "arrow_downward"}
                    className={sortKey === column.key ? "text-primary text-sm" : "text-outline-variant text-sm"}
                  />
                </button>
              </th>
            ))}
            <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant">Ação</th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr key={row.question_id} className="border-t border-outline-variant">
              <td className="px-md py-sm font-body-sm text-body-sm text-on-surface">{row.student_name}</td>
              <td className="px-md py-sm font-label text-body-sm text-on-surface-variant">{row.question_id}</td>
              <td className="px-md py-sm font-body-sm text-body-sm text-on-surface">{row.topic}</td>
              <td className="px-md py-sm">
                <Badge tone={statusTone[row.status]}>{statusLabel[row.status]}</Badge>
              </td>
              <td className="px-md py-sm">
                <Link href={`/revisao/${row.upload_id}`} className="font-body-sm text-body-sm text-primary font-bold">
                  Revisar
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
