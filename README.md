# hrracetrack-maker

[Live Demo](https://vntchang.dev/racetrack-maker).

This is essentially a customized bezier curve editor that I wrote for my horse racing simulation game. The editing logic follows the one in Blender. This is a tool for me to create tracks based on real-life racecourses that I can use in the physics simulation engine. Currently, the menus and buttons are all in Chinese.  

To Pan and Zoom 
- Mouse and Keyboard: Hold MetaKey (command/windows) and drag the mouse to pan. Scroll the wheel to zoom.
- Trackpad: Pinch to Zoom, two-finger slide to pan

There are two modes in the editor. (Use ⌥ Option (or Alt) to switch between modes) (Press G to initiate the grab mode to move stuff you selected; curve selected would be highlight in red; control points selected would be filled)
- Object Mode: You can select curves using the list on the right side of the screen. Selected curves would be highlighted in green. You can move around the selected curves (the entire curve). You can double-click the card in the curves list to rename the curve to your liking.
- Edit Mode: You can drag the selected control point. You can either extend or prepend the curve. 

I realized that I probably have to write an entire user manual in order to fully explain how the editor work. Maybe even a tutorial. So The detail would not be in this readme. But I think some of the control logic is fairly intuitive, so maybe you can just give it a spin and you'll pick it up real fast. I doubt this tool is useful for anyone other than me though. 

## Development

Use Node.js 20.19+ or 22.12+ and pnpm 10.17.0 (the version pinned in `package.json`). This is a client-side React app; Vite provides the development server and React Fast Refresh.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:5173, or go directly to http://localhost:5173/#/builder. `pnpm start` also starts Vite. To choose another port, run `pnpm dev --port 3001`. The old server's `.env`/`PORT` setting is no longer used.

To check TypeScript separately:

```sh
pnpm typecheck
```

## Build and preview

```sh
pnpm build
pnpm preview
```

The build checks TypeScript and writes the static site to `dist/`. Vite copies `public/` assets into that directory automatically. Preview is available at http://localhost:4173; it is for checking the build locally.

For production, deploy `dist/` to a static host. The app uses hash routes such as `/#/builder`, so direct visits and refreshes work without server rewrites or an application backend.

For a deployment under a subdirectory, set the base path when building:

```sh
pnpm build --base=/hrracetrack-maker/
pnpm preview --base=/hrracetrack-maker/
```

Serve the files under `/hrracetrack-maker/`; the editor URL is `/hrracetrack-maker/#/builder`. Vite's base controls the asset URLs, while the routes live after `#`.

## GitHub Pages

The [deployment workflow](.github/workflows/deploy-pages.yml) builds and publishes `dist/` on pushes to `main`. It can also be run from **Actions → Deploy to GitHub Pages → Run workflow** once the workflow is on the default branch.

1. In the repository's **Settings → Pages**, select **GitHub Actions** as the source.
2. Commit the app and workflow changes and push or merge them into `main`.
3. Wait for the **Deploy to GitHub Pages** workflow to finish. Its deployment output links to the published site.

Without a custom domain, the site URL is `https://niuee.github.io/hrracetrack-maker/`, and the editor is at `https://niuee.github.io/hrracetrack-maker/#/builder`.

The workflow uses Node.js 22, the pnpm version from `package.json`, and the frozen lockfile. It obtains the asset base path from GitHub Pages, so repository paths and custom-domain root deployments are both supported. Docker, nginx, and a Vite server are not needed on GitHub Pages.

## Docker

The image builds the app with Vite and serves the static output at the domain root using nginx, including the SPA fallback.

```sh
docker build -t hrracetrack-maker .
docker run --rm -p 3001:3001 hrracetrack-maker
```

Open http://localhost:3001. To change the container's listening port, set `PORT` and map that port, for example `docker run --rm -e PORT=8080 -p 8080:8080 hrracetrack-maker`.
