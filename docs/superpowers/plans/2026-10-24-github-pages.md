# GitHub Pages Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for the implementation and verification below.

**Goal:** Prepare the migrated static React app for GitHub Pages with working editor deep links and automatic deployment from `main`.

**Architecture:** Use `HashRouter` without a basename; the physical asset path is handled by Vite's build base. A GitHub Actions workflow builds the site with the base path reported by `configure-pages`, then publishes only `dist/` through the official Pages actions.

**Tech Stack:** Existing Vite/React/pnpm, GitHub Actions, GitHub Pages.

**Spec:** The user accepted the proposed repository-base build, hash routing, Actions workflow, and GitHub Pages setup in this conversation.

## Constraints and review focus

- Preserve the prior migration and unrelated local changes.
- Keep local development and Docker builds working at `/`; the workflow supplies the Pages base path.
- Hash routes must work on a plain static server without an SPA fallback.
- Use the pinned pnpm version and frozen lockfile, and publish only compiled site assets.
- Deploy on pushes to `main` or manual dispatch, with Pages permissions limited to the jobs that need them.
- Account for a custom-domain root base as well as `/hrracetrack-maker/`.

## Implementation and verification

- [x] Reproduce the current failure for a direct `#/builder` visit on a plain static server.
- [x] Switch the entry point to hash routing and update navigation/deployment documentation.
- [x] Add the build/deploy workflow using verified action releases and Pages base-path metadata.
- [x] Verify frozen installation, type checking, and root/project-base builds; browser-test direct links, refresh, navigation, and editor functions on a static server.
- [x] Review the workflow and final diff, enable the repository's Actions-based Pages source, and report what remains to publish the local changes.

## Verification and deployment state

- `pnpm install --frozen-lockfile`, `pnpm build`, and the `/hrracetrack-maker/` base build passed. Builds retain the existing 515 kB bundle-size warning.
- Before the router change, direct `#/builder` access served the home screen. Afterward, plain-static-server browser checks passed at both `/` and `/hrracetrack-maker/`, including direct access, refresh, navigation, unknown hash routes, assets, canvas rendering, curve creation/rename, keyboard modes, export, and image upload/reset; no browser errors were reported.
- `actionlint` 1.7.12 passed. Official action commit pins and input/output compatibility were verified. The independent review found no issues.
- Enabled GitHub Pages with `build_type: workflow` for `niuee/hrracetrack-maker`. GitHub reports the configured URL as `https://niuee.github.io/hrracetrack-maker/`.
- The first hosted deployment runs after the workflow and migrated app are merged into `main`; configuring Pages and opening the feature PR do not deploy the site.
