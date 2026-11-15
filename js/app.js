/* Written with help from an SI tool (Claude, by Anthropic). */
/* My Story: an interactive storybook.
   Reads data/machines.json and turns each machine into a spread.
   Placeholder drawings are only used if an image is missing. */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var book = document.getElementById('book');
  var cover = document.getElementById('cover');
  var glow = document.getElementById('glowPage');
  var spread = document.getElementById('spread');
  var pageLeft = document.getElementById('pageLeft');
  var pageRight = document.getElementById('pageRight');
  var controls = document.getElementById('controls');
  var prevBtn = document.getElementById('prev');
  var nextBtn = document.getElementById('next');
  var skipBtn = document.getElementById('skip');
  var counter = document.getElementById('counter');
  var statusEl = document.getElementById('status');

  var bookTyper = window.Typewriter.make();
  var machines = [];
  var intro = null;        // content of the first page (the question)
  var userAnswer = '';     // kept in memory only; never saved or sent anywhere
  var index = -1;          // -1 = cover, 0 = intro question, 1..n = machines, n+1 = credits page
  var busy = false;
  var timers = [];
  var afterStory = null;   // starts the page text once the story movie has been skipped or finished
  var revealNow = null;    // function that shows everything immediately

  /* ---------- tiny DOM helper ---------- */
  function h(tag, attrs, kids) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    (kids || []).forEach(function (kid) {
      if (kid == null) return;
      node.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
    });
    return node;
  }

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  /* ---------- data ---------- */
  function startYear(m) {
    var match = /\d{4}/.exec(m.years || '');
    return match ? parseInt(match[0], 10) : 9999;
  }

  fetch('data/machines.json?v=40')
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      machines = (data.machines || []).slice().sort(function (a, b) { return startYear(a) - startYear(b); });
      intro = data.intro || null;
    })
    .catch(function () {
      cover.querySelector('.cover-hint').textContent =
        'Could not load the stories. Serve this folder with a web server and reload.';
      cover.disabled = true;
    });

  /* ---------- placeholder illustrations ---------- */
  var PALETTES = {
    'Moon':   { sky: ['#05060d', '#1b2030'], ground: '#9097a6', ground2: '#6f7686' },
    'Mars':   { sky: ['#3a1d14', '#c98a5c'], ground: '#a24a28', ground2: '#7d3720' },
    'Asteroid belt': { sky: ['#05060d', '#232a52'], ground: '#6b6f8f', ground2: '#4a4e6b' },
    'Asteroid': { sky: ['#05060d', '#232a52'], ground: '#7a7466', ground2: '#59554a' }
  };

  function machineShape(id) {
    // very simple shapes, all positioned near (200, 190) so the zoom has a target
    if (id === 'ingenuity') {
      return '<g stroke="#e9e9e9" stroke-width="3" fill="#e9e9e9">' +
        '<line x1="140" y1="150" x2="260" y2="150"/><line x1="200" y1="150" x2="200" y2="168"/>' +
        '<rect x="188" y="168" width="24" height="16" rx="3"/>' +
        '<line x1="192" y1="184" x2="188" y2="196"/><line x1="208" y1="184" x2="212" y2="196"/></g>';
    }
    if (id === 'dawn') {
      return '<g fill="#cfd6e6"><rect x="186" y="150" width="28" height="28" rx="3"/></g>' +
        '<g fill="#3d6fb5" stroke="#cfd6e6"><rect x="110" y="156" width="70" height="16"/>' +
        '<rect x="220" y="156" width="70" height="16"/></g>';
    }
    if (id === 'near-shoemaker') {
      return '<g fill="#cfd6e6"><rect x="190" y="152" width="20" height="26" rx="2"/></g>' +
        '<g fill="#3d6fb5"><rect x="150" y="160" width="36" height="10"/><rect x="214" y="160" width="36" height="10"/></g>';
    }
    // rovers / stations: body + wheels
    return '<g fill="#d9d9d9"><rect x="165" y="172" width="70" height="22" rx="4"/>' +
      '<rect x="190" y="156" width="20" height="16" rx="2"/></g>' +
      '<g fill="#333"><circle cx="175" cy="198" r="8"/><circle cx="200" cy="198" r="8"/><circle cx="225" cy="198" r="8"/></g>';
  }

  function placeholderSVG(m) {
    var p = PALETTES[m.place] || PALETTES['Moon'];
    var uid = 'g' + m.id.replace(/[^a-z0-9]/gi, '');
    return '<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" ' +
      'aria-label="Placeholder illustration for ' + m.name.replace(/"/g, '') + '">' +
      '<defs><linearGradient id="' + uid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + p.sky[0] + '"/><stop offset="1" stop-color="' + p.sky[1] + '"/></linearGradient></defs>' +
      '<rect width="400" height="300" fill="url(#' + uid + ')"/>' +
      '<g fill="#fff" opacity=".8"><circle cx="40" cy="40" r="1.5"/><circle cx="120" cy="70" r="1"/><circle cx="330" cy="50" r="1.5"/>' +
      '<circle cx="280" cy="110" r="1"/><circle cx="70" cy="120" r="1"/><circle cx="360" cy="140" r="1"/></g>' +
      '<ellipse cx="200" cy="290" rx="320" ry="90" fill="' + p.ground2 + '"/>' +
      '<ellipse cx="220" cy="300" rx="300" ry="80" fill="' + p.ground + '"/>' +
      machineShape(m.id) +
      '</svg>';
  }

  /* ---------- page builders ---------- */
  function buildLeftMachine(m) {
    var inner = h('div', { class: 'art-inner' });
    var img = m.image || {};
    var captionText;
    if (img.file) {
      var pic = h('img', { src: img.file, alt: img.alt || '' });
      pic.style.objectPosition = img.focus || '50% 50%';
      inner.appendChild(pic);
      inner.style.transformOrigin = img.focus || '50% 50%';
      inner.style.setProperty('--zoom', img.zoom || 1.4);
      captionText = (img.kind ? img.kind + ' // ' : '') + 'Image // ' + (img.credit || 'NASA') +
        (img.nasaId ? ' // NASA ID ' + img.nasaId : '');
    } else {
      inner.style.transformOrigin = '50% 62%';   // zoom toward the machine
      inner.innerHTML = placeholderSVG(m);
      captionText = 'Placeholder illustration. A credited NASA image will go here.';
    }
    var art = h('div', { class: 'art' }, [inner]);
    var caption = h('div', { class: 'art-caption', text: captionText });
    pageLeft.replaceChildren(art, h('div', { class: 'art-frame hud-frame', 'aria-hidden': 'true' }), caption);
    return inner;
  }

  function buildRightIntro() {
    var heading = h('h2', { text: intro.title, tabindex: '-1' });
    var leadEl = h('p', { class: 'story-text' });
    var promptEl = h('p', { class: 'story-text intro-prompt' });
    var replyEl = h('p', { class: 'ask-reply-book' });
    var input = h('input', { class: 'ask-input', type: 'text', maxlength: '140', 'aria-label': intro.prompt, placeholder: 'Type your answer, then press Enter' });
    var send = h('button', { class: 'play-story intro-send', type: 'button', text: 'Send' });
    var hint = h('p', { class: 'intro-hint', text: intro.hint });
    hint.hidden = true;
    var note = h('p', { class: 'intro-note', text: intro.note });
    var after = h('div', { class: 'after' }, [h('div', { class: 'intro-row' }, [input, send]), replyEl, hint, note]);

    function submit() {
      var v = input.value.trim();
      if (!v) return;
      userAnswer = v;
      input.disabled = true; send.disabled = true;
      // the answer is shown here only; it is not stored or sent anywhere
      bookTyper.add(replyEl, '"' + v + '"  ' + intro.reply, { delay: 0, cps: 50, onDone: function () {
        hint.hidden = false;
        nextBtn.classList.add('nudge');
      } });
    }
    send.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } });

    pageRight.replaceChildren(
      h('p', { class: 'kicker', text: intro.kicker }),
      heading, leadEl, promptEl, after
    );
    return { leadEl: leadEl, promptEl: promptEl, after: after, heading: heading, manualReveal: true, spans: [] };
  }

  function buildLeftCredits() {
    return buildLeftMachine({
      id: 'end', name: 'The end',
      image: { file: 'images/apollo17/landing-site.jpg', alt: 'Wide view of the Apollo 17 landing site on the Moon: the Lunar Module, an astronaut and the rover on gray ground with tall pale hills against black sky.',
               credit: 'NASA', nasaId: 'as17-134-20435', focus: '50% 40%', zoom: 1.25 }
    });
  }

  function buildRightMachine(m) {
    var storyEl = h('p', { class: 'story-text' });

    var meta = 'Mission log // ' + [m.place, m.years].filter(Boolean).join(' · ');

    var chips = h('ul', { class: 'chips' }, (m.stats || []).map(function (s) {
      return h('li', null, [h('b', { text: s.label }), s.value]);
    }));
    var facts = h('details', null, [h('summary', { text: 'Mission data' }), chips]);

    var ending = m.ending ? h('p', { class: 'ending' }, [h('b', { text: 'How it ended: ' }), m.ending]) : null;

    var srcList = h('ul', null, (m.sources || []).map(function (s) {
      return h('li', null, [h('a', { href: s.url, target: '_blank', rel: 'noopener', text: s.label })]);
    }));
    var sources = h('div', { class: 'sources' }, [h('span', { text: 'Source pages consulted:' }), srcList]);

    var meaning = null;
    if (m.meaning) {
      var srcLabel = function (id) {
        var f = (m.sources || []).filter(function (x) { return x.id === id; })[0];
        return f ? f.label : id;
      };
      meaning = h('div', { class: 'meaning' }, [
        h('b', { class: 'm-head', text: 'What it changed' }),
        h('ul', { class: 'm-list' }, (m.meaning.changed || []).map(function (c) {
          return h('li', null, [c.text + ' ', h('span', { class: 'm-src', text: '(' + srcLabel(c.source) + ')' })]);
        })),
        h('b', { class: 'm-head voice-head', text: 'Story voice' }),
        h('p', { class: 'reflection', text: m.meaning.reflection }),
        h('p', { class: 'm-note', text: 'Written by the storyteller, not a NASA statement.' })
      ]);
    }

    var after = h('div', { class: 'after' }, [facts, ending, meaning, sources].filter(Boolean));

    var tagText = m.endingType ? 'Ending: ' + m.endingType.replace(/-/g, ' ') : null;

    var heading = h('h2', { text: m.name, tabindex: '-1' });
    var playBtn = null;
    if (m.scenes && m.scenes.length && window.Story) {
      playBtn = h('button', { class: 'play-story', type: 'button', text: '▶ Play the story' });
      playBtn.addEventListener('click', function () { openStory(m); });
    }
    pageRight.replaceChildren.apply(pageRight, [
      h('p', { class: 'kicker', text: meta }),
      heading,
      tagText ? h('span', { class: 'tag', text: tagText }) : null,
      playBtn,
      storyEl,
      after
    ].filter(Boolean));
    if (window.Stamps && m.stamp && window.Stamps.isEarned(m.id)) window.Stamps.place(pageRight, m, false);
    return { spans: [], story: { el: storyEl, text: m.story || '' }, after: after, heading: heading };
  }

  function buildRightCredits() {
    var seen = {};
    var links = [];
    machines.forEach(function (m) {
      (m.sources || []).forEach(function (s) {
        if (!seen[s.url]) { seen[s.url] = true; links.push(s); }
      });
    });
    var list = h('ul', null, links.map(function (s) {
      return h('li', null, [h('a', { href: s.url, target: '_blank', rel: 'noopener', text: s.label })]);
    }));

    var heading = h('h2', { text: 'The end, for now', tabindex: '-1' });
    pageRight.replaceChildren(
      h('p', { class: 'kicker', text: 'About this book' }),
      heading,
      h('div', { class: 'credits' }, [
        window.Stamps ? window.Stamps.collection(machines) : null,
        userAnswer ? h('p', { class: 'your-question', text: 'You asked: "' + userAnswer + '" Every robot in this book began with a question like yours.' }) : null,
        h('p', { text: 'These robots finished their work, but the places they explored are still there, and so is what they taught us.' }),
        h('p', { text: 'Not affiliated with or endorsed by NASA. NASA did not review this project and is not responsible for its accuracy.' }),
        h('p', { text: 'Each photo comes from the NASA Image and Video Library, with its credit line under the image.' }),
        h('p', { text: 'Super Intelligence (SI) disclosure: the SI tool Claude (by Anthropic) helped research NASA source pages, draft the story text, and write this site’s code. The creator chose the concept, the look and the story direction. The NASA pictures are NASA images with their credit lines. The five postage-stamp illustrations are SI-generated art and carry a visible “SI-generated art” mark. The storm scene was drawn in code.' }),
        h('p', { text: 'Source pages consulted:' }),
        list
      ].filter(Boolean))
    );
    return { spans: [], after: null, heading: heading };
  }

  /* ---------- show a page ---------- */
  function render(i) {
    clearTimers();
    revealNow = null;
    afterStory = null;

    nextBtn.classList.remove('nudge');
    var zoomEl, parts;
    var isIntro = i === 0 && !!intro;
    var machineAt = i - 1;
    if (isIntro) {
      zoomEl = buildLeftMachine({ id: 'intro', name: 'Mars panorama', image: intro.image });
      parts = buildRightIntro();
    } else if (machineAt >= 0 && machineAt < machines.length) {
      var m = machines[machineAt];
      zoomEl = buildLeftMachine(m);
      parts = buildRightMachine(m);
    } else {
      zoomEl = buildLeftCredits();
      parts = buildRightCredits();
    }

    function two(n) { return (n < 10 ? '0' : '') + n; }
    counter.textContent = isIntro ? 'Before we begin' : (machineAt < machines.length ? 'Page ' + two(i) + ' / ' + two(machines.length) : 'The end');
    prevBtn.disabled = i <= 0;
    nextBtn.disabled = i >= machines.length + 1;
    statusEl.textContent = isIntro ? intro.title : (machineAt < machines.length ? machines[machineAt].name : 'The end');

    var TYPE_DELAY = 900, TYPE_CPS = 42;
    bookTyper.clear();
    var hasStory = machineAt >= 0 && machineAt < machines.length && machines[machineAt].scenes && machines[machineAt].scenes.length && !!window.Story;
    // pages with a story movie stay quiet until the movie is skipped or finished
    if (parts.story && !hasStory) bookTyper.add(parts.story.el, parts.story.text, { delay: TYPE_DELAY, cps: TYPE_CPS });
    if (hasStory && parts.story) {
      afterStory = function () {
        afterStory = null;
        bookTyper.add(parts.story.el, parts.story.text, { delay: 400, cps: TYPE_CPS });
        var ms = 400 + parts.story.text.length / TYPE_CPS * 1000 + 500;
        later(function () { if (parts.after) parts.after.classList.add('on'); }, ms);
      };
    }
    if (isIntro) {
      // lead line types first, then the question, then the answer box appears
      bookTyper.add(parts.leadEl, intro.lead, { delay: TYPE_DELAY, cps: TYPE_CPS, onDone: function () {
        bookTyper.add(parts.promptEl, intro.prompt, { delay: 400, cps: TYPE_CPS, onDone: function () {
          parts.after.classList.add('on');
        } });
      } });
    }

    function showAll() {
      clearTimers();
      if (afterStory) { var f = afterStory; afterStory = null; bookTyper.add(parts.story.el, parts.story.text, { delay: 0, cps: TYPE_CPS }); }
      bookTyper.finishAll();
      if (parts.after) parts.after.classList.add('on');
    }
    revealNow = showAll;

    if (reduceMotion) { showAll(); return parts; }

    // 1) slow zoom toward the image
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { zoomEl.classList.add('zoomed'); });
    });
    if (hasStory) {
      // 2) the story movie starts first; the page text follows when it is skipped or finished
      var storyMachine = machines[machineAt];
      later(function () { openStory(storyMachine); }, 1800);
    } else if (!parts.manualReveal) {
      // 2) tell the story line by line, 3) reveal facts
      var typingMs = TYPE_DELAY + (parts.story ? parts.story.text.length / TYPE_CPS * 1000 : 0) + 500;
      later(function () { if (parts.after) parts.after.classList.add('on'); }, typingMs);
    }
    return parts;
  }

  /* ---------- cinematic story overlay ---------- */
  function openStory(m) {
    if (!window.Story || window.Story.isActive() || busy) return;
    clearTimers();
    controls.hidden = true;
    pageLeft.inert = true;
    pageRight.inert = true;
    window.Story.open(m, {
      host: spread,
      userAnswer: userAnswer,
      onClose: function (reason, watched) {
        pageLeft.inert = false;
        pageRight.inert = false;
        controls.hidden = false;
        if (afterStory) afterStory(); else if (revealNow) revealNow();
        var hd = pageRight.querySelector('h2');
        if (hd) hd.focus({ preventScroll: true });
        // finishing a story earns its stamp, which is slammed onto the page
        if (watched && window.Stamps && m.stamp && !window.Stamps.isEarned(m.id)) {
          window.Stamps.earn(m.id);
          setTimeout(function () {
            window.Stamps.place(pageRight, m, true);
            statusEl.textContent = 'Stamp earned: ' + m.name + '. Mission log complete for this robot.';
          }, reduceMotion ? 0 : 450);
        }
      }
    });
  }

  /* ---------- navigation with a page-turn ---------- */
  var pending = 0;   // one queued page turn, so fast key presses aren't lost
  var FLIP_MS = 1050;

  function isNarrow() { return window.matchMedia('(max-width: 760px)').matches; }

  // a frozen, non-interactive copy of a page, used as the face of the turning leaf
  function pageCopy(src) {
    var c = src.cloneNode(true);
    c.removeAttribute('id');
    c.removeAttribute('tabindex');
    c.querySelectorAll('[id]').forEach(function (n) { n.removeAttribute('id'); });
    c.setAttribute('aria-hidden', 'true');
    c.inert = true;
    c.style.cssText += ';position:absolute;inset:0;width:100%;height:100%;margin:0;transform:none;';
    return c;
  }

  function mk(cls, kids) {
    var d = document.createElement('div');
    d.className = cls;
    (kids || []).forEach(function (k) { d.appendChild(k); });
    return d;
  }

  function go(delta) {
    if (window.Story && window.Story.isActive()) return;
    var target = index + delta;
    if (busy) { pending = delta; return; }
    if (target < 0 || target > machines.length + 1 || !machines.length) return;
    busy = true;
    var forward = delta > 0;

    function done(parts) {
      busy = false;
      if (parts && parts.heading) parts.heading.focus({ preventScroll: true });
      if (pending) { var d = pending; pending = 0; go(d); }
    }

    // reduced motion: no animation at all
    if (reduceMotion || !spread.animate) {
      index = target;
      done(render(index));
      return;
    }

    // phones (stacked layout): a short slide instead of a spine flip
    if (isNarrow()) {
      var px = forward ? 26 : -26;
      var out = spread.animate([{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: 'translateX(' + (-px) + 'px)' }],
        { duration: 170, easing: 'ease-in', fill: 'forwards' });
      out.finished.then(function () {
        out.cancel();
        index = target;
        var parts = render(index);
        spread.animate([{ opacity: 0, transform: 'translateX(' + px + 'px)' }, { opacity: 1, transform: 'translateX(0)' }],
          { duration: 240, easing: 'ease-out', fill: 'backwards' }).finished.then(function () { done(parts); });
      });
      return;
    }

    // desktop: a real page turn. The leaf swings around the spine; its back face is the next page on the other side.
    var rightScroll = pageRight.scrollTop;
    var oldLeft = pageCopy(pageLeft), oldRight = pageCopy(pageRight);
    index = target;
    var parts = render(index);                  // the new pages are rendered underneath, ready to be revealed
    var newLeft = pageCopy(pageLeft), newRight = pageCopy(pageRight);

    var frontShade = mk('flip-shade'), backShade = mk('flip-shade');
    var frontFace = mk('flip-face', [forward ? oldRight : oldLeft, frontShade]);
    var backFace = mk('flip-face back-face', [forward ? newLeft : newRight, backShade]);
    var leaf = mk('flip-leaf ' + (forward ? 'fwd' : 'back'), [frontFace, backFace]);
    var staticOld = mk('flip-static ' + (forward ? 'left' : 'right'), [forward ? oldLeft.cloneNode(true) : oldRight.cloneNode(true)]);
    var cast = mk('flip-cast ' + (forward ? 'right' : 'left'));
    var layer = mk('flip-layer', [staticOld, cast, leaf]);
    spread.appendChild(layer);
    if (forward) oldRight.scrollTop = rightScroll; else staticOld.firstChild.scrollTop = rightScroll;

    var angle = forward ? -180 : 180;
    var turn = leaf.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(' + angle + 'deg)' }],
      { duration: FLIP_MS, easing: 'cubic-bezier(.62,.02,.35,1)', fill: 'forwards' });
    frontShade.animate([{ opacity: 0 }, { opacity: .6, offset: .5 }, { opacity: .6 }], { duration: FLIP_MS, fill: 'forwards' });
    backShade.animate([{ opacity: .6 }, { opacity: .6, offset: .5 }, { opacity: 0 }], { duration: FLIP_MS, fill: 'forwards' });
    cast.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FLIP_MS * .9, fill: 'forwards' });

    turn.finished.then(function () {
      layer.remove();
      done(parts);
    });
  }

  function openBook() {
    if (!machines.length || index !== -1 || busy) return;
    busy = true;

    function showBook() {
      cover.hidden = true;
      glow.hidden = true;
      book.dataset.state = 'open';
      spread.hidden = false;
      controls.hidden = false;
      index = 0;
      var parts = render(0);
      busy = false;
      if (parts.heading) parts.heading.focus({ preventScroll: true });
    }

    if (reduceMotion || !cover.animate || !glow.animate) { showBook(); return; }

    // 1) the cover swings open while the screen fades to black
    var veil = document.createElement('div');
    veil.setAttribute('aria-hidden', 'true');
    veil.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:50;';
    document.body.appendChild(veil);
    veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1800, easing: 'ease-in', fill: 'forwards' });
    cover.animate(
      [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-118deg)', opacity: 1, offset: .85 }, { transform: 'rotateY(-125deg)', opacity: 0 }],
      { duration: 2000, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' }).finished.then(function () {
      // 2) from black, the book fades in
      cover.hidden = true;
      spread.hidden = false;
      controls.hidden = false;
      book.dataset.state = 'open';
      index = 0;
      var parts = render(0);
      veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1500, delay: 250, easing: 'ease-out', fill: 'forwards' }).finished.then(function () {
        veil.remove();
        busy = false;
        if (parts.heading) parts.heading.focus({ preventScroll: true });
      });
    });
  }

  /* ---------- events ---------- */
  cover.addEventListener('click', openBook);
  nextBtn.addEventListener('click', function () { go(1); });
  prevBtn.addEventListener('click', function () { go(-1); });
  skipBtn.addEventListener('click', function () { if (revealNow) revealNow(); });

  document.addEventListener('keydown', function (e) {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (document.querySelector('.stamp-lightbox')) return;
    if (e.key === 'ArrowRight') { index === -1 ? openBook() : go(1); }
    else if (e.key === 'ArrowLeft') { go(-1); }
  });

  var startX = null;
  spread.addEventListener('pointerdown', function (e) {
    startX = (e.target.closest && e.target.closest('input, button, a')) ? null : e.clientX;
  });
  spread.addEventListener('pointerup', function (e) {
    if (startX === null || (window.Story && window.Story.isActive())) { startX = null; return; }
    var dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
  });
})();
