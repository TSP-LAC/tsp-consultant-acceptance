# TSP consultant acceptance-test landing page

A standalone static starting point for the first consultant acceptance test. It does not change the SAP development framework or project template.

## Run locally

```sh
python3 -m http.server 8080 --bind 127.0.0.1 --directory /Users/guidoreboredo/dev/tsp-consultant-acceptance
```

Open http://localhost:8080/.

Facilitator mode: http://localhost:8080/?facilitator=true.

## Files and deployment

- `index.html`: semantic page, feedback form and facilitator template.
- `styles.css`: responsive layout, focus states and print styles.
- `app.js`: single-source functional specification, copy/download actions and local drafts.
- `logo.png`: supplied TSP logo for the header and browser icon.

Deploy those four files together to any static host. No build, dependencies, database or application backend is needed. This page loads no remote assets, analytics or tracking. External destinations open in a new tab.

### GitHub Pages

`.github/workflows/pages.yml` deploys automatically when changes are pushed to `main`. In the standalone repository, select **Settings → Pages → Source → GitHub Actions**. The workflow publishes only `index.html`, `styles.css`, `app.js` and `logo.png`; development checks and screenshots are excluded from the website artifact.

All site asset paths are relative, so the page works under a GitHub Pages repository path. Add `?facilitator=true` to the published URL for facilitator mode. Deployment does not change the SAP framework or project template repositories.

Hosting visibility must be agreed before deployment. On GitHub Free for organizations, Pages requires a public repository. A private repository on a paid plan does not, by itself, make the published website private; restricted Pages access requires supported enterprise configuration. Feedback continues to stay in the visitor's browser; it is not uploaded to GitHub.

## Local data

Feedback and facilitator observations are stored separately in this browser's local storage. They are never submitted automatically. Copy or download the Markdown output to provide it to the facilitator through your agreed internal channel. Clear this site's browser data to remove saved drafts. Private mode, browser settings or local file URLs may prevent saving; the page reports this and still allows exporting current answers.

Clipboard access works on localhost and HTTPS. A legacy clipboard fallback and a selectable-text dialog handle browsers that block automatic copying. JavaScript is needed for specification rendering and the interactive tools. A static server is recommended over opening `index.html` directly.

Facilitator mode is a client-side convenience, not access control. System access and GitHub permissions are managed externally. The supplied external destinations require the consultant's existing authorized access.

## Verification

`verify.cjs` is an optional browser check using Playwright and an installed Chrome browser. It is not loaded by the page and adds no runtime dependency. With Playwright available to Node, start the local server above and run:

```sh
node verify.cjs
```

If Playwright is installed elsewhere, set `PLAYWRIGHT_MODULE` to its package directory. Set `TEST_URL` to test a different local URL. The check exercises all copy buttons, specification completeness, feedback exports, local persistence, facilitator mode, destination wiring, keyboard focus, responsive widths and clipboard/storage failure handling. Screenshots and a report are saved in `verification/`. External destination checks validate the supplied URLs and new-tab behavior; they do not sign into GitHub or SAP.
