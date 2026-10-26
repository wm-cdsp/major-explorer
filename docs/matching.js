/* Curriculum-based interest profiles, separate from course requirements. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PATH_MATCHING = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const axes = [
    { key: 'analysis', label: 'Data analysis', lines: ['Data', 'analysis'] },
    { key: 'ai', label: 'AI models', lines: ['AI', 'models'] },
    { key: 'software', label: 'Software', lines: ['Software'] },
    { key: 'security', label: 'Security', lines: ['Security'] },
    { key: 'operations', label: 'Operations', lines: ['Operations'] },
    { key: 'spatial', label: 'Spatial data', lines: ['Spatial', 'data'] },
    { key: 'business', label: 'Business', lines: ['Business'] },
    { key: 'impact', label: 'Applied AI', lines: ['Applied', 'AI'] }
  ];
  const goals = [
    { id: 'analysis', label: 'Explain patterns in data', primary: 'analysis', support: ['ai', 'impact'] },
    { id: 'applied-ai', label: 'Apply AI in another field', primary: 'impact', support: ['ai', 'analysis'] },
    { id: 'ai', label: 'Train and evaluate AI models', primary: 'ai', support: ['analysis', 'software'] },
    { id: 'software', label: 'Build software people use', primary: 'software', support: ['ai', 'security'] },
    { id: 'security', label: 'Protect systems and information', primary: 'security', support: ['software', 'analysis'] },
    { id: 'spatial', label: 'Analyze maps and satellite data', primary: 'spatial', support: ['analysis', 'ai'] },
    { id: 'business', label: 'Guide business decisions', primary: 'business', support: ['analysis', 'operations'] },
    { id: 'operations', label: 'Improve operations and supply chains', primary: 'operations', support: ['business', 'analysis'] }
  ];
  const approaches = {
    applied: { impact: 2, analysis: 1, business: 0.5 },
    models: { ai: 1.5, analysis: 1.5, software: 0.5 },
    engineering: { software: 2, security: 0.5, ai: 0.5 },
    open: { analysis: 0.5, ai: 0.5, software: 0.5, impact: 0.5 }
  };
  // Interest and project choices; every response combines several curriculum dimensions.
  const questions = [
    {
      "id": "journeys",
      "title": "What work interests you?",
      "context": "Choose the activities you’d most like to try.",
      "choices": [
        {
          "id": "a",
          "label": "Analyze maps and location data.",
          "weights": {
            "spatial": 3,
            "analysis": 2,
            "impact": 1
          }
        },
        {
          "id": "b",
          "label": "Analyze data and make predictions.",
          "weights": {
            "analysis": 3,
            "ai": 2,
            "security": 1
          }
        },
        {
          "id": "c",
          "label": "Improve routes, schedules, and deliveries.",
          "weights": {
            "operations": 3,
            "software": 2,
            "spatial": 1
          }
        },
        {
          "id": "d",
          "label": "Compare costs and business results.",
          "weights": {
            "business": 2,
            "operations": 2,
            "analysis": 2
          }
        },
        {
          "id": "e",
          "label": "Use AI to solve everyday problems.",
          "weights": {
            "impact": 3,
            "business": 2,
            "security": 1
          }
        },
        {
          "id": "f",
          "label": "Build apps and software.",
          "weights": {
            "software": 3,
            "operations": 2,
            "security": 1
          }
        }
      ]
    },
    {
      "id": "collection",
      "title": "What would you like to learn?",
      "context": "Pick the topics you’re curious about.",
      "choices": [
        {
          "id": "a",
          "label": "How to check whether AI answers are reliable.",
          "weights": {
            "security": 2,
            "analysis": 2,
            "ai": 2
          }
        },
        {
          "id": "b",
          "label": "How machine learning finds patterns.",
          "weights": {
            "ai": 3,
            "analysis": 2,
            "spatial": 1
          }
        },
        {
          "id": "c",
          "label": "How to use AI in health, education, or the arts.",
          "weights": {
            "impact": 3,
            "software": 2,
            "business": 1
          }
        },
        {
          "id": "d",
          "label": "How websites and apps work.",
          "weights": {
            "software": 3,
            "operations": 2,
            "security": 1
          }
        },
        {
          "id": "e",
          "label": "How maps reveal environmental and social patterns.",
          "weights": {
            "spatial": 3,
            "analysis": 2,
            "impact": 1
          }
        },
        {
          "id": "f",
          "label": "How data supports marketing and business strategy.",
          "weights": {
            "business": 3,
            "impact": 2,
            "operations": 1
          }
        }
      ]
    },
    {
      "id": "market",
      "title": "Which projects appeal to you?",
      "context": "Think about the problems you’d enjoy working on.",
      "choices": [
        {
          "id": "a",
          "label": "Help distribute international aid where it’s needed most.",
          "weights": {
            "spatial": 2,
            "operations": 3,
            "analysis": 1
          }
        },
        {
          "id": "b",
          "label": "Build an app that improves access to health care.",
          "weights": {
            "software": 3,
            "operations": 2,
            "impact": 1
          }
        },
        {
          "id": "c",
          "label": "Improve marketing for a small business or nonprofit.",
          "weights": {
            "business": 3,
            "operations": 2,
            "impact": 1
          }
        },
        {
          "id": "d",
          "label": "Keep journalists’ sources and communications secure.",
          "weights": {
            "security": 3,
            "software": 2,
            "operations": 1
          }
        },
        {
          "id": "e",
          "label": "Analyze climate data to predict environmental changes.",
          "weights": {
            "analysis": 3,
            "ai": 2,
            "spatial": 1
          }
        },
        {
          "id": "f",
          "label": "Use AI to make museums more accessible to visitors.",
          "weights": {
            "impact": 3,
            "software": 2,
            "analysis": 1
          }
        }
      ]
    },
    {
      "id": "trail",
      "title": "What impact would you like to have?",
      "context": "Think about what you’d like your work to improve.",
      "choices": [
        {
          "id": "a",
          "label": "Understand climate, cities, or communities through maps.",
          "weights": {
            "spatial": 3,
            "analysis": 2,
            "security": 1
          }
        },
        {
          "id": "b",
          "label": "Keep people’s accounts and information safe.",
          "weights": {
            "security": 3,
            "software": 2,
            "analysis": 1
          }
        },
        {
          "id": "c",
          "label": "Make AI predictions more accurate.",
          "weights": {
            "ai": 3,
            "analysis": 2,
            "security": 1
          }
        },
        {
          "id": "d",
          "label": "Help organizations make better decisions.",
          "weights": {
            "business": 2,
            "operations": 2,
            "impact": 2
          }
        },
        {
          "id": "e",
          "label": "Apply AI to a field I care about.",
          "weights": {
            "impact": 3,
            "business": 2,
            "spatial": 1
          }
        },
        {
          "id": "f",
          "label": "Make services run smoothly and reliably.",
          "weights": {
            "operations": 3,
            "security": 2,
            "software": 1
          }
        }
      ]
    }
  ];
  const selectionLimit = 3;
  const keys = axes.map(a => a.key);
  const clamp = n => Math.min(5, Math.max(0, n));
  function normalizeAnswers(a) {
    if (!a || typeof a !== 'object') return null;
    if (Object.hasOwn(a, 'responses')) {
      if (!a.responses || typeof a.responses !== 'object' || Array.isArray(a.responses) || !['all', 'major', 'minor'].includes(a.scope)) return null;
      if (Object.keys(a.responses).length !== questions.length) return null;
      const responses = {};
      for (const question of questions) {
        const choices = a.responses[question.id];
        if (!Array.isArray(choices) || choices.length < 1 || choices.length > selectionLimit || new Set(choices).size !== choices.length || !choices.every(id => question.choices.some(choice => choice.id === id))) return null;
        responses[question.id] = [...choices];
      }
      return { responses, scope: a.scope };
    }
    const selectedGoals = Object.hasOwn(a, 'goals') ? a.goals : [a.goal];
    const selectedApproaches = Object.hasOwn(a, 'approaches') ? a.approaches : [a.approach];
    const uniqueKnown = (items, allowed, minimum) => Array.isArray(items) && items.length >= minimum && items.length <= allowed.length && new Set(items).size === items.length && items.every(k => allowed.includes(k));
    if (!uniqueKnown(selectedGoals, goals.map(g => g.id), 1) || !uniqueKnown(a.topics, keys, 0) || !uniqueKnown(selectedApproaches, Object.keys(approaches), 1) || !['all', 'major', 'minor'].includes(a.scope)) return null;
    return { goals: [...selectedGoals], topics: [...a.topics], approaches: [...selectedApproaches], scope: a.scope };
  }
  function validAnswers(a) {
    const answers = normalizeAnswers(a);
    return !!answers && (!!answers.responses || [answers.goals, answers.topics, answers.approaches].every(items => items.length <= selectionLimit));
  }
  function studentProfile(input) {
    const answers = normalizeAnswers(input);
    if (!answers) throw new Error('Incomplete questionnaire answers.');
    if (answers.responses) {
      const signals = Object.fromEntries(keys.map(k => [k, 0]));
      for (const question of questions) {
        const selected = answers.responses[question.id].map(id => question.choices.find(choice => choice.id === id));
        keys.forEach(k => { signals[k] += selected.reduce((sum, choice) => sum + (choice.weights[k] || 0), 0) / selected.length; });
      }
      return Object.fromEntries(keys.map(k => [k, Math.round(clamp(1 + 4 * signals[k] / (3 * questions.length)) * 2) / 2]));
    }
    const selectedGoals = answers.goals.map(id => goals.find(g => g.id === id));
    const primary = new Set(selectedGoals.map(g => g.primary));
    const values = Object.fromEntries(keys.map(k => [k, primary.has(k) ? 5 : 1 + selectedGoals.filter(g => g.support.includes(k)).length / selectedGoals.length]));
    answers.topics.forEach(k => { values[k] += 1.5; });
    keys.forEach(k => { values[k] += answers.approaches.reduce((sum, id) => sum + (approaches[id][k] || 0), 0) / answers.approaches.length; });
    return Object.fromEntries(keys.map(k => [k, clamp(values[k])]));
  }
  function validProfile(values) {
    return !!values && keys.every(k => typeof values[k] === 'number' && Number.isFinite(values[k]) && values[k] >= 0 && values[k] <= 5);
  }
  // Editorial calibration from the approved reference charts, separate from degree requirements.
  const profileCalibration = {
    'cs-cyber': { values: { ai: 2.5 } },
    'ds-artificial-intelligence': { values: { analysis: 5, ai: 5 }, convex: true },
    'business-analytics-data-science': { values: { analysis: 3.5, impact: 3 }, convex: true },
    'business-analytics-supply-chain': { convex: true, overrides: { spatial: 1 } }
  };
  function convexProfile(values) {
    if (!validProfile(values)) throw new Error('Interest dimensions must be between zero and five.');
    const epsilon = 1e-9;
    const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
    const minus = (a, b) => [a[0] - b[0], a[1] - b[1]];
    const rays = keys.map((key, i) => { const angle = Math.PI / 2 - i * Math.PI / 4; return [Math.cos(angle), Math.sin(angle)]; });
    const points = rays.map((ray, i) => ray.map(n => n * values[keys[i]]))
      .sort((a, b) => a[0] - b[0] || a[1] - b[1])
      .filter((point, i, all) => !i || Math.abs(point[0] - all[i - 1][0]) > epsilon || Math.abs(point[1] - all[i - 1][1]) > epsilon);
    const chain = items => {
      const out = [];
      for (const point of items) {
        while (out.length >= 2 && cross(minus(out[out.length - 1], out[out.length - 2]), minus(point, out[out.length - 1])) <= epsilon) out.pop();
        out.push(point);
      }
      return out;
    };
    const hull = points.length < 3 ? points : [...chain(points).slice(0, -1), ...chain([...points].reverse()).slice(0, -1)];
    // Sample the envelope on every axis so the rendered outline and scoring use identical values.
    return Object.fromEntries(rays.map((ray, i) => {
      let reach = 0;
      for (let j = 0; j < hull.length; j++) {
        const a = hull[j], b = hull[(j + 1) % hull.length], edge = minus(b, a);
        const denominator = cross(ray, edge);
        if (Math.abs(denominator) <= epsilon) {
          if (Math.abs(cross(ray, a)) <= epsilon) reach = Math.max(reach, a[0] * ray[0] + a[1] * ray[1], b[0] * ray[0] + b[1] * ray[1]);
          continue;
        }
        const distance = cross(a, edge) / denominator, position = cross(a, ray) / denominator;
        if (distance >= -epsilon && position >= -epsilon && position <= 1 + epsilon) reach = Math.max(reach, distance);
      }
      return [keys[i], clamp(Math.round(reach * 1e10) / 1e10)];
    }));
  }
  function programProfiles(programs) {
    const max = Object.fromEntries(keys.map(k => [k, Math.max(1, ...programs.map(p => p.tags[k] || 0))]));
    return Object.fromEntries(programs.map(p => {
      const calibration = profileCalibration[p.id];
      const values = { ...Object.fromEntries(keys.map(k => [k, clamp((p.tags[k] || 0) / max[k] * 5)])), ...calibration?.values };
      // Axis overrides follow outline sampling so geometry cannot inflate a calibrated interest.
      return [p.id, { ...(calibration?.convex ? convexProfile(values) : values), ...calibration?.overrides }];
    }));
  }
  function similarity(left, right) {
    if (!validProfile(left) || !validProfile(right)) throw new Error('Interest dimensions must be between zero and five.');
    const rms = Math.sqrt(keys.reduce((sum, k) => sum + (left[k] - right[k]) ** 2, 0) / keys.length);
    return Math.max(0, Math.min(100, 100 * (1 - rms / 5)));
  }
  function rank(programs, profile, profiles, scope = 'all') {
    return programs.filter(p => scope === 'all' || p.kind === scope).map(p => ({ program: p, score: similarity(profile, profiles[p.id]) })).sort((a, b) => b.score - a.score || a.program.id.localeCompare(b.program.id));
  }
  return { axes, questions, goals, approaches, selectionLimit, normalizeAnswers, validAnswers, validProfile, studentProfile, convexProfile, programProfiles, similarity, rank };
});
