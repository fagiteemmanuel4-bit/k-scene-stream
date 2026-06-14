import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { useEffect } from "react";
import { BottomNav } from "../components/BottomNav";
import { AuthProvider } from "../lib/auth";
import { StreakOverlay } from "../components/StreakOverlay";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="text-center">
        <h1 className="text-7xl font-black text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-gray-800">Scene not found</h2>
        <p className="mt-2 text-sm text-gray-500">This page took a dramatic exit.</p>
        <a
          href="/"
          className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
        >
          Go home
        </a>
      </div>
    </div>
  ),
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StreakOverlay />
        <main className="min-h-screen bg-gray-50 pb-20">
          <Outlet />
        </main>
        <BottomNav />
      </AuthProvider>
    </QueryClientProvider>
  );
}
