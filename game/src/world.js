// The course: seeded target rings, the runway, and scenery anchors.
import { COURSE_LENGTH, RUNWAY_Z } from './config.js';

// Small deterministic PRNG so a seed always builds the same course.
export function makeRng(seed) {
  let s = (seed >>> 0) || 1;
  return function next() {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

// Ten rings strung along the course, wandering left, right, up and down.
export function buildCourse(seed) {
  const rng = makeRng(seed);
  const rings = [];
  let x = 0;
  let alt = 900;
  for (let i = 0; i < 10; i += 1) {
    const z = 520 + i * 540 + rng() * 160;
    x = clamp(x + (rng() - 0.5) * 260, -190, 190);
    alt = clamp(alt + (rng() - 0.5) * 620, 320, 1900);
    rings.push({ x, alt, z, state: 'open' });
  }
  const clouds = [];
  for (let i = 0; i < 46; i += 1) {
    clouds.push({
      x: (rng() - 0.5) * 1600,
      alt: 1500 + rng() * 1500,
      z: rng() * (COURSE_LENGTH + 900),
      scale: 0.6 + rng() * 1.5,
    });
  }
  const peaks = [];
  for (let i = 0; i < 26; i += 1) {
    peaks.push({ at: i / 26 + rng() * 0.02, h: 46 + rng() * 130, w: 90 + rng() * 170 });
  }
  return { rings, clouds, peaks, runwayZ: RUNWAY_Z, length: COURSE_LENGTH };
}

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

// Ground colour for a checkerboard field cell, by its grid coordinates.
export function fieldColour(cx, cz) {
  const palette = ['#5d8f3e', '#6fa34a', '#7fae52', '#a9a05a', '#8a9a4b', '#639544'];
  const n = Math.abs((cx * 31 + cz * 57) % palette.length);
  return palette[n];
}
