import { cn } from "@/lib/utils/cn";

interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
  className?: string;
  // VIP "Mestre Arquiteto" (a pedido do usuário): borda dourada no lugar da primária.
  vip?: boolean;
}

export function Avatar({ src, name, size = 32, className, vip = false }: AvatarProps) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const borderClass = vip ? "border-secondary" : "border-primary";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatar de URL externa arbitrária, sem domínio fixo para configurar em next/image
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={cn("rounded-full border-2 object-cover", borderClass, className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full border-2 bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold",
        borderClass,
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
