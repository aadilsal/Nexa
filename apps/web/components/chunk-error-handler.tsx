"use client";

import { useEffect } from "react";

const CHUNK_RELOAD_KEY = "nexa-chunk-reload";

function isChunkLoadError(value: unknown): boolean {
  if (!value) return false;
  const message =
    typeof value === "string"
      ? value
      : value instanceof Error
        ? value.message
        : typeof value === "object" &&
            value !== null &&
            "message" in value &&
            typeof (value as { message: unknown }).message === "string"
          ? (value as { message: string }).message
          : "";
  return /chunkloaderror|loading chunk|failed to fetch dynamically imported module/i.test(
    message,
  );
}

function reloadOnceForChunkError() {
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return;
  sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  window.location.reload();
}

export function ChunkErrorHandler() {
  useEffect(() => {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);

    function onError(event: ErrorEvent) {
      if (isChunkLoadError(event.message) || isChunkLoadError(event.error)) {
        reloadOnceForChunkError();
      }
    }

    function onRejection(event: PromiseRejectionEvent) {
      if (isChunkLoadError(event.reason)) {
        reloadOnceForChunkError();
      }
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
