import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/constants";

const toneStyles: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-600",
  info: "bg-blue-50 text-blue-600",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-red-50 text-red-600",
  purple: "bg-violet-50 text-violet-600",
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: Tone;
  hint?: string;
  href?: string;
}

export function StatCard({ label, value, icon, tone = "neutral", hint, href }: StatCardProps) {
  const inner = (
    <Card
      className={cn(
        "p-4 transition-shadow",
        href && "cursor-pointer hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg [&_svg]:size-5", toneStyles[tone])}>
          {icon}
        </div>
      </div>
    </Card>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}
