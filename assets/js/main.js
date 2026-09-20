/* ======================================================================
   MrPreciousTech — vanilla JS: theme, nav, TOC, search, copy buttons…
   No dependencies. Every feature guards for missing elements.
   ====================================================================== */
(function () {
  'use strict';

  var THEME_KEY = 'mpt-theme';

  function baseUrl() {
    var meta = document.querySelector('meta[name="site-baseurl"]');
    return meta ? meta.getAttribute('content') : '';
  }

  /* ---------- Theme toggle ---------- */
  var themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* private mode */ }
      themeToggle.setAttribute('aria-label', next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  /* ---------- Mobile menu ---------- */
  var menuToggle = document.getElementById('menu-toggle');
  var mobileMenu = document.getElementById('mobile-menu');
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      var open = mobileMenu.hasAttribute('hidden');
      if (open) {
        mobileMenu.removeAttribute('hidden');
        menuToggle.setAttribute('aria-expanded', 'true');
        menuToggle.setAttribute('aria-label', 'Close menu');
      } else {
        mobileMenu.setAttribute('hidden', '');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Open menu');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mobileMenu.hasAttribute('hidden')) {
        menuToggle.click();
        menuToggle.focus();
      }
    });
  }

  /* ---------- Header shadow + back-to-top visibility ---------- */
  var header = document.getElementById('site-header');
  var toTop = document.getElementById('to-top');
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('scrolled', y > 8);
    if (toTop) {
      if (y > 600) toTop.removeAttribute('hidden');
      else toTop.setAttribute('hidden', '');
    }
    updateProgress(y);
    spyToc(y);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Reading progress (post pages) ---------- */
  var progressBar = document.getElementById('reading-progress-bar');
  var postContent = document.getElementById('post-content');
  function updateProgress() {
    if (!progressBar || !postContent) return;
    var rect = postContent.getBoundingClientRect();
    var total = rect.height - window.innerHeight * 0.6;
    var done = Math.min(Math.max(-rect.top + window.innerHeight * 0.2, 0), Math.max(total, 1));
    var pct = total > 0 ? (done / total) * 100 : 0;
    progressBar.style.width = Math.min(100, Math.max(0, pct)) + '%';
  }

  /* ---------- Table of contents (post pages) ---------- */
  var tocNav = document.getElementById('toc-nav');
  var tocLinks = [];
  if (tocNav && postContent) {
    var headings = postContent.querySelectorAll('h2, h3');
    if (headings.length === 0) {
      tocNav.innerHTML = '<p class="toc-empty">No sections</p>';
    } else {
      var list = document.createElement('ul');
      var sublist = null;
      headings.forEach(function (h, i) {
        if (!h.id) h.id = 'section-' + (i + 1);
        // Anchor link on the heading itself
        var anchor = document.createElement('a');
        anchor.href = '#' + h.id;
        anchor.className = 'heading-anchor';
        anchor.setAttribute('aria-label', 'Link to this section');
        anchor.textContent = '#';
        h.appendChild(anchor);

        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#' + h.id;
        a.textContent = h.textContent.replace(/#$/, '').trim();
        a.dataset.target = h.id;
        li.appendChild(a);
        tocLinks.push(a);

        if (h.tagName === 'H2') {
          sublist = null;
          list.appendChild(li);
        } else {
          if (!sublist) {
            sublist = document.createElement('ul');
            var last = list.lastElementChild;
            if (last) last.appendChild(sublist);
            else list.appendChild(sublist);
          }
          var subLi = document.createElement('li');
          subLi.appendChild(a);
          sublist.appendChild(subLi);
        }
      });
      tocNav.appendChild(list);
    }
  }
  function spyToc() {
    if (!tocLinks.length) return;
    var current = null;
    for (var i = 0; i < tocLinks.length; i++) {
      var el = document.getElementById(tocLinks[i].dataset.target);
      if (el && el.getBoundingClientRect().top < 140) current = tocLinks[i];
    }
    tocLinks.forEach(function (a) { a.classList.toggle('active', a === current); });
  }

  /* ---------- Copy buttons for code blocks ---------- */
  function copyText(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) { /* noop */ }
      document.body.removeChild(ta);
      done();
    }
  }
  document.querySelectorAll('div.highlighter-rouge, pre.highlight').forEach(function (block) {
    if (block.parentElement && block.parentElement.classList.contains('code-block-wrapper')) return;
    var wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';
    block.parentNode.insertBefore(wrapper, block);
    wrapper.appendChild(block);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-code-btn';
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', 'Copy code to clipboard');
    btn.addEventListener('click', function () {
      var code = block.querySelector('code');
      var text = code ? code.innerText : block.innerText;
      copyText(text, function () {
        btn.textContent = 'Copied!';
        setTimeout(function () { btn.textContent = 'Copy'; }, 1600);
      });
    });
    wrapper.appendChild(btn);
  });

  /* ---------- Copy-link share button ---------- */
  document.querySelectorAll('[data-copy-link]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var url = btn.getAttribute('data-url') || window.location.href;
      copyText(url, function () {
        var original = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(function () { btn.textContent = original; }, 1600);
      });
    });
  });

  /* ---------- Site search (search page) ---------- */
  var searchInput = document.getElementById('search-input');
  var searchResults = document.getElementById('search-results');
  var searchCount = document.getElementById('search-count');
  var searchIndex = null;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function highlight(text, query) {
    var safe = escapeHtml(text);
    var q = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!q) return safe;
    return safe.replace(new RegExp('(' + q + ')', 'gi'), '<mark>$1</mark>');
  }
  function loadIndex() {
    if (searchIndex) return Promise.resolve(searchIndex);
    return fetch(baseUrl() + '/search.json')
      .then(function (res) {
        if (!res.ok) throw new Error('index not found');
        return res.json();
      })
      .then(function (json) {
        searchIndex = json.map(function (p) {
          p._hay = ((p.title || '') + ' ' + (p.description || '') + ' ' + (p.content || '') + ' ' + (p.tags || []).join(' ')).toLowerCase();
          return p;
        });
        return searchIndex;
      });
  }
  function renderSearch(query) {
    if (!searchResults) return;
    query = query.trim();
    if (query.length < 2) {
      searchResults.innerHTML = '';
      if (searchCount) searchCount.textContent = searchIndex ? searchIndex.length + ' posts indexed. Type at least 2 characters.' : '';
      return;
    }
    var terms = query.toLowerCase().split(/\s+/);
    var hits = searchIndex.filter(function (p) {
      return terms.every(function (t) { return p._hay.indexOf(t) !== -1; });
    });
    if (searchCount) {
      searchCount.textContent = hits.length === 0
        ? 'No results for "' + query + '"'
        : hits.length + (hits.length === 1 ? ' result' : ' results') + ' for "' + query + '"';
    }
    searchResults.innerHTML = hits.map(function (p) {
      var snippet = p.description || p.content || '';
      if (snippet.length > 180) snippet = snippet.slice(0, 180) + '…';
      return '<a class="search-result" href="' + escapeHtml(p.url) + '">' +
        '<h3>' + highlight(p.title || 'Untitled', query) + '</h3>' +
        '<p>' + highlight(snippet, query) + '</p>' +
        '</a>';
    }).join('');
  }
  if (searchInput && searchResults) {
    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q') || '';
    loadIndex().then(function () {
      renderSearch(initial);
    }).catch(function () {
      if (searchCount) searchCount.textContent = 'Search index failed to load.';
    });
    if (initial) searchInput.value = initial;
    var debounce = null;
    searchInput.addEventListener('input', function () {
      clearTimeout(debounce);
      debounce = setTimeout(function () { renderSearch(searchInput.value); }, 150);
    });
  }

  /* ---------- Press "/" to jump to search ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
      if (searchInput) {
        e.preventDefault();
        searchInput.focus();
      } else {
        window.location.href = baseUrl() + '/search/';
      }
    }
  });
})();
