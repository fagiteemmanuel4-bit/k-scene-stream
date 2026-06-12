import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Zap, Newspaper, User } from "lucide-react";

const NAV = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/shorts", icon: Zap, label: "Shorts" },
  { to: "/news", icon: Newspaper, label: "News" },
  { to: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-xl safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {NAV.map(({ to, icon: Icon, label }) => {
          const exact = to === "/";
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link key={to} to={to} className="flex flex-col items-center gap-0.5 px-3 py-1.5 transition-all">
              <div
                className={`grid h-8 w-8 place-items-center rounded-full transition-all ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 transition-all ${active ? "scale-110" : ""}`} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span className={`text-[10px] font-semibold tracking-wide transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
