"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/ui-store";

export const useKeyboardShortcuts = () => {
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === "k") {
        e.preventDefault();
        toggleCommandPalette();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCommandPalette]);
};
