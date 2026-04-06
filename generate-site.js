/**
 * generate-site.js
 * Lee index.json y genera un index.html completo con todas las imágenes hardcodeadas.
 * No requiere servidor — se puede abrir directo desde el disco.
 *
 * USO:
 *   node generate-site.js
 */

const fs   = require("fs");
const path = require("path");

const INDEX_FILE  = path.join(__dirname, "index.json");
const OUTPUT_FILE = path.join(__dirname, "index.html");

if (!fs.existsSync(INDEX_FILE)) {
  console.error("❌  No se encontró index.json. Corré primero: node generate-index.js");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(INDEX_FILE, "utf8"));

// ── Generar bloques de imágenes por categoría ──────────────────────
function renderAllSections() {
  return data.categories.map(cat => {
    const cards = cat.images.map((img, i) => `
        <div class="img-card" data-cat="${cat.id}" data-index="${i}" tabindex="0" role="button" aria-label="${esc(img.name)}">
          <div class="img-thumb">
            <img src="${esc(img.path)}" loading="lazy" alt="${esc(img.name)}"/>
          </div>
          <div class="img-label">${esc(img.name)}</div>
        </div>`).join("");

    return `
      <div class="cat-section" id="cat-${cat.id}">
        <div class="cat-section-title" data-cat="${cat.id}">
          <span class="cat-slug">//</span> ${esc(cat.name)}
          <span class="cat-section-count">${cat.count} imagen${cat.count !== 1 ? "es" : ""}</span>
        </div>
        <div class="img-grid">${cards}
        </div>
      </div>`;
  }).join("\n");
}

// ── Generar items del sidebar ──────────────────────────────────────
function renderSidebarItems() {
  return data.categories.map(cat => `
        <button class="cat-btn" data-id="${cat.id}">
          <span class="cat-name">${esc(cat.name)}</span>
          <span class="cat-count">${cat.count}</span>
        </button>`).join("");
}

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── HTML completo ──────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>ImageWiki</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:          #0d0f12;
    --bg2:         #131720;
    --bg3:         #1a2030;
    --border:      #232b3a;
    --border2:     #2e3a50;
    --text:        #c9d6e8;
    --text2:       #7a8fa8;
    --text3:       #4a5d72;
    --accent:      #3b82f6;
    --accent2:     #1d4ed8;
    --accent-glow: rgba(59,130,246,0.15);
    --font-mono:   "IBM Plex Mono", monospace;
    --font-sans:   "IBM Plex Sans", sans-serif;
    --radius:      6px;
    --sidebar-w:   260px;
    --tr:          150ms ease;
  }

  html, body { height: 100%; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-sans);
    font-size: 14px;
    line-height: 1.6;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  /* ── TOPBAR ── */
  #topbar {
    position: sticky; top: 0; z-index: 100;
    height: 52px;
    background: var(--bg2);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 16px;
    padding: 0 20px; flex-shrink: 0;
  }
  .logo {
    font-family: var(--font-mono); font-size: 15px; font-weight: 600;
    color: var(--accent); letter-spacing: -.3px; white-space: nowrap;
    display: flex; align-items: center; gap: 8px;
  }
  .logo::before { content: "◈"; font-size: 18px; }

  #search-wrap { flex: 1; max-width: 480px; position: relative; }
  #search-wrap svg {
    position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
    color: var(--text3); pointer-events: none;
  }
  #search {
    width: 100%; background: var(--bg3); border: 1px solid var(--border);
    border-radius: var(--radius); color: var(--text);
    font-family: var(--font-mono); font-size: 13px;
    padding: 7px 12px 7px 34px; outline: none;
    transition: border-color var(--tr), box-shadow var(--tr);
  }
  #search::placeholder { color: var(--text3); }
  #search:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }

  .topbar-right {
    margin-left: auto; display: flex; align-items: center; gap: 12px;
    font-family: var(--font-mono); font-size: 12px; color: var(--text3); white-space: nowrap;
  }
  .stat-badge {
    background: var(--bg3); border: 1px solid var(--border);
    border-radius: 4px; padding: 3px 8px; color: var(--text2);
  }
  .stat-badge span { color: var(--accent); font-weight: 600; }

  /* ── LAYOUT ── */
  #layout { display: flex; flex: 1; overflow: hidden; }

  /* ── SIDEBAR ── */
  #sidebar {
    width: var(--sidebar-w); flex-shrink: 0;
    background: var(--bg2); border-right: 1px solid var(--border);
    overflow-y: auto; padding: 12px 0;
    display: flex; flex-direction: column; gap: 2px;
  }
  #sidebar::-webkit-scrollbar { width: 4px; }
  #sidebar::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  .sidebar-label {
    font-family: var(--font-mono); font-size: 10px; font-weight: 600;
    letter-spacing: 1.5px; text-transform: uppercase;
    color: var(--text3); padding: 8px 16px 4px;
  }
  .cat-btn {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 16px; cursor: pointer; border: none; background: none;
    color: var(--text2); font-family: var(--font-sans); font-size: 13px;
    text-align: left; width: 100%; border-left: 2px solid transparent;
    transition: background var(--tr), color var(--tr), border-color var(--tr); gap: 8px;
  }
  .cat-btn:hover { background: var(--bg3); color: var(--text); }
  .cat-btn.active { background: var(--accent-glow); color: var(--accent); border-left-color: var(--accent); }
  .cat-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cat-count {
    font-family: var(--font-mono); font-size: 11px; color: var(--text3);
    background: var(--bg3); border: 1px solid var(--border);
    border-radius: 3px; padding: 1px 6px; flex-shrink: 0;
  }
  .cat-btn.active .cat-count { border-color: var(--accent2); color: var(--accent); }

  /* ── MAIN ── */
  #main { flex: 1; overflow-y: auto; padding: 28px 32px; min-width: 0; }
  #main::-webkit-scrollbar { width: 6px; }
  #main::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }

  /* ── SEARCH BAR ── */
  #search-info {
    display: none;
    align-items: center; gap: 10px;
    margin-bottom: 16px;
    font-family: var(--font-mono); font-size: 12px; color: var(--text3);
  }
  #search-info.visible { display: flex; }
  #search-info strong { color: var(--accent); }
  #search-info .clear-btn {
    background: none; border: 1px solid var(--border); border-radius: 4px;
    color: var(--text3); font-family: var(--font-mono); font-size: 11px;
    padding: 2px 8px; cursor: pointer; transition: color var(--tr), border-color var(--tr);
  }
  #search-info .clear-btn:hover { color: var(--text); border-color: var(--border2); }

  /* ── CATEGORY SECTIONS ── */
  #all-view { display: flex; flex-direction: column; gap: 40px; }

  .cat-section { }
  .cat-section.hidden { display: none; }

  .cat-section-title {
    font-family: var(--font-mono); font-size: 13px; font-weight: 600;
    color: var(--text2); letter-spacing: .5px; margin-bottom: 12px;
    display: flex; align-items: center; gap: 8px;
    padding-bottom: 10px; border-bottom: 1px solid var(--border);
  }
  .cat-slug { color: var(--text3); }
  .cat-section-count { color: var(--text3); font-weight: 400; margin-left: auto; font-size: 11px; }

  /* ── IMAGE GRID ── */
  .img-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }

  .img-card {
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: var(--radius); overflow: hidden; cursor: pointer;
    transition: border-color var(--tr), transform var(--tr), box-shadow var(--tr);
    display: flex; flex-direction: column;
  }
  .img-card.hidden { display: none; }
  .img-card:hover {
    border-color: var(--accent); transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,.4), 0 0 0 1px var(--accent-glow);
  }
  .img-thumb {
    aspect-ratio: 1; background: var(--bg3);
    display: flex; align-items: center; justify-content: center; overflow: hidden;
  }
  .img-thumb img {
    width: 100%; height: 100%; object-fit: contain; padding: 8px;
    transition: transform 200ms ease;
  }
  .img-card:hover .img-thumb img { transform: scale(1.04); }
  .img-label {
    padding: 8px 10px; font-family: var(--font-mono); font-size: 11px;
    color: var(--text2); border-top: 1px solid var(--border);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  /* ── NO RESULTS ── */
  #no-results {
    display: none; flex-direction: column; align-items: center;
    justify-content: center; min-height: 200px; gap: 10px;
    font-family: var(--font-mono); font-size: 13px; color: var(--text3);
  }
  #no-results.visible { display: flex; }
  #no-results .icon { font-size: 32px; opacity: .3; }

  /* ── LIGHTBOX ── */
  #lightbox {
    display: none; position: fixed; inset: 0; z-index: 999;
    background: rgba(5,7,10,.95); backdrop-filter: blur(8px);
    align-items: center; justify-content: center; flex-direction: column;
  }
  #lightbox.open { display: flex; }

  #lb-toolbar {
    width: 100%; max-width: 1200px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px; flex-shrink: 0;
  }
  #lb-info { display: flex; flex-direction: column; gap: 2px; }
  #lb-name { font-family: var(--font-mono); font-size: 14px; font-weight: 600; color: var(--text); }
  #lb-cat  { font-family: var(--font-mono); font-size: 11px; color: var(--text3); }
  #lb-counter {
    font-family: var(--font-mono); font-size: 12px; color: var(--text3);
    background: var(--bg3); border: 1px solid var(--border);
    padding: 4px 10px; border-radius: 4px;
  }
  #lb-close {
    background: var(--bg3); border: 1px solid var(--border);
    border-radius: var(--radius); color: var(--text2); cursor: pointer;
    width: 32px; height: 32px; display: flex; align-items: center;
    justify-content: center; font-size: 18px;
    transition: background var(--tr), color var(--tr);
  }
  #lb-close:hover { background: var(--border2); color: var(--text); }

  #lb-body {
    flex: 1; display: flex; align-items: center; justify-content: center;
    gap: 20px; width: 100%; padding: 0 20px; min-height: 0;
  }
  #lb-img {
    max-height: 100%; max-width: 100%; object-fit: contain;
    border-radius: var(--radius); box-shadow: 0 32px 80px rgba(0,0,0,.7);
  }
  .lb-nav {
    background: var(--bg3); border: 1px solid var(--border);
    border-radius: var(--radius); color: var(--text2); cursor: pointer;
    width: 40px; height: 64px; display: flex; align-items: center;
    justify-content: center; font-size: 20px; flex-shrink: 0; user-select: none;
    transition: background var(--tr), color var(--tr), border-color var(--tr);
  }
  .lb-nav:hover { background: var(--accent-glow); color: var(--accent); border-color: var(--accent); }

  #lb-strip {
    height: 64px; display: flex; align-items: center; gap: 6px;
    overflow-x: auto; padding: 0 20px 12px; flex-shrink: 0;
    width: 100%; max-width: 1200px; justify-content: center;
    scrollbar-width: thin; scrollbar-color: var(--border2) transparent;
  }
  .lb-thumb {
    width: 48px; height: 48px; object-fit: contain; border-radius: 4px;
    border: 2px solid transparent; cursor: pointer; opacity: .5; flex-shrink: 0;
    transition: opacity var(--tr), border-color var(--tr);
    background: var(--bg3); padding: 2px;
  }
  .lb-thumb:hover { opacity: .8; }
  .lb-thumb.active { opacity: 1; border-color: var(--accent); }

  /* ── RESPONSIVE ── */
  @media (max-width: 700px) {
    :root { --sidebar-w: 200px; }
    #main { padding: 16px; }
    .img-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
  }
  @media (max-width: 520px) { #sidebar { display: none; } }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }
</style>
</head>
<body>

<div id="topbar">
  <div class="logo">ImageWiki</div>
  <div id="search-wrap">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
    <input id="search" type="search" placeholder="buscar imagen..." autocomplete="off" spellcheck="false"/>
  </div>
  <div class="topbar-right">
    <div class="stat-badge">cats: <span>${data.categories.length}</span></div>
    <div class="stat-badge">imgs: <span>${data.totalImages}</span></div>
  </div>
</div>

<div id="layout">
  <nav id="sidebar">
    <div class="sidebar-label">Categorías</div>
    <button class="cat-btn active" data-id="__all__">
      <span class="cat-name">Todas</span>
      <span class="cat-count">${data.totalImages}</span>
    </button>
    ${renderSidebarItems()}
  </nav>

  <main id="main">
    <div id="search-info">
      <span>Resultados para: <strong id="search-term"></strong></span>
      <button class="clear-btn" id="clear-search">✕ limpiar</button>
    </div>
    <div id="no-results">
      <div class="icon">⌀</div>
      <span>Sin resultados</span>
    </div>
    <div id="all-view">
      ${renderAllSections()}
    </div>
  </main>
</div>

<!-- LIGHTBOX -->
<div id="lightbox">
  <div id="lb-toolbar">
    <div id="lb-info">
      <div id="lb-name">—</div>
      <div id="lb-cat">—</div>
    </div>
    <div id="lb-counter">0 / 0</div>
    <button id="lb-close" title="Cerrar (Esc)">✕</button>
  </div>
  <div id="lb-body">
    <button class="lb-nav" id="lb-prev">‹</button>
    <img id="lb-img" src="" alt=""/>
    <button class="lb-nav" id="lb-next">›</button>
  </div>
  <div id="lb-strip"></div>
</div>

<script>
// ── DATA (embebida) ────────────────────────────────────────────────
const DATA = ${JSON.stringify(data)};

// ── STATE ──────────────────────────────────────────────────────────
let activeCat = "__all__";
let lbImages  = [];
let lbIndex   = 0;

// ── SIDEBAR ────────────────────────────────────────────────────────
document.querySelectorAll(".cat-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.id;
    activeCat = id;
    syncSidebar();
    clearSearch();
    if (id === "__all__") showAll();
    else showCat(id);
  });
});

function syncSidebar() {
  document.querySelectorAll(".cat-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.id === activeCat));
}

// ── SHOW ALL / CAT ─────────────────────────────────────────────────
function showAll() {
  document.querySelectorAll(".cat-section").forEach(s => s.classList.remove("hidden"));
  document.querySelectorAll(".img-card").forEach(c => c.classList.remove("hidden"));
  showNoResults(false);
}

function showCat(id) {
  document.querySelectorAll(".cat-section").forEach(s => {
    s.classList.toggle("hidden", s.id !== "cat-" + id);
  });
  showNoResults(false);
}

// ── SEARCH ─────────────────────────────────────────────────────────
let searchTimer = null;
const searchEl  = document.getElementById("search");
const searchInfo = document.getElementById("search-info");
const searchTerm = document.getElementById("search-term");
const noResults  = document.getElementById("no-results");

searchEl.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(doSearch, 180);
});

document.getElementById("clear-search").addEventListener("click", () => {
  searchEl.value = "";
  clearSearch();
  if (activeCat === "__all__") showAll();
  else showCat(activeCat);
});

function doSearch() {
  const q = searchEl.value.trim().toLowerCase();
  if (!q) {
    clearSearch();
    if (activeCat === "__all__") showAll();
    else showCat(activeCat);
    return;
  }

  searchInfo.classList.add("visible");
  searchTerm.textContent = searchEl.value.trim();

  let total = 0;
  document.querySelectorAll(".cat-section").forEach(section => {
    const catId   = section.dataset ? section.querySelector(".cat-section-title")?.dataset?.cat : null;
    const catName = section.querySelector(".cat-section-title")?.textContent?.toLowerCase() ?? "";
    let catVisible = false;

    section.querySelectorAll(".img-card").forEach(card => {
      const label = card.querySelector(".img-label")?.textContent?.toLowerCase() ?? "";
      const match = label.includes(q) || catName.includes(q);
      card.classList.toggle("hidden", !match);
      if (match) { catVisible = true; total++; }
    });

    section.classList.toggle("hidden", !catVisible);
  });

  showNoResults(total === 0);
}

function clearSearch() {
  searchInfo.classList.remove("visible");
  showNoResults(false);
}

function showNoResults(show) {
  noResults.classList.toggle("visible", show);
}

// ── LIGHTBOX ───────────────────────────────────────────────────────
document.querySelectorAll(".img-card").forEach(card => {
  const open = () => {
    const catId = card.dataset.cat;
    const idx   = parseInt(card.dataset.index, 10);
    const cat   = DATA.categories.find(c => c.id === catId);
    if (cat) openLightbox(cat.images, idx, cat.name);
  };
  card.addEventListener("click", open);
  card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") open(); });
});

function openLightbox(images, index, catName) {
  lbImages = images;
  lbIndex  = index;

  // construir tira de thumbs
  const strip = document.getElementById("lb-strip");
  strip.innerHTML = images.map((img, i) =>
    \`<img class="lb-thumb" src="\${img.path}" data-i="\${i}" alt="\${img.name}" loading="lazy"/>\`
  ).join("");
  strip.querySelectorAll(".lb-thumb").forEach(th =>
    th.addEventListener("click", () => { lbIndex = +th.dataset.i; showLbImg(); })
  );

  document.getElementById("lb-cat").textContent = catName;
  document.getElementById("lightbox").classList.add("open");
  document.body.style.overflow = "hidden";
  showLbImg();
}

function closeLightbox() {
  document.getElementById("lightbox").classList.remove("open");
  document.body.style.overflow = "";
}

function showLbImg() {
  const img = lbImages[lbIndex];
  document.getElementById("lb-img").src = img.path;
  document.getElementById("lb-img").alt = img.name;
  document.getElementById("lb-name").textContent    = img.name;
  document.getElementById("lb-counter").textContent = \`\${lbIndex + 1} / \${lbImages.length}\`;
  document.querySelectorAll(".lb-thumb").forEach((th, i) =>
    th.classList.toggle("active", i === lbIndex));
  document.querySelector(".lb-thumb.active")
    ?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
}

function lbMove(d) {
  lbIndex = (lbIndex + d + lbImages.length) % lbImages.length;
  showLbImg();
}

document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-prev").addEventListener("click", () => lbMove(-1));
document.getElementById("lb-next").addEventListener("click", () => lbMove(+1));
document.getElementById("lightbox").addEventListener("click", e => {
  if (e.target === document.getElementById("lightbox")) closeLightbox();
});
document.addEventListener("keydown", e => {
  if (!document.getElementById("lightbox").classList.contains("open")) return;
  if (e.key === "Escape")     closeLightbox();
  if (e.key === "ArrowLeft")  lbMove(-1);
  if (e.key === "ArrowRight") lbMove(+1);
});
</script>
</body>
</html>`;

fs.writeFileSync(OUTPUT_FILE, html, "utf8");

console.log(`✅  index.html generado`);
console.log(`    Categorías : ${data.categories.length}`);
console.log(`    Imágenes   : ${data.totalImages}`);
console.log(`    → Abrí index.html directo en el navegador, sin servidor.`);
