import { jsx } from "preact/jsx-runtime"

const style =
  ".particle-background{position:fixed;inset:0;z-index:-1;display:block;width:100vw;height:100vh;opacity:0;pointer-events:none}.particle-background.is-ready{opacity:1}.page:has(.particle-background){isolation:isolate}.page:has(.particle-background) .center{position:relative;z-index:0}.page:has(.particle-background) .left.sidebar,.page:has(.particle-background) .right.sidebar,.page:has(.particle-background) footer{position:relative;z-index:1}@media (prefers-reduced-motion: reduce){.particle-background{display:none}}"

const defaultOptions = {
  particleCount: 56,
  maxMobileParticles: 28,
  maxLinkDistance: 140,
  speed: 0.22,
  opacity: 0.55,
  mouseRadius: 190,
  mouseStrength: 0.01,
}

const ParticleBackground = (opts) => {
  const options = { ...defaultOptions, ...opts }
  const Component = ({ displayClass }) => {
    return jsx("canvas", {
      id: "particle-background",
      class: ["particle-background", displayClass].filter(Boolean).join(" "),
      "aria-hidden": "true",
      "data-particle-count": options.particleCount,
      "data-mobile-particle-count": options.maxMobileParticles,
      "data-link-distance": options.maxLinkDistance,
      "data-speed": options.speed,
      "data-opacity": options.opacity,
      "data-mouse-radius": options.mouseRadius,
      "data-mouse-strength": options.mouseStrength,
    })
  }

  Component.css = style
  Component.afterDOMLoaded = `
const initParticleBackground = () => {
const canvas = document.getElementById("particle-background");
if (!(canvas instanceof HTMLCanvasElement)) return;

const existing = window.__quartzParticleBackground;
if (existing?.canvas === canvas) return;
if (existing?.destroy) existing.destroy();
canvas.classList.remove("is-ready");

const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
if (reduceMotionQuery.matches) {
  canvas.hidden = true;
  window.__quartzParticleBackground = { canvas, destroy: () => {} };
  return;
}

const ctx = canvas.getContext("2d");
if (!ctx) return;

const state = {
  canvas,
  frame: 0,
  width: 0,
  height: 0,
  particles: [],
  running: !document.hidden,
  baseCount: Number(canvas.dataset.particleCount) || 56,
  mobileCount: Number(canvas.dataset.mobileParticleCount) || 28,
  linkDistance: Number(canvas.dataset.linkDistance) || 140,
  speed: Number(canvas.dataset.speed) || 0.22,
  opacity: Number(canvas.dataset.opacity) || 0.55,
  mouseRadius: Number(canvas.dataset.mouseRadius) || 190,
  mouseStrength: Number(canvas.dataset.mouseStrength) || 0.01,
  mouse: { x: 0, y: 0, active: false },
};

const colors = () => {
  const styles = getComputedStyle(document.documentElement);
  return {
    particle: styles.getPropertyValue("--secondary").trim() || "#284b63",
    line: styles.getPropertyValue("--tertiary").trim() || "#84a59d",
  };
};

const particleCount = () => {
  const compact = window.matchMedia("(max-width: 700px)").matches;
  return compact ? Math.min(state.baseCount, state.mobileCount) : state.baseCount;
};

const resize = () => {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = Math.floor(state.width * dpr);
  canvas.height = Math.floor(state.height * dpr);
  canvas.style.width = state.width + "px";
  canvas.style.height = state.height + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const targetCount = particleCount();
  while (state.particles.length < targetCount) {
    const angle = Math.random() * Math.PI * 2;
    const velocity = state.speed * (0.45 + Math.random() * 0.75);
    state.particles.push({
      x: Math.random() * state.width,
      y: Math.random() * state.height,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      baseVx: Math.cos(angle) * velocity,
      baseVy: Math.sin(angle) * velocity,
      radius: 1 + Math.random() * 1.6,
    });
  }
  state.particles.length = targetCount;
  canvas.classList.add("is-ready");
};

const draw = () => {
  if (!state.running) return;

  const palette = colors();
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.globalAlpha = state.opacity;
  const cursorParticles = [];

  for (const particle of state.particles) {
    if (state.mouse.active) {
      const dx = state.mouse.x - particle.x;
      const dy = state.mouse.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      if (distance < state.mouseRadius) {
        const influence = 1 - distance / state.mouseRadius;
        const orbit = state.mouseStrength * influence;
        particle.vx += ((dx / distance) * orbit + (-dy / distance) * orbit * 0.35);
        particle.vy += ((dy / distance) * orbit + (dx / distance) * orbit * 0.35);
        cursorParticles.push({ particle, distance, influence });
      }
    }

    particle.vx += (particle.baseVx - particle.vx) * 0.018;
    particle.vy += (particle.baseVy - particle.vy) * 0.018;

    const maxVelocity = Math.max(state.speed * 4, 0.7);
    const velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
    if (velocity > maxVelocity) {
      particle.vx = (particle.vx / velocity) * maxVelocity;
      particle.vy = (particle.vy / velocity) * maxVelocity;
    }

    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x < -10) particle.x = state.width + 10;
    if (particle.x > state.width + 10) particle.x = -10;
    if (particle.y < -10) particle.y = state.height + 10;
    if (particle.y > state.height + 10) particle.y = -10;

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fillStyle = palette.particle;
    ctx.fill();
  }

  ctx.lineWidth = 0.65;
  ctx.strokeStyle = palette.line;
  for (let i = 0; i < state.particles.length; i++) {
    const a = state.particles[i];
    for (let j = i + 1; j < state.particles.length; j++) {
      const b = state.particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > state.linkDistance) continue;
      ctx.globalAlpha = state.opacity * (1 - distance / state.linkDistance) * 0.38;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  if (state.mouse.active && cursorParticles.length > 0) {
    ctx.strokeStyle = palette.particle;
    ctx.lineWidth = 0.9;

    for (const { particle, influence } of cursorParticles) {
      ctx.globalAlpha = state.opacity * influence * 0.42;
      ctx.beginPath();
      ctx.moveTo(state.mouse.x, state.mouse.y);
      ctx.lineTo(particle.x, particle.y);
      ctx.stroke();
    }

    const maxCursorLinkDistance = state.mouseRadius * 0.72;
    ctx.lineWidth = 1;
    for (let i = 0; i < cursorParticles.length; i++) {
      const a = cursorParticles[i].particle;
      for (let j = i + 1; j < cursorParticles.length; j++) {
        const b = cursorParticles[j].particle;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > maxCursorLinkDistance) continue;
        const proximity = 1 - distance / maxCursorLinkDistance;
        const cursorInfluence = Math.min(cursorParticles[i].influence, cursorParticles[j].influence);
        ctx.globalAlpha = state.opacity * proximity * cursorInfluence * 0.9;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  state.frame = window.requestAnimationFrame(draw);
};

const start = () => {
  if (state.running) return;
  state.running = true;
  state.frame = window.requestAnimationFrame(draw);
};

const stop = () => {
  state.running = false;
  window.cancelAnimationFrame(state.frame);
};

const onVisibilityChange = () => {
  if (document.hidden) stop();
  else start();
};

const onPointerMove = (event) => {
  state.mouse.x = event.clientX;
  state.mouse.y = event.clientY;
  state.mouse.active = true;
};

const onPointerLeave = () => {
  state.mouse.active = false;
};

const destroy = () => {
  stop();
  window.removeEventListener("resize", resize);
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerleave", onPointerLeave);
  window.removeEventListener("blur", onPointerLeave);
  document.removeEventListener("visibilitychange", onVisibilityChange);
};

window.__quartzParticleBackground = { canvas, destroy };
window.addEventListener("resize", resize, { passive: true });
window.addEventListener("pointermove", onPointerMove, { passive: true });
window.addEventListener("pointerleave", onPointerLeave);
window.addEventListener("blur", onPointerLeave);
document.addEventListener("visibilitychange", onVisibilityChange);
resize();
if (state.running) state.frame = window.requestAnimationFrame(draw);
};

initParticleBackground();
document.addEventListener("nav", initParticleBackground);
`

  return Component
}

export default ParticleBackground
