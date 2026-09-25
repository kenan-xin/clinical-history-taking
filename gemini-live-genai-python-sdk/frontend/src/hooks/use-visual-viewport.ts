import { useEffect } from "react";
import type { Screen } from "@/hooks/use-clinical-session";

/**
 * Keeps the app inside the visible area when the phone keyboard opens,
 * like the design's visualViewport handling. Broadcasts a viewport-fit
 * event so the chat log can re-stick to the bottom.
 */
export function useVisualViewportFit(screen: Screen) {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const fit = () => {
      const r = document.documentElement.style;
      r.setProperty("--app-h", `${vv.height}px`);
      r.setProperty("--app-top", `${vv.offsetTop}px`);
      window.dispatchEvent(new CustomEvent("app:viewport-fit"));
    };
    vv.addEventListener("resize", fit);
    vv.addEventListener("scroll", fit);
    fit();
    return () => {
      vv.removeEventListener("resize", fit);
      vv.removeEventListener("scroll", fit);
    };
  }, [screen]);
}
