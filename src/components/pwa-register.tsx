"use client";

import { useEffect } from "react";

/** Por defeito não regista SW — evita HTML/cache antigo após deploys (404 em /_next/static). */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NEXT_PUBLIC_ENABLE_PWA !== "true") return;

    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .catch((error) => {
        console.error("serviceWorker:", error);
      });
  }, []);

  return null;
}
