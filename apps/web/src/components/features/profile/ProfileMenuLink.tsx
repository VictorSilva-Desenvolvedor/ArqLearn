"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

interface ProfileMenuLinkProps {
  href?: string;
  icon: string;
  label: string;
}

export function ProfileMenuLink({ href, icon, label }: ProfileMenuLinkProps) {
  const content = (
    <Card
      padding="md"
      radius="lg"
      interactive={Boolean(href)}
      className={cn("flex items-center gap-sm", !href && "opacity-60")}
    >
      <Icon name={icon} className="text-2xl text-on-surface-variant" />
      <span className="flex-1 font-body-lg text-body-lg text-on-surface">{label}</span>
      {href ? (
        <Icon name="chevron_right" className="text-on-surface-variant" />
      ) : (
        <span className="font-label text-label-caps text-on-surface-variant">Em breve</span>
      )}
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
