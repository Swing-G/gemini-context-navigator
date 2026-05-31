# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gemini Context Navigator is a Chrome Extension (Manifest V3) that adds a structured table-of-contents sidebar to Google Gemini conversations. It scans user messages in the DOM, builds a navigable TOC, and provides quick-jump controls for long conversation threads.

## Build & Development

- **No build step** — this is vanilla JavaScript loaded directly by Chrome. No bundler, no package manager, no transpilation.
- **Load in Chrome**: Go to `chrome://extensions/`, enable Developer mode, click "Load unpacked", and select the project root (the directory containing `manifest.json`).
- **Reload after changes**: Click the reload icon on the extension card in `chrome://extensions/`, then refresh your Gemini tab.
- **No test framework exists** yet. There are no test files or testing dependencies.

## Architecture

The extension is a single content script injected at `document_idle` on `https://gemini.google.com/*`. All classes live on the global scope (no module system).

### Load Order (defined in `manifest.json`)

1. `src/config/config.js` — `GeminiNavigatorConfig` global
2. `src/utils/utils.js` — `GeminiNavigatorUtils` global (debounce, throttle, hash, text helpers)
3. `src/services/storage.js` — `GeminiNavigatorStorage` class
4. `src/features/domScanner.js` — `GeminiNavigatorScanner` class
5. `src/features/scroll.js` — `GeminiNavigatorScroll` class
6. `src/ui/ui.js` — `GeminiNavigatorUI` class
7. `src/content.js` — `GeminiNavigator` orchestrator class, instantiated at script end

### Key Classes & Responsibilities

- **`GeminiNavigator`** (`src/content.js`): Orchestrator. Initializes all subsystems, sets up the `MutationObserver` on the conversation container (with fallback to `document.body` and retry logic if the container isn't found immediately), watches URL changes (SPA navigation), runs `scanMessages()` on DOM mutations (debounced 500ms), and syncs active TOC item on scroll (throttled 150ms via scroll spy).

- **`GeminiNavigatorScanner`** (`src/features/domScanner.js`): Finds user message DOM elements using a multi-strategy fallback: (1) `GeminiNavigatorConfig.selectors.userMessage` CSS selector, (2) partial className match on `user-query`, (3) finding ancestor elements of user-avatar images. Change detection via fingerprint hash of element count + first-30-chars of each message text — avoids re-rendering when the DOM hasn't meaningfully changed.

- **`GeminiNavigatorScroll`** (`src/features/scroll.js`): Scrolls to elements, scrolls to top/bottom, determines which message is closest to viewport center (for scroll-spy highlighting), and computes next/previous message for navigation.

- **`GeminiNavigatorUI`** (`src/ui/ui.js`): Creates three UI components injected into the page: (1) sidebar with TOC list + pinned messages section, (2) floating toggle button (draggable with edge-snap on release), (3) bottom-right quick-actions bar. Toggle button opens sidebar on hover; the sidebar stays open while the user hovers either the button or sidebar. Has a "user browsing" detection to prevent auto-scrolling the TOC while the user is manually scrolling it.

- **`GeminiNavigatorStorage`** (`src/services/storage.js`): Wraps `chrome.storage.sync` for persisting user settings (accent color, background color, TOC limit).

### CSS Theme System (`style.css`)

All styles use CSS custom properties prefixed `--gn-*`. There are two theme paths:
1. **Light mode** — default `:root` values
2. **Dark mode** — `@media (prefers-color-scheme: dark)` media query OR Gemini's own dark theme class selectors (`html[dark]`, `body.dark-theme`, etc.)

The `GeminiNavigatorUI.applySettings()` method overrides `--gn-accent-color` and `--gn-bg-color` at runtime via `document.documentElement.style.setProperty()`.

### DOM Selection Strategy

Gemini's DOM uses web component tags (e.g., `<infinite-scroller>`) and `data-test-id` attributes. The extension uses configurable CSS selectors in `GeminiNavigatorConfig.selectors` with cascading fallbacks in `findUserMessageElements()` — important because Google can change Gemini's DOM structure at any time.

### Key Design Patterns

- **No framework** — everything is vanilla DOM manipulation
- **Global namespace** — all classes/objects prefixed with `GeminiNavigator` to avoid collisions
- **Debounced DOM scanning** — MutationObserver triggers a debounced (500ms) scan
- **Fingerprint-based change detection** — avoids unnecessary UI rebuilds
- **Passive scroll listeners** — `{ passive: true }` for scroll performance
- **Multi-strategy element finding** — CSS selector → className partial match → avatar-image ancestor traversal
