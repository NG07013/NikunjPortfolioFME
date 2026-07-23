const canvas = document.getElementById("signalChart");

if (canvas) {
  const ctx = canvas.getContext("2d");
  const state = {
    points: [],
    paused: false,
    start: performance.now()
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function seed() {
    state.points = Array.from({ length: 72 }, (_, index) => {
      const t = index / 8;
      return {
        accuracy: 82 + Math.sin(t * 0.8) * 6 + Math.cos(t * 0.35) * 4,
        automation: 48 + index * 0.45 + Math.sin(t) * 7,
        reporting: 58 + Math.cos(t * 0.7) * 9 + Math.sin(t * 0.25) * 5
      };
    });
  }

  function pushPoint() {
    const t = (performance.now() - state.start) / 1000;
    const last = state.points[state.points.length - 1] || { automation: 70 };
    state.points.push({
      accuracy: 88 + Math.sin(t * 0.9) * 5 + Math.cos(t * 0.34) * 3,
      automation: Math.min(96, Math.max(42, last.automation + Math.sin(t * 1.2) * 1.2 + 0.18)),
      reporting: 62 + Math.cos(t * 0.8) * 8 + Math.sin(t * 0.28) * 6
    });
    state.points = state.points.slice(-72);
  }

  function drawSeries(points, key, color, top, height, width) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    points.forEach((point, index) => {
      const x = 32 + (index / (points.length - 1)) * (width - 64);
      const y = top + height - (point[key] / 100) * height;
      if (index === 0) ctx.moveTo(x, y);
      else {
        const prevX = 32 + ((index - 1) / (points.length - 1)) * (width - 64);
        ctx.bezierCurveTo(prevX + 16, y, x - 16, y, x, y);
      }
    });
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#071517");
    gradient.addColorStop(1, "#102a2d");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let y = 36; y < height - 28; y += 42) {
      ctx.beginPath();
      ctx.setLineDash([4, 8]);
      ctx.moveTo(28, y);
      ctx.lineTo(width - 28, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    drawSeries(state.points, "accuracy", "#45d6d2", 32, height - 70, width);
    drawSeries(state.points, "automation", "#f4c66d", 32, height - 70, width);
    drawSeries(state.points, "reporting", "#83e1b3", 32, height - 70, width);

    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "700 12px Inter, Arial, sans-serif";
    ctx.fillText("Operational data confidence", 28, 24);

    if (!state.paused) requestAnimationFrame(draw);
  }

  resize();
  seed();
  setInterval(() => {
    if (!state.paused) pushPoint();
  }, 650);
  new ResizeObserver(resize).observe(canvas);
  canvas.addEventListener("click", () => {
    state.paused = !state.paused;
    if (!state.paused) requestAnimationFrame(draw);
  });
  requestAnimationFrame(draw);
}

const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });
  reveals.forEach((element) => observer.observe(element));
} else {
  reveals.forEach((element) => element.classList.add("is-visible"));
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
const cursorDot = document.querySelector(".cursor-dot");
const cursorRing = document.querySelector(".cursor-ring");

if (!prefersReducedMotion && hasFinePointer && cursorDot && cursorRing) {
  document.body.classList.add("cursor-active");

  const cursor = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    ringX: window.innerWidth / 2,
    ringY: window.innerHeight / 2,
    lastTrail: 0
  };

  function moveCursor(event) {
    cursor.x = event.clientX;
    cursor.y = event.clientY;
    cursorDot.style.transform = `translate3d(${cursor.x}px, ${cursor.y}px, 0) translate(-50%, -50%)`;

    const now = performance.now();
    if (now - cursor.lastTrail > 42) {
      cursor.lastTrail = now;
      const trail = document.createElement("span");
      trail.className = "cursor-trail";
      trail.style.left = `${cursor.x}px`;
      trail.style.top = `${cursor.y}px`;
      document.body.appendChild(trail);
      trail.addEventListener("animationend", () => trail.remove(), { once: true });
    }
  }

  function renderCursorRing() {
    cursor.ringX += (cursor.x - cursor.ringX) * 0.18;
    cursor.ringY += (cursor.y - cursor.ringY) * 0.18;
    cursorRing.style.transform = `translate3d(${cursor.ringX}px, ${cursor.ringY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(renderCursorRing);
  }

  document.addEventListener("pointermove", moveCursor, { passive: true });
  document.addEventListener("pointerover", (event) => {
    if (event.target.closest("a, button, .chart-panel")) {
      document.body.classList.add("cursor-hover");
    }
  });
  document.addEventListener("pointerout", (event) => {
    if (event.target.closest("a, button, .chart-panel")) {
      document.body.classList.remove("cursor-hover");
    }
  });
  document.addEventListener("pointerleave", () => document.body.classList.remove("cursor-active"));
  document.addEventListener("pointerenter", () => document.body.classList.add("cursor-active"));

  requestAnimationFrame(renderCursorRing);
}
