'use strict';

/* ═══════════════════════════════════════════════════════════════
   IndexedDB wrapper  (DB_VERSION=2 — must stay ≥ existing DB)
   ═══════════════════════════════════════════════════════════════ */
const DB = (() => {
  const DB_NAME    = 'IconVault3';
  const DB_VERSION = 2;
  const STORE      = 'icons';
  let _db = null;

  function open() {
    if (_db) return Promise.resolve(_db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('uploadedAt', 'uploadedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains('folders')) {
          db.createObjectStore('folders', { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess = e => { _db = e.target.result; resolve(_db); };
      req.onerror   = e => reject(e.target.error);
    });
  }

  function tx(mode) {
    return open().then(db => {
      const t = db.transaction(STORE, mode);
      return { t, store: t.objectStore(STORE) };
    });
  }

  function promisify(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = e => resolve(e.target.result);
      req.onerror   = e => reject(e.target.error);
    });
  }

  function updateRecord(id, changes) {
    return tx('readwrite').then(({ store }) => new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = e => {
        const updated = Object.assign({}, e.target.result, changes);
        const put = store.put(updated);
        put.onsuccess = () => resolve(updated);
        put.onerror   = ev => reject(ev.target.error);
      };
      req.onerror = e => reject(e.target.error);
    }));
  }

  return {
    add(record)         { return tx('readwrite').then(({ store }) => promisify(store.add(record))); },
    getAll()            { return tx('readonly' ).then(({ store }) => promisify(store.getAll())); },
    delete(id)          { return tx('readwrite').then(({ store }) => promisify(store.delete(id))); },
    clear()             { return tx('readwrite').then(({ store }) => promisify(store.clear())); },
    update(id, changes) { return updateRecord(id, changes); },
  };
})();


/* ═══════════════════════════════════════════════════════════════
   Toast notifications
   ═══════════════════════════════════════════════════════════════ */
function toast(msg, type = 'success', duration = 2800) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-dot"></span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toast-out 0.25s ease forwards';
    setTimeout(() => el.remove(), 260);
  }, duration);
}


/* ═══════════════════════════════════════════════════════════════
   State
   ═══════════════════════════════════════════════════════════════ */
let allIcons  = [];
let query     = '';

const BRANDS = [
  { id: 'briox',      name: 'Briox' },
  { id: 'lerry',      name: 'Lerry.ai' },
  { id: 'edeklarera', name: 'Edeklarera' },
  { id: 'generic',    name: 'Generic' },
];

let activeBrand  = localStorage.getItem('iconvault-brand') || 'generic';
let activeTags   = [];


/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function sanitizeSVG(svgText) {
  const div = document.createElement('div');
  div.innerHTML = svgText;
  const svg = div.querySelector('svg');
  if (!svg) return null;

  svg.querySelectorAll('script').forEach(n => n.remove());
  svg.querySelectorAll('*').forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
      if (attr.name === 'href' && /^javascript/i.test(attr.value.trim())) {
        el.removeAttribute(attr.name);
      }
    });
  });

  if (!svg.hasAttribute('viewBox')) {
    const w = svg.getAttribute('width');
    const h = svg.getAttribute('height');
    if (w && h) svg.setAttribute('viewBox', `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
  }

  svg.removeAttribute('width');
  svg.removeAttribute('height');

  return svg.outerHTML;
}


/* ═══════════════════════════════════════════════════════════════
   Brand management
   ═══════════════════════════════════════════════════════════════ */
function updateBrandCounts() {
  BRANDS.forEach(({ id }) => {
    const el = document.getElementById(`bc-${id}`);
    if (el) el.textContent = allIcons.filter(ic => (ic.brandId || 'generic') === id).length;
  });
}

function setActiveBrand(id, { render = true } = {}) {
  activeBrand = id;
  activeTags  = [];
  localStorage.setItem('iconvault-brand', id);

  document.querySelectorAll('.brand-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.brand === id);
  });

  const nameEl = document.getElementById('dz-brand-name');
  if (nameEl) {
    const brand = BRANDS.find(b => b.id === id);
    nameEl.textContent = brand ? brand.name : id;
  }

  if (render) {
    updateBrandCounts();
    updateCountBadge();
    renderTagFilter();
    renderGrid();
  }
}


/* ═══════════════════════════════════════════════════════════════
   Render
   ═══════════════════════════════════════════════════════════════ */
function updateCountBadge() {
  const badge = document.getElementById('count-badge');
  const n = allIcons.filter(ic => (ic.brandId || 'generic') === activeBrand).length;
  badge.textContent = n === 1 ? '1 icon' : `${n} icons`;
}

function buildCard(icon) {
  const card = document.createElement('div');
  card.className = 'icon-card';
  card.dataset.id = icon.id;

  card.innerHTML = `
    <div class="card-preview">${icon.svgContent}</div>
    <div class="card-meta">
      <div class="card-name" title="${icon.name}">${icon.name}</div>
      <div class="card-info">
        <span>${formatBytes(icon.size)}</span>
        <span>·</span>
        <span>${formatDate(icon.uploadedAt)}</span>
      </div>
    </div>
    <div class="card-actions">
      <button class="btn btn-ghost btn-sm" data-action="copy" title="Copy SVG source">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        Copy
      </button>
      <button class="btn btn-ghost btn-sm" data-action="download" title="Download SVG">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Save
      </button>
    </div>
  `;

  return card;
}

function renderGrid() {
  const grid       = document.getElementById('grid');
  const emptyState = document.getElementById('empty-state');
  const emptyTitle = document.getElementById('empty-title');
  const emptySub   = document.getElementById('empty-sub');

  const brandIcons = allIcons.filter(ic => (ic.brandId || 'generic') === activeBrand);
  const tagIcons   = activeTags.length ? brandIcons.filter(ic => activeTags.every(t => (ic.tags || []).includes(t))) : brandIcons;
  const q          = query.trim().toLowerCase();
  const filtered   = q
    ? tagIcons.filter(ic =>
        ic.name.toLowerCase().includes(q) ||
        (ic.tags || []).some(t => t.includes(q))
      )
    : tagIcons;

  grid.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'block';
    grid.style.display = 'none';
    const brand     = BRANDS.find(b => b.id === activeBrand);
    const uploadBtn = document.getElementById('empty-upload-btn');
    if (q) {
      emptyTitle.textContent  = 'No results';
      emptySub.textContent    = `No icons match "${q}"`;
      uploadBtn.style.display = 'none';
    } else {
      emptyTitle.textContent  = 'No icons yet';
      emptySub.textContent    = `Upload your first SVG to ${brand ? brand.name : activeBrand}`;
      uploadBtn.style.display = '';
    }
    return;
  }

  emptyState.style.display = 'none';
  grid.style.display       = '';

  const sorted = [...filtered].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  sorted.forEach(icon => grid.appendChild(buildCard(icon)));
}


/* ═══════════════════════════════════════════════════════════════
   Load all icons from DB
   ═══════════════════════════════════════════════════════════════ */
async function loadIcons() {
  try {
    allIcons = await DB.getAll();
  } catch (err) {
    console.error('DB read error', err);
    allIcons = [];
  }
  updateBrandCounts();
  updateCountBadge();
  renderTagFilter();
  renderGrid();
}


/* ═══════════════════════════════════════════════════════════════
   Process uploaded files
   ═══════════════════════════════════════════════════════════════ */
async function processFiles(files) {
  const svgFiles = Array.from(files).filter(f =>
    f.type === 'image/svg+xml' || f.name.toLowerCase().endsWith('.svg')
  );

  if (svgFiles.length === 0) {
    toast('Please upload .svg files only', 'error');
    return;
  }

  let added  = 0;
  let errors = 0;

  for (const file of svgFiles) {
    try {
      const text  = await file.text();
      const clean = sanitizeSVG(text);
      if (!clean) { errors++; continue; }

      await DB.add({
        name:       file.name,
        size:       file.size,
        svgContent: clean,
        uploadedAt: new Date().toISOString(),
        brandId:    activeBrand,
      });
      added++;
    } catch (err) {
      console.error('Upload error', err);
      errors++;
    }
  }

  await loadIcons();

  if (added > 0)  toast(`${added} icon${added > 1 ? 's' : ''} added`, 'success');
  if (errors > 0) toast(`${errors} file${errors > 1 ? 's' : ''} failed to import`, 'error');
}


/* ═══════════════════════════════════════════════════════════════
   Card action handler (Copy / Save)
   ═══════════════════════════════════════════════════════════════ */
document.getElementById('grid').addEventListener('click', async e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const card   = btn.closest('.icon-card');
  const id     = parseInt(card.dataset.id, 10);
  const icon   = allIcons.find(ic => ic.id === id);
  const action = btn.dataset.action;

  if (!icon) return;

  if (action === 'copy') {
    try {
      await navigator.clipboard.writeText(icon.svgContent);
      toast('SVG source copied to clipboard');
    } catch {
      toast('Clipboard access denied', 'error');
    }
  }

  if (action === 'download') {
    const blob = new Blob([icon.svgContent], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = icon.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast(`Downloaded ${icon.name}`);
  }
});


/* ═══════════════════════════════════════════════════════════════
   Open modal on card click (excluding action buttons)
   ═══════════════════════════════════════════════════════════════ */
document.getElementById('grid').addEventListener('click', e => {
  if (e.target.closest('[data-action]')) return;
  const card = e.target.closest('.icon-card');
  if (!card) return;
  const id   = parseInt(card.dataset.id, 10);
  const icon = allIcons.find(ic => ic.id === id);
  if (icon) openModal(icon);
});


/* ═══════════════════════════════════════════════════════════════
   Drag & drop
   ═══════════════════════════════════════════════════════════════ */
const dropzone = document.getElementById('dropzone');

dropzone.addEventListener('dragenter', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
dropzone.addEventListener('dragover',  e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
dropzone.addEventListener('dragleave', e => {
  if (!dropzone.contains(e.relatedTarget)) dropzone.classList.remove('drag-over');
});
dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove('drag-over');
  processFiles(e.dataTransfer.files);
});


/* ═══════════════════════════════════════════════════════════════
   File input (browse)
   ═══════════════════════════════════════════════════════════════ */
const fileInput = document.getElementById('file-input');

function triggerFilePicker() { fileInput.click(); }

fileInput.addEventListener('change', () => {
  if (fileInput.files.length) processFiles(fileInput.files);
  fileInput.value = '';
});

document.getElementById('browse-link').addEventListener('click', triggerFilePicker);
document.getElementById('header-upload-btn').addEventListener('click', triggerFilePicker);
document.getElementById('empty-upload-btn').addEventListener('click', triggerFilePicker);
dropzone.addEventListener('click', e => {
  if (e.target === dropzone || e.target.closest('.dz-icon') || e.target.closest('.dz-title')) {
    triggerFilePicker();
  }
});


/* ═══════════════════════════════════════════════════════════════
   Tag filter
   ═══════════════════════════════════════════════════════════════ */
const tagFilterWrap  = document.getElementById('tag-filter-wrap');
const tagFilterBtn   = document.getElementById('tag-filter-btn');
const tagFilterLabel = document.getElementById('tag-filter-label');
const tagFilterMenu  = document.getElementById('tag-filter-menu');

function renderTagFilter() {
  const brandIcons = allIcons.filter(ic => (ic.brandId || 'generic') === activeBrand);
  const tags = [...new Set(brandIcons.flatMap(ic => ic.tags || []))].sort();

  tagFilterMenu.innerHTML = '';

  if (tags.length === 0) {
    tagFilterMenu.innerHTML = '<span class="tag-filter-empty">No tags yet</span>';
  } else {
    if (activeTags.length > 0) {
      const clearBtn = document.createElement('button');
      clearBtn.className = 'tag-filter-clear';
      clearBtn.textContent = 'Clear all';
      clearBtn.addEventListener('click', () => {
        activeTags = [];
        updateTagFilterBtn();
        renderGrid();
        renderTagFilter();
      });
      tagFilterMenu.appendChild(clearBtn);
    }
    tags.forEach(tag => {
      const btn = document.createElement('button');
      btn.className = `tag-filter-opt${activeTags.includes(tag) ? ' selected' : ''}`;
      btn.textContent = tag;
      btn.addEventListener('click', () => {
        if (activeTags.includes(tag)) {
          activeTags = activeTags.filter(t => t !== tag);
        } else {
          activeTags = [...activeTags, tag];
        }
        updateTagFilterBtn();
        renderGrid();
        renderTagFilter();
      });
      tagFilterMenu.appendChild(btn);
    });
  }

  updateTagFilterBtn();
}

function updateTagFilterBtn() {
  if (activeTags.length === 0) {
    tagFilterLabel.textContent = 'Tags';
  } else if (activeTags.length === 1) {
    tagFilterLabel.textContent = activeTags[0];
  } else {
    tagFilterLabel.textContent = `${activeTags.length} tags`;
  }
  tagFilterBtn.classList.toggle('active', activeTags.length > 0);
}

tagFilterBtn.addEventListener('click', e => {
  e.stopPropagation();
  tagFilterWrap.classList.toggle('open');
});

document.addEventListener('click', e => {
  if (!tagFilterWrap.contains(e.target)) tagFilterWrap.classList.remove('open');
});


/* ═══════════════════════════════════════════════════════════════
   Search
   ═══════════════════════════════════════════════════════════════ */
document.getElementById('search-input').addEventListener('input', e => {
  query = e.target.value;
  renderGrid();
});


/* ═══════════════════════════════════════════════════════════════
   Document-level drag (prevent browser from opening SVG files)
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop',     e => e.preventDefault());


/* ═══════════════════════════════════════════════════════════════
   Brand nav
   ═══════════════════════════════════════════════════════════════ */
document.getElementById('brand-nav').addEventListener('click', e => {
  const tab = e.target.closest('.brand-tab');
  if (tab) setActiveBrand(tab.dataset.brand);
});


/* ═══════════════════════════════════════════════════════════════
   Modal — state & DOM refs
   ═══════════════════════════════════════════════════════════════ */
let modalIcon    = null;
let colorMap     = {};
let modalFormat  = 'svg';
let modalPngSize = 512;

const modalOverlay  = document.getElementById('modal-overlay');
const modalPreview  = document.getElementById('modal-preview');
const modalTitleEl  = document.getElementById('modal-title');
const pngSizeGroup  = document.getElementById('png-size-group');
const pngSizeSelect = document.getElementById('png-size');
const renameInput   = document.getElementById('modal-rename');

const modalMenuWrap = document.getElementById('modal-menu-wrap');
const moveBrandWrap = document.getElementById('move-brand-wrap');


/* ─── Color helpers ───────────────────────────────────────── */
const COLOR_SKIP = /^(none|transparent|url\(|inherit)/i;

function extractColors(svgContent) {
  const div = document.createElement('div');
  div.innerHTML = svgContent;
  const svg = div.querySelector('svg');
  if (!svg) return [];

  const seen = new Map();
  function add(val) {
    if (val && !COLOR_SKIP.test(val)) seen.set(val.toLowerCase(), val);
  }

  [svg, ...svg.querySelectorAll('*')].forEach(el => {
    add(el.getAttribute('fill'));
    add(el.getAttribute('stroke'));
    add(el.style.fill);
    add(el.style.stroke);
  });

  return [...seen.values()];
}

function applyColorMap(svgContent) {
  if (Object.keys(colorMap).length === 0) return svgContent;

  const div = document.createElement('div');
  div.innerHTML = svgContent;
  const svg = div.querySelector('svg');
  if (!svg) return svgContent;

  const ccOv = colorMap['currentcolor'];
  if (ccOv) svg.style.color = ccOv;

  function replace(val) {
    if (!val || COLOR_SKIP.test(val)) return val;
    return colorMap[val.toLowerCase()] || val;
  }

  [svg, ...svg.querySelectorAll('*')].forEach(el => {
    const fill   = el.getAttribute('fill');
    const stroke = el.getAttribute('stroke');
    if (fill)   el.setAttribute('fill',   replace(fill));
    if (stroke) el.setAttribute('stroke', replace(stroke));
    if (el.style.fill)   el.style.fill   = replace(el.style.fill);
    if (el.style.stroke) el.style.stroke = replace(el.style.stroke);
  });

  return svg.outerHTML;
}

function renderColorOverrides(svgContent) {
  const list   = document.getElementById('color-overrides-list');
  const colors = extractColors(svgContent);
  list.innerHTML = '';

  if (colors.length === 0) {
    list.innerHTML = '<span style="font-size:0.78rem;color:var(--muted-fg)">No colors detected</span>';
    return;
  }

  colors.forEach(orig => {
    const key      = orig.toLowerCase();
    const current  = colorMap[key] || orig;
    const row      = document.createElement('div');
    row.className  = 'color-row';
    row.innerHTML  = `
      <span class="color-swatch" style="background:${current};border:1px solid var(--border);"></span>
      <span class="color-orig">${orig}</span>
      <input type="color" class="color-picker" value="${toHex(current)}" data-orig="${key}" />
      <button class="color-reset" data-orig="${key}" title="Reset">↺</button>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll('.color-picker').forEach(inp => {
    inp.addEventListener('input', () => {
      colorMap[inp.dataset.orig] = inp.value;
      refreshPreview();
    });
  });

  list.querySelectorAll('.color-reset').forEach(btn => {
    btn.addEventListener('click', () => {
      delete colorMap[btn.dataset.orig];
      renderColorOverrides(modalIcon.svgContent);
      refreshPreview();
    });
  });
}

function toHex(color) {
  if (/^#[0-9a-f]{6}$/i.test(color)) return color;
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = color;
  return ctx.fillStyle;
}

function refreshPreview() {
  const svg = applyColorMap(modalIcon.svgContent);
  modalPreview.innerHTML = svg;
}


/* ─── Tags ────────────────────────────────────────────────── */
function renderTagsEditor() {
  const wrap  = document.getElementById('tags-input-wrap');
  const input = document.getElementById('tags-input');
  wrap.querySelectorAll('.tag-chip').forEach(c => c.remove());
  (modalIcon.tags || []).forEach(tag => wrap.insertBefore(buildChip(tag), input));
}

function buildChip(tag) {
  const chip = document.createElement('span');
  chip.className = 'tag-chip';
  chip.innerHTML = `${tag}<button class="tag-chip-remove" title="Remove">×</button>`;
  chip.querySelector('.tag-chip-remove').addEventListener('click', async () => {
    const tags = (modalIcon.tags || []).filter(t => t !== tag);
    await saveTagsToIcon(tags);
  });
  return chip;
}

async function saveTagsToIcon(tags) {
  await DB.update(modalIcon.id, { tags });
  modalIcon.tags = tags;
  const idx = allIcons.findIndex(ic => ic.id === modalIcon.id);
  if (idx !== -1) allIcons[idx].tags = tags;
  renderTagsEditor();
}

document.getElementById('tags-input').addEventListener('keydown', async e => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const val = e.target.value.trim().replace(/,+$/, '').toLowerCase();
    if (!val || !modalIcon) return;
    const tags = modalIcon.tags || [];
    if (tags.includes(val)) { e.target.value = ''; return; }
    await saveTagsToIcon([...tags, val]);
    e.target.value = '';
  }
  if (e.key === 'Backspace' && e.target.value === '' && modalIcon) {
    const tags = modalIcon.tags || [];
    if (tags.length) await saveTagsToIcon(tags.slice(0, -1));
  }
});

document.getElementById('tags-input-wrap').addEventListener('click', () => {
  document.getElementById('tags-input').focus();
});


/* ─── Open / close modal ──────────────────────────────────── */
function openModal(icon) {
  modalIcon   = icon;
  colorMap    = {};
  modalFormat = 'svg';

  modalTitleEl.textContent  = icon.name;
  renameInput.value          = icon.name.replace(/\.svg$/i, '');

  document.querySelector('.format-tab.active').classList.remove('active');
  document.querySelector('.format-tab[data-format="svg"]').classList.add('active');
  pngSizeGroup.style.display = 'none';

  document.getElementById('modal-file-size').textContent = formatBytes(icon.size);
  document.getElementById('modal-file-date').textContent = formatDate(icon.uploadedAt);

  refreshPreview();
  renderColorOverrides(icon.svgContent);
  renderTagsEditor();

  modalOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalMenuWrap.classList.remove('open');
  moveBrandWrap.classList.remove('open');
  modalOverlay.classList.add('closing');
  setTimeout(() => {
    modalOverlay.style.display = 'none';
    modalOverlay.classList.remove('closing');
    document.body.style.overflow = '';
    modalIcon = null;
  }, 150);
}


/* ─── Modal event listeners ───────────────────────────────── */
document.getElementById('modal-close').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modalOverlay.style.display === 'flex') closeModal();
});

// Format tabs
document.querySelectorAll('.format-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    modalFormat = tab.dataset.format;
    document.querySelectorAll('.format-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    pngSizeGroup.style.display = modalFormat === 'png' ? '' : 'none';
  });
});

// PNG size
pngSizeSelect.addEventListener('change', () => { modalPngSize = parseInt(pngSizeSelect.value, 10); });

// Rename
function saveRename() {
  if (!modalIcon) return;
  let name = renameInput.value.trim();
  if (!name) return;
  if (!name.toLowerCase().endsWith('.svg')) name += '.svg';
  DB.update(modalIcon.id, { name }).then(() => {
    modalIcon.name = name;
    const idx = allIcons.findIndex(ic => ic.id === modalIcon.id);
    if (idx !== -1) allIcons[idx].name = name;
    modalTitleEl.textContent = name;
    renderGrid();
    toast('Renamed');
  }).catch(() => toast('Rename failed', 'error'));
}

document.getElementById('rename-save').addEventListener('click', saveRename);
renameInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveRename(); });

// Download
document.getElementById('modal-download').addEventListener('click', async () => {
  if (!modalIcon) return;
  if (modalFormat === 'svg') {
    const svg  = applyColorMap(modalIcon.svgContent);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = modalIcon.name;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    toast(`Downloaded ${modalIcon.name}`);
  } else {
    const size = modalPngSize;
    const svg  = applyColorMap(modalIcon.svgContent);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      c.getContext('2d').drawImage(img, 0, 0, size, size);
      c.toBlob(b => {
        const u = URL.createObjectURL(b);
        const a = document.createElement('a');
        a.href = u; a.download = modalIcon.name.replace(/\.svg$/i, '.png');
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(u);
        toast(`Downloaded ${size}×${size} PNG`);
      }, 'image/png');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }
});

// Copy to clipboard
document.getElementById('modal-copy').addEventListener('click', async () => {
  if (!modalIcon) return;
  try {
    await navigator.clipboard.writeText(applyColorMap(modalIcon.svgContent));
    toast('SVG copied to clipboard');
  } catch {
    toast('Clipboard access denied', 'error');
  }
});


/* ─── ⋯ dropdown ──────────────────────────────────────────── */
document.getElementById('modal-menu-btn').addEventListener('click', e => {
  e.stopPropagation();
  const open = modalMenuWrap.classList.toggle('open');
  if (!open) moveBrandWrap.classList.remove('open');
});

// Duplicate
document.getElementById('modal-duplicate').addEventListener('click', async () => {
  if (!modalIcon) return;
  try {
    const newName = modalIcon.name.replace(/\.svg$/i, '') + '-copy.svg';
    await DB.add({
      name:       newName,
      size:       modalIcon.size,
      svgContent: modalIcon.svgContent,
      uploadedAt: new Date().toISOString(),
      brandId:    modalIcon.brandId || 'generic',
    });
    await loadIcons();
    modalMenuWrap.classList.remove('open');
    toast(`Duplicated as ${newName}`);
  } catch {
    toast('Duplicate failed', 'error');
  }
});

// Move to Brand sub-list
function buildMoveBrandList() {
  const list    = document.getElementById('move-brand-list');
  list.innerHTML = '';
  const current = modalIcon ? (modalIcon.brandId || 'generic') : activeBrand;
  BRANDS.forEach(b => {
    const btn = document.createElement('button');
    btn.className   = `move-brand-opt${b.id === current ? ' current' : ''}`;
    btn.dataset.brandId = b.id;
    btn.textContent = b.name;
    list.appendChild(btn);
  });
}

document.getElementById('modal-move-btn').addEventListener('click', e => {
  e.stopPropagation();
  const isOpen = moveBrandWrap.classList.toggle('open');
  if (isOpen) buildMoveBrandList();
});

document.getElementById('move-brand-list').addEventListener('click', async e => {
  const opt = e.target.closest('.move-brand-opt');
  if (!opt || !modalIcon) return;
  const newBrandId = opt.dataset.brandId;
  if (newBrandId === (modalIcon.brandId || 'generic')) {
    moveBrandWrap.classList.remove('open');
    return;
  }
  try {
    await DB.update(modalIcon.id, { brandId: newBrandId });
    const idx = allIcons.findIndex(ic => ic.id === modalIcon.id);
    if (idx !== -1) allIcons[idx].brandId = newBrandId;
    modalIcon.brandId = newBrandId;
    const brandName = BRANDS.find(b => b.id === newBrandId)?.name || newBrandId;
    updateBrandCounts();
    updateCountBadge();
    renderGrid();
    moveBrandWrap.classList.remove('open');
    modalMenuWrap.classList.remove('open');
    toast(`Moved to ${brandName}`);
  } catch {
    toast('Move failed', 'error');
  }
});

// Delete
document.getElementById('modal-delete').addEventListener('click', async () => {
  if (!modalIcon) return;
  const id = modalIcon.id;
  try {
    await DB.delete(id);
    allIcons = allIcons.filter(ic => ic.id !== id);
    updateBrandCounts();
    updateCountBadge();
    renderGrid();
    closeModal();
    toast('Icon deleted');
  } catch {
    toast('Delete failed', 'error');
  }
});

// Close menu when clicking outside
document.addEventListener('click', e => {
  if (!modalMenuWrap.contains(e.target)) {
    modalMenuWrap.classList.remove('open');
    moveBrandWrap.classList.remove('open');
  }
});


/* ═══════════════════════════════════════════════════════════════
   Theme toggle (dark ↔ light)
   ═══════════════════════════════════════════════════════════════ */
const THEME_KEY   = 'iconvault-theme';
const themeToggle = document.getElementById('theme-toggle');
const switchIcon  = document.getElementById('switch-icon');

const SUN_PATH  = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
const MOON_PATH = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';

function applyTheme(isLight) {
  document.documentElement.classList.toggle('light', isLight);
  themeToggle.checked  = isLight;
  switchIcon.innerHTML = isLight ? SUN_PATH : MOON_PATH;
  localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
}

const saved       = localStorage.getItem(THEME_KEY);
const preferLight = saved
  ? saved === 'light'
  : window.matchMedia('(prefers-color-scheme: light)').matches;
applyTheme(preferLight);
themeToggle.addEventListener('change', () => applyTheme(themeToggle.checked));


/* ═══════════════════════════════════════════════════════════════
   Boot
   ═══════════════════════════════════════════════════════════════ */
setActiveBrand(activeBrand, { render: false });
loadIcons();
