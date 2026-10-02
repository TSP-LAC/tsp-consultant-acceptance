// Optional development check; Playwright is not a dependency of the static page.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const base = process.env.TEST_URL || 'http://localhost:8080/';
const output = path.join(__dirname, 'verification');
const results = [];
const pass = name => { results.push(name); console.log(`PASS ${name}`); };

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage();
    const errors = [];
    const requests = new Set();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('request', request => requests.add(request.url()));
    const response = await page.goto(base);
    assert.equal(response.status(), 200);
    await page.waitForSelector('#functional-spec table');
    assert.equal(await page.locator('#facilitator-form').count(), 0);
    assert.equal(await page.locator('main > section').count(), 10);
    assert.equal(await page.locator('#functional-spec .requirement').count(), 8);
    const visible = await page.locator('main').innerText();
    assert(!/\b(?:F1A|F1B|F2|D0|D1|T1|T2|Q1|Q2|Q3|R1|D2)\b/.test(visible));
    pass('Local page loads; ten consultant sections; facilitator absent; lifecycle acronyms absent');

    for (const button of await page.locator('[data-copy]').all()) {
      const source = await button.getAttribute('data-copy');
      const expected = await page.locator(`#${source}`).textContent();
      await button.focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.getElementById('status').textContent === 'Copied to clipboard.');
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), expected);
    }
    pass('All seven command/prompt Copy buttons work via keyboard and preserve exact text');

    await page.locator('#copy-spec').click();
    await page.waitForFunction(() => document.getElementById('copy-spec').textContent === 'Copied');
    const spec = await page.evaluate(() => navigator.clipboard.readText());
    const requiredHeadings = ['BUSINESS PURPOSE', 'FUNCTIONAL REQUIREMENTS', 'TEST DATA', 'DEMO DATA REQUIREMENT', 'OUT OF SCOPE', 'KNOWN OPEN FUNCTIONAL ITEMS', 'FUNCTIONAL CLARIFICATION RULE'];
    for (const heading of requiredHeadings) assert(spec.includes(`## ${heading}`));
    for (let i = 1; i <= 8; i++) assert.equal((spec.match(new RegExp(`### FR-0${i} —`, 'g')) || []).length, 1);
    for (const text of ['1. Employee ID\n2. First Name\n3. Last Name\n4. Hire Date\n5. Years of Service', 'EMPLOYEE_ANNIVERSARY_YYYYMMDD.csv', '2026-10-20', '| 100001 | Anna | Meyer | 2016-10-12 | Yes |', '| 100002 | John | Smith | 2021-03-04 | Yes |', '| 100003 | Maria | Lopez | 2024-10-18 | Yes |', '| 100004 | Robert | King | 2010-10-05 | No |', 'The exact anniversary selection rule is not yet defined.', 'The minimum number of completed Years of Service is not yet defined.', 'Do NOT resolve them before the framework identifies the need for clarification.', 'Do not invent additional business requirements.', 'Those are technical design decisions to be resolved by the engineering lifecycle.']) assert(spec.includes(text), text);
    assert.equal(spec.split('\n').filter(line => line.startsWith('- ')).length, 12);
    for (const text of ['Start a new project.', 'github.com', 'SFTPDEMO_GREBOREDO', 'us-east-1.sftpcloud.io', 'Copy Feedback', 'Should this be implemented']) assert(!spec.includes(text));
    assert(!/\b(?:F1A|F1B|F2|D0|D1|T1|T2|Q1|Q2|Q3|R1|D2)\b/.test(spec));
    const specVisible = await page.locator('#functional-spec').innerText();
    for (const heading of requiredHeadings) assert(specVisible.includes(heading));
    fs.writeFileSync(path.join(output, 'copied-functional-spec.md'), spec);
    pass('Copied spec contains all required content, exact data and open decisions; no surrounding instructions or technical answers');

    // Test empty and complete feedback, including multiline text and persistence.
    await page.locator('#copy-feedback').click();
    await page.waitForFunction(() => document.getElementById('copy-feedback').textContent === 'Copied');
    assert((await page.evaluate(() => navigator.clipboard.readText())).includes('Not answered'));
    await page.locator('input[name="clarity"][value="4"]').check();
    await page.locator('input[name="internal"][value="No"]').check();
    await page.locator('#internal-comment').fill('The agent explained each next action.');
    await page.locator('#unclear').fill('One instruction needed a follow-up.\nThe agent clarified it.');
    await page.locator('#control').fill('Useful control at approval.');
    await page.locator('input[name="confidence"][value="Probably"]').check();
    await page.locator('input[name="missing"][value="5"]').check();
    await page.locator('#missing-comment').fill('Both open business decisions were clear.');
    await page.locator('#anything').fill('<script>plain feedback text only</script>');
    await page.reload();
    assert(await page.locator('input[name="clarity"][value="4"]').isChecked());
    assert.equal(await page.locator('#unclear').inputValue(), 'One instruction needed a follow-up.\nThe agent clarified it.');
    await page.locator('#copy-feedback').click();
    await page.waitForFunction(() => document.getElementById('copy-feedback').textContent === 'Copied');
    const feedback = await page.evaluate(() => navigator.clipboard.readText());
    for (const text of ['4 / 5', '5 / 5', 'Probably', 'The agent explained each next action.', 'One instruction needed a follow-up.\nThe agent clarified it.', 'Useful control at approval.', 'Both open business decisions were clear.', '<script>plain feedback text only</script>']) assert(feedback.includes(text));
    assert.equal((feedback.match(/^## [1-6]\./gm) || []).length, 6);
    assert.equal(await page.locator('#feedback-form script').count(), 0);
    const download = await Promise.all([page.waitForEvent('download'), page.locator('#download-feedback').click()]);
    assert.equal(download[0].suggestedFilename(), 'tsp-acceptance-feedback.md');
    assert.equal(fs.readFileSync(await download[0].path(), 'utf8'), feedback);
    pass('Feedback: empty/complete summaries, all questions, local draft restore, plain text handling, matching Markdown download');

    await page.goto(`${base}?facilitator=false`);
    assert.equal(await page.locator('#facilitator-form').count(), 0);
    await page.goto(`${base}?facilitator=true`);
    assert.equal(await page.locator('#facilitator-form input[type="checkbox"]').count(), 10);
    await page.locator('#consultant').fill('Test Consultant');
    await page.locator('#start-time').fill('10:00');
    await page.locator('#end-time').fill('10:52');
    await page.locator('#duration').fill('52 minutes');
    await page.locator('#interventions').fill('0');
    await page.locator('input[name="boundary"]').check();
    await page.locator('#friction').fill('10:18 — instruction clarified by the agent.\n10:52 — complete.');
    await page.reload();
    assert.equal(await page.locator('#consultant').inputValue(), 'Test Consultant');
    assert(await page.locator('input[name="boundary"]').isChecked());
    assert(await page.locator('input[name="clarity"][value="4"]').isChecked());
    await page.locator('#copy-observations').click();
    await page.waitForFunction(() => document.getElementById('copy-observations').textContent === 'Copied');
    const observations = await page.evaluate(() => navigator.clipboard.readText());
    for (const text of ['Consultant: Test Consultant', 'Start time: 10:00', 'End time: 10:52', 'Approximate duration: 52 minutes', 'Number of facilitator interventions: 0', '- [x] Functional vs Technical boundary respected', '10:18 — instruction clarified by the agent.\n10:52 — complete.']) assert(observations.includes(text));
    assert.equal((observations.match(/^- \[/gm) || []).length, 10);
    const observationsDownload = await Promise.all([page.waitForEvent('download'), page.locator('#download-observations').click()]);
    assert.equal(observationsDownload[0].suggestedFilename(), 'tsp-facilitator-observations.md');
    assert.equal(fs.readFileSync(await observationsDownload[0].path(), 'utf8'), observations);
    pass('Facilitator mode: exact query, five fields, ten checks, independent persistence, copy and matching Markdown download');

    await page.goto(base);
    const destinations = [
      'https://github.com/TSP-LAC/tsp-sap-development-template',
      'https://tsp-lac-extension-suite-nvk68dqy.integrationsuite.cfapps.eu10-003.hana.ondemand.com/shell/design'
    ];
    const externalLinks = await page.locator('a[href^="https:"]').all();
    assert.equal(externalLinks.length, 3);
    for (const link of externalLinks) {
      const href = await link.getAttribute('href');
      assert(destinations.includes(href));
      assert.equal(await link.getAttribute('target'), '_blank');
      assert.equal(await link.getAttribute('rel'), 'noopener noreferrer');
      assert.equal(new URL(href).username, '');
      assert.equal(new URL(href).password, '');
    }
    // Isolate destination content: verify actual new-tab navigation without signing in.
    await context.route('https://**/*', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Destination wiring check</title>' }));
    for (const link of externalLinks) {
      const href = await link.getAttribute('href');
      const [popup] = await Promise.all([page.waitForEvent('popup'), link.click()]);
      await popup.waitForURL(href);
      await popup.waitForLoadState('domcontentloaded');
      assert.equal(popup.url(), href);
      assert.equal(await popup.evaluate(() => window.opener), null);
      await popup.close();
    }
    pass('GitHub and Integration Suite links: exact supplied destinations, working new tabs, no credentials, no opener access');

    const brokenLabels = await page.evaluate(() => [...document.querySelectorAll('main input, main textarea')].filter(input => !input.labels?.length && !input.getAttribute('aria-label')).map(input => input.id || input.name));
    assert.deepEqual(brokenLabels, []);
    assert.equal(await page.locator('h1').count(), 1);
    const ids = await page.evaluate(() => [...document.querySelectorAll('[id]')].map(node => node.id));
    assert.equal(new Set(ids).size, ids.length);
    for (const link of await page.locator('a[href^="#"]').all()) assert.equal(await page.locator(await link.getAttribute('href')).count(), 1);
    await page.locator('#start-prompt').scrollIntoViewIfNeeded();
    await page.locator('[data-copy="start-prompt"]').focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    assert.notEqual(await page.locator('[data-copy="start-prompt"]').evaluate(node => getComputedStyle(node).outlineStyle), 'none');
    pass('Accessible structure: labeled inputs, one main heading, unique IDs, working anchors, keyboard-visible focus');

    for (const [width, height] of [[1366, 768], [1280, 800], [1024, 768], [768, 1024], [390, 844], [375, 812], [320, 700]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForFunction(() => document.querySelector('.sidebar a[aria-current="location"]')?.hash === '#prepare');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Horizontal overflow at ${width}px`);
      if (width === 1366 || width === 390) await page.screenshot({ path: path.join(output, `${width === 1366 ? 'laptop' : 'mobile'}.png`), animations: 'disabled' });
    }
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.locator('#start').evaluate(node => window.scrollTo({ top: node.offsetTop - 60, behavior: 'instant' }));
    await page.waitForFunction(() => document.querySelector('.sidebar a[aria-current="location"]')?.hash === '#start');
    await page.screenshot({ path: path.join(output, 'start.png'), animations: 'disabled' });
    await page.locator('#feedback').evaluate(node => window.scrollTo({ top: node.offsetTop - 30, behavior: 'instant' }));
    await page.screenshot({ path: path.join(output, 'feedback.png'), animations: 'disabled' });
    pass('Responsive layout: laptop/tablet/mobile at seven widths, including 320px; no page overflow');
    pass('Sidebar follows current section and resets at the top of the page');

    assert([...requests].every(url => url.startsWith(base)), 'Unexpected external requests during page use');
    assert.deepEqual(errors, []);
    pass('No console errors, page errors or external background requests');

    const fallback = await browser.newContext();
    await fallback.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('Test denied')) } });
      document.execCommand = () => false;
      Storage.prototype.getItem = () => { throw new Error('Test storage unavailable'); };
      Storage.prototype.setItem = () => { throw new Error('Test storage unavailable'); };
    });
    const fallbackPage = await fallback.newPage();
    await fallbackPage.goto(base);
    assert((await fallbackPage.locator('#feedback-storage-note').innerText()).includes('storage is unavailable'));
    await fallbackPage.locator('[data-copy="start-prompt"]').click();
    assert(await fallbackPage.locator('#copy-dialog').isVisible());
    assert.equal(await fallbackPage.locator('#manual-copy').inputValue(), 'Start a new project.');
    assert.equal(await fallbackPage.locator('#manual-copy').evaluate(node => node.selectionEnd - node.selectionStart), 'Start a new project.'.length);
    await fallbackPage.keyboard.press('Escape');
    assert(!(await fallbackPage.locator('#copy-dialog').isVisible()));
    await fallbackPage.locator('#unclear').fill('Current-page draft still works.');
    await fallbackPage.locator('#copy-feedback').click();
    assert((await fallbackPage.locator('#manual-copy').inputValue()).includes('Current-page draft still works.'));
    await fallbackPage.locator('#close-copy-dialog').click();
    assert(!(await fallbackPage.locator('#copy-dialog').isVisible()));
    pass('Clipboard denial: selectable-text dialog, selected text, Escape/Done; unavailable storage still permits feedback export');

    const source = ['index.html', 'app.js', 'styles.css', 'favicon.svg'].map(file => fs.readFileSync(path.join(__dirname, file), 'utf8')).join('\n');
    assert(!/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}/.test(source));
    assert(!/google-analytics|googletagmanager|hotjar|segment\.com|navigator\.sendBeacon|fetch\(|XMLHttpRequest/.test(source));
    assert(source.includes('SFTPDEMO_GREBOREDO'));
    pass('Security source review: no credential material, network submission, analytics or tracking; alias displayed correctly');

    fs.writeFileSync(path.join(output, 'REPORT.md'), '# Browser verification\n\n' + results.map(name => `- PASS — ${name}`).join('\n') + '\n\nExternal link checks cover supplied URLs and new-tab behavior. Authenticated GitHub/SAP access is outside this static page and was not exercised.\n');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
