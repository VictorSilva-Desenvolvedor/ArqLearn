"use client";

import { useEffect, useState } from "react";
import { formatMinutesSeconds } from "@/lib/utils/format";

export function useCountdown(initialSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  return { secondsLeft, formatted: formatMinutesSeconds(secondsLeft) };
}
