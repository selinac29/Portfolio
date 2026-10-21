/* =========================================================
   TEST PAGE ONLY (cards-test.html): 5 layout ideas for
   "Selected projects". ?v=1…5 picks one (default 1).
   ========================================================= */
(() => {
  const v = document.documentElement.dataset.cards || '1';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const section = document.querySelector('#work');
  const stack = section.querySelector('.project-stack');
  const title = section.querySelector('#work-title');
  const firstWrap = section.querySelector('.project-first');

  // heading above the cards, all four cards as direct siblings
  section.insertBefore(title, stack);
  if (firstWrap) { while (firstWrap.firstChild) stack.insertBefore(firstWrap.firstChild, firstWrap); firstWrap.remove(); }
  const cards = [...stack.querySelectorAll(':scope > .project')];
  cards.forEach((c, i) => c.style.setProperty('--i', i));
  const names = cards.map((c) => c.querySelector('h3')?.textContent.trim() || '');

  // switcher
  const labels = ['Papers on a desk', 'Folder tabs', 'Sketchbook', 'Fanned deck', 'Drawn-in grid', 'Flip pad', 'Unfold'];
  const sw = document.createElement('nav');
  sw.className = 'cards-switch';
  sw.setAttribute('aria-label', 'Card layout tests');
  sw.innerHTML = '<span>Test:</span>' + labels.map((l, i) =>
    `<a href="?v=${i + 1}#work" ${String(i + 1) === v ? 'aria-current="true"' : ''}>${i + 1} · ${l}</a>`).join('');
  document.body.appendChild(sw);

  // reveal when the cards scroll into view (1 and 5)
  const reveal = () => {
    if (reduce) { stack.classList.add('is-in'); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { stack.classList.add('is-in'); io.disconnect(); }
    }), { threshold: 0.25 });
    io.observe(stack);
  };

  if (v === '1') reveal();

  if (v === '2') {
    let z = cards.length;
    const activate = (card) => {
      if (card.classList.contains('is-active')) return;
      cards.forEach((c) => c.classList.remove('is-active'));
      card.style.setProperty('--z', ++z);
      card.classList.add('is-active');
    };
    cards.forEach((card, i) => {
      card.style.setProperty('--z', cards.length - i);
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'folder-tab';
      tab.textContent = names[i];
      tab.addEventListener('click', () => activate(card));
      tab.addEventListener('mouseenter', () => activate(card));
      card.appendChild(tab);
    });
    cards[0].classList.add('is-active');
    cards[0].style.setProperty('--z', ++z);
  }

  if (v === '3') {
    const pin = document.createElement('div');
    pin.className = 'book-pin';
    const book = document.createElement('div');
    book.className = 'book';
    cards.forEach((c, i) => { c.style.zIndex = cards.length - i; book.appendChild(c); });
    pin.appendChild(book);
    const hint = document.createElement('p');
    hint.className = 'book-hint';
    hint.textContent = 'scroll to turn the page';
    pin.appendChild(hint);
    stack.appendChild(pin);
    const size = () => { stack.style.height = `${window.innerHeight * (cards.length * 0.75 + 1)}px`; };
    const flip = () => {
      const r = stack.getBoundingClientRect();
      const range = r.height - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / range)) * (cards.length - 1);
      cards.forEach((c, i) => {
        const t = Math.min(1, Math.max(0, p - i));
        c.style.setProperty('--flip', `${-t * 165}deg`);
        c.style.setProperty('--fade', t > 0.85 ? String(1 - (t - 0.85) / 0.15) : '1');
      });
      hint.style.opacity = p >= cards.length - 1.05 ? '0' : '1';
    };
    size(); flip();
    window.addEventListener('resize', () => { size(); flip(); });
    window.addEventListener('scroll', flip, { passive: true });
  }

  if (v === '4') {
    const fan = () => {
      if (reduce) { stack.style.setProperty('--fan', 1); return; }
      const r = stack.getBoundingClientRect();
      const vh = window.innerHeight;
      // closed when the deck's top enters the screen, fully open when it's centred
      const p = (vh - r.top) / (vh * 0.5 + r.height * 0.5 - 0);
      stack.style.setProperty('--fan', Math.min(1, Math.max(0, p - 0.15)).toFixed(3));
    };
    fan();
    window.addEventListener('scroll', fan, { passive: true });
    window.addEventListener('resize', fan);
  }

  if (v === '5') {
    const NS = 'http://www.w3.org/2000/svg';
    cards.forEach((card) => {
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'sketch');
      svg.setAttribute('aria-hidden', 'true');
      const rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('pathLength', '1');
      svg.appendChild(rect);
      card.appendChild(svg);
      const fit = () => {
        const w = card.offsetWidth, h = card.offsetHeight;
        const rad = parseFloat(getComputedStyle(card).borderTopLeftRadius) || 20;
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        Object.entries({ x: 1, y: 1, width: w - 2, height: h - 2, rx: rad, ry: rad }).forEach(([k, val]) => rect.setAttribute(k, val));
      };
      new ResizeObserver(fit).observe(card);
      // pencil scribble under the project name
      const h3 = card.querySelector('h3');
      if (h3) {
        const s = document.createElementNS(NS, 'svg');
        s.setAttribute('class', 'title-scribble');
        s.setAttribute('viewBox', '0 0 104 10');
        s.setAttribute('aria-hidden', 'true');
        s.innerHTML = '<path pathLength="1" d="M2 6 C 20 2, 34 9, 52 5 S 86 2, 102 6"/>';
        h3.after(s);
      }
    });
    reveal();
  }

  if (v === '6') {
    const pin = document.createElement('div');
    pin.className = 'pad-pin';
    const pad = document.createElement('div');
    pad.className = 'pad';
    const leaves = cards.map((c, i) => {
      const leaf = document.createElement('div');
      leaf.className = 'leaf';
      leaf.style.zIndex = cards.length - i;
      leaf.appendChild(c);
      pad.appendChild(leaf);
      return leaf;
    });
    pin.appendChild(pad);
    const hint = document.createElement('p');
    hint.className = 'pad-hint';
    hint.textContent = 'scroll to flip';
    pin.appendChild(hint);
    stack.appendChild(pin);

    const FLIPS = cards.length - 1;          // pages that flip away
    const STEP = 0.7;                        // screen heights of scrolling per flip
    const size = () => { stack.style.height = `${window.innerHeight * (FLIPS * STEP + 1.9)}px`; };

    // FLIP-animate the change between the pad and the spread-out row
    let spread = false;
    const setSpread = (on) => {
      if (on === spread) return;
      spread = on;
      const before = leaves.map((l) => l.getBoundingClientRect());
      pad.classList.toggle('is-spread', on);
      if (on) cards.forEach((c) => { c.style.setProperty('--flip', '0deg'); c.style.setProperty('--fade', '1'); });
      const after = leaves.map((l) => l.getBoundingClientRect());
      if (reduce) return;
      leaves.forEach((l, i) => {
        const a = before[i], b = after[i];
        if (!b.width || !b.height) return;
        l.style.transition = 'none';
        l.style.transform = `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})`;
        l.getBoundingClientRect();
        l.style.transition = `transform .75s cubic-bezier(.3, 1.15, .5, 1) ${i * 0.06}s`;
        l.style.transform = '';
      });
      if (!on) update();
    };

    const update = () => {
      const r = stack.getBoundingClientRect();
      const scrolled = -r.top / window.innerHeight;          // in screen heights
      const p = Math.max(0, scrolled / STEP);                 // 0 … FLIPS = flips done
      if (!spread) {
        cards.forEach((c, i) => {
          const t = Math.min(1, Math.max(0, p - i));
          c.style.setProperty('--flip', `${t * 172}deg`);
          c.style.setProperty('--fade', t > 0.8 ? String(Math.max(0, 1 - (t - 0.8) / 0.2)) : '1');
        });
      }
      setSpread(p > FLIPS + 0.35);
    };
    size(); update();
    window.addEventListener('resize', () => { size(); update(); });
    window.addEventListener('scroll', update, { passive: true });
  }

  if (v === '7') {
    const fold = document.createElement('div');
    fold.className = 'fold';
    const leaves = cards.map((c) => {
      const leaf = document.createElement('div');
      leaf.className = 'fold-leaf';
      const back = document.createElement('div');
      back.className = 'fold-back';
      back.style.borderRadius = getComputedStyle(c).borderRadius;
      leaf.append(c, back);
      fold.appendChild(leaf);
      return leaf;
    });
    stack.appendChild(fold);
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const update = () => {
      const vh = window.innerHeight;
      leaves.forEach((leaf, i) => {
        if (i === 0) return;
        // hinge = this card's top edge: starts flipping when it reaches 90% of the
        // screen height, lies flat once it's at 50%
        const hinge = leaf.getBoundingClientRect().top;
        const t = reduce ? 1 : Math.min(1, Math.max(0, (vh * 0.9 - hinge) / (vh * 0.4)));
        leaf.style.setProperty('--a', `${180 * (1 - ease(t))}deg`);
        leaf.style.setProperty('--o', t <= 0 ? '0' : String(Math.min(1, t * 5)));
        leaf.style.visibility = t <= 0 ? 'hidden' : '';
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }
})();
