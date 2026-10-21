/* =========================================================
   Page behaviour: hero fit, stage scaling, bio floating shapes,
   stacked project cards, contact form
   ========================================================= */
(() => {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  // Breakpoints — same rem values as the RESPONSIVE section of styles.css
  const PHONE = window.matchMedia("(max-width: 37.4375rem)"); // ~320–599px
  const TABLET = window.matchMedia("(max-width: 63.9375rem)"); // ~600–1023px (and phones)
  const NARROW = PHONE; // phones only: stacked about card (tablet 600–1023px uses one layout)
  const remPx = () =>
    parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

  /* ---------- Stage scaling (project mockups, About me) ----------
     Each .stage-wrap declares its visible design width via --w.
     --s is exposed on the wrap and its parent so overlay text scales with it. */
  const wraps = [...document.querySelectorAll(".stage-wrap")];
  const setScale = (wrap) => {
    const w =
      parseFloat(getComputedStyle(wrap).getPropertyValue("--w")) || 1280;
    const s = wrap.clientWidth / w;
    wrap.style.setProperty("--s", s);
    wrap.parentElement.style.setProperty("--s", s);
  };
  const ro = new ResizeObserver((entries) =>
    entries.forEach((e) => setScale(e.target)),
  );
  wraps.forEach((w) => {
    setScale(w);
    ro.observe(w);
  });

  /* ---------- Hero: table bottom edge = screen bottom edge ----------
     The illustration is authored in Figma page coordinates, where the
     table spans y 763 → 839. We scale it so everything fits the screen,
     then anchor it so y 839 lands exactly on the hero's bottom edge.
     The table bar itself is stretched to the full screen width in CSS. */
  const hero = document.querySelector(".hero");
  const GIRL_SHIFT = 60; // Figma px
  // Tablet headline top: nav bottom + the Figma gap (nav ends y≈74, headline starts y=229
  // on the 768×1024 frame → 155px ≈ 15% of the screen height), never less than 2.5rem
  const tabletTitleTop = () => {
    const nav = hero.querySelector(".nav");
    const navBottom = nav
      ? nav.getBoundingClientRect().bottom - hero.getBoundingClientRect().top
      : 80;
    return navBottom + Math.max(2.5 * remPx(), 0.15 * window.innerHeight);
  };
  // Phones (phone Figma frame 448:649): the hero is no longer full-screen. Headline ≈12.8% of the
  // screen height below 'selina', the girl (sized like the tablet frame) 4.625rem under the headline,
  // and the hero ends at the table's bottom edge; the bio follows 2.125rem later.
  const layoutHeroPhone = () => {
    const W = hero.clientWidth,
      vh = window.innerHeight,
      rem = remPx(),
      TABLE_BOTTOM = 839;
    // same relative head size as the tablet Figma frame (1.0477× at 768px → W / 733),
    // so the girl scales smoothly from phone to tablet with no jump at 600px
    const s = W / 733;
    const title = hero.querySelector(".hero-title");
    const logo = hero.querySelector(".logo");
    const logoBottom = logo
      ? logo.getBoundingClientRect().bottom - hero.getBoundingClientRect().top
      : 51;
    const titleTop = logoBottom + Math.max(2.5 * rem, 0.128 * vh);
    title.style.top = `${titleTop}px`;
    const girlTop = titleTop + title.offsetHeight + 4.625 * rem; // = hair top (Figma y 196)
    const y = girlTop - 196 * s;
    hero.classList.add("is-stacked");
    hero.style.setProperty("--hs", s);
    hero.style.setProperty("--hx", "0px");
    hero.style.setProperty("--hgx", "0px");
    hero.style.setProperty("--hy", `${y}px`);
    hero.style.height = `${y + TABLE_BOTTOM * s}px`;
    const bioEl = document.querySelector(".bio");
    if (bioEl) bioEl.style.marginTop = `${2.125 * rem}px`;
  };
  const layoutHero = () => {
    if (!hero) return;
    if (PHONE.matches) {
      layoutHeroPhone();
      return;
    }
    hero.style.height = "";
    const W = hero.clientWidth;
    const H = hero.clientHeight;
    const TABLE_BOTTOM = 839;
    let s, x;
    // phones, and tablets held upright: headline on top, girl large and anchored left
    // (all tablet widths 600–1023px use the tablet Figma frame's stacked hero, any orientation)
    const stacked = PHONE.matches || TABLET.matches;
    hero.classList.toggle("is-stacked", stacked);
    // portrait tablets follow the tablet Figma frame (447:600): girl a bit smaller
    // (1.05× at 768px wide) and sitting ~24 Figma-px lower, so the table edge just runs off the screen
    const tabletStacked = stacked && !PHONE.matches;
    if (stacked) {
      // phones: girl stays large, anchored to the left like the design
      // (hands stay in view up to Figma x≈680; hair bleeds off the left edge as in the design)
      s = Math.min(H / TABLE_BOTTOM, W / (tabletStacked ? 733 : 680));
      x = 0;
      if (tabletStacked) {
        // Tablet: the table always sits on the bottom of the screen (like desktop). The head
        // grows with width (phone size at 600px → the tablet frame's 1.05× at 768px, then holds),
        // but on short windows it shrinks so the hair stays 2rem under the headline.
        const title = hero.querySelector(".hero-title");
        const need =
          tabletTitleTop() + (title ? title.offsetHeight : 0) + 2 * remPx();
        s = Math.min(
          W / 733,
          768 / 733,
          (H + 24 - need) / (TABLE_BOTTOM - 196),
        );
        x = Math.max(0, (W - 733 * s) / 2); // centre her when she's narrower than the screen
      }
    } else {
      // girl (x≈-55) … headline (x≈1207) must fit the width; table must fit the height
      s = Math.min(H / TABLE_BOTTOM, W / 1230, 1.6);
      x = (W - 1280 * s) / 2;
    }
    const y = H - TABLE_BOTTOM * s + (tabletStacked ? 24 : 0);
    hero.style.setProperty("--hs", s);
    hero.style.setProperty("--hx", `${x}px`);
    // girl sits a little further left than the Figma frame so the gap between her hair and
    // the headline (~5vw) matches the page's side margins; phones keep the Figma anchor
    hero.style.setProperty("--hgx", `${stacked ? x : x - GIRL_SHIFT * s}px`);
    hero.style.setProperty("--hy", `${y}px`);
    // the hands + pencil hang below the table (Figma y 839 → ~1004); when the girl is
    // drawn large (stacked layout) push the bio down so the pencil tip clears its text
    const bioEl = document.querySelector(".bio");
    if (bioEl) {
      const bioTextTop = 175 * Math.min(W / 1280, 1);
      // tablet: the pencil tip may tuck ~27px into the bio's top (as in the tablet Figma frame)
      const overhang = tabletStacked ? y + 1004 * s - 27 - H : 170 * s;
      bioEl.style.marginTop = stacked
        ? `${Math.max(0, overhang - bioTextTop)}px`
        : "";
    }
    // phones: centre the headline in the free space between the header and the girl's hair
    const title = hero.querySelector(".hero-title");
    if (title) {
      if (stacked) {
        const headerH = hero.querySelector(".site-header").offsetHeight;
        const hairTop = y + 196 * s;
        // tablet: fixed gap under the nav, as in the tablet Figma frame; phone: centred in the free space
        const top = tabletStacked
          ? tabletTitleTop()
          : (headerH + hairTop - title.offsetHeight) / 2;
        title.style.top = `${Math.max(headerH + 8, top)}px`;
      } else {
        title.style.top = "";
      }
    }
  };

  /* ---------- Bio: shapes drift apart and float at the screen edges ----------
     Scroll-linked: while the section is entering, the two shape groups
     slide from on top of the text out to the left/right sides of the
     screen and stay there, gently floating (CSS keyframes). Scrolling
     back up brings them back over the text. */
  const bio = document.querySelector(".bio");
  const left = bio?.querySelector('[data-drift="left"]');
  const right = bio?.querySelector('[data-drift="right"]');
  // Visible shape extents inside each group, in Figma px (stage coordinates)
  const L_SHAPES = { min: -32 + 332, max: -32 + 674 }; // star, hexagon, circle
  const R_SHAPES = { min: 537 + 45, max: 537 + 387 }; // soft star, flowers
  let bioTargets = { l: -340, r: 340 };

  const layoutBio = () => {
    if (!bio) return;
    const W = bio.clientWidth;
    const s = Math.min(W / 1280, 1);
    const bx = (W - 1280 * s) / 2;
    bio.style.setProperty("--s", s);
    bio.style.setProperty("--bx", `${bx}px`);

    // Screen edges and text edges, expressed in stage (Figma) px
    const VL = -bx / s;
    const VR = (W - bx) / s;
    const textW = Math.max(605, (21.25 * remPx()) / s); // = .bio-text width
    const TL = 640 - textW / 2;
    const TR = 640 + textW / 2;
    const gap = 24;

    const lw = L_SHAPES.max - L_SHAPES.min;
    let lRight = (VL + TL) / 2 + lw / 2; // centred in the left margin
    lRight = Math.min(lRight, TL - gap); // …but clear of the text
    lRight = Math.max(lRight, VL + lw * 0.45); // …and at least ~half on screen
    const rw = R_SHAPES.max - R_SHAPES.min;
    let rLeft = (TR + VR) / 2 - rw / 2;
    rLeft = Math.max(rLeft, TR + gap);
    rLeft = Math.min(rLeft, VR - rw * 0.45);

    bioTargets = { l: lRight - L_SHAPES.max, r: rLeft - R_SHAPES.min };
  };

  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const updateBio = () => {
    if (!bio || !left || !right) return;
    const r = bio.getBoundingClientRect();
    const vh = window.innerHeight;
    // 0 while the section's top is below 60% of the viewport, 1 once it reaches the top edge
    // phones: the bio is already on screen at load (hero no longer full-screen), so the shapes
    // finish drifting while its top moves from the screen's bottom edge to 85% of the height
    const raw = PHONE.matches
      ? (vh - r.top) / (vh * 0.15)
      : (vh * 0.6 - r.top) / (vh * 0.6);
    const p = reduceMotion ? 1 : ease(Math.min(1, Math.max(0, raw)));
    // tablet (Figma 447:600): shape groups 16% bigger and a little higher / further out
    // phone (Figma 448:649): 20% bigger, left group a little lower/right, right group in and up
    const tab = TABLET.matches && !PHONE.matches,
      ph = PHONE.matches;
    const k = tab ? 1 + 0.16 * p : ph ? 1 + 0.2 * p : 1;
    const [lx, ly, rx, ry] = tab
      ? [-63, -32, 30, -42]
      : ph
        ? [24, 6.4, -98.8, -44.3]
        : [0, 0, 0, 0];
    left.style.transform = `translate(${(bioTargets.l + lx) * p}px, ${(110 + ly) * p}px) rotate(${-8 * p}deg) scale(${k})`;
    right.style.transform = `translate(${(bioTargets.r + rx) * p}px, ${(-30 + ry) * p}px) rotate(${10 * p}deg) scale(${k})`;
  };

  /* ---------- Selected projects: stacked cards ----------
     Cards are position:sticky. Each new card slides up over the previous
     one; the covered cards shrink and dim a little so they read as a stack.
     Scrolling back up slides the top card away and reveals the previous. */
  const cards = [...document.querySelectorAll(".project-stack .project")];
  const OFFSET = 14; // px each stacked card peeks out above the one in front
  const workTitle = document.querySelector("#work-title");
  const first = document.querySelector(".project-first");
  const layoutCards = () => {
    const vh = window.innerHeight;
    const gap = first ? parseFloat(getComputedStyle(first).rowGap) || 0 : 0;
    const headH = workTitle ? workTitle.offsetHeight : 0;
    const cardH = cards[0] ? cards[0].offsetHeight : 0;
    // Cards stop near the top of the screen (the next card is already visible
    // below and slides up over it); the heading scrolls away above the first card.
    const cardTop = 1.5 * remPx();
    if (first)
      first.style.setProperty("--stick-top", `${cardTop - gap - headH}px`);
    cards.forEach((card, i) =>
      card.style.setProperty("--stick-top", `${cardTop + i * OFFSET}px`),
    );
  };
  const updateCards = () => {
    if (reduceMotion) return;
    cards.forEach((card, i) => {
      // how far the cards after this one have slid over it (0 … n)
      let depth = 0;
      for (let j = i + 1; j < cards.length; j++) {
        const next = cards[j];
        const stick =
          parseFloat(next.style.getPropertyValue("--stick-top")) || 0;
        const dist = next.getBoundingClientRect().top - stick;
        depth += 1 - Math.min(1, Math.max(0, dist / card.offsetHeight));
      }
      const scale = 1 - depth * 0.05;
      const dim = 1 - Math.min(depth, 2) * 0.08;
      card.style.transform = depth > 0.001 ? `scale(${scale})` : "";
      card.style.filter = depth > 0.001 ? `brightness(${dim})` : "";
    });
  };

  /* ---------- About me: the card just resizes ----------
     The flowers + girl keep their Figma positions relative to the card:
     they're one 1187×905 art box (card = its top 558px) that is scaled
     and anchored to the card. Wide screens: exact Figma layout scaled.
     Narrow screens: text on top, flowers + girl anchored to the card's
     bottom, still one card. */
  const aboutBlock = document.querySelector(".about-block");
  const layoutAbout = () => {
    if (!aboutBlock) return;
    const text = aboutBlock.querySelector(".about-text");
    const W = aboutBlock.clientWidth;
    const set = (k, v) => aboutBlock.style.setProperty(k, v);
    const rem = remPx();
    if (NARROW.matches) {
      // Phones: text on top at a readable size, flowers + girl below it, still one card.
      // Phone values follow the phone Figma frame: text inset 30 / 39px at 15px, 30px under the text,
      // girl nudged 32 Figma-px to the right of the flowers' centre.
      const ph = PHONE.matches;
      const padX = (ph ? 1.875 : 1.25) * rem,
        padY = (ph ? 2.4375 : 1.5) * rem;
      set("--tx", `${padX}px`);
      set("--tw", `${W - padX * 2}px`);
      set("--ty", `${padY}px`);
      set("--tshift", "0px");
      set("--tf", ph ? "0.9375rem" : "1rem");
      const textH = text.offsetHeight;
      // flowers (Figma x 610 → 1187) fill ~90% of the card width; flowers + girl centred
      // (girl's centre is at Figma x ≈ 893, the flowers' at ≈ 892)
      const as = Math.min((W * 0.9) / 577, 0.62);
      const flowersH = 558 * as;
      const cardH =
        padY + textH + (ph ? 1.875 * rem : padY * 0.8) + flowersH * 0.92;
      set("--as", as);
      set("--gx", `${ph ? 32 * as : 0}px`);
      set("--ax", `${W / 2 - 893 * as}px`);
      set("--ay", `${cardH - 558 * as}px`);
      set("--card-h", `${cardH}px`);
      set("--girl-overhang", `${(806.02 - 558) * as}px`);
      return;
    }
    // Tablet + desktop: same composition at every width — text on the left, flowers
    // on the right, the whole card just scales. The text keeps a readable minimum
    // size (1rem tablet) and the card grows a little taller to fit it.
    set("--gx", "0px");
    const as = W / 1187;
    const pad = Math.max(rem, 30 * as);
    set("--tx", `${52 * as}px`);
    set("--tw", `${560 * as}px`);
    set("--ty", "50%");
    set("--tshift", "-50%");
    set("--tf", `max(1rem, ${25 * as}px)`);
    const textH = text.offsetHeight;
    const cardH = Math.max(558 * as, textH + pad * 2);
    set("--as", as);
    set("--ax", "0px");
    set("--ay", `${cardH - 558 * as}px`);
    set("--card-h", `${cardH}px`);
    set("--girl-overhang", `${(806.02 - 558) * as}px`); // block ends at the girl's shoe bottom → envelope starts there
  };

  /* ---------- Frame loop for scroll-driven effects ---------- */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      updateBio();
      updateCards();
    });
  };
  const onResize = () => {
    layoutHero();
    layoutBio();
    layoutAbout();
    layoutCards();
    onScroll();
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  new ResizeObserver(onResize).observe(document.documentElement);
  onResize();
  document.fonts?.ready.then(onResize);

  /* ---------- Contact form → selinachu456@gmail.com ----------
     Sent with FormSubmit (https://formsubmit.co), no backend needed.
     The first ever submission triggers an activation email to that inbox;
     click "Activate Form" in it once and every later message is delivered. */
  const OWNER_EMAIL = "selinachu456@gmail.com";
  const form = document.getElementById("contact-form");
  if (form) {
    const status = form.querySelector(".form-status");
    const button = form.querySelector(".send-btn");
    const label = button.querySelector("span");
    const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    const fields = [
      ...form.querySelectorAll("input[required], textarea[required]"),
    ];
    fields.forEach((f) =>
      f.addEventListener("input", () => f.removeAttribute("aria-invalid")),
    );

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.className = "form-status";
      let firstBad = null;
      for (const field of fields) {
        const v = field.value.trim();
        const bad = !v || (field.type === "email" && !emailOk(v));
        field.setAttribute("aria-invalid", bad ? "true" : "false");
        if (bad && !firstBad) firstBad = field;
      }
      if (firstBad) {
        status.textContent =
          "Please fill in your name, a valid email and a message.";
        firstBad.focus();
        return;
      }
      if (form.elements._honey.value) return; // bot

      const data = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        message: form.elements.message.value.trim(),
        _replyto: form.elements.email.value.trim(),
        _subject: `Portfolio message from ${form.elements.name.value.trim()}`,
        _template: "table",
        _captcha: "false",
      };
      button.disabled = true;
      const oldLabel = label.textContent;
      label.textContent = "Sending…";
      try {
        const res = await fetch(`https://formsubmit.co/ajax/${OWNER_EMAIL}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(data),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || String(json.success) !== "true")
          throw new Error(json.message || res.statusText);
        status.textContent =
          "Thanks! Your message is on its way — I’ll get back to you soon.";
        status.classList.add("ok");
        form.reset();
        fields.forEach((f) => f.removeAttribute("aria-invalid"));
      } catch (err) {
        console.warn("Contact form:", err);
        const why =
          location.protocol === "file:"
            ? " (the page must be opened through a web server, not as a file)"
            : err && err.message
              ? ` (${err.message})`
              : "";
        status.textContent = `Sorry, the message couldn’t be sent${why}. Please email me at ${OWNER_EMAIL}.`;
      } finally {
        button.disabled = false;
        label.textContent = oldLabel;
      }
    });
  }

  /* ---------- Footer "Email": hover → "copy email", click → copied ---------- */
  const copyBtn = document.querySelector(".copy-email");
  if (copyBtn) {
    const tip = copyBtn.querySelector(".copy-tip");
    const address = copyBtn.dataset.email;
    let timer;
    const reset = () => {
      copyBtn.classList.remove("is-copied");
      tip.textContent = "copy email";
    };
    const copy = async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (_) {
        /* fall back */
      }
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (_) {
        ok = false;
      }
      ta.remove();
      return ok;
    };
    copyBtn.addEventListener("click", async () => {
      const ok = await copy(address);
      tip.textContent = ok ? "copied!" : address;
      copyBtn.classList.add("is-copied");
      clearTimeout(timer);
      timer = setTimeout(reset, 1800);
    });
    copyBtn.addEventListener("mouseleave", () => {
      clearTimeout(timer);
      timer = setTimeout(reset, 400);
    });
  }
  /* ---------- Phone menu: hamburger → sheet ---------- */
  const menuBtn = document.querySelector(".menu-btn");
  const sheet = document.getElementById("menu-sheet");
  if (menuBtn && sheet) {
    const closeBtn = sheet.querySelector(".menu-close");
    let scrim = null;
    const open = () => {
      sheet.classList.add("is-open");
      menuBtn.setAttribute("aria-expanded", "true");
      document.body.classList.add("menu-open");
      scrim = document.createElement("div");
      scrim.className = "menu-scrim";
      scrim.addEventListener("click", close);
      document.body.appendChild(scrim);
      setTimeout(() => closeBtn.focus(), 50);
    };
    const close = (returnFocus = true) => {
      if (!sheet.classList.contains("is-open")) return;
      sheet.classList.remove("is-open");
      menuBtn.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
      scrim?.remove();
      scrim = null;
      if (returnFocus === true) menuBtn.focus();
    };
    menuBtn.addEventListener("click", open);
    closeBtn.addEventListener("click", () => close());
    sheet
      .querySelectorAll("a")
      .forEach((a) => a.addEventListener("click", () => close(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
    PHONE.addEventListener("change", (e) => {
      if (!e.matches) close(false);
    });
  }
})();
