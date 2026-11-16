# Runtime typography

The application uses one typeface, Inter, from the local npm package `@fontsource-variable/inter` (SIL Open Font License 1.1, license in `node_modules/@fontsource-variable/inter/LICENSE`). `src/app/globals.css` imports its variable-weight CSS, so Vite bundles the woff2 files with the build and the app makes no remote font requests. The family name is `"Inter Variable"`; `--ds-font` in `src/app/doroboty/tokens.css` falls back to `Inter` and system sans.

Geist Serif and Arial are no longer used at runtime (owner decision, see `docs/tasks/doroboty-design-port.md`).

## Retained historical assets

`timeless-sans-variable.woff2` and `timeless-grotesk-web-variable.woff2` are earlier assets kept in the repository. They are not loaded by the application.
