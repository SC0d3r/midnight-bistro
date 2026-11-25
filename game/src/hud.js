// The screen layer: order rail, clock, tips, prompts, meters, recipe book, title, pause and summary.
import { W, PAL, FONT, HUD_H, SHIFT_SECONDS, STATION_DEFS } from './config.js';
import { recipeById, drawIngredient } from './recipes.js';
import { nextStationId, stepVerb, focusSlot } from './cooking.js';
import { patienceColor } from './orders.js';
import { rr, circle, line, glow, withAlpha, text, measure, project, star, clamp } from './draw.js';

export const TRAY = { x: 240, y: 196, w: 800, h: 244 };
const CHIP_W = 183;
const CHIP_H = 86;
const CHIP_GAP = 10;

export function trayChipRect(i) {
  const col = i % 4;
  const row = Math.floor(i / 4);
  return {
    x: TRAY.x + 18 + col * (CHIP_W + CHIP_GAP),
    y: TRAY.y + 56 + row * (CHIP_H + 12),
    w: CHIP_W,
    h: CHIP_H,
  };
}

function fmtClock(minutes) {
  const m = ((Math.floor(minutes) % 1440) + 1440) % 1440;
  const hh = String(Math.floor(m / 60)).padStart(2, '0');
  const mm = String(m % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

function moonMark(ctx, x, y, r) {
  circle(ctx, x, y, r, '#f4dfad');
  circle(ctx, x + r * 0.42, y - r * 0.18, r * 0.82, '#17111b');
  circle(ctx, x - r * 0.36, y - r * 0.5, r * 0.14, withAlpha('#b9a06d', 0.55));
  circle(ctx, x - r * 0.55, y + r * 0.4, r * 0.1, withAlpha('#b9a06d', 0.5));
  ctx.fillStyle = withAlpha('#f4dfad', 0.65);
  star(ctx, x + r * 1.35, y - r * 0.95, 2.4, 4, 0.3);
  ctx.fill();
  circle(ctx, x + r * 1.7, y + r * 0.55, 1.2, withAlpha('#f4dfad', 0.5));
}

function drawClock(ctx, game, x, y) {
  circle(ctx, x, y - 5, 7, withAlpha('#f3bf6d', 0.16));
  ctx.strokeStyle = withAlpha('#f3bf6d', 0.7);
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(x, y - 5, 6, 0, Math.PI * 2);
  ctx.stroke();
  line(ctx, x, y - 5, x, y - 9, '#f3bf6d', 1.2);
  line(ctx, x, y - 5, x + 3, y - 5, '#f3bf6d', 1.2);
  const mins = game.clockMinutes === undefined ? 167 : game.clockMinutes;
  text(ctx, fmtClock(mins), x + 13, y + 3, 24, '#f6e3b9', { font: 'mono', weight: 700 });
  text(ctx, 'LAST ORDERS 03:00', x + 14, y + 16, 7, withAlpha('#d9c5a3', 0.55), { spacing: 1 });
}

export function drawHUD(ctx, game) {
  const g = ctx.createLinearGradient(0, 0, 0, HUD_H);
  g.addColorStop(0, '#120d15');
  g.addColorStop(0.72, '#1c141e');
  g.addColorStop(1, '#221820');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, HUD_H);
  ctx.fillStyle = withAlpha('#f3bf6d', 0.22);
  ctx.fillRect(0, HUD_H - 2, W, 1);
  ctx.fillStyle = withAlpha('#000000', 0.4);
  ctx.fillRect(0, HUD_H - 1, W, 3);

  moonMark(ctx, 44, 45, 17);
  text(ctx, 'MIDNIGHT BISTRO', 76, 36, 19, '#f6e8cb', { weight: 700, spacing: 1.5 });
  ctx.fillStyle = PAL.tealBright;
  rr(ctx, 76, 44, 46, 13, 3);
  ctx.fill();
  text(ctx, 'SHIFT ' + (game.shiftNumber || 1), 99, 54, 7.6, '#102926', { weight: 700, spacing: 1, align: 'center' });
  text(ctx, 'ROOFTOP TABLE  ·  OPEN LATE', 130, 54, 7.6, withAlpha('#cdbd9f', 0.7), { spacing: 0.8 });
  drawClock(ctx, game, 83, 82);

  // ticket rail
  const startX = 412;
  const tw = 146;
  const gap = 10;
  ctx.strokeStyle = '#6d5841';
  ctx.lineWidth = 4;
  line(ctx, startX - 16, 16, startX + tw * 3 + gap * 2 + 16, 16, '#493a2b', 5);
  line(ctx, startX - 16, 14, startX + tw * 3 + gap * 2 + 16, 14, withAlpha('#d6b98a', 0.35), 1.2);
  for (let i = 0; i < 3; i++) {
    const x = startX + i * (tw + gap);
    drawTicket(ctx, game, i, x, 22, tw, 66);
  }

  // tips, combo and the shift bar
  text(ctx, 'TIPS', 922, 24, 8, withAlpha('#cdbd9f', 0.7), { weight: 700, spacing: 2 });
  text(ctx, '$' + game.tips, 920, 56, 27, '#f6c66f', { font: 'mono', weight: 700 });
  circle(ctx, 906, 49, 6.5, '#c89a4c');
  circle(ctx, 906, 49, 4.4, '#f3cf82');
  text(ctx, 'T', 906, 52, 7, '#7a5220', { weight: 700, align: 'center' });
  // combo pill
  const pulse = 1 + (game.comboPulse || 0) * 0.5;
  ctx.save();
  ctx.translate(1074, 38);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = withAlpha('#2f6e69', 0.5);
  rr(ctx, -40, -20, 80, 40, 8);
  ctx.fill();
  ctx.strokeStyle = withAlpha('#8fd3c7', 0.45);
  ctx.lineWidth = 1;
  ctx.stroke();
  text(ctx, 'COMBO', 0, -8, 6.6, withAlpha('#bfe4db', 0.8), { weight: 700, spacing: 1.4, align: 'center' });
  text(ctx, 'x' + game.combo, 0, 13, 20, '#9fe4d6', { font: 'mono', weight: 700, align: 'center' });
  ctx.restore();
  // shift progress
  const pct = clamp(game.shiftTime / SHIFT_SECONDS, 0, 1);
  text(ctx, 'SHIFT', 1160, 23, 7, withAlpha('#cdbd9f', 0.65), { weight: 700, spacing: 1.4 });
  const rush = game.shiftTime >= SHIFT_SECONDS - 30;
  if (rush) {
    ctx.fillStyle = withAlpha('#b3453b', 0.9);
    rr(ctx, 1196, 15, 46, 14, 3);
    ctx.fill();
    text(ctx, 'RUSH', 1219, 25, 8, '#ffe0b0', { weight: 700, spacing: 2, align: 'center' });
  } else {
    text(ctx, Math.ceil(SHIFT_SECONDS - game.shiftTime) + 's', 1242, 23, 7, withAlpha('#cdbd9f', 0.55), { align: 'right' });
  }
  ctx.fillStyle = withAlpha('#000000', 0.4);
  rr(ctx, 1160, 32, 82, 7, 3);
  ctx.fill();
  const sg = ctx.createLinearGradient(1160, 0, 1242, 0);
  sg.addColorStop(0, '#4f9a90');
  sg.addColorStop(1, '#f3bf6d');
  ctx.fillStyle = sg;
  rr(ctx, 1160, 32, Math.max(3, 82 * pct), 7, 3);
  ctx.fill();
  text(ctx, (game.tipsEarned || 0) > 0 ? `+$${game.tipsEarned} tonight` : 'a quiet night so far', 1160, 54, 7.4, withAlpha('#cdbd9f', 0.55), {});
  if (game.muted) text(ctx, 'MUTED', 1242, 54, 7, withAlpha('#d98b7a', 0.8), { weight: 700, align: 'right', spacing: 1 });

  if (game.shot) {
    if (game.shot === 'chop' || game.shot === 'stove') drawMeters(ctx, game);
    return;
  }
  drawHintLine(ctx, game);
  drawPrompt(ctx, game);
  drawMeters(ctx, game);
  if (game.tray) drawTray(ctx, game);
}

function drawTicket(ctx, game, index, x, y, w, h) {
  const order = game.orders[index];
  const isFocus = focusSlot(game) === index;
  const seat = game.seats[index];
  ctx.save();
  if (!order) {
    ctx.strokeStyle = withAlpha('#8f795c', 0.35);
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    rr(ctx, x, y, w, h, 5);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'NO TICKET', x + w / 2, y + h / 2 + 3, 8, withAlpha('#cdbd9f', 0.32), { align: 'center', spacing: 2, weight: 700 });
    circle(ctx, x + w / 2, y - 2, 3, withAlpha('#8f795c', 0.35));
    ctx.restore();
    return;
  }
  const r = order.recipe;
  // shadow and paper
  ctx.fillStyle = 'rgba(8,5,8,0.5)';
  rr(ctx, x + 3, y + 4, w, h, 5);
  ctx.fill();
  const paper = ctx.createLinearGradient(0, y, 0, y + h);
  paper.addColorStop(0, isFocus ? '#fbf0d5' : '#efdfbd');
  paper.addColorStop(1, isFocus ? '#f2e2bd' : '#e2cea6');
  ctx.fillStyle = paper;
  rr(ctx, x, y, w, h, 5);
  ctx.fill();
  ctx.strokeStyle = isFocus ? '#f3bf6d' : withAlpha('#6e5335', 0.5);
  ctx.lineWidth = isFocus ? 2 : 1;
  ctx.stroke();
  if (isFocus) {
    ctx.fillStyle = withAlpha('#f3bf6d', 0.14);
    rr(ctx, x + 1, y + 1, w - 2, h - 2, 4);
    ctx.fill();
    ctx.fillStyle = '#f3bf6d';
    rr(ctx, x, y + 8, 3, h - 16, 1.5);
    ctx.fill();
  }
  // clip
  ctx.fillStyle = '#8d734f';
  rr(ctx, x + w / 2 - 7, y - 5, 14, 8, 3);
  ctx.fill();
  circle(ctx, x + w / 2, y - 1, 2.2, '#3b2b1c');
  // colour band and order number
  ctx.fillStyle = r.color;
  rr(ctx, x + 1, y + 1, w - 2, 4, 2);
  ctx.fill();
  text(ctx, '#' + String(index + 1).padStart(2, '0'), x + 8, y + 16, 7, withAlpha('#7a5a3a', 0.8), { font: 'mono', weight: 700 });
  text(ctx, seat ? seat.customer.name : 'Guest', x + w - 8, y + 16, 7, withAlpha('#7a5a3a', 0.75), { align: 'right', weight: 700, spacing: 0.8 });
  // dish name
  text(ctx, r.short, x + 8, y + 31, 11.4, '#33231a', { font: 'serif', weight: 700 });
  // ingredient icons and step
  r.ingredients.forEach((id, k) => {
    const got = order.gathered.includes(id);
    drawIngredient(ctx, id, x + 14 + k * 18, y + 45, 6.2);
    if (got) {
      circle(ctx, x + 14 + k * 18, y + 45, 8.4, withAlpha('#2f6e69', 0.16));
    }
  });
  const verb = stepVerb(order);
  const done = order.step === 'serve';
  ctx.fillStyle = done ? withAlpha('#2f6e69', 0.9) : withAlpha(r.color, 0.16);
  rr(ctx, x + 68, y + 38, w - 76, 14, 3);
  ctx.fill();
  text(ctx, done ? 'SERVE ' + (index + 1) : verb, x + w - 12, y + 48, 7.4, done ? '#e8f3e7' : '#4a3324', { weight: 700, spacing: 1, align: 'right' });
  // patience
  const pc = patienceColor(order.patience);
  ctx.fillStyle = withAlpha('#3b2b1c', 0.18);
  rr(ctx, x + 8, y + h - 10, w - 16, 4, 2);
  ctx.fill();
  ctx.fillStyle = pc;
  rr(ctx, x + 8, y + h - 10, Math.max(2, (w - 16) * order.patience), 4, 2);
  ctx.fill();
  if (order.patience < 0.25) {
    ctx.save();
    ctx.globalAlpha = 0.35 + Math.sin(game.time * 8) * 0.25;
    ctx.fillStyle = '#b3453b';
    rr(ctx, x + 8, y + h - 10, Math.max(2, (w - 16) * order.patience), 4, 2);
    ctx.fill();
    ctx.restore();
  }
  if (isFocus) {
    ctx.fillStyle = '#f3bf6d';
    circle(ctx, x + 8.5, y + 5.5, 2.2, '#f3bf6d');
  }
  ctx.restore();
}

function drawHintLine(ctx, game) {
  if (!game.hintT || game.hintT <= 0) return;
  const a = Math.min(1, game.hintT / 0.35);
  const tone = game.hintTone === 'good' ? '#bfe4d8' : game.hintTone === 'bad' ? '#ffc5ad' : '#f0e3c7';
  ctx.save();
  ctx.globalAlpha = a;
  ctx.font = `400 12px ${FONT.ui}`;
  const w = Math.min(760, ctx.measureText(game.hintText).width + 36);
  ctx.fillStyle = withAlpha('#120d15', 0.72);
  rr(ctx, 640 - w / 2, 102, w, 25, 8);
  ctx.fill();
  ctx.strokeStyle = withAlpha(tone, 0.22);
  ctx.lineWidth = 1;
  ctx.stroke();
  text(ctx, game.hintText, 640, 119, 12, tone, { align: 'center' });
  ctx.restore();
}

function drawPrompt(ctx, game) {
  if (!game.chef || game.shot) return;
  const chef = game.chef;
  const st = STATION_DEFS.find((s) => s.id === chef.station) || STATION_DEFS[1];
  const near = Math.abs(st.x - chef.x) < 112;
  const p = project(game.camera, chef.x, 294);
  let label = near ? 'E  ' + st.verb : 'WALK TO A STATION';
  let hot = near;
  let sub = '';
  if (game.tray) {
    label = 'PICK INGREDIENTS  ·  1-8';
    hot = true;
    sub = 'Tab closes the tray? No: Esc closes it.';
  } else if (game.chop) {
    label = 'SPACE  CHOP';
    hot = true;
    sub = 'Hit the bright slice.';
  } else if (game.cook) {
    label = 'SPACE  STOP THE HEAT';
    hot = true;
  } else if (near) {
    const slot = game.orders.findIndex((o) => o && nextStationId(o) === st.id);
    if (slot < 0) {
      label = st.label + '  ·  NOTHING YET';
      hot = false;
    }
  }
  ctx.save();
  ctx.font = `400 12px ${FONT.ui}`;
  const w = ctx.measureText(label).width + 30;
  ctx.fillStyle = hot ? withAlpha('#1a1114', 0.86) : withAlpha('#1a1114', 0.6);
  rr(ctx, p.x - w / 2, p.y - 15, w, 26, 9);
  ctx.fill();
  ctx.strokeStyle = hot ? withAlpha('#f3bf6d', 0.55) : withAlpha('#f6e8cb', 0.12);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = hot ? '#f3bf6d' : withAlpha('#f6e8cb', 0.3);
  rr(ctx, p.x - w / 2 + 6, p.y - 10, 15, 16, 4);
  ctx.fill();
  text(ctx, 'E', p.x - w / 2 + 13.5, p.y + 2, 9, '#2a1a12', { weight: 700, align: 'center' });
  text(ctx, label.replace(/^E\s\s/, ''), p.x - w / 2 + 27, p.y + 2, 11.5, hot ? '#f6e8cb' : withAlpha('#f6e8cb', 0.5), { weight: 600 });
  ctx.restore();
}

function drawMeters(ctx, game) {
  if (game.shot === 'cover') return;
  const active = game.chop || game.cook;
  if (!active) return;
  const x = 640 - 250;
  const y = 124;
  const w = 500;
  const h = 62;
  ctx.save();
  ctx.fillStyle = 'rgba(8,5,8,0.55)';
  rr(ctx, x + 3, y + 4, w, h, 10);
  ctx.fill();
  const panel = ctx.createLinearGradient(0, y, 0, y + h);
  panel.addColorStop(0, '#2d2129');
  panel.addColorStop(1, '#1a131b');
  ctx.fillStyle = panel;
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = withAlpha('#d7a56a', 0.5);
  ctx.lineWidth = 1.4;
  ctx.stroke();
  for (const cx of [x + 10, x + w - 10]) {
    circle(ctx, cx, y + 10, 2, withAlpha('#d7a56a', 0.7));
    circle(ctx, cx, y + h - 10, 2, withAlpha('#d7a56a', 0.7));
  }
  if (game.chop) {
    const c = game.chop;
    text(ctx, 'CHOP', x + 20, y + 24, 12, '#f3bf6d', { weight: 700, spacing: 3 });
    text(ctx, c.zone ? 'THREE CLEAN CUTS  ·  SPACE' : '', x + 88, y + 23, 7.6, withAlpha('#e8d8b8', 0.6), { spacing: 1 });
    for (let i = 0; i < 3; i++) {
      const px = x + w - 26 - i * 18;
      ctx.strokeStyle = withAlpha('#f3bf6d', 0.5);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(px, y + 18, 5.4, 0, Math.PI * 2);
      ctx.stroke();
      if (i < c.chops) {
        circle(ctx, px, y + 18, 4, '#f3bf6d');
      }
    }
    const tx = x + 20;
    const tw = w - 40;
    const ty = y + 36;
    ctx.fillStyle = withAlpha('#0b090c', 0.7);
    rr(ctx, tx, ty, tw, 12, 5);
    ctx.fill();
    const zx = tx + c.zone[0] * tw;
    const zw = (c.zone[1] - c.zone[0]) * tw;
    ctx.fillStyle = withAlpha('#5fb3a6', 0.55);
    rr(ctx, zx, ty, zw, 12, 4);
    ctx.fill();
    ctx.fillStyle = withAlpha('#d9f6ec', 0.22);
    ctx.fillRect(zx + zw / 2 - 0.6, ty, 1.2, 12);
    const nx = tx + c.pos * tw;
    ctx.fillStyle = c.flash > 0 ? '#fff6d8' : '#f6e8cb';
    rr(ctx, nx - 2, ty - 3, 4, 18, 2);
    ctx.fill();
    circle(ctx, nx, ty + 6, 3.4, c.flash > 0 ? '#fff6d8' : '#f3bf6d');
    text(ctx, 'SLICE', zx + zw / 2, ty + 9, 6.6, '#193b37', { weight: 700, align: 'center', spacing: 1 });
  } else if (game.cook) {
    const c = game.cook;
    text(ctx, 'HEAT', x + 20, y + 24, 12, '#f3bf6d', { weight: 700, spacing: 3 });
    text(ctx, c.station === 'oven' ? 'STOP IN THE GREEN  ·  OVEN' : 'STOP IN THE GREEN  ·  STOVE', x + 82, y + 23, 7.6, withAlpha('#e8d8b8', 0.6), { spacing: 1 });
    const tx = x + 20;
    const tw = w - 40;
    const ty = y + 35;
    const grad = ctx.createLinearGradient(tx, 0, tx + tw, 0);
    grad.addColorStop(0, '#3d6a74');
    grad.addColorStop(0.35, '#5b8a63');
    grad.addColorStop(0.7, '#c07a3c');
    grad.addColorStop(1, '#9c352c');
    ctx.fillStyle = grad;
    rr(ctx, tx, ty, tw, 14, 5);
    ctx.fill();
    const bx = tx + c.band[0] * tw;
    const bw = (c.band[1] - c.band[0]) * tw;
    ctx.fillStyle = withAlpha('#9fe4ae', 0.82);
    rr(ctx, bx, ty - 2, bw, 18, 4);
    ctx.fill();
    ctx.strokeStyle = withAlpha('#e5ffe4', 0.55);
    ctx.lineWidth = 1;
    rr(ctx, bx, ty - 2, bw, 18, 4);
    ctx.stroke();
    text(ctx, 'GREEN', bx + bw / 2, ty + 26, 6.6, withAlpha('#bff0c0', 0.7), { align: 'center', weight: 700, spacing: 1 });
    const nx = tx + c.heat * tw;
    ctx.fillStyle = '#f9f2dd';
    rr(ctx, nx - 2.4, ty - 5, 4.8, 24, 2);
    ctx.fill();
    ctx.fillStyle = '#3b2b1c';
    ctx.fillRect(nx - 1, ty - 1, 2, 16);
    ctx.fillStyle = c.flash > 0 ? '#fff6d8' : withAlpha('#f6e8cb', 0.7);
    rr(ctx, tx + tw - 2, ty - 4, 4, 22, 1.4);
    ctx.fill();
  }
  ctx.restore();
}

function drawTray(ctx, game) {
  const t = game.tray;
  if (!t) return;
  const order = game.orders[t.slot];
  if (!order) return;
  ctx.save();
  ctx.fillStyle = 'rgba(8,5,9,0.5)';
  ctx.fillRect(0, HUD_H, W, 480);
  ctx.fillStyle = 'rgba(12,8,11,0.5)';
  rr(ctx, TRAY.x + 4, TRAY.y + 5, TRAY.w, TRAY.h, 12);
  ctx.fill();
  const wood = ctx.createLinearGradient(0, TRAY.y, 0, TRAY.y + TRAY.h);
  wood.addColorStop(0, '#3a2a22');
  wood.addColorStop(0.5, '#2c201b');
  wood.addColorStop(1, '#1f1715');
  ctx.fillStyle = wood;
  rr(ctx, TRAY.x, TRAY.y, TRAY.w, TRAY.h, 12);
  ctx.fill();
  ctx.strokeStyle = withAlpha('#d7a56a', 0.5);
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = '#17100f';
  rr(ctx, TRAY.x + 10, TRAY.y + 10, TRAY.w - 20, 36, 6);
  ctx.fill();
  text(ctx, 'FRIDGE TRAY', TRAY.x + 26, TRAY.y + 34, 15, '#f3bf6d', { weight: 700, spacing: 2 });
  text(ctx, 'PICK THE THREE ON THE TICKET FOR ' + order.recipe.short.toUpperCase(), TRAY.x + 160, TRAY.y + 33, 9, withAlpha('#e8d8b8', 0.7), { spacing: 0.8 });
  text(ctx, '1-8', TRAY.x + TRAY.w - 26, TRAY.y + 34, 10, withAlpha('#f3bf6d', 0.8), { align: 'right', weight: 700 });
  for (let i = 0; i < 8; i++) {
    const id = order.tray[i];
    const rect = trayChipRect(i);
    const picked = order.gathered.includes(id);
    const wrong = t.wrong === i && t.flash > 0;
    ctx.fillStyle = picked ? withAlpha('#2f6e69', 0.55) : wrong ? withAlpha('#8a3a32', 0.7) : '#241b1a';
    rr(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.strokeStyle = picked ? withAlpha('#9fe4d6', 0.7) : wrong ? withAlpha('#ffb0a0', 0.9) : withAlpha('#d7a56a', 0.25);
    ctx.lineWidth = picked || wrong ? 1.6 : 1;
    ctx.stroke();
    circle(ctx, rect.x + 32, rect.y + rect.h / 2, 21, withAlpha(picked ? '#1d4a46' : '#1a1211', 0.7));
    drawIngredient(ctx, id, rect.x + 32, rect.y + rect.h / 2, 18);
    text(ctx, require_name(id), rect.x + 60, rect.y + 36, 12, picked ? '#d6f1e8' : '#f0e3c7', { weight: 600 });
    text(ctx, picked ? 'IN THE BASKET' : 'KEY ' + (i + 1), rect.x + 60, rect.y + 54, 7, withAlpha(picked ? '#9fe4d6' : '#cdbd9f', 0.65), { spacing: 0.8, weight: 700 });
    if (picked) {
      ctx.strokeStyle = '#9fe4d6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rect.x + rect.w - 24, rect.y + 22);
      ctx.lineTo(rect.x + rect.w - 17, rect.y + 30);
      ctx.lineTo(rect.x + rect.w - 7, rect.y + 15);
      ctx.stroke();
    }
    text(ctx, String(i + 1), rect.x + 10, rect.y + 15, 8, withAlpha('#f3bf6d', 0.6), { font: 'mono', weight: 700 });
  }
  ctx.restore();
}

function require_name(id) {
  const names = {
    dough: 'Dough', tomato: 'Tomato', mozzarella: 'Mozzarella', basil: 'Basil', noodles: 'Noodles',
    miso: 'Miso', egg: 'Egg', flour: 'Flour', berries: 'Berries', honey: 'Honey', garlic: 'Garlic',
    chili: 'Chili', cream: 'Cream', salmon: 'Salmon', lemon: 'Lemon', mushroom: 'Mushroom',
  };
  return names[id] || id;
}

// ---------------------------------------------------------------- overlays

function keycap(ctx, label, x, y, w) {
  const width = w || Math.max(22, label.length * 8 + 12);
  ctx.fillStyle = withAlpha('#f6e8cb', 0.1);
  rr(ctx, x, y - 13, width, 21, 4);
  ctx.fill();
  ctx.strokeStyle = withAlpha('#f6e8cb', 0.28);
  ctx.lineWidth = 1;
  ctx.stroke();
  text(ctx, label, x + width / 2, y + 2, 10, '#efe1c2', { weight: 700, align: 'center', spacing: 0.6 });
  return width;
}

function controlRow(ctx, keys, label, x, y) {
  let cx = x;
  for (const k of keys) cx += keycap(ctx, k, cx, y) + 5;
  text(ctx, label, cx + 5, y + 2, 11.5, withAlpha('#e8dcc4', 0.78), {});
}

export function drawTitle(ctx, game) {
  const bg = ctx.createLinearGradient(0, 0, 0, 720);
  bg.addColorStop(0, withAlpha('#0b0710', 0.55));
  bg.addColorStop(0.45, withAlpha('#0b0710', 0.35));
  bg.addColorStop(1, withAlpha('#0b0710', 0.78));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, 720);
  // hanging sign
  const sx = 354;
  const sy = 116;
  const sw = 572;
  const sh = 156;
  ctx.save();
  line(ctx, sx + 74, -10, sx + 62, sy + 6, '#2a1c17', 3);
  line(ctx, sx + sw - 74, -10, sx + sw - 62, sy + 6, '#2a1c17', 3);
  circle(ctx, sx + 62, sy + 8, 4, '#c89a52');
  circle(ctx, sx + sw - 62, sy + 8, 4, '#c89a52');
  ctx.fillStyle = 'rgba(6,4,7,0.5)';
  rr(ctx, sx + 5, sy + 8, sw, sh, 10);
  ctx.fill();
  const plank = ctx.createLinearGradient(0, sy, 0, sy + sh);
  plank.addColorStop(0, '#3b261c');
  plank.addColorStop(0.5, '#2b1b15');
  plank.addColorStop(1, '#1e1310');
  ctx.fillStyle = plank;
  rr(ctx, sx, sy, sw, sh, 8);
  ctx.fill();
  ctx.strokeStyle = withAlpha('#d7a56a', 0.55);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = withAlpha('#d7a56a', 0.16);
  ctx.lineWidth = 1;
  rr(ctx, sx + 9, sy + 9, sw - 18, sh - 18, 5);
  ctx.stroke();
  for (const [bx, by] of [[sx + 18, sy + 18], [sx + sw - 18, sy + 18], [sx + 18, sy + sh - 18], [sx + sw - 18, sy + sh - 18]]) {
    circle(ctx, bx, by, 2.6, withAlpha('#e2b578', 0.8));
  }
  circle(ctx, sx + 54, sy + 44, 13, withAlpha('#f3bf6d', 0.9));
  circle(ctx, sx + 59, sy + 39, 12, '#2a1a15');
  for (const [dx, dy, r] of [[36, 98, 2], [58, 82, 1.4], [sw - 66, 64, 2], [sw - 48, 46, 1.3], [sw - 84, 102, 1.6]]) {
    ctx.fillStyle = withAlpha('#f3cf89', 0.7);
    star(ctx, sx + dx, sy + dy, r, 4, 0.3);
    ctx.fill();
  }
  text(ctx, 'Midnight', sx + sw / 2, sy + 70, 58, '#f6e6c2', { font: 'serif', style: 'italic', align: 'center' });
  text(ctx, 'B I S T R O', sx + sw / 2, sy + 108, 22, '#f3bf6d', { font: 'serif', weight: 700, align: 'center', spacing: 4 });
  line(ctx, sx + 130, sy + 120, sx + sw - 130, sy + 120, withAlpha('#f3bf6d', 0.4), 1);
  text(ctx, 'a tiny rooftop kitchen, open at 2 AM', sx + sw / 2, sy + 139, 12, withAlpha('#e8d8b8', 0.72), { font: 'serif', style: 'italic', align: 'center' });
  ctx.restore();
  // best score
  if (game.best > 0) {
    text(ctx, 'BEST NIGHT', 640, 300, 8, withAlpha('#cdbd9f', 0.6), { align: 'center', weight: 700, spacing: 2 });
    text(ctx, '$' + game.best, 640, 322, 20, '#f3bf6d', { align: 'center', font: 'mono', weight: 700 });
  }
  // start prompt
  const pulse = 0.6 + Math.sin(game.time * 2.4) * 0.4;
  ctx.fillStyle = withAlpha('#f3bf6d', 0.14 + pulse * 0.08);
  rr(ctx, 640 - 146, 346, 292, 46, 10);
  ctx.fill();
  ctx.strokeStyle = withAlpha('#f3bf6d', 0.35 + pulse * 0.3);
  ctx.lineWidth = 1.4;
  ctx.stroke();
  text(ctx, 'PRESS ENTER TO OPEN', 640, 375, 15, '#f6e6c2', { weight: 700, align: 'center', spacing: 2.4 });
  // controls
  const cx = 316;
  controlRow(ctx, ['A', 'D'], 'walk the counter', cx, 438);
  controlRow(ctx, ['E'], 'use the station under you', cx, 466);
  controlRow(ctx, ['1', '2', '3', '4'], 'fridge picks, then serve 1-3', cx, 494);
  controlRow(ctx, ['SPACE'], 'chop and stop the heat', cx + 500, 438);
  controlRow(ctx, ['TAB'], 'recipe book', cx + 500, 466);
  controlRow(ctx, ['P'], 'pause   ·   M mute', cx + 500, 494);
  text(ctx, 'or use the mouse: stations, chips and customers all click.', 640, 534, 11, withAlpha('#e8dcc4', 0.55), { align: 'center', style: 'italic' });
  text(ctx, 'The cat is not on the menu.', 640, 678, 10.5, withAlpha('#e8dcc4', 0.35), { align: 'center', font: 'serif', style: 'italic' });
}

export function drawPause(ctx, game) {
  ctx.fillStyle = withAlpha('#08050a', 0.66);
  ctx.fillRect(0, 0, W, 720);
  ctx.fillStyle = withAlpha('#1c141d', 0.9);
  rr(ctx, 430, 176, 420, 350, 14);
  ctx.fill();
  ctx.strokeStyle = withAlpha('#d7a56a', 0.4);
  ctx.lineWidth = 1.4;
  ctx.stroke();
  text(ctx, 'PAUSED', 640, 248, 40, '#f6e6c2', { font: 'serif', style: 'italic', align: 'center' });
  text(ctx, 'The rain keeps falling.', 640, 276, 12, withAlpha('#e8d8b8', 0.6), { align: 'center', style: 'italic' });
  line(ctx, 500, 296, 780, 296, withAlpha('#f3bf6d', 0.3), 1);
  const rows = [
    [['A', 'D'], 'walk'],
    [['E'], 'station'],
    [['SPACE'], 'chop / heat'],
    [['1', '-', '8'], 'ingredients'],
    [['1', '-', '3'], 'serve'],
    [['TAB'], 'recipes'],
    [['P'], 'resume'],
    [['M'], 'mute'],
  ];
  rows.forEach(([keys, label], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    controlRow(ctx, keys, label, 478 + col * 190, 330 + row * 34);
  });
  text(ctx, 'P TO RESUME', 640, 494, 12, withAlpha('#f3bf6d', 0.85), { weight: 700, align: 'center', spacing: 2 });
}

export function drawRecipeBook(ctx, game) {
  ctx.fillStyle = withAlpha('#08050a', 0.72);
  ctx.fillRect(0, 0, W, 720);
  ctx.fillStyle = withAlpha('#1f171d', 0.96);
  rr(ctx, 250, 92, 780, 556, 14);
  ctx.fill();
  ctx.strokeStyle = withAlpha('#d7a56a', 0.45);
  ctx.lineWidth = 1.6;
  ctx.stroke();
  text(ctx, 'RECIPE BOOK', 640, 130, 30, '#f6e6c2', { font: 'serif', style: 'italic', align: 'center' });
  text(ctx, 'six things worth staying up for', 640, 152, 10.5, withAlpha('#e8d8b8', 0.6), { align: 'center', style: 'italic' });
  line(ctx, 300, 166, 980, 166, withAlpha('#f3bf6d', 0.28), 1);
  const stationLabel = { stove: 'STOVE', oven: 'OVEN' };
  for (let i = 0; i < 6; i++) {
    const r = recipeById(['margherita', 'ramen', 'pancakes', 'noodles', 'soup', 'salmon'][i]);
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 282 + col * 380;
    const y = 184 + row * 148;
    ctx.fillStyle = withAlpha('#2a2026', 0.85);
    rr(ctx, x, y, 356, 132, 8);
    ctx.fill();
    ctx.strokeStyle = withAlpha(r.color, 0.5);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = r.color;
    rr(ctx, x, y, 5, 132, 2);
    ctx.fill();
    text(ctx, r.name, x + 18, y + 26, 15, '#f2e4c6', { font: 'serif', weight: 700 });
    text(ctx, r.blurb, x + 18, y + 43, 9, withAlpha('#e8d8b8', 0.55), { style: 'italic', font: 'serif' });
    r.ingredients.forEach((id, k) => {
      const ix = x + 30 + k * 90;
      circle(ctx, ix, y + 72, 15, withAlpha('#120c10', 0.5));
      drawIngredient(ctx, id, ix, y + 72, 11);
      text(ctx, require_name(id), ix, y + 96, 8.4, withAlpha('#e8d8b8', 0.7), { align: 'center' });
    });
    text(ctx, 'FRIDGE', x + 18, y + 117, 7.2, withAlpha('#9fe4d6', 0.8), { weight: 700, spacing: 1 });
    text(ctx, '>', x + 58, y + 117, 7.2, withAlpha('#e8d8b8', 0.3), {});
    text(ctx, 'PREP', x + 70, y + 117, 7.2, withAlpha('#9fe4d6', 0.8), { weight: 700, spacing: 1 });
    text(ctx, '>', x + 102, y + 117, 7.2, withAlpha('#e8d8b8', 0.3), {});
    text(ctx, stationLabel[r.cook], x + 114, y + 117, 7.2, withAlpha('#f3bf6d', 0.9), { weight: 700, spacing: 1 });
    text(ctx, '>', x + 162, y + 117, 7.2, withAlpha('#e8d8b8', 0.3), {});
    text(ctx, 'PASS', x + 174, y + 117, 7.2, withAlpha('#9fe4d6', 0.8), { weight: 700, spacing: 1 });
    text(ctx, '$' + r.tip + ' base', x + 340, y + 117, 7.6, withAlpha('#f3bf6d', 0.7), { align: 'right', font: 'mono' });
    text(ctx, (i + 1) + '', x + 340, y + 26, 9, withAlpha('#e8d8b8', 0.35), { align: 'right', font: 'mono' });
  }
  text(ctx, 'TAB to close  ·  the ticket rail always tells you the next step', 640, 628, 10, withAlpha('#e8d8b8', 0.6), { align: 'center', style: 'italic' });
}

export function drawSummary(ctx, game) {
  ctx.fillStyle = withAlpha('#08050a', 0.76);
  ctx.fillRect(0, 0, W, 720);
  const x = 372;
  const y = 92;
  const w = 536;
  const h = 550;
  ctx.fillStyle = 'rgba(8,6,8,0.45)';
  rr(ctx, x + 8, y + 10, w, h, 14);
  ctx.fill();
  const paper = ctx.createLinearGradient(0, y, 0, y + h);
  paper.addColorStop(0, '#f4e7cb');
  paper.addColorStop(1, '#e4d0ab');
  ctx.fillStyle = paper;
  rr(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = '#b98a56';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = withAlpha('#8a623c', 0.28);
  ctx.lineWidth = 1;
  rr(ctx, x + 12, y + 12, w - 24, h - 24, 8);
  ctx.stroke();
  text(ctx, 'SHIFT ' + (game.shiftNumber || 1) + ' COMPLETE', 640, y + 38, 9, withAlpha('#7a5a3a', 0.8), { align: 'center', weight: 700, spacing: 3 });
  text(ctx, 'The lights stay on.', 640, y + 76, 32, '#33231a', { font: 'serif', style: 'italic', align: 'center' });
  // stars
  const earned = game.tipsEarned >= 200 ? 3 : game.tipsEarned >= 110 ? 2 : game.tipsEarned >= 40 ? 1 : 0;
  for (let i = 0; i < 3; i++) {
    const sx = 640 + (i - 1) * 66;
    const sy = y + 118;
    star(ctx, sx, sy, 24, 5, 0.44);
    if (i < earned) {
      ctx.fillStyle = '#e0a343';
      ctx.fill();
      ctx.strokeStyle = '#b47f2e';
    } else {
      ctx.fillStyle = withAlpha('#8a6a44', 0.12);
      ctx.fill();
      ctx.strokeStyle = withAlpha('#8a6a44', 0.35);
    }
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  text(ctx, ['a slow night', 'a good night', 'a night to remember', 'the owls will talk about this'][earned], 640, y + 158, 11, withAlpha('#6b4c30', 0.8), { align: 'center', style: 'italic' });
  line(ctx, x + 60, y + 180, x + w - 60, y + 180, withAlpha('#8a623c', 0.25), 1);
  const rows = [
    ['Dishes served', String(game.served || 0)],
    ['Perfect cooks', String(game.perfects || 0)],
    ['Tickets lost', String(game.expired || 0)],
    ['Tips earned', '$' + (game.tipsEarned || 0)],
    ['Total in the jar', '$' + game.tips],
    ['Best night', '$' + Math.max(game.best || 0, game.tipsEarned || 0)],
  ];
  rows.forEach(([label, value], i) => {
    const ry = y + 208 + i * 29;
    text(ctx, label, x + 58, ry, 12, withAlpha('#4a3324', 0.7), {});
    text(ctx, value, x + w - 58, ry, i >= 3 ? 14 : 12, i >= 4 ? '#8a4f2a' : '#33231a', { align: 'right', font: i >= 3 ? 'mono' : 'ui', weight: i >= 4 ? 700 : 400 });
    if (i < rows.length - 1) line(ctx, x + 58, ry + 9, x + w - 58, ry + 9, withAlpha('#8a623c', 0.12), 1);
  });
  const pulse = 0.55 + Math.sin(game.time * 3) * 0.35;
  ctx.fillStyle = withAlpha('#3f8179', 0.14 + pulse * 0.1);
  rr(ctx, 640 - 155, y + h - 92, 310, 42, 8);
  ctx.fill();
  ctx.strokeStyle = withAlpha('#3f8179', 0.5);
  ctx.stroke();
  text(ctx, 'PRESS ENTER FOR ANOTHER SHIFT', 640, y + h - 66, 11, withAlpha('#2f5e58', 0.95), { align: 'center', weight: 700, spacing: 1.4 });
  text(ctx, 'P pause  ·  M mute  ·  TAB recipes', 640, y + h - 26, 8.5, withAlpha('#6b4c30', 0.55), { align: 'center' });
}

