"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { TopProgressBar } from "@/components/ui/top-progress-bar";
import {
  endNavigation,
  startNavigation,
  useNavigationPending,
} from "@/lib/navigation";

function isInternalNavigation(anchor: HTMLAnchorElement): boolean {
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }
  if (anchor.hasAttribute("download")) return false;
  if (anchor.target && anchor.target !== "_self") return false;

  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    const current = window.location.pathname + window.location.search;
    const next = url.pathname + url.search;
    return next !== current;
  } catch {
    return false;
  }
}

function handleNavigationIntent(event: Event) {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const anchor = target.closest("a");
  if (!anchor || !isInternalNavigation(anchor)) return;

  if (event instanceof MouseEvent) {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  }

  startNavigation();
}

function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pending = useNavigationPending();

  useEffect(() => {
    endNavigation();
  }, [pathname, searchParams]);

  useEffect(() => {
    document.addEventListener("pointerdown", handleNavigationIntent, true);
    document.addEventListener("click", handleNavigationIntent, true);
    window.addEventListener("popstate", startNavigation);

    return () => {
      document.removeEventListener("pointerdown", handleNavigationIntent, true);
      document.removeEventListener("click", handleNavigationIntent, true);
      window.removeEventListener("popstate", startNavigation);
    };
  }, []);

  return <TopProgressBar active={pending} />;
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
