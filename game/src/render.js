// Scene rendering: sky, mountains, patchwork terrain, rings, runway, aircraft.
import { VIEW_W, VIEW_H, HORIZON_Y, RING_RADIUS } from './config.js';
import { fieldColour, clamp } from './world.js';

const CX = VIEW_W / 2;
const FOCAL = 640; // pixels per metre at 640 m distance

function horizonY(plane) {
  return HORIZON_Y + plane.pitch * 300;
}

// Project a world point (x metres, alt feet, z metres) to screen space.
function project(plane, x, altFt, z) {
  const dz = z - plane.z;
  if (dz < 4) return null;
  const scale = FOCAL / dz;
  return {
    x: CX + (x - plane.x) * scale,
    y: horizonY(plane) + (plane.alt - altFt) * 0.3048 * scale,
    scale,
    dz,
  };
}

export function drawScene(ctx, plane, course, clock) {
  drawSky(ctx, plane);
  drawMountains(ctx, plane, course);
  drawGround(ctx, plane, course);
  drawRunway(ctx, plane, course);
  drawRings(ctx, plane, course, clock);
  drawClouds(ctx, plane, course);
  drawShadow(ctx, plane);
  drawAircraft(ctx, plane, clock);
}

function drawSky(ctx, plane) {
  const hy = horizonY(plane);
  const grad = ctx.createLinearGradient(0, 0, 0, Math.max(hy, 1));
  grad.addColorStop(0, '#274b8f');
  grad.addColorStop(0.55, '#5f93c9');
  grad.addColorStop(0.85, '#c9d9e8');
  grad.addColorStop(1, '#f2d9a7');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, Math.max(hy, 0));
  // Low sun, left of the course.
  const sunX = CX - 330 - plane.heading * 1.5;
  const sunY = hy - 88;
  const glow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 150);
  glow.addColorStop(0, 'rgba(255,236,180,0.95)');
  glow.addColorStop(0.25, 'rgba(255,214,120,0.45)');
  glow.addColorStop(1, 'rgba(255,214,120,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 150, sunY - 150, 300, 300);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath(); ctx.arc(sunX, sunY, 21, 0, Math.PI * 2); ctx.fill();
}

function drawMountains(ctx, plane, course) {
  const hy = horizonY(plane);
  const layers = [
    { par: 0.012, base: '#7d94b8', snow: '#e8eef7', lift: 26 },
    { par: 0.03, base: '#4d6a94', snow: '#dbe7f5', lift: 4 },
  ];
  for (const layer of layers) {
    ctx.fillStyle = layer.base;
    ctx.beginPath();
    ctx.moveTo(0, hy + 2);
    for (const peak of course.peaks) {
      const px = ((peak.at * (VIEW_W + 240) - plane.x * layer.par * 40 - plane.heading * layer.par * 90) % (VIEW_W + 240) + VIEW_W + 240) % (VIEW_W + 240) - 120;
      ctx.lineTo(px - peak.w / 2, hy + 2);
      ctx.lineTo(px, hy - peak.h - layer.lift);
      ctx.lineTo(px + peak.w / 2, hy + 2);
    }
    ctx.lineTo(VIEW_W, hy + 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = layer.snow;
    for (const peak of course.peaks) {
      const px = ((peak.at * (VIEW_W + 240) - plane.x * layer.par * 40 - plane.heading * layer.par * 90) % (VIEW_W + 240) + VIEW_W + 240) % (VIEW_W + 240) - 120;
      const topY = hy - peak.h - layer.lift;
      ctx.beginPath();
      ctx.moveTo(px - peak.w * 0.16, topY + peak.h * 0.22);
      ctx.lineTo(px, topY);
      ctx.lineTo(px + peak.w * 0.16, topY + peak.h * 0.22);
      ctx.lineTo(px + peak.w * 0.05, topY + peak.h * 0.16);
      ctx.lineTo(px - peak.w * 0.04, topY + peak.h * 0.2);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawGround(ctx, plane, course) {
  const hy = horizonY(plane);
  ctx.fillStyle = '#557f3a';
  ctx.fillRect(0, hy, VIEW_W, VIEW_H - hy);
  const segLen = 120;
  const firstSeg = Math.floor(plane.z / segLen);
  // Far segments first so near fields paint over them.
  for (let s = firstSeg + 42; s >= firstSeg; s -= 1) {
    const zNear = s * segLen;
    const zFar = zNear + segLen;
    const pNear = project(plane, 0, 0, zNear + 6);
    const pFar = project(plane, 0, 0, zFar);
    if (!pNear || !pFar) continue;
    for (let c = -7; c < 7; c += 1) {
      const x0 = c * 110;
      const x1 = x0 + 110;
      const a = project(plane, x0, 0, zNear + 6);
      const b = project(plane, x1, 0, zNear + 6);
      const d = project(plane, x1, 0, zFar);
      const e = project(plane, x0, 0, zFar);
      if (!a || !b || !d || !e) continue;
      ctx.fillStyle = fieldColour(c, s);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(d.x, d.y); ctx.lineTo(e.x, e.y);
      ctx.closePath(); ctx.fill();
    }
    // A river wandering down the left side of the course.
    const riverX = -300 + Math.sin(s * 0.7) * 60;
    const r0 = project(plane, riverX, 0, zNear + 6);
    const r1 = project(plane, riverX + 34, 0, zNear + 6);
    const r2 = project(plane, riverX + 34 + Math.sin((s + 1) * 0.7) * 8, 0, zFar);
    const r3 = project(plane, riverX + Math.sin((s + 1) * 0.7) * 8, 0, zFar);
    if (r0 && r1 && r2 && r3) {
      ctx.fillStyle = '#4d84b8';
      ctx.beginPath();
      ctx.moveTo(r0.x, r0.y); ctx.lineTo(r1.x, r1.y); ctx.lineTo(r2.x, r2.y); ctx.lineTo(r3.x, r3.y);
      ctx.closePath(); ctx.fill();
    }
    void pNear; void pFar;
  }
  void course;
}

function drawRunway(ctx, plane, course) {
  const z0 = course.runwayZ;
  const z1 = course.runwayZ + 900;
  const near = project(plane, 0, 0, z0);
  if (!near || near.dz > 3200) return;
  const corners = [
    project(plane, -26, 0, z0), project(plane, 26, 0, z0),
    project(plane, 26, 0, z1), project(plane, -26, 0, z1),
  ];
  if (corners.some((c) => !c)) return;
  ctx.fillStyle = '#3c4148';
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < 4; i += 1) ctx.lineTo(corners[i].x, corners[i].y);
  ctx.closePath(); ctx.fill();
  // Threshold bars and centreline dashes.
  ctx.fillStyle = '#eef2f5';
  for (let i = -3; i <= 3; i += 1) {
    if (i === 0) continue;
    const a = project(plane, i * 6.4 - 1.6, 0, z0 + 14);
    const b = project(plane, i * 6.4 + 1.6, 0, z0 + 14);
    const c = project(plane, i * 6.4 + 1.6, 0, z0 + 64);
    const d = project(plane, i * 6.4 - 1.6, 0, z0 + 64);
    if (a && b && c && d) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y);
      ctx.closePath(); ctx.fill();
    }
  }
  for (let z = z0 + 110; z < z1 - 60; z += 90) {
    const a = project(plane, -1.4, 0, z);
    const b = project(plane, 1.4, 0, z);
    const c = project(plane, 1.4, 0, z + 42);
    const d = project(plane, -1.4, 0, z + 42);
    if (a && b && c && d) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y);
      ctx.closePath(); ctx.fill();
    }
  }
  // Edge lights.
  ctx.fillStyle = '#ffd873';
  for (let z = z0; z <= z1; z += 120) {
    for (const side of [-29, 29]) {
      const p = project(plane, side, 0, z);
      if (p) { ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1.4, p.scale * 1.1), 0, Math.PI * 2); ctx.fill(); }
    }
  }
}

function drawRings(ctx, plane, course, clock) {
  const sorted = [...course.rings].sort((a, b) => b.z - a.z);
  for (const ring of sorted) {
    const p = project(plane, ring.x, ring.alt, ring.z);
    if (!p || p.dz > 2800) continue;
    const r = RING_RADIUS * p.scale;
    if (r < 2) continue;
    const pulse = 1 + Math.sin(clock * 3 + ring.z) * 0.03;
    const colour = ring.state === 'hit' ? '#57e389' : ring.state === 'missed' ? 'rgba(200,90,80,0.5)' : '#ffb02e';
    ctx.save();
    ctx.shadowColor = colour;
    ctx.shadowBlur = Math.min(26, r * 0.4);
    ctx.strokeStyle = colour;
    ctx.lineWidth = Math.max(2, r * 0.09);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, r * pulse, r * 0.94 * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = Math.max(1, r * 0.03);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, r * 0.86 * pulse, r * 0.8 * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawClouds(ctx, plane, course) {
  ctx.fillStyle = 'rgba(255,255,255,0.62)';
  for (const cloud of course.clouds) {
    const p = project(plane, cloud.x, cloud.alt, cloud.z);
    if (!p || p.dz > 3000 || p.dz < 500) continue;
    const r = 30 * cloud.scale * p.scale;
    if (r < 3) continue;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, r * 1.7, r * 0.5, 0, 0, Math.PI * 2);
    ctx.ellipse(p.x - r * 0.7, p.y + r * 0.12, r, r * 0.38, 0, 0, Math.PI * 2);
    ctx.ellipse(p.x + r * 0.75, p.y + r * 0.1, r * 1.1, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawShadow(ctx, plane) {
  const altM = plane.alt * 0.3048;
  const y = horizonY(plane) + clamp(altM * 1.15, 30, 330);
  const w = clamp(120 - altM * 0.16, 26, 120);
  ctx.fillStyle = 'rgba(20,30,16,0.35)';
  ctx.beginPath();
  ctx.ellipse(CX + plane.bank * 60, y, w, w * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Chase view: the aircraft from behind and slightly above, banking with the turn.
function drawAircraft(ctx, plane, clock) {
  const cx = CX + plane.bank * 46;
  const cy = 492 - plane.pitch * 60;
  const wing = 196;
  const dihedral = Math.sin(plane.bank) * 34;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(plane.bank * 0.55);
  // Wings.
  ctx.fillStyle = '#d7dde6';
  ctx.strokeStyle = '#5a6577';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-wing, 26 - dihedral);
  ctx.lineTo(-34, 6);
  ctx.lineTo(34, 6);
  ctx.lineTo(wing, 26 + dihedral);
  ctx.lineTo(wing - 14, 40 + dihedral);
  ctx.lineTo(30, 24);
  ctx.lineTo(-30, 24);
  ctx.lineTo(-wing + 14, 40 - dihedral);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // Wing stripes.
  ctx.fillStyle = '#e2543e';
  ctx.fillRect(-wing + 26, 24 - dihedral * 0.8, 34, 9);
  ctx.fillRect(wing - 60, 24 + dihedral * 0.8, 34, 9);
  // Fuselage.
  const body = ctx.createLinearGradient(0, -34, 0, 44);
  body.addColorStop(0, '#f4f7fb');
  body.addColorStop(0.5, '#c9d3e0');
  body.addColorStop(1, '#8d9bb0');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 8, 30, 42, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  // Canopy.
  ctx.fillStyle = '#2c4a6e';
  ctx.beginPath();
  ctx.ellipse(0, -12, 17, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(180,220,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(-5, -17, 7, 5, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // Tail fin and stabiliser.
  ctx.fillStyle = '#e2543e';
  ctx.beginPath();
  ctx.moveTo(-4, 34); ctx.lineTo(0, 6); ctx.lineTo(5, 34); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#d7dde6';
  ctx.beginPath();
  ctx.moveTo(-58, 44); ctx.lineTo(58, 44); ctx.lineTo(48, 54); ctx.lineTo(-48, 54);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // Propeller disc, blurred.
  ctx.strokeStyle = 'rgba(240,244,248,0.5)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0, -36, 30, 5, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Navigation lights: red left, green right, white strobe.
  ctx.fillStyle = '#ff4b4b';
  ctx.beginPath(); ctx.arc(-wing + 4, 30 - dihedral, 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3dff7a';
  ctx.beginPath(); ctx.arc(wing - 4, 30 + dihedral, 4.5, 0, Math.PI * 2); ctx.fill();
  if (Math.sin(clock * 6) > 0.55) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(0, 40, 4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
