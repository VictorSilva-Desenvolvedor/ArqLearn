"use client";

import { useEffect } from "react";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

export default function TeacherError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorBanner onRetry={retry} />;
}
