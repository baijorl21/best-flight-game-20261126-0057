// Sky Courier: Ring Run — game loop, states, and screenshot poses.
import { buildCourse } from './world.js';
import { newPlane, stepFlight, checkRings, flightOutcome } from './flight.js';
import { drawScene } from './render.js';
import { drawHud, drawOverlay } from './hud.js';
import { makeInput } from './input.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') ?? 7) || 7;
const shot = params.get('shot');
const input = makeInput(canvas);

let course;
let plane;
let score;
let seconds;
let state; // 'title' | 'flying' | 'landed' | 'crashed'

function reset() {
  course = buildCourse(seed);
  plane = newPlane();
  score = 0;
  seconds = 0;
  state = 'title';
}

function frame() {
  drawScene(ctx, plane, course, seconds);
  drawHud(ctx, plane, course, score, seconds);
  if (state !== 'flying') drawOverlay(ctx, state, score, seconds);
}

function tick(now, last) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
  const keys = input.read();
  if (state === 'title' && keys.start) state = 'flying';
  if ((state === 'landed' || state === 'crashed') && keys.restart) reset();
  if (state === 'flying') {
    const prevZ = plane.z;
    stepFlight(plane, keys, dt);
    score += checkRings(plane, course, prevZ);
    seconds += dt;
    const outcome = flightOutcome(plane, course);
    if (outcome !== 'flying') state = outcome;
  }
  frame();
  requestAnimationFrame((t) => tick(t, now));
}

// Fixed poses so the maker's screenshots show the game at its best.
function pose(name) {
  reset();
  if (name === 'cover') {
    state = 'flying';
    plane.z = 4080; plane.alt = 430; plane.x = -118;
    plane.bank = 0.3; plane.pitch = 0.04; plane.speed = 112; plane.heading = 357;
    plane.throttle = 0.62; plane.sink = 380;
    course.rings.forEach((r, i) => { if (i < 7) r.state = 'hit'; });
    score = 7; seconds = 83;
  } else if (name === 'play') {
    state = 'flying';
    plane.z = 1240; plane.alt = 950; plane.x = -62;
    plane.bank = -0.28; plane.pitch = -0.04; plane.speed = 98; plane.heading = 354;
    plane.throttle = 0.5; plane.sink = -420;
    course.rings.forEach((r, i) => { if (i < 2) r.state = 'hit'; });
    score = 2; seconds = 31;
  } else if (name === 'end') {
    state = 'landed';
    plane.z = 5940; plane.alt = 30; plane.x = 4;
    plane.bank = 0.02; plane.pitch = 0.01; plane.speed = 74; plane.heading = 1;
    plane.throttle = 0.18; plane.sink = -120;
    course.rings.forEach((r, i) => { r.state = i === 5 ? 'missed' : 'hit'; });
    score = 9; seconds = 132;
  } else {
    state = 'title';
    plane.z = 300; plane.alt = 980; plane.bank = 0.12; plane.pitch = 0.03;
    seconds = 0;
  }
  frame();
}

if (shot) {
  pose(shot);
} else {
  reset();
  requestAnimationFrame((t) => tick(t, t));
}
