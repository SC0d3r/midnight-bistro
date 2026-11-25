// Tiny drawing primitives shared by the scene, the HUD and the staged screenshots.
import { FONT } from './config.js';

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;

export function withAlpha(hex, alpha) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function rr(ctx, x, y, w, h, r = 8) {
  const k = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.arcTo(x + w, y, x + w, y + h, k);
  ctx.arcTo(x + w, y + h, x, y + h, k);
  ctx.arcTo(x, y + h, x, y, k);
  ctx.arcTo(x, y, x + w, y, k);
  ctx.closePath();
}

export function fillRR(ctx, x, y, w, h, r, fill) {
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

export function strokeRR(ctx, x, y, w, h, r, stroke, width = 1) {
  rr(ctx, x, y, w, h, r);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}

export function circle(ctx, x, y, r, fill) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

export function glow(ctx, x, y, r, color, alpha = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, withAlpha(color, alpha));
  g.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function line(ctx, x0, y0, x1, y1, color, width = 1) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

export function star(ctx, x, y, r, points = 5, inner = 0.44, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = rot + (i * Math.PI) / points;
    const rad = i % 2 === 0 ? r : r * inner;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function heart(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.34);
  ctx.bezierCurveTo(x - s, y - s * 0.28, x - s * 0.5, y - s * 0.95, x, y - s * 0.42);
  ctx.bezierCurveTo(x + s * 0.5, y - s * 0.95, x + s, y - s * 0.28, x, y + s * 0.34);
  ctx.closePath();
}

export function text(ctx, str, x, y, size, color, opts = {}) {
  const {
    font = 'ui',
    weight = 400,
    align = 'left',
    baseline = 'alphabetic',
    alpha = 1,
    spacing = 0,
    style = 'normal',
  } = opts;
  ctx.save();
  ctx.font = `${style} ${weight} ${size}px ${FONT[font] || FONT.ui}`;
  ctx.fillStyle = color;
  ctx.textAlign = spacing === 0 ? align : 'left';
  ctx.textBaseline = baseline;
  ctx.globalAlpha *= alpha;
  if (spacing === 0) {
    ctx.fillText(str, x, y);
  } else {
    const chars = [...str];
    let total = 0;
    for (const c of chars) total += ctx.measureText(c).width + spacing;
    total -= spacing;
    let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    for (const c of chars) {
      ctx.fillText(c, cx, y);
      cx += ctx.measureText(c).width + spacing;
    }
  }
  ctx.restore();
}

export function measure(ctx, str, size, opts = {}) {
  ctx.save();
  ctx.font = `${opts.style || 'normal'} ${opts.weight || 400} ${size}px ${FONT[opts.font || 'ui']}`;
  const w = ctx.measureText(str).width;
  ctx.restore();
  return w;
}

export function project(camera, x, y) {
  return {
    x: 640 + (x - camera.x) * camera.zoom,
    y: 400 + (y - camera.y) * camera.zoom,
  };
}
