/* Optional motion layer for mission pages. Load AFTER mission-engine.js.
   Each animation upgrades an element marked data-anim="..." when its step
   becomes active. Removing this script (and animations.css) leaves the
   original static diagrams exactly as they were.

   data-anim="zoom"     – panels of a zoom-in sequence pop in one by one
   data-anim="type"     – a static code block types itself out (click to skip)
   data-anim="dissolve" – live particle model of salt dissolving in water
   data-anim="orbit"    – electrons circle the nucleus of an atom SVG
   data-anim="crystal3d"– draggable, spinning 3D salt crystal
   data-anim="draw"     – an SVG graph's lines draw themselves
   data-anim="cellcut"  – an apple cell is cut open and starts browning
   data-anim="enzyme"   – one enzyme turns substrate after substrate into pigment
   data-anim="wave"     – light waves travel; shorter wavelengths wiggle past more often
   data-anim="absorb"   – photons hit a leaf: blue/red absorbed, green goes on to the eye
   data-anim="grow"     – time-lapse of a plant bending toward the sun
   data-anim="auxin"    – auxin moves to the shaded side, cells stretch, stem bends
   data-anim="ph"       – pH scale marker + a cup of H+ ions (lemon, water, baking soda)
   data-anim="steps"    – a step-by-step chain revealed one step at a time
   data-anim="oxidize"  – an electron moves between two atoms; charges change
   Add data-anim-loop to a "zoom" or "draw" element to play it slowly on repeat. */

(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function svgEl(tag, attrs, parent) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (parent) parent.appendChild(el);
    return el;
  }

  /* ---------- Zoom-in sequence ---------- */

  function playZoom(el, slowGap) {
    const kids = Array.from(el.children);
    const gap = slowGap || Math.min(0.35, 2.5 / kids.length); // long lists still finish in ~2.5s
    kids.forEach((child, i) => {
      child.style.animationDelay = `${(i * gap).toFixed(2)}s`;
    });
    el.classList.remove('anim-zoom-play');
    void el.offsetWidth; // restart the CSS animation
    el.classList.add('anim-zoom-play');
  }

  /* ---------- Typing code ---------- */

  function playTyping(el) {
    if (el.dataset.animDone) return;
    el.dataset.animDone = '1';

    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push({ node: walker.currentNode, text: walker.currentNode.textContent });
    el.style.minHeight = `${el.offsetHeight}px`;
    nodes.forEach((n) => { n.node.textContent = ''; });
    el.classList.add('anim-typing');

    let nodeIndex = 0;
    let charIndex = 0;
    let timer = null;

    function finish() {
      clearTimeout(timer);
      nodes.forEach((n) => { n.node.textContent = n.text; });
      el.classList.remove('anim-typing');
      el.removeEventListener('click', finish);
    }

    function tick() {
      if (nodeIndex >= nodes.length) { finish(); return; }
      const current = nodes[nodeIndex];
      const ch = current.text[charIndex];
      current.node.textContent = current.text.slice(0, ++charIndex);
      if (charIndex >= current.text.length) { nodeIndex += 1; charIndex = 0; }
      timer = setTimeout(tick, ch === '\n' ? 260 : 30 + Math.random() * 45);
    }

    el.addEventListener('click', finish);
    timer = setTimeout(tick, 400);
  }

  /* ---------- Salt dissolving ---------- */

  function buildDissolve(host) {
    const W = 400;
    const H = 260;
    const ROWS = 4;
    const COLS = 4;
    const GAP = 26;
    const CX = 200;
    const CY = 130;
    const WATERS_PER_ION = 3;
    const FREE_WATERS = 8;

    const wrap = document.createElement('div');
    wrap.className = 'anim-dissolve';
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Animation: water molecules pull sodium and chloride ions off a salt crystal and spread them through the water.' }, wrap);
    svgEl('rect', { x: 2, y: 2, width: W - 4, height: H - 4, rx: 18, class: 'anim-water-bg' }, svg);
    const waterLayer = svgEl('g', {}, svg);
    const ionLayer = svgEl('g', {}, svg);

    const bar = document.createElement('div');
    bar.className = 'anim-dissolve-bar';
    const counter = document.createElement('span');
    const replay = document.createElement('button');
    replay.type = 'button';
    replay.className = 'anim-replay';
    replay.textContent = '↻ Replay';
    bar.append(counter, replay);
    wrap.appendChild(bar);

    const legend = document.createElement('div');
    legend.className = 'anim-legend';
    legend.innerHTML = '<span><i class="dot na"></i>Na⁺ sodium ion</span><span><i class="dot cl"></i>Cl⁻ chloride ion</span><span><i class="dot h2o"></i>water molecule</span>';
    wrap.appendChild(legend);

    const rand = (a, b) => a + Math.random() * (b - a);
    const crystalHalf = (GAP * Math.max(ROWS, COLS)) / 2 + 6;
    const inCrystal = (x, y, pad) => Math.abs(x - CX) < crystalHalf + pad && Math.abs(y - CY) < crystalHalf + pad;

    let ions = [];
    let waters = [];
    let frame = 0;
    let released = 0;

    function makeWater() {
      const g = svgEl('g', {}, waterLayer);
      svgEl('circle', { cx: -5.5, cy: 4.5, r: 3, class: 'anim-h' }, g);
      svgEl('circle', { cx: 5.5, cy: 4.5, r: 3, class: 'anim-h' }, g);
      svgEl('circle', { cx: 0, cy: 0, r: 5, class: 'anim-o' }, g);
      let x;
      let y;
      do { x = rand(20, W - 20); y = rand(20, H - 20); } while (inCrystal(x, y, 14));
      return { g, x, y, vx: rand(-0.4, 0.4), vy: rand(-0.4, 0.4), rot: rand(0, 360), ion: null, slot: 0 };
    }

    function makeIon(r, c) {
      const isNa = (r + c) % 2 === 0;
      const g = svgEl('g', {}, ionLayer);
      svgEl('circle', { r: 11, class: isNa ? 'anim-na' : 'anim-cl' }, g);
      const t = svgEl('text', { y: 3.5, 'text-anchor': 'middle', class: 'anim-ion-label' }, g);
      t.textContent = isNa ? 'Na⁺' : 'Cl⁻';
      const hx = CX + (c - (COLS - 1) / 2) * GAP;
      const hy = CY + (r - (ROWS - 1) / 2) * GAP;
      return { g, r, c, isNa, x: hx, y: hy, hx, hy, state: 'lattice', t: 0, tx: 0, ty: 0, vx: 0, vy: 0, spin: rand(0, Math.PI * 2) };
    }

    function reset() {
      waterLayer.textContent = '';
      ionLayer.textContent = '';
      ions = [];
      for (let r = 0; r < ROWS; r += 1) for (let c = 0; c < COLS; c += 1) ions.push(makeIon(r, c));
      waters = [];
      for (let i = 0; i < ions.length * WATERS_PER_ION + FREE_WATERS; i += 1) waters.push(makeWater());
      frame = 0;
      released = 0;
      updateCounter();
    }

    function updateCounter() {
      counter.textContent = released < ions.length
        ? `Ions pulled into the water: ${released} / ${ions.length}`
        : 'All the ions are spread through the water — the salt has dissolved!';
      replay.classList.toggle('is-visible', released >= ions.length);
    }

    // The most exposed ion (fewest neighbours still in the crystal) leaves first, like a real crystal surface.
    function releaseNext() {
      const inLattice = ions.filter((ion) => ion.state === 'lattice');
      if (!inLattice.length) return;
      const has = (r, c) => inLattice.some((ion) => ion.r === r && ion.c === c);
      const score = (ion) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dr, dc]) => !has(ion.r + dr, ion.c + dc)).length + Math.random() * 0.5;
      const ion = inLattice.sort((a, b) => score(b) - score(a))[0];

      const free = waters.filter((w) => !w.ion).sort((a, b) => Math.hypot(a.x - ion.x, a.y - ion.y) - Math.hypot(b.x - ion.x, b.y - ion.y));
      free.slice(0, WATERS_PER_ION).forEach((w, i) => { w.ion = ion; w.slot = (i * Math.PI * 2) / WATERS_PER_ION; });

      let tx;
      let ty;
      do { tx = rand(40, W - 40); ty = rand(40, H - 40); } while (inCrystal(tx, ty, 12));
      Object.assign(ion, { state: 'leaving', t: 0, tx, ty });
      released += 1;
      updateCounter();
    }

    function step() {
      frame += 1;
      if (frame % 75 === 0 && released < ions.length) releaseNext();
      const latticeLeft = ions.some((ion) => ion.state === 'lattice');

      // Dissolved ions gently push apart so they spread through the whole cup.
      const loose = ions.filter((ion) => ion.state === 'free');
      loose.forEach((a, i) => loose.slice(i + 1).forEach((b) => {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 70) {
          const f = ((70 - d) / 70) * 0.05;
          a.vx -= (dx / d) * f; a.vy -= (dy / d) * f;
          b.vx += (dx / d) * f; b.vy += (dy / d) * f;
        }
      }));

      ions.forEach((ion) => {
        if (ion.state === 'lattice') {
          ion.x = ion.hx + Math.sin(frame * 0.2 + ion.hx) * 0.4;
          ion.y = ion.hy + Math.cos(frame * 0.23 + ion.hy) * 0.4;
        } else if (ion.state === 'leaving') {
          ion.t += 1;
          if (ion.t > 45) {
            ion.x += (ion.tx - ion.x) * 0.025;
            ion.y += (ion.ty - ion.y) * 0.025;
            if (Math.hypot(ion.tx - ion.x, ion.ty - ion.y) < 3) ion.state = 'free';
          }
        } else {
          ion.vx = (ion.vx + rand(-0.04, 0.04)) * 0.97;
          ion.vy = (ion.vy + rand(-0.04, 0.04)) * 0.97;
          ion.x += ion.vx;
          ion.y += ion.vy;
          if (ion.x < 34 || ion.x > W - 34) ion.vx *= -1;
          if (ion.y < 34 || ion.y > H - 34) ion.vy *= -1;
          ion.x = Math.max(30, Math.min(W - 30, ion.x));
          ion.y = Math.max(30, Math.min(H - 30, ion.y));
          if (latticeLeft && inCrystal(ion.x, ion.y, 26)) { ion.x += ion.x < CX ? -0.8 : 0.8; ion.y += ion.y < CY ? -0.8 : 0.8; }
        }
        ion.spin += 0.012;
        ion.g.setAttribute('transform', `translate(${ion.x.toFixed(1)} ${ion.y.toFixed(1)})`);
      });

      waters.forEach((w) => {
        if (w.ion) {
          // Oxygen (slightly negative) faces Na+; hydrogens (slightly positive) face Cl-.
          const a = w.slot + w.ion.spin;
          w.x += (w.ion.x + Math.cos(a) * 21 - w.x) * 0.08;
          w.y += (w.ion.y + Math.sin(a) * 21 - w.y) * 0.08;
          const deg = (a * 180) / Math.PI;
          const target = w.ion.isNa ? deg - 90 : deg + 90;
          w.rot += ((((target - w.rot) % 360) + 540) % 360 - 180) * 0.1;
        } else {
          w.vx = Math.max(-0.7, Math.min(0.7, (w.vx + rand(-0.08, 0.08)) * 0.99));
          w.vy = Math.max(-0.7, Math.min(0.7, (w.vy + rand(-0.08, 0.08)) * 0.99));
          w.x += w.vx;
          w.y += w.vy;
          w.rot += w.vx * 3;
          if (w.x < 14 || w.x > W - 14) { w.vx *= -1; w.x = Math.max(14, Math.min(W - 14, w.x)); }
          if (w.y < 14 || w.y > H - 14) { w.vy *= -1; w.y = Math.max(14, Math.min(H - 14, w.y)); }
          if (latticeLeft && inCrystal(w.x, w.y, 8)) { w.vx = w.x < CX ? -0.6 : 0.6; w.vy = w.y < CY ? -0.6 : 0.6; }
        }
        w.g.setAttribute('transform', `translate(${w.x.toFixed(1)} ${w.y.toFixed(1)}) rotate(${w.rot.toFixed(0)})`);
      });
    }

    replay.addEventListener('click', reset);
    reset();

    const original = host.firstElementChild;
    original.classList.add('anim-replaced');
    host.insertBefore(wrap, original);

    return looper(step);
  }

  /* ---------- Shared frame loop for continuous animations ---------- */

  function looper(step) {
    let running = false;
    function loop() {
      if (!running) return;
      step();
      requestAnimationFrame(loop);
    }
    return {
      start() { if (!running) { running = true; requestAnimationFrame(loop); } },
      stop() { running = false; },
    };
  }

  /* ---------- Electrons orbiting an atom ----------
     Upgrades the existing atom SVG in place: electrons are grouped by shell
     (distance from the nucleus) and each shell turns at its own speed. */

  function buildOrbit(svg) {
    const shells = Array.from(svg.querySelectorAll('circle[fill="none"]'));
    const cx = Number(shells[0].getAttribute('cx'));
    const cy = Number(shells[0].getAttribute('cy'));
    const radii = shells.map((s) => Number(s.getAttribute('r'))).sort((a, b) => a - b);

    const groups = radii.map(() => svgEl('g', {}));
    svg.querySelectorAll('g[fill] > circle').forEach((e) => {
      const d = Math.hypot(Number(e.getAttribute('cx')) - cx, Number(e.getAttribute('cy')) - cy);
      const shell = radii.reduce((best, r, i) => (Math.abs(r - d) < Math.abs(radii[best] - d) ? i : best), 0);
      groups[shell].appendChild(e);
    });
    const parent = svg.querySelector('g[fill]');
    groups.forEach((g) => parent.appendChild(g));

    const angles = groups.map(() => 0);
    return looper(() => {
      groups.forEach((g, i) => {
        angles[i] += 0.9 / (i + 1); // inner shells turn faster
        g.setAttribute('transform', `rotate(${angles[i].toFixed(2)} ${cx} ${cy})`);
      });
    });
  }

  /* ---------- Rotating 3D salt crystal ----------
     A 3x3x3 block of alternating Na+ / Cl- ions. Spins on its own; drag to turn it. */

  function buildCrystal(host) {
    const N = 3;
    const GAP = 70;
    const W = 320;
    const H = 310;

    const wrap = document.createElement('div');
    wrap.className = 'anim-crystal';
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'A rotating 3D model of a salt crystal: sodium and chloride ions alternate in every direction.' }, wrap);
    const bondLayer = svgEl('g', {}, svg);
    const ionLayer = svgEl('g', {}, svg);
    const hint = document.createElement('div');
    hint.className = 'anim-crystal-hint';
    hint.textContent = '✋ Drag the crystal to turn it';
    wrap.appendChild(hint);

    const ions = [];
    const off = (N - 1) / 2;
    for (let i = 0; i < N; i += 1) for (let j = 0; j < N; j += 1) for (let k = 0; k < N; k += 1) {
      const isNa = (i + j + k) % 2 === 0;
      const g = svgEl('g', {}, ionLayer);
      // Chloride ions really are bigger than sodium ions.
      const c = svgEl('circle', { class: isNa ? 'anim-na' : 'anim-cl' }, g);
      const t = svgEl('text', { 'text-anchor': 'middle', class: 'anim-ion-label' }, g);
      t.textContent = isNa ? 'Na⁺' : 'Cl⁻';
      ions.push({ x: (i - off) * GAP, y: (j - off) * GAP, z: (k - off) * GAP, base: isNa ? 13 : 19, g, c, t, i, j, k });
    }
    const bonds = [];
    ions.forEach((a) => ions.forEach((b) => {
      if (Math.abs(a.i - b.i) + Math.abs(a.j - b.j) + Math.abs(a.k - b.k) === 1 && ions.indexOf(a) < ions.indexOf(b)) {
        bonds.push({ a, b, el: svgEl('line', { class: 'anim-bond' }, bondLayer) });
      }
    }));

    let rotY = 0.5;
    let rotX = -0.45;
    let dragging = null;

    function project(p) {
      const x1 = p.x * Math.cos(rotY) + p.z * Math.sin(rotY);
      const z1 = -p.x * Math.sin(rotY) + p.z * Math.cos(rotY);
      const y2 = p.y * Math.cos(rotX) - z1 * Math.sin(rotX);
      const z2 = p.y * Math.sin(rotX) + z1 * Math.cos(rotX);
      const f = 520 / (520 + z2);
      return { sx: W / 2 + x1 * f, sy: H / 2 + y2 * f, depth: z2, f };
    }

    function draw() {
      ions.forEach((ion) => { ion.p = project(ion); });
      bonds.forEach(({ a, b, el }) => {
        el.setAttribute('x1', a.p.sx.toFixed(1)); el.setAttribute('y1', a.p.sy.toFixed(1));
        el.setAttribute('x2', b.p.sx.toFixed(1)); el.setAttribute('y2', b.p.sy.toFixed(1));
      });
      ions.slice().sort((a, b) => b.p.depth - a.p.depth).forEach((ion) => {
        const r = ion.base * ion.p.f;
        ion.c.setAttribute('cx', ion.p.sx.toFixed(1));
        ion.c.setAttribute('cy', ion.p.sy.toFixed(1));
        ion.c.setAttribute('r', r.toFixed(1));
        ion.t.setAttribute('x', ion.p.sx.toFixed(1));
        ion.t.setAttribute('y', (ion.p.sy + r * 0.3).toFixed(1));
        ion.t.style.fontSize = `${(r * 0.75).toFixed(1)}px`;
        ion.g.style.opacity = (0.55 + 0.45 * Math.min(1, Math.max(0, (60 - ion.p.depth) / 120))).toFixed(2);
        ionLayer.appendChild(ion.g); // painter's order: far ions first
      });
    }

    svg.addEventListener('pointerdown', (e) => { dragging = { x: e.clientX, y: e.clientY }; svg.setPointerCapture(e.pointerId); });
    svg.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      rotY += (e.clientX - dragging.x) * 0.01;
      rotX = Math.max(-1.4, Math.min(1.4, rotX - (e.clientY - dragging.y) * 0.01));
      dragging = { x: e.clientX, y: e.clientY };
      hint.classList.add('is-faded');
    });
    const endDrag = () => { dragging = null; };
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);

    draw();
    const original = host.firstElementChild;
    original.classList.add('anim-replaced');
    host.insertBefore(wrap, original);

    return looper(() => {
      if (!dragging) rotY += 0.008;
      draw();
    });
  }

  /* ---------- Graph lines draw themselves ---------- */

  function playDraw(svg, dur = 2.2, stagger = 0.4) {
    svg.querySelectorAll('path[fill="none"]').forEach((p, i) => {
      const len = p.getTotalLength();
      p.style.transition = 'none';
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      void p.getBoundingClientRect();
      p.style.transition = `stroke-dashoffset ${dur}s ease-in-out ${0.3 + i * stagger}s`;
      p.style.strokeDashoffset = 0;
    });
  }

  /* ---------- Slow, looping versions (elements marked data-anim-loop) ---------- */

  const HOLD = 3; // seconds the finished picture stays before it repeats

  function cycleLooper(play, fadeTarget, seconds) {
    let timers = [];
    function cycle() {
      timers = [];
      fadeTarget.classList.remove('anim-fade-out');
      play();
      timers.push(setTimeout(() => fadeTarget.classList.add('anim-fade-out'), seconds * 1000));
      timers.push(setTimeout(cycle, seconds * 1000 + 600));
    }
    return {
      start() { if (!timers.length) cycle(); },
      stop() { timers.forEach(clearTimeout); timers = []; fadeTarget.classList.remove('anim-fade-out'); },
    };
  }

  function buildZoomLoop(el) {
    const n = el.children.length;
    const gap = n > 4 ? 0.8 : 1.1;
    el.classList.add('anim-zoom-slow');
    return cycleLooper(() => playZoom(el, gap), el, (n - 1) * gap + 1 + HOLD);
  }

  function buildDrawLoop(svg) {
    const n = svg.querySelectorAll('path[fill="none"]').length;
    return cycleLooper(() => playDraw(svg, 4, 0.8), svg, 0.3 + (n - 1) * 0.8 + 4 + HOLD);
  }

  /* Shared "status line + replay button" bar used by the live models. */
  function statusBar(wrap, onReplay) {
    const bar = document.createElement('div');
    bar.className = 'anim-dissolve-bar';
    const text = document.createElement('span');
    const replay = document.createElement('button');
    replay.type = 'button';
    replay.className = 'anim-replay';
    replay.textContent = '↻ Replay';
    replay.addEventListener('click', onReplay);
    bar.append(text, replay);
    wrap.appendChild(bar);
    return {
      set(msg, done) { text.textContent = msg; replay.classList.toggle('is-visible', Boolean(done)); },
    };
  }

  /* Tracks whether an element is on screen, so step-by-step pieces further
     down a long step wait for the student to scroll to them. */
  function onScreen(el) {
    const state = { visible: !('IntersectionObserver' in window) };
    if (!state.visible) {
      new IntersectionObserver((entries) => entries.forEach((e) => { state.visible = e.isIntersecting; }), { threshold: 0.4 }).observe(el);
    }
    return state;
  }

  /* "Step 2 of 5   [Next ▸]" controls for animations that move in steps. */
  function stepControls(onNext) {
    const bar = document.createElement('div');
    bar.className = 'anim-dissolve-bar anim-steps-bar';
    const counter = document.createElement('span');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'anim-replay is-visible';
    button.addEventListener('click', onNext);
    bar.append(counter, button);
    return {
      bar,
      set(n, total) {
        counter.textContent = `Step ${n} of ${total}`;
        button.textContent = n < total ? 'Next \u25B8' : '\u21BB Replay';
        button.classList.remove('is-ready');
      },
      ready() { button.classList.add('is-ready'); }, // gentle pulse: "you can click Next now"

    };
  }

  function legend(wrap, items) {
    const el = document.createElement('div');
    el.className = 'anim-legend';
    el.innerHTML = items.map(([cls, label]) => `<span><i class="dot ${cls}"></i>${label}</span>`).join('');
    wrap.appendChild(el);
  }

  function replaceStatic(host, wrap) {
    const original = host.firstElementChild;
    original.classList.add('anim-replaced');
    host.insertBefore(wrap, original);
  }

  /* ---------- Cutting an apple cell ----------
     Uses only words the mission has taught by this point (no "substrate").
     Sealed cell: enzymes (squares) are kept apart from their target molecules
     (triangles, inside a compartment) and O2 stays outside. A knife cuts the
     membrane, O2 drifts in, the compartment breaks, and wherever enzyme +
     target + O2 meet, the target turns brown. */

  function buildCellCut(host) {
    const W = 520;
    const H = 270;
    const CX = 320;
    const CY = 135;
    const R = 112;
    const VX = 355;
    const VY = 115;
    const VR = 46;
    const GAP = 0.42; // half-width of the cut, in radians, centred on the left side (angle PI)
    const N_SUB = 8;

    const wrap = document.createElement('div');
    wrap.className = 'anim-dissolve';
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Animation: an apple cell is cut, oxygen enters, and the enzyme meets its target molecules and they turn brown.' }, wrap);
    svgEl('rect', { x: 2, y: 2, width: W - 4, height: H - 4, rx: 18, class: 'anim-air-bg' }, svg);
    const airLabel = svgEl('text', { x: 24, y: 30, class: 'anim-small-label' }, svg);
    airLabel.textContent = 'air';
    const cellFill = svgEl('circle', { cx: CX, cy: CY, r: R, class: 'anim-cell-fill' }, svg);
    const membrane = svgEl('path', { class: 'anim-membrane' }, svg);
    const vacuole = svgEl('circle', { cx: VX, cy: VY, r: VR, class: 'anim-vacuole' }, svg);
    const particleLayer = svgEl('g', {}, svg);
    const knife = svgEl('line', { class: 'anim-knife' }, svg);

    const status = statusBar(wrap, () => reset());
    // data-anim-stepped: each stage waits for the Next button so the text can be read.
    // "min" is how long a stage plays before the Next button starts pulsing.
    const stepped = host.hasAttribute('data-anim-stepped');
    const STAGES = [
      { msg: 'Whole apple: the enzyme can\u2019t reach its targets, and oxygen can\u2019t get in.', min: 300 },
      { msg: '\uD83D\uDD2A The knife cuts the apple and breaks open its cells.', min: 120 },
      { msg: 'The cell is broken open! Oxygen from the air drifts in through the cut.', min: 300 },
      { msg: '' }, // filled in live with the brown count; ready once everything is brown
      { msg: 'All the targets turned brown \u2014 that\u2019s why a cut apple turns brown!', min: 120 },
    ];
    let stage = 0;
    let stageT = 0;
    let pulsing = false;
    const controls = stepped ? stepControls(() => {
      if (stage === STAGES.length - 1) { reset(); goStage(0); } else goStage(stage + 1);
    }) : null;
    if (controls) {
      wrap.appendChild(controls.bar);
      wrap.querySelector('.anim-dissolve-bar .anim-replay').style.display = 'none'; // the step controls replace it
    }
    legend(wrap, [['ppo', 'enzyme (a helper)'], ['sub', 'target molecule'], ['o2', 'oxygen (O₂)'], ['pig', 'turned brown']]);

    const rand = (a, b) => a + Math.random() * (b - a);
    let parts = [];
    let t = 0;
    let cut = false;
    let browned = 0;

    function arcPath(open) {
      if (!open) return `M ${CX + R} ${CY} A ${R} ${R} 0 1 1 ${CX - R} ${CY} A ${R} ${R} 0 1 1 ${CX + R} ${CY}`;
      const a1 = Math.PI + GAP;
      const a2 = Math.PI - GAP;
      const p = (a) => `${(CX + Math.cos(a) * R).toFixed(1)} ${(CY + Math.sin(a) * R).toFixed(1)}`;
      return `M ${p(a1)} A ${R} ${R} 0 1 1 ${p(a2)}`;
    }

    function add(kind, x, y) {
      const g = svgEl('g', {}, particleLayer);
      if (kind === 'ppo') svgEl('rect', { x: -8, y: -8, width: 16, height: 16, rx: 3, class: 'anim-ppo' }, g);
      if (kind === 'sub') svgEl('polygon', { points: '0,-9 9,7 -9,7', class: 'anim-sub' }, g);
      if (kind === 'o2') {
        svgEl('circle', { cx: -4.5, cy: 0, r: 5, class: 'anim-o2' }, g);
        svgEl('circle', { cx: 4.5, cy: 0, r: 5, class: 'anim-o2' }, g);
      }
      const p = { kind, g, x, y, vx: rand(-0.5, 0.5), vy: rand(-0.5, 0.5), rot: rand(0, 360), done: false };
      parts.push(p);
      return p;
    }

    function randomIn(cx, cy, rMin, rMax) {
      const a = rand(0, Math.PI * 2);
      const r = Math.sqrt(rand(rMin * rMin, rMax * rMax));
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    }

    function reset() {
      particleLayer.textContent = '';
      parts = [];
      t = 0;
      cut = false;
      browned = 0;
      membrane.setAttribute('d', arcPath(false));
      vacuole.style.opacity = 1;
      cellFill.style.fill = '';
      knife.style.opacity = 0;
      for (let i = 0; i < N_SUB; i += 1) add('sub', ...randomIn(VX, VY, 0, VR - 12));
      for (let i = 0; i < 4; i += 1) {
        let x; let y;
        do { [x, y] = randomIn(CX, CY, 0, R - 14); } while (Math.hypot(x - VX, y - VY) < VR + 12);
        add('ppo', x, y);
      }
      for (let i = 0; i < 16; i += 1) {
        let x; let y;
        // Most of the air is on the left, the side that will be cut.
        do { x = i < 13 ? rand(20, CX - R - 20) : rand(20, W - 20); y = rand(20, H - 20); } while (Math.hypot(x - CX, y - CY) < R + 12);
        add('o2', x, y);
      }
      status.set('Whole apple: the enzyme can’t reach its targets, and oxygen can’t get in.');
    }

    function startKnife() {
      knife.style.opacity = 1;
      if (!stepped) status.set('🔪 Cutting the apple…');
    }

    function moveKnife(k) {
      knife.setAttribute('x1', CX - R - 30); knife.setAttribute('y1', CY - 70);
      knife.setAttribute('x2', CX - R - 30 + 60 * k); knife.setAttribute('y2', CY - 70 + 140 * k);
    }

    function doCut() {
      if (cut) return;
      cut = true;
      knife.style.opacity = 0;
      membrane.setAttribute('d', arcPath(true));
      vacuole.style.opacity = 0;
      if (!stepped) status.set('The cell is broken open! Oxygen drifts in, and the enzyme can reach its targets.');
    }

    function brownMessage() {
      return `Where the enzyme, a target and oxygen meet, the target turns brown. Turned brown: ${browned} / ${N_SUB}`;
    }

    function goStage(n) {
      stage = n;
      stageT = 0;
      pulsing = false;
      if (n >= 2) doCut();
      if (n === 4) {
        // Skipping ahead: finish any targets that haven't turned brown yet.
        parts.filter((p) => p.kind === 'sub' && !p.done).forEach((p) => { p.done = true; p.g.firstChild.setAttribute('class', 'anim-pigment'); });
        browned = N_SUB;
        cellFill.style.fill = 'color-mix(in srgb, #b97a3f 55%, var(--primary-soft))';
      }
      status.set(n === 3 ? brownMessage() : STAGES[n].msg);
      controls.set(n + 1, STAGES.length);
    }

    function runStage() {
      if (!view.visible) return;
      stageT += 1;
      if (stage === 1) {
        if (stageT === 1) startKnife();
        if (stageT <= 40) moveKnife(stageT / 40);
        if (stageT === 41) doCut();
      }
      const done = stage === 3 ? browned >= N_SUB : stageT >= STAGES[stage].min;
      if (done && !pulsing) { pulsing = true; controls.ready(); }
    }

    // Keep a particle inside (or outside) a circle by reflecting it at the edge.
    function contain(p, cx, cy, r, inside, gapOpen) {
      const dx = p.x - cx;
      const dy = p.y - cy;
      const d = Math.hypot(dx, dy) || 1;
      const angle = Math.atan2(dy, dx);
      const inGap = gapOpen && Math.abs(Math.abs(angle) - Math.PI) < GAP * 0.8;
      if (inGap) return;
      if (inside && d > r) { p.x = cx + (dx / d) * r; p.y = cy + (dy / d) * r; p.vx -= (dx / d) * 0.6; p.vy -= (dy / d) * 0.6; }
      if (!inside && d < r) { p.x = cx + (dx / d) * r; p.y = cy + (dy / d) * r; p.vx += (dx / d) * 0.6; p.vy += (dy / d) * 0.6; }
    }

    function step() {
      t += 1;
      if (stepped) {
        runStage();
      } else {
        if (t === 150) startKnife();
        if (t >= 150 && t < 190) moveKnife((t - 150) / 40);
        if (t === 190) doCut();
      }
      const reacting = cut && (!stepped || stage >= 3);

      const o2s = parts.filter((p) => p.kind === 'o2' && !p.done);
      parts.forEach((p) => {
        const speed = p.kind === 'o2' ? 0.9 : 0.5;
        p.vx = Math.max(-speed, Math.min(speed, (p.vx + rand(-0.1, 0.1)) * 0.98));
        p.vy = Math.max(-speed, Math.min(speed, (p.vy + rand(-0.1, 0.1)) * 0.98));
        if (cut && p.kind === 'o2' && p.x < CX - R + 10 && Math.hypot(p.x - CX, p.y - CY) > R) {
          // After the cut, O2 on the open side diffuses toward the opening.
          p.vx += Math.sign(CX - R - p.x) * 0.02;
          p.vy += Math.sign(CY - p.y) * 0.02;
        }
        if (cut && p.kind === 'sub' && !p.done) {
          const near = parts.filter((q) => q.kind === 'ppo').sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
          p.vx += Math.sign(near.x - p.x) * 0.01;
          p.vy += Math.sign(near.y - p.y) * 0.01;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vx * 2;

        if (p.kind === 'o2') {
          p.x = Math.max(12, Math.min(W - 12, p.x));
          p.y = Math.max(12, Math.min(H - 12, p.y));
          if (p.x <= 12 || p.x >= W - 12) p.vx *= -1;
          if (p.y <= 12 || p.y >= H - 12) p.vy *= -1;
          const inCell = Math.hypot(p.x - CX, p.y - CY) < R;
          if (!cut) contain(p, CX, CY, R + 8, false, false);
          else contain(p, CX, CY, inCell ? R - 8 : R + 8, inCell, true);
        } else {
          contain(p, CX, CY, R - 12, true, false);
          if (!cut && p.kind === 'sub') contain(p, VX, VY, VR - 10, true, false);
          if (!cut && p.kind === 'ppo') contain(p, VX, VY, VR + 12, false, false);
        }

        if (reacting && p.kind === 'sub' && !p.done) {
          const enzyme = parts.some((q) => q.kind === 'ppo' && Math.hypot(q.x - p.x, q.y - p.y) < 26);
          const oxygen = o2s.find((q) => Math.hypot(q.x - p.x, q.y - p.y) < 34);
          if (enzyme && oxygen) {
            p.done = true;
            p.g.firstChild.setAttribute('class', 'anim-pigment');
            oxygen.done = true;
            oxygen.g.style.opacity = 0;
            browned += 1;
            cellFill.style.fill = `color-mix(in srgb, #b97a3f ${Math.round((browned / N_SUB) * 55)}%, var(--primary-soft))`;
            if (stepped) status.set(brownMessage());
            else {
              status.set(browned < N_SUB
                ? `Enzyme + target + oxygen → brown! Turned brown: ${browned} / ${N_SUB}`
                : 'All the targets turned brown — that’s why the cut apple turns brown!', browned >= N_SUB);
            }
          }
        }
        p.g.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.rot.toFixed(0)})`);
      });
    }

    reset();
    if (stepped) goStage(0);
    replaceStatic(host, wrap);
    const view = onScreen(wrap);
    return looper(step);
  }

  /* ---------- One enzyme, many reactions ----------
     A substrate drifts into the enzyme's pocket, reacts, leaves as brown
     pigment, and the unchanged enzyme is ready for the next one. */

  function buildEnzyme(host) {
    const W = 520;
    const H = 230;
    const POCKET_X = 260;
    const POCKET_Y = 96;
    const CYCLE = 260;

    const wrap = document.createElement('div');
    wrap.className = 'anim-dissolve';
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Animation: one enzyme turns substrate after substrate into brown pigment and stays unchanged.' }, wrap);
    // The substrate's outline and the enzyme's pocket are the same shape, so it fits like a puzzle piece.
    const SUB = [[-22, -16], [-22, 4], [0, 22], [22, 4], [22, -16]];
    const top = POCKET_Y - 16;
    const P = (x, y) => `${(POCKET_X + x).toFixed(1)},${y.toFixed(1)}`;
    const pocket = SUB.map(([x, y]) => P(x * 1.1, POCKET_Y + (y < 0 ? y : y * 1.12))).join(' L ');
    const enzyme = svgEl('path', {
      d: `M ${P(-80, top)} L ${pocket} L ${P(80, top)} C ${P(112, top)} ${P(118, top + 55)} ${P(100, top + 88)} `
        + `C ${P(84, top + 116)} ${P(-84, top + 116)} ${P(-100, top + 88)} C ${P(-118, top + 55)} ${P(-112, top)} ${P(-80, top)} Z`,
      class: 'anim-enzyme',
    }, svg);
    const eLabel = svgEl('text', { x: POCKET_X, y: top + 82, 'text-anchor': 'middle', class: 'anim-label anim-label-enzyme' }, svg);
    eLabel.textContent = 'Enzyme (PPO)';
    const products = svgEl('g', {}, svg);
    const mol = svgEl('g', {}, svg);
    const turn = svgEl('g', {}, mol);
    const subShape = svgEl('polygon', { points: SUB.map(([x, y]) => `${x},${y}`).join(' '), class: 'anim-sub-hex' }, turn);
    // The product has a different shape: it no longer fits the pocket, so it is released.
    const product = svgEl('circle', { r: 16, class: 'anim-pigment-hex' }, turn);
    const molLabel = svgEl('text', { y: -30, 'text-anchor': 'middle', class: 'anim-label' }, mol);

    const TOTAL = 8;
    let t = 0;
    let count = 0;
    let finished = false;
    const status = statusBar(wrap, () => {
      t = 0; count = 0; finished = false;
      products.textContent = '';
      mol.style.opacity = 1;
      status.set('Reactions helped by this one enzyme: 0');
    });
    const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
    const mix = (a, b, k) => a + (b - a) * k;

    function step() {
      if (finished) return;
      t += 1;
      const c = t % CYCLE;
      let x; let y; let k = 0; let scale = 1; let rot = 0;
      if (c < 90) { // substrate drifts in from the left, turning until it lines up with the pocket
        const e = ease(c / 90);
        x = mix(60, POCKET_X, e); y = mix(40, POCKET_Y, e) + Math.sin(c * 0.15) * 4 * (1 - e);
        rot = mix(-70, 0, Math.min(1, e * 1.3));
      } else if (c < 150) { // bound: the reaction happens
        x = POCKET_X; y = POCKET_Y;
        k = (c - 90) / 60;
        enzyme.style.filter = `drop-shadow(0 0 ${(6 * Math.sin(k * Math.PI)).toFixed(1)}px var(--gold))`;
      } else { // product leaves to the right
        const e = ease((c - 150) / (CYCLE - 150));
        x = mix(POCKET_X, 470, e); y = mix(POCKET_Y, 45, e); k = 1; scale = mix(1, 0.8, e);
        enzyme.style.filter = '';
      }
      if (c === 150) {
        count += 1;
        status.set(`Reactions helped by this one enzyme: ${count} — and it’s still unchanged.`);
      }
      subShape.style.display = k < 0.5 ? '' : 'none';
      product.style.display = k < 0.5 ? 'none' : '';
      turn.setAttribute('transform', `rotate(${rot.toFixed(1)})`);
      molLabel.textContent = c < 90 ? 'substrate' : c < 150 ? 'reacting…' : 'brown pigment';
      molLabel.setAttribute('class', `anim-label ${k < 0.5 ? 'anim-label-sub' : 'anim-label-pig'}`);
      mol.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale.toFixed(2)})`);
      // a little pile of finished pigment builds up on the right
      if (c === CYCLE - 1) {
        const n = products.childNodes.length;
        svgEl('circle', { cx: 440 + (n % 4) * 16, cy: 150 + Math.floor(n / 4) * 16, r: 7, class: 'anim-pigment' }, products);
        if (count >= TOTAL) {
          finished = true;
          mol.style.opacity = 0;
          status.set(`${TOTAL} reactions done \u2014 and the enzyme is exactly the same as when it started!`, true);
        }
      }
    }

    status.set('Reactions helped by this one enzyme: 0');
    replaceStatic(host, wrap);
    return looper(step);
  }

  /* ---------- Oxidation, told in three panels ----------
     One panel per step, stacked so each appears as you scroll down:
     1) both atoms balanced, 2) an electron moves from A to B (repeats),
     3) A is oxidized (+1) and B is -1. Electrons keep orbiting in every panel. */

  function buildOxidize(host) {
    const W = 520;
    const H = 200;
    const A = { x: 140, y: 90 };
    const B = { x: 380, y: 90 };
    const R = 52;
    const MOVE = 130; // frames for the electron's trip in panel 2
    const PAUSE = 70;

    const STEPS = [
      {
        title: '1 · Both atoms are balanced',
        note: 'Each atom has 3 protons (+) and 3 electrons (−), so the charges cancel out.',
        a: 3, b: 3, labels: ['charge 0 (balanced)', 'charge 0 (balanced)'], cls: ['', ''],
      },
      {
        title: '2 · An electron moves from atom A to atom B',
        note: 'During a chemical reaction, an electron can be transferred from one atom to another.',
        a: 2, b: 3, move: true, labels: ['losing an electron…', 'gaining an electron…'], cls: ['is-plus', 'is-minus'],
      },
      {
        title: '3 · Atom A has been oxidized',
        note: 'Atom A now has more protons than electrons, so its charge is +1. Atom B has one extra electron, so its charge is −1.',
        a: 2, b: 4, landed: true, labels: ['charge +1 → oxidized!', 'charge −1'], cls: ['is-plus', 'is-minus'],
      },
    ];

    const wrap = document.createElement('div');
    wrap.className = 'anim-ox-steps';

    const panels = STEPS.map((st) => {
      const panel = document.createElement('div');
      panel.className = 'anim-ox-panel';
      const h = document.createElement('div');
      h.className = 'anim-ox-title';
      h.textContent = st.title;
      panel.appendChild(h);
      const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `${st.title}. ${st.note}` }, panel);
      const trail = st.move ? svgEl('path', { d: `M190,70 Q260,-5 ${B.x - R + 4},70`, class: 'anim-trail' }, svg) : null;
      [A, B].forEach((c, i) => {
        svgEl('circle', { cx: c.x, cy: c.y, r: R, class: 'anim-shell' }, svg);
        svgEl('circle', { cx: c.x, cy: c.y, r: 20, class: 'anim-nucleus' }, svg);
        const n = svgEl('text', { x: c.x, y: c.y + 5, 'text-anchor': 'middle', class: 'anim-nucleus-label' }, svg);
        n.textContent = '3+';
        const name = svgEl('text', { x: c.x, y: 168, 'text-anchor': 'middle', class: 'anim-atom-name' }, svg);
        name.textContent = i === 0 ? 'Atom A' : 'Atom B';
        const ch = svgEl('text', { x: c.x, y: 190, 'text-anchor': 'middle', class: `anim-charge ${st.cls[i]}` }, svg);
        ch.textContent = st.labels[i];
      });
      const electron = (cls) => svgEl('circle', { r: 6, class: cls }, svg);
      const aEls = Array.from({ length: st.a }, () => electron('anim-electron'));
      // In panel 3 the electron that moved is still shown in orange inside atom B.
      const bEls = Array.from({ length: st.b }, (_, i) => electron(st.landed && i === st.b - 1 ? 'anim-electron anim-electron-moving' : 'anim-electron'));
      const mover = st.move ? electron('anim-electron anim-electron-moving') : null;
      const note = document.createElement('p');
      note.className = 'anim-ox-note';
      note.textContent = st.note;
      panel.appendChild(note);
      wrap.appendChild(panel);
      return { panel, aEls, bEls, mover, trail };
    });

    // Panels slide in as they scroll into view.
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('is-visible');
      }), { threshold: 0.35 });
      panels.forEach((p) => io.observe(p.panel));
    } else {
      panels.forEach((p) => p.panel.classList.add('is-visible'));
    }

    const place = (el, c, a) => { el.setAttribute('cx', (c.x + Math.cos(a) * R).toFixed(1)); el.setAttribute('cy', (c.y + Math.sin(a) * R).toFixed(1)); };
    const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
    let spin = 0;
    let t = 0;

    function step() {
      spin += 0.012;
      t = (t + 1) % (MOVE + PAUSE);
      panels.forEach(({ aEls, bEls, mover, trail }) => {
        aEls.forEach((el, i) => place(el, A, spin + (i * Math.PI * 2) / aEls.length));
        bEls.forEach((el, i) => place(el, B, -spin + (i * Math.PI * 2) / bEls.length + 0.5));
        if (mover) {
          const k = Math.min(1, t / MOVE);
          const pt = trail.getPointAtLength(ease(k) * trail.getTotalLength());
          mover.setAttribute('cx', pt.x.toFixed(1));
          mover.setAttribute('cy', pt.y.toFixed(1));
          mover.style.opacity = t < MOVE ? 1 : Math.max(0, 1 - (t - MOVE) / 30);
        }
      });
    }

    replaceStatic(host, wrap);
    return looper(step);
  }

  /* ---------- A chain of steps revealed one at a time ----------
     Children alternate: step, arrow, step, arrow, ... Each step (with the arrow
     leading into it) appears on its own and is highlighted while it is read.
     It waits for the Next button; once the step has been on screen for a
     moment, the button pulses as a hint. Replay starts over from step 1. */

  function buildSteps(el) {
    const READ_SECONDS = 2.5;
    const kids = Array.from(el.children);
    const groups = [];
    kids.forEach((kid, i) => {
      if (i % 2 === 0) groups.push({ text: kid, parts: i > 0 ? [kids[i - 1], kid] : [kid] });
      kid.classList.add('anim-step-part');
      if (i % 2 === 0) kid.classList.add('anim-step-item');
    });

    let shown = 0;
    let timer = null;
    const controls = stepControls(() => show(shown < groups.length ? shown + 1 : 1));
    el.after(controls.bar);
    const view = onScreen(el);

    function show(n) {
      shown = n;
      groups.forEach((g, i) => {
        g.parts.forEach((p) => p.classList.toggle('anim-step-hidden', i >= n));
        g.text.classList.toggle('anim-step-current', i === n - 1);
      });
      controls.set(n, groups.length);
      clearTimeout(timer);
      timer = setTimeout(nudge, READ_SECONDS * 1000);
    }

    function nudge() {
      if (!view.visible) { timer = setTimeout(nudge, 300); return; } // only once it has been seen
      controls.ready();
    }

    return {
      start() { show(1); },
      stop() { clearTimeout(timer); },
    };
  }

  /* ---------- pH scale with a cup of H+ ions ----------
     A marker slides along a 0-14 pH scale between lemon juice, water and
     baking soda while the cup below fills with more or fewer H+ dots.
     (Real H+ amounts differ 10x per pH step; dot counts are only a hint.) */

  function buildPH(host) {
    const W = 520;
    const H = 270;
    const X0 = 40;
    const X1 = 480;
    const HOLD = 300; // frames each substance stays on screen
    const SLIDE = 70;
    const LIQ = { x0: 128, x1: 292, y0: 128, y1: 244 };
    const SUBSTANCES = [
      { emoji: '🍋', name: 'Lemon juice', ph: 2, kind: 'acidic', dots: 36, amount: 'LOTS of H⁺', liquid: '#f6e9a6' },
      { emoji: '💧', name: 'Pure water', ph: 7, kind: 'neutral', dots: 6, amount: 'a little H⁺', liquid: '#dcecf7' },
      { emoji: '🫧', name: 'Baking soda water', ph: 9, kind: 'basic', dots: 1, amount: 'hardly any H⁺', liquid: '#e3e6f5' },
    ];
    const xOf = (ph) => X0 + ((X1 - X0) * ph) / 14;

    const wrap = document.createElement('div');
    wrap.className = 'anim-dissolve';
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Animation: a marker moves along the pH scale from lemon juice (pH 2) to water (pH 7) to baking soda (pH 9), while a cup shows fewer hydrogen ions as the pH goes up.' }, wrap);

    // the scale
    const defs = svgEl('defs', {}, svg);
    const grad = svgEl('linearGradient', { id: 'anim-ph-grad', x1: 0, x2: 1, y1: 0, y2: 0 }, defs);
    [[0, '#c0392b'], [3, '#e67e22'], [5, '#f1c40f'], [7, '#6ab04c'], [9, '#3b7dd8'], [11, '#3c40c6'], [14, '#6c3483']]
      .forEach(([ph, color]) => svgEl('stop', { offset: `${(ph / 14) * 100}%`, 'stop-color': color }, grad));
    svgEl('rect', { x: X0, y: 40, width: X1 - X0, height: 16, rx: 8, fill: 'url(#anim-ph-grad)' }, svg);
    for (let ph = 0; ph <= 14; ph += 1) {
      const tick = svgEl('text', { x: xOf(ph), y: 72, 'text-anchor': 'middle', class: 'anim-ph-tick' }, svg);
      tick.textContent = ph;
    }
    [['← more acidic', X0, 'start'], ['neutral', xOf(7), 'middle'], ['more basic →', X1, 'end']].forEach(([txt, x, anchor]) => {
      const t = svgEl('text', { x, y: 90, 'text-anchor': anchor, class: 'anim-ph-end' }, svg);
      t.textContent = txt;
    });
    const marker = svgEl('g', {}, svg);
    svgEl('polygon', { points: '-9,-14 9,-14 0,0', class: 'anim-ph-marker' }, marker);
    const markerLabel = svgEl('text', { y: -19, 'text-anchor': 'middle', class: 'anim-ph-marker-label' }, marker);

    // the cup
    const liquid = svgEl('rect', { x: LIQ.x0 - 4, y: LIQ.y0 - 6, width: LIQ.x1 - LIQ.x0 + 8, height: LIQ.y1 - LIQ.y0 + 12, rx: 6, class: 'anim-ph-liquid' }, svg);
    const dotLayer = svgEl('g', {}, svg);
    svgEl('path', { d: 'M114,108 L124,248 Q126,256 134,256 L286,256 Q294,256 296,248 L306,108', class: 'anim-ph-cup' }, svg);

    // the info card
    const emoji = svgEl('text', { x: 410, y: 160, 'text-anchor': 'middle', class: 'anim-ph-emoji' }, svg);
    const nameText = svgEl('text', { x: 410, y: 192, 'text-anchor': 'middle', class: 'anim-atom-name' }, svg);
    const phText = svgEl('text', { x: 410, y: 214, 'text-anchor': 'middle', class: 'anim-ph-info' }, svg);
    const amountText = svgEl('text', { x: 410, y: 236, 'text-anchor': 'middle', class: 'anim-ph-amount' }, svg);

    const rand = (a, b) => a + Math.random() * (b - a);
    const dots = Array.from({ length: 36 }, () => {
      const g = svgEl('g', {}, dotLayer);
      svgEl('circle', { r: 8, class: 'anim-hplus' }, g);
      const t = svgEl('text', { y: 3, 'text-anchor': 'middle', class: 'anim-hplus-label' }, g);
      t.textContent = 'H⁺';
      return { g, x: rand(LIQ.x0 + 10, LIQ.x1 - 10), y: rand(LIQ.y0 + 10, LIQ.y1 - 10), vx: rand(-0.4, 0.4), vy: rand(-0.4, 0.4), op: 0 };
    });

    const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
    let t = SLIDE; // start with the marker already resting on lemon juice
    let markerPh = SUBSTANCES[0].ph;

    function show(sub) {
      emoji.textContent = sub.emoji;
      nameText.textContent = sub.name;
      phText.textContent = `pH ~${sub.ph} · ${sub.kind}`;
      amountText.textContent = sub.amount;
      liquid.style.fill = sub.liquid;
    }

    function step() {
      t = (t + 1) % (HOLD * SUBSTANCES.length);
      const i = Math.floor(t / HOLD);
      const c = t % HOLD;
      const sub = SUBSTANCES[i];
      const prev = SUBSTANCES[(i + SUBSTANCES.length - 1) % SUBSTANCES.length];
      if (c === 0) show(sub);
      markerPh = c < SLIDE ? prev.ph + (sub.ph - prev.ph) * ease(c / SLIDE) : sub.ph;
      marker.setAttribute('transform', `translate(${xOf(markerPh).toFixed(1)} 38)`);
      markerLabel.textContent = `pH ${markerPh.toFixed(c < SLIDE ? 1 : 0)}`;

      dots.forEach((d, n) => {
        const target = n < sub.dots ? 1 : 0;
        d.op += (target - d.op) * 0.06;
        d.vx = Math.max(-0.6, Math.min(0.6, (d.vx + rand(-0.08, 0.08)) * 0.98));
        d.vy = Math.max(-0.6, Math.min(0.6, (d.vy + rand(-0.08, 0.08)) * 0.98));
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < LIQ.x0 + 8 || d.x > LIQ.x1 - 8) d.vx *= -1;
        if (d.y < LIQ.y0 + 8 || d.y > LIQ.y1 - 8) d.vy *= -1;
        d.x = Math.max(LIQ.x0 + 8, Math.min(LIQ.x1 - 8, d.x));
        d.y = Math.max(LIQ.y0 + 8, Math.min(LIQ.y1 - 8, d.y));
        d.g.setAttribute('transform', `translate(${d.x.toFixed(1)} ${d.y.toFixed(1)})`);
        d.g.style.opacity = d.op.toFixed(2);
      });
    }

    show(SUBSTANCES[0]);
    dots.forEach((d, n) => { d.op = n < SUBSTANCES[0].dots ? 1 : 0; });
    replaceStatic(host, wrap);
    return looper(step);
  }

  /* ---------- Travelling light waves ----------
     Upgrades wave SVGs in place: every wavy path slides sideways at the same
     speed (light always travels at the same speed), so shorter wavelengths
     visibly wiggle past more often. Each path gets one extra wavelength on
     its left end and a clip, so the motion loops seamlessly. */

  let clipCount = 0;

  function buildWave(svg) {
    const SPEED = 0.45;
    const defs = svgEl('defs', {}, svg);
    const num = String.raw`(-?[\d.]+)`;
    const head = new RegExp(String.raw`^M\s*${num},${num}\s*Q\s*${num},${num}\s*${num},${num}\s*Q\s*${num},${num}\s*${num},${num}`);
    const waves = [];
    svg.querySelectorAll('path[fill="none"]').forEach((p) => {
      const d = p.getAttribute('d');
      const m = d.match(head);
      if (!m) return;
      const [x0, y0, c1x, c1y, x1, y1, c2x, c2y, x2, y2] = m.slice(1).map(Number);
      const lam = x2 - x0;
      const nums = d.match(/-?[\d.]+/g).map(Number);
      const xEnd = nums[nums.length - 2];
      const s = (v) => (v - lam).toFixed(1);
      p.setAttribute('d', `M${s(x0)},${y0} Q${s(c1x)},${c1y} ${s(x1)},${y1} Q${s(c2x)},${c2y} ${s(x2)},${y2} ${d.replace(/^M\s*[\d.]+,[\d.]+\s*/, '')}`);
      clipCount += 1;
      const id = `anim-wave-clip-${clipCount}`;
      const clip = svgEl('clipPath', { id }, defs);
      svgEl('rect', { x: x0 - 3, y: -50, width: xEnd - x0 + 6, height: 1000 }, clip);
      const g = svgEl('g', { 'clip-path': `url(#${id})` });
      p.parentNode.insertBefore(g, p);
      g.appendChild(p);
      waves.push({ p, lam });
    });
    let off = 0;
    return looper(() => {
      off += SPEED;
      waves.forEach((w) => w.p.setAttribute('transform', `translate(${(off % w.lam).toFixed(2)} 0)`));
    });
  }

  /* ---------- Photons hitting a leaf ----------
     Upgrades the chlorophyll SVG in place: blue and red photons travel to the
     leaf and are absorbed (the leaf glows); green photons carry on to the eye. */

  function buildAbsorb(svg) {
    const leaf = svg.querySelector('ellipse');
    const eye = svg.querySelectorAll('ellipse')[1];
    const BEAMS = [
      { color: '#3b7dd8', y: 45, stop: 278, absorbed: true, offset: 0 },
      { color: '#3f9d5e', y: 82, stop: 652, absorbed: false, offset: 30 },
      { color: '#b8462f', y: 120, stop: 278, absorbed: true, offset: 60 },
    ];
    const layer = svgEl('g', {}, svg);
    let photons = [];
    let t = 0;
    let glow = 0;
    let look = 0;
    return looper(() => {
      t += 1;
      BEAMS.forEach((b) => {
        if ((t + b.offset) % 70 === 0) {
          photons.push({ b, x: 20, el: svgEl('circle', { cx: 20, cy: b.y, r: 7, fill: b.color, class: 'anim-photon' }, layer) });
        }
      });
      photons = photons.filter((ph) => {
        ph.x += 2.4;
        ph.el.setAttribute('cx', ph.x.toFixed(1));
        if (ph.x >= ph.b.stop) {
          ph.el.remove();
          if (ph.b.absorbed) glow = 1; else look = 1;
          return false;
        }
        return true;
      });
      glow *= 0.94;
      look *= 0.92;
      leaf.style.filter = `drop-shadow(0 0 ${(10 * glow).toFixed(1)}px #f1c40f)`;
      if (eye) eye.style.filter = `drop-shadow(0 0 ${(6 * look).toFixed(1)}px #3f9d5e)`;
    });
  }

  /* ---------- Time-lapse: a plant bending toward the sun ----------
     Replaces the Day 1 / Day 2 / Day 3 strip with one plant that grows and
     bends toward the light over three "days", then starts over. */

  function buildGrow(orig) {
    const BX = 110;
    const GROUND = 118;
    const svg = svgEl('svg', { width: 320, height: 140, viewBox: '0 0 320 140', role: 'img', 'aria-label': 'Animation: over three days, a plant grows and bends toward the sun.' });
    svgEl('line', { x1: 10, y1: GROUND, x2: 310, y2: GROUND, stroke: 'var(--border)', 'stroke-width': 2 }, svg);
    svgEl('circle', { cx: 272, cy: 24, r: 10, fill: 'none', stroke: 'var(--gold)', 'stroke-width': 2.2 }, svg);
    svgEl('path', { d: 'M272,6v7M272,35v7M254,24h7M283,24h7M259.3,11.3l4.9,4.9M284.7,11.3l-4.9,4.9M259.3,36.7l4.9,-4.9M284.7,36.7l-4.9,-4.9', stroke: 'var(--gold)', 'stroke-width': 2, 'stroke-linecap': 'round' }, svg);
    [[250, 40, 205, 62], [248, 52, 200, 85], [255, 44, 220, 100]].forEach(([x1, y1, x2, y2]) => {
      svgEl('line', { x1, y1, x2, y2, class: 'anim-ray' }, svg);
    });
    const stem = svgEl('path', { fill: 'none', stroke: 'var(--primary)', 'stroke-width': 4, 'stroke-linecap': 'round' }, svg);
    const leaves = [0, 1].map(() => svgEl('ellipse', { rx: 9, ry: 5, fill: 'var(--primary-soft)', stroke: 'var(--primary)', 'stroke-width': 1.2 }, svg));
    const day = svgEl('text', { x: 160, y: 134, 'text-anchor': 'middle', class: 'anim-day-label' }, svg);

    const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
    function shape(k) {
      const tipX = BX + 72 * k;
      const tipY = 62 - 30 * k;
      stem.setAttribute('d', `M${BX},${GROUND} C${BX},${(GROUND - 40).toFixed(1)} ${(BX + 6 * k).toFixed(1)},${(tipY + 28).toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)}`);
      const len = stem.getTotalLength();
      // Each leaf sits on the stem, sticking out sideways (along the stem's normal).
      [0.45, 0.72].forEach((f, i) => {
        const p = stem.getPointAtLength(len * f);
        const q = stem.getPointAtLength(Math.min(len, len * f + 1));
        const tangent = Math.atan2(q.y - p.y, q.x - p.x);
        const side = i === 0 ? -1 : 1;
        const out = tangent + (side * Math.PI) / 2 + (side * -0.6); // angled slightly upward
        const cx = p.x + Math.cos(out) * 9;
        const cy = p.y + Math.sin(out) * 9;
        leaves[i].setAttribute('cx', cx.toFixed(1));
        leaves[i].setAttribute('cy', cy.toFixed(1));
        leaves[i].setAttribute('transform', `rotate(${((out * 180) / Math.PI).toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})`);
      });
      day.textContent = `Day ${1 + Math.round(2 * k)}`;
    }

    orig.classList.add('anim-replaced');
    orig.parentNode.insertBefore(svg, orig);
    let t = 0;
    shape(0);
    return looper(() => {
      t = (t + 1) % 600;
      const k = t < 60 ? 0 : t < 420 ? ease((t - 60) / 360) : 1;
      shape(k);
    });
  }

  /* ---------- Auxin bends the stem ----------
     A close-up of a stem as two columns of cells (shaded side and light side).
     1) light from one side, auxin spread evenly; 2) auxin moves to the shaded
     side; 3) shaded-side cells stretch; 4) the uneven growth bends the stem
     toward the light. Loops. */

  function buildAuxin(host) {
    const W = 520;
    const H = 280;
    const CX = 250;
    const BASE = 236;
    const COL = 40;
    const CELLS = 5;
    const GAP = 3;
    const PHASES = [150, 360, 580, 800, 980]; // ends of: spread, move, stretch, bend, hold

    const wrap = document.createElement('div');
    wrap.className = 'anim-dissolve';
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Animation: auxin moves to the shaded side of a stem, the cells there stretch, and the stem bends toward the light.' }, wrap);
    svgEl('line', { x1: 40, y1: BASE, x2: 480, y2: BASE, stroke: 'var(--border)', 'stroke-width': 2 }, svg);
    svgEl('circle', { cx: 455, cy: 60, r: 14, fill: 'var(--gold-soft)', stroke: 'var(--gold)', 'stroke-width': 2.4 }, svg);
    svgEl('path', { d: 'M455,34v8M455,78v8M429,60h8M473,60h8M436.6,41.6l5.7,5.7M473.4,41.6l-5.7,5.7M436.6,78.4l5.7,-5.7M473.4,78.4l-5.7,-5.7', stroke: 'var(--gold)', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, svg);
    [[425, 80, 315, 120], [428, 95, 315, 165], [430, 110, 315, 205]].forEach(([x1, y1, x2, y2]) => {
      svgEl('line', { x1, y1, x2, y2, class: 'anim-ray' }, svg);
    });
    const sunLabel = svgEl('text', { x: 455, y: 108, 'text-anchor': 'middle', class: 'anim-small-label' }, svg);
    sunLabel.textContent = 'light';

    const stem = svgEl('g', {}, svg);
    const left = Array.from({ length: CELLS }, () => svgEl('rect', { width: COL, rx: 5, class: 'anim-cell anim-cell-shade' }, stem));
    const right = Array.from({ length: CELLS }, () => svgEl('rect', { width: COL, rx: 5, class: 'anim-cell anim-cell-light' }, stem));
    const dotLayer = svgEl('g', {}, stem);
    const rand = (a, b) => a + Math.random() * (b - a);
    const dots = Array.from({ length: 12 }, (_, i) => ({
      el: svgEl('circle', { r: 4, class: 'anim-auxin' }, dotLayer),
      from: i % 2, // half start on each side
      fy: rand(0.08, 0.92),
      fx: rand(0.2, 0.8),
      wob: rand(0, Math.PI * 2),
    }));
    [['shaded side \u2192', CX - COL - 10, 'end'], ['\u2190 light side', CX + COL + 10, 'start']].forEach(([txt, x, anchor]) => {
      const t = svgEl('text', { x, y: BASE - 10, 'text-anchor': anchor, class: 'anim-small-label' }, svg);
      t.textContent = txt;
    });

    const status = statusBar(wrap, () => {});
    legend(wrap, [['aux', 'auxin (a plant hormone)'], ['shade', 'cells on the shaded side'], ['light', 'cells on the light side']]);
    const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
    const prog = (t, a, b) => ease(Math.max(0, Math.min(1, (t - a) / (b - a))));
    const MESSAGES = [
      '1 · Light comes mainly from one side. Auxin is spread through the stem.',
      '2 · The plant moves auxin to the shaded side.',
      '3 · Auxin makes the shaded-side cells stretch (elongate) more.',
      '4 · One side is longer than the other, so the stem bends toward the light!',
    ];
    let t = 0;
    let phase = -1;

    function layout(colX, cellH, list) {
      list.forEach((r, i) => {
        r.setAttribute('x', colX);
        r.setAttribute('y', (BASE - (i + 1) * cellH - i * GAP).toFixed(1));
        r.setAttribute('height', cellH.toFixed(1));
      });
      return CELLS * cellH + (CELLS - 1) * GAP;
    }

    function step() {
      t = (t + 1) % PHASES[4];
      const p = PHASES.findIndex((end) => t < end);
      const shown = Math.min(p, 3);
      if (shown !== phase) { phase = shown; status.set(MESSAGES[shown]); }

      const move = prog(t, PHASES[0], PHASES[1]);
      const stretch = prog(t, PHASES[1], PHASES[2]);
      const bend = prog(t, PHASES[2], PHASES[3]);

      const lx = CX - COL - 1;
      const rx = CX + 1;
      const lh = layout(lx, 24 + 12 * stretch, left);
      const rh = layout(rx, 24 + 2 * stretch, right);

      dots.forEach((d) => {
        const sx = d.from === 0 ? lx : rx;
        const x = sx + (lx - sx) * move + d.fx * COL + Math.sin(t * 0.05 + d.wob) * 2;
        const hFrom = d.from === 0 ? lh : rh;
        const hNow = hFrom + (lh - hFrom) * move;
        const y = BASE - d.fy * hNow + Math.cos(t * 0.04 + d.wob) * 2;
        d.el.setAttribute('cx', x.toFixed(1));
        d.el.setAttribute('cy', y.toFixed(1));
      });

      stem.setAttribute('transform', `rotate(${(20 * bend).toFixed(2)} ${CX} ${BASE})`);
    }

    replaceStatic(host, wrap);
    return looper(step);
  }

  /* ---------- Wiring: play each animation when its step becomes active ---------- */

  const builders = { dissolve: buildDissolve, orbit: buildOrbit, crystal3d: buildCrystal, cellcut: buildCellCut, enzyme: buildEnzyme, oxidize: buildOxidize, steps: buildSteps, ph: buildPH, wave: buildWave, absorb: buildAbsorb, grow: buildGrow, auxin: buildAuxin };
  const players = new Map();
  const loopBuilders = { zoom: buildZoomLoop, draw: buildDrawLoop };
  document.querySelectorAll('[data-anim]').forEach((el) => {
    const build = (el.hasAttribute('data-anim-loop') ? loopBuilders : builders)[el.dataset.anim];
    if (build) players.set(el, build(el));
  });

  function onStepChange(card) {
    const active = card.classList.contains('active');
    card.querySelectorAll('[data-anim]').forEach((el) => {
      const kind = el.dataset.anim;
      if (players.has(el)) {
        const p = players.get(el);
        if (active) p.start(); else p.stop();
      } else if (active && kind === 'zoom') {
        playZoom(el);
      } else if (active && kind === 'draw') {
        playDraw(el);
      } else if (active && kind === 'type') {
        playTyping(el);
      }
    });
  }

  document.querySelectorAll('.step-card').forEach((card) => {
    if (!card.querySelector('[data-anim]')) return;
    let wasActive = card.classList.contains('active');
    new MutationObserver(() => {
      const isActive = card.classList.contains('active');
      if (isActive !== wasActive) { wasActive = isActive; onStepChange(card); }
    }).observe(card, { attributes: true, attributeFilter: ['class'] });
    if (wasActive) onStepChange(card);
  });
})();
