import posthog from "posthog-js";

/** CSS class that tells PostHog Autocapture to ignore an element and everything inside it. */
export const NO_CAPTURE = "ph-no-capture";

export type AnalyticsEnv = { VITE_POSTHOG_KEY?: string; VITE_POSTHOG_HOST?: string };

/**
 * PostHog settings for the public demo (Event Scout). Analytics run only when a project key is
 * provided at build time, so local runs, tests and participant packages send nothing.
 * Autocapture records page views and clicks, never typed values; private areas are excluded
 * with NO_CAPTURE. Memory persistence: no cookies or localStorage, no session recording.
 */
export function analyticsConfig(env: AnalyticsEnv) {
  const key = env.VITE_POSTHOG_KEY?.trim();
  if (!key) return null;
  return {
    key,
    options: {
      api_host: env.VITE_POSTHOG_HOST?.trim() || "https://us.i.posthog.com",
      autocapture: true,
      // PostHog's automatic page views ignore changes after "#", so the router reports each
      // hash route change through trackPageview() instead.
      capture_pageview: false,
      capture_pageleave: true,
      persistence: "memory" as const,
      disable_session_recording: true,
      person_profiles: "identified_only" as const,
      mask_all_element_attributes: false,
      mask_all_text: false,
    },
  };
}

let enabled = false;

export function initAnalytics(env: AnalyticsEnv = import.meta.env as AnalyticsEnv) {
  const config = analyticsConfig(env);
  if (!config) return false;
  posthog.init(config.key, config.options);
  enabled = true;
  return true;
}

/** Records one $pageview for the current hash route; does nothing when analytics are off. */
export function trackPageview() {
  if (enabled) posthog.capture("$pageview", { $current_url: window.location.href });
}
