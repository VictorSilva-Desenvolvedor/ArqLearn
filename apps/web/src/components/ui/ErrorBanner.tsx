import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

interface ErrorBannerProps {
  message?: string;
  onRetry: () => void;
}

// Spec §7: "Network error: non-blocking banner + retry" — não é um full-page takeover; o layout
// (nav/TopAppBar) ao redor continua de pé, só o conteúdo da rota vira este banner.
export function ErrorBanner({
  message = "Não foi possível carregar esta página. Verifique sua conexão e tente novamente.",
  onRetry,
}: ErrorBannerProps) {
  return (
    <div className="max-w-2xl mx-auto w-full px-md py-section flex flex-col items-center text-center gap-md">
      <Icon name="wifi_off" className="text-5xl text-outline" />
      <div>
        <h2 className="font-display text-headline-md font-bold text-on-surface">Algo deu errado</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">{message}</p>
      </div>
      <Button variant="primary" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}
