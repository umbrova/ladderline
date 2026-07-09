document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab + "-panel").classList.add("active");
    if (btn.dataset.tab === "grid") loadTeamGrid();
    if (btn.dataset.tab === "notes") loadNotes();
    if (btn.dataset.tab === "insights") loadInsights();
    if (btn.dataset.tab === "docs") loadDocs();
  });
});

async function loadPeople() {
  const res = await fetch("/api/people");
  const people = await res.json();
  const list = document.getElementById("person-list");
  const main = document.getElementById("main");

  if (people.length === 0) {
    list.innerHTML = '<p style="font-size:12px;color:var(--muted);padding:0 4px;">No one tracked yet.</p>';
    main.innerHTML = `
      <div class="empty-state-wrap">
        <div class="empty-state">
            No one tracked yet.<br/><br/>
            Run this in your terminal to get started:<br/>
            <code style="display:inline-block; margin-top:8px; padding:6px 10px; background:#fff; border:1px solid var(--border); border-radius:6px; font-size:12px;">
            ladderline track "Name" --ladder generic-ic-ladder.yaml --as report
            </code>
        </div>
      </div>`;
    return;
  }

  list.innerHTML = people.map(p =>
    `<div class="person-item" data-slug="${p.slug}">
       <p class="person-name">${p.name}</p>
       <p class="person-relationship">${p.as}</p>
     </div>`
  ).join("");

  list.querySelectorAll(".person-item").forEach(el => {
    el.addEventListener("click", () => selectPerson(el.dataset.slug));
  });

  selectPerson(people[0].slug);
}

async function selectPerson(slug) {
  document.querySelectorAll(".person-item").forEach(el => {
    el.classList.toggle("active", el.dataset.slug === slug);
  });

  const res = await fetch(`/api/people/${slug}/overview`);
  const data = await res.json();
  const main = document.getElementById("main");

  if (data.error) {
    main.innerHTML = `<div class="empty-state">${data.error}</div>`;
    return;
  }

  const rows = data.sections.map(s => {
    const isEmpty = s.noteCount === 0;
    return `
      <div class="section-row ${isEmpty ? "empty" : ""}">
        <div>
          <p class="tag-name">${s.tagName}</p>
          <p class="tag-snippet">${isEmpty ? "No evidence logged yet." : s.latestSnippet}</p>
        </div>
        <span class="count-badge ${isEmpty ? "zero" : ""}">${s.noteCount} note${s.noteCount === 1 ? "" : "s"}</span>
        <span class="last-date">${s.lastDate ?? "—"}</span>
      </div>`;
  }).join("");

  main.innerHTML = `
    <div class="main-header">
      <h2>${data.personName}</h2>
      <span class="ladder-name">${data.ladderName}</span>
    </div>
    <p class="subtitle">${data.totalNotes} note${data.totalNotes === 1 ? "" : "s"} logged, all time</p>
    ${rows}
  `;
}

async function loadTeamGrid() {
  const res = await fetch("/api/team-grid");
  const data = await res.json();
  const panel = document.getElementById("grid-panel");

  if (data.rows.length === 0) {
    panel.innerHTML = '<div class="empty-state-wrap"><div class="empty-state">No one tracked yet.</div></div>';
    return;
  }

  const header = `<tr><th>Person</th>${data.tags.map(t => `<th>${t.name}</th>`).join("")}</tr>`;
  const rows = data.rows.map(row => {
    const cells = data.tags.map(t => {
      const cell = row.cells[t.id];
      if (cell === null) return `<td class="cell-na">—</td>`;
      const zero = cell.noteCount === 0;
      return `<td><span class="cell-count ${zero ? "zero" : ""}">${cell.noteCount}</span>${cell.lastDate ? ` <span class="last-date">(${cell.lastDate})</span>` : ""}</td>`;
    }).join("");
    return `<tr><td>${row.name}</td>${cells}</tr>`;
  }).join("");

  panel.innerHTML = `<table class="grid">${header}${rows}</table>`;
}

let notesPeopleCache = null;
let notesTotalCount = null;

async function loadNotes(filters = {}) {
  if (!notesPeopleCache) {
    notesPeopleCache = await (await fetch("/api/people")).json();
  }
  if (notesTotalCount === null) {
    const allNotes = await (await fetch("/api/notes")).json();
    notesTotalCount = allNotes.length;
  }

  const params = new URLSearchParams(filters);
  const res = await fetch(`/api/notes?${params}`);
  const notes = await res.json();
  const panel = document.getElementById("notes-panel");

  let rows;
  if (notes.length === 0 && notesTotalCount === 0) {
    rows = '<div class="empty-state-wrap"><div class="empty-state">No notes yet — track someone and log a note to get started.</div></div>';
  } else if (notes.length === 0) {
    rows = '<div class="empty-state-wrap"><div class="empty-state">No notes match this filter.</div></div>';
  } else {
    rows = notes.map((n, i) => `
        <div class="note-row" data-idx="${i}">
          <div class="note-row-summary">
            <span><strong>${n.date}</strong> — ${n.personName} — ${n.tag ?? "(notag)"}</span>
            <span class="note-row-chevron">▾</span>
          </div>
          <div class="note-row-raw">
            <div class="meta-grid">
              <div class="meta-item"><span class="meta-label">Person</span><span class="meta-value">${n.personName}</span></div>
              <div class="meta-item"><span class="meta-label">Filename</span><span class="meta-value">${n.filename}</span></div>
              <div class="meta-item"><span class="meta-label">Tag</span><span class="meta-value">${n.tag ?? "(none)"}</span></div>
              <div class="meta-item"><span class="meta-label">Cycle</span><span class="meta-value">${n.cycle ?? "(none)"}</span></div>
            </div>
            <div class="note-body">${n.body}</div>
          </div>
        </div>`).join("");
  }

  const personOptions = notesPeopleCache.map(p =>
    `<option value="${p.name}" ${filters.person === p.name ? "selected" : ""}>${p.name}</option>`
  ).join("");

  const noNotesAtAll = notesTotalCount === 0 ? "disabled" : "";

  panel.innerHTML = `
    <div class="filters">
      <select id="filter-person" ${noNotesAtAll}>
        <option value="">All people</option>
        ${personOptions}
      </select>
      <label><input type="checkbox" id="filter-notag" ${noNotesAtAll} ${filters.notagOnly === "true" ? "checked" : ""} /> notag only</label>
      <button class="clear-btn" id="clear-filters" ${noNotesAtAll}>Clear filters</button>
    </div>
    ${rows}
  `;

  panel.querySelectorAll(".note-row").forEach(el => {
    el.addEventListener("click", () => el.classList.toggle("expanded"));
  });

  document.getElementById("filter-person").addEventListener("change", (e) => {
    loadNotes({ ...filters, person: e.target.value });
  });
  document.getElementById("filter-notag").addEventListener("change", (e) => {
    loadNotes({ ...filters, notagOnly: e.target.checked ? "true" : "" });
  });
  document.getElementById("clear-filters").addEventListener("click", () => {
    loadNotes({});
  });
}

async function loadInsights() {
  const res = await fetch("/api/insights");
  const data = await res.json();
  const panel = document.getElementById("insights-panel");

  if (data.coverage.total === 0) {
    panel.innerHTML = '<div class="empty-state-wrap"><div class="empty-state">Track someone and log a note to see insights here.</div></div>';
    return;
  }

  const staleRows = data.goingStale.length === 0
    ? '<p style="font-size:12px;color:var(--muted);">Nothing is stale — nice.</p>'
    : data.goingStale.slice(0, 10).map(s => `
        <div class="stale-row">
          <span>${s.personName} — ${s.tagName}</span>
          <span class="warn">${s.daysSinceLastNote === null ? "no notes yet" : `no notes in ${s.daysSinceLastNote} days`}</span>
        </div>`).join("");

  const maxCount = Math.max(1, ...data.cadence.map(c => c.count));
  const chartBars = data.cadence.map(c => `
    <div class="chart-bar" style="height:${(c.count / maxCount) * 100}px;">
      <span class="bar-label">${c.count}</span>
    </div>`).join("");

  const readinessRows = data.cycleReadiness.length === 0
    ? '<p style="font-size:12px;color:var(--muted);">No cycles defined yet.</p>'
    : data.cycleReadiness.map(c => `
        <div class="stale-row">
          <span>${c.cycleName}</span>
          <span>${c.readyCount} of ${c.totalPeople} fully covered</span>
        </div>`).join("");

  panel.innerHTML = `
    <div class="insight-cards">
      <div class="insight-card">
        <p class="big">${data.coverage.percent}%</p>
        <p class="label">Coverage (${data.coverage.withEvidence} of ${data.coverage.total} tag-slots have evidence)</p>
      </div>
      <div class="insight-card">
        <p class="big">${data.goingStale.length}</p>
        <p class="label">Going stale (no notes in 30+ days, or ever)</p>
      </div>
    </div>

    <p class="insight-section-title">Going stale</p>
    ${staleRows}

    <p class="insight-section-title">Logging cadence (notes per week)</p>
    <div class="chart">${chartBars || '<p style="font-size:12px;color:var(--muted);">No notes logged yet.</p>'}</div>

    <p class="insight-section-title">Cycle readiness</p>
    ${readinessRows}
  `;
}

async function loadStaleBanner() {
  const res = await fetch("/api/insights");
  const data = await res.json();
  const banner = document.getElementById("stale-banner");

  if (data.goingStale.length === 0) {
    banner.style.display = "none";
    return;
  }
  banner.style.display = "inline-flex";
  banner.innerHTML = `⚠ ${data.goingStale.length}`;
  banner.title = `${data.goingStale.length} stale — click to view`;
  banner.onclick = () => document.querySelector('.tab-btn[data-tab="insights"]').click();
}

const DOC_PAGES = [
  { file: "Home", label: "Home" },
  { file: "Terminology", label: "Terminology" },
  { file: "CLI-Reference", label: "CLI Reference" },
  { file: "File-and-Folder-Conventions", label: "File & Folder Conventions" },
];

let docsLoaded = false;

function loadDocs() {
  if (docsLoaded) return;
  docsLoaded = true;

  const list = document.getElementById("docs-list");
  list.innerHTML = DOC_PAGES.map(p =>
    `<div class="person-item" data-doc="${p.file}"><p class="person-name">${p.label}</p></div>`
  ).join("");

  list.querySelectorAll("[data-doc]").forEach(el => {
    el.addEventListener("click", () => selectDoc(el.dataset.doc));
  });

  document.getElementById("docs-content").addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (link && link.getAttribute("href")?.startsWith("#docs/")) {
      e.preventDefault();
      selectDoc(link.getAttribute("href").replace("#docs/", ""));
    }
  });

  selectDoc("Home");
}

async function selectDoc(pageName) {
  document.querySelectorAll("#docs-list [data-doc]").forEach(el => {
    el.classList.toggle("active", el.dataset.doc === pageName);
  });

  const res = await fetch(`/docs/${pageName}.html`);
  const content = document.getElementById("docs-content");

  if (!res.ok) {
    content.innerHTML = `<div class="empty-state-wrap"><div class="empty-state">Couldn't load "${pageName}".</div></div>`;
    return;
  }

  const body = await res.text();
  const backLink = pageName === "Home"
    ? ""
    : `<a href="#docs/Home" class="docs-back">← Home</a>`;
  content.innerHTML = backLink + body;
}

loadPeople();
loadStaleBanner();