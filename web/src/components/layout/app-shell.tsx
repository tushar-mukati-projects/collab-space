"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import NProgress from "nprogress";
import { useUIStore } from "@/stores/ui-store";
import { useAppGate } from "@/lib/app-gate";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { TopNav } from "./top-nav";
import { LeftNav } from "./left-nav";
import { CommandPalette } from "./command-palette";
import { AiChat } from "./ai-chat";

const AUTH_ROUTES = ["/login", "/signup"];
const ONBOARDING_ROUTE = "/onboarding";

const resolveTheme = (pref: "light" | "dark" | "system"): "light" | "dark" => {
  if (pref === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return pref;
};

const ACCENT_PRIMARY: Record<string, { light: string; dark: string }> = {
  blue: { light: "oklch(0.55 0.2 260)", dark: "oklch(0.7 0.16 260)" },
  indigo: { light: "oklch(0.49 0.24 275)", dark: "oklch(0.68 0.2 275)" },
  violet: { light: "oklch(0.52 0.26 300)", dark: "oklch(0.7 0.2 300)" },
  emerald: { light: "oklch(0.6 0.15 160)", dark: "oklch(0.72 0.15 160)" },
  rose: { light: "oklch(0.58 0.22 15)", dark: "oklch(0.7 0.18 15)" },
  orange: { light: "oklch(0.65 0.19 55)", dark: "oklch(0.75 0.17 55)" },
};

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { hasWorkspace, appearance } = useAppGate();

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  const isOnboardingRoute = pathname === ONBOARDING_ROUTE;
  const isMeetingRoom = /^\/meetings\/[^/]+$/.test(pathname);

  useKeyboardShortcuts();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (href?.startsWith("/") && !href.startsWith("//") && href !== pathname) {
        NProgress.start();
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  useEffect(() => {
    if (appearance?.theme) setTheme(resolveTheme(appearance.theme as "light" | "dark" | "system"));
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
    const root = document.documentElement;
    const preset = appearance?.accent_color ? ACCENT_PRIMARY[appearance.accent_color] : undefined;
    if (!preset) {
      root.style.removeProperty("--primary");
      return;
    }
    root.style.setProperty("--primary", theme === "dark" ? preset.dark : preset.light);
  }, [appearance?.accent_color, theme]);

  useEffect(() => {
    if (appearance?.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [appearance?.theme, setTheme]);

  useEffect(() => {
    if (isSignedIn && hasWorkspace && (isAuthRoute || isOnboardingRoute)) {
      router.replace("/boards");
    } else if (isSignedIn && !hasWorkspace && !isOnboardingRoute && !isAuthRoute) {
      router.replace("/onboarding");
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

  if (!isAuthLoaded || !isSignedIn) return null;

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
      {hasWorkspace && <AiChat />}
    </div>
  );
};
