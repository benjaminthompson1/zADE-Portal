# zADE Portal — z/Advanced Development Environment

A single-page web portal for managing IBM z/OS systems and accessing mainframe resources, styled to match the IBM Carbon Design System. Deployed as a static WAR on IBM Liberty for z/OS.

**Live:** [https://zade.mainframehome.net/zADE-Portal/](https://zade.mainframehome.net/zADE-Portal/)

---

## Overview

The **zADE Portal** is the central access point for Ben's Big Iron Lab — a personal z/OS 3.2 homelab running ADCD z32a. It aggregates links to z/OSMF, Zowe, Db2 Query Workload Tuner, Apache Guacamole, z/OS Connect EE APIs, and documentation references into one page. It provides:

- IBM Carbon Design System look and feel (tokens, tile grid, shell header)
- IBM Plex Sans and IBM Plex Mono typography
- Real-time service status indicators with hover tooltips and a manual refresh control
- Responsive shell header with scroll-spy navigation and a mobile hamburger menu
- A single floating "back to top" button (replaces per-section links)
- Copy-to-clipboard button on every API endpoint tile
- Semantic HTML5 with ARIA labels throughout

---

## Project Structure

```
zADE-Portal/
├── index.html              # Single-page application entry point
├── assets/
│   ├── css/
│   │   └── main.css        # All layout, IBM Carbon tokens, and component styles
│   └── js/
│       └── main.js         # Navigation, scroll-spy, service status, back-to-top
├── WEB-INF/
│   └── web.xml             # Liberty WAR descriptor (welcome-file, optional CSP header)
└── README.md
```

When built as a WAR, `index.html` and the `assets/` tree sit at the WAR root and are served directly by Liberty as static resources.

---

## Features

| Feature | Description |
|---|---|
| **System Dashboard** | Quick links to z/OSMF and Zowe. |
| **Documentation Hub** | Centralised links to playbooks, JCL libraries, IBM Docs (z/OS 3.2, Db2 13), Redbooks, and support portals. |
| **Tools** | Apache Guacamole (remote desktop gateway) and MinIO Console (S3-compatible object storage). |
| **APIs** | z/OS Connect EE endpoint tiles with live status indicators, monospaced endpoint display, and copy-to-clipboard buttons. |
| **Repositories** | Links to local GitLab instance and the GitHub profile. |
| **Service Status** | Live indicators (`up`, `loading`, `unknown`, `down`) polled on page load with a manual Refresh button. Hover a dot for a tooltip showing the current state. |
| **Scroll-spy Navigation** | Fixed top nav highlights the active section as you scroll. |
| **Back to Top** | Single floating button appears after scrolling 400 px — no per-section repeated links. |
| **Responsive** | Collapsible hamburger menu on viewports ≤ 768 px. |

---

## Technologies

- **HTML5** — Semantic elements (`header`, `nav`, `main`, `section`, `article`, `footer`), ARIA roles and labels
- **CSS3** — IBM Carbon Design tokens, custom properties, Flexbox, CSS Grid, keyframe animations (no framework)
- **JavaScript (ES2017)** — IIFE-scoped, no globals; `async/await` for status polling; `defer` attribute for safe external loading
- **IBM Plex** — IBM Plex Sans (UI) and IBM Plex Mono (API endpoints) via Google Fonts CDN
- **Font Awesome 6** — Icons via cdnjs CDN
- **IBM Carbon Design System** — Colour palette, spacing scale, and UI component patterns (CSS-only, no Carbon JS/React)

> **Air-gapped environments:** Google Fonts and Font Awesome are loaded from public CDNs and will fail silently if the Liberty server cannot reach the internet. See [Self-hosting fonts and icons](#self-hosting-fonts-and-icons) below.

---

## IBM Carbon Design Tokens

| Token | Value | Usage |
|---|---|---|
| `--ibm-blue-60` | `#0f62fe` | Primary interactive colour, links, accents |
| `--ibm-blue-70` | `#0043ce` | Hover state for interactive elements |
| `--ibm-blue-10` | `#edf5ff` | Tile hover background, API endpoint background |
| `--ibm-gray-100` | `#161616` | Shell header background |
| `--ibm-gray-10` | `#f4f4f4` | Breadcrumb strip background |
| `--ibm-green-50` | `#24a148` | Service status — reachable |
| `--ibm-red-60` | `#da1e28` | Service status — unreachable |
| `--ibm-yellow-30` | `#f1c21b` | Service status — unknown |
| `--ibm-teal-40` | `#009d9a` | API tile accent border |

---

## Packaging and Deploying as a Liberty WAR

### Prerequisites

- A z/OS Liberty server with at least the `servlet-4.0` (or `servlet-5.0`) and `jsp-2.3` features enabled — though this portal is pure HTML/CSS/JS and requires no servlet or JSP features at runtime.
- `zip` available on your workstation or z/OS UNIX System Services (USS) shell.

> `WEB-INF/web.xml` is included in the repository — no manual creation required.
> Use `xmlns="http://xmlns.jcp.org/xml/ns/javaee"` and `version="4.0"` if your Liberty
> server uses Jakarta EE 8 / Java EE 8 (`servlet-4.0` feature).

### Step 1 — Build the WAR on your workstation

From the repository root (the directory containing `index.html`):

```bash
# Confirm the layout before zipping
find . -not -path './.git/*' -not -name '.gitignore' | sort

# Create the WAR (a WAR is a ZIP with a WEB-INF directory)
Compress-Archive -Path index.html, assets\*, WEB-INF\* -DestinationPath zADE-Portal.war -Force
```

Expected ZIP contents:

```
index.html
assets/css/main.css
assets/js/main.js
WEB-INF/web.xml
```

### Step 2 — Transfer the WAR to z/OS

Transfer the WAR as a **binary** file. In this homelab FTP is the primary method.

**Using FTP (homelab default):**

```
ftp s0w1.dal-ebis.ihost.com
ftp> binary
ftp> cd /global/wlpCfg/servers/wlps01a/dropins
ftp> put zADE-Portal.war
ftp> quit
```

> Always use `binary` mode before transferring a WAR. ASCII mode will corrupt the ZIP structure and Liberty will fail to expand it.

**Using SFTP (alternative):**

```bash
sftp user@s0w1.dal-ebis.ihost.com
sftp> binary
sftp> put zADE-Portal.war /global/wlpCfg/servers/wlps01a/dropins/zADE-Portal.war
sftp> quit
```

**Using `scp` (alternative):**

```bash
scp -O zADE-Portal.war user@s0w1.dal-ebis.ihost.com:/global/wlpCfg/servers/wlps01a/dropins/zADE-Portal.war
```

> The `-O` flag forces `scp` to use the legacy SCP protocol, which is more reliable for z/OS SSH servers.

### Step 3 — Liberty auto-deployment

Liberty monitors the `dropins/` directory and deploys the WAR automatically. Check the Liberty messages log to confirm:

```
[AUDIT] CWWKZ0001I: Application zADE-Portal started in X.XXX seconds.
```

The portal will be available at:

```
https://zade.mainframehome.net/zADE-Portal/
```

### Step 4 — Verify

Open the URL in a browser. Confirm:

- The IBM shell header and tile grid render correctly.
- The breadcrumb shows `IBM / zADE Environment / Portal`.
- Status dots cycle through `loading` → `up` or `down` for each tile; hovering a dot shows a tooltip.
- Copy buttons appear on each API endpoint tile and write the URL to the clipboard.
- The floating "back to top" button appears after scrolling.

---

## Optional: Configuring a Content Security Policy

Because all scripts and styles are now in external files (no inline `<script>` or `style` attributes), Liberty can enforce a strict CSP. Add a filter or response header in `WEB-INF/web.xml`:

```xml
<filter>
  <filter-name>CSPFilter</filter-name>
  <filter-class>com.ibm.placeholder.CSPFilter</filter-class>
</filter>
```

Or, simpler — add the header directly in `server.xml` using Liberty's `httpEndpoint` response headers:

```xml
<httpEndpoint id="defaultHttpEndpoint" ...>
  <headers>
    <add>Content-Security-Policy: default-src 'self';
      script-src 'self';
      style-src 'self' https://cdnjs.cloudflare.com https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com;
      img-src 'self' https://www.ibm.com data:;
      connect-src 'self' https: http:;
    </add>
  </headers>
</httpEndpoint>
```

> `connect-src https: http:` is required because `main.js` uses `fetch()` to poll your homelab services over HTTPS and HTTP.

---

## Self-hosting Fonts and Icons

For air-gapped z/OS environments with no internet access:

**Font Awesome**

1. Download the "Web" release from [fontawesome.com/download](https://fontawesome.com/download).
2. Copy `css/all.min.css` to `assets/fonts/fontawesome/css/all.min.css`.
3. Copy the `webfonts/` directory to `assets/fonts/fontawesome/webfonts/`.
4. In `index.html`, replace the cdnjs `<link>` with:
   ```html
   <link rel="stylesheet" href="assets/fonts/fontawesome/css/all.min.css" />
   ```

**IBM Plex (Google Fonts)**

1. Download the variable or static fonts from [github.com/IBM/plex](https://github.com/IBM/plex/releases).
2. Place the `.woff2` files under `assets/fonts/ibm-plex/`.
3. Remove the two Google Fonts `<link>` tags from `index.html`.
4. Add `@font-face` rules to `assets/css/main.css` pointing to the local files.

---

## Maintainer

**Benjamin Thompson**
GitHub: [@benjaminthompson1](https://github.com/benjaminthompson1)
