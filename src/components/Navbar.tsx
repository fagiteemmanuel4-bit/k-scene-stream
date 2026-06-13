import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, Bookmark, Rabbit } from "lucide-react";
import { useEffect, useState } from "react";

export function Navbar() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [q, setQ] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 12);
    h();
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate({ to: "/search", search: { q: q.trim() } });
  };

  return (
    <header
      className="fixed top-0 z-50 w-full transition-all duration-300"
      style={{
        backgroundColor: scrolled
          ? "color-mix(in oklab, var(--color-background) 88%, transparent)"
          : "transparent",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        borderBottom: scrolled ? "1px solid var(--color-border)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lift ring-2 ring-primary/15">
            <Rabbit className="h-5 w-5" strokeWidth={2.4} />
          </div>
          <span className="text-lg font-black tracking-tight">
            K<span className="text-primary">·</span>Scene
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 text-sm font-medium md:flex">
          {[
            { to: "/", label: "Home" },
            { to: "/watchlist", label: "Watchlist" },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-3 py-1.5 text-foreground/70 transition hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: true }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <form
          onSubmit={submit}
          className="ml-auto flex flex-1 items-center justify-end gap-2 sm:flex-none"
        >
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search K-dramas…"
              className="w-full rounded-full border bg-card py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Link
            to="/watchlist"
            className="grid h-9 w-9 place-items-center rounded-full border bg-card transition hover:border-primary hover:text-primary md:hidden"
            aria-label="Watchlist"
          >
            <Bookmark className="h-4 w-4" />
          </Link>
        </form>
      </div>
      {pathname !== "/" && <div className="h-px w-full" />}
    </header>
  );
}
