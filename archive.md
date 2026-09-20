---
layout: page
title: Archive
description: Every post on this blog, newest first.
permalink: /archive/
---

{% assign posts_by_year = site.posts | group_by_exp: "post", "post.date | date: '%Y'" %}
{% for year in posts_by_year %}
<section class="archive-year" aria-label="Posts from {{ year.name }}">
  <h2>{{ year.name }} <span class="muted">({{ year.items.size }} post{% if year.items.size != 1 %}s{% endif %})</span></h2>
  <ul class="archive-list">
    {% for post in year.items %}
    <li>
      <span class="archive-date">{{ post.date | date: "%b %-d" }}</span>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
    </li>
    {% endfor %}
  </ul>
</section>
{% endfor %}
