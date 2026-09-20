---
layout: post
title: "How I Built This Blog: Jekyll + GitHub Pages for Free"
date: 2026-09-10 09:00:00 +0000
description: "No database, no server bills, no CMS lock-in. Here's exactly how I built and deployed this blog with Jekyll and GitHub Pages — and how you can too."
tags: [jekyll, webdev, tutorial]
accent: violet
---

This blog you're reading right now costs me exactly **$0 per month** to run. No hosting bill, no database, no CMS subscription. It's a static site built with [Jekyll](https://jekyllrb.com) and hosted on [GitHub Pages](https://pages.github.com). Here's the full recipe.

## Why Jekyll?

Jekyll is a static site generator: you write posts in Markdown, and it turns them into plain HTML files. For a personal blog, that means:

- **Free hosting** — GitHub Pages serves static sites for free, straight from your repo.
- **Blazing fast** — there's no database or server-side rendering. Just files.
- **Version controlled** — every post is a commit. Full history, branches, pull requests for your own blog.
- **Markdown-native** — if you can write a README, you can write a blog post.

## Step 1: Create the repository

GitHub gives every user one special repository: `<username>.github.io`. Push a site there and it goes live at `https://<username>.github.io`. Create it, then clone it locally:

```bash
git clone https://github.com/<username>/<username>.github.io.git
cd <username>.github.io
```

## Step 2: Set up Jekyll

You'll need Ruby. On most systems:

```bash
# macOS (with Homebrew)
brew install ruby

# Ubuntu / Debian
sudo apt install ruby-full build-essential

# Then install Jekyll
gem install jekyll bundler
```

Create a `Gemfile` in your repo root so builds are reproducible:

```ruby
source "https://rubygems.org"

gem "jekyll", "~> 4.3.0"
gem "jekyll-feed", "~> 0.17"      # RSS feed
gem "jekyll-seo-tag", "~> 2.8"    # meta tags
gem "jekyll-sitemap", "~> 1.4"    # sitemap.xml
gem "jekyll-paginate", "~> 1.1"   # homepage pagination
gem "webrick", "~> 1.8"           # `jekyll serve` on Ruby 3+
```

## Step 3: Add the config

Jekyll is configured with a single YAML file, `_config.yml`:

```yaml
title: My Awesome Blog
description: Thoughts on code and other things.
url: https://<username>.github.io

permalink: pretty
markdown: kramdown

plugins:
  - jekyll-feed
  - jekyll-seo-tag
  - jekyll-sitemap
  - jekyll-paginate

paginate: 5
paginate_path: /page:num/
```

## Step 4: Write your first post

Posts live in `_posts/` and follow a strict naming convention: `YEAR-MONTH-DAY-title.md`. Each one starts with **front matter** — a YAML block that Jekyll reads for metadata:

{% raw %}
```markdown
---
layout: post
title: "My First Post"
date: 2026-09-10 09:00:00 +0000
tags: [hello, blogging]
---

Hello, world! This is my first post.

## A section heading

Some text with `inline code` and a [link](https://example.com).
```
{% endraw %}

The {% raw %}`{{ site.title }}`{% endraw %} style double-curly syntax you see in Jekyll themes is **Liquid**, the templating language. Layouts in `_layouts/` and reusable snippets in `_includes/` let you build pages from components:

{% raw %}
```liquid
{% for post in site.posts limit: 5 %}
  <a href="{{ post.url }}">{{ post.title }}</a>
{% endfor %}
```
{% endraw %}

> Inside your own posts, wrap any Liquid-looking code in raw tags ({{ "{%" }} raw {{ "%}" }} … {{ "{%" }} endraw {{ "%}" }}), otherwise Jekyll will try to render it. Ask me how I know.
{: .callout}

## Step 5: Preview locally

```bash
bundle install
bundle exec jekyll serve
```

Open `http://localhost:4000` and there's your blog, with live rebuilds on every save.

## Step 6: Deploy with GitHub Actions

The modern way to publish is a workflow file at `.github/workflows/jekyll.yml` that builds your site and deploys it to Pages on every push to `main`:

{% raw %}
```yaml
name: Deploy Jekyll site to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: "3.3"
          bundler-cache: true
      - uses: actions/configure-pages@v5
      - run: bundle exec jekyll build
        env:
          JEKYLL_ENV: production
      - uses: actions/upload-pages-artifact@v3

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```
{% endraw %}

Then go to your repo's **Settings → Pages** and set **Source** to **GitHub Actions**. Push to `main`, wait a minute, and your blog is live. Every future post is just `git push` away.

## What I added on top

The basics above get you a working blog in an afternoon. This site adds a few extras, all in the repo if you want to steal ideas:

| Feature | How |
|---|---|
| Custom theme, dark mode | Hand-written CSS + a tiny JS toggle |
| Client-side search | A generated `search.json` + ~60 lines of vanilla JS |
| Reading progress + TOC | ~40 lines of vanilla JS, no libraries |
| Comments (optional) | [Giscus](https://giscus.app), backed by GitHub Discussions |
| SEO + social cards | `jekyll-seo-tag` does the heavy lifting |

## Final thoughts

Could I have used Next.js, Astro, or Hugo? Sure — they're all great. But for a personal blog, Jekyll hits a sweet spot: dead simple, free forever, and boring in the best possible way. The less time I spend on infrastructure, the more time I spend writing.

Now stop reading about blogging platforms and go write something. The best blog setup is the one that's already published.
