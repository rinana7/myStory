/* Written with help from an SI tool (Claude, by Anthropic). */
/* Stamps: finishing a robot's story earns its postage stamp. It is stamped onto the book page with a
   slam-down animation and a postmark. Earned stamps are remembered for this visit only (sessionStorage). */

(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var KEY = 'myStoryStamps';
  var earned = {};
  var uid = 0;

  try {
    var raw = window.sessionStorage.getItem(KEY);
    if (raw) earned = JSON.parse(raw) || {};
  } catch (e) { earned = {}; }

  function save() {
    try { window.sessionStorage.setItem(KEY, JSON.stringify(earned)); } catch (e) { /* private mode: fine */ }
  }

  function svg(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  function div(cls) { var d = document.createElement('div'); d.className = cls; return d; }

  /* A postage stamp: the artwork on a paper margin with perforated (scalloped) edges, all drawn in an SVG. */
  function build(m, opts) {
    opts = opts || {};
    var st = m.stamp;
    var pad = 18, W = st.w + pad * 2, H = st.h + pad * 2;
    var id = 'stm' + (++uid);

    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'stamp-svg' + (opts.ghost ? ' ghost' : ''), focusable: 'false' });
    if (opts.ghost || opts.decorative) root.setAttribute('aria-hidden', 'true');
    else { root.setAttribute('role', 'img'); root.setAttribute('aria-label', st.alt); }

    var defs = svg('defs');
    var mask = svg('mask', { id: id, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H });
    mask.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff' }));
    var r = 5.2, step = 17;
    var nx = Math.round(W / step), ny = Math.round(H / step);
    for (var i = 0; i < nx; i++) {
      var cx = (i + 0.5) * (W / nx);
      mask.appendChild(svg('circle', { cx: cx, cy: 0, r: r, fill: '#000' }));
      mask.appendChild(svg('circle', { cx: cx, cy: H, r: r, fill: '#000' }));
    }
    for (var j = 0; j < ny; j++) {
      var cy = (j + 0.5) * (H / ny);
      mask.appendChild(svg('circle', { cx: 0, cy: cy, r: r, fill: '#000' }));
      mask.appendChild(svg('circle', { cx: W, cy: cy, r: r, fill: '#000' }));
    }
    defs.appendChild(mask);
    root.appendChild(defs);

    root.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, fill: '#f6ecdc', mask: 'url(#' + id + ')' }));
    var image = svg('image', { x: pad, y: pad, width: st.w, height: st.h, preserveAspectRatio: 'xMidYMid slice' });
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', st.file);
    image.setAttribute('href', st.file);
    root.appendChild(image);
    root.appendChild(svg('rect', { x: pad - .5, y: pad - .5, width: st.w + 1, height: st.h + 1, fill: 'none', stroke: 'rgba(60,30,12,.35)', 'stroke-width': 1 }));
    return root;
  }

  function postmark() {
    var id = 'pm' + (++uid);
    var s = svg('svg', { viewBox: '0 0 120 120', class: 'postmark', 'aria-hidden': 'true', focusable: 'false' });
    s.appendChild(svg('circle', { cx: 60, cy: 60, r: 55, fill: 'none', stroke: 'currentColor', 'stroke-width': 3 }));
    s.appendChild(svg('circle', { cx: 60, cy: 60, r: 47, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.4 }));
    s.appendChild(svg('path', { id: id, d: 'M 60,60 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0', fill: 'none' }));
    var t = svg('text', { 'font-size': 11, 'letter-spacing': 2.2, fill: 'currentColor', 'font-weight': 700 });
    var tp = svg('textPath', { startOffset: 0 });
    tp.setAttribute('href', '#' + id);
    tp.textContent = 'MISSION LOG COMPLETE · MISSION LOG COMPLETE ·';
    t.appendChild(tp);
    s.appendChild(t);
    s.appendChild(svg('path', { d: 'M 42 62 L 55 75 L 80 46', fill: 'none', stroke: 'currentColor', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    return s;
  }

  /* Put a machine's stamp on a book page. With animate=true it slams down like a rubber stamp. */
  function place(pageEl, m, animate) {
    if (!m.stamp) return null;
    var old = pageEl.querySelector('.stamp-slot');
    if (old) old.remove();

    var slot = div('stamp-slot');
    var wrap = div('stamp-wrap');
    wrap.appendChild(build(m));
    var pm = postmark();
    wrap.appendChild(pm);
    slot.appendChild(wrap);
    pageEl.insertBefore(slot, pageEl.firstChild);
    pageEl.classList.add('stamped');

    if (!animate || reduceMotion || !wrap.animate) return slot;

    var ring = div('stamp-ring');
    slot.appendChild(ring);
    wrap.style.opacity = 0;
    pm.style.opacity = 0;
    ring.style.opacity = 0;

    var drop = wrap.animate([
      { opacity: 0, transform: 'translateY(-80px) scale(2.8) rotate(-16deg)', filter: 'drop-shadow(0 55px 30px rgba(0,0,0,.55))', offset: 0 },
      { opacity: 1, transform: 'translateY(0) scale(.92) rotate(0deg)', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.5))', offset: .62 },
      { opacity: 1, transform: 'translateY(0) scale(1.05) rotate(0deg)', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,.45))', offset: .8 },
      { opacity: 1, transform: 'translateY(0) scale(1) rotate(0deg)', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.4))', offset: 1 }
    ], { duration: 720, easing: 'cubic-bezier(.3,.7,.25,1)', fill: 'forwards' });

    // the moment of impact
    setTimeout(function () {
      if (ring.animate) ring.animate([{ opacity: .85, transform: 'scale(.55)' }, { opacity: 0, transform: 'scale(2)' }], { duration: 560, easing: 'ease-out', fill: 'forwards' });
      if (pageEl.animate) pageEl.animate([
        { transform: 'translate(0,0)' }, { transform: 'translate(-2px,2px)' }, { transform: 'translate(2px,-1px)' }, { transform: 'translate(-1px,0)' }, { transform: 'translate(0,0)' }
      ], { duration: 200 });
      if (navigator.vibrate) { try { navigator.vibrate([22, 40, 12]); } catch (e) { /* not allowed: fine */ } }
      setTimeout(function () {
        pm.animate([{ opacity: 0, transform: 'scale(1.6) rotate(-22deg)' }, { opacity: .88, transform: 'scale(1) rotate(-12deg)' }],
          { duration: 280, easing: 'ease-out', fill: 'forwards' });
      }, 150);
    }, 720 * .62);

    drop.finished.then(function () {
      wrap.style.opacity = 1;
    }).catch(function () { /* cancelled */ });
    return slot;
  }

  /* Click a stamp in the collection: it grows to full size over a dimmed page. */
  function openLightbox(m, opener) {
    if (document.querySelector('.stamp-lightbox')) return;
    var isEarned = !!earned[m.id];
    var app = document.getElementById('app');

    var box = div('stamp-lightbox');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', m.name + ' stamp');

    var inner = div('stamp-lb-inner');
    var big = div('stamp-lb-stamp' + (isEarned ? '' : ' unearned'));
    big.appendChild(build(m, { ghost: !isEarned }));
    if (isEarned) big.appendChild(postmark());
    inner.appendChild(big);

    var title = document.createElement('h2');
    title.className = 'stamp-lb-title';
    title.textContent = m.name;
    inner.appendChild(title);

    var msg = document.createElement('p');
    msg.className = 'stamp-lb-msg';
    msg.textContent = isEarned
      ? 'Stamp earned. You watched this robot\u2019s story to the end.'
      : 'Not yet earned. Watch this robot\u2019s story to the end to stamp it.';
    inner.appendChild(msg);

    var note = document.createElement('p');
    note.className = 'm-note';
    note.textContent = 'Stylized SI-generated art, not a technical drawing of the real hardware.';
    inner.appendChild(note);

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'stamp-lb-close';
    close.textContent = 'Close';
    inner.appendChild(close);
    box.appendChild(inner);

    function shut() {
      document.removeEventListener('keydown', onKey, true);
      app.inert = false;
      var done = function () { box.remove(); if (opener && opener.focus) opener.focus({ preventScroll: true }); };
      if (!reduceMotion && box.animate) box.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' }).finished.then(done);
      else done();
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); shut(); }
      else if (e.key === 'Tab') { e.preventDefault(); close.focus(); }   // only one control, keep focus in the dialog
      else if (e.key.indexOf('Arrow') === 0) { e.stopPropagation(); }       // arrows must not turn the book behind it
    }
    close.addEventListener('click', shut);
    box.addEventListener('click', function (e) { if (e.target === box || e.target === inner) shut(); });
    document.addEventListener('keydown', onKey, true);

    document.body.appendChild(box);
    app.inert = true;
    close.focus({ preventScroll: true });

    if (!reduceMotion && box.animate) {
      box.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, fill: 'backwards' });
      big.animate([
        { opacity: 0, transform: 'scale(.4) rotate(-10deg)', offset: 0 },
        { opacity: 1, transform: 'scale(1.05) rotate(1.5deg)', offset: .7 },
        { opacity: 1, transform: 'scale(1) rotate(-1.5deg)', offset: 1 }
      ], { duration: 460, easing: 'cubic-bezier(.2,.8,.25,1)', fill: 'backwards' });
    }
  }

  /* The collection shown on the last page: earned stamps in colour, the rest as ghosts. */
  function collection(machines) {
    var box = div('stamp-collection');
    var withStamp = machines.filter(function (m) { return m.stamp; });
    var count = withStamp.filter(function (m) { return earned[m.id]; }).length;

    var head = document.createElement('b');
    head.className = 'm-head';
    head.textContent = 'Your stamps';
    box.appendChild(head);

    var line = document.createElement('p');
    line.className = 'stamp-count';
    line.textContent = count === withStamp.length
      ? 'All ' + count + ' stamps earned. Mission log complete.'
      : count + ' of ' + withStamp.length + ' stamps earned. Watch a robot’s story to the end to earn its stamp.';
    box.appendChild(line);

    var grid = div('stamp-grid');
    withStamp.forEach(function (m) {
      var cell = div('stamp-cell' + (earned[m.id] ? ' earned' : ''));
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'stamp-btn';
      btn.setAttribute('aria-label', earned[m.id] ? 'Enlarge the ' + m.name + ' stamp' : m.name + ' stamp (not yet earned)');
      if (!earned[m.id]) btn.disabled = true;
      btn.appendChild(build(m, { ghost: !earned[m.id], decorative: true }));
      btn.addEventListener('click', function () { if (earned[m.id]) openLightbox(m, btn); });
      cell.appendChild(btn);
      var cap = document.createElement('span');
      cap.className = 'stamp-cap';
      cap.textContent = m.name + (earned[m.id] ? '' : ' · not yet earned');
      cell.appendChild(cap);
      grid.appendChild(cell);
    });
    box.appendChild(grid);

    var note = document.createElement('p');
    note.className = 'm-note';
    note.textContent = 'The stamp pictures are stylized SI-generated art, not technical drawings of the real hardware.';
    box.appendChild(note);
    return box;
  }

  window.Stamps = {
    isEarned: function (id) { return !!earned[id]; },
    earn: function (id) { earned[id] = true; save(); },
    place: place,
    collection: collection
  };
})();
