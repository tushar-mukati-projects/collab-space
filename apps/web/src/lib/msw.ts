"use client";

import { useEffect, useState } from "react";

export const useMswReady = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      import("@/mocks/browser").then(({ worker }) => {
        worker.start({ onUnhandledRequest: "bypass" }).then(() => {
          setReady(true);
        });
      });
    } else {
      setReady(true);
    }
  }, []);

  return ready;
};
