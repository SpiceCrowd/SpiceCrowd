"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type NavStackState = {
  paths: string[];
  index: number;
};

export default function HistoryNavButtons() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { canGoBack, canGoForward } = useMemo(() => {
    if (!mounted || typeof window === "undefined") {
      return { canGoBack: false, canGoForward: false };
    }

    const stackKey = "sc_nav_stack_state";
    const raw = window.sessionStorage.getItem(stackKey);
    let state: NavStackState = { paths: [pathname || "/"], index: 0 };

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as NavStackState;
        if (Array.isArray(parsed?.paths) && typeof parsed?.index === "number") {
          state = {
            paths: parsed.paths.filter((path) => typeof path === "string" && path.length > 0),
            index: Math.max(0, Math.min(parsed.index, parsed.paths.length - 1)),
          };
        }
      } catch {
        // Use default state when storage is malformed.
      }
    }

    const currentPath = pathname || "/";

    if (!state.paths.length) {
      state = { paths: [currentPath], index: 0 };
    } else if (state.paths[state.index] !== currentPath) {
      const adjacentBack = state.index > 0 && state.paths[state.index - 1] === currentPath;
      const adjacentForward = state.index < state.paths.length - 1 && state.paths[state.index + 1] === currentPath;

      if (adjacentBack) {
        state = { ...state, index: state.index - 1 };
      } else if (adjacentForward) {
        state = { ...state, index: state.index + 1 };
      } else {
        const nextPaths = state.paths.slice(0, state.index + 1);
        nextPaths.push(currentPath);
        state = { paths: nextPaths, index: nextPaths.length - 1 };
      }
    }

    window.sessionStorage.setItem(stackKey, JSON.stringify(state));

    const isHome = currentPath === "/";
    return {
      canGoBack: !isHome && state.index > 0,
      canGoForward: !isHome && state.index < state.paths.length - 1,
    };
  }, [mounted, pathname]);

  if (!canGoBack && !canGoForward) {
    return null;
  }

  return (
    <>
      {canGoBack ? (
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          title="Back"
          className="fixed left-4 top-[62%] z-50 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[color:var(--brand-gold)]/55 bg-[color:var(--brand-gold)]/20 text-lg font-bold text-[color:var(--brand-deep-green)] shadow-xl shadow-black/20 backdrop-blur transition hover:bg-[color:var(--brand-gold)]/35 sm:left-6"
        >
          {"<"}
        </button>
      ) : null}

      {canGoForward ? (
        <button
          type="button"
          onClick={() => router.forward()}
          aria-label="Go forward"
          title="Forward"
          className="fixed right-4 top-[62%] z-50 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[color:var(--brand-gold)]/55 bg-[color:var(--brand-deep-green)] text-lg font-bold text-[color:var(--brand-gold)] shadow-xl shadow-black/25 backdrop-blur transition hover:bg-[color:var(--brand-maroon-700)] sm:right-6"
        >
          {">"}
        </button>
      ) : null}
    </>
  );
}
