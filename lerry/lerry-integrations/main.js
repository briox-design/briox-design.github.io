/* ── Mouse parallax on hero ── */
(function () {
  const hero        = document.getElementById('hero');
  const anchors     = hero.querySelectorAll('.chip-anchor');
  const robot       = document.getElementById('hero-robot');
  const MAX_MOVE    = 28; // px

  // Per-anchor lerp state
  const state = Array.from(anchors).map(() => ({ tx: 0, ty: 0, cx: 0, cy: 0 }));
  let robotCx = 0, robotCy = 0, robotTx = 0, robotTy = 0;
  let mouseX = 0, mouseY = 0, heroW = 0, heroH = 0, active = false;

  function onMouseMove(e) {
    const r = hero.getBoundingClientRect();
    heroW = r.width;
    heroH = r.height;
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
    active = true;
  }

  function onMouseLeave() {
    active = false; // targets drift back to 0
  }

  hero.addEventListener('mousemove', onMouseMove);
  hero.addEventListener('mouseleave', onMouseLeave);

  function lerp(a, b, t) { return a + (b - a) * t; }

  function tick() {
    const normX = heroW ? (mouseX / heroW - 0.5) * 2 : 0; // -1 … 1
    const normY = heroH ? (mouseY / heroH - 0.5) * 2 : 0;

    anchors.forEach((anchor, i) => {
      const depth = parseFloat(anchor.dataset.depth) || 1;
      const s = state[i];
      s.tx = active ? normX * MAX_MOVE * depth : 0;
      s.ty = active ? normY * MAX_MOVE * depth : 0;
      s.cx = lerp(s.cx, s.tx, 0.07);
      s.cy = lerp(s.cy, s.ty, 0.07);
      anchor.style.transform = `translate(${s.cx}px, ${s.cy}px)`;
    });

    // Robot moves subtly in opposite direction (counter-parallax)
    robotTx = active ? -normX * 8 : 0;
    robotTy = active ? -normY * 5 : 0;
    robotCx = lerp(robotCx, robotTx, 0.06);
    robotCy = lerp(robotCy, robotTy, 0.06);
    // Preserve the translateY(42%) base transform
    robot.style.transform = `translateX(${robotCx}px) translateY(calc(42% + ${robotCy}px)) translateZ(0)`;

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

/* ── Integration section observer ── */
const svgObject = document.getElementById('lerry-svg');
const sections  = document.querySelectorAll('.integration-section');
let currentSection = null;

function activateSvg(n) {
  const win = svgObject.contentWindow;
  if (win) win.postMessage({ activeSection: n }, '*');
}

function activateSection(el) {
  if (el === currentSection) return;
  if (currentSection) {
    const leaving = currentSection;
    leaving.classList.add('is-exiting');
    leaving.classList.remove('is-active');
    setTimeout(() => leaving.classList.remove('is-exiting'), 500);
  }
  el.classList.add('is-active');
  currentSection = el;
  activateSvg(parseInt(el.dataset.integration, 10));
}

function initObserver() {
  const observer = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) activateSection(e.target); }),
    { root: null, threshold: 0.6 }
  );
  sections.forEach(s => observer.observe(s));
}

svgObject.addEventListener('load', () => {
  activateSvg(1);
  requestAnimationFrame(() => {
    currentSection = sections[0];
    sections[0].classList.add('is-active');
  });
  initObserver();
});
