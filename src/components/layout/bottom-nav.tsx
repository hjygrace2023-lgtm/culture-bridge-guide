import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, Home, Layers, PenLine, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/analyse", label: "Analyse", icon: Compass },
  { to: "/compose", label: "Compose", icon: PenLine },
  { to: "/saved", label: "Saved", icon: Layers },
  { to: "/about", label: "Method", icon: BookOpen },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-card/90 backdrop-blur-md"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-between px-2 py-1.5 sm:px-6">
        {items.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-all duration-200",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className={cn("h-[18px] w-[18px] transition-transform", active && "scale-110")} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
