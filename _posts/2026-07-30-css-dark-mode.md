---
layout: post
title: "Dark Mode Done Right with CSS Custom Properties"
date: 2026-07-30 09:00:00 +0000
description: "A complete recipe for theming: CSS variables, a no-flash loader script, system-preference detection and a persistent toggle — in under 60 lines."
tags: [css, webdev, tutorial]
accent: slate
---

Every site needs dark mode now. The good news: with CSS custom properties, it's genuinely easy — no CSS-in-JS, no duplicate stylesheets, no build step. This exact technique powers the theme toggle on this blog. Here's the full recipe.

## The core idea

Define every color **once** as a CSS variable, then redefine the variables under a `[data-theme="dark"]` selector. Everything else in your CSS references variables, never raw colors:

```css
:root {
  --bg: #ffffff;
  --text: #101828;
  --muted: #5b6474;
  --border: #e4e7ee;
  --accent: #4f46e5;
}

[data-theme="dark"] {
  --bg: #0b0f19;
  --text: #e7ebf3;
  --muted: #9aa4b8;
  --border: #202941;
  --accent: #818cf8;
}

body {
  background: var(--bg);
  color: var(--text);
}
```

Toggle the `data-theme` attribute on `<html>` and the entire site re-themes instantly. That's 90% of the work.

## Don't hardcode colors — anywhere

The one discipline this requires: **every color in your CSS must be a variable.** The moment you write `color: #333` in some component, you've created a spot that won't theme. A few tips:

- Do an audit pass: search your CSS for `#` and `rgb(` outside the token definitions.
- Give semantic names (`--text`, `--muted`, `--border`) not color names (`--gray-500`).
- Remember the sneaky ones: `box-shadow`, `border-color`, SVG `fill`/`stroke`, `::selection`, and form controls.

```css
/* Bad: invisible in dark mode */
.card { border: 1px solid #e4e7ee; }

/* Good: themes automatically */
.card { border: 1px solid var(--border); }
```

## Respect the system preference

Don't default everyone to light mode. CSS can detect the OS setting:

```css
/* Optional: default to dark for dark-mode OS users, before JS runs */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --bg: #0b0f19;
    --text: #e7ebf3;
    /* ... same dark tokens ... */
  }
}
```

But duplicating tokens is ugly. Better: handle it in JavaScript (next section) and use the media query only as a signal, not a styling mechanism.

## Kill the flash (FOUC)

Here's the classic dark-mode bug: the page paints light, then JavaScript loads and flips it to dark. That flash is jarring. The fix is a tiny **blocking script in `<head>`** that sets the theme before first paint:

```html
<script>
  (function () {
    try {
      var saved = localStorage.getItem("my-theme");
      var theme = saved || (window.matchMedia(
        "(prefers-color-scheme: dark)").matches ? "dark" : "light");
      document.documentElement.setAttribute("data-theme", theme);
    } catch (e) {
      document.documentElement.setAttribute("data-theme", "light");
    }
  })();
</script>
```

Yes, it's render-blocking — that's the entire point. It's 10 lines; the cost is negligible and the flash is gone.

## The toggle button

With the loader script in place, the toggle itself is trivial:

```javascript
var KEY = "my-theme";

document.getElementById("theme-toggle").addEventListener("click", function () {
  var current = document.documentElement.getAttribute("data-theme");
  var next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem(KEY, next);
  } catch (e) { /* private browsing mode */ }
});
```

Priority order, which the loader script implements:

1. **Saved preference** in `localStorage` (explicit user choice wins).
2. **OS preference** via `prefers-color-scheme`.
3. **Light** as the fallback.

## Show the right icon

Your toggle should show a sun in dark mode and a moon in light mode (i.e., show what you'll switch *to*). Pure CSS, no JS needed:

```css
.theme-toggle .icon-moon { display: none; }

[data-theme="dark"] .theme-toggle .icon-sun { display: none; }
[data-theme="dark"] .theme-toggle .icon-moon { display: block; }
```

Both SVGs live in the button; CSS shows the right one.

## Polish: smooth transitions

An instant flip can feel abrupt. A short transition on the main surfaces smooths it out:

```css
body {
  transition: background-color 0.25s ease, color 0.25s ease;
}
```

Keep it subtle (under 300ms) and only on large surfaces — transitioning every element's colors can cause lag on big pages. And respect users who prefer reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  body { transition: none; }
}
```

## Checklist

Before you ship dark mode, verify:

- [ ] Every color is a variable (search for `#` and `rgb(`)
- [ ] Blocking loader script in `<head>` — no flash on reload
- [ ] Saved preference beats OS preference beats default
- [ ] Toggle icon reflects the *target* theme
- [ ] `theme-color` meta tags for the mobile browser chrome
- [ ] Code blocks, tables, images and shadows all checked in both themes
- [ ] Reduced-motion users don't get the transition

Dark mode done right is invisible: users just feel like the site respects them. Now go theme something.
