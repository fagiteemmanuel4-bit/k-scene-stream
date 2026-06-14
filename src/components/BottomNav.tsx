import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Zap, Newspaper, User } from "lucide-react";

const NAV = [
  { to: "/",        icon: Home,      label: "Home"    },
  { to: "/search",  icon: Search,    label: "Search"  },
  { to: "/shorts",  icon: Zap,       label: "Shorts"  },
  { to: "/news",    icon: Newspaper, label: "News"    },
  { to: "/profile", icon: User,      label: "Profile" },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 4px)" }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1.5">
        {NAV.map(({ to, icon: Icon, label }) => {
          const exact = to === "/";
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-0.5 px-3 py-1 transition-all"
            >
              <div
                className={`grid h-8 w-8 place-items-center rounded-xl transition-all ${
                  active ? "bg-primary/10 text-primary" : "text-gray-400"
                }`}
              >
                <Icon
                  className="h-5 w-5 transition-all"
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </div>
              <span
                className={`text-[10px] font-semibold tracking-wide transition-colors ${
                  active ? "text-primary" : "text-gray-400"
                }`}
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
