'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const routes = require('../docs/routes.js');
const root = path.join(__dirname, '../docs');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const data = JSON.parse(fs.readFileSync(path.join(root, 'curriculum-data.json')));
const ids = data.programs.map(p => p.id);
function open(hash = '#explore', {saved, draft, blockStorage = false} = {}) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', e => errors.push(e));
  const dom = new JSDOM(html, {url:'https://wm-cdsp.github.io/major-explorer/' + hash, runScripts:'outside-only', virtualConsole, pretendToBeVisual:true});
  const w = dom.window;
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.URL.createObjectURL = () => 'blob:notes'; w.URL.revokeObjectURL = () => {};
  if (saved) w.localStorage.setItem('wm-which-path-v1', saved);
  if (draft) w.sessionStorage.setItem('wm-major-explorer-draft', draft);
  if (blockStorage) for (const key of ['localStorage','sessionStorage']) Object.defineProperty(w, key, {get(){throw new Error('Storage disabled');}});
  for (const file of ['curriculum.js','matching.js','routes.js','app.js']) w.eval(fs.readFileSync(path.join(root,file),'utf8'));
  const $ = q => w.document.querySelector(q);
  return {w,dom,$,errors};
}
const tick = () => new Promise(r => setTimeout(r,30));
function click(app, query){assert.ok(app.$(query), query); app.$(query).click();}
function change(app, query, value){const el=app.$(query);el.value=value;el.dispatchEvent(new app.w.Event('change',{bubbles:true}));}

test('both public entry routes bypass entry choices on fresh visits, reloads and saved visits',()=>{
  for (const hash of ['#explore','#guide']) for(const saved of [undefined,JSON.stringify({programs:['cs-general'],completed:['CSCI 141'],selectedProgram:'cs-general'})]) {
    let app=open(hash,{saved});
    assert.equal(app.$('#entry-screen').hidden,true);
    assert.equal(app.$(hash==='#guide'?'#questionnaire':'#tool').hidden,false);
    const reloaded=open(app.w.location.hash,{saved:app.w.localStorage.getItem('wm-which-path-v1'),draft:app.w.sessionStorage.getItem('wm-major-explorer-draft')});
    assert.equal(reloaded.$('#entry-screen').hidden,true);
    assert.equal(reloaded.$(hash==='#guide'?'#questionnaire':'#tool').hidden,false);
    assert.deepEqual(app.errors,[]);assert.deepEqual(reloaded.errors,[]);
    app.dom.window.close();reloaded.dom.window.close();
  }
});
test('route parser handles every original program link and invalid encodings safely',()=>{
  for(const id of ids) assert.deepEqual(routes.parse('#path/'+id,ids),{kind:'path',id});
  assert.deepEqual(routes.parse('#path/%E0%A4',ids),{kind:'explore'});
  assert.deepEqual(routes.parse('#path/missing',ids),{kind:'explore'});
  assert.deepEqual(routes.parse('#guide/99',ids),{kind:'guide',step:0});
  assert.deepEqual(routes.parse('#guide/4',ids),{kind:'guide',step:3});
});
test('all ten original major routes expose requirements and correct variants',()=>{
  for(const p of data.programs){const app=open('#path/'+p.id);
    assert.equal(app.$('#tool').hidden,false);
    assert.equal(app.$('.program-heading h2').textContent,p.title);
    assert.equal(app.w.document.querySelectorAll('.requirement-group').length,p.groups.length);
    if(app.$('#program-variant'))assert.equal(app.$('#program-variant').value,p.id);
    assert.deepEqual(app.errors,[]);app.dom.window.close();
  }
});
test('program selection and guide steps support browser Back and Forward',async()=>{
  const app=open('#explore');
  click(app,'[data-program="cs-general"]');
  assert.equal(app.w.location.hash,'#path/cs-general');
  change(app,'#program-variant','cs-cyber');assert.equal(app.w.location.hash,'#path/cs-cyber');
  app.w.history.back();await tick();assert.equal(app.$('#program-variant').value,'cs-general');
  app.w.history.back();await tick();assert.equal(app.w.location.hash,'#explore');assert.equal(app.$('#tool').hidden,false);
  app.w.history.forward();await tick();assert.equal(app.w.location.hash,'#path/cs-general');
  click(app,'#redo-questions');assert.equal(app.w.location.hash,'#guide');
  click(app,'#questionnaire input');click(app,'[data-action="next-question"]');assert.equal(app.w.location.hash,'#guide/2');
  app.w.history.back();await tick();assert.equal(app.$('#questionnaire input').checked,true);
  app.w.history.forward();await tick();assert.equal(app.w.location.hash,'#guide/2');assert.match(app.$('.quiz-top').textContent,/2 of 4/);
  assert.deepEqual(app.errors,[]);app.dom.window.close();
});
test('guide enforces selection limits, keeps draft across reload and finishes with ten ranked matches',()=>{
  let app=open('#guide');
  assert.equal(app.$('[data-action="next-question"]').disabled,true);
  const boxes=[...app.w.document.querySelectorAll('#questionnaire input')];boxes.slice(0,3).forEach(el=>el.click());assert.equal(boxes[3].disabled,true);
  boxes[1].click();assert.equal(boxes[3].disabled,false);
  click(app,'[data-action="next-question"]');
  const reload=open(app.w.location.hash,{draft:app.w.sessionStorage.getItem('wm-major-explorer-draft')});app.dom.window.close();app=reload;
  assert.match(app.$('.quiz-top').textContent,/2 of 4/);
  for(let step=1;step<4;step++){click(app,'#questionnaire input');click(app,'[data-action="next-question"]');}
  assert.equal(app.$('#tool').hidden,false);assert.equal(app.$('#interest-profile').hidden,false);
  assert.equal(app.w.document.querySelectorAll('.match-row').length,10);assert.match(app.w.location.hash,/^#path\//);
  const slider=app.$('[data-interest-axis="analysis"]');slider.value='4.5';slider.dispatchEvent(new app.w.Event('input',{bubbles:true}));
  assert.equal(app.$('[data-axis-value="analysis"]').textContent,'4.5');
  const saved=JSON.parse(app.w.localStorage.getItem('wm-which-path-v1'));assert.equal(saved.adventure.adjustedProfile.analysis,4.5);
  assert.deepEqual(app.errors,[]);app.dom.window.close();
});
test('save, completed courses, search, prerequisite lookup, optional concentrations, comparison and export work',()=>{
  const app=open('#path/ds-algorithms');
  click(app,'[data-action="save"]');click(app,'[data-complete="CSCI 141"]');
  const saved=app.w.localStorage.getItem('wm-which-path-v1');const restored=open('#explore',{saved});
  assert.equal(restored.$('[data-complete="CSCI 141"]').checked,true);assert.equal(restored.$('[data-action="save"]').getAttribute('aria-pressed'),'true');restored.dom.window.close();
  const search=app.$('#course-search');search.value='CSCI303';search.dispatchEvent(new app.w.Event('input',{bubbles:true}));
  assert.equal(app.$('#search-results').hidden,false);assert.match(app.$('#search-results').textContent,/Algorithms/);
  const detail=app.$('#search-results details');detail.open=true;assert.match(detail.textContent,/Prerequisites:/);
  click(app,'#search-results [data-lookup]');assert.match(app.$('#inline-lookup').textContent,/Prerequisites:/);
  click(app,'[data-action="compare"]');click(app,'[data-program="cs-general"]');click(app,'[data-action="compare"]');
  assert.equal(app.$('#comparison').hidden,false);assert.equal(app.w.document.querySelectorAll('.comparison-table thead th').length,3);
  click(app,'[data-program="business-analytics-data-science"]');change(app,'#optional-concentration','0');assert.ok(app.$('#optional-requirements .requirement-group'));
  const download=app.w.HTMLAnchorElement.prototype.click;let filename;app.w.HTMLAnchorElement.prototype.click=function(){filename=this.download};click(app,'#export-notes');assert.equal(filename,'wm-program-notes.txt');app.w.HTMLAnchorElement.prototype.click=download;
  assert.deepEqual(app.errors,[]);app.dom.window.close();
});
test('blocked storage, malformed storage, unknown paths and guide skip keep the tool usable',()=>{
  for(const options of [{blockStorage:true},{saved:'{',draft:'{'}])for(const hash of ['#explore','#guide','#path/unknown','#guide/99']) {
    const app=open(hash,options);assert.equal(app.$('#entry-screen').hidden,true);
    if(!app.$('#questionnaire').hidden)click(app,'[data-action="skip-questions"]');
    assert.equal(app.$('#tool').hidden,false);assert.deepEqual(app.errors,[]);app.dom.window.close();
  }
});
test('all referenced static assets exist and the source has no backend or remote script dependencies',()=>{
  const app=open();for(const el of app.w.document.querySelectorAll('script[src],link[href],img[src]')){
    const ref=(el.getAttribute('src')||el.getAttribute('href')).split('?')[0];if(ref.startsWith('http'))continue;
    assert.ok(fs.existsSync(path.join(root,ref)),ref);
  }
  assert.equal(app.w.document.querySelectorAll('script[src^="https:"]').length,0);
  assert.equal(ids.length,10);assert.equal(Object.keys(data.courses).length,210);app.dom.window.close();
});

test('keyboard skip links keep the direct route and focus the visible content',()=>{
  for(const hash of ['#explore','#guide']){const app=open(hash);click(app,'a.skip');assert.equal(app.w.location.hash,hash);assert.equal(app.w.document.activeElement.id,hash==='#guide'?'quiz-title':'program-detail');assert.equal(app.$('#entry-screen').hidden,true);app.dom.window.close();}
});
