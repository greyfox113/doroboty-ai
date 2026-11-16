import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PostHogErrorBoundary } from "@posthog/react";
import { App } from "./features/prototype/app";
import posthog from "posthog-js";
import "./app/globals.css";

const posthogToken = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

if (posthogToken && posthogHost) {
  posthog.init(posthogToken, {
    api_host: posthogHost,
    defaults: "2026-08-30",
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: false,
    },
    logs: {
      serviceName: "doroboty-ai-case-web",
      environment: import.meta.env.MODE,
    },
  });
  posthog.logger.info("browser log capture initialized", { runtime: "web" });
} else if (import.meta.env.DEV) {
  const missingVariable = posthogToken
    ? "VITE_PUBLIC_POSTHOG_HOST"
    : "VITE_PUBLIC_POSTHOG_PROJECT_TOKEN";

  throw new Error(
    `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PostHogErrorBoundary>
      <App />
    </PostHogErrorBoundary>
  </StrictMode>,
);
