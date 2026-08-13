import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Conversational bubble.
 *
 * Used wherever content is *something said*: the user's own words on the right,
 * suggested/mock wording on the left. Analytical cards stay as cards.
 */
export function Bubble({
  side,
  label,
  children,
  className,
}: {
  side: "user" | "assistant";
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  const isUser = side === "user";
  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[92%] sm:max-w-[85%]", isUser ? "text-right" : "text-left")}>
        {label && (
          <p className="mb-1 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed text-left",
            isUser ? "bubble-user rounded-br-sm" : "bubble-assistant rounded-bl-sm",
            className,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
