// Flight model: throttle, pitch, bank, and the course outcome checks.
import {
  MIN_SPEED, MAX_SPEED, CRUISE_SPEED, MAX_ALT, MAX_BANK, MAX_PITCH,
  RING_RADIUS, RUNWAY_HALF_WIDTH, LAND_MAX_SINK, LAND_MAX_SPEED,
} from './config.js';
import { clamp } from './world.js';

export function newPlane() {
  return {
    x: 0,            // metres left/right of the course centreline
    alt: 900,        // feet
    z: 0,            // metres flown
    heading: 0,      // degrees, 0 = north up the course
    speed: 96,       // knots
    throttle: 0.55,  // 0..1
    pitch: 0,        // radians, positive climbs
    bank: 0,         // radians, positive banks right
    sink: 0,         // feet per minute, negative descends
    stalled: false,
  };
}

// Advance the plane one step. input: {pitch, roll, throttle} each -1..1.
export function stepFlight(plane, input, dt) {
  plane.throttle = clamp(plane.throttle + input.throttle * dt * 0.7, 0, 1);
  const targetSpeed = CRUISE_SPEED + (plane.throttle - 0.55) * 150 - plane.pitch * 90;
  plane.speed += clamp(targetSpeed - plane.speed, -26 * dt, 20 * dt);
  plane.speed = clamp(plane.speed, 30, MAX_SPEED);

  plane.pitch = clamp(plane.pitch + input.pitch * dt * 0.9, -MAX_PITCH, MAX_PITCH);
  plane.pitch *= 1 - dt * 0.55; // gentle return toward level
  plane.bank = clamp(plane.bank + input.roll * dt * 2.4, -MAX_BANK, MAX_BANK);
  plane.bank *= 1 - dt * 0.9;

  plane.stalled = plane.speed < MIN_SPEED;
  const climbRate = plane.stalled ? -620 : Math.sin(plane.pitch) * plane.speed * 9.4;
  plane.sink = climbRate;
  plane.alt += (climbRate / 60) * dt;
  if (plane.alt > MAX_ALT) { plane.alt = MAX_ALT; plane.sink = Math.min(plane.sink, 0); }

  plane.heading = (plane.heading + plane.bank * dt * 26 + 360) % 360;
  const forward = plane.speed * 0.514; // knots to metres per second
  plane.z += Math.cos((plane.heading * Math.PI) / 180) * forward * dt;
  plane.x += Math.sin((plane.heading * Math.PI) / 180) * forward * dt;
  plane.x = clamp(plane.x, -420, 420);
  return plane;
}

// Score rings the plane has just crossed; returns how many were newly hit.
export function checkRings(plane, course, prevZ) {
  let hit = 0;
  for (const ring of course.rings) {
    if (ring.state !== 'open') continue;
    if (prevZ < ring.z && plane.z >= ring.z) {
      const dx = plane.x - ring.x;
      const dAlt = (plane.alt - ring.alt) * 0.3048; // feet to metres
      if (Math.hypot(dx, dAlt) <= RING_RADIUS) { ring.state = 'hit'; hit += 1; }
      else ring.state = 'missed';
    }
  }
  return hit;
}

// 'flying' while airborne; at ground level, 'landed' on the runway or 'crashed'.
export function flightOutcome(plane, course) {
  if (plane.alt > 0) return 'flying';
  const onRunway = plane.z >= course.runwayZ - 40 && Math.abs(plane.x) <= RUNWAY_HALF_WIDTH;
  const gentle = plane.sink >= -LAND_MAX_SINK && plane.speed <= LAND_MAX_SPEED;
  return onRunway && gentle ? 'landed' : 'crashed';
}

// The next ring still to fly through, or null when the runway is next.
export function nextRing(course) {
  return course.rings.find((r) => r.state === 'open') ?? null;
}
