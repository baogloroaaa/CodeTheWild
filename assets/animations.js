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
      if (t === 150) {
        knife.style.opacity = 1;
        status.set('🔪 Cutting the apple…');
      }
      if (t >= 150 && t < 190) {
        const k = (t - 150) / 40;
        knife.setAttribute('x1', CX - R - 30); knife.setAttribute('y1', CY - 70);
        knife.setAttribute('x2', CX - R - 30 + 60 * k); knife.setAttribute('y2', CY - 70 + 140 * k);
      }
      if (t === 190) {
        cut = true;
        knife.style.opacity = 0;
        membrane.setAttribute('d', arcPath(true));
        vacuole.style.opacity = 0;
        status.set('The cell is broken open! Oxygen drifts in, and the enzyme can reach its targets.');
      }

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

        if (cut && p.kind === 'sub' && !p.done) {
          const enzyme = parts.some((q) => q.kind === 'ppo' && Math.hypot(q.x - p.x, q.y - p.y) < 26);
          const oxygen = o2s.find((q) => Math.hypot(q.x - p.x, q.y - p.y) < 34);
          if (enzyme && oxygen) {
            p.done = true;
            p.g.firstChild.setAttribute('class', 'anim-pigment');
            oxygen.done = true;
            oxygen.g.style.opacity = 0;
            browned += 1;
            cellFill.style.fill = `color-mix(in srgb, #b97a3f ${Math.round((browned / N_SUB) * 55)}%, var(--primary-soft))`;
            status.set(browned < N_SUB
              ? `Enzyme + target + oxygen → brown! Turned brown: ${browned} / ${N_SUB}`
              : 'All the targets turned brown — that’s why the cut apple turns brown!', browned >= N_SUB);
          }
        }
        p.g.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.rot.toFixed(0)})`);
      });
    }

    reset();
    replaceStatic(host, wrap);
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

  /* ---------- Oxidation: one electron moves from atom A to atom B ----------
     Both atoms start neutral (3 protons, 3 electrons). One electron leaves A
     and joins B; A's charge becomes +1 (oxidized) and B's becomes -1. Loops. */

  function buildOxidize(host) {
    const W = 520;
    const H = 230;
    const A = { x: 140, y: 100 };
    const B = { x: 380, y: 100 };
    const R = 52;
    const CYCLE = 480;
    const LEAVE = 120;
    const ARRIVE = 210;

    const wrap = document.createElement('div');
    wrap.className = 'anim-dissolve';
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Animation: an electron moves from atom A to atom B. Atom A is oxidized and its charge becomes +1; atom B becomes -1.' }, wrap);
    const trail = svgEl('path', { d: `M190,80 Q260,0 ${B.x - R},${B.y - 20}`, class: 'anim-trail' }, svg);

    const atomLabels = [A, B].map((c, i) => {
      svgEl('circle', { cx: c.x, cy: c.y, r: R, class: 'anim-shell' }, svg);
      svgEl('circle', { cx: c.x, cy: c.y, r: 20, class: 'anim-nucleus' }, svg);
      const n = svgEl('text', { x: c.x, y: c.y + 5, 'text-anchor': 'middle', class: 'anim-nucleus-label' }, svg);
      n.textContent = '3+';
      const name = svgEl('text', { x: c.x, y: 185, 'text-anchor': 'middle', class: 'anim-atom-name' }, svg);
      name.textContent = i === 0 ? 'Atom A' : 'Atom B';
      return svgEl('text', { x: c.x, y: 207, 'text-anchor': 'middle', class: 'anim-charge' }, svg);
    });

    const electron = (cls) => svgEl('circle', { r: 6, class: cls }, svg);
    const aElectrons = [0, 2].map((i) => ({ el: electron('anim-electron'), base: (i * Math.PI * 2) / 3 }));
    const bElectrons = [0, 1, 2].map((i) => ({ el: electron('anim-electron'), base: (i * Math.PI * 2) / 3 + 0.5 }));
    const mover = electron('anim-electron anim-electron-moving');

    const status = statusBar(wrap, () => {});
    let t = 0;
    let spin = 0;
    const place = (el, c, a) => { el.setAttribute('cx', (c.x + Math.cos(a) * R).toFixed(1)); el.setAttribute('cy', (c.y + Math.sin(a) * R).toFixed(1)); };
    const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);

    function setCharges(moved) {
      atomLabels[0].textContent = moved ? 'charge +1 → oxidized!' : 'charge 0 (balanced)';
      atomLabels[0].setAttribute('class', `anim-charge ${moved ? 'is-plus' : ''}`);
      atomLabels[1].textContent = moved ? 'charge −1 (gained an electron)' : 'charge 0 (balanced)';
      atomLabels[1].setAttribute('class', `anim-charge ${moved ? 'is-minus' : ''}`);
    }

    function step() {
      t = (t + 1) % CYCLE;
      spin += 0.012;
      const n = (count) => (Math.PI * 2) / count;
      // A has 3 electrons before the move and 2 after; B has 3 then 4. Spread them evenly.
      const moved = t >= ARRIVE;
      aElectrons.forEach((e, i) => place(e.el, A, spin + i * n(t < LEAVE ? 3 : 2)));
      bElectrons.forEach((e, i) => place(e.el, B, -spin + i * n(moved ? 4 : 3)));

      if (t < LEAVE) {
        place(mover, A, spin + 2 * n(3));
        trail.style.opacity = 0;
      } else if (t < ARRIVE) {
        const k = ease((t - LEAVE) / (ARRIVE - LEAVE));
        const p = trail.getPointAtLength(k * trail.getTotalLength());
        mover.setAttribute('cx', p.x.toFixed(1));
        mover.setAttribute('cy', p.y.toFixed(1));
        trail.style.opacity = 1;
      } else {
        place(mover, B, -spin + 3 * n(4));
        trail.style.opacity = Math.max(0, 1 - (t - ARRIVE) / 60);
      }

      if (t === 0) { setCharges(false); status.set('Both atoms are balanced: 3 protons (+) and 3 electrons (−) each.'); }
      if (t === LEAVE) status.set('An electron moves from atom A to atom B…');
      if (t === ARRIVE) { setCharges(true); status.set('Atom A lost an electron, so it was oxidized. Now it has more + than −.'); }
    }

    setCharges(false);
    status.set('Both atoms are balanced: 3 protons (+) and 3 electrons (−) each.');
    replaceStatic(host, wrap);
    return looper(step);
  }

  /* ---------- Wiring: play each animation when its step becomes active ---------- */

  const builders = { dissolve: buildDissolve, orbit: buildOrbit, crystal3d: buildCrystal, cellcut: buildCellCut, enzyme: buildEnzyme, oxidize: buildOxidize };
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
