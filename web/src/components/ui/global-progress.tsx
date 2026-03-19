"use client";

import { useIsMutating } from "@tanstack/react-query";

export const GlobalProgress = () => {
  const mutationCount = useIsMutating();

  if (mutationCount === 0) return null;

  return <div className="global-progress-bar" role="progressbar" aria-label="Loading" />;
};
