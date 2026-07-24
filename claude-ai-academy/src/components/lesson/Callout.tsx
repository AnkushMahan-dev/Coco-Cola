import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalloutData } from "@/content/types";

const config = {
  info: {
    icon: Info,
    container:
      "border-info/30 bg-info/5 dark:bg-info/10 [&>div>svg]:text-info",
  },
  tip: {
    icon: Lightbulb,
    container:
      "border-success/30 bg-success/5 dark:bg-success/10 [&>div>svg]:text-success",
  },
  warning: {
    icon: AlertTriangle,
    container:
      "border-warning/40 bg-warning/5 dark:bg-warning/10 [&>div>svg]:text-warning",
  },
  danger: {
    icon: ShieldAlert,
    container:
      "border-destructive/40 bg-destructive/5 dark:bg-destructive/10 [&>div>svg]:text-destructive",
  },
  success: {
    icon: CheckCircle2,
    container:
      "border-success/30 bg-success/5 dark:bg-success/10 [&>div>svg]:text-success",
  },
} as const;

export function Callout({
  type,
  title,
  children,
  className,
}: {
  type: CalloutData["type"];
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const { icon: Icon, container } = config[type];
  return (
    <div
      role="note"
      className={cn("rounded-lg border p-4", container, className)}
    >
      <div className="flex gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold leading-tight">{title}</p>
          <div className="text-sm leading-relaxed text-muted-foreground">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
