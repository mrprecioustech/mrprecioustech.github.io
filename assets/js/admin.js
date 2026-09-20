/* ======================================================================
   MrPreciousTech — Admin Panel logic (vanilla JS, no deps)
   Features: gated login, dashboard, posts CRUD via localStorage,
   new-post generator with live preview + download, search/filter.
   Works fully static on GitHub Pages (client-side only).
   ====================================================================== */
(function () {
  'use strict';

  // ---------- Config ----------
  var STORAGE_AUTH = 'mpt-admin-auth';
  var STORAGE_POSTS = 'mpt-admin-posts';
  var STORAGE_DRAFTS = 'mpt-admin-drafts';
  var ADMIN_PASSWORD = 'admin'; // demo only — client-side gate for Pages

  function baseUrl() {
    var m = document.querySelector('meta[name="site-baseurl"]');
    return m ? m.getAttribute('content') : '';
  }

  // ---------- Elements ----------
  var loginView = document.getElementById('admin-login');
  var appView = document.getElementById('admin-app');
  var loginForm = document.getElementById('login-form');
  var loginInput = document.getElementById('login-password');
  var loginError = document.getElementById('login-error');
  var logoutBtn = document.getElementById('logout-btn');
  var logoutBtnMobile = document.getElementById('logout-btn-mobile');
  var sidebar = document.getElementById('admin-sidebar');
  var sidebarBackdrop = document.getElementById('sidebar-backdrop');
  var burgerBtn = document.getElementById('burger-btn');
  var navLinks = document.querySelectorAll('.admin-nav-link[data-view]');
  var views = document.querySelectorAll('.admin-view');
  var topTitle = document.getElementById('topbar-title');
  var topDesc = document.getElementById('topbar-desc');

  var statPosts = document.getElementById('stat-posts');
  var statDrafts = document.getElementById('stat-drafts');
  var statTags = document.getElementById('stat-tags');
  var statWords = document.getElementById('stat-words');
  var statPostsSub = document.getElementById('stat-posts-sub');
  var recentTbody = document.getElementById('recent-posts');
  var activityList = document.getElementById('activity-list');
  var allPostsTbody = document.getElementById('all-posts');
  var draftsTbody = document.getElementById('drafts-tbody');
  var draftsEmpty = document.getElementById('drafts-empty');
  var postsEmpty = document.getElementById('posts-empty');
  var postsSearch = document.getElementById('posts-search');
  var postsFilter = document.getElementById('posts-filter');
  var draftsSearch = document.getElementById('drafts-search');

  // Count badges
  var navCountPosts = document.getElementById('nav-count-posts');
  var navCountDrafts = document.getElementById('nav-count-drafts');

  // New post form
  var form = document.getElementById('new-post-form');
  var inputTitle = document.getElementById('np-title');
  var inputDate = document.getElementById('np-date');
  var inputDesc = document.getElementById('np-description');
  var inputTags = document.getElementById('np-tags');
  var inputAccent = document.getElementById('np-accent');
  var inputFeatured = document.getElementById('np-featured');
  var inputToc = document.getElementById('np-toc');
  var inputComments = document.getElementById('np-comments');
  var inputContent = document.getElementById('np-content');
  var previewBody = document.getElementById('preview-body');
  var previewMeta = document.getElementById('preview-meta');
  var outputBlock = document.getElementById('output-block');
  var outputPre = document.getElementById('output-pre');
  var copyOutputBtn = document.getElementById('copy-output');
  var downloadBtn = document.getElementById('download-md');
  var saveDraftBtn = document.getElementById('save-draft');
  var resetBtn = document.getElementById('reset-form');

  // Modal
  var editModal = document.getElementById('edit-modal');
  var editForm = document.getElementById('edit-form');
  var editClose = document.getElementById('edit-close');
  var editCancel = document.getElementById('edit-cancel');
  var editIndexInput = document.getElementById('edit-index');
  var editTitle = document.getElementById('edit-title');
  var editTags = document.getElementById('edit-tags');
  var editDesc = document.getElementById('edit-desc');
  var editUrl = document.getElementById('edit-url');

  // ---------- State ----------
  var posts = []; // from search.json + localStorage overrides
  var drafts = [];
  var filteredPosts = [];

  // ---------- Auth ----------
  function isAuthed() {
    try { return sessionStorage.getItem(STORAGE_AUTH) === '1' || localStorage.getItem(STORAGE_AUTH) === '1'; } catch (e) { return false; }
  }
  function setAuthed(remember) {
    try {
      sessionStorage.setItem(STORAGE_AUTH, '1');
      if (remember) localStorage.setItem(STORAGE_AUTH, '1');
    } catch (e) {}
  }
  function clearAuthed() {
    try { sessionStorage.removeItem(STORAGE_AUTH); localStorage.removeItem(STORAGE_AUTH); } catch (e) {}
  }
  function showLogin() {
    loginView.hidden = false;
    appView.hidden = true;
    appView.classList.remove('active');
    loginView.style.display = 'grid';
  }
  function showApp() {
    loginView.hidden = true;
    loginView.style.display = 'none';
    appView.hidden = false;
    appView.classList.add('active');
  }

  if (isAuthed()) showApp(); else showLogin();

  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var val = (loginInput.value || '').trim();
      var remember = document.getElementById('login-remember')?.checked;
      if (val === ADMIN_PASSWORD) {
        setAuthed(remember);
        loginError.classList.remove('visible');
        loginInput.value = '';
        showApp();
        init();
      } else {
        loginError.textContent = 'Incorrect password. Hint: try “admin”. This demo gate is client-side only — replace with real auth for production.';
        loginError.classList.add('visible');
        loginInput.select();
      }
    });
  }
  function doLogout() {
    clearAuthed();
    showLogin();
    loginInput.focus();
  }
  if (logoutBtn) logoutBtn.addEventListener('click', doLogout);
  if (logoutBtnMobile) logoutBtnMobile.addEventListener('click', doLogout);

  // ---------- Sidebar / Nav ----------
  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('open');
  }
  function openSidebar() {
    if (sidebar) sidebar.classList.add('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.add('open');
  }
  if (burgerBtn) burgerBtn.addEventListener('click', function () {
    if (sidebar.classList.contains('open')) closeSidebar(); else openSidebar();
  });
  if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeSidebar);

  var viewMeta = {
    dashboard: { title: 'Dashboard', desc: 'Overview of your Jekyll site' },
    posts: { title: 'Posts', desc: 'Published posts from search.json — edits stay in this browser' },
    drafts: { title: 'Drafts', desc: 'Local drafts stored in this browser (localStorage)' },
    new: { title: 'New post', desc: 'Generate Jekyll front matter + Markdown — download and commit to _posts/' },
    media: { title: 'Media', desc: 'Images and assets' },
    settings: { title: 'Settings', desc: 'Site configuration and build info' }
  };
  function switchView(name) {
    views.forEach(function (v) { v.hidden = v.id !== 'view-' + name; });
    navLinks.forEach(function (a) { a.classList.toggle('active', a.dataset.view === name); });
    var meta = viewMeta[name] || { title: name, desc: '' };
    if (topTitle) topTitle.textContent = meta.title;
    if (topDesc) topDesc.textContent = meta.desc;
    closeSidebar();
    // update hash without scrolling
    try { history.replaceState(null, '', '#' + name); } catch (e) {}
  }
  navLinks.forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      switchView(a.dataset.view);
    });
  });
  // quick-action buttons that also switch view
  document.querySelectorAll('[data-goto]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var v = btn.getAttribute('data-goto');
      if (v) switchView(v);
    });
  });
  // hash routing
  var initialHash = (location.hash || '#dashboard').replace(/^#/, '');
  if (viewMeta[initialHash]) switchView(initialHash); else switchView('dashboard');
  window.addEventListener('hashchange', function () {
    var h = (location.hash || '#dashboard').replace(/^#/, '');
    if (viewMeta[h]) switchView(h);
  });

  // ---------- Data loading ----------
  function loadJSON(url) {
    return fetch(baseUrl() + url).then(function (r) {
      if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
      return r.json();
    });
  }

  function getLocalPosts() {
    try { return JSON.parse(localStorage.getItem(STORAGE_POSTS) || '[]'); } catch (e) { return []; }
  }
  function setLocalPosts(arr) {
    try { localStorage.setItem(STORAGE_POSTS, JSON.stringify(arr)); } catch (e) {}
  }
  function getLocalDrafts() {
    try { return JSON.parse(localStorage.getItem(STORAGE_DRAFTS) || '[]'); } catch (e) { return []; }
  }
  function setLocalDrafts(arr) {
    try { localStorage.setItem(STORAGE_DRAFTS, JSON.stringify(arr)); } catch (e) {}
  }

  function normalizePosts(raw) {
    // raw from search.json: {title, url, date, tags, description, content}
    return raw.map(function (p, i) {
      return {
        _id: i,
        title: p.title || 'Untitled',
        url: p.url || '#',
        date: p.date || '',
        dateRaw: p.date || '',
        tags: Array.isArray(p.tags) ? p.tags : [],
        description: p.description || '',
        content: p.content || '',
        // computed
        accent: 'indigo',
        local: false
      };
    });
  }

  function mergeLocalPosts(base) {
    var local = getLocalPosts();
    // local items may override or be new
    // For deleted: we mark _deleted
    var deletedSet = new Set();
    var editedMap = new Map();
    local.forEach(function (lp) {
      if (lp._deleted) deletedSet.add(lp._id);
      if (lp._edited) editedMap.set(lp._id, lp);
      if (lp._new) {} // new posts appended
    });
    var merged = base.filter(function (p) { return !deletedSet.has(p._id); }).map(function (p) {
      var edit = editedMap.get(p._id);
      return edit ? Object.assign({}, p, edit, { local: true }) : p;
    });
    // append new
    local.filter(function (lp) { return lp._new; }).forEach(function (lp) {
      merged.push(Object.assign({}, lp, { _id: 'local-' + lp._tmpId, local: true }));
    });
    return merged;
  }

  function renderStats() {
    var total = posts.length;
    var draftCount = drafts.length;
    var tagSet = new Set();
    var words = 0;
    posts.forEach(function (p) {
      (p.tags || []).forEach(function (t) { tagSet.add(t); });
      var w = (p.content || '').split(/\s+/).filter(Boolean).length;
      words += w;
      w = (p.description || '').split(/\s+/).filter(Boolean).length;
      words += w;
    });
    drafts.forEach(function (d) {
      (d.tags || []).forEach(function (t) { tagSet.add(t); });
    });
    if (statPosts) statPosts.textContent = total;
    if (statDrafts) statDrafts.textContent = draftCount;
    if (statTags) statTags.textContent = tagSet.size;
    if (statWords) statWords.textContent = words.toLocaleString();
    if (statPostsSub) statPostsSub.textContent = tagSet.size + ' tags · ' + (words > 1000 ? (words/1000).toFixed(1) + 'k words' : words + ' words');
    if (navCountPosts) navCountPosts.textContent = total;
    if (navCountDrafts) navCountDrafts.textContent = draftCount;
    // filter dropdown
    if (postsFilter) {
      var current = postsFilter.value;
      postsFilter.innerHTML = '<option value="">All tags</option>' + Array.from(tagSet).sort().map(function (t) {
        return '<option value="' + escapeHtml(t) + '">' + escapeHtml(t) + '</option>';
      }).join('');
      if (current) postsFilter.value = current;
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>\"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatDate(str) {
    return str || '—';
  }

  function renderRecent() {
    if (!recentTbody) return;
    if (!posts.length) {
      recentTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--admin-faint);padding:2rem">No posts found. Check search.json or create one.</td></tr>';
      return;
    }
    var recent = posts.slice(0, 5);
    recentTbody.innerHTML = recent.map(function (p) {
      return '<tr>' +
        '<td><a class="admin-post-title" href="' + escapeHtml(p.url) + '">' + escapeHtml(p.title) + '</a>' +
        '<div style="font-size:0.82rem;color:var(--admin-faint);margin-top:0.15rem">' + escapeHtml(p.description.slice(0,80)) + (p.description.length>80?'…':'') + '</div></td>' +
        '<td style="white-space:nowrap">' + escapeHtml(formatDate(p.date)) + '</td>' +
        '<td>' + (p.tags||[]).slice(0,2).map(function (t){ return '<span class="admin-tag" style="margin-right:0.3rem">'+escapeHtml(t)+'</span>'; }).join('') + '</td>' +
        '<td><span class="admin-status pub">Published</span></td>' +
        '</tr>';
    }).join('');
  }

  function renderActivity() {
    if (!activityList) return;
    if (!posts.length) {
      activityList.innerHTML = '<li class="admin-empty" style="padding:1rem">No activity yet.</li>';
      return;
    }
    var items = posts.slice(0, 4).map(function (p, i) {
      var icons = ['file-text','edit','tag','clock'];
      return '<li>' +
        '<div class="act-dot"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>' +
        '<div><p class="act-title">' + escapeHtml(p.title) + '</p><p class="act-meta">' + escapeHtml(p.date) + ' · ' + (p.tags[0]||'untagged') + '</p></div>' +
        '</li>';
    }).join('') +
    '<li><div class="act-dot" style="background:var(--accent-soft);color:var(--accent)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div><p class="act-title">Admin panel installed</p><p class="act-meta">Today · system</p></div></li>';
    activityList.innerHTML = items;
  }

  function postRow(p, idx) {
    var tagHtml = (p.tags||[]).map(function (t){ return '<span class="admin-tag">'+escapeHtml(t)+'</span>'; }).join(' ');
    if (!tagHtml) tagHtml = '<span style="color:var(--admin-faint);font-size:0.82rem">—</span>';
    return '<tr data-idx="' + idx + '">' +
      '<td><a class="admin-post-title" href="' + escapeHtml(p.url) + '" target="_blank" rel="noopener">' + escapeHtml(p.title) + '</a>' +
      '<div style="font-size:0.82rem;color:var(--admin-muted);margin-top:0.2rem;max-width:32ch;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escapeHtml(p.description||'') + '</div></td>' +
      '<td style="white-space:nowrap">' + escapeHtml(formatDate(p.date)) + '</td>' +
      '<td>' + tagHtml + '</td>' +
      '<td><span class="admin-status pub">Published</span></td>' +
      '<td><div class="admin-row-actions">' +
        '<button class="admin-row-btn view-btn" title="View" aria-label="View"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>' +
        '<button class="admin-row-btn edit-btn" title="Edit" aria-label="Edit"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' +
        '<button class="admin-row-btn danger delete-btn" title="Delete (local)" aria-label="Delete"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' +
      '</div></td>' +
      '</tr>';
  }

  function renderPostsTable() {
    if (!allPostsTbody) return;
    var q = (postsSearch && postsSearch.value || '').trim().toLowerCase();
    var tagFilter = postsFilter && postsFilter.value || '';
    filteredPosts = posts.filter(function (p) {
      var hay = (p.title + ' ' + (p.description||'') + ' ' + (p.tags||[]).join(' ') + ' ' + (p.content||'')).toLowerCase();
      var okQ = !q || hay.indexOf(q) !== -1;
      var okTag = !tagFilter || (p.tags||[]).indexOf(tagFilter) !== -1;
      return okQ && okTag;
    });
    if (!filteredPosts.length) {
      allPostsTbody.innerHTML = '';
      if (postsEmpty) { postsEmpty.hidden = false; postsEmpty.querySelector('p').textContent = posts.length ? 'No posts match your search.' : 'No posts yet — create your first one!'; }
      return;
    }
    if (postsEmpty) postsEmpty.hidden = true;
    allPostsTbody.innerHTML = filteredPosts.map(function (p, i) {
      // find original idx
      var originalIdx = posts.indexOf(p);
      return postRow(p, originalIdx);
    }).join('');
    attachRowEvents(allPostsTbody, false);
  }

  function draftRow(d, idx) {
    var tagHtml = (d.tags||[]).map(function (t){ return '<span class="admin-tag">'+escapeHtml(t)+'</span>'; }).join(' ');
    if (!tagHtml) tagHtml = '<span style="color:var(--admin-faint)">—</span>';
    return '<tr data-idx="' + idx + '">' +
      '<td><span class="admin-post-title" style="cursor:default">' + escapeHtml(d.title||'Untitled draft') + '</span>' +
      '<div style="font-size:0.82rem;color:var(--admin-muted);margin-top:0.2rem">' + escapeHtml((d.description||'').slice(0,80)) + '</div></td>' +
      '<td style="white-space:nowrap">' + escapeHtml(d.date||'—') + '</td>' +
      '<td>' + tagHtml + '</td>' +
      '<td><span class="admin-status draft">Draft</span></td>' +
      '<td><div class="admin-row-actions">' +
        '<button class="admin-row-btn edit-draft-btn" title="Edit draft"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' +
        '<button class="admin-row-btn danger delete-draft-btn" title="Delete draft"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' +
        '<button class="admin-row-btn download-draft-btn" title="Download .md"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>' +
      '</div></td>' +
      '</tr>';
  }

  function renderDraftsTable() {
    if (!draftsTbody) return;
    var q = (draftsSearch && draftsSearch.value || '').trim().toLowerCase();
    var filtered = drafts.filter(function (d) {
      var hay = ((d.title||'') + ' ' + (d.description||'') + ' ' + (d.tags||[]).join(' ')).toLowerCase();
      return !q || hay.indexOf(q) !== -1;
    });
    if (!filtered.length) {
      draftsTbody.innerHTML = '';
      if (draftsEmpty) draftsEmpty.hidden = false;
      return;
    }
    if (draftsEmpty) draftsEmpty.hidden = true;
    draftsTbody.innerHTML = filtered.map(function (d, i) {
      var originalIdx = drafts.indexOf(d);
      return draftRow(d, originalIdx);
    }).join('');
    attachRowEvents(draftsTbody, true);
  }

  function attachRowEvents(tbody, isDraft) {
    tbody.querySelectorAll('.view-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tr = btn.closest('tr');
        var idx = parseInt(tr.getAttribute('data-idx'), 10);
        var p = posts[idx];
        if (p && p.url) window.open(p.url, '_blank');
      });
    });
    tbody.querySelectorAll('.edit-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tr = btn.closest('tr');
        var idx = parseInt(tr.getAttribute('data-idx'), 10);
        openEditModal(idx);
      });
    });
    tbody.querySelectorAll('.delete-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tr = btn.closest('tr');
        var idx = parseInt(tr.getAttribute('data-idx'), 10);
        if (!confirm('Delete this post locally? This only hides it in this browser (localStorage) — the file on GitHub is untouched until you commit.')) return;
        var p = posts[idx];
        var local = getLocalPosts();
        local.push({ _id: p._id, _deleted: true });
        setLocalPosts(local);
        posts.splice(idx, 1);
        renderStats();
        renderRecent();
        renderPostsTable();
        renderActivity();
        toast('Post hidden locally. Clear localStorage to restore.', 'info');
      });
    });
    tbody.querySelectorAll('.edit-draft-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tr = btn.closest('tr');
        var idx = parseInt(tr.getAttribute('data-idx'), 10);
        loadDraftIntoForm(idx);
        switchView('new');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
    tbody.querySelectorAll('.delete-draft-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tr = btn.closest('tr');
        var idx = parseInt(tr.getAttribute('data-idx'), 10);
        if (!confirm('Delete this draft?')) return;
        drafts.splice(idx, 1);
        setLocalDrafts(drafts);
        renderDraftsTable();
        renderStats();
        toast('Draft deleted.', 'info');
      });
    });
    tbody.querySelectorAll('.download-draft-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tr = btn.closest('tr');
        var idx = parseInt(tr.getAttribute('data-idx'), 10);
        var d = drafts[idx];
        if (d) downloadMarkdown(generateMarkdown(d), (slugify(d.title) || 'draft') + '.md');
      });
    });
  }

  // ---------- Edit modal ----------
  function openEditModal(idx) {
    var p = posts[idx];
    if (!p) return;
    editIndexInput.value = idx;
    editTitle.value = p.title || '';
    editTags.value = (p.tags||[]).join(', ');
    editDesc.value = p.description || '';
    editUrl.value = p.url || '';
    editModal.classList.add('open');
    editModal.hidden = false;
    editTitle.focus();
  }
  function closeEditModal() {
    editModal.classList.remove('open');
    setTimeout(function () { editModal.hidden = true; }, 200);
  }
  if (editClose) editClose.addEventListener('click', closeEditModal);
  if (editCancel) editCancel.addEventListener('click', closeEditModal);
  if (editModal) editModal.querySelector('.admin-modal-backdrop')?.addEventListener('click', closeEditModal);
  if (editForm) editForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var idx = parseInt(editIndexInput.value, 10);
    var p = posts[idx];
    if (!p) return;
    var newTags = editTags.value.split(',').map(function (s){ return s.trim(); }).filter(Boolean);
    var updated = {
      _id: p._id,
      _edited: true,
      title: editTitle.value.trim() || p.title,
      tags: newTags,
      description: editDesc.value.trim(),
      url: editUrl.value.trim() || p.url
    };
    // persist
    var local = getLocalPosts();
    // remove previous edit for same _id
    local = local.filter(function (lp) { return !(lp._edited && lp._id === p._id); });
    local.push(updated);
    setLocalPosts(local);
    // update in-memory
    posts[idx] = Object.assign({}, p, updated, { local: true });
    renderStats();
    renderRecent();
    renderPostsTable();
    renderActivity();
    closeEditModal();
    toast('Post updated locally. Export or commit the real file to make it permanent.', 'success');
  });

  // ---------- New post generator ----------
  function slugify(str) {
    return String(str).toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  function todayDate() {
    var d = new Date();
    return d.toISOString().slice(0,10);
  }
  function generateMarkdown(data) {
    var d = data || {
      title: inputTitle.value.trim() || 'Untitled post',
      date: inputDate.value || todayDate(),
      description: inputDesc.value.trim(),
      tags: inputTags.value.split(',').map(function(s){return s.trim();}).filter(Boolean),
      accent: inputAccent.value,
      featured: inputFeatured.checked,
      toc: inputToc.checked,
      comments: inputComments.checked,
      content: inputContent.value
    };
    var fm = '---\n';
    fm += 'layout: post\n';
    fm += 'title: ' + JSON.stringify(d.title) + '\n';
    var dateStr = d.date;
    // ensure date includes time for Jekyll
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) dateStr += ' 09:00:00 +0000';
    fm += 'date: ' + dateStr + '\n';
    if (d.description) fm += 'description: ' + JSON.stringify(d.description) + '\n';
    if (d.tags && d.tags.length) fm += 'tags: [' + d.tags.map(function(t){ return JSON.stringify(t); }).join(', ') + ']\n';
    if (d.accent && d.accent !== 'indigo') fm += 'accent: ' + d.accent + '\n';
    if (d.featured) fm += 'featured: true\n';
    if (!d.toc) fm += 'toc: false\n';
    if (!d.comments) fm += 'comments: false\n';
    fm += '---\n\n';
    fm += (d.content || 'Write your post in Markdown here.\n');
    if (!String(d.content||'').endsWith('\n')) fm += '\n';
    return fm;
  }
  function updatePreview() {
    if (!previewBody) return;
    var md = inputContent.value || '';
    // crude markdown -> html for preview (use marked if available)
    var html;
    if (window.marked) {
      try { html = window.marked.parse(md); } catch(e) { html = '<p>' + escapeHtml(md).replace(/\n\n/g, '</p><p>').replace(/\n/g,'<br>') + '</p>'; }
    } else {
      html = escapeHtml(md)
        .replace(/^### (.*)$/gm, '<h3>$1</h3>')
        .replace(/^## (.*)$/gm, '<h3>$1</h3>')
        .replace(/^# (.*)$/gm, '<h2>$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
      html = '<p>' + html + '</p>';
      html = html.replace(/<p><\/p>/g, '').replace(/<p><h/g, '<h').replace(/<\/h([23])><\/p>/g, '</h$1>');
    }
    previewBody.innerHTML = html || '<p style="color:var(--admin-faint)">Start typing to see preview…</p>';
    if (previewMeta) {
      var title = inputTitle.value.trim() || 'Untitled post';
      var tags = inputTags.value.split(',').map(function(s){return s.trim();}).filter(Boolean);
      previewMeta.innerHTML = '<div style="font-weight:700">' + escapeHtml(title) + '</div><div style="color:var(--admin-muted);font-size:0.82rem">' + escapeHtml(inputDate.value || todayDate()) + (tags.length ? ' · ' + tags.map(escapeHtml).join(', ') : '') + '</div>';
    }
    // output
    var full = generateMarkdown();
    if (outputPre) outputPre.textContent = full;
    if (outputBlock) outputBlock.hidden = false;
  }

  function downloadMarkdown(content, filename) {
    var blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
  }

  function toast(msg, type) {
    var t = document.createElement('div');
    t.className = 'admin-alert ' + (type || 'info');
    t.style.position = 'fixed';
    t.style.right = '1.2rem';
    t.style.bottom = '1.2rem';
    t.style.zIndex = '100';
    t.style.maxWidth = '360px';
    t.style.boxShadow = 'var(--card-shadow)';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3500);
  }

  // form events
  if (inputTitle && inputDate && inputContent) {
    // defaults
    if (!inputDate.value) inputDate.value = todayDate();
    ['input','change','keyup'].forEach(function (evt) {
      if (inputTitle) inputTitle.addEventListener(evt, updatePreview);
      if (inputDate) inputDate.addEventListener(evt, updatePreview);
      if (inputDesc) inputDesc.addEventListener(evt, updatePreview);
      if (inputTags) inputTags.addEventListener(evt, updatePreview);
      if (inputAccent) inputAccent.addEventListener(evt, updatePreview);
      if (inputContent) inputContent.addEventListener(evt, updatePreview);
    });
    if (inputFeatured) inputFeatured.addEventListener('change', updatePreview);
    if (inputToc) inputToc.addEventListener('change', updatePreview);
    if (inputComments) inputComments.addEventListener('change', updatePreview);
    updatePreview();
  }

  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = {
      title: inputTitle.value.trim(),
      date: inputDate.value || todayDate(),
      description: inputDesc.value.trim(),
      tags: inputTags.value.split(',').map(function(s){return s.trim();}).filter(Boolean),
      accent: inputAccent.value,
      featured: inputFeatured.checked,
      toc: inputToc.checked,
      comments: inputComments.checked,
      content: inputContent.value
    };
    if (!data.title) { toast('Title is required.', 'warn'); inputTitle.focus(); return; }
    if (!data.content.trim()) { toast('Add some Markdown content.', 'warn'); inputContent.focus(); return; }
    var md = generateMarkdown(data);
    var slug = slugify(data.title) || 'new-post';
    var filename = data.date + '-' + slug + '.md';
    downloadMarkdown(md, filename);
    toast('Downloaded ' + filename + ' — move it to _posts/ and commit.', 'success');
  });

  if (copyOutputBtn) copyOutputBtn.addEventListener('click', function () {
    var text = outputPre.textContent || '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('Copied Markdown to clipboard.', 'success'); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); toast('Copied!', 'success'); } catch(e) { toast('Copy failed — select manually.', 'warn'); }
      document.body.removeChild(ta);
    }
  });
  if (downloadBtn) downloadBtn.addEventListener('click', function () {
    var md = outputPre.textContent || generateMarkdown();
    var slug = slugify(inputTitle.value.trim() || 'new-post');
    var filename = (inputDate.value || todayDate()) + '-' + slug + '.md';
    downloadMarkdown(md, filename);
    toast('Downloaded ' + filename, 'success');
  });
  if (saveDraftBtn) saveDraftBtn.addEventListener('click', function () {
    var data = {
      title: inputTitle.value.trim() || 'Untitled draft',
      date: inputDate.value || todayDate(),
      description: inputDesc.value.trim(),
      tags: inputTags.value.split(',').map(function(s){return s.trim();}).filter(Boolean),
      accent: inputAccent.value,
      featured: inputFeatured.checked,
      toc: inputToc.checked,
      comments: inputComments.checked,
      content: inputContent.value,
      _tmpId: Date.now()
    };
    drafts.unshift(data);
    setLocalDrafts(drafts);
    renderDraftsTable();
    renderStats();
    toast('Draft saved locally. Find it in the Drafts tab.', 'success');
  });
  if (resetBtn) resetBtn.addEventListener('click', function () {
    if (!confirm('Reset the form? Unsaved changes will be lost.')) return;
    form.reset();
    inputDate.value = todayDate();
    updatePreview();
  });

  function loadDraftIntoForm(idx) {
    var d = drafts[idx];
    if (!d) return;
    inputTitle.value = d.title || '';
    inputDate.value = d.date || todayDate();
    inputDesc.value = d.description || '';
    inputTags.value = (d.tags||[]).join(', ');
    inputAccent.value = d.accent || 'indigo';
    inputFeatured.checked = !!d.featured;
    inputToc.checked = d.toc !== false;
    inputComments.checked = d.comments !== false;
    inputContent.value = d.content || '';
    updatePreview();
    // remove from drafts (optional keep) — keep for now, user can delete after
  }

  // ---------- Search / filter bindings ----------
  if (postsSearch) postsSearch.addEventListener('input', renderPostsTable);
  if (postsFilter) postsFilter.addEventListener('change', renderPostsTable);
  if (draftsSearch) draftsSearch.addEventListener('input', renderDraftsTable);

  // ---------- Media (placeholder) ----------
  // No-op: static file list would need Jekyll data

  // ---------- Settings actions ----------
  var clearStorageBtn = document.getElementById('clear-storage');
  if (clearStorageBtn) clearStorageBtn.addEventListener('click', function () {
    if (!confirm('Clear all local admin data (posts overrides + drafts)? This cannot be undone.')) return;
    try { localStorage.removeItem(STORAGE_POSTS); localStorage.removeItem(STORAGE_DRAFTS); } catch(e) {}
    drafts = [];
    // reload posts from network
    init();
    toast('Local data cleared.', 'info');
  });
  var exportBtn = document.getElementById('export-data');
  if (exportBtn) exportBtn.addEventListener('click', function () {
    var data = {
      postsOverrides: getLocalPosts(),
      drafts: getLocalDrafts(),
      exportedAt: new Date().toISOString()
    };
    downloadMarkdown(JSON.stringify(data, null, 2), 'mpt-admin-export.json');
  });

  // ---------- Init ----------
  function init() {
    drafts = getLocalDrafts();
    renderDraftsTable();
    // fetch posts
    loadJSON('/search.json').then(function (raw) {
      var base = normalizePosts(raw);
      posts = mergeLocalPosts(base);
      renderStats();
      renderRecent();
      renderActivity();
      renderPostsTable();
      renderDraftsTable();
    }).catch(function (err) {
      console.error('search.json load failed', err);
      // fallback: try with local only
      posts = mergeLocalPosts([]);
      renderStats();
      renderRecent();
      renderActivity();
      renderPostsTable();
      var msg = document.getElementById('posts-load-error');
      if (msg) { msg.hidden = false; msg.textContent = 'Could not load /search.json (' + err.message + '). Run `bundle exec jekyll build` to generate it, or create a post.'; }
    });
  }

  // kick off if authed
  if (isAuthed()) init();

  // expose for debugging
  window.MPTAdmin = { getPosts: function(){return posts;}, getDrafts: function(){return drafts;}, clearAuth: clearAuthed };

})();
