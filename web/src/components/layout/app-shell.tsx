"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useUIStore } from "@/stores/ui-store";
import { useFetchWorkspace } from "@/hooks/workspace";
import { useFetchAppearance } from "@/hooks/settings";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { TopNav } from "./top-nav";
import { LeftNav } from "./left-nav";
import { CommandPalette } from "./command-palette";

const AUTH_ROUTES = ["/login", "/signup"];
const ONBOARDING_ROUTE = "/onboarding";

const resolveTheme = (pref: "light" | "dark" | "system"): "light" | "dark" => {
  if (pref === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return pref;
};

const LoadingSplash = () => (
  <div className="bg-background flex h-screen items-center justify-center">
    <div className="flex flex-col items-center gap-4 animate-fade-in">
      <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/20">
        <span className="text-sm font-bold text-indigo-500">CS</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="size-1.5 rounded-full bg-indigo-500/60 animate-pulse" />
        <div className="size-1.5 rounded-full bg-indigo-500/40 animate-pulse [animation-delay:150ms]" />
        <div className="size-1.5 rounded-full bg-indigo-500/20 animate-pulse [animation-delay:300ms]" />
      </div>
    </div>
  </div>
);

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  const isOnboardingRoute = pathname === ONBOARDING_ROUTE;
  const isMeetingRoom = /^\/meetings\/[^/]+$/.test(pathname);

  // Fetch workspace + appearance prefs (only when signed in)
  const { data: workspace, isLoading: wsLoading } = useFetchWorkspace();
  const hasWorkspace = !!workspace && typeof workspace === "object" && "id" in workspace;

  const setWorkspaceReady = useUIStore((s) => s.setWorkspaceReady);

  const { data: appearance, isLoading: appearanceLoading } = useFetchAppearance();

  useKeyboardShortcuts();

  // Sync workspace readiness so other hooks can gate on it
  useEffect(() => {
    setWorkspaceReady(hasWorkspace);
  }, [hasWorkspace, setWorkspaceReady]);

  // Sync theme from DB prefs → UI store → DOM
  useEffect(() => {
    if (appearance?.theme) {
      setTheme(resolveTheme(appearance.theme));
    }
  }, [appearance?.theme, setTheme]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  // Sync font size from DB prefs → DOM
  useEffect(() => {
    if (!appearance?.font_size) return;
    const root = document.documentElement;
    root.classList.remove("font-compact", "font-comfortable");
    if (appearance.font_size === "compact") root.classList.add("font-compact");
    else if (appearance.font_size === "comfortable") root.classList.add("font-comfortable");
  }, [appearance?.font_size]);

  // Listen for system theme changes when pref is "system"
  useEffect(() => {
    if (appearance?.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [appearance?.theme, setTheme]);

  // Onboarding routing
  useEffect(() => {
    if (!isLoaded || wsLoading) return;

    if (isSignedIn && !hasWorkspace && !isOnboardingRoute && !isAuthRoute) {
      router.replace("/onboarding");
    } else if (isSignedIn && hasWorkspace && isOnboardingRoute) {
      router.replace("/boards");
    }
  }, [
    isLoaded,
    wsLoading,
    isSignedIn,
    hasWorkspace,
    pathname,
    isAuthRoute,
    isOnboardingRoute,
    router,
  ]);

  // Loading while Clerk + workspace + appearance initialize
  const isInitializing =
    !isLoaded ||
    (isSignedIn && !isAuthRoute && !isOnboardingRoute && (wsLoading || appearanceLoading));

  if (isInitializing) {
    return <LoadingSplash />;
  }

  // Auth pages — minimal centered layout
  if (isAuthRoute) {
    return (
      <div className="bg-background flex h-screen items-center justify-center overflow-hidden">
        <div className="animate-fade-in">{children}</div>
      </div>
    );
  }

  // Onboarding — minimal centered layout
  if (isOnboardingRoute) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center overflow-auto py-8">
        <div className="animate-fade-in">{children}</div>
      </div>
    );
  }

  // Not signed in — Clerk middleware will redirect
  if (!isSignedIn) return null;

  // Meeting room — full screen
  if (isMeetingRoom) {
    return (
      <div className="bg-background h-screen overflow-hidden">
        {children}
        <CommandPalette />
      </div>
    );
  }

  // Dashboard layout — only render nav/sidebar when workspace is resolved
  return (
    <div className="bg-background flex h-screen overflow-hidden">
      {hasWorkspace && (
        <aside className="border-border bg-sidebar hidden w-56 shrink-0 flex-col border-r sm:flex">
          <LeftNav />
        </aside>
      )}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {hasWorkspace && <TopNav />}
        <main className="flex-1 overflow-auto">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
      {hasWorkspace && <CommandPalette />}
    </div>
  );
};
