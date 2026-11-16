import { describe, expect, it } from "vitest";
import { analyticsConfig } from "./analytics";

describe("PostHog analytics config", () => {
  it("stays off without a project key", () => {
    expect(analyticsConfig({})).toBeNull();
    expect(analyticsConfig({ VITE_POSTHOG_KEY: "  " })).toBeNull();
  });

  it("enables autocapture and router-driven page views on the US host without cookies or recording", () => {
    const config = analyticsConfig({ VITE_POSTHOG_KEY: "phc_example" })!;
    expect(config.options).toMatchObject({
      api_host: "https://us.i.posthog.com",
      autocapture: true,
      capture_pageview: false,
      persistence: "memory",
      disable_session_recording: true,
    });
  });
});
