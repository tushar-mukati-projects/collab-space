"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { useUIStore } from "@/stores/ui-store";
import { AlertCircle, RefreshCw } from "lucide-react";

interface MeResponse {
  id: string;
  name: string;
  email: string;
  avatar: string;
  workspace_id: string | null;
  role: string | null;
}

const useBootstrap = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const enabled = isLoaded && !!isSignedIn;

  const user = useQuery({
    queryKey: ["user", "me"],
    queryFn: async () => (await axiosInstance.get<MeResponse>("/users/me")).data,
    enabled,
    retry: 2,
    staleTime: 5 * 60_000,
  });

  const hasWorkspace = !!user.data?.workspace_id;

  const appearance = useQuery({
    queryKey: ["settings", "appearance"],
    queryFn: async () => (await axiosInstance.get("/settings/appearance")).data,
    enabled: enabled && hasWorkspace,
    retry: 1,
    staleTime: 5 * 60_000,
  });

  return {
    isLoaded,
    isSignedIn,
    user: user.data ?? null,
    hasWorkspace,
    appearance: appearance.data ?? null,
    isLoading: !isLoaded || (enabled && (user.isLoading || (hasWorkspace && appearance.isLoading))),
    isError: user.isError,
    error: user.error,
    refetch: user.refetch,
  };
};

interface AppGateContextValue {
  user: MeResponse | null;
  hasWorkspace: boolean;
  appearance: { theme?: string; accent_color?: string; font_size?: string } | null;
}

const AppGateContext = React.createContext<AppGateContextValue>({
  user: null,
  hasWorkspace: false,
  appearance: null,
});

export const useAppGate = () => React.useContext(AppGateContext);

export const AppGate = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded, isSignedIn, user, hasWorkspace, appearance, isLoading, isError, refetch } =
    useBootstrap();
  const setWorkspaceReady = useUIStore((s) => s.setWorkspaceReady);

  React.useEffect(() => {
    setWorkspaceReady(hasWorkspace);
  }, [hasWorkspace, setWorkspaceReady]);

  if (!isLoaded || isLoading) return null;

  if (isSignedIn && isError) {
    return (
      <div className="bg-background flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="bg-destructive/10 flex size-12 items-center justify-center rounded-full">
            <AlertCircle className="text-destructive size-6" />
          </div>
          <div>
            <p className="text-sm font-medium">Unable to connect to server</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Please check your connection and try again.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            <RefreshCw className="size-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppGateContext.Provider value={{ user, hasWorkspace, appearance }}>
      {children}
    </AppGateContext.Provider>
  );
};
