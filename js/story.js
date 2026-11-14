/* Story player: a silent, caption-driven "video" made of scenes.
   Scenes come from machine.scenes in data/machines.json.
   Every piece of text on screen is in the page (not baked into pictures), so it is readable by screen readers. */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var state = null; // null when no story is open
  var typer = null; // typewriter for the open story

  // type `text` into element `el` after `delaySec` seconds (instant if reduced motion or no typewriter)
  function typed(el, text, delaySec, cps, keepCursor) {
    if (typer) typer.add(el, text, { delay: delaySec * 1000, cps: cps || 45, keepCursor: !!keepCursor });
    else el.textContent = text;
    return el;
  }

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

  function corners(el) {
    ['tl', 'tr', 'bl', 'br'].forEach(function (c) { el.appendChild(h('span', { class: 'corner ' + c, 'aria-hidden': 'true' })); });
    return el;
  }

  function delay(el, s) { el.style.animationDelay = s + 's'; return el; }

  function picture(img, cls) {
    var p = h('img', { class: cls || '', src: img.file, alt: img.alt || '' });
    if (img.focus) p.style.objectPosition = img.focus;
    if (img.fit === 'contain') p.style.objectFit = 'contain';
    return p;
  }

  /* ---------- scene renderers: each returns an element ---------- */

  var renderers = {
    hero: function (s) {
      var bg = h('div', { class: 'bg kenburns' }, [picture(s.image)]);
      return h('div', { class: 'st-scene sc-hero' }, [
        bg, h('div', { class: 'shade' }),
        h('div', { class: 'center' }, [
          typed(h('h2', { class: 'title huge' }), s.title, 0.3, 12),
          delay(h('p', { class: 'st-kicker fade-up', text: s.kicker }), 1.1),
          typed(h('p', { class: 'voice' }), s.text, 2.0, 40)
        ])
      ]);
    },

    numbers: function (s) {
      // the planned bar is drawn to scale: 3 months out of about 15 years is about 1/60
      var planned = h('div', { class: 'bar-row' }, [
        delay(h('p', { class: 'bar-label fade-up' }, [h('b', { text: s.planned.label + ': ' }), s.planned.value + ' (' + s.planned.sub + ')']), 0.4),
        h('div', { class: 'bar-track' }, [(function () {
          var pb = delay(h('div', { class: 'bar planned grow-planned' }), 0.6);
          pb.style.width = ((s.planned.ratio || 0.017) * 100) + '%';
          return pb;
        })()])
      ]);
      var actual = h('div', { class: 'bar-row' }, [
        delay(h('p', { class: 'bar-label fade-up' }, [h('b', { text: s.actual.label + ': ' }), s.actual.value]), 2.2),
        h('div', { class: 'bar-track' }, [delay(h('div', { class: 'bar actual grow-actual' }), 2.4)]),
        delay(h('p', { class: 'bar-sub fade-up', text: s.actual.sub + ' (bars drawn to scale)' }), 5.2)
      ]);
      return h('div', { class: 'st-scene sc-numbers' }, [
        h('div', { class: 'pad' }, [
          delay(h('h2', { class: 'title fade-up', text: s.title }), 0.1),
          h('div', { class: 'bars' }, [planned, actual]),
          typed(h('p', { class: 'voice' }), s.text, 5.6, 40)
        ])
      ]);
    },

    map: function (s) {
      var wrap = h('div', { class: 'map-wrap' }, [h('div', { class: 'map-pan' }, [picture(s.image)])]);
      return h('div', { class: 'st-scene sc-map' }, [
        wrap, h('div', { class: 'shade soft' }),
        h('div', { class: 'overlay-tl' }, [
          delay(h('h2', { class: 'title fade-up', text: s.title }), 0.2)
        ]),
        h('div', { class: 'overlay-bl' }, [
          typed(h('p', { class: 'voice' }), s.text, 1.2, 40)
        ])
      ]);
    },

    scan: function (s) {
      var frame = corners(h('div', { class: 'scan-frame' }, [
        picture(s.image, 'scan-img'),
        h('div', { class: 'ring', 'aria-hidden': 'true' }),
        h('div', { class: 'cross', 'aria-hidden': 'true' })
      ]));
      var boxes = (s.hud || []).map(function (b, i) {
        return delay(corners(h('div', { class: 'hud-box fade-up' }, [h('b', { text: b.label }), typed(h('span'), b.value, 1.4 + i * 0.9, 55)])), 1.2 + i * 0.9);
      });
      return h('div', { class: 'st-scene sc-scan' }, [
        h('div', { class: 'scan-grid' }, [
          h('div', { class: 'scan-left' }, [
            delay(h('h2', { class: 'title fade-up', text: s.title }), 0.2),
            typed(h('p', { class: 'voice' }), s.text, 0.9, 40)
          ]),
          frame,
          h('div', { class: 'scan-right' }, boxes)
        ])
      ]);
    },

    datacard: function (s) {
      var rows = (s.card || []).map(function (r, i) {
        return delay(h('div', { class: 'row fade-up' }, [h('b', { text: r.label }), typed(h('span'), r.value, 1.0 + i * 0.6, 55)]), 0.8 + i * 0.6);
      });
      return h('div', { class: 'st-scene sc-card' }, [
        h('div', { class: 'bg kenburns slow' }, [picture(s.image)]),
        h('div', { class: 'shade' }),
        h('div', { class: 'card-grid' }, [
          h('div', { class: 'card-left' }, [
            delay(h('h2', { class: 'title fade-up', text: s.title }), 0.2),
            typed(h('p', { class: 'voice' }), s.text, 0.8, 40)
          ]),
          corners(h('div', { class: 'card' }, rows))
        ])
      ]);
    },

    dust: function (s) {
      var svg = '<svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
        '<defs><linearGradient id="skyd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a2a1c"/><stop offset="1" stop-color="#c9814f"/></linearGradient></defs>' +
        '<rect width="400" height="240" fill="url(#skyd)"/>' +
        '<g class="sun"><circle cx="300" cy="70" r="26" fill="#ffe3b0"/><circle cx="300" cy="70" r="44" fill="#ffd08a" opacity=".25"/></g>' +
        '<path d="M0 170 Q120 150 220 168 T400 160 L400 240 L0 240Z" fill="#8c3f22"/>' +
        '<g transform="translate(110 150)"><rect x="0" y="22" width="90" height="10" fill="#2b3a5c" stroke="#9fb0d6" stroke-width="1"/>' +
        '<rect x="30" y="8" width="30" height="16" rx="2" fill="#bdb6aa"/><rect x="44" y="0" width="3" height="10" fill="#bdb6aa"/></g>' +
        '</svg>';
      var art = h('div', { class: 'dust-art' });
      art.innerHTML = svg;
      return h('div', { class: 'st-scene sc-dust' }, [
        art, h('div', { class: 'haze' }), h('div', { class: 'shade soft' }),
        h('div', { class: 'overlay-tl' }, [delay(h('h2', { class: 'title fade-up', text: s.title }), 0.2)]),
        h('div', { class: 'overlay-bl' }, [
          typed(h('p', { class: 'voice' }), s.text, 1.0, 40),
          delay(h('p', { class: 'small fade-up', text: s.note }), 2.0)
        ])
      ]);
    },

    lastimage: function (s) {
      var frame = corners(h('div', { class: 'last-frame' }, [picture(s.image, 'last-img')]));
      return h('div', { class: 'st-scene sc-last' }, [
        h('div', { class: 'last-grid' }, [
          h('div', { class: 'last-left' }, [
            delay(h('h2', { class: 'title fade-up', text: s.title }), 0.2),
            delay(h('p', { class: 'st-kicker fade-up', text: s.kicker }), 0.8),
            typed(h('p', { class: 'voice' }), s.text, 1.6, 40)
          ]),
          delay(frame, 0.4)
        ])
      ]);
    },

    timeline: function (s) {
      var n = (s.events || []).length;
      var nodes = (s.events || []).map(function (ev, i) {
        return delay(h('div', { class: 'tl-node fade-up' }, [
          h('span', { class: 'tl-dot', 'aria-hidden': 'true' }),
          h('b', { text: ev.date }),
          h('p', { text: ev.text })
        ]), 0.9 + i * 1.1);
      });
      var kids = [
        delay(h('h2', { class: 'title fade-up', text: s.title }), 0.1),
        h('div', { class: 'tl-wrap' }, [
          delay(h('div', { class: 'tl-line', 'aria-hidden': 'true' }), 0.5),
          h('div', { class: 'tl-nodes', style: '--n:' + n }, nodes)
        ])
      ];
      if (s.text) kids.push(typed(h('p', { class: 'voice' }), s.text, 1.2 + n * 1.1, 40));
      return h('div', { class: 'st-scene sc-timeline' }, [h('div', { class: 'pad' }, kids)]);
    },

    photo: function (s) {
      return h('div', { class: 'st-scene sc-photo' }, [
        h('div', { class: 'bg kenburns' }, [picture(s.image)]),
        h('div', { class: 'shade soft' }),
        h('div', { class: 'overlay-tl' }, [delay(h('h2', { class: 'title fade-up', text: s.title }), 0.2)]),
        h('div', { class: 'overlay-bl' }, [typed(h('p', { class: 'voice' }), s.text, 1.0, 40)])
      ]);
    },

    cards: function (s) {
      var cards = (s.cards || []).map(function (c, i) {
        return delay(corners(h('div', { class: 'info-card fade-up' }, [
          h('b', { text: c.head }),
          h('p', { text: c.text }),
          h('span', { class: 'src', text: 'Source: ' + c.sourceLabel })
        ])), 1.0 + i * 1.6);
      });
      return h('div', { class: 'st-scene sc-cards' }, [
        h('div', { class: 'pad' }, [
          delay(h('h2', { class: 'title fade-up', text: s.title }), 0.2),
          h('div', { class: 'cards-row' }, cards)
        ])
      ]);
    },

    ask: function (s, api) {
      var input = h('input', { class: 'ask-input', type: 'text', maxlength: '140', 'aria-label': s.text, placeholder: 'Type your answer, then press Enter' });
      var send = h('button', { class: 'st-btn', type: 'button', text: 'Send' });
      var replyEl = h('p', { class: 'voice ask-reply' });
      var cont = h('button', { class: 'st-btn', type: 'button', text: 'Continue' });
      cont.hidden = true;
      var row = h('div', { class: 'ask-row fade-up' }, [input, send]);
      delay(row, 3.2);

      function submit() {
        var v = input.value.trim();
        if (!v) return;
        input.disabled = true; send.disabled = true;
        // the answer is shown on screen only; nothing is stored or sent anywhere
        typed(replyEl, '"' + v + '"  ' + s.reply, 0, 50);
        cont.hidden = false;
        cont.focus();
      }
      send.addEventListener('click', submit);
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
      cont.addEventListener('click', function () { api.next(); });

      return h('div', { class: 'st-scene sc-ask' }, [
        h('div', { class: 'center' }, [
          delay(h('h2', { class: 'title fade-up', text: s.title }), 0.2),
          typed(h('p', { class: 'voice big' }), s.text, 0.9, 42),
          row,
          replyEl,
          cont
        ])
      ]);
    },

    reflect: function (s, api) {
      var lines = (s.lines || []).map(function (l) {
        return typed(h('p', { class: 'voice quiet' }), l.text, l.at, 22);
      });
      if (api && api.answer) {
        // the reader's own question from the first page returns at the very end
        lines.push(typed(h('p', { class: 'voice quiet your-q' }), 'Your question: "' + api.answer + '"', 17.5, 30));
      }
      return h('div', { class: 'st-scene sc-reflect' }, [
        h('div', { class: 'bg kenburns slow' }, [picture(s.image)]),
        h('div', { class: 'shade' }),
        h('div', { class: 'dark-fade' }),
        h('div', { class: 'center quiet-lines' }, lines)
      ]);
    },

    closing: function (s, api) {
      var back = h('button', { class: 'st-btn', type: 'button', text: 'Back to the book' });
      back.addEventListener('click', function () { api.close('finished'); });
      return h('div', { class: 'st-scene sc-closing' }, [
        h('div', { class: 'center' }, [
          delay(h('h2', { class: 'title huge fade-up', text: s.title }), 0.5),
          typed(h('p', { class: 'voice big' }), s.text, 1.8, 36, true),
          delay(h('p', { class: 'small fade-up', text: s.small }), 3.4),
          delay(back, 4.4)
        ])
      ]);
    }
  };

  /* ---------- player ---------- */

  function open(machine, opts) {
    if (state || !machine.scenes || !machine.scenes.length) return;
    opts = opts || {};
    var host = opts.host;
    var scenes = machine.scenes;

    var chapters = [];
    scenes.forEach(function (s, i) {
      if (chapters.indexOf(s.chapter) === -1) chapters.push(s.chapter);
    });

    var root = h('div', { class: 'story', role: 'dialog', 'aria-label': 'Story: ' + machine.name, tabindex: '-1' });
    var label = h('span', { class: 'st-label', text: machine.storyLabel || machine.name });
    var nav = h('nav', { class: 'st-chapters', 'aria-label': 'Chapters' });
    var chapterBtns = chapters.map(function (c) {
      var b = h('button', { type: 'button', text: c });
      b.addEventListener('click', function () {
        var first = scenes.findIndex(function (s) { return s.chapter === c; });
        goTo(first);
      });
      nav.appendChild(b);
      return b;
    });
    var head = h('header', { class: 'st-head' }, [label, nav]);

    var stage = h('div', { class: 'st-stage' });

    var prev = h('button', { class: 'st-btn', type: 'button', 'aria-label': 'Previous scene', text: '⏮' });
    var play = h('button', { class: 'st-btn', type: 'button', 'aria-label': 'Pause' , text: '⏸' });
    var next = h('button', { class: 'st-btn', type: 'button', 'aria-label': 'Next scene', text: '⏭' });
    var skip = h('button', { class: 'st-btn skip', type: 'button', text: 'Skip to facts' });
    var segs = scenes.map(function (s, i) {
      var fill = h('span', { class: 'fill' });
      var b = h('button', { class: 'seg', type: 'button', 'aria-label': 'Scene ' + (i + 1) + ': ' + s.title }, [fill]);
      b.addEventListener('click', function () { goTo(i); });
      b._fill = fill;
      return b;
    });
    var progress = h('div', { class: 'st-progress' }, segs);
    var credit = h('p', { class: 'st-credit' });
    var foot = h('footer', { class: 'st-foot' }, [
      h('div', { class: 'st-row' }, [prev, play, next, progress, skip]),
      credit
    ]);
    var live = h('p', { class: 'sr-only', 'aria-live': 'polite' });

    root.appendChild(head); root.appendChild(stage); root.appendChild(foot); root.appendChild(live);
    host.appendChild(root);

    typer = window.Typewriter ? window.Typewriter.make({ isPlaying: function () { return !!(state && state.playing); } }) : null;
    state = { root: root, index: -1, elapsed: 0, playing: !reduceMotion, raf: 0, last: 0, scenes: scenes, opts: opts };

    var api = { close: close, answer: opts.userAnswer || '', next: function () { goTo(state.index + 1); } };

    function setPlaying(on) {
      state.playing = on;
      root.classList.toggle('paused', !on);
      play.textContent = on ? '⏸' : '▶';
      play.setAttribute('aria-label', on ? 'Pause' : 'Play');
      state.last = 0;
    }

    function goTo(i) {
      if (i < 0) i = 0;
      if (i >= scenes.length) { close('finished'); return; }
      var s = scenes[i];
      state.index = i; state.elapsed = 0; state.last = 0;
      if (typer) typer.clear();
      var sceneEl = renderers[s.type](s, api);
      sceneEl.appendChild(h('div', { class: 'st-frame hud-frame', 'aria-hidden': 'true' }));
      if (s.voice === 'story') {
        sceneEl.appendChild(h('div', { class: 'voice-tag' }, [h('b', { text: 'Story voice' }), ' written by the storyteller, not a NASA statement']));
      }
      stage.replaceChildren(sceneEl);
      sceneEl.style.setProperty('--dur', (s.duration || 7000) + 'ms');

      chapterBtns.forEach(function (b) {
        var on = b.textContent === s.chapter;
        b.classList.toggle('on', on);
        if (on) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      segs.forEach(function (b, k) { b._fill.style.transform = 'scaleX(' + (k < i ? 1 : 0) + ')'; });
      prev.disabled = i === 0;

      var c = s.image && s.image.credit;
      credit.textContent = c ? 'Image: ' + c + (s.image.nasaId ? ' (NASA ID ' + s.image.nasaId + ')' : '') : (s.note || '');
      live.textContent = s.title + '. ' + s.text;
    }

    function tick(ts) {
      if (!state) return;
      if (state.playing) {
        if (state.last) state.elapsed += ts - state.last;
        state.last = ts;
        var dur = scenes[state.index].duration || 7000;
        segs[state.index]._fill.style.transform = 'scaleX(' + Math.min(1, state.elapsed / dur) + ')';
        if (state.elapsed >= dur && !scenes[state.index].wait) {
          if (state.index === scenes.length - 1) { setPlaying(false); segs[state.index]._fill.style.transform = 'scaleX(1)'; }
          else goTo(state.index + 1);
        }
      } else {
        state.last = 0;
      }
      state.raf = requestAnimationFrame(tick);
    }

    function close(reason) {
      if (!state) return;
      cancelAnimationFrame(state.raf);
      if (typer) { typer.destroy(); typer = null; }
      document.removeEventListener('keydown', onKey, true);
      var r = state.root, cb = state.opts.onClose;
      state = null;
      r.classList.add('leaving');
      setTimeout(function () { r.remove(); if (cb) cb(reason); }, reduceMotion ? 0 : 350);
    }

    function onKey(e) {
      if (!state) return;
      if (e.target && e.target.tagName === 'INPUT') return;
      var onButton = e.target && e.target.tagName === 'BUTTON';
      if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); goTo(state.index + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); goTo(state.index - 1); }
      else if (e.key === 'Escape') { e.preventDefault(); close('skipped'); }
      else if ((e.key === ' ' || e.key === 'k') && !onButton) { e.preventDefault(); setPlaying(!state.playing); }
    }

    prev.addEventListener('click', function () { goTo(state.index - 1); });
    next.addEventListener('click', function () { goTo(state.index + 1); });
    play.addEventListener('click', function () { setPlaying(!state.playing); });
    skip.addEventListener('click', function () { close('skipped'); });
    document.addEventListener('keydown', onKey, true);

    setPlaying(state.playing);
    goTo(0);
    root.focus({ preventScroll: true });
    state.raf = requestAnimationFrame(tick);
  }

  window.Story = {
    open: open,
    isActive: function () { return !!state; }
  };
})();
