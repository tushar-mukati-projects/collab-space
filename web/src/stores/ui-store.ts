import { create } from "zustand";

interface UIState {
  theme: "light" | "dark";
  commandPaletteOpen: boolean;
  workspaceReady: boolean;
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
  toggleCommandPalette: () => void;
  setWorkspaceReady: (ready: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: "light",
  commandPaletteOpen: false,
  workspaceReady: false,

  toggleTheme: () => {
    set((state) => ({
      theme: state.theme === "light" ? "dark" : "light",
    }));
  },

  setTheme: (theme: "light" | "dark") => {
    set({ theme });
  },

  toggleCommandPalette: () => {
    set((state) => ({
      commandPaletteOpen: !state.commandPaletteOpen,
    }));
  },

  setWorkspaceReady: (ready: boolean) => {
    set({ workspaceReady: ready });
  },
}));
