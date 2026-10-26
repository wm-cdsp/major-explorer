'use strict';
(() => {
  const data = window.CURRICULUM;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  if (!data) { $('#program-detail').textContent = 'Curriculum could not load. Please reload.'; return; }
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const majors = data.programs.filter(p => p.kind === 'major');
  const program = id => majors.find(p => p.id === id);
  const course = code => data.courses[code];
  const programName = p => `${p.title}${p.track ? ' · ' + p.track : ''}`;
  const source = (url, label = 'Catalog ↗') => `<a href="${escape(url)}" target="_blank" rel="noopener">${escape(label)}</a>`;
  const order = ['ds', 'cs', 'aai', 'business'];
  const interests = {
    analysis: { analysis: 6, impact: 1 }, 'applied-ai': { impact: 5, ai: 2 },
    ai: { ai: 4, software: 2, analysis: 2 }, software: { software: 7 },
    security: { security: 8, software: 1 }, spatial: { spatial: 8, analysis: 1 },
    business: { business: 5, analysis: 2 }, operations: { operations: 8, business: 2 }
  };
  const focus = {
    'applied-artificial-intelligence': 'AI tools, agent workflows, research design and responsible use.',
    'ds-artificial-intelligence': 'Data modeling and the design and application of AI models.',
    'ds-algorithms': 'Efficient algorithms, software and large-scale data processing.',
    'ds-data-application': 'Data pipelines, predictive analysis and applied modeling.',
    'ds-spatial-data-analytics': 'Geospatial analysis, satellite imagery and spatial data.',
    'cs-general': 'Programming, algorithms, software and computer systems.',
    'cs-aiml': 'Computer science foundations with AI and machine learning electives.',
    'cs-cyber': 'Security, systems, networks and vulnerability testing.',
    'business-analytics-data-science': 'Business intelligence, predictive and prescriptive analytics.',
    'business-analytics-supply-chain': 'Analytics for operations, logistics and supply chains.'
  };
  let notes = { programs: [], completed: [] };
  try {
    const old = JSON.parse(localStorage.getItem('wm-which-path-v1'));
    if (old && Array.isArray(old.programs) && Array.isArray(old.completed)) notes = { ...old, programs: old.programs.filter(program), completed: old.completed.filter(course) };
  } catch (_) {}
  let selected = program(notes.selectedProgram) ? notes.selectedProgram : 'ds-data-application';
  let interest = 'all', savedOnly = false, comparison = [], lookup = null, optional = '', searchLimit = 12, timer;
  const matcher = window.PATH_MATCHING;
  const profiles = matcher.programProfiles(majors);
  let answers = [1, 2, 3].includes(notes.adventure?.version) ? matcher.normalizeAnswers({ ...notes.adventure.answers, scope: 'major' }) : null;
  let student = answers ? (matcher.validProfile(notes.adventure.adjustedProfile) ? { ...notes.adventure.adjustedProfile } : matcher.studentProfile(answers)) : null;
  let draft = scenarioDraft(), quizStep = 0;
  try {
    const storedDraft = JSON.parse(sessionStorage.getItem('wm-major-explorer-draft'));
    if (storedDraft && matcher.validAnswers(storedDraft, { allowIncomplete: true })) draft = storedDraft;
    else if (storedDraft?.responses) {
      draft = { responses: Object.fromEntries(matcher.questions.map(q => [q.id, (storedDraft.responses[q.id] || []).filter(id => q.choices.some(c => c.id === id)).slice(0, matcher.selectionLimit)])), scope: 'major' };
    }
  } catch (_) {}
  function saveDraft() {
    try { sessionStorage.setItem('wm-major-explorer-draft', JSON.stringify(draft)); } catch (_) {}
  }
  function setMode(mode) {
    document.body.dataset.mode = mode;
    $('#mode-title').textContent = mode === 'guide' ? 'Help Me Pick a Major' : mode === 'explore' ? 'Explore Majors on My Own' : 'Find your path in computing, data & AI';
    $('#mode-description').textContent = mode === 'guide' ? 'Four short questions to connect your interests with a major. No experience needed.' : mode === 'explore' ? 'Compare programs, explore course requirements and keep notes as you go.' : 'Compare majors, explore courses and find a direction that fits your interests.';
    $('#explore-link').toggleAttribute('aria-current', mode === 'explore');
    $('#guide-link').toggleAttribute('aria-current', mode === 'guide');
    if (mode === 'explore') $('#explore-link').setAttribute('aria-current', 'page');
    if (mode === 'guide') $('#guide-link').setAttribute('aria-current', 'page');
    document.title = (mode === 'guide' ? 'Help Me Pick a Major' : mode === 'explore' ? 'Explore Majors' : 'Major Explorer') + ' | W&M Computational Pathways';
  }
  function navigate(hash, replace = false) {
    if (location.hash !== hash) history[replace ? 'replaceState' : 'pushState'](null, '', hash || location.pathname + location.search);
    applyRoute(true);
  }
  if (student) { interest = notes.view?.interest === 'profile' || !notes.view ? 'profile' : (Object.hasOwn(interests, notes.view.interest) ? notes.view.interest : 'all'); }
  const variants = family => majors.filter(p => p.family === family);
  const score = p => student && interest === 'profile' ? matcher.similarity(student, profiles[p.id]) : Object.entries(interests[interest] || {}).reduce((n, [tag, weight]) => n + (profiles[p.id][tag] || 0) * weight, 0);
  function syncProfileOption() {
    let option = $('#interest option[value="profile"]');
    if (student && !option) { option = document.createElement('option'); option.value = 'profile'; option.textContent = 'Your answers'; $('#interest').prepend(option); }
    $('#interest').value = interest;
  }
  function scenarioDraft() {
    return { responses: Object.fromEntries(matcher.questions.map(question => [question.id, answers?.responses ? [...answers.responses[question.id]] : []])), scope: 'major' };
  }
  function canContinueQuestion() {
    const choices = draft.responses[matcher.questions[quizStep].id];
    return choices.length > 0 && choices.length <= matcher.selectionLimit;
  }
  function updateQuestionControls() {
    const count = draft.responses[matcher.questions[quizStep].id].length;
    $$('#questionnaire input[type="checkbox"]').forEach(input => { input.disabled = !input.checked && count >= matcher.selectionLimit; });
    $('.topic-count').textContent = `${count}/${matcher.selectionLimit} selected`;
    $('[data-action="next-question"]').disabled = !canContinueQuestion();
  }
  function renderQuestion(focus = false) {
    const question = matcher.questions[quizStep];
    const selectedChoices = draft.responses[question.id];
    $('#questionnaire').innerHTML = `<div class="quiz-top"><span>Your interests <span aria-hidden="true">·</span> ${quizStep + 1} of ${matcher.questions.length}</span><button class="text-button" data-action="skip-questions">Skip to tool →</button></div><div class="quiz-progress" aria-hidden="true">${matcher.questions.map((q, i) => `<span class="${i <= quizStep ? 'done' : ''}"></span>`).join('')}</div><h2 id="quiz-title" tabindex="-1">${escape(question.title)}</h2><p id="quiz-context" class="quiz-context">${escape(question.context)}</p><p id="quiz-instruction" class="quiz-instruction">Choose up to 3. No experience needed.</p><div class="quiz-options scenario-options" role="group" aria-labelledby="quiz-title" aria-describedby="quiz-context quiz-instruction">${question.choices.map(choice => `<label class="quiz-topic ${selectedChoices.includes(choice.id) ? 'chosen' : ''}"><input type="checkbox" data-scenario-choice="${choice.id}" ${selectedChoices.includes(choice.id) ? 'checked' : ''}><span>${escape(choice.label)}</span></label>`).join('')}</div><div class="quiz-bottom"><button class="button" data-action="${quizStep ? 'previous-question' : 'show-entry'}">← Back</button><span class="topic-count" aria-live="polite" aria-atomic="true"></span><button class="button primary" data-action="next-question">${quizStep === matcher.questions.length - 1 ? 'See matches →' : 'Continue →'}</button></div>`;
    updateQuestionControls();
    if (focus) $('#quiz-title').focus({ preventScroll: true });
  }
  function showEntry() {
    setMode('entry');
    $('#entry-screen').hidden = false; $('#questionnaire').hidden = true; $('#tool').hidden = true;
    $('#redo-questions').hidden = true; $('#export-notes').hidden = true;
    $('.skip').href = '#entry-title'; $('.skip').textContent = 'Skip to choices';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function showTool() {
    setMode('explore');
    $('#entry-screen').hidden = true;
    $('#questionnaire').hidden = true; $('#tool').hidden = false;
    $('#redo-questions').hidden = false; $('#export-notes').hidden = false;
    $('#redo-questions').textContent = student ? 'Redo questions' : 'Find a match';
    $('.skip').href = '#program-detail'; $('.skip').textContent = 'Skip to requirements';
    syncProfileOption(); renderProfile();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function startQuestions() {
    draft = scenarioDraft(); saveDraft(); navigate('#guide');
  }
  function showQuestions(step) {
    setMode('guide');
    quizStep = step;
    $('#entry-screen').hidden = true; $('#tool').hidden = true; $('#questionnaire').hidden = false;
    $('.skip').href = '#quiz-title'; $('.skip').textContent = 'Skip to questions';
    $('#redo-questions').hidden = true; $('#export-notes').hidden = true;
    renderQuestion(true); window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function finishQuestions() {
    if (!matcher.validAnswers(draft)) return;
    answers = matcher.normalizeAnswers(draft);
    notes.adventure = { version: 3, answers, adjustedProfile: null };
    notes.adventureSkipped = false;
    student = matcher.studentProfile(answers);
    interest = 'profile'; savedOnly = false; comparison = [];
    $('#saved-only').checked = false;
    syncProfileOption(); renderComparison();
    selectProgram(matcher.rank(majors, student, profiles)[0].program.id);
    $('#interest-profile').open = true;
    showTool(); if ($('.match-list')) $('.match-list').scrollTop = 0; $('#interest-profile > summary').focus({ preventScroll: true });
  }
  function profileChart(p) {
    const center = [200, 155], radius = 97, labelRadius = 130;
    const point = (index, distance) => { const angle = -Math.PI / 2 + index * Math.PI / 4; return [center[0] + Math.cos(angle) * distance, center[1] + Math.sin(angle) * distance]; };
    const xy = point => point.map(n => n.toFixed(2)).join(',');
    const polygon = values => matcher.axes.map((axis, i) => xy(point(i, radius * values[axis.key] / 5))).join(' ');
    return `<svg viewBox="0 0 400 315" role="img" aria-labelledby="radar-title radar-description"><title id="radar-title">Your interests compared with ${escape(programName(p))}</title><desc id="radar-description">Eight dimensions on a zero to five scale. Solid green represents your responses; dashed gold represents the program's calibrated curriculum emphasis. Exact values are in the interest details below.</desc>${[1, 2, 3, 4, 5].map(level => `<polygon points="${matcher.axes.map((a, i) => xy(point(i, radius * level / 5))).join(' ')}" class="radar-grid"/>`).join('')}${matcher.axes.map((a, i) => `<line x1="200" y1="155" x2="${point(i, radius)[0]}" y2="${point(i, radius)[1]}" class="radar-axis"/>`).join('')}${[1, 3, 5].map(level => `<text x="205" y="${155 - radius * level / 5 + 3}" class="radar-scale" aria-hidden="true">${level}</text>`).join('')}<polygon points="${polygon(profiles[p.id])}" class="radar-program"/><polygon points="${polygon(student)}" class="radar-student"/>${matcher.axes.map((a, i) => { const location = point(i, radius * student[a.key] / 5); return `<circle cx="${location[0]}" cy="${location[1]}" r="3" class="radar-dot"/>`; }).join('')}${matcher.axes.map((a, i) => { const [x, y] = point(i, labelRadius); const anchor = x < 150 ? 'end' : x > 250 ? 'start' : 'middle'; return `<text x="${x}" y="${y - (a.lines.length - 1) * 6 + 4}" text-anchor="${anchor}" class="radar-label" aria-hidden="true">${a.lines.map((line, j) => `<tspan x="${x}" dy="${j ? 13 : 0}">${line}</tspan>`).join('')}</text>`; }).join('')}</svg>`;
  }
  function profileRankings() {
    const ranked = matcher.rank(majors, student, profiles);
    return `<div class="match-list-heading"><h3>Major matches</h3><span>${ranked.length} routes <span aria-hidden="true">·</span> 0–100 similarity</span></div><div class="match-list">${ranked.map(({ program: p, score: value }, index) => `<button class="match-row ${p.id === selected ? 'active' : ''}" data-program="${p.id}" aria-pressed="${p.id === selected}" aria-label="${escape(programName(p))}, ${p.degree}, similarity ${Math.round(value)} out of 100"><span class="match-number">${index + 1}</span><span class="match-name"><strong>${escape(p.title)}</strong><small>${escape(p.degree)}${p.track ? ' · ' + escape(p.track) : ''}</small></span><span class="match-value">${Math.round(value)}<small>/100</small></span></button>`).join('')}</div>`;
  }
  function profileValues(p) {
    return `<table class="profile-values"><caption>Student interest and interpreted curriculum emphasis (0–5)</caption><thead><tr><th scope="col">Dimension</th><th scope="col">You</th><th scope="col">Program</th></tr></thead><tbody>${matcher.axes.map(a => `<tr><th scope="row">${escape(a.label)}</th><td>${student[a.key].toFixed(1)}</td><td>${profiles[p.id][a.key].toFixed(1)}</td></tr>`).join('')}</tbody></table>`;
  }
  function refreshProfileVisuals() {
    if (!student) return;
    const p = program(selected);
    $('#radar-chart').innerHTML = profileChart(p);
    $('#radar-program-label').textContent = programName(p);
    $('#selected-similarity').textContent = Math.round(matcher.similarity(student, profiles[p.id])) + '/100 similarity';
    $('#match-rankings').innerHTML = profileRankings();
    $('#profile-values').innerHTML = profileValues(p);
    matcher.axes.forEach(a => { const output = $(`[data-axis-value="${a.key}"]`); if (output) output.textContent = student[a.key].toFixed(1); });
  }
  function renderProfile() {
    const previousScroll = $('.match-list')?.scrollTop || 0;
    $('#interest-profile').hidden = !student;
    if (!student) return;
    $('#profile-content').innerHTML = `<div class="profile-grid"><div class="chart-column"><div class="radar-key"><span class="student-key">Your interests</span><span class="program-key">Program emphasis</span></div><div id="radar-chart"></div><div class="selected-match"><strong id="radar-program-label"></strong><span id="selected-similarity"></span></div></div><div id="match-rankings"></div></div><p class="match-explainer">Higher scores mean closer interest profiles. Program emphasis is an editorial guide based on catalog coursework, not an official W&M assessment.</p><details class="profile-adjust"><summary>Adjust interests & view scoring details</summary><div class="interest-sliders">${matcher.axes.map(a => `<label class="interest-slider"><span>${escape(a.label)} <output data-axis-value="${a.key}" for="axis-${a.key}">${student[a.key].toFixed(1)}</output></span><input id="axis-${a.key}" type="range" min="0" max="5" step="0.5" value="${student[a.key]}" data-interest-axis="${a.key}" aria-label="${escape(a.label)} interest"></label>`).join('')}</div><button class="text-button" data-action="reset-profile">Use questionnaire values</button><p class="scoring-note">${answers.responses ? 'Each question contributes equally. Every response blends several curriculum-related signals; choices within a question are averaged. The four averages map to a 1–5 scale, rounded to the nearest 0.5. These are editorial matching weights, not a validated assessment.' : 'Your saved profile uses the earlier interest questions. Redo questions to try the current quiz.'} Sliders let you refine the eight dimensions. Program profiles start with catalog-based tags rescaled to 0–5, with reference-chart calibration for CS–Cybersecurity, DS–AI and both Business Analytics routes. These same plotted values drive matching and career-interest sorting. Similarity is 100 × (1 − the root-mean-square difference / 5), rounded for display. It measures interests, not ability, admission or career outcomes.</p><div id="profile-values"></div></details>`;
    refreshProfileVisuals();
    if ($('.match-list')) $('.match-list').scrollTop = previousScroll;
  }

  function persist() {
    notes.selectedProgram = selected; notes.view = { interest };
    try { localStorage.setItem('wm-which-path-v1', JSON.stringify(notes)); }
    catch (_) { notify('Notes cannot be saved by this browser.'); }
  }
  function notify(message) {
    $('#status').textContent = message;
    $('#status').classList.add('visible');
    clearTimeout(timer);
    timer = setTimeout(() => $('#status').classList.remove('visible'), 2400);
  }
  function familyGroups() {
    return order.map(family => {
      const list = variants(family).filter(p => !savedOnly || notes.programs.includes(p.id));
      return list.length ? { family, list, best: [...list].sort((a, b) => score(b) - score(a))[0] } : null;
    }).filter(Boolean).sort((a, b) => score(b.best) - score(a.best));
  }
  function selectProgram(id, updateHash = true) {
    if (!program(id)) return;
    selected = id; lookup = null; optional = ''; $('#inline-lookup').innerHTML = '';
    if (updateHash) { navigate('#path/' + id); return; }
    persist(); renderPrograms(); renderDetail(); renderProfile();
  }
  function applyFilters() {
    const groups = familyGroups();
    if (groups.length) selectProgram(interest === 'all' && groups.some(g => g.list.some(p => p.id === selected)) ? selected : groups[0].best.id);
    else { renderPrograms(); renderProfile(); $('#program-detail').innerHTML = '<p class="empty">No saved programs match these filters.</p>'; }
  }
  function renderPrograms() {
    const groups = familyGroups();
    $('#program-count').textContent = `${groups.length} major${groups.length === 1 ? '' : 's'}`;
    $('#program-list').innerHTML = groups.map(g => {
      const p = g.list.find(p => p.id === selected) || g.best;
      const label = `${p.degree}${g.list.length > 1 ? ' · ' + g.list.length + (g.family === 'ds' ? ' tracks' : g.family === 'cs' ? ' concentrations' : ' routes') : ''}`;
      const active = program(selected)?.family === g.family;
      return `<button class="program-item ${active ? 'active' : ''}" data-program="${p.id}" aria-pressed="${active}"><span class="program-name">${escape(p.title)}${g.list.some(p => notes.programs.includes(p.id)) ? '<span class="saved-mark" aria-label="Saved">★</span>' : ''}</span><span class="program-info">${escape(label)}${student ? ' · ' + Math.round(matcher.similarity(student, profiles[p.id])) + '/100' : ''}</span></button>`;
    }).join('') || '<p class="empty">No saved programs.</p>';
    $('#mobile-program').innerHTML = groups.map(g => { const p = g.list.find(p => p.id === selected) || g.best; return `<option value="${p.id}" ${program(selected)?.family === g.family ? 'selected' : ''}>${escape(p.title)} · ${escape(p.degree)}</option>`; }).join('') || '<option>No saved programs</option>';
    $('#mobile-program').disabled = !groups.length;
    $('#interest-note').textContent = interest === 'profile' ? 'Sorted by similarity to your answers.' : interest === 'all' ? 'Select a program to view requirements.' : 'Sorted by curriculum relevance to your interest.';
  }
  function courseInfo(c) {
    const related = [...new Set((c.prerequisites + ' ' + c.corequisites).match(/\b[A-Z]{2,5}\s\d{3}[A-Z]?\b/g) || [])].filter(id => id !== c.code);
    return `<div class="course-body"><p><strong>Prerequisites:</strong> ${escape(c.prerequisites)}</p><p><strong>Corequisites:</strong> ${escape(c.corequisites)}</p>${c.notes ? `<p>${escape(Array.isArray(c.notes) ? c.notes.join(' ') : c.notes)}</p>` : ''}${c.term !== 'Not specified' ? `<p><strong>Timing:</strong> ${escape(c.timingNote)}</p>` : ''}${related.length ? `<div class="linked-prereqs">${related.map(id => course(id) ? `<button data-lookup="${escape(id)}">${escape(id)} ↗</button>` : source('https://catalog.wm.edu/search/?P=' + encodeURIComponent(id), id + ' ↗')).join('')}</div>` : ''}<a class="course-source" href="${escape(c.source)}" target="_blank" rel="noopener">Course catalog ↗</a></div>`;
  }
  function courseRow(code, prefix) {
    const c = course(code);
    if (!c) return '';
    const done = notes.completed.includes(code);
    return `<div class="course-entry ${done ? 'complete' : ''}"><input class="course-complete" type="checkbox" data-complete="${escape(code)}" aria-label="Mark ${escape(code)} complete" ${done ? 'checked' : ''}><details id="${escape(prefix + '-' + code.replaceAll(' ', '-'))}"><summary><span class="course-main"><span class="course-code">${escape(code)}</span><span class="course-title">${escape(c.title)}</span></span><span class="credits">${c.credits != null ? escape(c.credits) : '—'}</span><span class="term ${c.term !== 'Not specified' ? 'known' : ''}">${c.term !== 'Not specified' ? escape(c.term) : '—'}</span><span class="chevron" aria-hidden="true">›</span></summary>${courseInfo(c)}</details></div>`;
  }
  function requirementGroup(g, index) {
    const shortRules = {
      'Before Business School admission': 'Complete these admission subjects; confirm course equivalents with Mason.',
      'Introductory calculus admission prerequisite': 'Introductory calculus required; confirm accepted equivalents with Mason.',
      'Integrated Foundation Semester corequisites': 'Take the foundation-semester corequisites together; see catalog notes.'
    };
    const rule = shortRules[g.title] || g.rule;
    const details = [...(rule !== g.rule ? [g.rule] : []), ...(g.notes || [])];
    const marked = g.courseIds.filter(id => notes.completed.includes(id)).length;
    const options = g.courseIds.map(id => courseRow(id, 'group' + index)).join('');
    return `<section class="requirement-group"><div class="group-heading"><h3>${escape(g.title)}</h3><span data-group-count="${index}">${g.courseIds.length ? (marked ? marked + ' marked' : '') : ''}</span></div><p class="group-rule">${escape(rule)}</p>${g.candidates ? '<p class="candidate-label">Confirm course eligibility with your advisor.</p>' : ''}${details.length ? `<details class="group-note"><summary>Restrictions & details</summary><ul>${details.map(n => `<li>${escape(n)}</li>`).join('')}</ul></details>` : ''}${g.courseIds.length > 8 ? `<details class="options"><summary>${g.courseIds.length} course options</summary>${options}</details>` : options}${!g.courseIds.length ? `<p class="open-requirement">${source(g.source || program(selected).source, 'Check eligible courses with your advisor ↗')}</p>` : ''}</section>`;
  }
  function renderDetail() {
    const p = program(selected);
    const options = variants(p.family);
    const uniqueCourses = [...new Set(p.groups.flatMap(g => g.courseIds))];
    const marked = uniqueCourses.filter(id => notes.completed.includes(id)).length;
    $('#program-detail').innerHTML = `<div class="program-heading"><div><h2>${escape(p.title)}</h2><div class="metadata"><span class="degree">${escape(p.degree)}</span><span>${escape(p.credits)} credits</span><span>·</span>${source(p.source)}</div></div><div class="program-tools"><button class="button ${notes.programs.includes(p.id) ? 'selected' : ''}" data-action="save" aria-pressed="${notes.programs.includes(p.id)}">${notes.programs.includes(p.id) ? '★ Saved' : '☆ Save'}</button><button class="button ${comparison.includes(p.id) ? 'selected' : ''}" data-action="compare" aria-pressed="${comparison.includes(p.id)}">${comparison.includes(p.id) ? '✓ Comparing' : '+ Compare'}</button></div></div>${options.length > 1 ? `<label class="control variant-control"><span>${p.family === 'ds' ? 'Track' : p.family === 'cs' ? 'Concentration' : 'Business Analytics route'}</span><select id="program-variant">${options.map(v => `<option value="${v.id}" ${v.id === p.id ? 'selected' : ''}>${escape(v.track)}</option>`).join('')}</select></label>` : ''}<div class="fit-row"><p>${escape(focus[p.id] || p.fit)}</p><p class="career-examples"><strong>Related roles:</strong> ${escape(p.careers.join(' · '))}</p></div>${p.notes.length ? `<details class="notice"><summary>${p.notes.length} catalog note${p.notes.length === 1 ? '' : 's'} on credits & prerequisites</summary><ul>${p.notes.map(n => `<li>${escape(n)}</li>`).join('')}</ul></details>` : ''}<div class="requirements-heading"><h3>Course requirements</h3><p><span id="completed-count" class="check-count">${marked}</span> completed <span aria-hidden="true">·</span> <span title="The catalog does not specify a season for most courses.">— = term not stated</span></p></div><div class="course-legend" aria-hidden="true"><span>Course · expand for prerequisites</span><span>Cr.</span><span>Term</span><span></span></div>${p.groups.map(requirementGroup).join('')}${p.optionalConcentrations ? `<div class="optional-control"><label class="control"><span>Optional business concentration</span><select id="optional-concentration"><option value="">None</option>${p.optionalConcentrations.map((g, i) => `<option value="${i}">${escape(g.title)}</option>`).join('')}</select></label><p class="optional-note">Additional study in another business area; not required for the major.</p><div id="optional-requirements"></div></div>` : ''}<details class="planning"><summary>Planning rules & graduation requirements</summary><ul>${p.rules.map(r => `<li>${escape(r)}</li>`).join('')}</ul><p>These are program requirements. ${source('https://catalog.wm.edu/undergraduate/', 'University graduation requirements ↗')} also apply.</p></details><div class="program-bottom"><button class="text-button" data-action="share">Copy program link</button><button class="text-button" data-action="print">Print requirements</button></div>`;
    if (lookup) renderLookup();
    if ($('#optional-concentration') && optional !== '') { $('#optional-concentration').value = optional; $('#optional-requirements').innerHTML = requirementGroup(p.optionalConcentrations[Number(optional)], 100); }
  }
  function renderLookup() {
    const c = course(lookup);
    if (!c) return;
    $('#inline-lookup').innerHTML = `<details class="lookup-result" open><summary>${escape(c.code)} · ${escape(c.title)}<button class="close-search" data-action="close-lookup" aria-label="Close course lookup">×</button></summary>${courseInfo(c)}</details>`;
  }
  function renderComparison() {
    const el = $('#comparison');
    el.hidden = !comparison.length;
    if (!comparison.length) return;
    const programs = comparison.map(program);
    el.innerHTML = `<div class="section-title"><span>Compare programs <span class="comparison-hint">(${programs.length}/3)</span></span><div class="comparison-controls"><button class="text-button" data-action="clear-comparison">Clear</button></div></div>${programs.length < 2 ? '<p class="comparison-hint">Select another program and click Compare.</p>' : ''}<div class="table-scroll"><table class="comparison-table"><thead><tr><th scope="col">Program</th>${programs.map(p => `<th scope="col"><button class="remove-compare" data-remove-comparison="${p.id}" aria-label="Remove ${escape(programName(p))} from comparison">×</button>${escape(programName(p))}</th>`).join('')}</tr></thead><tbody>${[
      ...(student ? [['Interest match', p => Math.round(matcher.similarity(student, profiles[p.id])) + '/100']] : []), ['Degree', p => p.degree], ['Credits', p => p.credits], ['Focus', p => focus[p.id] || p.fit], ['Related roles', p => p.careers.join(' · ')]
    ].map(([label, value]) => `<tr><td>${label}</td>${programs.map(p => `<td>${escape(value(p))}</td>`).join('')}</tr>`).join('')}<tr><td>Requirements</td>${programs.map(p => `<td><button data-program="${p.id}">View program ↗</button></td>`).join('')}</tr></tbody></table></div>`;
  }
  function renderSearch() {
    const q = $('#course-search').value.trim().toLowerCase();
    const el = $('#search-results'); el.hidden = !q;
    if (!q) { el.innerHTML = ''; return; }
    const compact = q.replace(/\s+/g, '');
    const results = Object.values(data.courses).filter(c => c.title.toLowerCase().includes(q) || c.code.toLowerCase().replace(/\s+/g, '').includes(compact)).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    el.innerHTML = `<div class="section-title"><span>${results.length} course${results.length === 1 ? '' : 's'} found</span><button class="close-search" data-action="clear-search" aria-label="Clear course search">×</button></div><p class="course-search-note">Across all programs. A result may be an elective or prerequisite.</p><div class="course-legend" aria-hidden="true"><span>Course · expand for prerequisites</span><span>Cr.</span><span>Term</span><span></span></div>${results.slice(0, searchLimit).map(c => courseRow(c.code, 'search')).join('') || '<p class="empty">No matching courses.</p>'}${results.length > searchLimit ? '<button class="text-button search-more" data-action="more-results">Show more courses</button>' : ''}`;
  }
  function downloadNotes() {
    const lines = ['W&M DATA & AI PROGRAM NOTES', 'Catalog: 2026–27; checked October 20, 2026.', '', 'Saved programs:', ...notes.programs.map(id => { const p = program(id); return programName(p) + ' (' + p.degree + ')\n' + p.source; }), '', ...(student ? ['Interest profile (0-5):', ...matcher.axes.map(a => a.label + ': ' + student[a.key].toFixed(1)), ''] : []), 'Courses marked complete:', ...notes.completed.map(id => id + ' — ' + course(id).title), '', 'Personal notes, not a degree audit. Program credits exclude other university graduation requirements.'];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'wm-program-notes.txt'; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
    notify('Notes exported.');
  }
  document.addEventListener('click', async event => {
    const skip = event.target.closest('a.skip');
    if (skip) {
      event.preventDefault();
      const target = $(skip.getAttribute('href'));
      target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: 'start' }); return;
    }
    const button = event.target.closest('button'); if (!button) return;
    if (button.dataset.program) {
      const p = program(button.dataset.program);
      if (savedOnly && !notes.programs.includes(p.id)) { savedOnly = false; $('#saved-only').checked = false; }
      selectProgram(p.id); return;
    }
    if (button.dataset.lookup) { lookup = button.dataset.lookup; renderLookup(); $('#inline-lookup').scrollIntoView({ block: 'nearest' }); return; }
    if (button.dataset.removeComparison) { comparison = comparison.filter(id => id !== button.dataset.removeComparison); renderComparison(); renderDetail(); return; }
    switch (button.dataset.action) {
      case 'explore-own':
        interest = 'all'; savedOnly = false;
        $('#interest').value = 'all'; $('#saved-only').checked = false;
        notes.adventureSkipped = true; persist(); navigate('#explore');
        $('#interest-profile').open = false; $('#interest').focus({ preventScroll: true }); break;
      case 'start-guide': startQuestions(); break;
      case 'show-entry': navigate(''); $('#entry-title').focus({ preventScroll: true }); break;
      case 'skip-questions': notes.adventureSkipped = true; persist(); navigate('#explore'); $('#interest').focus({ preventScroll: true }); break;
      case 'previous-question': navigate(quizStep > 1 ? '#guide/' + quizStep : '#guide'); break;
      case 'next-question':
        if (!canContinueQuestion()) break;
        if (quizStep === matcher.questions.length - 1) { finishQuestions(); break; }
        navigate('#guide/' + (quizStep + 2)); break;
      case 'reset-profile': notes.adventure.adjustedProfile = null; student = matcher.studentProfile(answers); persist(); renderProfile(); renderPrograms(); renderComparison(); break;
      case 'save': {
        const exists = notes.programs.includes(selected);
        notes.programs = exists ? notes.programs.filter(id => id !== selected) : [...notes.programs, selected];
        persist(); if (savedOnly && exists) applyFilters(); else { renderPrograms(); renderDetail(); }
        notify(exists ? 'Program removed from saved.' : 'Program saved.'); break;
      }
      case 'compare':
        if (comparison.includes(selected)) comparison = comparison.filter(id => id !== selected);
        else if (comparison.length < 3) comparison.push(selected);
        else { notify('Compare up to three programs.'); break; }
        renderComparison(); renderDetail(); break;
      case 'clear-comparison': comparison = []; renderComparison(); renderDetail(); break;
      case 'clear-search': $('#course-search').value = ''; renderSearch(); $('#course-search').focus(); break;
      case 'more-results': searchLimit += 25; renderSearch(); break;
      case 'close-lookup': lookup = null; $('#inline-lookup').innerHTML = ''; break;
      case 'print': window.print(); break;
      case 'share':
        try { const url = new URL(location.href); url.hash = 'path/' + selected; await navigator.clipboard.writeText(url.href); notify('Program link copied.'); }
        catch (_) { notify('Copy the program URL from your address bar.'); }
        break;
    }
  });
  document.addEventListener('change', event => {
    const el = event.target;
    if (el.dataset.scenarioChoice) {
      const question = matcher.questions[quizStep];
      const value = el.dataset.scenarioChoice;
      const selections = draft.responses[question.id];
      if (el.checked && !selections.includes(value) && selections.length >= matcher.selectionLimit) el.checked = false;
      draft.responses[question.id] = el.checked ? [...new Set([...selections, value])] : selections.filter(id => id !== value);
      el.closest('.quiz-topic').classList.toggle('chosen', el.checked);
      updateQuestionControls(); saveDraft();
      return;
    }
    if (el.dataset.complete) {
      const code = el.dataset.complete;
      notes.completed = el.checked ? [...new Set([...notes.completed, code])] : notes.completed.filter(id => id !== code);
      persist(); $$('[data-complete]').filter(box => box.dataset.complete === code).forEach(box => { box.checked = notes.completed.includes(code); box.closest('.course-entry').classList.toggle('complete', box.checked); });
      const p = program(selected);
      if ($('#completed-count')) $('#completed-count').textContent = new Set(p.groups.flatMap(g => g.courseIds).filter(id => notes.completed.includes(id))).size;
      p.groups.forEach((g, i) => { const count = $(`[data-group-count="${i}"]`); if (count) count.textContent = g.courseIds.length ? (g.courseIds.filter(id => notes.completed.includes(id)).length || '') + (g.courseIds.some(id => notes.completed.includes(id)) ? ' marked' : '') : ''; });
      if (optional !== '' && p.optionalConcentrations) { const count = $('[data-group-count="100"]'); if (count) count.textContent = p.optionalConcentrations[Number(optional)].courseIds.filter(id => notes.completed.includes(id)).length + ' marked'; }
    }
    if (el.id === 'mobile-program') { selectProgram(el.value); $('#mobile-program').focus({ preventScroll: true }); }
    if (el.id === 'program-variant') { selectProgram(el.value); $('#program-variant').focus({ preventScroll: true }); }
    if (el.id === 'optional-concentration') { optional = el.value; $('#optional-requirements').innerHTML = optional === '' ? '' : requirementGroup(program(selected).optionalConcentrations[Number(optional)], 100); }
  });
  document.addEventListener('input', event => { const key = event.target.dataset.interestAxis; if (!key || !student) return; student = { ...student, [key]: Number(event.target.value) }; notes.adventure.adjustedProfile = { ...student }; persist(); refreshProfileVisuals(); renderPrograms(); renderComparison(); });
  $('#redo-questions').addEventListener('click', startQuestions);
  $('#interest').addEventListener('change', event => { interest = event.target.value; applyFilters(); });
  $('#saved-only').addEventListener('change', event => { savedOnly = event.target.checked; applyFilters(); });
  $('#course-search').addEventListener('input', () => { searchLimit = 12; renderSearch(); });
  $('#course-search').addEventListener('keydown', event => { if (event.key === 'Escape') { event.target.value = ''; renderSearch(); } });
  $('#export-notes').addEventListener('click', downloadNotes);
  $('#export-notes-mobile').addEventListener('click', downloadNotes);
  $('#source-links').innerHTML = data.sources.slice(0, 8).map(s => source(s.url, s.title)).join('');
  let lastRenderedHash;
  function applyRoute(force = false) {
    if (!force && lastRenderedHash === location.hash) return;
    const route = window.EXPLORER_ROUTES.parse(location.hash, majors.map(p => p.id), matcher.questions.length);
    lastRenderedHash = location.hash;
    if (route.kind === 'guide') { showQuestions(route.step); return; }
    if (route.kind === 'explore' || route.kind === 'path') {
      if (route.kind === 'explore') { interest = 'all'; savedOnly = false; $('#saved-only').checked = false; }
      selectProgram(route.id || selected, false); showTool();
      if (route.kind === 'explore') $('#interest-profile').open = false;
      return;
    }
    showEntry();
  }
  window.addEventListener('popstate', () => applyRoute());
  window.addEventListener('hashchange', () => applyRoute());
  let printDetails = [];
  window.addEventListener('beforeprint', () => { printDetails = $$('#program-detail details:not([open])'); printDetails.forEach(d => { d.open = true; }); });
  window.addEventListener('afterprint', () => { printDetails.forEach(d => { d.open = false; }); printDetails = []; });
  syncProfileOption();
  renderPrograms(); renderDetail(); applyRoute(true);
})();
