/* =========================================================
   "Shapes Bottom" — 2D physics falling-object animation
   (gravity → floor collision → bounce → object-to-object
    collision → settling → resting state) built with Matter.js.

   Each shape is an SVG vector (assets/svg/shape-*.svg).
   Collision outlines were sampled from those same SVG paths, so
   concave shapes (stars, flowers) collide on their real silhouette
   (poly-decomp splits them into convex parts).
   ========================================================= */
(() => {
  const section = document.getElementById('shapes-drop');
  if (!section || !window.Matter) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DESIGN_W = 1280;          // design page width
  const GROUP_LEFT = -26;         // shapes group x on the design page
  const SHAPES_H = 362.629;       // "Shapes Bottom" group height

  // Bounding box (x,y,w,h) in the shapes group + collision outline (v) relative to the bbox.
  const SHAPES = {"soft-flower":{"x":644.6,"y":144.31,"w":181.73,"h":181.73,"v":[[90.9,0],[73.5,3.6],[59.0,13.8],[49.8,28.9],[46.2,46.2],[28.9,49.8],[13.8,59.0],[3.6,73.5],[0,90.9],[3.6,108.2],[13.8,122.7],[28.9,132.0],[46.2,135.6],[49.8,152.8],[59.0,167.9],[73.5,178.1],[90.9,181.7],[108.2,178.1],[122.7,167.9],[132.0,152.8],[135.6,135.6],[152.8,132.0],[167.9,122.7],[178.1,108.2],[181.7,90.9],[178.1,73.5],[167.9,59.0],[152.8,49.8],[135.6,46.2],[132.0,28.9],[122.7,13.8],[108.2,3.6]]},"summertime-sadness":{"x":11.96,"y":11.96,"w":203.66,"h":203.66,"v":[[87.9,2.4],[72.3,0.0],[61.8,1.6],[47.5,8.3],[36.5,19.6],[29.0,39.2],[31.3,60.1],[42.7,77.6],[57.6,87.0],[36.6,85.9],[21.9,91.6],[13.5,98.0],[2.4,115.8],[0.5,136.7],[5.5,151.6],[15.4,164.0],[24.1,169.9],[39.2,174.7],[55.0,173.9],[69.5,167.7],[81.0,156.9],[87.0,146.1],[85.3,161.8],[91.6,181.8],[101.9,193.7],[115.8,201.3],[131.4,203.6],[141.8,202.1],[156.1,195.3],[167.2,184.1],[174.7,164.5],[172.4,143.6],[160.9,126.0],[146.1,116.7],[167.0,117.7],[181.8,112.1],[190.2,105.7],[201.3,87.9],[203.2,67.0],[198.1,52.0],[188.3,39.7],[179.5,33.7],[164.5,29.0],[148.7,29.8],[134.2,36.0],[122.6,46.8],[116.7,57.6],[118.4,41.9],[112.1,21.9],[101.7,9.9]]},"ellipse":{"x":891.54,"y":93.0,"w":211.66,"h":207.39,"v":[[211.7,103.7],[209.6,124.1],[203.5,143.7],[193.6,161.7],[180.3,177.4],[164.2,190.2],[146.0,199.6],[126.3,205.4],[105.8,207.4],[85.4,205.4],[65.7,199.6],[47.5,190.2],[31.4,177.4],[18.1,161.7],[8.2,143.7],[2.1,124.1],[0,103.7],[2.1,83.3],[8.2,63.7],[18.1,45.7],[31.4,30.0],[47.5,17.2],[65.7,7.7],[85.4,2.0],[105.8,0],[126.3,2.0],[146.0,7.7],[164.2,17.2],[180.3,30.0],[193.6,45.7],[203.5,63.7],[209.6,83.3]]},"polygon":{"x":392.76,"y":97.43,"w":201.5,"h":219.36,"v":[[110.4,0],[201.4,64.4],[191.9,171.9],[91.1,219.4],[0.1,154.9],[9.6,47.5]]},"soft-star":{"x":208.72,"y":151.79,"w":151.58,"h":151.58,"v":[[111.9,1.0],[114.9,0.3],[115.8,3.3],[106.4,28.9],[104.0,42.3],[106.9,66.0],[120.5,89.4],[150.6,111.9],[151.3,114.9],[148.3,115.8],[112.6,104.3],[85.6,106.9],[62.1,120.5],[39.7,150.6],[36.7,151.3],[35.7,148.3],[45.2,122.7],[47.6,109.2],[44.7,85.6],[31.1,62.1],[1.0,39.7],[0.3,36.7],[3.3,35.7],[38.9,47.2],[66.0,44.7],[89.4,31.1]]},"star":{"x":1151.67,"y":126.5,"w":194.41,"h":202.98,"v":[[120.1,0],[129.7,70.9],[194.3,101.8],[129.7,132.2],[120.0,202.9],[70.7,151.0],[0.2,163.6],[34.2,100.9],[0.1,38.2],[70.5,51.5]]}};

  // Page-level scale (section height follows the design proportion)
  const updateSectionScale = () => {
    const ps = section.clientWidth / DESIGN_W;
    section.style.setProperty('--ps', ps);
    return ps;
  };
  updateSectionScale();

  if (reduceMotion) return; // keep the static composition

  const { Engine, Runner, Bodies, Body, Composite, Common, Mouse, MouseConstraint, Events, Sleeping } = Matter;
  if (window.decomp) Common.setDecomp(window.decomp);
  Common._seed = Math.floor(Math.random() * 233280); // Matter's RNG is seeded; vary the pile per visit

  section.classList.add('is-physics');
  const stage = document.createElement('div');
  stage.className = 'shapes-stage';
  section.appendChild(stage);

  let engine, runner, items = [], mouseConstraint = null;
  let dropped = false, visible = false, rafId = 0;

  function build() {
    teardown();
    // The shapes live in a clipped "stage" that ends exactly at the bottom of the
    // page but reaches EXTRA px upward, so pieces can fall in from above while
    // nothing ever pokes out below (no blank space to scroll into).
    const EXTRA = Math.round(Math.max(500, window.innerHeight * 0.7));
    stage.style.top = `${-EXTRA}px`;
    const W = section.clientWidth;
    const H = section.clientHeight + EXTRA;   // floor = bottom of the section
    const ps = updateSectionScale();
    const ss = Math.min(1.3, Math.max(0.36, ps * 0.92)); // shape scale follows the screen width (readable on phones, bigger on wide screens)

    engine = Engine.create({ enableSleeping: true });
    engine.gravity.y = 1.25;
    engine.positionIterations = 8;
    engine.velocityIterations = 6;

    // Floor + walls (thick, placed outside the visible area)
    const T = 400;
    const wallOpts = { isStatic: true, friction: 0.6, restitution: 0.2 };
    Composite.add(engine.world, [
      Bodies.rectangle(W / 2, H + T / 2, W * 3, T, wallOpts),            // floor
      Bodies.rectangle(-T / 2, H - 2000, T, 4000 + H * 2, wallOpts),       // left wall
      Bodies.rectangle(W + T / 2, H - 2000, T, 4000 + H * 2, wallOpts),    // right wall
    ]);

    // The six shapes (full size) plus a few smaller copies so they
    // tumble into a pile: big ones land first, small ones fill the gaps.
    // Big pieces in left→right order; four of them carry "Thanks for dropping by!"
    // and drop in reading order, so the sentence lands across the floor.
    const big = [
      ['soft-star', 1.15],
      ['summertime-sadness', 1, 'THANKS'],   // word shapes: size is worked out from the word below
      ['polygon', 1, 'FOR'],
      ['ellipse', 1, 'DROPPING'],
      ['soft-flower', 1, 'BY!'],
      ['star', 1],
    ];
    // Small shapes (no words) use other colours from the page's palette:
    // sage envelope, sunny yellow, pencil yellow, orange, warm coral, purple, blue
    const small = Common.shuffle([
      ['ellipse', 0.45, null, '8aa57a'], ['star', 0.62, null, 'ffc53d'],
      ['soft-flower', 0.6, null, 'ffb823'], ['polygon', 0.5, null, 'f47f2b'],
      ['summertime-sadness', 0.55, null, 'ff7f6b'], ['soft-star', 0.8, null, '8d60ca'],
      ['ellipse', 0.32, null, '3d99ee'],
    ]);
    // words drop first (in order), then the two plain big shapes, then the small ones
    const order = [
      ...big.filter((p) => p[2]),
      ...Common.shuffle(big.filter((p) => !p[2])),
      ...small,
    ];
    const SPAWN_EVERY = 220; // ms of simulation time between drops
    const t0 = engine.timing.timestamp;

    // One font size for every word; each word shape is sized to fit its word
    const WORD_PX = Math.max(14, 30 * ss);
    const ROOM = { 'summertime-sadness': 0.5, 'soft-flower': 0.55, polygon: 0.62, ellipse: 0.7 };

    order.forEach(([key, k, word, colour], i) => {
      const d = SHAPES[key];
      const isBig = k >= 1 || Boolean(word);
      if (word) {
        const needW = (word.length * 0.78 * WORD_PX) / (ROOM[key] || 0.6);   // shape width the word needs
        k = Math.max(1, needW / (d.w * ss));
      }
      const sc = ss * k;
      const verts = d.v.map(([x, y]) => ({ x: x * sc, y: y * sc }));
      const w = d.w * sc, h = d.h * sc;

      // Big pieces: one per slot across the width (roughly the design order), small ones anywhere
      let cx;
      if (isBig) {
        const slot = (big.findIndex((p) => p[0] === key) + 0.5) / big.length;
        cx = slot * W + Common.random(-0.03, 0.03) * W;
      } else {
        cx = Common.random(0.1, 0.9) * W;
      }
      cx = Math.min(W - w / 2 - 4, Math.max(w / 2 + 4, cx));
      const cy = EXTRA - h / 2 - 40 - Common.random(0, 60) * ss;   // just above the section

      const body = Bodies.fromVertices(cx, cy, [verts], {
        restitution: isBig ? 0.5 : 0.6,   // bounce (small pieces a bit livelier)
        friction: 0.3,
        frictionStatic: 0.7,
        frictionAir: 0.01,
        density: 0.0016,
        sleepThreshold: 50,
      }, true, 0.01, 8);

      // Offset from the body's centre of mass to the sprite's top-left (at angle 0)
      const offset = {
        x: body.bounds.min.x - body.position.x,
        y: body.bounds.min.y - body.position.y,
      };
      const bw = body.bounds.max.x - body.bounds.min.x;
      const bh = body.bounds.max.y - body.bounds.min.y;
      offset.x -= (w - bw) / 2;
      offset.y -= (h - bh) / 2;

      Body.setAngle(body, Common.random(-0.8, 0.8));
      Body.setAngularVelocity(body, Common.random(-0.08, 0.08));
      Body.setVelocity(body, { x: Common.random(-2, 2), y: Common.random(2, 5) });

      const el = document.createElement('div');
      el.className = 'shape-body';
      el.setAttribute('aria-hidden', 'true');
      const img = document.createElement('img');
      img.src = colour ? `assets/svg/shape-${key}-${colour}.svg` : `assets/svg/shape-${key}.svg`;
      img.alt = '';
      img.draggable = false;
      el.appendChild(img);
      let label = null;
      if (word) {
        label = document.createElement('span');
        label.className = 'shape-word';
        label.textContent = word;
        label.style.fontSize = `${WORD_PX}px`;   // same size for every word
        el.appendChild(label);
      }
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.visibility = 'hidden';
      stage.appendChild(el);

      items.push({ body, el, offset, label, spawnAt: t0 + i * SPAWN_EVERY, added: false });
    });

    // Release pieces one by one on the simulation clock (pauses with the runner)
    Events.on(engine, 'beforeUpdate', () => {
      const now = engine.timing.timestamp;
      for (const it of items) {
        if (!it.added && now >= it.spawnAt) {
          it.added = true;
          it.el.style.visibility = '';
          Composite.add(engine.world, it.body);
        }
      }
    });

    // Drag & throw on devices with a precise pointer (doesn't hijack touch scrolling)
    if (window.matchMedia('(pointer: fine)').matches) {
      const mouse = Mouse.create(section);
      Mouse.setOffset(mouse, { x: 0, y: EXTRA });   // section coords → stage coords
      ['wheel', 'mousewheel', 'DOMMouseScroll'].forEach((t) => mouse.element.removeEventListener(t, mouse.mousewheel));
      mouseConstraint = MouseConstraint.create(engine, {
        mouse,
        constraint: { stiffness: 0.18, damping: 0.1, render: { visible: false } },
      });
      Composite.add(engine.world, mouseConstraint);
      Events.on(mouseConstraint, 'startdrag', () => section.classList.add('is-dragging'));
      Events.on(mouseConstraint, 'enddrag', () => section.classList.remove('is-dragging'));
      section.classList.add('is-draggable');
    }

    runner = Runner.create();
    render();
  }

  function render() {
    for (const { body, el, offset, added, label } of items) {
      if (!added) continue;
      const { x, y } = body.position;
      el.style.transform = `translate(${x}px, ${y}px) rotate(${body.angle}rad) translate(${offset.x}px, ${offset.y}px)`;
      // keep the word readable: it counter-rotates so it always stays upright
      if (label) label.style.transform = `rotate(${-body.angle}rad)`;
    }
  }

  function loop() {
    render();
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (!engine) build();
    Runner.run(runner, engine);
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    if (runner) Runner.stop(runner);
    cancelAnimationFrame(rafId);
  }

  function teardown() {
    stop();
    items.forEach(({ el }) => el.remove());
    items = [];
    if (mouseConstraint) {
      Mouse.clearSourceEvents?.(mouseConstraint.mouse);
      const m = mouseConstraint.mouse;
      ['mousemove', 'mousedown', 'mouseup', 'touchmove', 'touchstart', 'touchend'].forEach((t) => {
        const h = { mousemove: m.mousemove, mousedown: m.mousedown, mouseup: m.mouseup, touchmove: m.mousemove, touchstart: m.mousedown, touchend: m.mouseup }[t];
        m.element.removeEventListener(t, h);
      });
      mouseConstraint = null;
    }
    if (engine) { Composite.clear(engine.world, false); Engine.clear(engine); }
    engine = null;
    section.classList.remove('is-draggable', 'is-dragging');
  }

  // Drop the shapes the first time the section scrolls into view;
  // pause the simulation whenever it's off-screen.
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      visible = entry.isIntersecting;
      if (visible && entry.intersectionRatio >= 0.35 && !dropped) {
        dropped = true;
        build();
        start();
      } else if (visible && dropped) {
        start();
      } else if (!visible) {
        stop();
      }
    }
  }, { threshold: [0, 0.35] });
  io.observe(section);

  // Rebuild on width changes (re-drops the shapes at the new scale)
  let lastW = section.clientWidth, resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (section.clientWidth === lastW) return;
      lastW = section.clientWidth;
      updateSectionScale();
      if (dropped) { build(); if (visible) start(); }
    }, 200);
  });

  // Small debug/replay hook: window.replayShapes()
  window.replayShapes = () => { dropped = true; build(); start(); };
})();
