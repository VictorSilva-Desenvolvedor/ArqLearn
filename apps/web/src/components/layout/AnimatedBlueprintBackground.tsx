"use client";

import { useEffect, useState } from "react";

// Fundo animado "Blueprint" — ícones de arquitetura caindo sobre a grade técnica já pintada em
// body (globals.css), a pedido do usuário (ver
// Docs/stitch_app_visual_identity/fundo-animado-blueprint-v2.html, referência de layout/trajetos/
// cores — não copiado direto pra produção, portado pros tokens reais do app: cores hardcoded do
// mockup viraram text-primary/text-secondary via currentColor). Montado uma vez em
// app/layout.tsx, atrás de todo o conteúdo.
const ICON_NAMES = ["compass", "ruler", "square", "house", "triangle", "diamond"] as const;
type IconName = (typeof ICON_NAMES)[number];

const TONES = ["primary", "secondary"] as const;
const PATHS = ["a", "b", "c"] as const;
const TOTAL_ITEMS = 18;

interface FallingItem {
  id: number;
  icon: IconName;
  tone: (typeof TONES)[number];
  path: (typeof PATHS)[number];
  size: number;
  left: number;
  duration: number;
  delay: number;
}

function randomItem<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

// Gerado só no client (useEffect abaixo) — Math.random() aqui dentro do render causaria
// mismatch de hidratação entre o HTML do servidor e o primeiro render do cliente.
function generateItems(): FallingItem[] {
  return Array.from({ length: TOTAL_ITEMS }, (_, id) => ({
    id,
    icon: randomItem(ICON_NAMES),
    tone: randomItem(TONES),
    path: randomItem(PATHS),
    size: 18 + Math.random() * 20,
    left: Math.random() * 96,
    duration: 6 + Math.random() * 6,
    delay: -1 * Math.random() * 12,
  }));
}

function BlueprintIcon({ name }: { name: IconName }) {
  switch (name) {
    case "compass":
      return (
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
          <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="1" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
    case "ruler":
      return (
        <svg viewBox="0 0 24 24">
          <rect x="2" y="8" width="20" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 8v4M10 8v2M14 8v4M18 8v2" stroke="currentColor" strokeWidth="1" />
        </svg>
      );
    case "square":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M4 4v16h16L4 4z" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 18h12M6 6v12" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 1" />
        </svg>
      );
    case "house":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M3 10l9-7 9 7v11H3V10z" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 21v-6h6v6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "triangle":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M2 20 L22 20 L2 2 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "diamond":
      return (
        <svg viewBox="0 0 24 24">
          <path d="M12 2 L21 12 L12 22 L3 12 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
  }
}

export function AnimatedBlueprintBackground() {
  const [items, setItems] = useState<FallingItem[]>([]);

  useEffect(() => {
    setItems(generateItems());
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      {items.map((item) => (
        <div
          key={item.id}
          className={`falling-blueprint-item falling-path-${item.path} ${
            item.tone === "primary" ? "text-primary" : "text-secondary"
          }`}
          style={{
            left: `${item.left}%`,
            width: item.size,
            height: item.size,
            animationDuration: `${item.duration}s`,
            animationDelay: `${item.delay}s`,
          }}
        >
          <BlueprintIcon name={item.icon} />
        </div>
      ))}
    </div>
  );
}
