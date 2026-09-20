---
layout: page
title: Tags
description: Browse every post by topic.
permalink: /tags/
---

<ul class="tag-cloud" aria-label="All topics">
  {% assign sorted_tags = site.tags | sort %}
  {% for tag in sorted_tags %}
  {% assign tag_slug = tag[0] | slugify %}
  <li>
    <a class="tag-pill" href="#{{ tag_slug }}">#{{ tag[0] }} <span class="tag-count">{{ tag[1].size }}</span></a>
  </li>
  {% endfor %}
</ul>

{% for tag in sorted_tags %}
{% assign tag_slug = tag[0] | slugify %}
<section class="tag-group" aria-label="Posts tagged {{ tag[0] }}">
  <h2 id="{{ tag_slug }}">#{{ tag[0] }} <span class="tag-count">{{ tag[1].size }}</span></h2>
  <ul class="archive-list">
    {% for post in tag[1] %}
    <li>
      <span class="archive-date">{{ post.date | date: "%b %-d, %Y" }}</span>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
    </li>
    {% endfor %}
  </ul>
</section>
{% endfor %}
