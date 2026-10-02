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

function renderRatings() {
  document.querySelectorAll("[data-rating]").forEach(group => {
    for (let i = 1; i <= 5; i++) {
      const label = element("label", undefined, "choice");
      const input = element("input");
      input.type = "radio";
      input.name = group.dataset.rating;
      input.value = String(i);
      input.setAttribute("aria-label", `${i} out of 5${i === 1 ? ", not clear" : i === 5 ? ", very clear" : ""}`);
      label.append(input, element("span", String(i)));
      group.append(label);
    }
  });
}

function enableLocalDraft(form, key, noteId) {
  let storageAvailable = true;
  try {
    const stored = localStorage.getItem(key);
    const draft = stored ? JSON.parse(stored) : null;
    if (draft && typeof draft === "object" && !Array.isArray(draft)) {
      [...form.elements].forEach(field => {
        if (!field.name || !Object.hasOwn(draft, field.name)) return;
        if (field.type === "checkbox") field.checked = draft[field.name] === true;
        else if (field.type === "radio") field.checked = draft[field.name] === field.value;
        else if (typeof draft[field.name] === "string") field.value = draft[field.name];
      });
    }
  } catch { storageAvailable = false; }
  function updateStorageNote() {
    document.getElementById(noteId).textContent = "Browser draft storage is unavailable. Your answers stay on this page until it closes. Copy or download them before leaving. Nothing is sent externally. Do not include secrets or real employee data.";
  }
  if (!storageAvailable) updateStorageNote();
  form.addEventListener("input", () => {
    const draft = {};
    [...form.elements].forEach(field => {
      if (!field.name) return;
      if (field.type === "checkbox") draft[field.name] = field.checked;
      else if (field.type !== "radio" || field.checked) draft[field.name] = field.value;
    });
    try { localStorage.setItem(key, JSON.stringify(draft)); }
    catch { updateStorageNote(); }
  });
  form.addEventListener("submit", event => event.preventDefault());
}

function answer(data, key) {
  return String(data.get(key) || "").trim() || "Not answered";
}

function feedbackMarkdown() {
  const data = new FormData(document.querySelector("#feedback-form"));
  return ["# TSP Consultant Acceptance Test — Feedback", "", "Exercise: Employee Anniversary Integration", "", "## 1. From 1 to 5, how clear was it at every moment what you needed to do next?", "", `Rating: ${data.get("clarity") ? `${data.get("clarity")} / 5` : "Not answered"}`, "", "## 2. At any point did you need to understand how the framework worked internally in order to continue?", "", answer(data, "internal"), "", `Explanation: ${answer(data, "internal_comment")}`, "", "## 3. Was there any approval, question or instruction that you did not understand?", "", answer(data, "unclear"), "", "## 4. Did the process feel like useful control or unnecessary bureaucracy? Where?", "", answer(data, "control"), "", "## 5. If you received a real customer requirement tomorrow, would you feel comfortable starting it from this template without assistance?", "", answer(data, "confidence"), "", "## 6. When missing functional information appeared, was it clear:", "", "- what was missing", "- why it blocked progress", "- what you needed to answer", "", `Rating: ${data.get("missing") ? `${data.get("missing")} / 5` : "Not answered"}`, "", `Comment: ${answer(data, "missing_comment")}`, "", "## Anything else?", "", answer(data, "anything"), ""].join("\n");
}

function observationsMarkdown() {
  const form = document.querySelector("#facilitator-form");
  const data = new FormData(form);
  const observations = [...form.querySelectorAll('input[type="checkbox"]')].map(field => `- [${field.checked ? "x" : " "}] ${field.value}`);
  return ["# FACILITATOR OBSERVATIONS", "", "Exercise: Employee Anniversary Integration", "", `Consultant: ${answer(data, "consultant")}`, `Start time: ${answer(data, "start_time")}`, `End time: ${answer(data, "end_time")}`, `Approximate duration: ${answer(data, "duration")}`, `Number of facilitator interventions: ${answer(data, "interventions")}`, "", "## Observations", "", ...observations, "", "## Friction points / timestamps", "", answer(data, "friction"), ""].join("\n");
}

renderSpecification();
renderRatings();
enableLocalDraft(document.querySelector("#feedback-form"), "tsp-acceptance-feedback-v1", "feedback-storage-note");

document.querySelectorAll("[data-copy]").forEach(button => {
  button.addEventListener("click", () => copyText(document.getElementById(button.dataset.copy).textContent, button));
});
document.querySelector("#copy-spec").addEventListener("click", event => copyText(specificationMarkdown(), event.currentTarget));
document.querySelector("#copy-feedback").addEventListener("click", event => copyText(feedbackMarkdown(), event.currentTarget));
document.querySelector("#download-feedback").addEventListener("click", () => downloadMarkdown(feedbackMarkdown(), "tsp-acceptance-feedback.md"));
document.querySelector("#close-copy-dialog").addEventListener("click", () => document.querySelector("#copy-dialog").close());

if (new URLSearchParams(window.location.search).get("facilitator") === "true") {
  document.querySelector("#facilitator-container").append(document.querySelector("#facilitator-template").content.cloneNode(true));
  enableLocalDraft(document.querySelector("#facilitator-form"), "tsp-acceptance-observations-v1", "facilitator-storage-note");
  document.querySelector("#copy-observations").addEventListener("click", event => copyText(observationsMarkdown(), event.currentTarget));
  document.querySelector("#download-observations").addEventListener("click", () => downloadMarkdown(observationsMarkdown(), "tsp-facilitator-observations.md"));
}

const navLinks = [...document.querySelectorAll(".sidebar nav a")];
const navSections = navLinks.map(link => document.querySelector(link.hash));
let navUpdatePending = false;
function updateNavigation() {
  let current = navSections[0];
  navSections.forEach(section => {
    if (section.getBoundingClientRect().top <= window.innerHeight * 0.25) current = section;
  });
  navLinks.forEach(link => {
    if (link.hash === `#${current.id}`) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  navUpdatePending = false;
}
function scheduleNavigationUpdate() {
  if (navUpdatePending) return;
  navUpdatePending = true;
  requestAnimationFrame(updateNavigation);
}
window.addEventListener("scroll", scheduleNavigationUpdate, { passive: true });
window.addEventListener("resize", scheduleNavigationUpdate);
updateNavigation();
