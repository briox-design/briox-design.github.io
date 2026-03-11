'use strict';

/* ═══════════════════════════════════════════════════════════════
   IndexedDB wrapper
   ═══════════════════════════════════════════════════════════════ */
const DB = (() => {
  const DB_NAME    = 'IconVault';
  const DB_VERSION = 1;
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

  return {
    add(record) {
      return tx('readwrite').then(({ store }) => promisify(store.add(record)));
    },
    getAll() {
      return tx('readonly').then(({ store }) => promisify(store.getAll()));
    },
    delete(id) {
      return tx('readwrite').then(({ store }) => promisify(store.delete(id)));
    },
    clear() {
      return tx('readwrite').then(({ store }) => promisify(store.clear()));
    }
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
let allIcons = [];  // full list from DB
let query    = '';  // current search string


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
   Render
   ═══════════════════════════════════════════════════════════════ */
function updateCountBadge() {
  const badge = document.getElementById('count-badge');
  const n = allIcons.length;
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
      <button class="btn btn-destructive btn-sm" data-action="delete" title="Delete icon">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
        Delete
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

  const q        = query.trim().toLowerCase();
  const filtered = q
    ? allIcons.filter(ic => ic.name.toLowerCase().includes(q))
    : allIcons;

  grid.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'block';
    grid.style.display = 'none';
    if (allIcons.length === 0) {
      emptyTitle.textContent = 'No icons yet';
      emptySub.textContent   = 'Upload your first SVG to get started';
      document.getElementById('empty-upload-btn').style.display = '';
    } else {
      emptyTitle.textContent = 'No results';
      emptySub.textContent   = `No icons match "${q}"`;
      document.getElementById('empty-upload-btn').style.display = 'none';
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
  updateCountBadge();
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
   Card action handler (event delegation)
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

  if (action === 'delete') {
    try {
      await DB.delete(id);
      allIcons = allIcons.filter(ic => ic.id !== id);
      updateCountBadge();
      renderGrid();
      toast('Icon deleted');
    } catch {
      toast('Delete failed', 'error');
    }
  }
});


/* ═══════════════════════════════════════════════════════════════
   Drag & drop
   ═══════════════════════════════════════════════════════════════ */
const dropzone = document.getElementById('dropzone');

dropzone.addEventListener('dragenter', e => {
  e.preventDefault();
  dropzone.classList.add('drag-over');
});
dropzone.addEventListener('dragover', e => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
});
dropzone.addEventListener('dragleave', e => {
  if (!dropzone.contains(e.relatedTarget)) {
    dropzone.classList.remove('drag-over');
  }
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

const saved      = localStorage.getItem(THEME_KEY);
const preferLight = saved
  ? saved === 'light'
  : window.matchMedia('(prefers-color-scheme: light)').matches;
applyTheme(preferLight);

themeToggle.addEventListener('change', () => applyTheme(themeToggle.checked));


/* ═══════════════════════════════════════════════════════════════
   Boot
   ═══════════════════════════════════════════════════════════════ */
loadIcons();
