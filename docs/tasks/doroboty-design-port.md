# Port the DoRoboty design system and page patterns

## Intent

Owner feedback after the E1 release: the theme from `own-work-examples-e1.md` only re-mapped tokens. Offer pages, search, cards and the homepage still looked like Poster People. Production measurements showed Geist Serif offer titles, Arial in search and offer, `pp-*` cards with black 1 px outlines and 24 px radii, and `people.png` in the hero. Owner: "miałeś użyć mojego designu", "illustracje, design system, nic się nie zgadza".

Scope chosen by the owner: "Wygląd + układ wzorców". Source of truth: `doroboty-discovery/design-system/` (README, tokens.css, components.css, komponenty.md, ilustracje.md) and the pattern pages in `doroboty-discovery/landing/` (index, oferty, oferta, aplikuj, dla-firm, logowanie, panel-firmy, regulamin, landing.css, jobs-data.js). Nothing from `CODE/landing-doroboty` (robo-TY) is used.

## Design system conflict (recorded deliberately)

AGENTS.md and CLAUDE.md require Poster People for every new or changed screen. The repository owner explicitly chose her own DoRoboty design system instead (13.11.2026: "zachowaj mój design projektu"; this task: "Wygląd + układ wzorców"). This task therefore does **not** restore Poster People:

- Runtime UI follows DoRoboty: `src/app/doroboty/tokens.css` and `components.css` are unchanged copies of the discovery design system (only `--ds-font` points to the bundled Inter Variable); page layout lives in `src/app/doroboty/pages.css` with a `dr-` prefix.
- `poster-people.css` became `host.css` (layout recipes only, DoRoboty values); `marketplace*.css` were removed together with the `pp-*` markup.
- The immutable Poster People kit in `docs/design-system/agent-kit` is unchanged and its checks still run. AGENTS.md/CLAUDE.md were not edited; updating them is the owner's decision.

## Acceptance criteria

1. Every screen uses one typeface, Inter, loaded from a local bundled file. No Geist Serif, Arial, black card outlines, 18–24 px radii, pink palette or `people.png` at runtime.
2. K2 colours, K3 cards (8 px, `--ds-line`, light shadow), K1 buttons with the approved hover/active states, and the black "Ty" tile for human words.
3. `ilu-*` illustrations are local files under `src/assets/illustrations/`, used only on low-density screens as described in `ilustracje.md` (home hero ilu-02, how to apply/step 2 ilu-08, companies ilu-06/ilu-03/ilu-04, footer ilu-09, empty states ilu-01). None on the employer list or candidate record.
4. Pattern layouts on existing routes:
   - `/#/`: candidate hero "Wiesz, czego szukają. Pokazujesz, co umiesz.", latest K3 offers, how to apply, CTA for companies.
   - K3 offer card: meta → title → facts → key competence → requirements with Konieczne/Mile widziane → actions incl. "Czytaj więcej".
   - `/#/oferty/:slug`: O roli (with Doświadczenie), Wymagania, Proces rekrutacji in 6 steps, Benefity with an education budget, O firmie with culture/values and address, Jak aplikujesz, Podobne oferty.
   - `/#/oferty`: filters "Odległość od domu" and "Z dodatkiem relokacyjnym".
   - `/#/aplikuj/:slug`: three steps (Dane i CV, Twoja praca opcjonalnie, Sprawdź i wyślij).
   - New `/#/dla-firm` and `/#/regulamin`; `/#/auth/sign-in` in the login layout (still a person-selection simulation); `/#/app/kandydaci` in the panel-firmy layout.
5. Offer and company data gain only optional fields (Zod). Older saved scenarios still parse; missing segments are filled from the seed record with the same id at read time. All data is fictional.
6. E1 path unchanged: step "Twoja praca", filter "Z przykładami", recruiter note. All earlier flows keep working; hash routes, localStorage and Zod are preserved. No real authentication.
7. Each ported screen compared with its pattern at 1440 and 390 px (side-by-side screenshots in `docs/design-port/screens/`): no horizontal scroll, controls at least 44 px, visible focus, no serious axe violations.
8. FEATURES.md and the Playwright journeys describe the new look and layout. `CI=1 ./scripts/verify` passes.

## Deliberate differences from the patterns

- The application form keeps one page with three step cards and a step indicator instead of the pattern's step-by-step wizard, so drafts, validation focus and existing journeys keep working. Open question for the owner.
- Sign-in stays a choice of fictional people (no e-mail/password fields): real login is a separate task.
- The employer panel stays inside the workspace shell (sidebar). Decisions and the recruiter note remain on the application record.
- The listing keeps the existing map view, pagination and removable filter chips; there is no sort control.
- Match Score: one turquoise label (`--ds-accent-2`) for every value instead of colour bands (owner request 16.11.2026: "tło label powinno być z design systemu - turkus").

## Validation

Executed on 16.11.2026 (Intel macOS, Node 24.22.3):

- `CI=1 ./scripts/verify`: exit 0. Prettier, design-system kit check, ESLint, TypeScript, Vitest (37 tests, incl. new distance/relocation filters and legacy-state seed fill), participant packet check, production build and Playwright (38 journeys, incl. new: DoRoboty design tokens/typeface/local assets, offer segments, distance and relocation filters, public pages + axe at 1440/390, employer panel).
- Side-by-side screenshots of 8 screens × 1440/390 px against the running patterns (`docs/design-port/screens/`). For all 16: no horizontal scroll, no visible control under 44 px, no serious/critical axe violations, no console errors, only "Inter Variable" as computed font.
- Not verified: Vercel preview/production, real devices, screen readers.
