# Own-work examples in the application (E1) and DoRoboty theme

## Intent and acceptance

Owner request (13.11.2026): port the E1 path from the discovery prototype into this fork and keep the owner's own DoRoboty design ("tak, przenieś zachowaj mój design projektu").

Discovery link: opportunity OP1 ("Chcę lepiej dopasowanych kandydatów i zanim zaproszę kogoś na rozmowę, chcę wiedzieć, co ta osoba zrobiła sama i z jakim skutkiem"), idea I1 (optional competence form), experiment E1.

Acceptance:

- The application form shows three numbered sections on one page: CV and answer (step 1), optional "Twoja praca" with two own-work questions derived from the job category (step 2), approval and send (step 3).
- Examples are written by the candidate; "Popraw literówki" only applies a typo/punctuation dictionary with undo. It is not a language model.
- If any example is filled, the candidate must tick the own-work declaration; skipping the step changes nothing, including Match Score.
- The employer list has a "Wszystkie / Z przykładami" filter and a signal on cards with examples. The record shows examples in a human tile and the note "Co ta osoba zrobiła sama i z jakim skutkiem?", saved per application and persisted.
- Existing flows (apply, draft, withdraw, stage changes, publishing, settings import/export) keep working; older saved state parses because new fields are optional.
- Data stays synthetic and local.

## Design system conflict (recorded deliberately)

AGENTS.md/CLAUDE.md require Poster People for new and changed screens. The repository owner explicitly chose to keep the DoRoboty design system from the discovery project instead. `src/app/doroboty-theme.css` is imported last and re-maps host, shadcn and `--pp-*` tokens (cream background, warm-white cards, navy Inter headings, black primary, sea-green links, red only for errors, 6/8/12 px radii). The primary and outline button variants in `src/components/ui/button.tsx` now use `--primary`. The immutable kit in docs/design-system/agent-kit is unchanged; its checks still apply to the kit, but the running UI intentionally no longer matches Poster People.

Button states (owner approval 13.11.2026, "Zatwierdzam"): primary hover navy #192F52 with elevation and 1px lift, active sea green #1E5F67 without shadow; outline/secondary hover navy text and border with elevation, active sea green on #DDEDEC. 120 ms, no lift under reduced motion, no elevation on touch (hover: none), disabled buttons do not react. `Button` exposes `data-variant` so the theme can target variants.

## Validation

See the final report of this task; record executed commands here once Node 24 is available on this machine.
