import { useContext } from "react";
import { AppearanceContext, type AppearanceContextValue } from "@/contexts/AppearanceContext";

export function useAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext);
  if (!ctx) {
    throw new Error("useAppearance deve ser usado dentro de <AppearanceProvider>");
  }
  return ctx;
}
