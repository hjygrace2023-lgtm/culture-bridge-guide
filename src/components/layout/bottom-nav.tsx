import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/** Restrained, typographic navigation — the content stays dominant. */
const items = [
  { to: "/", label: "Home" },
  { to: "/analyse", label: "Analyse" },
  { to: "/compose", label: "Compose" },
  { to: "/saved", label: "Saved" },
  { to: "/review", label: "Review" },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-foreground bg-background">
      <ul className="mx-auto flex max-w-3xl items-stretch">
        {items.map((item, i) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          return (
            <li key={item.to} className={cn("flex-1", i > 0 && "border-l-2 border-foreground")}>
              <Link
                to={item.to}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors duration-200",
                  active ? "bg-foreground text-background" : "text-foreground/70 hover:bg-yellow hover:text-foreground",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    active ? "bg-yellow" : "bg-foreground/30",
                  )}
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
