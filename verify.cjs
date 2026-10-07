// Optional development check; Playwright is not a dependency of the static page.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const base = process.env.TEST_URL || 'http://localhost:8080/';
const output = path.join(__dirname, 'verification');
// sha256 of the Functional Specification export pinned by the frozen acceptance harness.
const PINNED_SPEC_SHA256 = '76e87f00cd837a432e77c1fe95c532441204b46568831f55acc3077edf9dafef';
// Frozen Framework Human Acceptance Candidate delivered through the acceptance template.
const CANDIDATE = '427a101df08b8555a8fac06e29a5aef2a241f727';
const ACCEPTANCE_TEMPLATE = 'https://github.com/TSP-LAC/tsp-sap-development-template-acceptance';
const PRODUCTION_TEMPLATE = 'https://github.com/TSP-LAC/tsp-sap-development-template';
const CANDIDATE_REQUIREMENTS = ['PyYAML>=6.0,<7', 'openpyxl>=3.1,<4', 'python-docx>=1.2,<2'];
// Optional: path to the Framework repository to check against the candidate's own files.
const FRAMEWORK_REPO = process.env.FRAMEWORK_REPO;
function candidateFile(file) {
  return execFileSync('git', ['-C', FRAMEWORK_REPO, 'show', `${CANDIDATE}:${file}`], { encoding: 'utf8' });
}
const LIFECYCLE_ACRONYMS = /\b(?:F1A|F1B|F2|D0|D1|T1|T2|Q1|Q2|Q3|R1|D2|INIT PASS|DEV_PRODUCT_BASELINE|state\.yaml)\b/;
const results = [];
const pass = name => { results.push(name); console.log(`PASS ${name}`); };
const sectionOrder = ['welcome', 'workflow', 'install', 'connect-sap', 'connect-claude', 'ready', 'mission', 'project', 'start', 'work', 'finish', 'feedback', 'help'];

async function scrollToId(page, id, offset = 60) {
  await page.evaluate(([target, top]) => {
    const node = document.getElementById(target);
    window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY - top, behavior: 'instant' });
  }, [id, offset]);
}

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const context = await browser.newContext({ viewport: { width: 1366, height: 800 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage();
    const errors = [];
    const requests = new Set();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('request', request => requests.add(request.url()));
    const response = await page.goto(base);
    assert.equal(response.status(), 200);
    await page.waitForSelector('#functional-spec table');

    // ---- Structure and story -------------------------------------------------
    assert.equal(await page.locator('#facilitator-form').count(), 0);
    assert.equal(await page.locator('h1').count(), 1);
    const ids = await page.evaluate(() => [...document.querySelectorAll('main > section')].map(node => node.id));
    assert.deepEqual(ids, sectionOrder);
    const navSteps = await page.locator('#guide-nav a').evaluateAll(links => links.map(link => link.dataset.step));
    assert.deepEqual(navSteps, sectionOrder);
    const labels = await page.locator('#guide-nav .nav-label').evaluateAll(nodes => nodes.map(node => node.firstChild.textContent.trim()));
    assert.deepEqual(labels, ['GET READY', 'THE EXERCISE', 'FEEDBACK']);
    const welcome = await page.locator('#welcome').innerText();
    for (const text of ['does not teach ABAP or CPI', 'VS Code', 'Claude Code', 'ABAP FS', 'TSP Framework', 'You stay responsible for technical decisions and approvals', 'This guide starts from zero', 'Do this once', 'this is what we measure']) assert(welcome.includes(text), text);
    const mainText = await page.locator('main').innerText();
    assert(!LIFECYCLE_ACRONYMS.test(mainText), 'Internal lifecycle vocabulary visible');
    pass('Story: welcome answers "what am I about to do", thirteen sections in journey order, three nav groups, no lifecycle gate vocabulary');

    // ---- Setup vs exercise separation ---------------------------------------
    const separation = await page.evaluate(() => {
      const band = document.querySelector('.part-band');
      const ready = document.getElementById('ready');
      const mission = document.getElementById('mission');
      return {
        afterReady: !!(ready.compareDocumentPosition(band) & Node.DOCUMENT_POSITION_FOLLOWING),
        beforeMission: !!(band.compareDocumentPosition(mission) & Node.DOCUMENT_POSITION_FOLLOWING),
        bandText: band.textContent
      };
    });
    assert(separation.afterReady && separation.beforeMission);
    assert(separation.bandText.includes('PART B · THE EXERCISE'));
    const ready = await page.locator('#ready').innerText();
    for (const text of ['Your workstation is ready', 'VS Code installed', 'Git available', 'Python 3.11+ available', 'Framework Python packages installed', 'Claude Code signed in', 'ABAP FS installed', 'IX1 connected', 'ABAP FS MCP running', 'Claude can read SAP', 'GitHub access confirmed', 'Start your first TSP development', 'Setup ends here', 'Note the time now']) assert(ready.includes(text), text);
    assert.equal(await page.locator('#ready a.button-primary').getAttribute('href'), '#mission');
    pass('Setup/exercise separation: Ready Check is the boundary, Part B band follows it, start link goes to the mission');

    // ---- Tooling model -------------------------------------------------------
    const install = await page.locator('#install').innerText();
    for (const text of ['Command Palette is VS Code\'s command search', 'Ctrl+Shift+P', 'Cmd+Shift+P', 'Claude Code for VS Code', 'Anthropic', 'ABAP remote filesystem', 'Marcello Urbani', 'murbani.vscode-abap-remote-fs', 'Git does not replace SAP transports', 'Python 3.11 or later', 'Manual mode is required for this acceptance', 'INSTALL THE FRAMEWORK\'S PYTHON PACKAGES']) assert(install.replace(/\s+/g, ' ').includes(text), text);
    assert(!/AI coding agent|your agent|the agent\b|coding agent/i.test(mainText), 'Generic agent wording in primary path');
    assert(mainText.includes('It is the official AI for this pilot.'));
    pass('Tooling: VS Code, Git, Python 3.11+, Claude Code (official pilot AI, Anthropic extension), ABAP FS (exact extension); no generic agent wording');

    const sapIndex = sectionOrder.indexOf('connect-sap');
    const claudeIndex = sectionOrder.indexOf('connect-claude');
    assert(sapIndex < claudeIndex);
    const sap = await page.locator('#connect-sap').innerText();
    for (const text of ['ABAP FS: Connection Manager', 'Add SAP System', 'ABAP FS: Connect to an ABAP system', 'ABAP FS: ABAP Search for object', 'CL_ABAP_TYPEDESCR', 'CHECKPOINT 1', 'VS Code can reach SAP', 'SAP object search works', 'Do not continue to Claude yet', 'User Settings', 'Provided by the facilitator', 'EN']) assert(sap.includes(text), text);
    assert(sap.includes('Not reached through ABAP FS') === false); // the Integration Suite note lives in its own card
    assert((await page.locator('#integration-trial').innerText()).includes('not through ABAP FS or Claude'));
    const claude = await page.locator('#connect-claude').innerText();
    for (const text of ['Only start this after Checkpoint 1 passes', 'MCP is the bridge that lets Claude use the SAP tools exposed by ABAP FS', 'ABAP FS: Start MCP Server', 'http://localhost:4847/mcp', '/mcp', 'abap-fs', 'Connected', 'VS Code must stay open', 'read-only', 'CHECKPOINT 2', 'Claude can reach SAP', 'Claude can read IX1', 'SAP connection problem', 'MCP problem', 'Framework or project problem', 'Do not add headers, passwords or SAP credentials']) assert(claude.includes(text), text);
    assert(claude.indexOf('Optional') > -1 && (await page.locator('#connect-claude details.optional').count()) === 1, 'CLI path must be optional');
    assert.equal(await page.locator('#sap-test-prompt').textContent(), 'Using the ABAP FS tools, search SAP IX1 for the class CL_ABAP_TYPEDESCR and tell me what you find. This is a read-only connection test: do not create, modify, activate or transport anything.');
    pass('Connections: SAP checkpoint precedes MCP; MCP via /mcp (CLI optional); read-only Claude-to-SAP prompt; layer-specific diagnosis');

    // ---- Exercise content and acceptance boundary ---------------------------
    const exercise = (await page.evaluate(() => ['mission', 'project', 'start', 'work', 'finish'].map(id => document.getElementById(id).innerText).join('\n')));
    for (const text of ['You are the Technical Consultant', 'That ambiguity is intentional', 'Start a new project.', 'What should I do next?', 'From this point forward, the Framework guides you', 'Claude does not replace your engineering judgment', 'Do not ask the facilitator for the answer', 'Read exactly what is being approved', 'ABAP FS can write to SAP', 'Development/demo only. No Production deployment.', 'Do not decide on your own that the exercise is complete']) assert(exercise.includes(text), text);
    assert(!/framework-test-anniversary/i.test(await page.content()), 'Old repository naming present');
    assert(!/bypass|skip permission|dangerously/i.test(exercise.replace('Do not switch to modes that approve actions for you or skip permission checks.', '')), 'Permission bypass encouraged');
    for (const banned of [/I approve/i, /anniversary rule (?:is|should be)/i, /minimum (?:of )?\d+ years/i, /implement(?:ed)? (?:it )?in (?:ABAP|CPI) because/i]) assert(!banned.test(exercise), `Exercise reveals ${banned}`);
    pass('Exercise: mission framing, start prompt, fallback, judgment and permission boundaries; no approval phrases, answers, architecture or old repository naming');

    // ---- Solution ID and repository name (Solution Identity Contract) -----
    const projectText = await page.locator('#project').innerText();
    assert(projectText.includes('ACC-001-') && projectText.includes('do not create a different one'));
    assert(!(await page.content()).includes('Assigned to you by the facilitator'));
    const usernames = ['greboredo', 'lprado', 'maria.lopez', 'j_smith'];
    const pageNames = {};
    for (const username of usernames) {
      await page.locator('#username-input').fill(username);
      assert.equal(await page.locator('#solution-id').textContent(), `ACC-001-${username}`);
      pageNames[username] = await page.locator('#repo-name').textContent();
      assert.equal(pageNames[username], `TSP_ACC-001-${username}_Employee-Anniversary-Recognition-Feed`);
    }
    assert(projectText.includes('not a general TSP Solution ID convention'));
    for (const [typed, expected] of [['GReboredo', 'greboredo'], ['lprado@tsp.tech', 'lprado'], ['  Maria.Lopez@tsp.tech ', 'maria.lopez']]) {
      await page.locator('#username-input').fill(typed);
      assert.equal(await page.locator('#solution-id').textContent(), `ACC-001-${expected}`, typed);
    }
    for (const bad of ['g reboredo', 'greboredo.', '.greboredo', '-greboredo', 'gre/boredo', 'josé', '@tsp.tech', 'a'.repeat(60)]) {
      await page.locator('#username-input').fill(bad);
      assert.equal(await page.locator('#solution-id').textContent(), 'ACC-001-<TSP-USERNAME>', bad);
      assert.equal(await page.locator('#repo-name').textContent(), 'TSP_<SOLUTION-ID>_Employee-Anniversary-Recognition-Feed', bad);
      assert.equal(await page.locator('#username-input').getAttribute('aria-invalid'), 'true', bad);
    }
    await page.locator('#username-input').fill('');
    assert((await page.locator('#repo-name-status').innerText()).includes('<CLIENT>_<SOLUTION-ID>_<SHORT-DESCRIPTION>'));
    let helperNote = 'candidate helper not run (set FRAMEWORK_REPO)';
    if (FRAMEWORK_REPO) {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tsp-identity-'));
      // Run the helper inside a full copy of the candidate's distributable template, as in a real project.
      const archive = execFileSync('git', ['-C', FRAMEWORK_REPO, 'archive', `${CANDIDATE}:dist/tsp-sap-development-template`]);
      execFileSync('tar', ['-x', '-C', dir], { input: archive });
      const helper = path.join(dir, '.framework', 'tools', 'solution_identity.py');
      for (const username of usernames) {
        const out = execFileSync('python3', [helper, '--client', 'TSP', '--solution-id', `ACC-001-${username}`, '--name', 'Employee Anniversary Recognition Feed'], { cwd: dir, encoding: 'utf8', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } });
        assert.equal(/repository_name: (\S+)/.exec(out)[1], pageNames[username], username);
      }
      fs.rmSync(dir, { recursive: true, force: true });
      helperNote = `matches the candidate ${CANDIDATE.slice(0, 7)} helper for ${usernames.length} usernames`;
    }
    pass(`Solution ID ACC-001-<TSP username> and repository name derived as the Framework helper does; invalid usernames rejected; ${helperNote}`);

    // ---- Acceptance template and Python bootstrap ----------------------------
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    assert(!html.includes(`${PRODUCTION_TEMPLATE}"`), 'Production template URL is used on the page');
    const createLink = page.locator('#project a.button-primary');
    assert.equal(await createLink.getAttribute('href'), ACCEPTANCE_TEMPLATE);
    assert((await createLink.innerText()).includes('Human Acceptance Template'));
    assert.equal(await page.locator('#tool-github a', { hasText: 'Human Acceptance Template' }).getAttribute('href'), ACCEPTANCE_TEMPLATE);
    assert(!/427a101|acceptance-hardening|\bSHA\b|\bbranch\b/i.test(mainText), 'Branch/SHA mechanics shown to consultants');
    const packages = CANDIDATE_REQUIREMENTS.map(requirement => `"${requirement}"`).join(' ');
    assert.equal(await page.locator('#pip-win').textContent(), `python -m pip install ${packages}`);
    assert.equal(await page.locator('#pip-mac').textContent(), `python3 -m pip install ${packages}`);
    const pipIndex = sectionOrder.indexOf('install');
    assert(pipIndex < sectionOrder.indexOf('ready') && (await page.locator('#install #python-packages').count()) === 1, 'Python bootstrap must be in Part A');
    assert(!(await page.locator('#project').innerText()).includes('pip install'), 'Python bootstrap must not be in the measured exercise');
    let parityNote = 'candidate files not checked (set FRAMEWORK_REPO)';
    if (FRAMEWORK_REPO) {
      const requirements = candidateFile('dist/tsp-sap-development-template/requirements.txt').split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
      assert.deepEqual(requirements, CANDIDATE_REQUIREMENTS, 'Part A packages differ from the candidate requirements.txt');
      const frozenSpec = candidateFile('acceptance/scenarios/employee-anniversary/functional-spec.md');
      assert.equal(crypto.createHash('sha256').update(frozenSpec).digest('hex'), PINNED_SPEC_SHA256, 'Frozen acceptance source changed');
      parityNote = `packages and frozen spec match candidate ${CANDIDATE.slice(0, 7)}`;
    }
    pass(`Project creation uses the Human Acceptance Template (production URL absent, no SHA/branch mechanics); Python bootstrap in Part A; ${parityNote}`);

    // ---- Copy actions (both platforms) --------------------------------------
    let copied = 0;
    for (const os of ['win', 'mac']) {
      await page.locator(`.sidebar [data-os-choice="${os}"]`).click();
      assert.equal(await page.evaluate(() => document.documentElement.dataset.os), os);
      await page.evaluate(() => document.querySelectorAll('details').forEach(node => { node.open = true; }));
      for (const button of await page.locator('main [data-copy]').all()) {
        if (!(await button.isVisible())) continue;
        const source = await button.getAttribute('data-copy');
        const expected = await page.locator(`#${source}`).textContent();
        await button.scrollIntoViewIfNeeded();
        await page.waitForFunction(node => !node.disabled, await button.elementHandle());
        await button.focus();
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => document.getElementById('status').textContent === 'Copied to clipboard.', null, { timeout: 5000 }).catch(() => { throw new Error(`Copy failed for ${source} (${os})`); });
        assert.equal(await page.evaluate(() => navigator.clipboard.readText()), expected, source);
        await page.evaluate(() => { document.getElementById('status').textContent = ''; });
        copied++;
      }
    }
    assert(copied >= 26, `Only ${copied} copy actions exercised`);
    assert.equal(await page.locator('#check-mac').textContent(), 'git --version\npython3 --version');
    assert.equal(await page.locator('#check-win').textContent(), 'git --version\npython --version');
    pass(`All ${copied} visible Copy actions (Windows and macOS views) work via keyboard and preserve exact text`);

    // ---- Functional specification unchanged ---------------------------------
    await page.locator('#copy-spec').click();
    await page.waitForFunction(() => document.getElementById('copy-spec').textContent === 'Copied');
    const spec = await page.evaluate(() => navigator.clipboard.readText());
    assert.equal(crypto.createHash('sha256').update(spec).digest('hex'), PINNED_SPEC_SHA256, 'Functional Specification differs from the pinned acceptance scenario');
    const requiredHeadings = ['BUSINESS PURPOSE', 'FUNCTIONAL REQUIREMENTS', 'TEST DATA', 'DEMO DATA REQUIREMENT', 'OUT OF SCOPE', 'KNOWN OPEN FUNCTIONAL ITEMS', 'FUNCTIONAL CLARIFICATION RULE'];
    for (const heading of requiredHeadings) assert(spec.includes(`## ${heading}`));
    assert.equal(await page.locator('#functional-spec .requirement').count(), 8);
    fs.writeFileSync(path.join(output, 'copied-functional-spec.md'), spec);
    pass('Functional Specification export is byte-identical to the frozen acceptance scenario (sha256 76e87f00…); both open items preserved');

    // ---- Setup ticks, progress model ----------------------------------------
    await page.locator('#reset-setup').click();
    await page.locator('#install [data-setup="vscode"]').check();
    assert(await page.locator('#ready [data-setup="vscode"]').isChecked(), 'Mirrored ticks out of sync');
    for (const key of ['git', 'python', 'pydeps', 'claude', 'abapfs', 'github']) await page.locator(`#install [data-setup="${key}"]`).check();
    await scrollToId(page, 'connect-sap');
    await page.waitForFunction(() => document.querySelector('#guide-nav a[aria-current="step"]')?.dataset.step === 'connect-sap');
    assert.equal(await page.locator('#guide-nav a[data-step="install"]').getAttribute('data-state'), 'done');
    assert.equal(await page.locator('#guide-nav a[data-step="connect-sap"]').getAttribute('data-state'), null);
    await page.reload();
    await page.waitForSelector('#functional-spec table');
    assert(await page.locator('#ready [data-setup="python"]').isChecked(), 'Setup ticks not restored');
    await scrollToId(page, 'finish');
    await page.waitForFunction(() => document.querySelector('#guide-nav a[aria-current="step"]')?.dataset.step === 'finish');
    for (const step of ['mission', 'project', 'start', 'work', 'finish']) assert.equal(await page.locator(`#guide-nav a[data-step="${step}"]`).getAttribute('data-state'), null, `${step} must never be marked done`);
    assert(/\d+ of 11 items still open/.test(await page.locator('#ready-status').innerText()));
    await page.locator('#reset-setup').click();
    assert(!(await page.locator('#install [data-setup="vscode"]').isChecked()));
    pass('Progress: current step follows scroll, setup ticks mirror and persist locally, reset works, exercise steps are never marked done by the page');

    // ---- Feedback export -----------------------------------------------------
    await scrollToId(page, 'feedback');
    await page.locator('#copy-feedback').click();
    await page.waitForFunction(() => document.getElementById('copy-feedback').textContent === 'Copied');
    assert((await page.evaluate(() => navigator.clipboard.readText())).includes('Not answered'));
    await page.locator('#setup-hours').fill('0.75');
    await page.locator('#setup-unclear').fill('Connection Manager button label.');
    await page.locator('input[name="issue_mcp"]').check();
    await page.locator('#setup-issues-comment').fill('Server was not started.');
    await page.locator('#setup-help').fill('1');
    await page.locator('#actual-hours').fill('1.5');
    await page.locator('#estimated-hours').fill('8.25');
    await page.locator('input[name="clarity"][value="4"]').check();
    await page.locator('input[name="internal"][value="No"]').check();
    await page.locator('#internal-comment').fill('Claude explained each next action.');
    await page.locator('#process-help').fill('0');
    await page.locator('input[name="approvals"][value="3"]').check();
    await page.locator('#unclear').fill('One approval needed a follow-up.\nClaude clarified it.');
    await page.locator('input[name="missing"][value="5"]').check();
    await page.locator('#missing-comment').fill('Both open business decisions were clear.');
    await page.locator('input[name="friction"][value="4"]').check();
    await page.locator('#control').fill('Useful control at approval.');
    await page.locator('input[name="confidence"][value="Probably"]').check();
    await page.locator('#anything').fill('<script>plain feedback text only</script>');
    await page.reload();
    await page.waitForSelector('#functional-spec table');
    assert(await page.locator('input[name="issue_mcp"]').isChecked());
    assert.equal(await page.locator('#unclear').inputValue(), 'One approval needed a follow-up.\nClaude clarified it.');
    assert.equal(await page.locator('#setup-hours').inputValue(), '0.75');
    await page.locator('#copy-feedback').click();
    await page.waitForFunction(() => document.getElementById('copy-feedback').textContent === 'Copied');
    const feedback = await page.evaluate(() => navigator.clipboard.readText());
    for (const text of ['# Part A — Workstation setup', '# Part B — Framework exercise', 'Setup hours: 0.75', 'Connection Manager button label.', 'Areas: MCP (Claude to ABAP FS)', 'Server was not started.', 'Setup interventions: 1', 'Hours: 1.5', 'Estimated hours: 8.25', 'Rating: 4 / 5', 'Process interventions: 0', 'Rating: 3 / 5', 'One approval needed a follow-up.\nClaude clarified it.', 'Rating: 5 / 5', 'Rating (1 bureaucracy – 5 useful control): 4 / 5', 'Useful control at approval.', 'Probably', '<script>plain feedback text only</script>']) assert(feedback.includes(text), text);
    assert.equal((feedback.match(/^## A[1-4]\./gm) || []).length, 4);
    assert.equal((feedback.match(/^## B[1-9]\./gm) || []).length, 9);
    assert(feedback.indexOf('# Part A') < feedback.indexOf('# Part B'));
    assert.equal(await page.locator('#feedback-form script').count(), 0);
    const download = await Promise.all([page.waitForEvent('download'), page.locator('#download-feedback').click()]);
    assert.equal(download[0].suggestedFilename(), 'tsp-acceptance-feedback.md');
    assert.equal(fs.readFileSync(await download[0].path(), 'utf8'), feedback);
    await page.waitForFunction(() => !document.getElementById('copy-feedback').disabled);
    await page.locator('#actual-hours').fill('-1');
    await page.locator('#copy-feedback').click();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'actual-hours');
    await page.locator('#actual-hours').fill('0');
    pass('Feedback: separate setup (A1–A4) and exercise (B1–B9) metrics, local draft restore, plain text, matching Markdown download, negative hours blocked');

    // ---- Facilitator export --------------------------------------------------
    await page.goto(`${base}?facilitator=false`);
    assert.equal(await page.locator('#facilitator-form').count(), 0);
    await page.goto(`${base}?facilitator=true`);
    const facilitatorText = await page.locator('#facilitator').innerText();
    for (const text of ['Which Framework phase comes next', 'Which technical architecture to choose', 'The two intentional functional answers', 'Ask Claude: What should I do next?', 'Confirming the consultant\'s TSP username']) assert(facilitatorText.includes(text), text);
    await page.locator('#consultant').fill('Test Consultant');
    await page.locator('#setup-start').fill('09:00');
    await page.locator('#setup-end').fill('09:40');
    await page.locator('#setup-duration').fill('40 minutes');
    await page.locator('#setup-interventions').fill('2');
    await page.locator('input[name="s_ix1"]').check();
    await page.locator('#setup-friction').fill('09:20 — certificate error, URL corrected');
    await page.locator('#start-time').fill('10:00');
    await page.locator('#end-time').fill('10:52');
    await page.locator('#duration').fill('52 minutes');
    await page.locator('#interventions').fill('1');
    await page.locator('#process-interventions').fill('0');
    await page.locator('input[name="boundary"]').check();
    await page.locator('#friction').fill('10:18 — instruction clarified by Claude.\n10:52 — complete.');
    await page.reload();
    assert.equal(await page.locator('#consultant').inputValue(), 'Test Consultant');
    assert(await page.locator('input[name="s_ix1"]').isChecked());
    await page.locator('#copy-observations').click();
    await page.waitForFunction(() => document.getElementById('copy-observations').textContent === 'Copied');
    const observations = await page.evaluate(() => navigator.clipboard.readText());
    for (const text of ['Consultant: Test Consultant', '## Part A — Workstation setup', 'Setup start time: 09:00', 'Setup end time: 09:40', 'Setup duration: 40 minutes', 'Setup interventions (installation / access): 2', '- [x] Checkpoint 1 passed (VS Code to IX1)', '09:20 — certificate error, URL corrected', '## Part B — Framework exercise', 'Exercise start time: 10:00', 'Exercise end time: 10:52', 'Exercise duration: 52 minutes', 'Environment / access interventions: 1', 'Framework / process interventions: 0', '- [x] Functional vs Technical boundary respected', '10:18 — instruction clarified by Claude.\n10:52 — complete.']) assert(observations.includes(text), text);
    assert.equal((observations.match(/^- \[/gm) || []).length, 17);
    const observationsDownload = await Promise.all([page.waitForEvent('download'), page.locator('#download-observations').click()]);
    assert.equal(observationsDownload[0].suggestedFilename(), 'tsp-facilitator-observations.md');
    assert.equal(fs.readFileSync(await observationsDownload[0].path(), 'utf8'), observations);
    pass('Facilitator mode: help boundaries, separate setup/exercise timing and interventions, 17 checks, persistence, copy and matching download');

    // ---- External links ------------------------------------------------------
    await page.goto(base);
    const allowed = new Set([
      'https://code.visualstudio.com/download', 'https://code.visualstudio.com/docs',
      'https://git-scm.com/install/windows', 'https://git-scm.com/install/mac',
      'https://www.python.org/downloads/',
      'https://code.claude.com/docs/en/vs-code', 'https://code.claude.com/docs/en/mcp',
      'https://marcellourbani.github.io/vscode_abap_remote_fs/', 'https://marcellourbani.github.io/vscode_abap_remote_fs/mcp-server/',
      'https://github.com/', ACCEPTANCE_TEMPLATE,
      'https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template',
      'https://cockpit.hanatrial.ondemand.com/trial/',
      'https://help.sap.com/docs/integration-suite/sap-integration-suite/subscribing-to-integration-suite'
    ]);
    const externalLinks = await page.locator('a[href^="http"]').all();
    const hrefs = new Set();
    for (const link of externalLinks) {
      const href = await link.getAttribute('href');
      hrefs.add(href);
      assert(allowed.has(href), `Unexpected destination ${href}`);
      assert(href.startsWith('https://'));
      assert.equal(await link.getAttribute('target'), '_blank');
      assert.equal(await link.getAttribute('rel'), 'noopener noreferrer');
      const url = new URL(href);
      assert.equal(url.username + url.password, '');
    }
    for (const critical of ['https://code.visualstudio.com/download', 'https://git-scm.com/install/windows', 'https://www.python.org/downloads/', ACCEPTANCE_TEMPLATE, 'https://cockpit.hanatrial.ondemand.com/trial/', 'https://code.claude.com/docs/en/vs-code', 'https://marcellourbani.github.io/vscode_abap_remote_fs/mcp-server/']) assert(hrefs.has(critical), `Missing ${critical}`);
    await context.route(/^https:\/\//, route => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Destination wiring check</title>' }));
    const tested = new Set();
    for (const link of externalLinks) {
      const href = await link.getAttribute('href');
      if (tested.has(href) || !(await link.isVisible())) continue;
      tested.add(href);
      const [popup] = await Promise.all([page.waitForEvent('popup'), link.click()]);
      await popup.waitForLoadState('domcontentloaded');
      assert.equal(popup.url(), href);
      assert.equal(await popup.evaluate(() => window.opener), null);
      await popup.close();
    }
    await context.unroute(/^https:\/\//);
    pass(`External links: ${hrefs.size} allowlisted HTTPS destinations incl. all critical ones; ${tested.size} opened in new tabs without opener`);

    // ---- Accessibility -------------------------------------------------------
    const brokenLabels = await page.evaluate(() => [...document.querySelectorAll('main input, main textarea')].filter(input => !input.labels?.length && !input.getAttribute('aria-label')).map(input => input.id || input.name || input.dataset.setup));
    assert.deepEqual(brokenLabels, []);
    const allIds = await page.evaluate(() => [...document.querySelectorAll('[id]')].map(node => node.id));
    assert.equal(new Set(allIds).size, allIds.length, 'Duplicate IDs');
    for (const link of await page.locator('a[href^="#"]').all()) assert.equal(await page.locator(await link.getAttribute('href')).count(), 1, await link.getAttribute('href'));
    await page.locator('[data-copy="start-prompt"]').scrollIntoViewIfNeeded();
    await page.locator('[data-copy="start-prompt"]').focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    assert.notEqual(await page.locator('[data-copy="start-prompt"]').evaluate(node => getComputedStyle(node).outlineStyle), 'none');
    const osButton = page.locator('#install [data-os-choice="mac"]');
    await osButton.focus();
    await page.keyboard.press('Enter');
    assert.equal(await osButton.getAttribute('aria-pressed'), 'true');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(() => document.documentElement.dataset.os), 'win');
    const summary = page.locator('#checkpoint-1 details summary');
    await summary.focus();
    await page.keyboard.press('Enter');
    assert(await page.locator('#checkpoint-1 details').evaluate(node => node.open));
    const setupBox = page.locator('#checkpoint-1 [data-setup="ix1"]');
    await setupBox.focus();
    await page.keyboard.press('Space');
    assert(await page.locator('#ready [data-setup="ix1"]').isChecked());
    await page.locator('#reset-setup').click();
    const critical = await page.evaluate(() => ['#checkpoint-1', '#checkpoint-2', '#ready', '#start-prompt', '#sap-test-prompt', '#mcp-url'].filter(selector => document.querySelector(selector).closest('details')));
    assert.deepEqual(critical, [], 'Critical steps hidden in accordions');
    pass('Accessibility: labeled inputs, unique IDs, working anchors, visible focus, keyboard OS switch, disclosures and checks; critical steps never collapsed');

    // ---- Responsive ----------------------------------------------------------
    for (const [width, height] of [[1366, 800], [1280, 800], [1024, 768], [768, 1024], [390, 844], [375, 812], [320, 700]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForTimeout(80);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Horizontal overflow at ${width}px`);
      if (width <= 820) {
        assert(await page.locator('#mobile-progress').isVisible(), `Mobile progress hidden at ${width}px`);
        await scrollToId(page, 'connect-claude', 70);
        await page.waitForFunction(() => document.getElementById('mobile-step').textContent.includes('Connect Claude to SAP'));
        assert.equal((await page.locator('#mobile-part').textContent()).toLowerCase(), 'get ready');
        await page.locator('#mobile-progress summary').click();
        await page.locator('#guide-nav-mobile a[data-step="project"]').click();
        await page.waitForFunction(() => document.getElementById('mobile-step').textContent.includes('Create your project'));
        assert(!(await page.locator('#mobile-progress').evaluate(node => node.open)));
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Horizontal overflow after navigation at ${width}px`);
      } else {
        assert(await page.locator('.sidebar').isVisible());
      }
    }
    pass('Responsive: seven widths down to 320px without overflow; sticky mobile progress shows part and step and navigates');

    // ---- Screenshots ---------------------------------------------------------
    for (const [width, height, tag] of [[1366, 800, 'desktop'], [390, 844, 'mobile']]) {
      await page.setViewportSize({ width, height });
      for (const id of ['welcome', 'workflow', 'install', 'checkpoint-1', 'connect-claude', 'checkpoint-2', 'ready', 'mission', 'project', 'start', 'work', 'feedback', 'help']) {
        await scrollToId(page, id, width <= 820 ? 70 : 40);
        await page.waitForTimeout(80);
        await page.screenshot({ path: path.join(output, `${tag}-${id}.png`), animations: 'disabled' });
      }
    }
    pass('Screenshots saved for desktop and mobile');

    assert([...requests].every(url => url.startsWith(base)), 'Unexpected external requests during page use');
    assert.deepEqual(errors, []);
    pass('No console errors, page errors or external background requests');

    // ---- Failure handling ----------------------------------------------------
    const fallback = await browser.newContext();
    await fallback.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('Test denied')) } });
      document.execCommand = () => false;
      Storage.prototype.getItem = () => { throw new Error('Test storage unavailable'); };
      Storage.prototype.setItem = () => { throw new Error('Test storage unavailable'); };
    });
    const fallbackPage = await fallback.newPage();
    const fallbackErrors = [];
    fallbackPage.on('pageerror', e => fallbackErrors.push(e.message));
    await fallbackPage.goto(base);
    assert((await fallbackPage.locator('#feedback-storage-note').innerText()).includes('storage is unavailable'));
    await fallbackPage.locator('#install [data-setup="git"]').check();
    assert(await fallbackPage.locator('#ready [data-setup="git"]').isChecked(), 'Ticks must work without storage');
    await fallbackPage.locator('[data-copy="start-prompt"]').click();
    assert(await fallbackPage.locator('#copy-dialog').isVisible());
    assert.equal(await fallbackPage.locator('#manual-copy').inputValue(), 'Start a new project.');
    await fallbackPage.keyboard.press('Escape');
    assert(!(await fallbackPage.locator('#copy-dialog').isVisible()));
    await fallbackPage.locator('#unclear').fill('Current-page draft still works.');
    await fallbackPage.locator('#copy-feedback').click();
    assert((await fallbackPage.locator('#manual-copy').inputValue()).includes('Current-page draft still works.'));
    await fallbackPage.locator('#close-copy-dialog').click();
    assert.deepEqual(fallbackErrors, []);
    pass('Clipboard denial and unavailable storage: selectable-text dialog, ticks and feedback export still work, no errors');

    // ---- Source security review ---------------------------------------------
    const files = ['index.html', 'app.js', 'styles.css', 'favicon.svg', 'README.md'];
    const source = files.map(file => fs.readFileSync(path.join(__dirname, file), 'utf8')).join('\n');
    assert(!/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|sk-ant-[A-Za-z0-9-]{10,}/.test(source), 'Credential material');
    assert(!/password\s*[:=]\s*\S/i.test(source), 'Password value');
    assert(!/tspapp\.tsp\.tech|172\.22\.|\/S\/3299|\/W\//.test(source), 'Internal SAP endpoint or SAP router string');
    assert(!/google-analytics|googletagmanager|hotjar|segment\.com|navigator\.sendBeacon|fetch\(|XMLHttpRequest/.test(source), 'Network submission or tracking');
    assert(!/\sstyle="/.test(html) && !/<script>(?!plain)/.test(html) && !/\son[a-z]+="/.test(html), 'Inline style/script would violate CSP');
    assert(html.includes("default-src 'self'"));
    assert(!/SFTPDEMO_GREBOREDO|GREBOREDO/.test(source), 'Personal SFTP alias still present');
    assert.equal((html.match(/SFTPDEMO_TSP/g) || []).length, 1);
    assert((await page.locator('.sftp-cell').innerText()).includes('own isolated trial tenant'));
    assert(!/7189|\bclient\s*100\b/i.test(source), 'IX1 port or client published');
    const ix1 = await page.locator('#ix1-facts').innerText();
    for (const text of ['Provided by the facilitator', 'Your assigned IX1 user', 'Never stored in the repository']) assert(ix1.includes(text), text);
    pass('Security source review: no credentials, internal IX1 host/port/client, router strings, personal SFTP alias, tracking or CSP-breaking inline code; SFTPDEMO_TSP in own tenant');

    fs.writeFileSync(path.join(output, 'REPORT.md'), '# Browser verification\n\n' + results.map(name => `- PASS — ${name}`).join('\n') + '\n\nExternal link checks cover the allowlisted URLs and new-tab behavior. Authenticated GitHub, SAP, Claude and BTP access is outside this static page and was not exercised.\n');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
