---
layout: page
title: Projects
description: Things I've built, broken and learned from. Source code lives on GitHub.
permalink: /projects/
---

<div class="projects-grid" markdown="0">
{% for project in site.data.projects %}
  <div class="project-card">
    <h3>
      {{ project.name }}
      {% if project.featured %}<span class="featured-badge">Featured</span>{% endif %}
    </h3>
    <p>{{ project.tagline }}</p>
    <div class="project-meta">
      <span><span class="lang-dot" aria-hidden="true"></span> {{ project.language }}</span>
    </div>
    <div class="project-tags">
      {% for tag in project.tags %}<span>{{ tag }}</span>{% endfor %}
    </div>
    <div class="project-links">
      {% if project.github != "" and project.github %}<a href="{{ project.github }}" target="_blank" rel="noopener">Code &rarr;</a>{% endif %}
      {% if project.demo != "" and project.demo %}<a href="{{ project.demo }}" target="_blank" rel="noopener">Live demo &rarr;</a>{% endif %}
      {% if project.github == "" or project.github == nil %}{% if project.demo == "" or project.demo == nil %}<span class="muted">Write-up coming soon</span>{% endif %}{% endif %}
    </div>
  </div>
{% endfor %}
</div>

## More on GitHub

These are just the highlights — there's plenty more half-finished brilliance (and a few glorious failures) on my profile.

[View all repositories](https://github.com/mrprecioustech?tab=repositories){: .btn .btn-primary }
