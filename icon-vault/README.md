# IconVault

A zero-dependency, single-file SVG icon manager that runs entirely in the browser.
Icons are stored persistently in IndexedDB — no server, no backend, no build step required.

## Features

- Drag & drop or browse to upload `.svg` files
- Persistent storage via IndexedDB (survives page refresh)
- Responsive grid (2 → 6 columns)
- Search icons by filename
- Copy SVG source code to clipboard
- Download individual icons as `.svg`
- Delete icons from the library
- Dark theme, works offline after first load

## Deploy to GitHub Pages

### 1. Fork this repository

Click **Fork** at the top-right of this page to copy it to your GitHub account.

### 2. Enable GitHub Pages

1. Go to your forked repository on GitHub.
2. Click **Settings** → **Pages** (left sidebar).
3. Under **Source**, select:
   - Branch: `main`
   - Folder: `/ (root)`
4. Click **Save**.

GitHub will publish the site at:

```
https://<your-username>.github.io/<repository-name>/icon-vault/
```

### 3. That's it

The only file needed is `index.html`. No npm install, no build, no CI.

## Local development

Open `index.html` directly in any modern browser — or serve it with any static file server:

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .
```

Then visit `http://localhost:8080`.

> **Note:** IndexedDB requires a proper origin (localhost or https). Opening the file
> via `file://` may work in some browsers but is not guaranteed.
