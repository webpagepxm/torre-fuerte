/* Presentación de OPS. Sin acceso a sesión, órdenes, red ni datos del taller. */
const preferenceKey = "tf-ops-effects";
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const smallScreen = matchMedia("(max-width: 760px)");
const toggle = document.querySelector("#motionToggle");
let paused = false;
try {
  paused = localStorage.getItem(preferenceKey) === "paused";
} catch {
  /* Storage opcional. */
}
let timer = 0;
let raf = 0;
let disposed = false;
const start = performance.now();
const frames = [...document.querySelectorAll("[data-aurora]")].map(
  (element) => ({
    element,
    canvas: element.querySelector("canvas"),
    visible: false,
    gl: null,
    failed: false,
    width: 0,
    height: 0,
  }),
);

const vertex = `attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;
const fragment = `precision mediump float;
uniform vec2 resolution;
uniform vec2 size;
uniform float time;
float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 p = (uv - 0.5) * size;
  float edge = abs(roundedBox(p, size * 0.5 - 7.0, 12.0));
  float wave = 0.5 + 0.5 * sin(uv.x * 5.0 - uv.y * 2.0 + time * 0.85);
  vec3 cyan = vec3(0.06, 0.80, 0.90);
  vec3 blue = vec3(0.24, 0.39, 0.96);
  vec3 violet = vec3(0.59, 0.30, 0.96);
  vec3 color = mix(cyan, violet, smoothstep(0.0, 1.0, uv.x));
  color = mix(color, blue, wave * 0.45);
  float alpha = exp(-edge * 0.18) * (0.44 + wave * 0.15)
              + exp(-edge * 1.6) * 0.34;
  gl_FragColor = vec4(color, alpha);
}`;

function initialize(frame) {
  if (frame.failed || frame.gl) return;
  const gl = frame.canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: "low-power",
  });
  if (!gl) {
    frame.failed = true;
    return;
  }
  let program;
  const shaders = [];
  try {
    program = gl.createProgram();
    for (const [type, source] of [
      [gl.VERTEX_SHADER, vertex],
      [gl.FRAGMENT_SHADER, fragment],
    ]) {
      const shader = gl.createShader(type);
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw Error("Shader unavailable");
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw Error("Program unavailable");
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    Object.assign(frame, {
      gl,
      program,
      buffer,
      resolution: gl.getUniformLocation(program, "resolution"),
      size: gl.getUniformLocation(program, "size"),
      time: gl.getUniformLocation(program, "time"),
    });
    frame.element.dataset.renderer = "webgl";
  } catch {
    if (program) gl.deleteProgram(program);
    frame.failed = true; // Halo CSS visible; el portal sigue operativo.
  } finally {
    shaders.forEach((shader) => gl.deleteShader(shader));
  }
}

function resize(frame) {
  const { width, height } = frame.element.getBoundingClientRect();
  frame.width = width;
  frame.height = height;
  // Raster acotado, sin multiplicarlo por el DPR del teléfono.
  const scale = Math.min(
    1,
    640 / Math.max(width, 1),
    220 / Math.max(height, 1),
  );
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  if (frame.canvas.width !== w || frame.canvas.height !== h) {
    frame.canvas.width = w;
    frame.canvas.height = h;
  }
}
function canRun() {
  return (
    !disposed &&
    !paused &&
    !reduced.matches &&
    !document.hidden &&
    !document.querySelector("dialog[open]")
  );
}
function stop() {
  clearTimeout(timer);
  cancelAnimationFrame(raf);
  timer = 0;
  raf = 0;
}
function draw(now) {
  raf = 0;
  if (!canRun()) return;
  for (const frame of frames) {
    if (
      !frame.visible ||
      !frame.element.getClientRects().length ||
      frame.failed
    )
      continue;
    initialize(frame);
    const gl = frame.gl;
    if (!gl || gl.isContextLost()) continue;
    gl.viewport(0, 0, frame.canvas.width, frame.canvas.height);
    gl.uniform2f(frame.resolution, frame.canvas.width, frame.canvas.height);
    gl.uniform2f(frame.size, frame.width, frame.height);
    gl.uniform1f(frame.time, (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  if (
    frames.some(
      (f) => f.visible && !f.failed && f.element.getClientRects().length,
    )
  ) {
    timer = setTimeout(
      () => {
        timer = 0;
        raf = requestAnimationFrame(draw);
      },
      1000 / (smallScreen.matches ? 12 : 18),
    );
  }
}
function sync() {
  stop();
  const inactive = paused || reduced.matches;
  document.documentElement.classList.toggle("effects-paused", inactive);
  toggle.setAttribute("aria-pressed", String(inactive));
  const label = reduced.matches
    ? "Efectos pausados por movimiento reducido"
    : paused
      ? "Activar efectos visuales"
      : "Pausar efectos visuales";
  toggle.setAttribute("aria-label", label);
  toggle.title = label;
  toggle.disabled = reduced.matches;
  if (canRun()) raf = requestAnimationFrame(draw);
}
const visibility = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const frame = frames.find((f) => f.element === entry.target);
    frame.visible = entry.isIntersecting;
    if (frame.visible) resize(frame);
  }
  sync();
});
const sizing = new ResizeObserver((entries) => {
  for (const entry of entries)
    resize(frames.find((f) => f.element === entry.target));
  sync();
});
for (const frame of frames) {
  visibility.observe(frame.element);
  sizing.observe(frame.element);
  frame.canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    frame.failed = true;
    frame.gl = null;
    delete frame.element.dataset.renderer;
    sync();
  });
}
// Ocultar pestañas o abrir diálogos pausa el trabajo gráfico inmediatamente.
const surface = new MutationObserver(sync);
surface.observe(document.querySelector("main"), {
  subtree: true,
  attributes: true,
  attributeFilter: ["hidden", "open"],
});
document
  .querySelectorAll("dialog")
  .forEach((dialog) =>
    surface.observe(dialog, { attributes: true, attributeFilter: ["open"] }),
  );
toggle.addEventListener("click", () => {
  paused = !paused;
  try {
    localStorage.setItem(preferenceKey, paused ? "paused" : "active");
  } catch {
    /* Storage opcional. */
  }
  sync();
});
reduced.addEventListener("change", sync);
document.addEventListener("visibilitychange", sync);
window.addEventListener("pagehide", (event) => {
  stop();
  if (event.persisted) return;
  disposed = true;
  visibility.disconnect();
  sizing.disconnect();
  surface.disconnect();
  for (const frame of frames)
    if (frame.gl) {
      frame.gl.deleteBuffer(frame.buffer);
      frame.gl.deleteProgram(frame.program);
    }
});
window.addEventListener("pageshow", sync);
sync();
