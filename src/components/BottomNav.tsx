import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, Compass, PlayCircle, BookOpen, UserCircle } from "lucide-react";

const NAV = [
  { to: "/", icon: LayoutGrid, label: "Home" },
  { to: "/search", icon: Compass, label: "Search" },
  { to: "/shorts", icon: PlayCircle, label: "Shorts" },
  { to: "/news", icon: BookOpen, label: "News" },
  { to: "/profile", icon: UserCircle, label: "Profile" },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-xl safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
        {NAV.map(({ to, icon: Icon, label }) => {
          const exact = to === "/";
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-0 px-3 py-1 transition-all"
            >
              <div
                className={`grid h-7 w-7 place-items-center rounded-full transition-all ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon
                  className={`h-4.5 w-4.5 transition-all ${active ? "scale-110" : ""}`}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </div>
              <span
                className={`text-[9px] font-bold tracking-tight transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
