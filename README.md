# MrPreciousTech.github.io

A personal tech blog built with [Jekyll](https://jekyllrb.com) and hosted for free on [GitHub Pages](https://pages.github.com).

**Live site:** <https://mrprecioustech.github.io>

## Features

- ✍️ Markdown posts with syntax highlighting (Rouge), callouts, tables, footnotes
- 🌓 Dark / light mode with system-preference detection and no-flash loader
- 🔍 Client-side search (generated `search.json`, no third-party service)
- 📖 Reading progress bar, auto table of contents with scroll-spy, copy-code buttons
- 🏷️ Tags, archive, pagination, related posts, prev/next navigation
- 📡 RSS feed, sitemap, SEO meta tags (`jekyll-feed`, `jekyll-seo-tag`, `jekyll-sitemap`)
- 💬 Optional comments via [Giscus](https://giscus.app) (commented out until you enable Discussions)
- 🛠️ Admin panel at `/admin/` — static CMS (dashboard, post/draft manager, Markdown generator with live preview, no server required)
- 🚀 CI/CD: GitHub Actions builds on every PR and deploys `main` to Pages
- 📱 Fully responsive, keyboard accessible, no frameworks or build step for assets

## Quickstart

Requirements: Ruby 3.1+ and Bundler.

```bash
git clone https://github.com/mrprecioustech/mrprecioustech.github.io.git
cd mrprecioustech.github.io
bundle install
bundle exec jekyll serve
```

Open <http://localhost:4000>. To preview drafts too:

```bash
bundle exec jekyll serve --drafts
```

## Project structure

```
├── _config.yml          # Site settings (title, author, plugins, pagination…)
├── _data/               # Navigation, social links, projects
├── _drafts/             # Unpublished posts (no date in filename needed)
├── _includes/           # Reusable components (header, footer, cards…)
├── _layouts/            # Page templates (default, home, post, page)
├── _posts/              # Published posts: YEAR-MONTH-DAY-title.md
├── assets/
│   ├── css/style.css    # The entire theme (custom properties for theming)
│   ├── css/admin.css    # Admin panel styles (sidebar, tables, forms)
│   ├── js/main.js       # Theme toggle, search, TOC, progress… (vanilla JS)
│   ├── js/interview-prep.js # PrepLab question bank, mocks, STAR builder, AI coach
│   ├── js/admin.js      # Admin app (dashboard, CRUD, preview, localStorage)
│   └── images/          # favicon.svg, avatar.svg
├── admin/               # Static CMS — /admin/ (login gate + dashboard)
├── .github/workflows/   # Build + deploy to GitHub Pages
└── index.html           # Homepage (paginated post feed)
```

## Writing a post

Create `_posts/2026-09-20-my-post.md`:

````markdown
---
layout: post
title: "My Post Title"
date: 2026-09-20 09:00:00 +0000
description: "One or two sentences for cards, SEO and search."
tags: [javascript, tutorial]
accent: indigo   # cover gradient: indigo, violet, teal, amber, rose, slate
featured: false  # true → pinned in the homepage "Start here" section
toc: true        # table of contents sidebar
comments: true   # requires Giscus setup in _config.yml
---

Your Markdown here. Code fences get highlighting + copy buttons:

```javascript
console.log("hello");
```
````

A couple of gotchas worth knowing:

- **Liquid is processed before Markdown.** If your post shows `{{ }}` or `{% %}` code, wrap it in `{% raw %}` … `{% endraw %}` or Jekyll will try to render it.
- **Filenames matter.** Posts must be named `YEAR-MONTH-DAY-slug.md` or Jekyll ignores them.
- **Future dates don't publish** unless you build with `--future`.

## Customization

| Want to change… | Edit… |
|---|---|
| Site title, tagline, author, bio | `_config.yml` |
| Nav links | `_data/navigation.yml` |
| Social icons (footer) | `_data/socials.yml` (icons: `github`, `x`, `linkedin`, `youtube`, `mail`, `rss`) |
| Projects page | `_data/projects.yml` |
| Colors, fonts, spacing | CSS variables at the top of `assets/css/style.css` |
| Homepage sections | `_layouts/home.html` |
| Post layout (share, author, related) | `_layouts/post.html` |
| Favicon / avatar | `assets/images/*.svg` |

### Enabling comments (Giscus)

1. In this repo: **Settings → General → Discussions** (check the box).
2. Install the [Giscus app](https://github.com/apps/giscus) on this repo.
3. On [giscus.app](https://giscus.app), enter the repo name and copy the IDs.
4. Uncomment the `giscus:` block in `_config.yml` and paste them in.

### Analytics (optional)

The theme ships without tracking. To add privacy-friendly analytics (Plausible, Umami…), paste the provider's snippet at the end of `_includes/head.html`.

## Admin panel

A fully static, zero-backend CMS lives at `/admin/` (not linked in navigation — visit directly).

- **Access:** open `/admin/`, password is `admin` (client-side demo gate — GitHub Pages has no server). For production, protect with Cloudflare Access or set `exclude: [admin]` in `_config.yml` to keep it out of the build.
- **Features:** dashboard stats + recent posts/activity, searchable post table (from `search.json`), drafts in `localStorage`, new-post generator (front-matter form → live preview via `marked.js` → downloadable `_posts/YYYY-MM-DD-slug.md`), media placeholder, settings/export.
- **Workflow:** *Save draft* (browser only) → *Download .md* → move to `_posts/` → `git commit` + push to `main` → Pages deploy.
- **Stack:** vanilla JS, no dependencies except CDN `marked` for preview, reuses site design tokens.

Try it locally: `bundle exec jekyll serve --drafts` → http://localhost:4000/admin/ (password `admin`).

## Deployment

Pushing to `main` triggers `.github/workflows/jekyll.yml`: it builds with `JEKYLL_ENV=production` and deploys to GitHub Pages. Pull requests get a build check but are not deployed.

First-time setup: repo **Settings → Pages → Source → GitHub Actions**, then push to `main`.

## License

Code (theme, layouts, CSS, JS) is [MIT](LICENSE) — steal freely, attribution appreciated. Blog post content is © Mr Precious unless noted otherwise.
