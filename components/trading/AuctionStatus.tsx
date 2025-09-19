"use client";
import { cn } from "@/lib/utils";

export function AuctionStatus({
  start,
  end,
  status, // 'open' | 'reserved' | 'sold' | 'canceled'
}: {
  start: string | null;
  end: string | null;
  status: "open" | "reserved" | "sold" | "canceled";
}) {
  const now = new Date();
  const started  = !start || now >= new Date(start);
  const finished = !!end && now > new Date(end);

  let label = "";
  let style = "bg-muted text-muted-foreground";

  if (status !== "open" || finished) {
    label = "Encerrado";
    style = "bg-destructive/15 text-destructive";
  } else if (!started) {
    label = "Aguardando início";
    style = "bg-amber-100 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200";
  } else {
    label = "Aceitando lances";
    style = "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200";
  }

  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", style)}>
      {label}
    </span>
  );
}
