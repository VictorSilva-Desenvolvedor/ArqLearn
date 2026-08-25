import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils/format";
import type { AppNotification, NotificationType } from "@/types/api";

// `tile` é o fundo tingido atrás do glifo (a referência do Stitch põe cada ícone num quadrado
// arredondado da cor semântica do tipo, o que é o que faz a lista ser escaneável de relance).
// O glifo usa o par `on-*-fixed-variant` correspondente ao tile, e não `text-primary`/`secondary`/
// `tertiary`: é o par que o Material 3 garante legível sobre a superfície `*-fixed` — mesma
// escolha do apps/mobile, onde isso é obrigatório porque lá existe tema escuro.
const typeConfig: Record<NotificationType, { icon: string; className: string; tile: string }> = {
  streak_at_risk: { icon: "local_fire_department", className: "text-on-error-container", tile: "bg-error-container" },
  league_promotion: { icon: "military_tech", className: "text-on-primary-fixed-variant", tile: "bg-primary-fixed" },
  league_demotion: { icon: "trending_down", className: "text-on-error-container", tile: "bg-error-container" },
  new_challenge: { icon: "bolt", className: "text-on-secondary-fixed-variant", tile: "bg-secondary-fixed" },
  questions_ready_for_review: { icon: "fact_check", className: "text-on-tertiary-fixed-variant", tile: "bg-tertiary-fixed" },
  welcome: { icon: "architecture", className: "text-on-surface-variant", tile: "bg-surface-container" },
  bug_fixed: { icon: "bug_report", className: "text-on-tertiary-fixed-variant", tile: "bg-tertiary-fixed" },
  suggestion_implemented: { icon: "lightbulb", className: "text-on-secondary-fixed-variant", tile: "bg-secondary-fixed" },
};

interface NotificationItemProps {
  notification: AppNotification;
  // Só streak_at_risk tem destino definido pelo spec ("deep-link direto pra lição sugerida") —
  // os outros tipos não têm um alvo especificado, então continuam não-clicáveis.
  href?: string;
}

export function NotificationItem({ notification, href }: NotificationItemProps) {
  const config = typeConfig[notification.type];
  const isHighlighted = notification.type === "league_promotion" && !notification.read;

  const cardClassName = cn(
    "flex items-start gap-sm",
    isHighlighted && "border-primary bg-primary-fixed",
    notification.read && "opacity-60",
  );

  const content = (
    <>
      <span
        className={cn(
          "shrink-0 w-10 h-10 rounded-md flex items-center justify-center",
          // O card destacado já é bg-primary-fixed — o tile precisa de um tom a mais para não
          // sumir dentro dele.
          isHighlighted ? "bg-primary-fixed-dim" : config.tile,
        )}
      >
        <Icon name={config.icon} filled className={cn("text-2xl", config.className)} />
      </span>
      <p className="flex-1 font-body-md text-body-md text-on-surface">{notification.message}</p>
      <span className="shrink-0 flex flex-col items-end gap-1.5">
        <time
          dateTime={notification.created_at}
          className="font-label text-label-caps text-on-surface-variant whitespace-nowrap"
        >
          {formatRelativeTime(notification.created_at)}
        </time>
        {!notification.read && <span className="w-2 h-2 rounded-full bg-primary" />}
      </span>
    </>
  );

  if (href) {
    // Sem `interactive` no Card de propósito: (1) este componente é renderizado por um Server
    // Component e `interactive` faz o Card anexar um onKeyDown — passar handler pela fronteira
    // servidor/cliente derrubava a página inteira de Notificações no error boundary; (2) o <Link>
    // já é ativável por teclado, e um role="button" com tabIndex dentro de um <a> criaria dois
    // pontos de tabulação e um "botão dentro de link" para o leitor de tela.
    return (
      <Link
        href={href}
        className="group block rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Card
          padding="sm"
          radius="md"
          className={cn(cardClassName, "transition-colors cursor-pointer group-hover:border-primary")}
        >
          {content}
        </Card>
      </Link>
    );
  }

  return (
    <Card padding="sm" radius="md" className={cardClassName}>
      {content}
    </Card>
  );
}
