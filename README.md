# Selina Chu — Portfolio (home page)

Plain HTML / CSS / JavaScript, built from Figma `portfolio-v1 › Home Page`.

Open `index.html` via a local server (e.g. `python3 -m http.server` in this folder, then http://localhost:8000),
or with the VS Code "Live Server" extension.

- `js/shapes-physics.js` — the "Shapes Bottom" Matter.js animation (gravity, floor + object collisions,
  bounce, settling, resting). Shapes can be dragged/thrown with a mouse. `window.replayShapes()` re-drops them.
- `js/main.js` — stage scaling, the Bio shapes drifting apart on scroll, contact form validation.
- `vendor/` — Matter.js 0.20.0 and poly-decomp 0.3.0 (local copies, no CDN needed).
- Contact form sends to selinachu456@gmail.com via FormSubmit — submit once and click "Activate Form" in the email it sends. Resume link is still a placeholder.

## Case studies
- `homescope.html` — HomeScope case study (Figma "Work Page 1"). Uses `styles.css` (shared header, contact form, footer, project card) + `work.css`; `js/work.js` highlights the active section in the left nav.
- The HomeScope card on the home page links to it.
