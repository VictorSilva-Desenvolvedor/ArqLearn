"use client";

import { useEffect } from "react";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

// Fallback pra qualquer rota sem error.tsx mais específico (ex.: /login) — também funciona como
// segunda camada de defesa se o error.tsx de um grupo mais específico falhar.
export default function RootError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center">
      <ErrorBanner onRetry={retry} />
    </div>
  );
}
