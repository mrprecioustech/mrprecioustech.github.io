/* ======================================================================
   PrepLab — client-side interview preparation app
   No account, no server, no framework. Progress is stored in localStorage.
   ====================================================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'mpt-prep-v1';
  var AI_KEY = 'mpt-prep-ai-key';
  var MOCK_SECONDS = 20 * 60;

  var QUESTIONS = [
    { id: 'behavioral-feedback', category: 'Behavioral', difficulty: 'Medium', question: 'Tell me about a time you received difficult feedback.', framework: 'Use a real piece of feedback, how you processed it, the specific change you made, and the result. Show self-awareness without becoming defensive.', strong: 'Ownership, reflection, a concrete behavior change, and evidence that the change improved your work.' },
    { id: 'behavioral-disagreement', category: 'Behavioral', difficulty: 'Medium', question: 'Tell me about a time you disagreed with a teammate.', framework: 'Focus on the shared goal. Explain how you understood their perspective, what evidence you brought, how you decided, and how you kept the relationship healthy.', strong: 'Curiosity before persuasion, respectful communication, a decision, and a result bigger than “I was right.”' },
    { id: 'behavioral-failure', category: 'Behavioral', difficulty: 'Medium', question: 'Tell me about a project that did not go as planned.', framework: 'Choose a meaningful but recoverable failure. Explain the early signals you missed, your response, and the system or habit you changed afterward.', strong: 'Honest accountability, fast recovery, learning, and a prevention step — not a disguised humblebrag.' },
    { id: 'behavioral-priority', category: 'Behavioral', difficulty: 'Easy', question: 'How do you prioritize when everything feels important?', framework: 'Describe the criteria you use: user impact, urgency, dependencies, risk, and effort. Give a quick example of a trade-off you made.', strong: 'A repeatable method, clear communication, and comfort making trade-offs visible.' },
    { id: 'javascript-closures', category: 'JavaScript', difficulty: 'Medium', question: 'Explain closures to a developer who is new to JavaScript.', framework: 'Define the relationship between a function and its surrounding lexical scope. Use a small example such as a counter or factory, then explain a practical use.', strong: 'A precise explanation of retained scope, a simple example, and awareness of when closures are useful.' },
    { id: 'javascript-event-loop', category: 'JavaScript', difficulty: 'Hard', question: 'How does the JavaScript event loop handle asynchronous work?', framework: 'Walk through the call stack, browser or runtime APIs, task queue, microtask queue, and when the event loop gives each queue attention.', strong: 'Correct ordering: synchronous code, microtasks such as promises, then tasks such as timers — plus a practical debugging implication.' },
    { id: 'javascript-performance', category: 'JavaScript', difficulty: 'Medium', question: 'How would you investigate a slow JavaScript feature?', framework: 'Start with a reproducible case and a measurement. Separate network, rendering, scripting, and memory. Make one change at a time and verify the result.', strong: 'A measurement-first workflow, appropriate browser tools, and a quantified before-and-after.' },
    { id: 'frontend-accessibility', category: 'Frontend', difficulty: 'Medium', question: 'How do you make a new UI component accessible?', framework: 'Cover semantic HTML first, keyboard interaction, focus states, labels, screen-reader behavior, contrast, and testing with real assistive technology.', strong: 'Accessibility as part of design and implementation, not a final audit checklist.' },
    { id: 'frontend-state', category: 'Frontend', difficulty: 'Hard', question: 'How do you decide where state should live in a frontend application?', framework: 'Classify state by ownership and lifetime: local UI state, URL state, server state, and shared client state. Explain the smallest owner that works.', strong: 'Simple boundaries, avoiding unnecessary global state, and a plan for server cache invalidation.' },
    { id: 'frontend-performance', category: 'Frontend', difficulty: 'Hard', question: 'What steps would you take to improve a page’s performance?', framework: 'Define the user-facing metric first. Discuss critical rendering, bundle size, images, caching, server response, and measuring on realistic devices.', strong: 'Prioritization by user impact, not a random list of optimizations, with a way to validate each one.' },
    { id: 'frontend-responsive', category: 'Frontend', difficulty: 'Easy', question: 'How do you approach responsive design from the start?', framework: 'Explain content-first layouts, fluid constraints, progressive enhancement, touch targets, and testing at breakpoints that come from the design rather than device names.', strong: 'A flexible system that preserves hierarchy and usability across the viewport range.' },
    { id: 'backend-api', category: 'Backend', difficulty: 'Medium', question: 'What makes an API pleasant and reliable to consume?', framework: 'Cover consistent resources and naming, validation, status codes, error shape, pagination, idempotency, versioning, documentation, and observability.', strong: 'Predictability for clients, useful errors, safe retries, and a clear evolution strategy.' },
    { id: 'backend-debug', category: 'Backend', difficulty: 'Medium', question: 'A production endpoint is suddenly slow. How do you debug it?', framework: 'Check the scope and timing of the regression, trace a slow request, inspect database queries and downstream calls, compare recent changes, then mitigate before optimizing.', strong: 'Calm incident thinking: protect users first, use evidence, communicate, and leave behind a fix.' },
    { id: 'backend-auth', category: 'Backend', difficulty: 'Hard', question: 'How would you design authentication for a web application?', framework: 'Clarify the threat model. Discuss password handling, sessions or tokens, cookies, CSRF, refresh and revocation, rate limiting, and recovery.', strong: 'Security trade-offs in context, safe defaults, and a distinction between authentication and authorization.' },
    { id: 'system-design-feed', category: 'System design', difficulty: 'Hard', question: 'Design a personalized activity feed.', framework: 'Clarify scale and freshness first. Model the data, choose fan-out or read-time aggregation, discuss caching, pagination, ranking, and failure modes.', strong: 'A clear set of requirements, a simple baseline architecture, and deliberate trade-offs as scale grows.' },
    { id: 'system-design-file', category: 'System design', difficulty: 'Hard', question: 'Design a service for uploading and sharing large files.', framework: 'Start with upload size, access rules, durability, and download volume. Cover object storage, signed URLs, multipart upload, metadata, scanning, and lifecycle.', strong: 'Separation of metadata from blobs, secure access, resumability, and a realistic operational plan.' },
    { id: 'system-design-notifications', category: 'System design', difficulty: 'Medium', question: 'How would you build a notification system?', framework: 'Define channels, delivery guarantees, preferences, rate limits, retries, deduplication, and how you would observe delivery health.', strong: 'A queue-backed design with idempotent consumers and user control over noisy or failed delivery.' },
    { id: 'system-design-url', category: 'System design', difficulty: 'Easy', question: 'Design a URL shortener.', framework: 'Estimate traffic and storage. Discuss ID generation, collision avoidance, redirects, caching, analytics, abuse prevention, and expiration.', strong: 'Comfort with back-of-the-envelope estimates and a design that starts simple but has clear scale boundaries.' }
  ];

  var state = loadState();
  var mockSession = null;
  var mockTimer = null;
  var mockCount = 5;
  var memoryAiKey = '';

  function defaultState() {
    return { practiced: {}, answers: {}, stories: [], mockBest: null, lastActivity: null };
  }

  function loadState() {
    var base = defaultState();
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        practiced: saved.practiced || base.practiced,
        answers: saved.answers || base.answers,
        stories: Array.isArray(saved.stories) ? saved.stories : base.stories,
        mockBest: typeof saved.mockBest === 'number' ? saved.mockBest : base.mockBest,
        lastActivity: saved.lastActivity || base.lastActivity
      };
    } catch (e) { return base; }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* private browsing */ }
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function markActivity() {
    state.lastActivity = new Date().toISOString();
    saveState();
  }

  function practicedCount() {
    return QUESTIONS.filter(function (question) { return state.practiced[question.id]; }).length;
  }

  function updateStats() {
    var practiced = practicedCount();
    var practicedEl = document.getElementById('stat-practiced');
    var practicedDetail = document.getElementById('stat-practiced-detail');
    var storiesEl = document.getElementById('stat-stories');
    var bestEl = document.getElementById('stat-best');
    var momentumEl = document.getElementById('stat-momentum');
    var momentumDetail = document.getElementById('stat-momentum-detail');
    if (practicedEl) practicedEl.textContent = practiced + ' / ' + QUESTIONS.length;
    if (practicedDetail) practicedDetail.textContent = practiced === 0 ? 'Start with one question' : (QUESTIONS.length - practiced) + ' left in your first pass';
    if (storiesEl) storiesEl.textContent = state.stories.length;
    if (bestEl) bestEl.textContent = state.mockBest == null ? '—' : state.mockBest.toFixed(1) + '/5';
    if (state.lastActivity) {
      var days = Math.floor((Date.now() - new Date(state.lastActivity).getTime()) / 86400000);
      if (momentumEl) momentumEl.textContent = days < 1 ? 'In motion' : days < 7 ? 'Building' : 'Pick it up';
      if (momentumDetail) momentumDetail.textContent = days < 1 ? 'Nice work — keep the streak' : 'A short session gets you moving';
    }
    var next = QUESTIONS.find(function (question) { return !state.practiced[question.id]; }) || QUESTIONS[0];
    var nextTitle = document.getElementById('overview-next-title');
    var nextDescription = document.getElementById('overview-next-description');
    if (nextTitle) nextTitle.textContent = practiced === QUESTIONS.length ? 'Run a mock interview' : next.question;
    if (nextDescription) nextDescription.textContent = practiced === QUESTIONS.length ? 'You have covered the bank. Now practice staying clear when the clock is running.' : next.framework;
  }

  function setView(view, source) {
    document.querySelectorAll('[data-prep-panel]').forEach(function (panel) {
      var active = panel.getAttribute('data-prep-panel') === view;
      panel.hidden = !active;
      panel.classList.toggle('is-visible', active);
    });
    document.querySelectorAll('.prep-tab[data-prep-view]').forEach(function (tab) {
      var active = tab.getAttribute('data-prep-view') === view;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    if (view === 'bank') renderQuestions();
    if (view === 'star') renderStories();
    if (view === 'coach' && source === 'star') prefillCoachFromStar();
    if (view === 'coach' && source === 'mock') prefillCoachFromMock();
    var workspace = document.querySelector('.prep-workspace');
    if (source === 'hero' && workspace) workspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var main = document.getElementById('prep-main');
    if (main && source === 'hero') setTimeout(function () { main.focus({ preventScroll: true }); }, 250);
  }

  function markPracticed(id) {
    state.practiced[id] = true;
    markActivity();
    updateStats();
  }

  function filteredQuestions() {
    var search = (document.getElementById('question-search').value || '').trim().toLowerCase();
    var category = document.getElementById('question-category').value;
    var difficulty = document.getElementById('question-difficulty').value;
    return QUESTIONS.filter(function (question) {
      var matchesSearch = !search || (question.question + ' ' + question.category + ' ' + question.framework).toLowerCase().indexOf(search) !== -1;
      return matchesSearch && (category === 'all' || question.category === category) && (difficulty === 'all' || question.difficulty === difficulty);
    });
  }

  function questionCard(question) {
    var isPracticed = !!state.practiced[question.id];
    var answer = state.answers[question.id] || '';
    return '<article class="question-card' + (isPracticed ? ' is-practiced' : '') + '" data-question-id="' + question.id + '">' +
      '<div class="question-card-top"><span class="question-card-status" aria-label="' + (isPracticed ? 'Practiced' : 'Not practiced') + '">' + (isPracticed ? '✓' : '') + '</span><div class="question-card-main"><div class="question-card-tags"><span class="question-category-tag">' + escapeHtml(question.category) + '</span><span>·</span><span>' + escapeHtml(question.difficulty) + '</span></div><h3>' + escapeHtml(question.question) + '</h3></div><button type="button" class="question-card-toggle" aria-expanded="false">Show guidance</button></div>' +
      '<div class="question-card-detail"><div class="question-guidance"><div class="question-guidance-box"><strong>What to cover</strong><p>' + escapeHtml(question.framework) + '</p></div><div class="question-guidance-box"><strong>Listen for in your answer</strong><p>' + escapeHtml(question.strong) + '</p></div></div><label class="question-answer-label" for="answer-' + question.id + '">Your quick answer <span class="muted">(saved on this device)</span></label><textarea class="question-answer" id="answer-' + question.id + '" placeholder="Write a few bullets or your spoken answer…">' + escapeHtml(answer) + '</textarea><div class="question-detail-actions"><button type="button" class="secondary question-mark">' + (isPracticed ? 'Practiced ✓' : 'Mark practiced') + '</button><button type="button" class="question-save">Save answer &amp; mark practiced</button></div></div></article>';
  }

  function renderQuestions() {
    var list = document.getElementById('question-list');
    if (!list) return;
    var questions = filteredQuestions();
    var empty = document.getElementById('question-empty');
    var count = document.getElementById('bank-count');
    var summary = document.getElementById('bank-summary');
    list.innerHTML = questions.map(questionCard).join('');
    if (empty) empty.hidden = questions.length !== 0;
    if (count) count.textContent = questions.length + (questions.length === 1 ? ' question' : ' questions');
    if (summary) summary.textContent = questions.length === QUESTIONS.length ? 'Showing all ' + QUESTIONS.length + ' questions' : 'Showing ' + questions.length + ' of ' + QUESTIONS.length + ' questions';
  }

  function renderStories() {
    var list = document.getElementById('saved-stories-list');
    var count = document.getElementById('story-count');
    if (!list) return;
    if (count) count.textContent = state.stories.length + (state.stories.length === 1 ? ' saved' : ' saved');
    if (!state.stories.length) {
      list.innerHTML = '<p class="prep-muted prep-small">Saved stories will show up here.</p>';
      return;
    }
    list.innerHTML = state.stories.map(function (story) {
      return '<div class="saved-story" data-story-id="' + story.id + '"><strong>' + escapeHtml(story.title) + '</strong><small>' + escapeHtml(story.competency) + '</small><div class="saved-story-actions"><button type="button" data-story-action="load">Edit</button><button type="button" data-story-action="export">Export</button><button type="button" data-story-action="delete">Delete</button></div></div>';
    }).join('');
  }

  function getStarDraft() {
    return {
      title: document.getElementById('star-title').value.trim(),
      competency: document.getElementById('star-competency').value,
      situation: document.getElementById('star-situation').value.trim(),
      task: document.getElementById('star-task').value.trim(),
      action: document.getElementById('star-action').value.trim(),
      result: document.getElementById('star-result').value.trim()
    };
  }

  function fillStar(story) {
    document.getElementById('star-title').value = story.title || '';
    document.getElementById('star-competency').value = story.competency || 'Ownership';
    document.getElementById('star-situation').value = story.situation || '';
    document.getElementById('star-task').value = story.task || '';
    document.getElementById('star-action').value = story.action || '';
    document.getElementById('star-result').value = story.result || '';
    document.getElementById('star-title').focus();
  }

  function storyMarkdown(story) {
    return '# ' + story.title + '\n\n**Competency:** ' + story.competency + '\n\n## Situation\n' + story.situation + '\n\n## Task\n' + story.task + '\n\n## Action\n' + story.action + '\n\n## Result\n' + story.result + '\n';
  }

  function downloadFile(filename, content) {
    var blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(function () { URL.revokeObjectURL(link.href); link.remove(); }, 100);
  }

  function startMock() {
    var category = document.getElementById('mock-category').value;
    var available = QUESTIONS.filter(function (question) { return category === 'all' || question.category === category; });
    available = available.slice().sort(function () { return Math.random() - 0.5; });
    var chosen = available.slice(0, Math.min(mockCount, available.length));
    mockSession = { queue: chosen, index: 0, answers: {}, ratings: {}, startedAt: Date.now() };
    document.getElementById('mock-setup').hidden = true;
    document.getElementById('mock-summary').hidden = true;
    document.getElementById('mock-active').hidden = false;
    renderMockQuestion();
    clearInterval(mockTimer);
    mockTimer = setInterval(updateMockTimer, 1000);
    updateMockTimer();
  }

  function updateMockTimer() {
    if (!mockSession) return;
    var elapsed = Math.floor((Date.now() - mockSession.startedAt) / 1000);
    var remaining = Math.max(0, MOCK_SECONDS - elapsed);
    var timer = document.getElementById('mock-timer');
    if (timer) {
      timer.textContent = String(Math.floor(remaining / 60)).padStart(2, '0') + ':' + String(remaining % 60).padStart(2, '0');
      timer.classList.toggle('is-low', remaining <= 60);
    }
    if (remaining === 0) finishMock();
  }

  function renderMockQuestion() {
    if (!mockSession) return;
    var question = mockSession.queue[mockSession.index];
    var answer = mockSession.answers[question.id] || '';
    var isLast = mockSession.index === mockSession.queue.length - 1;
    document.getElementById('mock-active').innerHTML = '<div class="mock-session-bar"><span><strong>Mock interview</strong> · Question ' + (mockSession.index + 1) + ' of ' + mockSession.queue.length + '</span><span class="mock-timer" id="mock-timer">20:00</span></div><div class="mock-prompt-card"><div class="question-card-tags"><span class="question-category-tag">' + escapeHtml(question.category) + '</span><span>·</span><span>' + escapeHtml(question.difficulty) + '</span></div><h3>' + escapeHtml(question.question) + '</h3><textarea class="mock-answer" id="mock-answer" placeholder="Speak your answer out loud, then jot down the important beats here…">' + escapeHtml(answer) + '</textarea><div class="mock-prompt-foot"><button type="button" class="prep-text-button mock-framework-toggle">Show answer framework</button><span>Take a breath. You have time.</span></div><div class="mock-framework" id="mock-framework"><strong>Framework:</strong> ' + escapeHtml(question.framework) + '</div></div><div class="mock-actions"><button type="button" class="btn btn-outline mock-exit">Exit mock</button><button type="button" class="btn btn-primary mock-next">' + (isLast ? 'Finish and review' : 'Save and next →') + '</button></div>';
    updateMockTimer();
    var answerField = document.getElementById('mock-answer');
    if (answerField) answerField.focus();
  }

  function finishMock() {
    if (!mockSession) return;
    var activeAnswer = document.getElementById('mock-answer');
    var activeQuestion = mockSession.queue[mockSession.index];
    if (activeAnswer && activeQuestion) mockSession.answers[activeQuestion.id] = activeAnswer.value.trim();
    clearInterval(mockTimer);
    mockSession.queue.forEach(function (question) { markPracticed(question.id); });
    document.getElementById('mock-active').hidden = true;
    document.getElementById('mock-summary').hidden = false;
    renderMockSummary();
  }

  function mockAverage() {
    if (!mockSession) return 0;
    var ratings = mockSession.queue.map(function (q) { return mockSession.ratings[q.id]; }).filter(function (rating) { return rating; });
    return ratings.length ? ratings.reduce(function (sum, value) { return sum + value; }, 0) / ratings.length : 0;
  }

  function renderMockSummary() {
    if (!mockSession) return;
    var average = mockAverage();
    var summary = document.getElementById('mock-summary');
    var score = average ? average.toFixed(1) : '—';
    summary.innerHTML = '<div class="mock-summary-hero"><div><p class="prep-next-label">MOCK COMPLETE</p><h3>Good work showing up.</h3><p>Review each answer honestly, then choose one thing to improve next time.</p></div><div class="mock-score">' + score + '<small>/5</small></div></div><div class="mock-summary-list">' + mockSession.queue.map(function (question) {
      var answer = mockSession.answers[question.id] || '';
      var selected = mockSession.ratings[question.id] || 0;
      return '<div class="mock-review-item"><p class="mock-review-question">' + escapeHtml(question.question) + '</p><p class="mock-review-answer' + (answer ? '' : ' is-empty') + '">' + escapeHtml(answer || 'No notes added — how did the spoken answer feel?') + '</p><div class="mock-rating"><span>Self-score:</span>' + [1, 2, 3, 4, 5].map(function (number) { return '<button type="button" data-mock-rating="' + number + '" data-question-id="' + question.id + '" class="' + (selected === number ? 'is-selected' : '') + '" aria-label="Rate ' + number + ' out of 5">' + number + '</button>'; }).join('') + '</div></div>';
    }).join('') + '</div><div class="mock-summary-actions"><button type="button" class="btn btn-primary" data-mock-coach>Get feedback on these answers <span aria-hidden="true">✧</span></button><button type="button" class="btn btn-outline" data-mock-again>Run another mock</button></div>';
    if (average && (!state.mockBest || average > state.mockBest)) { state.mockBest = average; saveState(); updateStats(); }
  }

  function mockNotes() {
    if (!mockSession) return '';
    return mockSession.queue.map(function (question, index) { return 'Question ' + (index + 1) + ': ' + question.question + '\nAnswer notes: ' + (mockSession.answers[question.id] || '[No notes]'); }).join('\n\n');
  }

  function prefillCoachFromMock() {
    var field = document.getElementById('coach-answer');
    if (field && mockSession && !field.value) field.value = mockNotes();
    updateCoachWordCount();
  }

  function prefillCoachFromStar() {
    var field = document.getElementById('coach-answer');
    var draft = getStarDraft();
    if (field && (draft.situation || draft.task || draft.action || draft.result)) field.value = 'Question type: behavioral answer\n\nStory: ' + (draft.title || 'Untitled story') + '\n\nSituation: ' + draft.situation + '\n\nTask: ' + draft.task + '\n\nAction: ' + draft.action + '\n\nResult: ' + draft.result;
    updateCoachWordCount();
  }

  function updateCoachWordCount() {
    var field = document.getElementById('coach-answer');
    var counter = document.getElementById('coach-word-count');
    if (!field || !counter) return;
    var words = field.value.trim() ? field.value.trim().split(/\s+/).length : 0;
    counter.textContent = words + (words === 1 ? ' word' : ' words');
  }

  function formatFeedback(text) {
    return String(text).split(/\n/).map(function (line) {
      var safe = escapeHtml(line.trim());
      if (!safe) return '';
      if (/^#{1,3}\s/.test(line)) return '<h4>' + escapeHtml(line.replace(/^#{1,3}\s*/, '')) + '</h4>';
      if (/^[-*]\s/.test(line)) return '<li>' + escapeHtml(line.replace(/^[-*]\s*/, '')) + '</li>';
      return '<p>' + safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') + '</p>';
    }).join('').replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
  }

  async function getCoachFeedback(event) {
    event.preventDefault();
    var keyInput = document.getElementById('ai-key');
    var key = keyInput.value.trim() || memoryAiKey;
    var answer = document.getElementById('coach-answer').value.trim();
    var endpoint = document.getElementById('ai-endpoint').value.trim();
    var model = document.getElementById('ai-model').value.trim();
    var output = document.getElementById('coach-output');
    var remember = document.getElementById('ai-remember').checked;
    if (!key) { output.innerHTML = '<div class="coach-error">Add an API key to use the optional coach. Your key is sent only to the endpoint you choose.</div>'; keyInput.focus(); return; }
    if (!answer) { output.innerHTML = '<div class="coach-error">Add an answer first so the coach has something specific to review.</div>'; return; }
    if (!endpoint || !model) { output.innerHTML = '<div class="coach-error">Add both a compatible endpoint and model name.</div>'; return; }
    memoryAiKey = key;
    try {
      if (remember) localStorage.setItem(AI_KEY, key); else localStorage.removeItem(AI_KEY);
    } catch (e) { /* optional persistence */ }
    output.innerHTML = '<div class="coach-loading">Reading your answer…</div>';
    var type = document.getElementById('coach-type').value;
    var system = 'You are a thoughtful senior engineering interviewer and coach. Give concise, practical feedback on a developer job interview answer. Evaluate clarity, structure, specificity, technical accuracy where relevant, ownership, and measurable impact. Do not invent experience. Suggest a stronger outline and one concrete rewrite of the weakest part. Use short headings and bullets. The answer type is: ' + type + '.';
    try {
      var response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key }, body: JSON.stringify({ model: model, messages: [{ role: 'system', content: system }, { role: 'user', content: answer }], temperature: 0.4, max_tokens: 700 }) });
      var data = await response.json();
      if (!response.ok) throw new Error((data && data.error && data.error.message) || 'The provider returned an error.');
      var feedback = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!feedback && data && data.output_text) feedback = data.output_text;
      if (!feedback) throw new Error('The provider returned no feedback. Check the model and endpoint.');
      output.innerHTML = '<div class="coach-feedback"><h3>Coach notes</h3><div class="coach-feedback-content">' + formatFeedback(feedback) + '</div></div>';
    } catch (error) {
      output.innerHTML = '<div class="coach-error"><strong>Could not get feedback.</strong><br>' + escapeHtml(error.message || 'Check your key, endpoint, and network connection.') + '<br><br>Tip: your provider must allow browser requests from this site.</div>';
    }
  }

  function initAiSettings() {
    try {
      var savedKey = localStorage.getItem(AI_KEY);
      if (savedKey) {
        memoryAiKey = savedKey;
        document.getElementById('ai-key').value = savedKey;
        document.getElementById('ai-remember').checked = true;
      }
    } catch (e) { /* no storage */ }
  }

  document.addEventListener('click', function (event) {
    var viewTrigger = event.target.closest('[data-prep-view]');
    if (viewTrigger) {
      var source = viewTrigger.getAttribute('data-coach-source') || (viewTrigger.closest('.prep-hero') ? 'hero' : null);
      setView(viewTrigger.getAttribute('data-prep-view'), source);
      return;
    }

    var toggle = event.target.closest('.question-card-toggle');
    if (toggle) {
      var card = toggle.closest('.question-card');
      var open = card.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'Hide guidance' : 'Show guidance';
      return;
    }

    var questionAction = event.target.closest('.question-detail-actions button');
    if (questionAction) {
      var questionCard = questionAction.closest('.question-card');
      var questionId = questionCard.getAttribute('data-question-id');
      var answerField = questionCard.querySelector('.question-answer');
      if (answerField) state.answers[questionId] = answerField.value.trim();
      markPracticed(questionId);
      renderQuestions();
      return;
    }

    var mockChoice = event.target.closest('[data-mock-count]');
    if (mockChoice) {
      mockCount = Number(mockChoice.getAttribute('data-mock-count'));
      document.querySelectorAll('[data-mock-count]').forEach(function (button) { button.classList.toggle('is-selected', button === mockChoice); });
      return;
    }

    var mockRating = event.target.closest('[data-mock-rating]');
    if (mockRating && mockSession) {
      mockSession.ratings[mockRating.getAttribute('data-question-id')] = Number(mockRating.getAttribute('data-mock-rating'));
      renderMockSummary();
      return;
    }

    if (event.target.closest('.mock-framework-toggle')) {
      var framework = document.getElementById('mock-framework');
      var frameworkButton = event.target.closest('.mock-framework-toggle');
      framework.classList.toggle('is-visible');
      frameworkButton.textContent = framework.classList.contains('is-visible') ? 'Hide answer framework' : 'Show answer framework';
      return;
    }

    if (event.target.closest('.mock-next')) {
      var field = document.getElementById('mock-answer');
      var current = mockSession.queue[mockSession.index];
      mockSession.answers[current.id] = field ? field.value.trim() : '';
      if (mockSession.index === mockSession.queue.length - 1) finishMock(); else { mockSession.index += 1; renderMockQuestion(); }
      return;
    }

    if (event.target.closest('.mock-exit')) {
      clearInterval(mockTimer);
      mockSession = null;
      document.getElementById('mock-active').hidden = true;
      document.getElementById('mock-summary').hidden = true;
      document.getElementById('mock-setup').hidden = false;
      return;
    }

    if (event.target.closest('[data-mock-again]')) {
      mockSession = null;
      document.getElementById('mock-summary').hidden = true;
      document.getElementById('mock-setup').hidden = false;
      return;
    }

    if (event.target.closest('[data-mock-coach]')) {
      setView('coach', 'mock');
      return;
    }

    var storyAction = event.target.closest('[data-story-action]');
    if (storyAction) {
      var storyShell = storyAction.closest('[data-story-id]');
      var story = state.stories.find(function (item) { return item.id === storyShell.getAttribute('data-story-id'); });
      if (!story) return;
      var action = storyAction.getAttribute('data-story-action');
      if (action === 'load') fillStar(story);
      if (action === 'delete') { state.stories = state.stories.filter(function (item) { return item.id !== story.id; }); saveState(); renderStories(); updateStats(); }
      if (action === 'export') downloadFile((story.title || 'star-story').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.md', storyMarkdown(story));
    }
  });

  document.getElementById('question-search').addEventListener('input', renderQuestions);
  document.getElementById('question-category').addEventListener('change', renderQuestions);
  document.getElementById('question-difficulty').addEventListener('change', renderQuestions);
  document.getElementById('question-reset').addEventListener('click', function () {
    document.getElementById('question-search').value = '';
    document.getElementById('question-category').value = 'all';
    document.getElementById('question-difficulty').value = 'all';
    renderQuestions();
  });
  document.getElementById('start-mock').addEventListener('click', startMock);
  document.getElementById('star-form').addEventListener('submit', function (event) {
    event.preventDefault();
    var draft = getStarDraft();
    draft.id = 'story-' + Date.now();
    draft.created = new Date().toISOString();
    state.stories.unshift(draft);
    saveState();
    markActivity();
    renderStories();
    updateStats();
    var submit = document.querySelector('#star-form button[type="submit"]');
    submit.textContent = 'Saved ✓';
    setTimeout(function () { submit.innerHTML = 'Save story <span aria-hidden="true">→</span>'; }, 1600);
  });
  document.getElementById('star-clear').addEventListener('click', function () { document.getElementById('star-form').reset(); });
  document.getElementById('coach-form').addEventListener('submit', getCoachFeedback);
  document.getElementById('coach-answer').addEventListener('input', updateCoachWordCount);
  document.getElementById('ai-remember').addEventListener('change', function () {
    var key = document.getElementById('ai-key').value.trim();
    try { if (this.checked && key) localStorage.setItem(AI_KEY, key); else if (!this.checked) localStorage.removeItem(AI_KEY); } catch (e) { /* optional persistence */ }
  });
  document.getElementById('ai-key').addEventListener('input', function () { memoryAiKey = this.value.trim(); });

  updateStats();
  renderStories();
  initAiSettings();
})();
