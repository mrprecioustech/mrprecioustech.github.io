---
layout: post
title: "Automate the Boring Stuff: 5 Python Scripts I Actually Use"
date: 2026-08-15 09:00:00 +0000
description: "If you've done it twice, script it. Five small, practical Python automations — file cleanup, bulk renaming, log scanning and more — with complete code."
tags: [python, automation]
accent: teal
---

I have a rule: **if I've done something twice, I automate it the third time.** Not because I'm lazy — okay, partly because I'm lazy — but because computers are better at boring repetitive work than I am, and I'd rather spend that time building things.

Here are five small Python scripts I genuinely use. No frameworks, no dependencies beyond the standard library (except one). Copy them, tweak them, make them yours.

## 1. The Downloads folder rescue

Everyone's `Downloads` folder is a disaster zone. This script sorts it by file extension in seconds:

```python
from pathlib import Path

DOWNLOADS = Path.home() / "Downloads"

CATEGORIES = {
    "Images": {".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"},
    "Documents": {".pdf", ".docx", ".txt", ".md", ".xlsx", ".csv"},
    "Videos": {".mp4", ".mkv", ".mov", ".avi"},
    "Audio": {".mp3", ".wav", ".flac"},
    "Archives": {".zip", ".tar", ".gz"},
    "Installers": {".exe", ".msi", ".dmg", ".deb"},
}

def organize():
    moved = 0
    for file in DOWNLOADS.iterdir():
        if not file.is_file():
            continue
        for folder, extensions in CATEGORIES.items():
            if file.suffix.lower() in extensions:
                target = DOWNLOADS / folder / file.name
                target.parent.mkdir(exist_ok=True)
                file.rename(target)
                moved += 1
                break
    print(f"Organized {moved} files. You're welcome.")

if __name__ == "__main__":
    organize()
```

Run it monthly. Thank me later.

## 2. Bulk file renamer

Downloaded 200 photos named `IMG_20260815_143822.jpg`? Rename them all with a pattern:

```python
from pathlib import Path

def bulk_rename(folder: str, pattern: str, dry_run: bool = True):
    """Rename files to pattern-001.ext, pattern-002.ext, ..."""
    files = sorted(Path(folder).glob("*"))
    files = [f for f in files if f.is_file()]

    for i, file in enumerate(files, start=1):
        new_name = f"{pattern}-{i:03d}{file.suffix}"
        if dry_run:
            print(f"{file.name}  →  {new_name}")
        else:
            file.rename(file.parent / new_name)

if __name__ == "__main__":
    # Always dry-run first!
    bulk_rename("./photos", "vacation", dry_run=True)
```

> Always do a dry run before bulk-renaming anything. There is no undo button for `rename()`. The `dry_run` flag exists because I learned this the hard way.
{: .callout}

## 3. Log file detective

Need to find every error in a 500MB log file? Don't open it in an editor — scan it:

```python
import re
from collections import Counter
from pathlib import Path

ERROR_PATTERN = re.compile(r"ERROR|CRITICAL|Traceback", re.IGNORECASE)

def scan_logs(path: str, context_lines: int = 2):
    lines = Path(path).read_text(errors="replace").splitlines()
    error_lines = [i for i, line in enumerate(lines) if ERROR_PATTERN.search(line)]

    print(f"Found {len(error_lines)} error lines in {len(lines):,} total lines\n")

    # Show the most common error messages
    messages = Counter(
        lines[i].strip()[:100] for i in error_lines if "Traceback" not in lines[i]
    )
    print("Top errors:")
    for message, count in messages.most_common(5):
        print(f"  {count:4d}x  {message}")

if __name__ == "__main__":
    scan_logs("app.log")
```

This turns "the app is broken, good luck" into "here are the 3 errors causing 95% of the failures" in about a second.

## 4. Website uptime checker

A tiny monitor that pings your sites and tells you which ones are down:

```python
import urllib.request
from datetime import datetime

SITES = [
    "https://mrprecioustech.github.io",
    "https://github.com",
]

def check_sites():
    for site in SITES:
        try:
            with urllib.request.urlopen(site, timeout=10) as response:
                status = response.status
                print(f"✅ {site} — HTTP {status}")
        except Exception as e:
            print(f"❌ {site} — DOWN ({e})")

    print(f"\nChecked at {datetime.now():%Y-%m-%d %H:%M:%S}")

if __name__ == "__main__":
    check_sites()
```

Pair it with cron (`*/15 * * * *`) and you've got a free uptime monitor. No SaaS subscription required.

## 5. Markdown blog post scaffolder

Since I write this blog in Markdown, I made a script that creates a new Jekyll post with the front matter pre-filled:

```python
import re
from datetime import date
from pathlib import Path

TEMPLATE = """---
layout: post
title: "{title}"
date: {today} 09:00:00 +0000
description: ""
tags: []
accent: indigo
---

Write something great.
"""

def new_post(title: str):
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    today = date.today().isoformat()
    filename = f"_posts/{today}-{slug}.md"

    Path(filename).write_text(TEMPLATE.format(title=title, today=today))
    print(f"Created {filename}")

if __name__ == "__main__":
    import sys
    new_post(sys.argv[1] if len(sys.argv) > 1 else "Untitled Post")
```

```bash
python new_post.py "My Brilliant Idea"
# Created _posts/2026-08-15-my-brilliant-idea.md
```

## The automation mindset

The scripts aren't the point — the habit is. Every time you catch yourself thinking "ugh, this again," that's automation knocking. Start small:

1. **Notice** the repetition (the "ugh, this again" moment).
2. **Do it manually once more**, but pay attention to the exact steps.
3. **Script the steps** — ugly first drafts are fine.
4. **Save it somewhere** you'll find it (a `scripts/` folder, a gist, this blog).

The best automation isn't the cleverest one. It's the one you actually use.
