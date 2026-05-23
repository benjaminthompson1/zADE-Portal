# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**zADE Portal** is a static single-page web application (SPA) serving as a centralized access portal for IBM z/OS mainframe resources in a personal homelab ("Ben's Big Iron Lab", ADCD z32a / z/OS 3.2). It is deployed as a WAR file on IBM Liberty running on z/OS.

Tech stack: pure HTML5, CSS3, and vanilla JavaScript (ES2017). No build framework, no npm, no bundler — the SPA has zero runtime dependencies beyond CDN-hosted IBM Plex fonts and Font Awesome icons.

## Packaging & Deployment

There is no build tool. Packaging is done manually:

```powershell
# Windows — create WAR from repo root
Compress-Archive -Path index.html, assets\*, WEB-INF\* -DestinationPath zADE-Portal.war -Force
```

```bash
# Unix equivalent
zip -r zADE-Portal.war index.html assets/ WEB-INF/
```

Deployment: transfer `zADE-Portal.war` to the Liberty server's `dropins/` directory **in binary mode** (FTP binary). Liberty auto-deploys. The app is served at `https://zade.mainframehome.net/zADE-Portal/`.

`WEB-INF/web.xml` is a minimal Jakarta EE 5.0 servlet descriptor — Liberty needs it to recognize the WAR as a web application.

## Architecture

All application code lives in three files:

- [index.html](index.html) — full SPA markup; 5 content sections (System Management, Documentation & Reference, Tools, APIs, Repositories) plus fixed shell header, two modals (Help, Lab Info), and a footer
- [assets/css/main.css](assets/css/main.css) — all styles; built on IBM Carbon Design tokens defined as CSS custom properties at `:root`; no external CSS framework
- [assets/js/main.js](assets/js/main.js) — all interactivity

### JavaScript features in `main.js`

- **Service status polling** — `checkService()` fetches 8 endpoints on page load (HEAD with GET fallback, 8 s timeout, `no-cors` mode); updates coloured status dots
- **Scroll-spy** — `IntersectionObserver` highlights the active nav link and sets `aria-current`
- **Back-to-top button** — appears after scrolling 400 px
- **Hamburger menu** — responsive nav collapse/expand (breakpoint: 768 px)
- **Copy-to-clipboard** — copies API endpoint URLs with icon animation and toast feedback
- **Modal management** — Help and Lab Info dialogs; Escape key and backdrop-click dismiss
- **Toast notifications** — ephemeral messages for clipboard and error feedback

### CSS conventions

- Design tokens: 12 IBM Carbon colour ramps + spacing scale (`--spacing-02` … `--spacing-09`) defined in `:root`
- Component naming follows IBM Carbon conventions (e.g. `.cds--header`, `.bx--tile`)
- Responsive breakpoint: hamburger menu at `max-width: 768px`
- No inline styles in HTML; all overrides go in `main.css`

## Key Constraints

- **No inline scripts or styles** — keeps the page CSP-friendly
- **Air-gap compatibility** — Font Awesome and IBM Plex fonts can be swapped to self-hosted copies if the z/OS environment has no internet access (CDN URLs are in `index.html` `<head>`)
- **Binary FTP transfer** — WAR must be transferred in binary mode; ASCII mode corrupts the ZIP structure Liberty depends on
