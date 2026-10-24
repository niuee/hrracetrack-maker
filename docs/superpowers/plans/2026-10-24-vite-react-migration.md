# Vite and React Migration Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task. Track completion with the checkboxes below.

**Goal:** Replace Webpack and the static Express backend with Vite, and upgrade React to the latest stable release.

**Architecture:** Keep the existing browser application and public assets. Vite serves the SPA during development and produces a static `dist/` build. The existing Docker deployment serves that build with nginx and SPA fallback, without an application backend.

**Tech Stack:** TypeScript, Vite 8.3.5, React/React DOM 19.3.1, existing Material UI 5, pnpm.

**Spec:** The user's migration request in this conversation; preserve existing application behavior and local edits.

## Constraints and decisions

- Work in the existing feature branch so the user's uncommitted dependency and HTML changes remain part of the migration. Leave unrelated editor settings untouched. The user subsequently requested committing, pushing, and opening a PR.
- Use Node.js `^20.19.0 || >=22.12.0`, matching Vite's requirement.
- Retain pnpm and the existing non-tooling dependency versions.
- Use the automatic JSX transform and React 19 types across all frontend files.
- Use Vite's default port 5173, with CLI port overrides; remove the obsolete server environment sample.
- Preserve `/`, `/builder`, and unknown-route redirects. Support Vite's base path for existing subdirectory deployments.
- Check real builds, type checking, HTTP routes/assets, and browser interactions instead of adding tests that only duplicate configuration.

## Review focus

- Direct navigation and refresh on `/builder` must render the editor.
- Returning home and unknown URLs must retain working navigation without Express.
- Public icons and bundled assets must work at both root and a configured base path.
- React 19 and hot reload must preserve the canvas/editor interactions.
- Docker must serve static production output with SPA fallback and no old backend references.

## Task 1: Migrate tooling and React

- [x] Inspect the working tree, backend, frontend imports, and official release metadata; establish the passing TypeScript baseline.
- [x] Replace package scripts/dependencies, configure Vite, move the HTML entry to the root, and update TypeScript configuration.
- [x] Install dependencies, observe React 19 type failures, and apply only required compatibility changes.
- [x] Replace server redirects with client routing, remove Webpack/backend/copy-script files, and verify build/type checking.

## Task 2: Keep deployment and documentation working

- [x] Update Docker to build with pnpm/Vite and serve static files through nginx; update the Docker context exclusions.
- [x] Document install, dev, typecheck, build, preview, port overrides, base paths, and Docker commands.

## Task 3: Verify and review

- [x] Verify frozen-lockfile installation, production build, direct routes, public assets, browser navigation, curve editing, and hot reload.
- [x] Check a subdirectory build and Docker where local tooling permits.
- [x] Obtain a fresh code review while finishing independent verification, address material findings, and inspect the final diff.

## Verification results

- `pnpm install --frozen-lockfile` and `pnpm build` passed. The build reports a 514 kB JavaScript chunk warning; bundle optimization is outside this migration.
- React 19 initially produced ten JSX/ref type errors; the compatibility changes resolve all ten without suppressing library checks.
- Playwright checks passed against Vite development, production preview, and a production build with `--base=/racetrack-maker/`: all public assets, home/editor navigation, direct loads and refreshes, unknown-route redirects, canvas rendering, curve creation/renaming, keyboard mode switching, switches, JSON export, and image upload/reset. No browser errors were reported.
- Browser checks reproduced and verified fixes for Material UI 5 icon interoperability, the return-home path, and Fast Refresh losing curves or duplicating keyboard handlers.
- A fresh read-only review found no critical or important issues. Its whitespace finding was corrected, and `git diff --check` passes.
- Docker configuration was reviewed, but image execution could not be tested because the local Docker daemon is stopped.
- Camera pan/zoom still reset during Fast Refresh because they are render-local values; preserving viewport state is outside this migration. Unrouted legacy demo pages are type-checked but were not browser-tested.
- The follow-up [GitHub Pages plan](2026-10-24-github-pages.md) changes browser routes to hash routes, superseding the physical `/builder` URLs above.
