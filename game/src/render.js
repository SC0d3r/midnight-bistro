// The whole rooftop kitchen, painted with Canvas 2D: wall, window, stations, chef and regulars.
import { W, H, HUD_H, DECK_Y, PAL, BULBS, WINDOW, SEAT_DEFS, CAT, FONT } from './config.js';
import { hash2 } from './random.js';
import { drawIngredient, recipeById } from './recipes.js';
import { STATIONS } from './kitchen.js';
import { drawChef } from './player.js';
import { drawParticles } from './particles.js';
import { rr, circle, line, glow, withAlpha, text, clamp, project, heart, star } from './draw.js';

export function createCamera(x = 640, y = 400, zoom = 1) {
  return { x, y, zoom };
}

export function clampCamera(cam) {
  const halfW = W / (2 * cam.zoom);
  const halfH = H / (2 * cam.zoom);
  cam.x = clamp(cam.x, halfW, W - halfW);
  // Anchor near y 400: keep the visible world inside the painted room as far as possible.
  const top = 400 - halfH;
  const bottom = 400 + halfH;
  if (top < 0) cam.y += -top;
  if (bottom > H + 46) cam.y -= bottom - (H + 46);
  return cam;
}

export function applyCamera(ctx, game) {
  const cam = game.camera;
  const sh = game.shake || 0;
  const sx = Math.sin(game.time * 71) * sh * 0.7 + Math.sin(game.time * 31) * sh * 0.3;
  const sy = Math.cos(game.time * 59) * sh * 0.55;
  ctx.translate(640 + sx, 400 + sy);
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-cam.x, -cam.y);
}

function wallPanel(ctx) {
  const g = ctx.createLinearGradient(0, HUD_H, 0, 580);
  g.addColorStop(0, '#241823');
  g.addColorStop(0.5, '#2b1d25');
  g.addColorStop(1, '#1d1319');
  ctx.fillStyle = g;
  ctx.fillRect(0, HUD_H, W, 500);
  for (let x = 0; x < W; x += 54) {
    ctx.fillStyle = withAlpha('#f3bf6d', 0.018 + hash2(x, 3) * 0.016);
    ctx.fillRect(x, HUD_H, 2, 500);
  }
  // worn damask marks, subtle
  for (let i = 0; i < 26; i++) {
    const x = hash2(i, 11) * W;
    const y = 110 + hash2(i, 17) * 420;
    ctx.strokeStyle = withAlpha('#e8c99a', 0.03);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 9 + hash2(i, 5) * 12, 0.4, 3.4);
    ctx.stroke();
  }
  // wainscot rail
  ctx.fillStyle = '#1a1016';
  ctx.fillRect(0, 292, W, 10);
  ctx.fillStyle = withAlpha('#e8c99a', 0.16);
  ctx.fillRect(0, 292, W, 2);
}

function drawWindow(ctx, game) {
  const { x, y, w, h } = WINDOW;
  const t = game.time;
  // cool spill on the wall
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x + w * 0.55, y + h * 0.5, 300, '#5a93bd', 0.1);
  ctx.restore();
  // frame
  ctx.fillStyle = '#2a1a18';
  rr(ctx, x - 12, y - 12, w + 24, h + 24, 8);
  ctx.fill();
  ctx.fillStyle = '#5d3b2b';
  rr(ctx, x - 8, y - 8, w + 16, h + 16, 6);
  ctx.fill();
  ctx.fillStyle = '#3a2723';
  rr(ctx, x, y, w, h, 3);
  ctx.fill();
  ctx.save();
  rr(ctx, x + 4, y + 4, w - 8, h - 8, 2);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, '#132239');
  sky.addColorStop(0.48, '#1d3550');
  sky.addColorStop(0.78, '#28445c');
  sky.addColorStop(1, '#3a5163');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  // stars
  for (let i = 0; i < 26; i++) {
    const sx = x + hash2(i, 21) * (w - 20) + 10;
    const sy = y + 8 + hash2(i, 31) * h * 0.45;
    const a = 0.18 + hash2(i, 41) * 0.5;
    circle(ctx, sx, sy, hash2(i, 51) > 0.82 ? 1.5 : 1, withAlpha('#e8f1ea', a));
  }
  // moon
  const mx = x + w - 68;
  const my = y + 40;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, mx, my, 64, '#f6e6b8', 0.32);
  ctx.restore();
  circle(ctx, mx, my, 19, '#f6e8c4');
  circle(ctx, mx - 6, my - 4, 4, withAlpha('#d8c9a2', 0.6));
  circle(ctx, mx + 6, my + 5, 3, withAlpha('#d8c9a2', 0.5));
  circle(ctx, mx + 3, my - 7, 2, withAlpha('#d8c9a2', 0.45));
  // skyline
  let bx = x - 4;
  let i = 0;
  while (bx < x + w + 20) {
    const bw = 18 + hash2(i, 61) * 36;
    const bh = 38 + hash2(i, 71) * 74;
    const by = y + h - bh + 6;
    ctx.fillStyle = i % 3 === 0 ? '#101c28' : '#15232f';
    ctx.fillRect(bx, by, bw, bh);
    if (hash2(i, 81) > 0.55) {
      ctx.fillStyle = '#0d1721';
      ctx.fillRect(bx + bw * 0.5 - 2, by - 10, 4, 12);
    }
    for (let wy = 0; wy < 4; wy++) {
      for (let wx = 0; wx < 3; wx++) {
        if (hash2(i * 17 + wx, wy + 91) > 0.62) {
          ctx.fillStyle = withAlpha(hash2(i + wx, wy) > 0.75 ? '#f3c879' : '#c69a5d', 0.35 + hash2(wx, wy + i) * 0.45);
          ctx.fillRect(bx + 5 + wx * 8, by + 8 + wy * 13, 3.4, 5);
        }
      }
    }
    bx += bw + 3 + hash2(i, 101) * 7;
    i++;
  }
  // rain streaks
  for (const r of game.fx.rain) {
    const rx = x + 6 + ((r.x + t * r.speed * 0.018) % 1) * (w - 12);
    const ry = y + 6 + ((r.y + t * r.speed * 0.34) % 1) * (h - 12);
    ctx.strokeStyle = withAlpha('#c6e3ef', r.a);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 2.4, ry + r.len * h);
    ctx.stroke();
  }
  // slow drops
  for (const d of game.fx.drip) {
    const dx = x + 8 + d.x * (w - 16);
    const dy = y + 8 + ((d.y + t * 0.012) % 1) * (h - 30);
    ctx.fillStyle = withAlpha('#d8edf4', 0.28);
    ctx.beginPath();
    ctx.ellipse(dx, dy, 1.5, d.len * h * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // glass sheen
  ctx.fillStyle = withAlpha('#d7ecf4', 0.035);
  ctx.beginPath();
  ctx.moveTo(x + 20, y + h);
  ctx.lineTo(x + 120, y);
  ctx.lineTo(x + 176, y);
  ctx.lineTo(x + 70, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // mullions
  ctx.fillStyle = '#402c26';
  ctx.fillRect(x + w / 2 - 3, y, 6, h);
  ctx.fillRect(x, y + h * 0.52 - 3, w, 6);
  ctx.fillStyle = withAlpha('#f6e8cb', 0.1);
  ctx.fillRect(x + w / 2 - 3, y, 1.4, h);
  // sill
  ctx.fillStyle = '#4a3027';
  rr(ctx, x - 18, y + h + 8, w + 36, 14, 4);
  ctx.fill();
  ctx.fillStyle = '#6e4a34';
  rr(ctx, x - 14, y + h + 8, w + 28, 6, 3);
  ctx.fill();
  // basil pot on the sill
  drawPot(ctx, x + 62, y + h + 8, t);
  // window latch
  ctx.fillStyle = '#b98a4e';
  rr(ctx, x + w / 2 - 8, y + h * 0.52 + 4, 16, 5, 2);
  ctx.fill();
}

function drawPot(ctx, x, y, t) {
  ctx.fillStyle = '#9a5f3d';
  ctx.beginPath();
  ctx.moveTo(x - 15, y - 14);
  ctx.lineTo(x + 15, y - 14);
  ctx.lineTo(x + 10, y);
  ctx.lineTo(x - 10, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#b4744b';
  ctx.fillRect(x - 16, y - 16, 32, 5);
  ctx.fillStyle = '#3d6a3b';
  for (let i = 0; i < 7; i++) {
    const a = -1.9 + i * 0.32;
    ctx.save();
    ctx.translate(x, y - 18);
    ctx.rotate(a + Math.sin(t * 0.7 + i) * 0.02);
    ctx.beginPath();
    ctx.ellipse(9, 0, 10, 4.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 ? '#5d9647' : '#4a8039';
    ctx.fill();
    ctx.restore();
  }
}

function drawShelf(ctx, game) {
  const x0 = 462;
  const x1 = 852;
  const y = 202;
  // hanging rail and copper pans
  ctx.strokeStyle = '#2a1c17';
  ctx.lineWidth = 4;
  line(ctx, x0 + 6, 126, x1 - 10, 126, '#2a1c17', 4);
  ctx.strokeStyle = withAlpha('#d7a06a', 0.4);
  line(ctx, x0 + 6, 124, x1 - 10, 124, withAlpha('#d7a06a', 0.4), 1.2);
  for (let i = 0; i < 4; i++) {
    const px = x0 + 44 + i * 88;
    const sway = Math.sin(game.time * 0.8 + i * 1.7) * 0.012;
    ctx.save();
    ctx.translate(px, 128);
    ctx.rotate(sway);
    line(ctx, 0, 0, 0, 16, '#c9a06a', 1.6);
    ctx.fillStyle = '#b06a41';
    ctx.beginPath();
    ctx.ellipse(0, 32, 21, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cf8352';
    ctx.beginPath();
    ctx.ellipse(-3, 28, 17, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7d452d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 26, 13, 0.2, Math.PI - 0.2);
    ctx.stroke();
    line(ctx, 12, 26, 34, 18, '#3a2419', 4);
    ctx.fillStyle = withAlpha('#ffd8a2', 0.35);
    ctx.beginPath();
    ctx.ellipse(-8, 22, 6, 3, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // shelf plank
  ctx.fillStyle = '#3a2319';
  rr(ctx, x0, y, x1 - x0, 13, 3);
  ctx.fill();
  ctx.fillStyle = '#6b412b';
  rr(ctx, x0, y, x1 - x0, 7, 3);
  ctx.fill();
  ctx.fillStyle = withAlpha('#e8c99a', 0.25);
  ctx.fillRect(x0 + 4, y + 1.4, x1 - x0 - 8, 1.4);
  // brackets
  for (const bx of [x0 + 24, x1 - 26]) {
    ctx.strokeStyle = '#2a1c18';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx, y + 13);
    ctx.lineTo(bx, y + 30);
    ctx.lineTo(bx + 18, y + 13);
    ctx.stroke();
  }
  // jars
  const jars = [
    { x: x0 + 32, w: 28, h: 34, fill: '#d99a3e', label: 'HONEY' },
    { x: x0 + 72, w: 24, h: 30, fill: '#a9503f', label: 'CHILI' },
    { x: x0 + 108, w: 30, h: 38, fill: '#7c8f54', label: 'BASIL' },
    { x: x0 + 156, w: 22, h: 28, fill: '#e2d2b2', label: 'SALT' },
    { x: x0 + 214, w: 34, h: 26, fill: '#b8cbc4', label: 'MISO' },
    { x: x0 + 262, w: 26, h: 33, fill: '#5b7f8d', label: 'JAM' },
    { x: x0 + 308, w: 30, h: 30, fill: '#cf9a55', label: 'TEA' },
  ];
  for (const j of jars) {
    const by = y - j.h;
    ctx.fillStyle = withAlpha(j.fill, 0.82);
    rr(ctx, j.x, by, j.w, j.h, 4);
    ctx.fill();
    ctx.fillStyle = withAlpha('#f6e8cb', 0.2);
    ctx.fillRect(j.x + 3, by + 4, 4, j.h - 9);
    ctx.fillStyle = '#4a3325';
    rr(ctx, j.x - 2, by - 4, j.w + 4, 6, 2);
    ctx.fill();
    ctx.fillStyle = '#e8d8b8';
    ctx.fillRect(j.x + 4, by + j.h * 0.5, j.w - 8, 8);
    text(ctx, j.label, j.x + j.w / 2, by + j.h * 0.5 + 6, 4.6, '#4b3a2a', { font: 'ui', weight: 700, align: 'center' });
  }
  // a bowl of lemons and a small plant
  ctx.fillStyle = '#cfc2a6';
  ctx.beginPath();
  ctx.ellipse(x0 + 348, y - 7, 22, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 3; i++) drawIngredient(ctx, 'lemon', x0 + 338 + i * 11, y - 12 - (i % 2) * 4, 6);
  // shelf glow
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x0 + 120, y - 18, 130, '#f3bf6d', 0.06);
  ctx.restore();
}

function drawMenu(ctx, game) {
  const x = 884;
  const y = 112;
  const w = 352;
  const h = 180;
  ctx.fillStyle = '#2a1b17';
  rr(ctx, x - 9, y - 9, w + 18, h + 18, 6);
  ctx.fill();
  ctx.fillStyle = '#5c3a27';
  rr(ctx, x - 5, y - 5, w + 10, h + 10, 4);
  ctx.fill();
  const slate = ctx.createLinearGradient(0, y, 0, y + h);
  slate.addColorStop(0, '#25302f');
  slate.addColorStop(1, '#1b2424');
  ctx.fillStyle = slate;
  rr(ctx, x, y, w, h, 3);
  ctx.fill();
  for (let i = 0; i < 22; i++) {
    ctx.strokeStyle = withAlpha('#dfe8dc', 0.025);
    ctx.lineWidth = 1;
    const ly = y + 8 + hash2(i, 5) * (h - 16);
    ctx.beginPath();
    ctx.moveTo(x + 8, ly);
    ctx.lineTo(x + w - 8, ly);
    ctx.stroke();
  }
  text(ctx, 'TONIGHT', x + 24, y + 28, 17, '#e9e3cd', { font: 'serif', weight: 700, spacing: 3 });
  line(ctx, x + 24, y + 36, x + 118, y + 36, withAlpha('#e9e3cd', 0.45), 1);
  text(ctx, 'rooftop kitchen, open late', x + w - 20, y + 28, 8.5, withAlpha('#e9e3cd', 0.55), { font: 'serif', style: 'italic', align: 'right' });
  const rows = [
    ['margherita', 16],
    ['ramen', 15],
    ['pancakes', 13],
    ['noodles', 14],
    ['soup', 12],
    ['salmon', 18],
  ];
  rows.forEach(([id, price], i) => {
    const r = recipeById(id);
    const ry = y + 56 + i * 20;
    circle(ctx, x + 29, ry - 4, 4, r.color);
    text(ctx, r.short, x + 40, ry, 12.5, withAlpha('#f0ead4', 0.9), { font: 'serif' });
    ctx.strokeStyle = withAlpha('#f0ead4', 0.18);
    ctx.setLineDash([1.5, 3]);
    line(ctx, x + 168, ry - 3, x + w - 54, ry - 3, withAlpha('#f0ead4', 0.18), 1);
    ctx.setLineDash([]);
    text(ctx, '$' + price, x + w - 26, ry, 11.5, '#e8c98d', { font: 'mono', align: 'right' });
  });
  // chalk doodles
  star(ctx, x + w - 34, y + 92, 5, 5, 0.42, -1.3);
  ctx.strokeStyle = withAlpha('#f0ead4', 0.3);
  ctx.lineWidth = 1;
  ctx.stroke();
  text(ctx, 'ask about the soup', x + 26, y + h - 12, 8.2, withAlpha('#f0ead4', 0.4), { font: 'serif', style: 'italic' });
  // tiny light over the board
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x + w / 2, y - 2, 120, '#f3bf6d', 0.05);
  ctx.restore();
}

function drawBulbs(ctx, game) {
  const t = game.time;
  BULBS.forEach((bx, i) => {
    const sway = Math.sin(t * 0.55 + i * 2.1) * (0.012 + i * 0.003);
    ctx.save();
    ctx.translate(bx, HUD_H);
    ctx.rotate(sway);
    ctx.strokeStyle = '#1b1210';
    ctx.lineWidth = 2;
    line(ctx, 0, 0, 0, 46, '#1b1210', 2);
    ctx.fillStyle = '#b9863f';
    rr(ctx, -6, 44, 12, 10, 3);
    ctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, 0, 64, 54, '#f5c069', 0.22);
    glow(ctx, 0, 64, 150, '#e89b4a', 0.1);
    ctx.restore();
    circle(ctx, 0, 61, 9.5, '#f7d48b');
    circle(ctx, -2, 58, 5, '#fff3c9');
    line(ctx, -3, 64, 3, 64, withAlpha('#ffefbd', 0.9), 1.2);
    ctx.restore();
    // warm pool on the counter
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = withAlpha('#f3b45c', 0.05);
    ctx.beginPath();
    ctx.ellipse(bx, DECK_Y + 26, 150, 55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// ---------------------------------------------------------------- station backs

function drawFridge(ctx, game) {
  const x = 42;
  const w = 234;
  const top = 212;
  const bottom = DECK_Y + 4;
  ctx.fillStyle = 'rgba(14,9,12,0.5)';
  rr(ctx, x - 6, top + 6, w + 12, bottom - top, 12);
  ctx.fill();
  const body = ctx.createLinearGradient(x, 0, x + w, 0);
  body.addColorStop(0, '#274b4b');
  body.addColorStop(0.5, '#356361');
  body.addColorStop(1, '#1f3c3d');
  ctx.fillStyle = body;
  rr(ctx, x, top, w, bottom - top, 10);
  ctx.fill();
  ctx.strokeStyle = withAlpha('#a8d4cb', 0.18);
  ctx.lineWidth = 1.5;
  rr(ctx, x + 1, top + 1, w - 2, bottom - top - 2, 10);
  ctx.stroke();
  // header
  ctx.fillStyle = '#1b3233';
  rr(ctx, x + 8, top + 8, w - 16, 24, 5);
  ctx.fill();
  text(ctx, 'FRIDGE', x + w / 2, top + 25, 11, '#c7ded7', { weight: 700, spacing: 3, align: 'center' });
  circle(ctx, x + 22, top + 20, 2.2, '#8fb9b1');
  circle(ctx, x + w - 22, top + 20, 2.2, '#8fb9b1');
  // open interior
  const ix = x + 16;
  const iy = top + 40;
  const iw = w - 44;
  const ih = bottom - iy - 12;
  const cold = ctx.createLinearGradient(0, iy, 0, iy + ih);
  cold.addColorStop(0, '#dcefe8');
  cold.addColorStop(0.35, '#b7d9d1');
  cold.addColorStop(1, '#7fb1aa');
  ctx.fillStyle = cold;
  rr(ctx, ix, iy, iw, ih, 6);
  ctx.fill();
  ctx.save();
  rr(ctx, ix, iy, iw, ih, 6);
  ctx.clip();
  ctx.fillStyle = withAlpha('#4c7b77', 0.14);
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(ix, iy + 8 + i * 26, iw, 1.5);
  }
  // shelves
  const shelves = [iy + 72, iy + 124, iy + 176];
  for (const sy of shelves) {
    ctx.fillStyle = withAlpha('#edf7f2', 0.78);
    ctx.fillRect(ix + 4, sy, iw - 8, 4);
    ctx.fillStyle = withAlpha('#5f8d87', 0.35);
    ctx.fillRect(ix + 4, sy + 4, iw - 8, 2);
  }
  // top shelf: produce
  drawIngredient(ctx, 'tomato', ix + 22, iy + 54, 13);
  drawIngredient(ctx, 'tomato', ix + 42, iy + 57, 11);
  drawIngredient(ctx, 'mozzarella', ix + 68, iy + 55, 14);
  drawIngredient(ctx, 'basil', ix + 96, iy + 55, 14);
  drawIngredient(ctx, 'lemon', ix + 122, iy + 56, 11);
  drawIngredient(ctx, 'mushroom', ix + 143, iy + 57, 11);
  // middle shelf: jars and crates
  ctx.fillStyle = '#b98552';
  rr(ctx, ix + 8, iy + 96, 44, 27, 3);
  ctx.fill();
  drawIngredient(ctx, 'egg', ix + 20, iy + 106, 8);
  drawIngredient(ctx, 'egg', ix + 40, iy + 106, 8);
  drawIngredient(ctx, 'dough', ix + 78, iy + 110, 12);
  drawIngredient(ctx, 'mozzarella', ix + 108, iy + 110, 12);
  // jars
  for (let i = 0; i < 3; i++) {
    const jx = ix + 128 + i * 17;
    ctx.fillStyle = withAlpha(['#d7b45c', '#a9c48a', '#d0a0a0'][i], 0.9);
    rr(ctx, jx, iy + 97, 13, 25, 2);
    ctx.fill();
    ctx.fillStyle = '#6b4a2f';
    ctx.fillRect(jx - 1, iy + 94, 15, 4);
  }
  // bottom shelf: bowls and bottles
  drawIngredient(ctx, 'noodles', ix + 20, iy + 162, 13);
  drawIngredient(ctx, 'salmon', ix + 48, iy + 162, 13);
  drawIngredient(ctx, 'cream', ix + 74, iy + 162, 12);
  ctx.fillStyle = '#7d5c3c';
  rr(ctx, ix + 96, iy + 144, 16, 34, 4);
  ctx.fill();
  ctx.fillStyle = '#c8b18c';
  ctx.fillRect(ix + 100, iy + 150, 8, 10);
  ctx.fillStyle = '#546f4d';
  rr(ctx, ix + 118, iy + 142, 20, 36, 4);
  ctx.fill();
  // cold mist
  ctx.fillStyle = withAlpha('#eaf6ef', 0.09);
  ctx.beginPath();
  ctx.ellipse(ix + iw / 2, iy + ih - 8, iw * 0.5, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // rim glow and handles
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, ix + iw / 2, iy + ih / 2, 130, '#d6f0e6', 0.1);
  ctx.restore();
  ctx.strokeStyle = '#9dc4bb';
  ctx.lineWidth = 3;
  rr(ctx, ix + 1, iy + 1, iw - 2, ih - 2, 6);
  ctx.stroke();
  ctx.fillStyle = '#b6d2c9';
  rr(ctx, x + w - 20, top + 100, 5, 46, 3);
  ctx.fill();
  rr(ctx, x + w - 20, top + 166, 5, 46, 3);
  ctx.fill();
  // little frost vent
  ctx.fillStyle = withAlpha('#dff2ea', 0.5);
  for (let i = 0; i < 9; i++) {
    circle(ctx, ix + 6 + hash2(i, 4) * (iw - 12), iy + 10 + hash2(i, 8) * (ih - 20), 0.8 + hash2(i, 3), withAlpha('#eaf8f0', 0.16));
  }
}

function drawPrepBack(ctx, game) {
  const x = 298;
  const y = 296;
  const w = 214;
  const h = 138;
  ctx.fillStyle = '#33221d';
  rr(ctx, x, y, w, h, 6);
  ctx.fill();
  const board = ctx.createLinearGradient(0, y, 0, y + h);
  board.addColorStop(0, '#5b3b29');
  board.addColorStop(1, '#482e22');
  ctx.fillStyle = board;
  rr(ctx, x + 5, y + 5, w - 10, h - 10, 4);
  ctx.fill();
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 6; col++) {
      circle(ctx, x + 22 + col * 34, y + 24 + row * 23, 1.7, withAlpha('#d5b58c', 0.22));
    }
  }
  // hanging whisk, ladle, towel
  ctx.strokeStyle = '#c9b28e';
  ctx.lineWidth = 3;
  line(ctx, x + 218, y + 20, x + 218, y + 30, '#b08a5c', 3);
  ctx.fillStyle = '#d7d0bd';
  ctx.beginPath();
  ctx.ellipse(x + 62, y + 52, 12, 15, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7c4a2f';
  ctx.fillRect(x + 60, y + 26, 4, 16);
  ctx.strokeStyle = '#d7d0bd';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(x + 62 + (i - 1.5) * 3, y + 58, 4, 13, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#6b4a30';
  line(ctx, x + 100, y + 20, x + 100, y + 46, '#6b4a30', 4);
  ctx.fillStyle = '#b9a173';
  ctx.beginPath();
  ctx.ellipse(x + 100, y + 56, 14, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  // knife strip
  ctx.fillStyle = '#2d2019';
  rr(ctx, x + 128, y + 22, 64, 7, 3);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    const kx = x + 140 + i * 20;
    ctx.fillStyle = '#d4dad9';
    ctx.beginPath();
    ctx.moveTo(kx - 4, y + 32);
    ctx.lineTo(kx + 4, y + 32);
    ctx.lineTo(kx + 2, y + 54);
    ctx.lineTo(kx - 3, y + 54);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5c3a22';
    ctx.fillRect(kx - 3, y + 26, 6, 8);
  }
  // tea towel
  ctx.fillStyle = withAlpha('#d9c8a6', 0.9);
  ctx.beginPath();
  ctx.moveTo(x + 164, y + 62);
  ctx.quadraticCurveTo(x + 190, y + 58, x + 184, y + 96);
  ctx.lineTo(x + 154, y + 96);
  ctx.quadraticCurveTo(x + 158, y + 72, x + 164, y + 62);
  ctx.fill();
  ctx.strokeStyle = withAlpha('#3f9189', 0.6);
  ctx.lineWidth = 2;
  line(ctx, x + 158, y + 78, x + 184, y + 78, withAlpha('#3f9189', 0.6), 2);
  text(ctx, 'PREP', x + w / 2, y + h - 10, 9, withAlpha('#e8d8b8', 0.62), { weight: 700, spacing: 3, align: 'center' });
}

function drawStoveBack(ctx, game) {
  const x = 532;
  const w = 198;
  // hood
  ctx.fillStyle = '#2b292b';
  ctx.beginPath();
  ctx.moveTo(x + 14, 238);
  ctx.lineTo(x + w - 14, 238);
  ctx.lineTo(x + w - 2, 306);
  ctx.lineTo(x + 2, 306);
  ctx.closePath();
  ctx.fill();
  const copper = ctx.createLinearGradient(x, 238, x + w, 306);
  copper.addColorStop(0, '#8e4e30');
  copper.addColorStop(0.4, '#c47a4c');
  copper.addColorStop(0.75, '#9c5734');
  copper.addColorStop(1, '#6e3d27');
  ctx.fillStyle = copper;
  ctx.beginPath();
  ctx.moveTo(x + 20, 244);
  ctx.lineTo(x + w - 20, 244);
  ctx.lineTo(x + w - 10, 296);
  ctx.lineTo(x + 10, 296);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = withAlpha('#ffd5a2', 0.35);
  ctx.lineWidth = 1.4;
  line(ctx, x + 26, 250, x + w - 26, 250, withAlpha('#ffd5a2', 0.35), 1.4);
  line(ctx, x + 30, 254, x + 76, 292, withAlpha('#ffd5a2', 0.14), 6);
  // hood rail with utensils
  const railY = 300;
  line(ctx, x + 4, railY, x + w - 4, railY, '#2a201c', 4);
  line(ctx, x + 4, railY - 1, x + w - 4, railY - 1, withAlpha('#e0b47c', 0.25), 1);
  for (let i = 0; i < 3; i++) {
    const ux = x + 46 + i * 52;
    line(ctx, ux, railY, ux, railY + 12, '#b9905b', 1.6);
    ctx.fillStyle = '#b9bdb8';
    if (i === 0) {
      ctx.beginPath();
      ctx.ellipse(ux, railY + 26, 9, 13, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (i === 1) {
      ctx.fillRect(ux - 2.5, railY + 12, 5, 28);
      ctx.beginPath();
      ctx.ellipse(ux, railY + 42, 6, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(ux - 7, railY + 12);
      ctx.lineTo(ux + 7, railY + 12);
      ctx.lineTo(ux + 4, railY + 38);
      ctx.lineTo(ux - 4, railY + 38);
      ctx.closePath();
      ctx.fill();
    }
  }
  // backsplash tile
  ctx.fillStyle = '#3b3a3a';
  ctx.fillRect(x + 6, 312, w - 12, 44);
  for (let i = 0; i < 9; i++) {
    ctx.strokeStyle = withAlpha('#f0e2c4', 0.07);
    ctx.strokeRect(x + 8 + i * 21, 316, 20, 18);
    ctx.strokeRect(x + 8 + i * 21, 336, 20, 18);
  }
  // range body
  const body = ctx.createLinearGradient(0, 356, 0, 458);
  body.addColorStop(0, '#3a393e');
  body.addColorStop(1, '#222226');
  ctx.fillStyle = body;
  rr(ctx, x + 2, 356, w - 4, 102, 7);
  ctx.fill();
  ctx.strokeStyle = withAlpha('#e8dcc2', 0.12);
  ctx.lineWidth = 1.4;
  rr(ctx, x + 6, 360, w - 12, 94, 5);
  ctx.stroke();
  // oven door with warm window
  ctx.fillStyle = '#161619';
  rr(ctx, x + 22, 378, w - 44, 46, 4);
  ctx.fill();
  ctx.fillStyle = withAlpha('#e8944d', 0.35);
  rr(ctx, x + 30, 384, w - 60, 34, 3);
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x + w / 2, 402, 48, '#f3a854', 0.16);
  ctx.restore();
  ctx.fillStyle = '#9c958a';
  rr(ctx, x + w / 2 - 16, 372, 32, 5, 2);
  ctx.fill();
  // knobs
  for (let i = 0; i < 4; i++) {
    circle(ctx, x + 42 + i * 37, 444, 5, '#151517');
    circle(ctx, x + 42 + i * 37, 444, 3.4, '#b3aea0');
    line(ctx, x + 42 + i * 37, 444, x + 42 + i * 37 + 2, 440, '#2b2b2b', 1.4);
  }
  text(ctx, 'STOVE', x + w / 2, 352, 9, withAlpha('#e8d8b8', 0.55), { weight: 700, spacing: 3, align: 'center' });
}

function drawOvenBack(ctx, game) {
  const x = 782;
  const y = 292;
  const w = 182;
  const h = 164;
  // brick shell
  ctx.fillStyle = '#3d231b';
  rr(ctx, x - 4, y - 4, w + 8, h + 8, 10);
  ctx.fill();
  const brick = ctx.createLinearGradient(0, y, 0, y + h);
  brick.addColorStop(0, '#9a5a3e');
  brick.addColorStop(1, '#6d3c2b');
  ctx.fillStyle = brick;
  rr(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.save();
  rr(ctx, x + 2, y + 2, w - 4, h - 4, 7);
  ctx.clip();
  ctx.strokeStyle = withAlpha('#2e1a14', 0.4);
  ctx.lineWidth = 1.6;
  for (let row = 0; row < 8; row++) {
    const by = y + row * 21;
    ctx.beginPath();
    ctx.moveTo(x, by);
    ctx.lineTo(x + w, by);
    ctx.stroke();
    for (let col = 0; col < 5; col++) {
      const off = (row % 2) * 18;
      ctx.beginPath();
      ctx.moveTo(x + off + col * 38, by);
      ctx.lineTo(x + off + col * 38, by + 21);
      ctx.stroke();
    }
  }
  ctx.restore();
  // arch opening
  const ax = x + 28;
  const ay = y + 42;
  const aw = w - 56;
  const ah = h - 56;
  ctx.fillStyle = '#27130f';
  ctx.beginPath();
  ctx.moveTo(ax, ay + ah);
  ctx.lineTo(ax, ay + 30);
  ctx.arc(ax + aw / 2, ay + 30, aw / 2, Math.PI, 0);
  ctx.lineTo(ax + aw, ay + ah);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.clip();
  const fireG = ctx.createRadialGradient(ax + aw / 2, ay + ah, 4, ax + aw / 2, ay + ah, aw * 0.8);
  fireG.addColorStop(0, '#ffb15c');
  fireG.addColorStop(0.4, '#c2562f');
  fireG.addColorStop(1, '#451b14');
  ctx.fillStyle = fireG;
  ctx.fillRect(ax, ay, aw, ah);
  // stone and pizza
  ctx.fillStyle = '#4d3a30';
  ctx.beginPath();
  ctx.ellipse(ax + aw / 2, ay + ah - 12, aw * 0.42, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  const px = ax + aw / 2;
  const py = ay + ah - 16;
  circle(ctx, px, py, 25, '#d9ab68');
  circle(ctx, px, py, 21, '#bd6a44');
  for (let i = 0; i < 6; i++) {
    const a = i * 1.1;
    circle(ctx, px + Math.cos(a) * 11, py + Math.sin(a) * 7, 4.5, '#f0dfab');
  }
  for (let i = 0; i < 4; i++) {
    const a = i * 1.6 + 0.4;
    ctx.save();
    ctx.translate(px + Math.cos(a) * 8, py + Math.sin(a) * 6);
    ctx.rotate(a);
    ctx.fillStyle = '#5f9145';
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.5, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // flames
  for (let i = 0; i < 5; i++) {
    const fx = ax + 24 + i * 22 + Math.sin(game.time * 8 + i) * 2;
    const fh = 16 + Math.sin(game.time * 11 + i * 1.7) * 8;
    ctx.fillStyle = withAlpha('#ff9a45', 0.7);
    ctx.beginPath();
    ctx.moveTo(fx - 6, ay + ah - 2);
    ctx.quadraticCurveTo(fx - 2, ay + ah - fh, fx, ay + ah - fh - 6);
    ctx.quadraticCurveTo(fx + 4, ay + ah - fh * 0.5, fx + 6, ay + ah - 2);
    ctx.fill();
    ctx.fillStyle = withAlpha('#ffe1a0', 0.6);
    ctx.beginPath();
    ctx.moveTo(fx - 2.5, ay + ah - 2);
    ctx.quadraticCurveTo(fx, ay + ah - fh * 0.6, fx + 1.5, ay + ah - 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = '#c9a184';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ax, ay + ah);
  ctx.lineTo(ax, ay + 30);
  ctx.arc(ax + aw / 2, ay + 30, aw / 2, Math.PI, 0);
  ctx.lineTo(ax + aw, ay + ah);
  ctx.stroke();
  // mantel
  ctx.fillStyle = '#5c3527';
  rr(ctx, x - 10, y - 12, w + 20, 12, 4);
  ctx.fill();
  ctx.fillStyle = '#7c4a36';
  rr(ctx, x - 8, y - 12, w + 16, 5, 3);
  ctx.fill();
  // chimney
  ctx.fillStyle = '#4d2e22';
  rr(ctx, x + w / 2 - 18, y - 34, 36, 24, 3);
  ctx.fill();
  // peel leaning
  ctx.save();
  ctx.translate(x + w + 6, y + 146);
  ctx.rotate(-0.14);
  line(ctx, 0, 0, 0, -70, '#9a6a42', 3.6);
  ctx.fillStyle = '#b48a5c';
  ctx.beginPath();
  ctx.ellipse(-14, 6, 17, 12, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // glow
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, ax + aw / 2, ay + ah - 20, 100, '#ff9a4a', 0.18);
  glow(ctx, x + w / 2, y + h / 2, 130, '#d8763c', 0.06);
  ctx.restore();
  text(ctx, 'OVEN', x + w / 2, y - 18, 10, withAlpha('#f0d7ae', 0.6), { weight: 700, spacing: 3, align: 'center' });
}

function drawPassBack(ctx, game) {
  const x = 1000;
  const w = 228;
  // tiled wall
  ctx.fillStyle = '#2b2826';
  ctx.fillRect(x + 2, 330, w - 4, 88);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      const tx = x + 4 + col * 28;
      const ty = 332 + row * 28;
      ctx.fillStyle = (row + col) % 2 ? withAlpha('#e6d9bd', 0.1) : withAlpha('#cfdcd2', 0.07);
      ctx.fillRect(tx, ty, 26, 26);
      ctx.strokeStyle = withAlpha('#1a1514', 0.5);
      ctx.strokeRect(tx, ty, 26, 26);
    }
  }
  // brass rail
  line(ctx, x + 4, 316, x + w - 6, 316, '#2a1b14', 6);
  line(ctx, x + 6, 313, x + w - 8, 313, '#d1a56b', 2);
  // heat lamps
  for (let i = 0; i < 3; i++) {
    const lx = x + 56 + i * 58;
    line(ctx, lx, 316, lx, 326, '#3a2a1c', 2);
    ctx.fillStyle = '#7c5a36';
    ctx.beginPath();
    ctx.moveTo(lx - 14, 340);
    ctx.lineTo(lx + 14, 340);
    ctx.lineTo(lx + 8, 328);
    ctx.lineTo(lx - 8, 328);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd98f';
    rr(ctx, lx - 10, 338, 20, 5, 2);
    ctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const cone = ctx.createLinearGradient(0, 342, 0, DECK_Y + 20);
    cone.addColorStop(0, withAlpha('#ffcf82', 0.16));
    cone.addColorStop(1, withAlpha('#ffcf82', 0));
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(lx - 9, 343);
    ctx.lineTo(lx + 9, 343);
    ctx.lineTo(lx + 38, DECK_Y + 22);
    ctx.lineTo(lx - 38, DECK_Y + 22);
    ctx.closePath();
    ctx.fill();
    glow(ctx, lx, 352, 36, '#ffcf82', 0.13);
    ctx.restore();
  }
  // little brass nameplate
  ctx.fillStyle = '#d1a56b';
  rr(ctx, x + w / 2 - 34, 288, 68, 18, 3);
  ctx.fill();
  ctx.fillStyle = '#4a3320';
  text(ctx, 'PASS', x + w / 2, 301, 10, '#3d2a18', { weight: 700, spacing: 4, align: 'center' });
}

// ---------------------------------------------------------------- counter and its working tops

function drawDeck(ctx, game) {
  const g = ctx.createLinearGradient(0, DECK_Y, 0, 552);
  g.addColorStop(0, '#8a5736');
  g.addColorStop(0.22, '#77472c');
  g.addColorStop(1, '#5a3320');
  ctx.fillStyle = g;
  ctx.fillRect(0, DECK_Y, W, 98);
  // planks
  for (let i = 0; i < 6; i++) {
    const y = DECK_Y + 9 + i * 15;
    ctx.strokeStyle = withAlpha('#2f1a10', 0.24);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    ctx.strokeStyle = withAlpha('#e0aa73', 0.07);
    ctx.beginPath();
    ctx.moveTo(0, y + 1.4);
    ctx.lineTo(W, y + 1.4);
    ctx.stroke();
  }
  // grain
  for (let i = 0; i < 90; i++) {
    const x = hash2(i, 7) * W;
    const y = DECK_Y + 6 + hash2(i, 12) * 86;
    const len = 8 + hash2(i, 19) * 32;
    ctx.strokeStyle = withAlpha('#3a2014', 0.12 + hash2(i, 22) * 0.1);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + len * 0.5, y + 1.5, x + len, y);
    ctx.stroke();
  }
  // worn pale path near prep
  ctx.fillStyle = withAlpha('#e8c99a', 0.06);
  ctx.beginPath();
  ctx.ellipse(392, 512, 150, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  // front edge
  ctx.fillStyle = '#b07a4e';
  ctx.fillRect(0, DECK_Y - 4, W, 5);
  ctx.fillStyle = withAlpha('#ffd9a8', 0.35);
  ctx.fillRect(0, DECK_Y - 4, W, 1.5);
  // front panel
  const front = ctx.createLinearGradient(0, 552, 0, 572);
  front.addColorStop(0, '#1f4a48');
  front.addColorStop(1, '#153432');
  ctx.fillStyle = front;
  ctx.fillRect(0, 552, W, 20);
  for (let x = 8; x < W; x += 26) {
    line(ctx, x, 553, x, 571, withAlpha('#0f2725', 0.45), 1.5);
    line(ctx, x + 1.5, 553, x + 1.5, 571, withAlpha('#4a7f79', 0.25), 1);
  }
  // brass rail
  line(ctx, 0, 561, W, 561, '#a87a46', 2);
  line(ctx, 0, 560, W, 560, withAlpha('#ffe0aa', 0.4), 1);
}

function drawPrepTop(ctx, game) {
  const bx = 308;
  const by = 468;
  const bw = 166;
  const bh = 52;
  // a warm pool of light from the prep lamp, so the hero board carries the eye
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, 396, 468, 132, '#ffcf82', 0.11);
  ctx.restore();
  // shadow
  ctx.fillStyle = 'rgba(24,13,9,0.32)';
  ctx.beginPath();
  ctx.ellipse(392, 522, 92, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // board
  ctx.fillStyle = '#b98a56';
  rr(ctx, bx, by, bw, bh, 9);
  ctx.fill();
  const wood = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
  wood.addColorStop(0, '#c99a63');
  wood.addColorStop(0.5, '#b98a56');
  wood.addColorStop(1, '#a27346');
  ctx.fillStyle = wood;
  rr(ctx, bx + 2, by + 2, bw - 4, bh - 4, 8);
  ctx.fill();
  for (let i = 0; i < 14; i++) {
    const y = by + 6 + hash2(i, 33) * (bh - 12);
    ctx.strokeStyle = withAlpha('#7e522f', 0.16);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(bx + 6 + hash2(i, 3) * 18, y);
    ctx.lineTo(bx + bw - 8 - hash2(i, 8) * 18, y + hash2(i, 9) * 2);
    ctx.stroke();
  }
  // flour dust
  for (let i = 0; i < 46; i++) {
    const fx = bx + 10 + hash2(i, 41) * (bw - 20);
    const fy = by + 8 + hash2(i, 43) * (bh - 14);
    circle(ctx, fx, fy, 0.6 + hash2(i, 47) * 1.4, withAlpha('#f4e6c8', 0.18 + hash2(i, 51) * 0.36));
  }
  // dough balls on the left
  circle(ctx, bx + 16, by + 20, 12, '#e2be89');
  circle(ctx, bx + 15, by + 19, 10.5, '#efd3a3');
  circle(ctx, bx + 32, by + 44, 9, '#e2be89');
  circle(ctx, bx + 31, by + 43, 7.6, '#eed09e');
  // rolling pin
  ctx.save();
  ctx.translate(bx + bw - 30, by + 12);
  ctx.rotate(-0.32);
  ctx.fillStyle = '#c79a68';
  rr(ctx, -22, -4, 44, 8, 4);
  ctx.fill();
  ctx.fillStyle = '#8d5f39';
  ctx.fillRect(-29, -3, 9, 6);
  ctx.fillRect(20, -3, 9, 6);
  ctx.restore();
  // the pizza, mid-assembly
  const px = 394;
  const py = 492;
  drawPizza(ctx, px, py, 42, game);
  // bowls of toppings
  drawToppingBowl(ctx, 492, 476, 'tomato');
  drawToppingBowl(ctx, 492, 500, 'basil');
  drawToppingBowl(ctx, 492, 524, 'mozzarella');
  // a few loose mushrooms and basil
  drawIngredient(ctx, 'mushroom', bx + 62, by + 14, 8);
  drawIngredient(ctx, 'basil', bx + 124, by + 46, 8);
  drawIngredient(ctx, 'tomato', bx + 142, by + 14, 8);
}

function drawPizza(ctx, x, y, r, game) {
  ctx.save();
  ctx.fillStyle = 'rgba(40,20,10,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + 4, r * 1.06, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  // crust
  ctx.fillStyle = '#d9ab68';
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8c489';
  ctx.beginPath();
  ctx.ellipse(x, y - 1, r * 0.9, r * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  // crust braid marks
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ctx.save();
    ctx.translate(x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.85);
    ctx.rotate(a);
    ctx.strokeStyle = withAlpha('#b9813f', 0.5);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(3, 2);
    ctx.stroke();
    ctx.restore();
  }
  // sauce, spread but not to the edge
  ctx.fillStyle = '#c9523a';
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.78, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e2694a';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.2, y - r * 0.1, r * 0.52, r * 0.42, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // mozzarella, half placed
  const cheese = [
    [-0.4, -0.26, 0.22], [0.28, -0.32, 0.19], [0.05, 0.05, 0.2], [0.42, 0.2, 0.17], [-0.18, 0.28, 0.18], [-0.5, 0.14, 0.15],
  ];
  cheese.forEach(([dx, dy, s], i) => {
    circle(ctx, x + dx * r, y + dy * r, s * r, i % 2 ? '#f6eed8' : '#fbf5e6');
    circle(ctx, x + dx * r - s * r * 0.25, y + dy * r - s * r * 0.25, s * r * 0.28, withAlpha('#ffffff', 0.75));
  });
  // basil leaves, half placed
  const leaves = [[-0.3, 0.02, 0.6], [0.16, -0.12, -0.3], [-0.05, 0.3, 1.4]];
  for (const [dx, dy, rot] of leaves) {
    ctx.save();
    ctx.translate(x + dx * r, y + dy * r);
    ctx.rotate(rot);
    ctx.fillStyle = '#5f9945';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.2, r * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = withAlpha('#cfe7b0', 0.6);
    ctx.lineWidth = 1;
    line(ctx, -r * 0.15, 0, r * 0.15, 0, withAlpha('#cfe7b0', 0.6), 1);
    ctx.restore();
  }
  // a few basil bits waiting beside it
  drawIngredient(ctx, 'basil', x + r * 0.9, y - r * 0.5, 6);
  drawIngredient(ctx, 'basil', x - r * 0.85, y - r * 0.45, 5);
  ctx.restore();
}

function drawToppingBowl(ctx, x, y, ingredient) {
  ctx.fillStyle = 'rgba(30,16,10,0.28)';
  ctx.beginPath();
  ctx.ellipse(x, y + 7, 15, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9cbb0';
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 15, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b9a98c';
  ctx.beginPath();
  ctx.arc(x, y + 2, 15, 0, Math.PI);
  ctx.fill();
  drawIngredient(ctx, ingredient, x, y - 3, 8);
  if (ingredient === 'mozzarella') drawIngredient(ctx, ingredient, x + 6, y - 6, 5);
  if (ingredient === 'tomato') drawIngredient(ctx, ingredient, x + 7, y - 5, 5);
  if (ingredient === 'basil') drawIngredient(ctx, ingredient, x + 7, y - 5, 5);
}

function drawCounterProps(ctx, game) {
  // a folded service towel and a bowl of tomatoes keep the long counter from reading as dead space
  ctx.save();
  ctx.fillStyle = 'rgba(24,13,9,0.25)';
  ctx.beginPath();
  ctx.ellipse(762, 517, 38, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ded2b8';
  rr(ctx, 738, 498, 48, 20, 4);
  ctx.fill();
  ctx.fillStyle = '#c6b99c';
  rr(ctx, 738, 511, 48, 7, 3);
  ctx.fill();
  line(ctx, 744, 504, 780, 504, withAlpha('#8f856d', 0.5), 1.2);
  line(ctx, 744, 508, 780, 508, withAlpha('#8f856d', 0.35), 1);

  ctx.fillStyle = 'rgba(30,16,10,0.28)';
  ctx.beginPath();
  ctx.ellipse(944, 530, 23, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9cbb0';
  ctx.beginPath();
  ctx.ellipse(944, 522, 23, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b9a98c';
  ctx.beginPath();
  ctx.arc(944, 520, 23, 0, Math.PI);
  ctx.fill();
  drawIngredient(ctx, 'tomato', 938, 514, 7);
  drawIngredient(ctx, 'tomato', 950, 512, 6);
  drawIngredient(ctx, 'basil', 945, 507, 5);
  ctx.restore();
}

function drawStoveTop(ctx, game) {
  const t = game.time;
  // burner grates
  for (const bx of [578, 682]) {
    ctx.strokeStyle = '#151518';
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(bx - 28 + i * 7, 424);
      ctx.lineTo(bx + 28 - i * 7, 450);
      ctx.stroke();
    }
    ctx.fillStyle = '#0f0f11';
    ctx.beginPath();
    ctx.ellipse(bx, 437, 30, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // flames
  for (let i = 0; i < 7; i++) {
    const fx = 556 + i * 7 + Math.sin(t * 9 + i) * 1.5;
    const fh = 8 + Math.sin(t * 13 + i * 2) * 4;
    ctx.fillStyle = withAlpha(i % 2 ? '#ff9a3e' : '#ffc65c', 0.75);
    ctx.beginPath();
    ctx.moveTo(fx - 3, 446);
    ctx.quadraticCurveTo(fx, 446 - fh, fx + 3, 446);
    ctx.fill();
    ctx.fillStyle = withAlpha('#6fc0e0', 0.4);
    ctx.beginPath();
    ctx.moveTo(fx - 1.4, 447);
    ctx.quadraticCurveTo(fx, 447 - fh * 0.45, fx + 1.4, 447);
    ctx.fill();
  }
  // skillet of sauce
  ctx.fillStyle = 'rgba(20,10,8,0.35)';
  ctx.beginPath();
  ctx.ellipse(578, 446, 40, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1b1b1e';
  ctx.beginPath();
  ctx.ellipse(578, 430, 37, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#35353a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(578, 428, 35, 22, 0, 0, Math.PI * 2);
  ctx.stroke();
  line(ctx, 611, 424, 646, 414, '#2a2a2e', 6);
  line(ctx, 612, 421, 644, 412, '#55555a', 2);
  const sauce = ctx.createRadialGradient(570, 424, 3, 578, 430, 32);
  sauce.addColorStop(0, '#f08358');
  sauce.addColorStop(0.6, '#d2553a');
  sauce.addColorStop(1, '#9e3527');
  ctx.fillStyle = sauce;
  ctx.beginPath();
  ctx.ellipse(578, 429, 30, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 7; i++) {
    const a = t * 0.6 + i * 1.6;
    const bx = 578 + Math.cos(a) * (8 + (i % 3) * 6);
    const by = 429 + Math.sin(a) * (4 + (i % 2) * 4);
    circle(ctx, bx, by, 1.6 + (i % 3), withAlpha('#ffb08a', 0.55));
  }
  drawIngredient(ctx, 'basil', 586, 422, 5);
  // steel pot with steam
  ctx.fillStyle = 'rgba(20,10,8,0.3)';
  ctx.beginPath();
  ctx.ellipse(682, 447, 32, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8c9497';
  rr(ctx, 660, 410, 46, 38, 6);
  ctx.fill();
  const steel = ctx.createLinearGradient(660, 0, 706, 0);
  steel.addColorStop(0, '#8e989b');
  steel.addColorStop(0.4, '#d3dbdb');
  steel.addColorStop(0.7, '#9ba4a6');
  steel.addColorStop(1, '#6d7679');
  ctx.fillStyle = steel;
  rr(ctx, 662, 412, 42, 34, 5);
  ctx.fill();
  ctx.fillStyle = '#3b2420';
  ctx.beginPath();
  ctx.ellipse(683, 413, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5f4630';
  ctx.beginPath();
  ctx.ellipse(683, 412, 17, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  line(ctx, 658, 420, 650, 420, '#7c8487', 3);
  line(ctx, 708, 420, 716, 420, '#7c8487', 3);
  ctx.fillStyle = withAlpha('#f0d9ae', 0.2);
  ctx.fillRect(666, 416, 5, 27);
}

function drawOvenTop(ctx, game) {
  // a small stack of firewood and a brush beside the oven
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.translate(966, 512 - i * 8);
    ctx.rotate(-0.08 + i * 0.02);
    ctx.fillStyle = i % 2 ? '#6b422b' : '#7c4e33';
    rr(ctx, -22, -4, 44, 8, 4);
    ctx.fill();
    ctx.fillStyle = withAlpha('#d9a06a', 0.35);
    ctx.beginPath();
    ctx.ellipse(-22, 0, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawPassTop(ctx, game) {
  // stacked clean plates
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 ? '#f0e5cd' : '#faf2df';
    ctx.beginPath();
    ctx.ellipse(1024, 506 - i * 4, 25 - i * 0.6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = withAlpha('#b7a580', 0.5);
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  // plated tickets sit under the heat lamps; the hero bowl fills the middle lamp when the pass is clear
  const plated = game.orders.filter((o) => o && (o.plated || o.step === 'serve'));
  if (plated.length === 0) {
    // the middle heat lamp pools straight down onto the plated hero dish
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const lampCone = ctx.createLinearGradient(0, 344, 0, 516);
    lampCone.addColorStop(0, 'rgba(255,207,130,0.30)');
    lampCone.addColorStop(1, 'rgba(255,196,118,0.07)');
    ctx.fillStyle = lampCone;
    ctx.beginPath();
    ctx.moveTo(1105, 344);
    ctx.lineTo(1123, 344);
    ctx.lineTo(1150, 516);
    ctx.lineTo(1080, 516);
    ctx.closePath();
    ctx.fill();
    const pool = ctx.createRadialGradient(1104, 500, 4, 1104, 500, 100);
    pool.addColorStop(0, 'rgba(255,216,148,0.42)');
    pool.addColorStop(0.6, 'rgba(255,198,122,0.17)');
    pool.addColorStop(1, 'rgba(255,190,116,0)');
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.ellipse(1104, 500, 100, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawDish(ctx, 1104, 500, recipeById('ramen'), 1.85, true);
    // a bright rim keeps the plate from melting into the counter
    ctx.save();
    ctx.strokeStyle = withAlpha('#fff4d6', 0.85);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(1104, 498, 47, 15.2, 0, Math.PI * 1.03, Math.PI * 1.97);
    ctx.stroke();
    ctx.restore();
    // steam curls rising into the lamp light, so the pass reads as a pass
    ctx.save();
    ctx.strokeStyle = withAlpha('#ffe6bd', 0.26);
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const sx = 1086 + i * 16;
      const t = game.time * 0.9 + i * 1.7;
      ctx.beginPath();
      ctx.moveTo(sx, 488);
      ctx.bezierCurveTo(sx - 5, 476, sx + 5 + Math.sin(t) * 2, 464, sx - 2, 451);
      ctx.stroke();
    }
    ctx.restore();
  } else {
    const first = 1114 - ((plated.length - 1) * 64) / 2;
    plated.forEach((o, i) => {
      drawDish(ctx, first + i * 64, 528, o.recipe, 0.92, o.quality === 'perfect');
    });
    // the pass light box says what the counter already knows
    ctx.fillStyle = withAlpha('#1a1114', 0.86);
    rr(ctx, 1114 - 48, 448, 96, 23, 5);
    ctx.fill();
    ctx.strokeStyle = withAlpha('#f3bf6d', 0.6);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    text(ctx, 'ORDER UP', 1114, 465, 11.5, '#ffd79a', { weight: 700, spacing: 1.6, align: 'center' });
  }
  // brass bell
  drawBell(ctx, 1150, 502, game);
  // clean plate at the end
  ctx.fillStyle = '#f7efdb';
  ctx.beginPath();
  ctx.ellipse(1208, 504, 20, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = withAlpha('#c8b795', 0.9);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(1208, 503, 14, 4, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (plated.length === 0) {
    // a small herb garnish bowl so the pass never feels empty
    ctx.fillStyle = '#cbbfa4';
    ctx.beginPath();
    ctx.ellipse(1032, 532, 15, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    drawIngredient(ctx, 'basil', 1032, 526, 8);
  }
}

function drawDish(ctx, x, y, recipe, scale = 1, sparkle = false) {
  const r = 26 * scale;
  ctx.save();
  ctx.fillStyle = 'rgba(24,14,9,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + 5 * scale, r * 1.05, r * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f7efdb';
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = withAlpha('#b9a781', 0.8);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y - 1, r * 0.7, r * 0.22, 0, 0, Math.PI * 2);
  ctx.stroke();
  // the food itself, a coloured bowl with little dots
  ctx.fillStyle = recipe.cook === 'oven' ? '#c98a4f' : recipe.color;
  ctx.beginPath();
  ctx.ellipse(x, y - 3 * scale, r * 0.62, r * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = withAlpha('#fff2d0', 0.8);
  for (let i = 0; i < 5; i++) {
    const a = i * 1.7;
    circle(ctx, x + Math.cos(a) * r * 0.3, y - 3 * scale + Math.sin(a) * r * 0.1, 1.8 * scale, withAlpha(i % 2 ? '#f5d98b' : '#6ea84f', 0.9));
  }
  if (sparkle) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x, y - 6, 34, '#ffd88a', 0.24);
    ctx.restore();
  }
  ctx.restore();
}

function drawBell(ctx, x, y, game) {
  ctx.fillStyle = 'rgba(24,14,9,0.32)';
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 17, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createLinearGradient(x - 15, y - 18, x + 15, y + 2);
  g.addColorStop(0, '#f0c479');
  g.addColorStop(0.45, '#c28a3e');
  g.addColorStop(1, '#8a5a24');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - 15, y);
  ctx.quadraticCurveTo(x - 14, y - 19, x, y - 19);
  ctx.quadraticCurveTo(x + 14, y - 19, x + 15, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7a5220';
  rr(ctx, x - 16, y - 1, 32, 4, 2);
  ctx.fill();
  circle(ctx, x, y - 21, 3, '#c99a52');
  circle(ctx, x, y - 21, 1.4, '#f7dda2');
  ctx.fillStyle = withAlpha('#fff0bf', 0.55);
  ctx.beginPath();
  ctx.ellipse(x - 6, y - 11, 2.6, 5, -0.3, 0, Math.PI * 2);
  ctx.fill();
  if (game.lastTip && game.lastTip.t > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x, y - 10, 40, '#ffcf7a', 0.25);
    ctx.restore();
  }
}

function drawMugs(ctx, game) {
  const seats = [296, 632, 966];
  seats.forEach((sx, i) => {
    const x = sx + 40;
    const y = 536;
    ctx.fillStyle = 'rgba(20,10,8,0.24)';
    ctx.beginPath();
    ctx.ellipse(x, y + 4, 12, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ['#d9d2bd', '#8aa9a4', '#c98f6a'][i % 3];
    rr(ctx, x - 8, y - 12, 16, 16, 3);
    ctx.fill();
    ctx.strokeStyle = withAlpha('#2a1a12', 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 9, y - 5, 4, -1.4, 1.4);
    ctx.stroke();
    ctx.fillStyle = '#4a2e1c';
    ctx.beginPath();
    ctx.ellipse(x, y - 12, 8, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    if (i === 1 || game.screen === 'play') {
      ctx.strokeStyle = withAlpha('#e6eee6', 0.24);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x - 2, y - 16);
      ctx.quadraticCurveTo(x + 3, y - 22, x - 1, y - 28);
      ctx.stroke();
    }
  });
}

// ---------------------------------------------------------------- the regulars and the floor

function drawFloor(ctx, game) {
  const top = 566;
  ctx.fillStyle = '#1a2321';
  ctx.fillRect(0, top, W, H - top);
  const cols = 32;
  const rows = 7;
  const tw = W / cols;
  for (let r = 0; r < rows; r++) {
    const y = top + (r * (H - top)) / rows;
    const h = (H - top) / rows + 1;
    for (let c = 0; c < cols; c++) {
      const x = c * tw + (r % 2 ? tw / 2 : 0) - tw / 2;
      ctx.fillStyle = (r + c) % 2 ? '#2f5b56' : '#cdbf9f';
      ctx.globalAlpha = 0.42;
      ctx.fillRect(x, y, tw + 0.5, h);
    }
  }
  ctx.globalAlpha = 1;
  // darken toward the bottom, foreground weight
  const shade = ctx.createLinearGradient(0, top, 0, H);
  shade.addColorStop(0, withAlpha('#120d10', 0.55));
  shade.addColorStop(0.4, withAlpha('#120d10', 0.18));
  shade.addColorStop(1, withAlpha('#0c090c', 0.55));
  ctx.fillStyle = shade;
  ctx.fillRect(0, top, W, H - top);
  // worn red mat
  ctx.save();
  ctx.translate(600, 660);
  ctx.rotate(-0.018);
  ctx.fillStyle = withAlpha('#7f3b33', 0.85);
  rr(ctx, -150, -38, 300, 76, 7);
  ctx.fill();
  ctx.strokeStyle = withAlpha('#c98d6a', 0.25);
  ctx.lineWidth = 1.4;
  rr(ctx, -140, -30, 280, 60, 4);
  ctx.stroke();
  for (let i = 0; i < 10; i++) {
    const px = -140 + i * 31;
    ctx.strokeStyle = withAlpha('#d8b28c', 0.22);
    ctx.beginPath();
    ctx.moveTo(px, -38);
    ctx.lineTo(px + 2, -44);
    ctx.moveTo(px + 12, 38);
    ctx.lineTo(px + 10, 44);
    ctx.stroke();
  }
  ctx.strokeStyle = withAlpha('#3a1716', 0.4);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-60, -10);
  ctx.quadraticCurveTo(10, -16, 90, -6);
  ctx.stroke();
  ctx.restore();
  // scattered flour
  for (let i = 0; i < 40; i++) {
    const x = 120 + hash2(i, 55) * 420;
    const y = 596 + hash2(i, 57) * 110;
    circle(ctx, x, y, 0.7 + hash2(i, 59) * 1.6, withAlpha('#f2e4c8', 0.1 + hash2(i, 61) * 0.2));
  }
}

function drawStool(ctx, x, cushion = '#2d5a56', t = 0) {
  ctx.fillStyle = 'rgba(12,8,10,0.35)';
  ctx.beginPath();
  ctx.ellipse(x, 712, 44, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3a2a22';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x - 26, 684);
  ctx.lineTo(x - 30, 712);
  ctx.moveTo(x + 26, 684);
  ctx.lineTo(x + 30, 712);
  ctx.moveTo(x - 6, 688);
  ctx.lineTo(x - 4, 712);
  ctx.moveTo(x + 6, 688);
  ctx.lineTo(x + 4, 712);
  ctx.stroke();
  ctx.strokeStyle = withAlpha('#c99a62', 0.6);
  line(ctx, x - 26, 700, x + 26, 700, withAlpha('#c99a62', 0.6), 2);
  ctx.fillStyle = cushion;
  ctx.beginPath();
  ctx.ellipse(x, 678, 40, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = withAlpha('#8fbfb6', 0.18);
  ctx.beginPath();
  ctx.ellipse(x - 6, 675, 28, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = withAlpha('#0f2927', 0.5);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(x, 678, 39, 12, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawCustomer(ctx, game, seat, def, index) {
  const x = def.x;
  const t = game.time;
  const body = seat ? seat.customer.sweater : def.sweater;
  const hair = seat ? seat.customer.hair : def.hair;
  const skin = seat ? seat.customer.skin : '#d8a878';
  const style = seat ? seat.customer.style : 'bun';
  const breathe = Math.sin(t * 1.3 + index * 2) * 1.2;
  const happy = seat && seat.mood === 'happy';
  // body from behind
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(x - 64, 720);
  ctx.quadraticCurveTo(x - 60, 640 + breathe, x - 26, 624 + breathe);
  ctx.quadraticCurveTo(x, 616 + breathe, x + 26, 624 + breathe);
  ctx.quadraticCurveTo(x + 60, 640 + breathe, x + 64, 720);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = withAlpha('#120d10', 0.4);
  ctx.lineWidth = 2;
  ctx.stroke();
  // collar
  ctx.fillStyle = withAlpha('#f0e2c8', 0.5);
  ctx.beginPath();
  ctx.ellipse(x, 623 + breathe, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // neck
  ctx.fillStyle = skin;
  rr(ctx, x - 9, 606 + breathe, 18, 18, 6);
  ctx.fill();
  // head
  const hy = 598 + breathe;
  circle(ctx, x, hy, 28, skin);
  // ears
  circle(ctx, x - 27, hy + 3, 5, skin);
  circle(ctx, x + 27, hy + 3, 5, skin);
  // the back of the head is mostly hair
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.ellipse(x, hy - 2, 27, 27, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(x, hy + 24, 12, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  if (style === 'bun') {
    circle(ctx, x, hy - 27, 12, hair);
    circle(ctx, x - 3, hy - 30, 8, withAlpha('#8a5a44', 0.45));
    ctx.strokeStyle = withAlpha('#f0e2c8', 0.18);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(x, hy - 2, 20 - i * 5, 0.6, 2.4);
      ctx.stroke();
    }
    ctx.fillStyle = '#c99a52';
    ctx.fillRect(x + 15, hy - 18, 3, 10);
  } else if (style === 'beanie') {
    ctx.fillStyle = '#4d7a74';
    ctx.beginPath();
    ctx.arc(x, hy - 3, 28, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#3d6560';
    rr(ctx, x - 28, hy - 10, 56, 11, 4);
    ctx.fill();
    ctx.strokeStyle = withAlpha('#a8d4cb', 0.3);
    ctx.lineWidth = 1;
    for (let i = -3; i <= 3; i++) line(ctx, x + i * 7, hy - 29, x + i * 7, hy - 10, withAlpha('#a8d4cb', 0.2), 1);
    circle(ctx, x, hy - 33, 5, '#8fb9b1');
  } else if (style === 'curls') {
    for (let i = 0; i < 10; i++) {
      const a = -0.2 + (i / 9) * Math.PI * 2;
      const rr2 = 21 + (i % 3) * 3;
      circle(ctx, x + Math.cos(a) * rr2, hy + Math.sin(a) * rr2 - 2, 8.5, i % 2 ? hair : '#966642');
    }
    circle(ctx, x, hy - 30, 10, hair);
    ctx.fillStyle = withAlpha('#b07a4e', 0.45);
    for (let i = 0; i < 4; i++) circle(ctx, x - 12 + i * 8, hy - 9, 2.6, withAlpha('#b07a4e', 0.5));
  } else if (style === 'cap') {
    ctx.fillStyle = '#6b5a3f';
    ctx.beginPath();
    ctx.arc(x, hy - 3, 27, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#574832';
    rr(ctx, x - 30, hy - 7, 60, 8, 4);
    ctx.fill();
    ctx.fillStyle = '#8a744e';
    rr(ctx, x - 8, hy - 27, 16, 4, 2);
    ctx.fill();
    ctx.fillStyle = '#f0e2c8';
    circle(ctx, x + 12, hy - 24, 2.4, withAlpha('#f0e2c8', 0.8));
  } else {
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.ellipse(x - 20, hy + 8, 8, 16, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 20, hy + 8, 8, 16, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = withAlpha('#f0e2c8', 0.14);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, hy - 4, 18, 0.7, 2.4);
    ctx.stroke();
  }
  // headphone band on one regular
  if (index === 1) {
    ctx.strokeStyle = '#2a2622';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, hy - 2, 30, Math.PI + 0.2, -0.2);
    ctx.stroke();
    ctx.fillStyle = '#2a2622';
    rr(ctx, x - 34, hy - 4, 8, 16, 4);
    ctx.fill();
    rr(ctx, x + 26, hy - 4, 8, 16, 4);
    ctx.fill();
  }
  // happy little side view for the third customer
  if (index === 2) {
    ctx.save();
    ctx.translate(x - 22, hy + 2);
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(-6, 0, 14, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    // nose
    ctx.beginPath();
    ctx.moveTo(-18, -2);
    ctx.quadraticCurveTo(-24, 2, -18, 5);
    ctx.fill();
    ctx.fillStyle = '#3a241d';
    circle(ctx, -10, -4, 1.8, '#3a241d');
    if (seat && seat.mood === 'happy') {
      ctx.strokeStyle = '#9c5a45';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(-13, 4, 4, 0.2, Math.PI - 0.3);
      ctx.stroke();
    }
    ctx.restore();
  }
  // shoulders shading and a scarf
  ctx.fillStyle = withAlpha('#120d10', 0.18);
  ctx.beginPath();
  ctx.ellipse(x, 690, 58, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = withAlpha('#f6e8cb', 0.18);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x - 30, 650);
  ctx.quadraticCurveTo(x, 664, x + 30, 650);
  ctx.stroke();
  if (happy) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x, 620, 60, '#f3bf6d', 0.07);
    ctx.restore();
  }
}

function drawCat(ctx, game) {
  const x = CAT.x;
  const y = 654;
  const flick = Math.sin(game.time * 1.1) * 0.25 + (Math.sin(game.time * 0.17) > 0.92 ? Math.sin(game.time * 9) * 0.4 : 0);
  const breathe = Math.sin(game.time * 1.7) * 1.4;
  ctx.save();
  ctx.translate(x, y);
  // curled body
  ctx.fillStyle = '#cf7e3f';
  ctx.beginPath();
  ctx.ellipse(2, 0, 42, 22 + breathe * 0.3, -0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e1a05c';
  ctx.beginPath();
  ctx.ellipse(4, -5, 33, 13, -0.1, 0, Math.PI * 2);
  ctx.fill();
  // stripes
  ctx.strokeStyle = withAlpha('#9a5427', 0.6);
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(10 + i * 6, -4, 12, -1.1, -0.2);
    ctx.stroke();
  }
  // tail
  ctx.save();
  ctx.translate(-36, 6);
  ctx.rotate(flick);
  ctx.strokeStyle = '#cf7e3f';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-24, -4, -16, -22);
  ctx.stroke();
  ctx.strokeStyle = '#e1a05c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-4, -2);
  ctx.quadraticCurveTo(-20, -5, -14, -19);
  ctx.stroke();
  ctx.restore();
  // head
  const hx = -26;
  const hy = -13;
  ctx.fillStyle = '#d98f4a';
  circle(ctx, hx, hy, 16, '#d98f4a');
  ctx.beginPath();
  ctx.moveTo(hx - 13, hy - 8);
  ctx.lineTo(hx - 16, hy - 24);
  ctx.lineTo(hx - 4, hy - 15);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(hx + 3, hy - 15);
  ctx.lineTo(hx + 14, hy - 23);
  ctx.lineTo(hx + 14, hy - 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f0c49a';
  ctx.beginPath();
  ctx.moveTo(hx - 12, hy - 9);
  ctx.lineTo(hx - 14, hy - 19);
  ctx.lineTo(hx - 6, hy - 13);
  ctx.fill();
  // closed eyes
  ctx.strokeStyle = '#6b3a1e';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(hx - 5, hy - 1, 3.4, 0.25, Math.PI - 0.15);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(hx + 6, hy - 1, 3.4, 0.25, Math.PI - 0.15);
  ctx.stroke();
  // nose and whiskers
  ctx.fillStyle = '#a9643a';
  ctx.beginPath();
  ctx.moveTo(hx + 1, hy + 4);
  ctx.lineTo(hx + 4, hy + 6);
  ctx.lineTo(hx - 2, hy + 6);
  ctx.fill();
  ctx.strokeStyle = withAlpha('#f6e8cb', 0.5);
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    line(ctx, hx - 3, hy + 6, hx - 16, hy + 3 + i * 3, withAlpha('#f6e8cb', 0.4), 1);
    line(ctx, hx + 6, hy + 6, hx + 19, hy + 3 + i * 3, withAlpha('#f6e8cb', 0.4), 1);
  }
  // zzz
  ctx.fillStyle = withAlpha('#e8dfc8', 0.45 + Math.sin(game.time * 1.4) * 0.15);
  text(ctx, 'z', hx - 4, hy - 30, 12, withAlpha('#e8dfc8', 0.5), { font: 'serif', style: 'italic' });
  text(ctx, 'z', hx + 8, hy - 42, 9, withAlpha('#e8dfc8', 0.35), { font: 'serif', style: 'italic' });
  ctx.restore();
}

function drawBubble(ctx, seat, def) {
  if (!seat || seat.gone || !seat.bubble) return;
  const x = def.x;
  const y = 540;
  const happy = seat.mood === 'happy';
  const sad = seat.mood === 'sad';
  ctx.save();
  ctx.font = `400 11px ${FONT.ui}`;
  const tw = ctx.measureText(seat.bubble).width;
  const w = Math.max(92, tw + 22);
  const h = 30;
  ctx.fillStyle = withAlpha('#1a1114', 0.2);
  rr(ctx, x - w / 2 + 2, y + 2, w, h, 9);
  ctx.fill();
  ctx.fillStyle = happy ? '#f8eccf' : '#f2e6cd';
  rr(ctx, x - w / 2, y, w, h, 9);
  ctx.fill();
  ctx.strokeStyle = withAlpha('#4a3324', 0.35);
  ctx.lineWidth = 1;
  ctx.stroke();
  // tail
  ctx.fillStyle = happy ? '#f8eccf' : '#f2e6cd';
  ctx.beginPath();
  ctx.moveTo(x - 6, y + h - 1);
  ctx.lineTo(x + 8, y + h - 1);
  ctx.lineTo(x + 1, y + h + 12);
  ctx.closePath();
  ctx.fill();
  text(ctx, seat.bubble, x, y + 19, 11, sad ? '#8a4a3c' : '#3f2c22', { align: 'center' });
  text(ctx, seat.customer.name.toUpperCase(), x, y + 8.5, 6.4, withAlpha('#8a6a4a', 0.75), { weight: 700, spacing: 1.4, align: 'center' });
  ctx.restore();
}

function drawForeground(ctx, game) {
  drawFloor(ctx, game);
  const seatXs = [296, 632, 966];
  seatXs.forEach((x, i) => drawStool(ctx, x, '#2d5a56', game.time));
  drawStool(ctx, CAT.x, '#264a47', game.time);
  if (game.cat !== false) drawCat(ctx, game);
  for (let i = 0; i < 3; i++) {
    const seat = game.seats[i];
    const def = { x: seatXs[i], hair: '#4a2c25', sweater: '#6b3f5b', ...SEAT_DEFS[i] };
    if (seat && seat.gone) continue;
    drawCustomer(ctx, game, seat, def, i);
    drawBubble(ctx, seat, def);
  }
}

function drawPopups(ctx, game) {
  for (const p of game.popups) {
    const a = Math.min(1, p.t / 0.5);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = withAlpha('#1a1114', 0.35);
    rr(ctx, p.x - 44, p.y - 18, 88, 25, 8);
    ctx.fill();
    text(ctx, p.text, p.x, p.y, 17, p.color, { weight: 700, align: 'center', font: 'ui' });
    ctx.restore();
  }
}

// ---------------------------------------------------------------- full frame
export function drawWorld(ctx, game) {
  ctx.save();
  applyCamera(ctx, game);
  wallPanel(ctx);
  drawWindow(ctx, game);
  drawShelf(ctx, game);
  drawMenu(ctx, game);
  drawBulbs(ctx, game);
  drawFridge(ctx, game);
  drawPrepBack(ctx, game);
  drawStoveBack(ctx, game);
  drawOvenBack(ctx, game);
  drawPassBack(ctx, game);
  drawDeck(ctx, game);
  drawPrepTop(ctx, game);
  drawCounterProps(ctx, game);
  drawStoveTop(ctx, game);
  drawOvenTop(ctx, game);
  drawPassTop(ctx, game);
  drawMugs(ctx, game);
  drawChef(ctx, game);
  drawForeground(ctx, game);
  drawParticles(ctx, game, 'world');
  drawPopups(ctx, game);
  ctx.restore();
  // soft vignette keeps the eye on the kitchen
  const v = ctx.createRadialGradient(W / 2, 370, 280, W / 2, 370, 800);
  v.addColorStop(0, 'rgba(8,5,9,0)');
  v.addColorStop(1, 'rgba(8,5,9,0.38)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  if (game.flash > 0.01) {
    ctx.fillStyle = withAlpha('#ffe6b0', Math.min(0.16, game.flash * 0.24));
    ctx.fillRect(0, 0, W, H);
  }
}

