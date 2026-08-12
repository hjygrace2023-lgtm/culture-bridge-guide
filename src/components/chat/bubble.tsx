import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Color-coded chat bubbles: user right + tinted, AI left + card surface. */
export function Bubble({
  side,
  children,
  className,
  delay = 0,
}: {
  side: "user" | "ai";
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const user = side === "user";
  return (
    <div className={cn("animate-rise flex w-full", user ? "justify-end" : "justify-start")} style={{ animationDelay: `${delay}ms` }}>
      <div
        className={cn(
          "bubble-base max-w-[92%] border sm:max-w-[85%]",
          user
            ? "rounded-br-md border-transparent bg-bubble-user text-bubble-user-foreground"
            : "rounded-bl-md border-border/70 bg-bubble-ai text-bubble-ai-foreground",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function BubbleTitle({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold">
      {icon}
      {children}
    </h2>
  );
}
