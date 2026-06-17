import { Badge } from "@/components/ui/badge";
import type { Tone } from "@/lib/constants";

const toneToVariant: Record<Tone, "neutral" | "info" | "success" | "warning" | "danger" | "purple"> = {
  neutral: "neutral",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
  purple: "purple",
};

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return <Badge variant={toneToVariant[tone]}>{label}</Badge>;
}
