// Steam, sparks, flour, basil bits, hearts, coins and the rain that never stops.
import { heart, withAlpha, circle } from './draw.js';

export function createFx() {
  return {
    list: [],
    rain: Array.from({ length: 74 }, (_, i) => ({
      x: (i * 97.3) % 1,
      y: (i * 0.371) % 1,
      len: 0.05 + ((i * 0.137) % 0.12),
      speed: 0.16 + ((i * 0.071) % 0.22),
      a: 0.08 + ((i * 0.033) % 0.14),
    })),
    drip: Array.from({ length: 9 }, (_, i) => ({
      x: (i * 0.113 + 0.06) % 1,
      y: (i * 0.269 + 0.1) % 1,
      len: 0.04 + ((i * 0.037) % 0.09),
    })),
  };
}

function push(game, p) {
  if (game.fx.list.length > 420) game.fx.list.shift();
  game.fx.list.push(p);
}

export function emitSteam(game, x, y, n = 3, spread = 14, opts = {}) {
  for (let i = 0; i < n; i++) {
    const r = (opts.r || 6) + game.rng.range(0, 5);
    push(game, {
      k: 'steam', x: x + game.rng.range(-spread, spread), y: y + game.rng.range(-4, 4),
      vx: game.rng.range(-9, 9), vy: -16 - game.rng.range(0, 20),
      life: 1.4 + game.rng.range(0, 1.1), max: 2.6, r, a: opts.a || 0.16,
    });
  }
}

export function emitSpark(game, x, y, n = 2) {
  for (let i = 0; i < n; i++) {
    push(game, {
      k: 'spark', x: x + game.rng.range(-9, 9), y,
      vx: game.rng.range(-26, 26), vy: -34 - game.rng.range(0, 55),
      life: 0.4 + game.rng.range(0, 0.5), max: 0.9, r: 1 + game.rng.range(0, 1.4),
    });
  }
}

export function emitFlour(game, x, y, n = 10) {
  for (let i = 0; i < n; i++) {
    push(game, {
      k: 'flour', x: x + game.rng.range(-18, 18), y: y + game.rng.range(-6, 4),
      vx: game.rng.range(-40, 40), vy: -12 - game.rng.range(0, 34),
      life: 0.7 + game.rng.range(0, 0.7), max: 1.4, r: 1 + game.rng.range(0, 1.8),
    });
  }
}

export function emitBits(game, x, y, color = '#6ea84f', n = 7) {
  for (let i = 0; i < n; i++) {
    push(game, {
      k: 'bit', x: x + game.rng.range(-16, 16), y: y + game.rng.range(-4, 4),
      vx: game.rng.range(-50, 50), vy: -18 - game.rng.range(0, 42),
      life: 0.7 + game.rng.range(0, 0.6), max: 1.3, r: 2 + game.rng.range(0, 2), color,
      rot: game.rng.range(0, 6), vr: game.rng.range(-5, 5),
    });
  }
}

export function emitHearts(game, x, y, n = 4) {
  for (let i = 0; i < n; i++) {
    push(game, {
      k: 'heart', x: x + game.rng.range(-18, 18), y: y + game.rng.range(-6, 6),
      vx: game.rng.range(-12, 12), vy: -26 - game.rng.range(0, 26),
      life: 1.1 + game.rng.range(0, 0.9), max: 2, r: 5 + game.rng.range(0, 4),
    });
  }
}

export function heartBubble(game, x, y) {
  emitHearts(game, x, y - 26, 5);
}

export function emitCoins(game, x, y, tx, ty, n = 4) {
  for (let i = 0; i < n; i++) {
    push(game, {
      k: 'coin', x: x + game.rng.range(-12, 12), y: y + game.rng.range(-8, 8),
      tx, ty, t: -i * 0.08, dur: 0.9 + game.rng.range(0, 0.3), r: 4 + game.rng.range(0, 1.6),
      arc: -70 - game.rng.range(0, 50), life: 2, max: 2,
    });
  }
}

export function emitSizzle(game, x, y) {
  emitSpark(game, x, y, 1);
  if (game.rng.chance(0.5)) emitSteam(game, x, y - 8, 1, 6, { a: 0.13, r: 6 });
}

export function updateParticles(game, dt) {
  const list = game.fx.list;
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    p.life -= dt;
    if (p.life <= 0) {
      list.splice(i, 1);
      continue;
    }
    if (p.k === 'coin') {
      p.t += dt;
      const u = Math.max(0, Math.min(1, p.t / p.dur));
      p.x = p.x + (p.tx - p.x) * Math.min(1, dt * 4.2);
      p.y = p.y + (p.ty - p.y) * Math.min(1, dt * 3.4) + p.arc * dt * (1 - u);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.k === 'steam') {
      p.vy -= 4 * dt;
      p.vx *= 1 - dt * 0.4;
      p.r += dt * 3.2;
    } else if (p.k === 'flour') {
      p.vy += 30 * dt;
      p.vx *= 1 - dt * 1.4;
    } else if (p.k === 'bit') {
      p.vy += 120 * dt;
      p.vx *= 1 - dt * 0.8;
      p.rot += p.vr * dt;
    } else if (p.k === 'spark') {
      p.vy += 60 * dt;
    } else if (p.k === 'heart') {
      p.vy -= 6 * dt;
      p.vx = Math.sin(p.life * 5 + p.r) * 9;
    }
  }
}

export function drawParticles(ctx, game, layer = 'world') {
  for (const p of game.fx.list) {
    if (layer === 'front' && p.k !== 'steam' && p.k !== 'coin') continue;
    if (layer === 'back' && p.k !== 'steam') continue;
    const t = Math.max(0, Math.min(1, p.life / p.max));
    if (p.k === 'steam') {
      circle(ctx, p.x, p.y, p.r, withAlpha('#dfe8e0', p.a * (0.2 + 0.45 * t)));
    } else if (p.k === 'flour') {
      circle(ctx, p.x, p.y, p.r, withAlpha('#f4e6c8', 0.55 + 0.4 * t));
    } else if (p.k === 'spark') {
      ctx.strokeStyle = withAlpha(p.life > 0.35 ? '#ffd07a' : '#ff8e4a', 0.9 * t);
      ctx.lineWidth = p.r;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.02, p.y - p.vy * 0.02);
      ctx.stroke();
    } else if (p.k === 'bit') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = withAlpha(p.color, 0.9 * t);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (p.k === 'heart') {
      heart(ctx, p.x, p.y, p.r);
      ctx.fillStyle = withAlpha('#e8758a', 0.85 * t);
      ctx.fill();
    } else if (p.k === 'coin') {
      circle(ctx, p.x, p.y, p.r, '#f5c25e');
      circle(ctx, p.x - p.r * 0.25, p.y - p.r * 0.25, p.r * 0.35, '#fff0b8');
    }
  }
}

// The steady kitchen atmosphere: pot steam, stove sparks, lamp haze and the odd flour mote.
export function updateAmbience(game, dt) {
  game.fxTimers = game.fxTimers || { pot: 0, pass: 0, spark: 0, flour: 0 };
  const tm = game.fxTimers;
  tm.pot += dt;
  tm.pass += dt;
  tm.spark += dt;
  tm.flour += dt;
  if (tm.pot > 0.4) {
    tm.pot = 0;
    emitSteam(game, 674, 402, 1, 8, { a: 0.16 });
  }
  if (tm.pass > 0.55) {
    tm.pass = 0;
    emitSteam(game, 1058, 444, 1, 12, { a: 0.1, r: 8 });
  }
  if (tm.spark > 1.1) {
    tm.spark = 0;
    emitSpark(game, 568, 440, 1);
  }
  if (tm.flour > 2.2) {
    tm.flour = 0;
    emitFlour(game, 372, 472, 1);
  }
  updateParticles(game, dt);
}
