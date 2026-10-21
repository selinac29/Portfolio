/* =========================================================
   Case-study page: side-nav scroll spy
   (when the user scrolls to a section, its nav item turns black to
    show the active section.)
   ========================================================= */
(() => {
  const links = [...document.querySelectorAll('.section-nav a[data-spy]')];
  if (!links.length) return;
  const sections = links.map((a) => document.getElementById(a.dataset.spy)).filter(Boolean);

  let ticking = false;
  const update = () => {
    ticking = false;
    const line = window.innerHeight * 0.35;   // a section is "active" once its top passes 35% of the screen
    let current = sections[0];
    for (const s of sections) {
      if (s.getBoundingClientRect().top <= line) current = s;
    }
    // at the very bottom of the page, highlight the last section
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      current = sections[sections.length - 1];
    }
    links.forEach((a) => {
      const on = a.dataset.spy === current.id;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

/* ---------- footer girl scale + contact dialog ---------- */
(() => {
  const footer = document.querySelector('.work-footer');
  if (footer) {
    // girl is 0.6416× the About-me girl at 1280px; scale with the screen, keep a readable minimum
    const fit = () => footer.style.setProperty('--gs', Math.min(0.6416, Math.max(0.42, 0.6416 * footer.clientWidth / 1280)));
    fit();
    window.addEventListener('resize', fit);
  }
  const dialog = document.getElementById('contact-dialog');
  if (!dialog) return;
  document.querySelectorAll('[data-open-contact]').forEach((b) => b.addEventListener('click', () => {
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
    dialog.querySelector('input:not([type=hidden]):not(.hp)')?.focus();
  }));
  dialog.querySelector('[data-close-contact]')?.addEventListener('click', () => dialog.close());
  // click on the dimmed backdrop closes it
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
})();

/* ---------- screen recordings (VendorHub flows, HomeScope phones) ----------
   Play while on screen, pause when scrolled away. Each video gets a small
   pause/play button in its top-right corner; once a visitor pauses one it
   stays paused (scrolling doesn't restart it) until they press play. */
(() => {
  const vids = [...document.querySelectorAll('.vh-video, .phone-video')];
  if (!vids.length) return;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ICON_PAUSE = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="2.5" width="3" height="11" rx="1"/><rect x="9.5" y="2.5" width="3" height="11" rx="1"/></svg>';
  const ICON_PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.8v10.4a.8.8 0 0 0 1.2.7l8.3-5.2a.8.8 0 0 0 0-1.4L5.7 2.1a.8.8 0 0 0-1.2.7z"/></svg>';
  const visible = new Set();

  vids.forEach((v) => {
    v.dataset.userPaused = still ? 'true' : 'false';   // reduced motion: wait for a click
    const holder = v.parentElement;                     // .phone or .vh-shot
    holder.removeAttribute('aria-hidden');               // the button must be reachable
    holder.classList.add('has-video-btn');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'video-btn';
    const label = (v.getAttribute('aria-label') || 'video').replace(/^Screen recording:\s*/, '');
    const sync = () => {
      const playing = !v.paused;
      btn.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
      btn.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} video: ${label}`);
    };
    btn.addEventListener('click', () => {
      if (v.paused) {
        v.dataset.userPaused = 'false';
        if (v.preload === 'none') v.preload = 'auto';
        v.play().catch(() => {});
      } else {
        v.dataset.userPaused = 'true';
        v.pause();
      }
    });
    v.addEventListener('play', sync);
    v.addEventListener('pause', sync);
    sync();
    holder.appendChild(btn);
  });

  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting) {
      visible.add(v);
      if (v.dataset.userPaused !== 'true') { if (v.preload === 'none') v.preload = 'auto'; v.play().catch(() => {}); }
    } else {
      visible.delete(v);
      v.pause();
    }
  }), { threshold: 0.35 });
  vids.forEach((v) => io.observe(v));
})();
