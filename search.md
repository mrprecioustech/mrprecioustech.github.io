---
layout: page
title: Search
description: Search every post on this blog. Fast, private, and works offline once loaded.
permalink: /search/
---

<div class="search-box" role="search">
  <input class="search-input" type="search" id="search-input" name="q" placeholder="Try &quot;javascript&quot;, &quot;python&quot;, &quot;css&quot;…" autocomplete="off" aria-label="Search posts">
</div>
<p class="search-meta" id="search-count" aria-live="polite"></p>
<div id="search-results"></div>

<noscript>
  <p>Search needs JavaScript. In the meantime, you can browse the <a href="{{ '/archive/' | relative_url }}">archive</a> or the <a href="{{ '/tags/' | relative_url }}">topics page</a>.</p>
</noscript>
