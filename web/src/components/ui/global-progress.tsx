"use client";

import { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useIsMutating } from "@tanstack/react-query";
import NProgress from "nprogress";

NProgress.configure({
  showSpinner: false,
  speed: 300,
  minimum: 0.08,
  trickleSpeed: 120,
});

const RouteWatcher = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      NProgress.done();
    }
    prevPathRef.current = pathname;
  }, [pathname, searchParams]);

  return null;
};

export const useStartProgress = () => {
  return () => NProgress.start();
};

export const GlobalProgress = () => {
  const mutationCount = useIsMutating();
  const isActive = mutationCount > 0;

  return (
    <>
      <Suspense fallback={null}>
        <RouteWatcher />
      </Suspense>
      {isActive && <div className="global-progress-bar" role="progressbar" aria-label="Loading" />}
    </>
  );
};
