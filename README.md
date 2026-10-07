# TSP consultant onboarding and acceptance page

A standalone static page that takes a Senior SAP consultant from zero to their first TSP Framework development. It does not change the SAP development framework or project template.

The page is organised in two parts:

- **Part A — Get ready (steps 01–06, do this once):** the new workflow as a process diagram of one working cycle, tool installation (VS Code, Git, Python 3.11+ and the Framework's Python packages, Claude Code in Manual permission mode, ABAP FS, GitHub access), the IX1 connection with **Checkpoint 1** (VS Code → ABAP FS → IX1, read-only), the ABAP FS MCP connection with **Checkpoint 2** (Claude Code → MCP → ABAP FS → IX1, read-only) and a **Ready Check**. Not part of the measured exercise.
- **Part B — The exercise (steps 07–11, measured):** the mission and Functional Specification, project creation from the Human Acceptance Template with the Solution Identity repository name, `Start a new project.`, how to work with Claude, and completion.

Feedback (step 12) and facilitator observations record setup and exercise metrics separately. A troubleshooting section is organised by layer.

## Content boundaries

- The tutorial teaches environment, tools, mental model, exercise context and responsibilities. The Framework teaches process, next action, governance and lifecycle. The page never explains gates, approval phrases, state files or the expected architecture, and never resolves the two intentional functional open items.
- The Functional Specification (`specification` in `app.js`) is pinned by the frozen acceptance harness. Its clipboard export must stay byte-identical (sha256 `76e87f00…dafef`); `verify.cjs` enforces this.
- **Human Acceptance Template.** Projects are created from the private template `TSP-LAC/tsp-sap-development-template-acceptance`, not the production template. It contains the unmodified distributable template (`dist/tsp-sap-development-template/`) of Framework Human Acceptance Candidate `427a101df08b8555a8fac06e29a5aef2a241f727`, plus `ACCEPTANCE-PROVENANCE.md` (metadata only). Consultants never see branch or SHA mechanics.
- **Solution ID.** For this acceptance every consultant uses `ACC-001-<TSP username>`. Repository names follow the Framework's Solution Identity Contract `<CLIENT>_<SOLUTION-ID>_<SHORT-DESCRIPTION>`; the page builds `TSP_ACC-001-<username>_Employee-Anniversary-Recognition-Feed` with the same validation as the Framework helper.
- **Python bootstrap.** Part A installs exactly the packages in the candidate's `requirements.txt` (`PyYAML>=6.0,<7`, `openpyxl>=3.1,<4`, `python-docx>=1.2,<2`) before the measured exercise starts.
- **Secrets and infrastructure.** IX1 URL and client are shown as facilitator-provided values and never published. The SFTP credential alias is `SFTPDEMO_TSP`, created by each consultant in their own isolated BTP trial tenant. Passwords, SFTP credentials and other secrets never appear on the page or in the repository.

## Run locally

```sh
python3 -m http.server 8080 --bind 127.0.0.1 --directory /Users/guidoreboredo/dev/tsp-consultant-acceptance
```

Open http://localhost:8080/. Facilitator mode: http://localhost:8080/?facilitator=true.

## Files and deployment

- `index.html`: semantic page, diagrams (HTML/CSS), feedback form and facilitator template.
- `how-the-workflow-works.svg`: process diagram for step 02 (one working cycle across You, Claude Code, where the work lives and the TSP Framework). It is exported from the editable source `diagrams/how-the-workflow-works.drawio`; edit the source in draw.io and re-export the SVG (without the title, which the page already shows). The source is not deployed.
- `styles.css`: responsive layout, platform switch, progress navigation, focus states and print styles.
- `app.js`: single-source Functional Specification, copy/download actions, Windows/macOS switch, setup ticks, progress navigation, repository-name builder and local drafts.
- `TSP Blue - PNG.png` / `TSP White - PNG.png`: supplied transparent logos (blue in the header, white on the Part B band).
- `favicon.svg`: browser icon embedding the supplied blue mark.

Deploy `index.html`, `styles.css`, `app.js`, `favicon.svg`, `how-the-workflow-works.svg` and both PNG logos together to any static host. No build, dependencies, database or backend. The page loads no remote assets, analytics or tracking; a strict Content Security Policy forbids inline script and style. External destinations open in a new tab.

### GitHub Pages

`.github/workflows/pages.yml` deploys automatically when changes are pushed to `main`. In the standalone repository, select **Settings → Pages → Source → GitHub Actions**. The workflow publishes only the files listed above. All asset paths are relative. Add `?facilitator=true` to the published URL for facilitator mode.

Hosting visibility must be agreed before deployment. On GitHub Free for organizations, Pages requires a public repository; a private repository on a paid plan does not, by itself, make the website private. Keep internal system addresses off the page for that reason.

## Local data

Each item is stored separately in this browser's local storage and never submitted:

- `tsp-acceptance-setup-v1`: Part A setup ticks (mirrored between section checks, checkpoints and the Ready Check). **Clear setup ticks** resets them.
- `tsp-acceptance-os-v1`: Windows/macOS choice.
- `tsp-acceptance-feedback-v2` / `tsp-acceptance-observations-v2`: feedback and facilitator drafts.

The page marks setup steps as done only from the consultant's own ticks, and never marks exercise steps as done; exercise progress belongs to the Framework. Copy or download the Markdown feedback to hand it over through the agreed internal channel. If storage is blocked, the page says so and exports still work.

Clipboard access works on localhost and HTTPS, with a legacy fallback and a selectable-text dialog.

## Facilitator

The facilitator helps with credentials, account access, the IX1 URL/client/user, confirming each consultant's TSP username, GitHub permissions, local installation, BTP trial access and SFTP secret delivery. The facilitator does not tell the consultant the next Framework phase, the technical architecture, how to satisfy a Framework step or the two functional answers. A process question is answered with: “Ask Claude: What should I do next?”

## Verification

`verify.cjs` is an optional browser check using Playwright and an installed Chrome browser. It is not loaded by the page. With Playwright available to Node, start the local server above and run:

```sh
node verify.cjs
```

If Playwright is installed elsewhere, set `PLAYWRIGHT_MODULE` to its package directory. Set `TEST_URL` to test a different URL. Set `FRAMEWORK_REPO` to a local Framework repository containing candidate `427a101` to also check the Solution ID against the candidate's own naming helper, the Part A packages against its `requirements.txt`, and the frozen Functional Specification source. The check covers journey order and navigation, setup/exercise separation, the tooling model, both checkpoints, MCP setup, acceptance boundaries (no gate vocabulary, approval phrases, answers or old repository naming), the repository-name builder, every copy action on both platforms, the pinned specification hash, setup ticks and progress, feedback and facilitator exports, external links, keyboard accessibility, seven responsive widths, clipboard/storage failure handling and a source security review. Screenshots and a report are saved in `verification/`. External links are checked for destination and new-tab behaviour; authenticated GitHub, SAP, Claude and BTP access is not exercised.
