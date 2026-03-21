"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useUIStore } from "@/stores/ui-store";
import { useAppGate } from "@/lib/app-gate";
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

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { hasWorkspace, appearance } = useAppGate();

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  const isOnboardingRoute = pathname === ONBOARDING_ROUTE;
  const isMeetingRoom = /^\/meetings\/[^/]+$/.test(pathname);

  useKeyboardShortcuts();

  useEffect(() => {
    if (appearance?.theme) setTheme(resolveTheme(appearance.theme));
  }, [appearance?.theme, setTheme]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  useEffect(() => {
    if (!appearance?.font_size) return;
    const root = document.documentElement;
    root.classList.remove("font-compact", "font-comfortable");
    if (appearance.font_size === "compact") root.classList.add("font-compact");
    else if (appearance.font_size === "comfortable") root.classList.add("font-comfortable");
  }, [appearance?.font_size]);

  useEffect(() => {
    if (appearance?.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [appearance?.theme, setTheme]);

  useEffect(() => {
    if (isSignedIn && !hasWorkspace && !isOnboardingRoute && !isAuthRoute) {
      router.replace("/onboarding");
    } else if (isSignedIn && hasWorkspace && isOnboardingRoute) {
      router.replace("/boards");
    }
  }, [isSignedIn, hasWorkspace, pathname, isAuthRoute, isOnboardingRoute, router]);

  if (isAuthRoute) {
    return (
      <div className="bg-background flex h-screen items-center justify-center overflow-hidden">
        <div className="animate-fade-in">{children}</div>
      </div>
    );
  }

  if (isOnboardingRoute) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center overflow-auto py-8">
        <div className="animate-fade-in">{children}</div>
      </div>
    );
  }

  if (!isSignedIn) return null;

  if (isMeetingRoom) {
    return (
      <div className="bg-background h-screen overflow-hidden">
        {children}
        <CommandPalette />
      </div>
    );
  }

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
