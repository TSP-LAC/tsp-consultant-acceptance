"use strict";

// One source for both the visible specification and the clipboard export.
const specification = {
  title: "Employee Anniversary Recognition Feed",
  businessPurpose: [
    "TSP requires a simple outbound integration to send employees who reach a relevant service anniversary to a fictional external provider called Employee Recognition Provider.",
    "This is a framework demonstration. Only fictional employee data may be used. No real employee or production data may be accessed."
  ],
  requirements: [
    { id: "FR-01", title: "Employee Population", paragraphs: ["Only employees with Active = Yes are eligible."] },
    { id: "FR-02", title: "Service Anniversary", paragraphs: ["Employees must be selected when they reach a relevant service anniversary.", "The exact anniversary selection rule is not yet defined."] },
    { id: "FR-03", title: "Minimum Years of Service", paragraphs: ["Only employees meeting the minimum required Years of Service should be included.", "The minimum number of completed Years of Service is not yet defined."] },
    { id: "FR-04", title: "Selection", paragraphs: ["An employee must satisfy the active-status, anniversary and minimum-service requirements to be included in the output."] },
    { id: "FR-05", title: "Output Fields", paragraphs: ["The output must contain the following fields in this exact order:"], fields: ["Employee ID", "First Name", "Last Name", "Hire Date", "Years of Service"] },
    { id: "FR-06", title: "Output Format", paragraphs: ["The output must be a CSV file with a header row."], filename: "EMPLOYEE_ANNIVERSARY_YYYYMMDD.csv", filenameNote: "YYYYMMDD represents the Execution Date." },
    { id: "FR-07", title: "External Delivery", paragraphs: ["The resulting file must be delivered to the Employee Recognition Provider through SFTP.", "A test SFTP destination may be used for this demonstration.", "No productive credentials are required."] },
    { id: "FR-08", title: "Execution", paragraphs: ["Execution is manual for this demonstration.", "Automatic scheduling is out of scope."] }
  ],
  executionDate: "2026-10-20",
  dataHeaders: ["Employee ID", "First Name", "Last Name", "Hire Date", "Active"],
  data: [
    ["100001", "Anna", "Meyer", "2016-10-12", "Yes"],
    ["100002", "John", "Smith", "2021-03-04", "Yes"],
    ["100003", "Maria", "Lopez", "2024-10-18", "Yes"],
    ["100004", "Robert", "King", "2010-10-05", "No"]
  ],
  demoData: [
    "The implementation must not query real SAP HCM/ECP employee data.",
    "For this demonstration, employee data must be provided using an appropriate fictional/local test-data mechanism.",
    "The technical mechanism used to provide this test data is a technical design decision and is not a functional requirement."
  ],
  outOfScope: ["Rehire scenarios", "Multiple employment", "Concurrent employment", "February 29 anniversary handling", "Automatic scheduling", "Productive employee data", "Productive SFTP credentials", "Production deployment", "Localization", "Delta processing", "Historical execution", "External provider acknowledgements"],
  openItems: ["What anniversary selection rule should be used.", "What minimum completed Years of Service makes an anniversary relevant."],
  openItemsNote: "These are intentionally open. Do NOT resolve them before the framework identifies the need for clarification.",
  clarificationRule: [
    "Do not invent additional business requirements.",
    "If a genuinely necessary functional decision is not defined above, identify it explicitly as a functional clarification.",
    "Do not treat implementation choices, SAP objects, ABAP design, CPI design, integration patterns, adapters, APIs, data-provider implementation, or the technical responsibility for CSV construction as missing functional requirements.",
    "Those are technical design decisions to be resolved by the engineering lifecycle."
  ]
};

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function paragraphs(parent, texts) {
  texts.forEach(text => parent.append(element("p", text)));
}

function specPart(title, className = "") {
  const section = element("section", undefined, `spec-part ${className}`.trim());
  section.append(element("h3", title));
  document.querySelector("#functional-spec").append(section);
  return section;
}

function renderSpecification() {
  const header = element("header", undefined, "spec-header");
  header.append(element("h3", specification.title), element("p", "Functional Specification"));
  document.querySelector("#functional-spec").append(header);
  paragraphs(specPart("BUSINESS PURPOSE"), specification.businessPurpose);

  const requirements = specPart("FUNCTIONAL REQUIREMENTS");
  specification.requirements.forEach(requirement => {
    const block = element("div", undefined, "requirement");
    block.append(element("h4", `${requirement.id} — ${requirement.title}`));
    paragraphs(block, requirement.paragraphs);
    if (requirement.fields) {
      const list = element("ol");
      requirement.fields.forEach(field => list.append(element("li", field)));
      block.append(list);
    }
    if (requirement.filename) {
      block.append(element("p", "Filename:"), element("code", requirement.filename, "filename"), element("p", requirement.filenameNote));
    }
    requirements.append(block);
  });

  const testData = specPart("TEST DATA");
  const execution = element("p");
  execution.append(element("strong", "Execution Date: "), document.createTextNode(specification.executionDate));
  testData.append(execution);
  const scroll = element("div", undefined, "table-scroll");
  scroll.tabIndex = 0;
  scroll.setAttribute("role", "region");
  scroll.setAttribute("aria-label", "Fictional employee test data; scroll horizontally if needed");
  const table = element("table");
  table.append(element("caption", "Fictional employee test data"));
  const head = element("thead");
  const headingRow = element("tr");
  specification.dataHeaders.forEach(title => {
    const th = element("th", title);
    th.scope = "col";
    headingRow.append(th);
  });
  head.append(headingRow);
  const body = element("tbody");
  specification.data.forEach(row => {
    const tr = element("tr");
    row.forEach(value => tr.append(element("td", value)));
    body.append(tr);
  });
  table.append(head, body);
  scroll.append(table);
  testData.append(scroll);

  paragraphs(specPart("DEMO DATA REQUIREMENT"), specification.demoData);
  const outOfScope = specPart("OUT OF SCOPE");
  const scopeList = element("ul", undefined, "scope-list");
  specification.outOfScope.forEach(item => scopeList.append(element("li", item)));
  outOfScope.append(scopeList);

  const open = specPart("KNOWN OPEN FUNCTIONAL ITEMS", "open-items");
  open.append(element("h4", "Some requirements are intentionally incomplete."), element("p", "The Functional Owner has not yet defined:"));
  const openList = element("ol");
  specification.openItems.forEach(item => openList.append(element("li", item)));
  open.append(openList, element("p", specification.openItemsNote));
  paragraphs(specPart("FUNCTIONAL CLARIFICATION RULE"), specification.clarificationRule);
}

function specificationMarkdown() {
  const lines = [`# ${specification.title}`, "", "Functional Specification", "", "## BUSINESS PURPOSE", "", specification.businessPurpose.join("\n\n"), "", "## FUNCTIONAL REQUIREMENTS", ""];
  specification.requirements.forEach(requirement => {
    lines.push(`### ${requirement.id} — ${requirement.title}`, "", requirement.paragraphs.join("\n\n"));
    if (requirement.fields) lines.push("", requirement.fields.map((field, i) => `${i + 1}. ${field}`).join("\n"));
    if (requirement.filename) lines.push("", "Filename:", "", requirement.filename, "", requirement.filenameNote);
    lines.push("");
  });
  lines.push("## TEST DATA", "", `Execution Date: ${specification.executionDate}`, "", `| ${specification.dataHeaders.join(" | ")} |`, `| ${specification.dataHeaders.map(() => "---").join(" | ")} |`, ...specification.data.map(row => `| ${row.join(" | ")} |`), "", "## DEMO DATA REQUIREMENT", "", specification.demoData.join("\n\n"), "", "## OUT OF SCOPE", "", specification.outOfScope.map(item => `- ${item}`).join("\n"), "", "## KNOWN OPEN FUNCTIONAL ITEMS", "", "Some requirements are intentionally incomplete.", "", "The Functional Owner has not yet defined:", "", specification.openItems.map((item, i) => `${i + 1}. ${item}`).join("\n"), "", specification.openItemsNote, "", "## FUNCTIONAL CLARIFICATION RULE", "", specification.clarificationRule.join("\n\n"));
  return `${lines.join("\n").trim()}\n`;
}

let statusTimer;
function announce(message) {
  clearTimeout(statusTimer);
  const status = document.querySelector("#status");
  status.textContent = message;
  statusTimer = setTimeout(() => { status.textContent = ""; }, 4500);
}

async function copyText(text, button) {
  let copied = false;
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch { /* Try the local legacy clipboard path next. */ }
  }
  if (!copied) {
    const previousFocus = document.activeElement;
    const field = element("textarea");
    field.value = text;
    field.setAttribute("aria-label", "Temporary clipboard text");
    field.style.position = "fixed";
    field.style.left = "-9999px";
    document.body.append(field);
    field.select();
    try { copied = document.execCommand("copy"); } catch { copied = false; }
    field.remove();
    previousFocus?.focus({ preventScroll: true });
  }
  if (copied) {
    announce("Copied to clipboard.");
    const original = button.textContent;
    button.textContent = "Copied";
    button.disabled = true;
    setTimeout(() => {
      button.textContent = original;
      button.disabled = false;
    }, 1400);
  } else {
    const dialog = document.querySelector("#copy-dialog");
    const field = document.querySelector("#manual-copy");
    field.value = text;
    dialog.showModal();
    field.focus();
    field.select();
  }
}

function downloadMarkdown(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const link = element("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  announce("Download prepared.");
}


function readStore(key) {
  try {
    const stored = localStorage.getItem(key);
    const value = stored ? JSON.parse(stored) : null;
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch { return null; }
}

function writeStore(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}

function renderRatings() {
  document.querySelectorAll("[data-rating]").forEach(group => {
    const low = group.dataset.low || "not clear";
    const high = group.dataset.high || "very clear";
    for (let i = 1; i <= 5; i++) {
      const label = element("label", undefined, "choice");
      const input = element("input");
      input.type = "radio";
      input.name = group.dataset.rating;
      input.value = String(i);
      input.setAttribute("aria-label", `${i} out of 5${i === 1 ? `, ${low.toLowerCase()}` : i === 5 ? `, ${high.toLowerCase()}` : ""}`);
      label.append(input, element("span", String(i)));
      group.append(label);
    }
  });
}

function enableLocalDraft(form, key, noteId) {
  const draft = readStore(key);
  const storageAvailable = draft !== null;
  if (draft) {
    [...form.elements].forEach(field => {
      if (!field.name || !Object.hasOwn(draft, field.name)) return;
      if (field.type === "checkbox") field.checked = draft[field.name] === true;
      else if (field.type === "radio") field.checked = draft[field.name] === field.value;
      else if (typeof draft[field.name] === "string") field.value = draft[field.name];
    });
  }
  function updateStorageNote() {
    document.getElementById(noteId).textContent = "Browser draft storage is unavailable. Your answers stay on this page until it closes. Copy or download them before leaving. Nothing is sent externally. Do not include secrets or real employee data.";
  }
  if (!storageAvailable) updateStorageNote();
  form.addEventListener("input", () => {
    const next = {};
    [...form.elements].forEach(field => {
      if (!field.name) return;
      if (field.type === "checkbox") next[field.name] = field.checked;
      else if (field.type !== "radio" || field.checked) next[field.name] = field.value;
    });
    if (!writeStore(key, next)) updateStorageNote();
  });
  form.addEventListener("submit", event => event.preventDefault());
}

function answer(data, key) {
  return String(data.get(key) || "").trim() || "Not answered";
}

function rating(data, key) {
  return data.get(key) ? `${data.get(key)} / 5` : "Not answered";
}

function checkedValues(form, names) {
  const values = names.map(name => form.querySelector(`input[name="${name}"]`)).filter(field => field?.checked).map(field => field.value);
  return values.length ? values.join(", ") : "Not answered";
}

function feedbackMarkdown() {
  const form = document.querySelector("#feedback-form");
  const data = new FormData(form);
  const issues = checkedValues(form, ["issue_none", "issue_sap", "issue_mcp", "issue_claude", "issue_github", "issue_cpi"]);
  return ["# TSP Consultant Acceptance Test — Feedback", "", "Exercise: Employee Anniversary Integration", "",
    "# Part A — Workstation setup", "",
    "## A1. How many hours did the workstation setup (steps 01–06) take?", "", `Setup hours: ${answer(data, "setup_hours")}`, "",
    "## A2. Which installation or setup step was unclear, if any?", "", answer(data, "setup_unclear"), "",
    "## A3. Where did you have connection problems?", "", `Areas: ${issues}`, "", `What happened: ${answer(data, "setup_issues_comment")}`, "",
    "## A4. How many times did you need the facilitator during setup?", "", `Setup interventions: ${answer(data, "setup_help")}`, "",
    "# Part B — Framework exercise", "",
    "## B1. How many hours did the exercise (steps 07–11) take using the Framework?", "", `Hours: ${answer(data, "actual_hours")}`, "",
    "## B2. How many hours do you estimate the same work would have taken without the Framework?", "", `Estimated hours: ${answer(data, "estimated_hours")}`, "",
    "## B3. From 1 to 5, how clear was it at every moment what you needed to do next?", "", `Rating: ${rating(data, "clarity")}`, "",
    "## B4. At any point did you need to understand how the Framework worked internally in order to continue?", "", answer(data, "internal"), "", `Explanation: ${answer(data, "internal_comment")}`, "",
    "## B5. How many times did you need the facilitator for a Framework or process question?", "", `Process interventions: ${answer(data, "process_help")}`, "",
    "## B6. From 1 to 5, how clear were the approvals: what you were approving and why?", "", `Rating: ${rating(data, "approvals")}`, "", `Unclear approval, question or instruction: ${answer(data, "unclear")}`, "",
    "## B7. When missing functional information appeared, was it clear:", "", "- what was missing", "- why it blocked progress", "- what you needed to answer", "", `Rating: ${rating(data, "missing")}`, "", `Comment: ${answer(data, "missing_comment")}`, "",
    "## B8. From 1 to 5, did the process feel like useful control or unnecessary bureaucracy?", "", `Rating (1 bureaucracy – 5 useful control): ${rating(data, "friction")}`, "", `Where: ${answer(data, "control")}`, "",
    "## B9. If you received a real customer requirement tomorrow, would you feel comfortable starting it from this template without assistance?", "", answer(data, "confidence"), "",
    "## Anything else?", "", answer(data, "anything"), ""].join("\n");
}

function observationsMarkdown() {
  const form = document.querySelector("#facilitator-form");
  const data = new FormData(form);
  const checks = block => [...form.querySelectorAll(".facilitator-block")[block - 1].querySelectorAll('input[type="checkbox"]')].map(field => `- [${field.checked ? "x" : " "}] ${field.value}`);
  return ["# FACILITATOR OBSERVATIONS", "", "Exercise: Employee Anniversary Integration", "", `Consultant: ${answer(data, "consultant")}`, "",
    "## Part A — Workstation setup", "", `Setup start time: ${answer(data, "setup_start")}`, `Setup end time: ${answer(data, "setup_end")}`, `Setup duration: ${answer(data, "setup_duration")}`, `Setup interventions (installation / access): ${answer(data, "setup_interventions")}`, "", ...checks(1), "", "### Setup issues / timestamps", "", answer(data, "setup_friction"), "",
    "## Part B — Framework exercise", "", `Exercise start time: ${answer(data, "start_time")}`, `Exercise end time: ${answer(data, "end_time")}`, `Exercise duration: ${answer(data, "duration")}`, `Environment / access interventions: ${answer(data, "interventions")}`, `Framework / process interventions: ${answer(data, "process_interventions")}`, "", ...checks(2), "", "### Friction points / timestamps", "", answer(data, "friction"), ""].join("\n");
}

// Platform switch: Windows first, macOS detected; the choice is a per-browser convenience.
const OS_KEY = "tsp-acceptance-os-v1";
function setPlatform(os, remember) {
  document.documentElement.dataset.os = os;
  document.querySelectorAll("[data-os-choice]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.osChoice === os)));
  if (remember) writeStore(OS_KEY, { os });
}
function initPlatform() {
  const saved = readStore(OS_KEY)?.os;
  const detected = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? "mac" : "win";
  setPlatform(saved === "mac" || saved === "win" ? saved : detected, false);
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-os-choice]");
    if (button) setPlatform(button.dataset.osChoice, true);
  });
}

// Setup ticks: one value per key, mirrored wherever the same check appears.
const SETUP_KEY = "tsp-acceptance-setup-v1";
const setupSections = {
  install: ["vscode", "git", "python", "pydeps", "claude", "abapfs", "github"],
  "connect-sap": ["abapfs", "ix1", "search"],
  "connect-claude": ["claude", "mcp", "invoke", "read"],
  ready: ["vscode", "git", "python", "pydeps", "claude", "abapfs", "ix1", "mcp", "read", "github", "cpi"]
};
let setupState = {};
function setupBoxes() { return [...document.querySelectorAll("input[data-setup]")]; }
function renderSetup() {
  setupBoxes().forEach(box => { box.checked = setupState[box.dataset.setup] === true; });
  const missing = setupSections.ready.filter(key => !setupState[key]).length;
  const status = document.querySelector("#ready-status");
  status.classList.toggle("is-complete", missing === 0);
  status.textContent = missing === 0
    ? "✓ Everything is ticked. Your workstation is ready."
    : `${missing} of ${setupSections.ready.length} items still open.`;
  updateNavigation();
}
function initSetup() {
  setupState = readStore(SETUP_KEY) || {};
  setupBoxes().forEach(box => box.addEventListener("change", () => {
    setupState[box.dataset.setup] = box.checked;
    writeStore(SETUP_KEY, setupState);
    renderSetup();
  }));
  document.querySelector("#reset-setup").addEventListener("click", () => {
    setupState = {};
    writeStore(SETUP_KEY, setupState);
    renderSetup();
    announce("Setup ticks cleared.");
  });
}

// Solution ID and repository name for this acceptance: ACC-001-<TSP username>,
// validated and derived exactly as the Framework's Solution Identity helper does.
const IDENTIFIER = /^[A-Za-z0-9](?:[A-Za-z0-9_.-]*[A-Za-z0-9_-])?$/;
const CLIENT = "TSP";
const SOLUTION_PREFIX = "ACC-001-";
const SOLUTION_NAME = "Employee Anniversary Recognition Feed";
function repositoryName(solutionId) {
  const description = SOLUTION_NAME.normalize("NFKD").replace(/[^\x00-\x7F]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${CLIENT}_${solutionId}_${description}`;
}
function initRepositoryName() {
  const input = document.querySelector("#username-input");
  const idOutput = document.querySelector("#solution-id");
  const nameOutput = document.querySelector("#repo-name");
  const status = document.querySelector("#repo-name-status");
  const idPlaceholder = idOutput.textContent;
  const namePlaceholder = nameOutput.textContent;
  const pattern = status.innerHTML;
  function reject(message) {
    idOutput.textContent = idPlaceholder;
    nameOutput.textContent = namePlaceholder;
    status.textContent = message;
    status.classList.add("is-error");
    input.setAttribute("aria-invalid", "true");
  }
  function update() {
    // TSP username: local part of the corporate email address, lowercase.
    const username = input.value.trim().split("@")[0].toLowerCase();
    status.classList.remove("is-error", "is-ok");
    input.removeAttribute("aria-invalid");
    if (!input.value.trim()) {
      idOutput.textContent = idPlaceholder;
      nameOutput.textContent = namePlaceholder;
      status.innerHTML = pattern;
      return;
    }
    const solutionId = SOLUTION_PREFIX + username;
    if (!/^[A-Za-z0-9]/.test(username) || !IDENTIFIER.test(solutionId)) {
      reject("Use the part of your TSP email address before the @: letters, digits, dots, underscores or hyphens only, with no spaces and no trailing dot. Check it with the facilitator.");
      return;
    }
    const name = repositoryName(solutionId);
    if (name.length > 100) {
      reject("This name would exceed 100 characters. Check your TSP username with the facilitator.");
      return;
    }
    idOutput.textContent = solutionId;
    nameOutput.textContent = name;
    status.textContent = "Use this exact repository name on GitHub, and give Claude the same Client, Solution ID and Solution name.";
    status.classList.add("is-ok");
  }
  input.addEventListener("input", update);
  update();
}

// Progress: current step from scroll position; ✓ only for setup steps you ticked
// and for orientation steps already passed. Exercise steps are never marked done here.
const visited = new Set();
let navLinks = [];
let navSections = [];
function stepDone(step) {
  if (setupSections[step]) return setupSections[step].every(key => setupState[key]);
  if (step === "welcome" || step === "workflow") return visited.has(step);
  return false;
}
let navUpdatePending = false;
function updateNavigation() {
  if (!navSections.length) return;
  let current = navSections[0];
  navSections.forEach(section => {
    if (section.getBoundingClientRect().top <= window.innerHeight * 0.3) current = section;
  });
  const index = navSections.indexOf(current);
  navSections.slice(0, index).forEach(section => visited.add(section.id));
  navLinks.forEach(link => {
    const step = link.dataset.step;
    if (step === current.id) link.setAttribute("aria-current", "step");
    else link.removeAttribute("aria-current");
    if (stepDone(step)) link.dataset.state = "done";
    else delete link.dataset.state;
  });
  const active = document.querySelector(`#guide-nav a[data-step="${current.id}"]`);
  const part = [...document.querySelectorAll("#guide-nav > *")].slice(0, [...document.querySelectorAll("#guide-nav > *")].indexOf(active)).reverse().find(node => node.classList.contains("nav-label"));
  document.querySelector("#mobile-part").textContent = part ? part.firstChild.textContent.trim().toLowerCase() : "";
  document.querySelector("#mobile-step").textContent = active ? active.textContent.trim().replace(/\s+/g, " ") : "";
  navUpdatePending = false;
}
function scheduleNavigationUpdate() {
  if (navUpdatePending) return;
  navUpdatePending = true;
  requestAnimationFrame(updateNavigation);
}
function initNavigation() {
  const mobileNav = document.querySelector("#guide-nav").cloneNode(true);
  mobileNav.id = "guide-nav-mobile";
  mobileNav.setAttribute("aria-label", "Guide progress (compact)");
  const slot = document.querySelector("#mobile-nav-slot");
  slot.append(mobileNav, document.querySelector(".sidebar .os-switch").cloneNode(true));
  slot.addEventListener("click", event => {
    if (event.target.closest("a")) document.querySelector("#mobile-progress").open = false;
  });
  navLinks = [...document.querySelectorAll("#guide-nav a, #guide-nav-mobile a")];
  navSections = [...document.querySelectorAll("#guide-nav a")].map(link => document.querySelector(link.hash));
  window.addEventListener("scroll", scheduleNavigationUpdate, { passive: true });
  window.addEventListener("resize", scheduleNavigationUpdate);
}

renderSpecification();
renderRatings();
initNavigation();
initPlatform();
initSetup();
initRepositoryName();
enableLocalDraft(document.querySelector("#feedback-form"), "tsp-acceptance-feedback-v2", "feedback-storage-note");

document.addEventListener("click", event => {
  const button = event.target.closest("[data-copy]");
  if (button) copyText(document.getElementById(button.dataset.copy).textContent, button);
});
document.querySelector("#copy-spec").addEventListener("click", event => copyText(specificationMarkdown(), event.currentTarget));
document.querySelector("#copy-feedback").addEventListener("click", event => {
  if (document.querySelector("#feedback-form").reportValidity()) copyText(feedbackMarkdown(), event.currentTarget);
});
document.querySelector("#download-feedback").addEventListener("click", () => {
  if (document.querySelector("#feedback-form").reportValidity()) downloadMarkdown(feedbackMarkdown(), "tsp-acceptance-feedback.md");
});
document.querySelector("#close-copy-dialog").addEventListener("click", () => document.querySelector("#copy-dialog").close());

if (new URLSearchParams(window.location.search).get("facilitator") === "true") {
  document.querySelector("#facilitator-container").append(document.querySelector("#facilitator-template").content.cloneNode(true));
  enableLocalDraft(document.querySelector("#facilitator-form"), "tsp-acceptance-observations-v2", "facilitator-storage-note");
  document.querySelector("#copy-observations").addEventListener("click", event => copyText(observationsMarkdown(), event.currentTarget));
  document.querySelector("#download-observations").addEventListener("click", () => downloadMarkdown(observationsMarkdown(), "tsp-facilitator-observations.md"));
}

renderSetup();
