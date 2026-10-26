/* Portfolio interactions: boot sequence, typing, reveals, skill bars, tilt, glow, project manager */
document.documentElement.classList.add("js");

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = window.matchMedia("(pointer: coarse)").matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ================= SETTINGS (edit these) ================= */
const SHOW_MANAGE_TOOLS = true;        // set to false before publishing, then use yoursite.com/?edit to manage
/* ========================================================== */

/* ---------- 1. Boot sequence (once per session) ---------- */
async function boot() {
  const el = $("#boot");
  const out = $("#bootText");
  if (reduced || sessionStorage.getItem("booted")) {
    el.classList.add("done");
    return;
  }
  const lines = [
    "$ npm run portfolio",
    "> loading skills ........ ok",
    "> loading projects ...... ok",
    "> starting ali-akmal.dev  ✓",
  ];
  for (const line of lines) {
    for (const ch of line) {
      out.textContent += ch;
      await sleep(14);
    }
    out.textContent += "\n";
    await sleep(120);
  }
  await sleep(250);
  el.classList.add("done");
  sessionStorage.setItem("booted", "1");
}

/* ---------- 2. Typing roles in the hero ---------- */
async function typeRoles() {
  const target = $("#typed");
  const roles = [
    "Data Analyst",
    "Power BI & SQL Specialist",
    "Excel Problem Solver",
    "Future Python Backend Dev",
  ];
  if (reduced) {
    target.textContent = roles[0];
    return;
  }
  let i = 0;
  while (true) {
    const word = roles[i % roles.length];
    for (let c = 1; c <= word.length; c++) {
      target.textContent = word.slice(0, c);
      await sleep(70);
    }
    await sleep(1600);
    for (let c = word.length; c >= 0; c--) {
      target.textContent = word.slice(0, c);
      await sleep(35);
    }
    await sleep(300);
    i++;
  }
}

/* ---------- 3. Scroll reveal + skill bars ---------- */
function setupReveal() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add("in");
        if (el.classList.contains("skill")) fillSkill(el);
        io.unobserve(el);
      });
    },
    { threshold: 0.18 }
  );
  $$(".reveal").forEach((el) => io.observe(el));
}

function fillSkill(el) {
  const level = Number(el.dataset.level);
  const fill = $(".fill", el);
  const pct = $(".pct", el);
  fill.style.width = level + "%";
  if (reduced) {
    pct.textContent = level + "%";
    return;
  }
  const start = performance.now();
  const dur = 1400;
  const tick = (now) => {
    const t = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    pct.textContent = Math.round(level * eased) + "%";
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ---------- 4. Active nav tab + scroll progress ---------- */
function setupNav() {
  const tabs = $$(".tab");
  const sections = tabs.map((t) => $(t.getAttribute("href")));
  const bar = $("#progress");

  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;

    let current = 0;
    sections.forEach((s, i) => {
      if (s && s.getBoundingClientRect().top <= innerHeight * 0.4) current = i;
    });
    tabs.forEach((t, i) => t.classList.toggle("active", i === current));
    tabs[current].scrollIntoView({ inline: "nearest", block: "nearest" });
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ---------- 5. Cursor glow + card tilt ---------- */
function setupGlow() {
  if (reduced || coarse) return;
  addEventListener("pointermove", (e) => {
    document.body.style.setProperty("--mx", e.clientX + "px");
    document.body.style.setProperty("--my", e.clientY + "px");
  });
}

function attachTilt(card) {
  if (reduced || coarse) return;
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateZ(6px)`;
  });
  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
}

/* ---------- 6. Projects: add / delete / reset ---------- */
const STORE_KEY = "portfolio.projects.v1";

// Default projects. Edit these to change what visitors see first.
// Fields: title, desc, tags[], link ("" hides the link), wip (true = "in progress" card)
const DEFAULT_PROJECTS = [
  {
    id: "faridia",
    title: "Faridia College website",
    desc: "Full-stack website for Faridia College of Pharmacy & Medical Sciences, built end to end.",
    tags: ["full-stack", "web", "client work"],
    link: "",
    wip: false,
  },
  {
    id: "sysmon",
    title: "System Monitor",
    desc: "Desktop app that tracks system health, built in Python with Tkinter across multiple modules.",
    tags: ["python", "tkinter", "desktop"],
    link: "",
    wip: false,
  },
  {
    id: "n8n-email",
    title: "Scheduled email automation",
    desc: "n8n workflow that runs on a schedule and sends an email automatically. First of many.",
    tags: ["n8n", "automation"],
    link: "",
    wip: false,
  },
  {
    id: "pbi-sales",
    title: "Power BI dashboard",
    desc: "Sales and KPI dashboard case study for my data analyst portfolio. In progress.",
    tags: [],
    link: "",
    wip: true,
  },
];

let projects = loadProjects();
let firstRender = true;

function loadProjects() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.every((p) => p && typeof p.title === "string")) return data;
    }
  } catch (_) {}
  return structuredClone(DEFAULT_PROJECTS);
}

function saveProjects() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(projects));
  } catch (_) {
    toast("Couldn't save: browser storage is blocked.");
  }
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

const slug = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";

function cardEl(p) {
  const card = el("article", "card reveal" + (p.wip ? " loading" : "") + (firstRender ? "" : " in"));
  card.dataset.id = p.id;

  const bar = el("div", "card-bar");
  bar.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>';
  bar.append(el("span", null, slug(p.title) + (p.wip ? ".wip" : "/")));
  const del = el("button", "card-del", "×");
  del.type = "button";
  del.setAttribute("aria-label", "Delete " + p.title);
  del.addEventListener("click", () => deleteProject(p.id));
  bar.append(del);

  const body = el("div", "card-body");
  body.append(el("h3", null, p.title), el("p", null, p.desc));

  if (p.wip) {
    const load = el("span", "load");
    load.append(document.createElement("span"));
    body.append(load);
  } else {
    if (p.tags && p.tags.length) {
      const ul = el("ul", "tags");
      p.tags.forEach((t) => ul.append(el("li", null, t)));
      body.append(ul);
    }
    if (p.link) {
      const a = el("a", "more", "open project");
      a.href = p.link;
      a.target = "_blank";
      a.rel = "noopener";
      body.append(a);
    }
  }

  card.append(bar, body);
  attachTilt(card);
  return card;
}

function renderProjects(popId) {
  const wrap = $("#cards");
  wrap.replaceChildren();
  if (!projects.length) {
    wrap.append(el("div", "empty", "// no projects yet. click “+ add project” to create one."));
  }
  projects.forEach((p) => {
    const card = cardEl(p);
    if (p.id === popId && !reduced) card.classList.add("card-pop");
    wrap.append(card);
  });
  firstRender = false;
}

function deleteProject(id) {
  const index = projects.findIndex((p) => p.id === id);
  if (index < 0) return;
  const [removed] = projects.splice(index, 1);
  saveProjects();

  const card = $(`.card[data-id="${CSS.escape(id)}"]`);
  const finish = () => {
    renderProjects();
  };
  if (card && !reduced) {
    card.classList.add("removing");
    setTimeout(finish, 340);
  } else finish();

  toast(`Deleted “${removed.title}”`, "undo", () => {
    projects.splice(index, 0, removed);
    saveProjects();
    renderProjects(removed.id);
  });
}

function normalizeLink(raw) {
  const v = raw.trim();
  if (!v) return "";
  try {
    const u = new URL(/^[a-z]+:\/\//i.test(v) ? v : "https://" + v);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch (_) {
    return null;
  }
}

function setupProjectManager() {
  const params = new URLSearchParams(location.search);
  const toolbar = $("#toolbar");
  toolbar.hidden = !(SHOW_MANAGE_TOOLS || params.has("edit"));

  const dlg = $("#dlg");
  const form = $("#projForm");
  const err = $("#formErr");

  $("#addBtn").addEventListener("click", () => {
    form.reset();
    err.textContent = "";
    dlg.showModal();
  });
  $("#cancelBtn").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) dlg.close(); // click on backdrop
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const link = normalizeLink(String(d.get("link") || ""));
    if (link === null) {
      err.textContent = "That link doesn't look right. Use a full web address like https://github.com/you/repo";
      return;
    }
    const project = {
      id: Date.now().toString(36),
      title: String(d.get("title")).trim(),
      desc: String(d.get("desc")).trim(),
      tags: String(d.get("tags") || "").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 6),
      link,
      wip: d.get("wip") === "on",
    };
    projects.unshift(project);
    saveProjects();
    dlg.close();
    renderProjects(project.id);
    $(`.card[data-id="${CSS.escape(project.id)}"]`)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    toast(`Added “${project.title}”`);
  });

  const manage = $("#manageBtn");
  manage.addEventListener("click", () => {
    const on = document.body.classList.toggle("manage");
    manage.setAttribute("aria-pressed", String(on));
    manage.textContent = on ? "done" : "manage";
  });

  $("#resetBtn").addEventListener("click", () => {
    if (!confirm("Restore the default projects? Projects you added will be removed.")) return;
    projects = structuredClone(DEFAULT_PROJECTS);
    try { localStorage.removeItem(STORE_KEY); } catch (_) {}
    renderProjects();
    toast("Default projects restored");
  });
}

/* ---------- 7. Toast ---------- */
let toastTimer;
function toast(message, actionLabel, onAction) {
  let t = $("#toast");
  if (!t) {
    t = el("div", "toast");
    t.id = "toast";
    t.setAttribute("role", "status");
    document.body.append(t);
  }
  t.replaceChildren(el("span", null, message));
  if (actionLabel) {
    const b = el("button", null, actionLabel);
    b.type = "button";
    b.addEventListener("click", () => {
      onAction();
      t.classList.remove("show");
    });
    t.append(b);
  }
  requestAnimationFrame(() => t.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), actionLabel ? 6000 : 3000);
}

/* ---------- init ---------- */
async function init() {
  $("#year").textContent = new Date().getFullYear();
  renderProjects();        // must run before setupReveal so cards get observed
  setupReveal();
  setupNav();
  setupGlow();
  setupProjectManager();

  await boot();
  $(".name").classList.add("glitch");
  typeRoles();
}
init();