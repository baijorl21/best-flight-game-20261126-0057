// Keyboard and mouse controls, read once per frame as -1..1 axes.
export function makeInput(canvas) {
  const keys = new Set();
  const mouse = { x: 0.5, y: 0.5, active: false };
  const press = { start: false, restart: false };

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    keys.add(e.key.toLowerCase());
    if (e.key === 'Enter' || e.key === ' ') press.start = true;
    if (e.key.toLowerCase() === 'r') press.restart = true;
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) / r.width;
    mouse.y = (e.clientY - r.top) / r.height;
    mouse.active = true;
  });
  canvas.addEventListener('pointerdown', () => { press.start = true; });

  function read() {
    let pitch = 0;
    let roll = 0;
    let throttle = 0;
    if (keys.has('arrowup') || keys.has('w')) pitch += 1;
    if (keys.has('arrowdown') || keys.has('s')) pitch -= 1;
    if (keys.has('arrowleft') || keys.has('a')) roll -= 1;
    if (keys.has('arrowright') || keys.has('d')) roll += 1;
    if (keys.has('shift')) throttle += 1;
    if (keys.has('control')) throttle -= 1;
    if (mouse.active && pitch === 0 && roll === 0) {
      roll = (mouse.x - 0.5) * 2.2;
      pitch = (0.5 - mouse.y) * 2.2;
    }
    const out = {
      pitch: clampAxis(pitch), roll: clampAxis(roll), throttle: clampAxis(throttle),
      start: press.start, restart: press.restart,
    };
    press.start = false;
    press.restart = false;
    return out;
  }
  return { read };
}

function clampAxis(v) {
  return v < -1 ? -1 : v > 1 ? 1 : v;
}
