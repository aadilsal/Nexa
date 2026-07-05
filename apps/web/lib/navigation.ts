"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useSyncExternalStore } from "react";

type Listener = () => void;

let pending = false;
let startedAt = 0;
const listeners = new Set<Listener>();

const MIN_VISIBLE_MS = 120;

function emit() {
  listeners.forEach((listener) => listener());
}

export function startNavigation() {
  if (!pending) {
    startedAt = Date.now();
  }
  pending = true;
  emit();
}

export function endNavigation() {
  if (!pending) return;

  const elapsed = Date.now() - startedAt;
  const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

  window.setTimeout(() => {
    pending = false;
    emit();
  }, remaining);
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return pending;
}

function getServerSnapshot() {
  return false;
}

export function useNavigationPending() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useAppRouter() {
  const router = useRouter();

  const push = useCallback(
    (...args: Parameters<typeof router.push>) => {
      startNavigation();
      return router.push(...args);
    },
    [router],
  );

  const replace = useCallback(
    (...args: Parameters<typeof router.replace>) => {
      startNavigation();
      return router.replace(...args);
    },
    [router],
  );

  const back = useCallback(() => {
    startNavigation();
    router.back();
  }, [router]);

  return useMemo(
    () => ({ ...router, push, replace, back }),
    [router, push, replace, back],
  );
}
