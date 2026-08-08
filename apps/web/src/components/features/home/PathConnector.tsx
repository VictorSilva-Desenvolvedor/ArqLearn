import { cn } from "@/lib/utils/cn";

interface PathConnectorProps {
  dashed?: boolean;
}

export function PathConnector({ dashed = false }: PathConnectorProps) {
  return (
    <div
      className={cn("absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 z-0", !dashed && "bg-primary")}
      style={
        dashed
          ? {
              backgroundImage: "linear-gradient(var(--color-primary) 33%, rgba(255,255,255,0) 0%)",
              backgroundPosition: "right",
              backgroundSize: "2px 12px",
              backgroundRepeat: "repeat-y",
            }
          : undefined
      }
    />
  );
}
