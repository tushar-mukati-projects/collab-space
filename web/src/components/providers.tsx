"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { AxiosAuthProvider } from "@/lib/axios-auth-provider";
import { AppGate } from "@/lib/app-gate";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GlobalProgress } from "@/components/ui/global-progress";
import { Toaster } from "sonner";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AxiosAuthProvider>
        <AppGate>
          <TooltipProvider delay={300}>
            <GlobalProgress />
            {children}
          </TooltipProvider>
        </AppGate>
      </AxiosAuthProvider>
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{
          className: "animate-fade-in-scale",
          duration: 3000,
        }}
      />
    </QueryClientProvider>
  );
};
