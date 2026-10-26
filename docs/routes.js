/* Static hash routes work under any GitHub Pages project path. */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.EXPLORER_ROUTES = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  function parse(hash, programIds, questionCount = 4) {
    if (hash === '#explore') return { kind: 'explore' };
    if (hash === '#guide' || hash === '#guide/1') return { kind: 'guide', step: 0 };
    const question = /^#guide\/(\d+)$/.exec(hash);
    if (question && +question[1] > 0 && +question[1] <= questionCount) return { kind: 'guide', step: +question[1] - 1 };
    if (hash.startsWith('#path/')) {
      try { const id = decodeURIComponent(hash.slice(6)); if (programIds.includes(id)) return { kind: 'path', id }; } catch (_) {}
    }
    if (hash.startsWith('#guide')) return { kind: 'guide', step: 0 };
    if (hash.startsWith('#path/')) return { kind: 'explore' };
    return { kind: 'entry' };
  }
  return { parse };
});
