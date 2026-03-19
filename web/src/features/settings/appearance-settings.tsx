"use client";

import * as React from "react";
import { Sun, Moon, Monitor, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFetchAppearance, useUpdateAppearance } from "@/hooks/settings";
import { useUIStore } from "@/stores/ui-store";

type Theme = "light" | "dark" | "system";
type FontSize = "compact" | "default" | "comfortable";

interface AccentColor {
  name: string;
  value: string;
  class: string;
}

const accentColors: AccentColor[] = [
  { name: "Blue", value: "blue", class: "bg-blue-500" },
  { name: "Indigo", value: "indigo", class: "bg-indigo-500" },
  { name: "Violet", value: "violet", class: "bg-violet-500" },
  { name: "Emerald", value: "emerald", class: "bg-emerald-500" },
  { name: "Rose", value: "rose", class: "bg-rose-500" },
  { name: "Orange", value: "orange", class: "bg-orange-500" },
];

const themeOptions: {
  value: Theme;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    value: "light",
    label: "Light",
    icon: Sun,
    description: "A clean, bright theme for daytime use.",
  },
  {
    value: "dark",
    label: "Dark",
    icon: Moon,
    description: "Easy on the eyes for low-light environments.",
  },
  {
    value: "system",
    label: "System",
    icon: Monitor,
    description: "Automatically match your system preference.",
  },
];

const fontSizeOptions: {
  value: FontSize;
  label: string;
  description: string;
  previewClass: string;
}[] = [
  {
    value: "compact",
    label: "Compact",
    description: "Tighter spacing, smaller text.",
    previewClass: "text-xs",
  },
  {
    value: "default",
    label: "Default",
    description: "Standard spacing and text size.",
    previewClass: "text-sm",
  },
  {
    value: "comfortable",
    label: "Comfortable",
    description: "More breathing room and larger text.",
    previewClass: "text-base",
  },
];

const AppearanceSkeleton = () => (
  <div className="flex flex-col gap-6 animate-fade-in">
    {[1, 2, 3].map((i) => (
      <div key={i} className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="skeleton-shimmer h-5 w-20 rounded bg-muted" />
        <div className="skeleton-shimmer h-3 w-48 rounded bg-muted" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((j) => (
            <div key={j} className="skeleton-shimmer h-32 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const AppearanceSettings = () => {
  const { data: prefs, isLoading } = useFetchAppearance();
  const updateAppearanceMutation = useUpdateAppearance();
  const setStoreTheme = useUIStore((s) => s.setTheme);

  if (isLoading || !prefs) {
    return <AppearanceSkeleton />;
  }

  const handleThemeChange = (theme: Theme) => {
    updateAppearanceMutation.mutate({ theme }, {
      onSuccess: () => toast.success(`Theme set to ${theme}`),
    });
    // Sync with UI store
    if (theme === "dark") {
      setStoreTheme("dark");
    } else if (theme === "light") {
      setStoreTheme("light");
    } else {
      // system: use media query
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setStoreTheme(prefersDark ? "dark" : "light");
    }
  };

  const handleAccentChange = (color: string) => {
    updateAppearanceMutation.mutate({ accent_color: color }, {
      onSuccess: () => toast.success(`Accent color updated`),
    });
  };

  const handleFontSizeChange = (fontSize: FontSize) => {
    updateAppearanceMutation.mutate({ font_size: fontSize }, {
      onSuccess: () => toast.success(`Font size set to ${fontSize}`),
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Theme */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Choose your preferred color scheme.</CardDescription>
            </div>
            {updateAppearanceMutation.isPending && (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = prefs.theme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  className={cn(
                    "relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/40 hover:bg-muted/50 hover:-translate-y-0.5",
                  )}
                >
                  {isSelected && (
                    <div className="bg-primary absolute top-2 right-2 flex size-5 items-center justify-center rounded-full animate-fade-in-scale">
                      <Check className="text-white size-3" />
                    </div>
                  )}
                  {/* Preview */}
                  <div
                    className={cn(
                      "flex h-20 w-full items-end overflow-hidden rounded-lg border",
                      option.value === "dark"
                        ? "border-zinc-700 bg-zinc-900"
                        : option.value === "light"
                          ? "border-zinc-200 bg-white"
                          : "border-zinc-300 bg-gradient-to-r from-white to-zinc-900",
                    )}
                  >
                    <div
                      className={cn(
                        "flex w-full items-center gap-1.5 p-2",
                        option.value === "dark"
                          ? "bg-zinc-800"
                          : option.value === "light"
                            ? "bg-zinc-100"
                            : "bg-zinc-200",
                      )}
                    >
                      <div
                        className={cn(
                          "h-1.5 w-6 rounded-full",
                          option.value === "dark" ? "bg-zinc-600" : "bg-zinc-300",
                        )}
                      />
                      <div
                        className={cn(
                          "h-1.5 w-4 rounded-full",
                          option.value === "dark" ? "bg-zinc-600" : "bg-zinc-300",
                        )}
                      />
                      <div className="ml-auto h-1.5 w-3 rounded-full bg-primary" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <Icon className="text-muted-foreground size-4" />
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="text-muted-foreground text-center text-xs">
                      {option.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Accent color */}
      <Card>
        <CardHeader>
          <CardTitle>Accent Color</CardTitle>
          <CardDescription>
            Pick a primary color for buttons, links, and highlights.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {accentColors.map((color) => {
              const isSelected = prefs.accent_color === color.value;
              return (
                <button
                  key={color.value}
                  onClick={() => handleAccentChange(color.value)}
                  className={cn(
                    "group flex flex-col items-center gap-1.5 rounded-xl border-2 px-4 py-3 transition-all duration-200",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "hover:border-border border-transparent hover:-translate-y-0.5",
                  )}
                >
                  <div
                    className={cn(
                      "relative flex size-10 items-center justify-center rounded-full transition-transform group-hover:scale-110",
                      color.class,
                    )}
                  >
                    {isSelected && <Check className="size-4 text-white animate-fade-in-scale" />}
                  </div>
                  <span className="text-xs font-medium">{color.name}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Font size */}
      <Card>
        <CardHeader>
          <CardTitle>Font Size</CardTitle>
          <CardDescription>Adjust the text size and spacing density.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {fontSizeOptions.map((option) => {
              const isSelected = prefs.font_size === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleFontSizeChange(option.value)}
                  className={cn(
                    "relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all duration-200",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/40 hover:bg-muted/50 hover:-translate-y-0.5",
                  )}
                >
                  {isSelected && (
                    <div className="bg-primary absolute top-2 right-2 flex size-5 items-center justify-center rounded-full animate-fade-in-scale">
                      <Check className="text-white size-3" />
                    </div>
                  )}
                  {/* Preview text */}
                  <div
                    className={cn(
                      "bg-muted/50 flex h-12 w-full items-center justify-center rounded-lg",
                      option.previewClass,
                    )}
                  >
                    <span className="text-muted-foreground">Aa</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="text-muted-foreground text-xs">{option.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
