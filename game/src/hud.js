// Heads-up display and the lit instrument panel along the bottom.
import { VIEW_W, VIEW_H } from './config.js';
import { nextRing } from './flight.js';

export function drawHud(ctx, plane, course, score, seconds) {
  drawTopBar(ctx, plane, score, seconds);
  drawRingGuide(ctx, plane, course);
  drawPanel(ctx, plane);
  if (plane.stalled) drawStallWarning(ctx);
}

function drawTopBar(ctx, plane, score, seconds) {
  ctx.fillStyle = 'rgba(8,14,26,0.72)';
  roundRect(ctx, 18, 16, 440, 58, 10); ctx.fill();
  ctx.fillStyle = '#9fd8ff';
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillText('ALT', 34, 38);
  ctx.fillText('SPD', 152, 38);
  ctx.fillText('HDG', 268, 38);
  ctx.fillText('RINGS', 372, 38);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 26px system-ui, sans-serif';
  ctx.fillText(`${Math.round(plane.alt)} ft`, 34, 66);
  ctx.fillText(`${Math.round(plane.speed)} kt`, 152, 66);
  ctx.fillText(`${String(Math.round(plane.heading)).padStart(3, '0')}°`, 268, 66);
  ctx.fillText(`${score}/10`, 372, 66);
  ctx.fillStyle = 'rgba(8,14,26,0.72)';
  roundRect(ctx, VIEW_W - 168, 16, 150, 58, 10); ctx.fill();
  ctx.fillStyle = '#9fd8ff';
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillText('TIME', VIEW_W - 152, 38);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 26px system-ui, sans-serif';
  ctx.fillText(formatTime(seconds), VIEW_W - 152, 66);
}

function drawRingGuide(ctx, plane, course) {
  const ring = nextRing(course);
  ctx.font = '700 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  if (!ring) {
    ctx.fillStyle = 'rgba(8,14,26,0.72)';
    roundRect(ctx, VIEW_W / 2 - 190, 84, 380, 40, 10); ctx.fill();
    ctx.fillStyle = '#ffd873';
    ctx.fillText('Rings done — land on the runway ahead', VIEW_W / 2, 110);
    ctx.textAlign = 'left';
    return;
  }
  const dist = Math.max(0, Math.round(ring.z - plane.z));
  const dx = ring.x - plane.x;
  const dAlt = ring.alt - plane.alt;
  const arrow = Math.abs(dx) < 18 ? '▲' : dx > 0 ? '▶' : '◀';
  const vert = Math.abs(dAlt) < 60 ? 'level' : dAlt > 0 ? 'climb' : 'descend';
  ctx.fillStyle = 'rgba(8,14,26,0.72)';
  roundRect(ctx, VIEW_W / 2 - 190, 84, 380, 40, 10); ctx.fill();
  ctx.fillStyle = '#ffb02e';
  ctx.fillText(`Next ring ${arrow} ${dist} m · ${vert}`, VIEW_W / 2, 110);
  ctx.textAlign = 'left';
}

function drawPanel(ctx, plane) {
  const y = VIEW_H - 118;
  const grad = ctx.createLinearGradient(0, y, 0, VIEW_H);
  grad.addColorStop(0, '#232b3a');
  grad.addColorStop(1, '#11161f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, y, VIEW_W, 118);
  ctx.fillStyle = 'rgba(159,216,255,0.25)';
  ctx.fillRect(0, y, VIEW_W, 2);
  drawGauge(ctx, 150, y + 58, 44, 'SPD', plane.speed / 180, `${Math.round(plane.speed)}`);
  drawHorizon(ctx, 320, y + 58, 44, plane);
  drawGauge(ctx, 490, y + 58, 44, 'ALT', (plane.alt % 1000) / 1000, `${Math.round(plane.alt)}`);
  drawGauge(ctx, 660, y + 58, 44, 'VSI', 0.5 + plane.sink / 2400, `${Math.round(plane.sink)}`);
  drawThrottle(ctx, 800, y + 30, plane.throttle);
  drawCompass(ctx, 1150, y + 58, 44, plane.heading);
  ctx.fillStyle = '#8fa3bd';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText('Arrows/WASD fly · Shift throttle · R restart', 800, y + 96);
}

function drawGauge(ctx, cx, cy, r, label, frac, value) {
  ctx.fillStyle = '#0b0f16';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3d4a61'; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = '#9fd8ff'; ctx.lineWidth = 2;
  for (let i = 0; i <= 10; i += 1) {
    const a = Math.PI * 0.75 + (i / 10) * Math.PI * 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (r - 8), cy + Math.sin(a) * (r - 8));
    ctx.lineTo(cx + Math.cos(a) * (r - 3), cy + Math.sin(a) * (r - 3));
    ctx.stroke();
  }
  const a = Math.PI * 0.75 + Math.min(1, Math.max(0, frac)) * Math.PI * 1.5;
  ctx.strokeStyle = '#ffb02e'; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(a) * (r - 10), cy + Math.sin(a) * (r - 10));
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(value, cx, cy + 16);
  ctx.fillStyle = '#8fa3bd';
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.fillText(label, cx, cy + r - 6);
  ctx.textAlign = 'left';
}

function drawHorizon(ctx, cx, cy, r, plane) {
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  ctx.translate(cx, cy);
  ctx.rotate(-plane.bank);
  const shift = plane.pitch * r * 1.6;
  ctx.fillStyle = '#3f74b5';
  ctx.fillRect(-r * 1.6, -r * 1.6 + shift, r * 3.2, r * 1.6);
  ctx.fillStyle = '#7a5a33';
  ctx.fillRect(-r * 1.6, shift, r * 3.2, r * 1.6);
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-r * 1.6, shift); ctx.lineTo(r * 1.6, shift); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = '#3d4a61'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#ffb02e'; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 16, cy); ctx.lineTo(cx - 5, cy); ctx.lineTo(cx, cy + 5); ctx.lineTo(cx + 5, cy); ctx.lineTo(cx + 16, cy);
  ctx.stroke();
  ctx.fillStyle = '#8fa3bd';
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ATT', cx, cy + r - 6);
  ctx.textAlign = 'left';
}

function drawThrottle(ctx, x, y, throttle) {
  ctx.fillStyle = '#8fa3bd';
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.fillText('THROTTLE', x, y - 6);
  ctx.fillStyle = '#0b0f16';
  roundRect(ctx, x, y, 150, 14, 7); ctx.fill();
  ctx.fillStyle = throttle > 0.85 ? '#ff7a4d' : '#57e389';
  roundRect(ctx, x, y, 150 * throttle, 14, 7); ctx.fill();
}

function drawCompass(ctx, cx, cy, r, heading) {
  ctx.fillStyle = '#0b0f16';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3d4a61'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const dirs = ['N', 'E', 'S', 'W'];
  for (let i = 0; i < 4; i += 1) {
    const a = (i * 90 - heading) * (Math.PI / 180) - Math.PI / 2;
    ctx.fillText(dirs[i], cx + Math.cos(a) * (r - 13), cy + Math.sin(a) * (r - 13) + 5);
  }
  ctx.fillStyle = '#ffb02e';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r + 4); ctx.lineTo(cx - 5, cy - r + 13); ctx.lineTo(cx + 5, cy - r + 13);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8fa3bd';
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.fillText('HDG', cx, cy + 20);
  ctx.textAlign = 'left';
}

function drawStallWarning(ctx) {
  ctx.fillStyle = 'rgba(160,30,20,0.85)';
  roundRect(ctx, VIEW_W / 2 - 90, 70, 180, 38, 8); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('STALL', VIEW_W / 2, 96);
  ctx.textAlign = 'left';
}

export function drawOverlay(ctx, kind, score, seconds) {
  ctx.fillStyle = 'rgba(6,10,20,0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  if (kind === 'title') {
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 64px system-ui, sans-serif';
    ctx.fillText('SKY COURIER', VIEW_W / 2, 220);
    ctx.fillStyle = '#ffb02e';
    ctx.font = '800 30px system-ui, sans-serif';
    ctx.fillText('RING RUN', VIEW_W / 2, 262);
    ctx.fillStyle = '#dbe7f5';
    ctx.font = '600 20px system-ui, sans-serif';
    ctx.fillText('Thread all 10 rings, then land gently on the runway.', VIEW_W / 2, 322);
    ctx.font = '600 17px system-ui, sans-serif';
    ctx.fillText('Arrow keys or WASD: pitch and roll · Shift / Ctrl: throttle · mouse steers', VIEW_W / 2, 366);
    ctx.fillStyle = '#57e389';
    ctx.font = '800 22px system-ui, sans-serif';
    ctx.fillText('Press Enter to take off', VIEW_W / 2, 424);
  } else {
    const landed = kind === 'landed';
    ctx.fillStyle = landed ? '#57e389' : '#ff7a6b';
    ctx.font = '900 56px system-ui, sans-serif';
    ctx.fillText(landed ? 'LANDED!' : 'CRASHED', VIEW_W / 2, 250);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 24px system-ui, sans-serif';
    ctx.fillText(`Rings: ${score}/10 · Time: ${formatTime(seconds)}`, VIEW_W / 2, 310);
    ctx.fillStyle = '#dbe7f5';
    ctx.font = '600 18px system-ui, sans-serif';
    ctx.fillText(landed ? 'Clean delivery. The courier route is yours.' : 'Mind the sink rate and line up with the runway.', VIEW_W / 2, 352);
    ctx.fillStyle = '#57e389';
    ctx.font = '800 20px system-ui, sans-serif';
    ctx.fillText('Press R to fly again', VIEW_W / 2, 406);
  }
  ctx.textAlign = 'left';
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
