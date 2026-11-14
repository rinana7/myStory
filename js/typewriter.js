/* Typewriter effect.
   Typed text is shown in an aria-hidden span; the full sentence is also in the page (visually hidden)
   so screen readers read it once, complete, instead of letter by letter.
   Typing only advances while isPlaying() is true, so a paused story pauses its typing too. */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function make(opts) {
    opts = opts || {};
    var isPlaying = opts.isPlaying || function () { return true; };
    var items = [];
    var raf = 0;
    var last = 0;

    function finish(item) {
      item.done = true;
      item.textEl.textContent = item.text;
      if (item.cursor && item.cursor.parentNode && !item.keepCursor) item.cursor.remove();
      if (item.onDone) item.onDone();
    }

    function add(el, text, o) {
      o = o || {};
      var textEl = document.createElement('span');
      textEl.className = 'tw-text';
      textEl.setAttribute('aria-hidden', 'true');
      var cursor = document.createElement('span');
      cursor.className = 'tw-cursor';
      cursor.setAttribute('aria-hidden', 'true');
      var full = document.createElement('span');
      full.className = 'sr-only';
      full.textContent = text;
      el.replaceChildren(textEl, cursor, full);

      var item = {
        el: el, text: text, textEl: textEl, cursor: cursor,
        delay: o.delay || 0, cps: o.cps || 40, t: 0, shown: 0, done: false,
        keepCursor: !!o.keepCursor, onDone: o.onDone || null
      };
      if (reduceMotion) { finish(item); return item; }
      cursor.style.visibility = 'hidden';   // appears when typing starts
      items.push(item);
      start();
      return item;
    }

    function start() { if (!raf) { last = 0; raf = requestAnimationFrame(loop); } }

    function loop(ts) {
      raf = 0;
      var dt = last ? ts - last : 0;
      last = ts;
      if (isPlaying()) {
        var anyActive = false;
        items.forEach(function (it) {
          if (it.done) return;
          it.t += dt;
          if (it.t < it.delay) { anyActive = true; return; }
          it.cursor.style.visibility = 'visible';
          var n = Math.min(it.text.length, Math.floor((it.t - it.delay) / 1000 * it.cps));
          if (n !== it.shown) { it.shown = n; it.textEl.textContent = it.text.slice(0, n); }
          if (n >= it.text.length) finish(it); else anyActive = true;
        });
        items = items.filter(function (it) { return !it.done; });
        if (!anyActive) return;
      } else if (!items.length) {
        return;
      }
      raf = requestAnimationFrame(loop);
    }

    function finishAll() {
      // finishing one item can add the next (onDone chains), so keep going until nothing is left
      var guard = 0;
      while (items.length && guard++ < 50) {
        var batch = items;
        items = [];
        batch.forEach(finish);
      }
    }

    function clear() { items = []; }

    function destroy() { items = []; if (raf) cancelAnimationFrame(raf); raf = 0; }

    return { add: add, finishAll: finishAll, clear: clear, destroy: destroy };
  }

  window.Typewriter = { make: make };
})();
