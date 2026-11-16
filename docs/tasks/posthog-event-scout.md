# PostHog analytics with Autocapture (Event Scout)

## Intent

Course quest Event Scout: see a page view and an Autocapture click from the production address (https://doroboty-ai-lac.vercel.app) in PostHog Activity → Live. Owner's PostHog project is in the US region.

## Acceptance criteria

- `posthog-js` is initialised only when `VITE_POSTHOG_KEY` is set at build time (Vercel → Settings → Environment Variables, Production). Without it (local runs, tests, participant packages) nothing is sent and the "no external requests" journeys still pass.
- Host `https://us.i.posthog.com` (override: `VITE_POSTHOG_HOST`). The key is a public project key; it is not committed or pasted into conversations.
- Autocapture is on. One `$pageview` per hash route change (PostHog's own page views ignore the part after `#`, so the router reports them), plus `$pageleave`.
- Private areas are excluded with `ph-no-capture`: the whole workspace (`/app/...`, sidebar), the application form (`/aplikuj/...`) and the account menu. Typed values are never captured.
- Privacy defaults: memory persistence (no cookies, no localStorage), no session recording, anonymous events (`person_profiles: identified_only`, nothing identified). The privacy page says what is collected.

## Validation

- Unit tests: `src/lib/analytics.test.ts` (off without key; US host, autocapture, memory persistence, no recording).
- Local build with a dummy key, browser with PostHog requests intercepted: `$pageview` for `/`, `#/oferty`, `#/auth/sign-in`, `#/app`, `#/aplikuj/...`; `$autocapture` clicks on "Lead", "Więcej ofert" and "Wejdź jako …"; no click events from the application form; the typed answer text never appears in any payload; no cookies or `ph_` localStorage keys.
- `CI=1 ./scripts/verify`: see the pull request.
- Not verified here: events arriving in the owner's PostHog project (needs her key in Vercel and a production deploy).

## Follow-ups

- Production-readiness report: `data-lifecycle` and `observability` change now that analytics data leaves the browser; refresh the report after deployment.
- Optional: in PostHog project settings enable "Discard client IP data".
