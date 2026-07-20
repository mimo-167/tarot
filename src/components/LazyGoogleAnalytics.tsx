"use client";

import { useEffect } from "react";

const GA_MEASUREMENT_ID = "G-MQ2VLF2X8F";
const GA_SCRIPT_ID = "google-analytics-script";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[][];
  gtag?: (...args: unknown[]) => void;
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
  cancelIdleCallback?: (handle: number) => void;
};

function loadGoogleAnalytics() {
  if (document.getElementById(GA_SCRIPT_ID)) return;

  const analyticsWindow = window as AnalyticsWindow;
  analyticsWindow.dataLayer ??= [];
  analyticsWindow.gtag = (...args: unknown[]) => analyticsWindow.dataLayer?.push(args);
  analyticsWindow.gtag("js", new Date());
  analyticsWindow.gtag("config", GA_MEASUREMENT_ID);

  const script = document.createElement("script");
  script.id = GA_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

/**
 * Keeps analytics out of the critical rendering and hydration window. Real-user
 * interactions bring the load forward, but still leave the triggering input free
 * to paint before the third-party script is parsed.
 */
export function LazyGoogleAnalytics() {
  useEffect(() => {
    let delayTimer: number | undefined;
    let idleHandle: number | undefined;
    let scheduledDelay: number | undefined;
    const analyticsWindow = window as AnalyticsWindow;

    const schedule = (delay: number) => {
      if (document.getElementById(GA_SCRIPT_ID)) return;
      if (scheduledDelay !== undefined && scheduledDelay <= delay) return;
      if (delayTimer !== undefined) window.clearTimeout(delayTimer);
      scheduledDelay = delay;
      delayTimer = window.setTimeout(() => {
        delayTimer = undefined;
        if (analyticsWindow.requestIdleCallback) {
          idleHandle = analyticsWindow.requestIdleCallback(loadGoogleAnalytics, { timeout: 2_000 });
        } else {
          loadGoogleAnalytics();
        }
      }, delay);
    };

    const onInteraction = () => schedule(1_500);
    const onLoad = () => schedule(6_000);
    const interactionEvents: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "touchstart"];
    interactionEvents.forEach((eventName) =>
      window.addEventListener(eventName, onInteraction, { once: true, passive: true }),
    );

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    return () => {
      if (delayTimer !== undefined) window.clearTimeout(delayTimer);
      if (idleHandle !== undefined) analyticsWindow.cancelIdleCallback?.(idleHandle);
      window.removeEventListener("load", onLoad);
      interactionEvents.forEach((eventName) => window.removeEventListener(eventName, onInteraction));
    };
  }, []);

  return null;
}
