'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const model = require('../docs/matching.js');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/curriculum-data.json'), 'utf8'));
const profiles = model.programProfiles(data.programs);
const answer = (goal, approach = 'open', scope = 'all') => ({ goals: [goal], approaches: [approach], scope, topics: [] });

test('similarity is bounded, symmetric and gives exact profiles 100', () => {
  const zero = Object.fromEntries(model.axes.map(a => [a.key, 0]));
  const five = Object.fromEntries(model.axes.map(a => [a.key, 5]));
  assert.equal(model.similarity(zero, zero), 100);
  assert.equal(model.similarity(five, zero), 0);
  assert.equal(model.similarity(zero, five), model.similarity(five, zero));
  assert.throws(() => model.similarity({ ...five, ai: 6 }, zero));
});
test('reference profiles share the revised axes and use the approved emphasis values', () => {
  assert.deepEqual(model.axes.map(a => a.key), ['analysis', 'ai', 'software', 'security', 'operations', 'spatial', 'business', 'impact']);
  assert.equal(profiles['cs-cyber'].ai, 2.5);
  assert.equal(profiles['ds-artificial-intelligence'].analysis, 5);
  assert.equal(profiles['ds-artificial-intelligence'].ai, 5);
  assert.equal(profiles['business-analytics-data-science'].analysis, 3.5);
  assert.equal(profiles['business-analytics-data-science'].impact, 3);
  for (const id of ['cs-cyber', 'ds-artificial-intelligence', 'business-analytics-data-science', 'business-analytics-supply-chain']) {
    const ranked = model.rank(data.programs, profiles[id], profiles);
    assert.equal(ranked[0].program.id, id);
    assert.equal(ranked[0].score, 100);
  }
});
test('convex outlines remove inward spikes without losing original endpoints', () => {
  const keys = model.axes.map(a => a.key);
  for (const id of ['ds-artificial-intelligence', 'business-analytics-data-science']) {
    const values = profiles[id];
    const points = keys.map((key, i) => {
      const angle = Math.PI / 2 - i * Math.PI / 4;
      return [Math.cos(angle) * values[key], Math.sin(angle) * values[key]];
    });
    const turns = points.map((a, i) => {
      const b = points[(i + 1) % points.length], c = points[(i + 2) % points.length];
      return (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    });
    assert.ok(turns.every(n => n <= 1e-8));
    const again = model.convexProfile(values);
    keys.forEach(key => assert.ok(Math.abs(again[key] - values[key]) < 1e-8));
  }
  assert.ok(profiles['ds-artificial-intelligence'].business > 0);
  assert.ok(profiles['business-analytics-data-science'].spatial > 0);
});
test('Supply Chain keeps spatial interest low after outline sampling and preserves its main strengths', () => {
  const supplyChain = profiles['business-analytics-supply-chain'];
  assert.equal(supplyChain.business, 5);
  assert.equal(supplyChain.operations, 5);
  assert.equal(supplyChain.spatial, 1);
  assert.ok(supplyChain.spatial < profiles['business-analytics-data-science'].spatial);
  assert.ok(model.convexProfile(supplyChain).spatial > supplyChain.spatial);
  assert.ok(model.axes.every(({key}) => supplyChain[key] > 0));
  assert.ok(supplyChain.analysis < profiles['business-analytics-data-science'].analysis);
  assert.ok(supplyChain.impact < profiles['business-analytics-data-science'].impact);
});
test('convex profile sampling handles zero, full-scale and single-axis profiles', () => {
  const zero = Object.fromEntries(model.axes.map(a => [a.key, 0]));
  const five = Object.fromEntries(model.axes.map(a => [a.key, 5]));
  const single = { ...zero, spatial: 2 };
  assert.deepEqual(model.convexProfile(zero), zero);
  assert.deepEqual(model.convexProfile(five), five);
  assert.deepEqual(model.convexProfile(single), single);
  assert.throws(() => model.convexProfile({ ...zero, ai: -1 }));
});
test('every curriculum route has eight finite dimensions and remains rankable', () => {
  assert.equal(Object.keys(profiles).length, 10);
  for (const p of Object.values(profiles)) assert.ok(model.validProfile(p));
  for (const goal of model.goals) for (const approach of Object.keys(model.approaches)) {
    const student = model.studentProfile(answer(goal.id, approach));
    assert.ok(model.validProfile(student));
    const ranked = model.rank(data.programs, student, profiles);
    assert.equal(new Set(ranked.map(r => r.program.id)).size, 10);
    ranked.forEach((r, i) => { assert.ok(r.score >= 0 && r.score <= 100); if (i) assert.ok(ranked[i - 1].score >= r.score); });
  }
});
test('published routes are majors only and legacy minor profiles keep their interest scores', () => {
  assert.equal(data.programs.length, 10);
  assert.ok(data.programs.every(p => p.kind === 'major' && p.degree !== 'Minor'));
  assert.deepEqual([...new Set(data.programs.map(p => p.family))].sort(), ['aai', 'business', 'cs', 'ds']);
  const student = model.studentProfile(answer('ai', 'models', 'minor'));
  assert.deepEqual(student, model.studentProfile(answer('ai', 'models', 'major')));
  assert.equal(model.rank(data.programs, student, profiles, 'minor').length, 0);
  assert.equal(model.rank(data.programs, student, profiles, 'major').length, 10);
});
test('distinct ambitions produce the expected curriculum families', () => {
  for (const [goal, approach, expected] of [
    ['spatial', 'models', 'ds-spatial-data-analytics'],
    ['security', 'engineering', 'cs-cyber'],
    ['security', 'applied', 'cs-cyber'],
    ['applied-ai', 'applied', 'applied-artificial-intelligence'],
    ['operations', 'applied', 'business-analytics-supply-chain']
  ]) {
    assert.equal(model.rank(data.programs, model.studentProfile(answer(goal, approach)), profiles, 'major')[0].program.id, expected);
  }
});
test('additional interests influence their dimensions and invalid answers are rejected', () => {
  const base = answer('analysis', 'open');
  const before = model.studentProfile(base);
  const after = model.studentProfile({ ...base, topics: ['security', 'spatial'] });
  assert.ok(after.security > before.security && after.spatial > before.spatial);
  assert.ok(!model.validAnswers({ ...base, topics: ['security', 'security'] }));
  assert.ok(model.validAnswers({ ...base, topics: ['security', 'spatial', 'ai'] }));
  assert.ok(!model.validAnswers({ ...base, topics: ['unknown'] }));
  assert.ok(!model.validAnswers({ ...base, goals: ['unknown'] }));
  assert.ok(!model.validAnswers({ ...base, approaches: ['constructor'] }));
});

test('three selected interests retain each primary dimension', () => {
  const answers = { goals: ['analysis', 'software', 'business'], topics: ['spatial', 'security', 'ai'], approaches: ['applied', 'engineering'], scope: 'all' };
  assert.ok(model.validAnswers(answers));
  const student = model.studentProfile(answers);
  assert.equal(student.analysis, 5);
  assert.equal(student.software, 5);
  assert.equal(student.business, 5);
  assert.ok(student.spatial > 1 && student.security > 1 && student.ai > 1);
  assert.ok(model.validProfile(student));
  const reverse = { ...answers, goals: [...answers.goals].reverse(), topics: [...answers.topics].reverse(), approaches: [...answers.approaches].reverse() };
  assert.deepEqual(student, model.studentProfile(reverse));
  assert.notDeepEqual(student, model.studentProfile(answer('analysis', 'applied')));
});
test('approach weights are blended rather than stacked', () => {
  const before = model.studentProfile(answer('spatial', 'applied'));
  const both = model.studentProfile({ ...answer('spatial'), approaches: ['applied', 'models'] });
  assert.equal(both.impact, 2);
  assert.ok(both.impact < before.impact && both.ai > before.ai);
  const broad = { goals: ['analysis', 'software', 'business'], topics: ['spatial', 'security', 'ai'], approaches: ['applied', 'models', 'engineering'], scope: 'all' };
  assert.ok(model.validAnswers(broad));
  assert.ok(model.validProfile(model.studentProfile(broad)));
});
test('each checkbox question allows three choices and rejects a fourth', () => {
  const base = answer('analysis');
  for (const [key, choices] of [
    ['goals', ['analysis', 'software', 'business', 'spatial']],
    ['topics', ['ai', 'security', 'spatial', 'impact']],
    ['approaches', ['applied', 'models', 'engineering', 'open']]
  ]) {
    for (const count of [1, 2, 3]) assert.ok(model.validAnswers({ ...base, [key]: choices.slice(0, count) }));
    assert.equal(model.validAnswers({ ...base, [key]: choices }), false);
  }
  assert.ok(model.validAnswers({ ...base, topics: [] }));
});
test('older saved profiles remain readable until the student narrows their selections', () => {
  const saved = { goals: model.goals.map(g => g.id), topics: model.axes.map(a => a.key), approaches: Object.keys(model.approaches), scope: 'all' };
  assert.deepEqual(model.normalizeAnswers(saved), saved);
  assert.ok(Object.values(model.studentProfile(saved)).every(n => n === 5));
  assert.equal(model.validAnswers(saved), false);
});
test('legacy single-choice answers migrate without changing their profile', () => {
  const legacy = { goal: 'analysis', topics: ['spatial'], approach: 'models', scope: 'major' };
  const normalized = model.normalizeAnswers(legacy);
  assert.deepEqual(normalized, { goals: ['analysis'], topics: ['spatial'], approaches: ['models'], scope: 'major' });
  assert.deepEqual(model.studentProfile(legacy), model.studentProfile(normalized));
  normalized.topics.push('security');
  assert.deepEqual(legacy.topics, ['spatial']);
  assert.deepEqual(model.studentProfile({ goal: 'analysis', topics: [], approach: 'open', scope: 'all' }), { analysis: 5, ai: 2.5, software: 1.5, security: 1, operations: 1, business: 1, spatial: 1, impact: 2.5 });
});
test('required multi-selections reject empty, duplicate and unknown values', () => {
  const base = answer('analysis');
  for (const invalid of [{ goals: [] }, { goals: ['analysis', 'analysis'] }, { goals: ['unknown'] }, { approaches: [] }, { approaches: ['applied', 'applied'] }, { approaches: ['unknown'] }]) {
    assert.equal(model.normalizeAnswers({ ...base, ...invalid }), null);
    assert.throws(() => model.studentProfile({ ...base, ...invalid }));
  }
});

const scenarioAnswer = (choices = model.questions.map(() => ['a'])) => ({
  responses: Object.fromEntries(model.questions.map((question, i) => [question.id, [...choices[i]]])), scope: 'all'
});

test('the scenario guide has at most five questions and each response combines several signals', () => {
  assert.ok(model.questions.length > 0 && model.questions.length <= 5);
  assert.equal(new Set(model.questions.map(q => q.id)).size, model.questions.length);
  for (const question of model.questions) {
    assert.equal(new Set(question.choices.map(c => c.id)).size, question.choices.length);
    for (const choice of question.choices) {
      assert.ok(Object.keys(choice.weights).length >= 3);
      assert.ok(Object.entries(choice.weights).every(([key, weight]) => model.axes.some(a => a.key === key) && weight > 0 && weight <= 3));
      assert.equal(Object.values(choice.weights).reduce((sum, weight) => sum + weight, 0), 6);
    }
  }
});
test('every complete single-response combination produces valid profiles and ten finite major matches', () => {
  const total = model.questions.reduce((n, q) => n * q.choices.length, 1);
  for (let combination = 0; combination < total; combination++) {
    let remainder = combination;
    const choices = model.questions.map(question => {
      const choice = question.choices[remainder % question.choices.length].id;
      remainder = Math.floor(remainder / question.choices.length);
      return [choice];
    });
    const answers = scenarioAnswer(choices);
    assert.ok(model.validAnswers(answers));
    const student = model.studentProfile(answers);
    assert.ok(model.validProfile(student));
    assert.ok(Object.values(student).every(n => n >= 1 && Number.isInteger(n * 2)));
    const ranked = model.rank(data.programs, student, profiles);
    assert.equal(ranked.length, 10);
    assert.ok(ranked.every(r => Number.isFinite(r.score) && r.score >= 0 && r.score <= 100));
  }
});
test('different scenario response patterns lead to distinct curriculum routes', () => {
  for (const [choices, expected] of [
    [['a', 'e', 'a', 'a'], 'ds-spatial-data-analytics'],
    [['b', 'a', 'd', 'b'], 'cs-cyber'],
    [['f', 'd', 'b', 'b'], 'cs-general'],
    [['b', 'f', 'c', 'd'], 'business-analytics-data-science'],
    [['d', 'f', 'c', 'd'], 'business-analytics-supply-chain'],
    [['d', 'f', 'a', 'f'], 'business-analytics-supply-chain'],
    [['b', 'b', 'e', 'c'], 'ds-artificial-intelligence'],
    [['e', 'c', 'f', 'e'], 'applied-artificial-intelligence']
  ]) {
    const student = model.studentProfile(scenarioAnswer(choices.map(id => [id])));
    assert.equal(model.rank(data.programs, student, profiles, 'major')[0].program.id, expected);
  }
});
test('scenario selections blend rather than stack and their order does not matter', () => {
  for (let question = 0; question < model.questions.length; question++) {
    const answers = scenarioAnswer();
    answers.responses[model.questions[question].id] = ['a', 'b', 'c'];
    const blended = model.studentProfile(answers);
    const singles = ['a', 'b', 'c'].map(id => {
      const single = scenarioAnswer(); single.responses[model.questions[question].id] = [id];
      return model.studentProfile(single);
    });
    for (const axis of model.axes) {
      assert.ok(blended[axis.key] >= Math.min(...singles.map(p => p[axis.key])) && blended[axis.key] <= Math.max(...singles.map(p => p[axis.key])));
    }
    answers.responses[model.questions[question].id].reverse();
    assert.deepEqual(model.studentProfile(answers), blended);
    assert.notDeepEqual(singles[0], singles[1]);
  }
});
test('scenario validation rejects incomplete, oversized, duplicate, and unknown responses', () => {
  const first = model.questions[0].id;
  const invalid = [
    { ...scenarioAnswer(), responses: null },
    { ...scenarioAnswer(), responses: [] },
    { ...scenarioAnswer(), scope: 'unknown' }
  ];
  for (const choices of [[], ['a', 'a'], ['a', 'b', 'c', 'd'], ['unknown']]) {
    const answers = scenarioAnswer(); answers.responses[first] = choices; invalid.push(answers);
  }
  const missing = scenarioAnswer(); delete missing.responses[first]; invalid.push(missing);
  const extra = scenarioAnswer(); extra.responses.unknown = ['a']; invalid.push(extra);
  for (const answers of invalid) {
    assert.equal(model.normalizeAnswers(answers), null);
    assert.equal(model.validAnswers(answers), false);
    assert.throws(() => model.studentProfile(answers));
  }
  for (const count of [1, 2, 3]) {
    const answers = scenarioAnswer(); answers.responses[first] = ['a', 'b', 'c'].slice(0, count);
    assert.ok(model.validAnswers(answers));
  }
});
test('normalizing scenario answers copies each response array', () => {
  const original = scenarioAnswer(); const normalized = model.normalizeAnswers(original);
  assert.deepEqual(normalized, original);
  normalized.responses[model.questions[0].id].push('b');
  assert.deepEqual(original.responses[model.questions[0].id], ['a']);
});
