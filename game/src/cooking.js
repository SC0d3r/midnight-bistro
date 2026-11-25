// The per-ticket state machines: gather, chop, cook, plate, serve and the scoring that follows.
import { nearestStation, setPose } from './kitchen.js';
import { cookStationOf, recipeById } from './recipes.js';
import { seatServed, isRush } from './orders.js';
import { emitFlour, emitBits, emitSteam, emitSpark, emitCoins, emitHearts } from './particles.js';
import { PAL } from './config.js';

export function hint(game, text, tone = 'info', dur = 2.4) {
  game.hintText = text;
  game.hintTone = tone;
  game.hintT = dur;
}

export function nextStationId(order) {
  if (!order) return null;
  if (order.step === 'gather') return 'fridge';
  if (order.step === 'chop') return 'prep';
  if (order.step === 'cook') return cookStationOf(order.recipe);
  return 'pass';
}

export function stepVerb(order) {
  if (!order) return '';
  if (order.step === 'gather') return 'GATHER';
  if (order.step === 'chop') return 'CHOP';
  if (order.step === 'cook') return order.recipe.cook === 'oven' ? 'BAKE' : 'COOK';
  if (order.step === 'plate') return 'PLATE';
  if (order.step === 'serve') return 'SERVE';
  return '';
}

export function focusSlot(game) {
  let best = -1;
  let born = Infinity;
  game.orders.forEach((o, i) => {
    if (o && o.born < born) {
      born = o.born;
      best = i;
    }
  });
  return best;
}

export function orderForStation(game, stationId) {
  let best = -1;
  let born = Infinity;
  game.orders.forEach((o, i) => {
    if (!o) return;
    if (nextStationId(o) !== stationId) return;
    if (o.step === 'cook' && cookStationOf(o.recipe) !== stationId) return;
    if (o.born < born) {
      born = o.born;
      best = i;
    }
  });
  return best;
}

export function interact(game) {
  if (game.cook) {
    hint(game, 'Stop the heat first: Space.', 'info', 1.6);
    return;
  }
  const station = nearestStation(game.chef.x);
  const slot = orderForStation(game, station.id);
  const activeAny = game.orders.some(Boolean);
  if (slot < 0) {
    wrongHint(game, station.id, activeAny);
    return;
  }
  const order = game.orders[slot];
  game.focus = slot;
  if (station.id === 'fridge') openTray(game, slot);
  else if (station.id === 'prep') startChop(game, slot);
  else if (station.id === 'stove' || station.id === 'oven') startCook(game, slot);
  else if (station.id === 'pass') plateDish(game, slot);
}

function wrongHint(game, stationId, activeAny) {
  if (!activeAny) {
    hint(game, 'No tickets yet. Listen to the rain.', 'info', 2);
    return;
  }
  const focus = game.orders[focusSlot(game)];
  if (!focus) return;
  if (focus.step === 'serve') {
    hint(game, 'Plated and ready. Press 1, 2 or 3 to serve.', 'info', 2.4);
    return;
  }
  if (focus.step === 'cook') {
    const need = cookStationOf(focus.recipe) === 'oven' ? 'the oven' : 'the stove';
    hint(game, `${focus.recipe.short} needs ${need}.`, 'info', 2.2);
    return;
  }
  if (focus.step === 'chop') hint(game, 'That dough wants the prep board.', 'info', 2);
  else if (focus.step === 'gather') hint(game, 'Start at the fridge, chef.', 'info', 2);
  else hint(game, 'Try the pass by the heat lamps.', 'info', 2);
}

// ---------------------------------------------------------------- gather
export function openTray(game, slot) {
  const order = game.orders[slot];
  if (!order || order.step !== 'gather') return;
  game.tray = { slot, order, t: 0, flash: 0, wrong: -1 };
  game.focus = slot;
  setPose(game.chef, 'gather', 0.7);
  game.audio.click();
  hint(game, 'Pick the three ingredients on the ticket.', 'info', 2.4);
}

export function closeTray(game) {
  game.tray = null;
}

export function pickChip(game, index) {
  const tray = game.tray;
  if (!tray) return;
  const order = tray.order;
  if (!order || game.orders[tray.slot] !== order) {
    closeTray(game);
    return;
  }
  const id = order.tray[index];
  if (!id) return;
  const wanted = order.recipe.ingredients.includes(id);
  if (wanted && !order.gathered.includes(id)) {
    order.gathered.push(id);
    game.audio.knife();
    emitBits(game, 388, 470, '#cfe0ad', 4);
    if (order.gathered.length >= 3) {
      order.step = 'chop';
      closeTray(game);
      setPose(game.chef, 'cheer', 0.9);
      hint(game, 'Basket full. To the prep board.', 'good', 2.4);
      game.audio.perfect();
    } else {
      hint(game, `${order.gathered.length} of 3 in the basket.`, 'info', 1.3);
    }
  } else if (wanted) {
    hint(game, 'Already in the basket.', 'info', 1.2);
  } else {
    order.patience = Math.max(0.02, order.patience - 2 / order.patienceMax);
    tray.flash = 0.4;
    tray.wrong = index;
    game.shake = Math.max(game.shake, 5);
    game.audio.error();
    hint(game, 'Not that one, chef. Two seconds gone.', 'bad', 1.8);
  }
}

// ---------------------------------------------------------------- chop
export function startChop(game, slot) {
  const order = game.orders[slot];
  if (!order || order.step !== 'chop') return;
  game.chop = {
    slot,
    order,
    pos: 0.1,
    dir: 1,
    speed: 0.82,
    zone: [0.405, 0.595],
    chops: order.chops || 0,
    flash: 0,
    miss: 0,
  };
  game.chop.hits = [];
  game.focus = slot;
  setPose(game.chef, 'chop', 2.4);
  game.audio.click();
  hint(game, 'Space on the highlighted slice. Three good chops.', 'info', 2.6);
}

export function chopHit(game) {
  const c = game.chop;
  if (!c) return;
  const mid = (c.zone[0] + c.zone[1]) / 2;
  const good = Math.abs(c.pos - mid) <= (c.zone[1] - c.zone[0]) / 2;
  if (good) {
    c.chops += 1;
    c.order.chops = c.chops;
    c.hits.push(c.pos);
    c.flash = 0.3;
    c.speed += 0.14;
    emitFlour(game, 390, 486, 12);
    emitBits(game, 390, 486, '#6ea84f', 4);
    game.audio.knife();
    if (c.chops >= 3) {
      c.order.step = 'cook';
      game.chop = null;
      setPose(game.chef, 'cheer', 0.8);
      game.flash = Math.max(game.flash, 0.18);
      game.audio.perfect();
      const need = c.order.recipe.cook === 'oven' ? 'oven' : 'stove';
      hint(game, `Chopped. Now the ${need}.`, 'good', 2.4);
    } else {
      hint(game, `${3 - c.chops} more clean cuts.`, 'info', 1);
    }
  } else {
    c.order.patience = Math.max(0.02, c.order.patience - 1.5 / c.order.patienceMax);
    c.miss = 0.4;
    game.shake = Math.max(game.shake, 6);
    game.misses += 1;
    game.audio.chopMiss();
    emitFlour(game, 360, 492, 5);
    hint(game, 'Missed the slice. Mind the fingers.', 'bad', 1.6);
  }
}

// ---------------------------------------------------------------- cook
export function startCook(game, slot) {
  const order = game.orders[slot];
  if (!order) return;
  const want = cookStationOf(order.recipe);
  const station = nearestStation(game.chef.x);
  if (station.id !== want) {
    hint(game, `${order.recipe.short} needs the ${want}.`, 'info', 2.2);
    return;
  }
  if (order.step !== 'cook') return;
  const bandStart = game.rng.range(0.58, 0.66);
  game.cook = {
    slot,
    order,
    station: want,
    heat: 0.04,
    speed: want === 'oven' ? 0.36 : 0.42,
    band: [bandStart, bandStart + 0.18],
    done: false,
    flash: 0,
    wobble: 0,
  };
  game.focus = slot;
  setPose(game.chef, want === 'oven' ? 'bake' : 'stir', 3.2);
  game.audio.sizzle(true);
  hint(game, 'Space to stop in the green.', 'info', 2.6);
}

export function finishCook(game, quality) {
  const c = game.cook;
  if (!c) return;
  const order = c.order;
  order.quality = quality;
  order.step = 'plate';
  game.cook = null;
  game.audio.sizzle(false);
  if (quality === 'perfect') {
    game.perfects += 1;
    game.flash = 0.5;
    game.audio.perfect();
    emitSpark(game, c.station === 'oven' ? 870 : 600, 430, 10);
    emitSteam(game, c.station === 'oven' ? 870 : 600, 420, 4, 18, { a: 0.2 });
    hint(game, 'Perfect. Plate it at the pass.', 'good', 2.6);
  } else if (quality === 'good') {
    game.flash = 0.16;
    game.audio.coin();
    hint(game, 'Good enough. Plate it at the pass.', 'good', 2.2);
  } else {
    order.patience = Math.max(0.02, order.patience - 8 / order.patienceMax);
    game.shake = Math.max(game.shake, 8);
    game.audio.error();
    emitSteam(game, c.station === 'oven' ? 870 : 600, 420, 3, 16, { a: 0.12 });
    hint(game, 'A little burnt. The pass will take it.', 'bad', 2.4);
  }
  setPose(game.chef, 'cheer', 0.7);
}

export function cookHit(game) {
  const c = game.cook;
  if (!c) return;
  const h = c.heat;
  if (h >= c.band[0] && h <= c.band[1]) finishCook(game, 'perfect');
  else if (h >= c.band[0] - 0.13 && h <= c.band[1] + 0.1) finishCook(game, 'good');
  else finishCook(game, 'burnt');
}

// ---------------------------------------------------------------- plate and serve
export function plateDish(game, slot) {
  const order = game.orders[slot];
  if (!order) return;
  if (order.step === 'serve' && order.plated) {
    hint(game, 'It is plated. Serve customer ' + (slot + 1) + '.', 'info', 2);
    return;
  }
  if (order.step !== 'plate') {
    hint(game, 'That one is not ready to plate yet.', 'info', 1.8);
    return;
  }
  order.step = 'serve';
  order.plated = true;
  game.focus = slot;
  setPose(game.chef, 'plate', 1.2);
  game.audio.bell();
  emitSteam(game, 1058, 448, 4, 16, { a: 0.16 });
  hint(game, 'Plated. Serve customer ' + (slot + 1) + '.', 'good', 3);
}

export function tipForOrder(game, order) {
  const base = order.recipe.tip;
  const speed = Math.round(order.patience * 8);
  const perfect = order.quality === 'perfect' ? 6 : order.quality === 'good' ? 2 : 0;
  let tip = base + speed + perfect;
  if (order.quality === 'burnt') tip = Math.round(tip * 0.55);
  tip *= game.combo;
  if (isRush(game)) tip *= 2;
  return Math.max(1, Math.round(tip));
}

export function serveSlot(game, slot) {
  const order = game.orders[slot];
  if (!order || order.step !== 'serve' || !order.plated) {
    if (order) hint(game, 'Customer ' + (slot + 1) + ' is still waiting on the kitchen.', 'info', 2);
    else hint(game, 'No ticket on that stool.', 'info', 1.6);
    return 0;
  }
  const combo = game.combo;
  const tip = tipForOrder(game, order);
  order.tip = tip;
  const seatX = game.seats[slot] ? game.seats[slot].x : 640;
  emitCoins(game, seatX, 588, 1004, 54, 5);
  emitHearts(game, seatX, 600, 3);
  addPopup(game, `+$${tip} x${combo}`, seatX, 566, isRush(game) ? PAL.goldSoft : PAL.gold);
  game.served++;
  game.tips += tip;
  game.tipsEarned += tip;
  game.lastTip = { amount: tip, t: 2.4, mult: combo, slot };
  game.combo = Math.min(5, combo + 1);
  game.comboPulse = 0.5;
  game.orders[slot] = null;
  const seat = game.seats[slot];
  if (seat) {
    seat.mood = 'happy';
    seat.bubble = game.rng.pick(['Mmm. Perfect.', 'You angel.', 'Worth the wait.', 'Exactly right.']);
    seat.bubbleT = 4.5;
  }
  game.audio.bell();
  game.audio.coin();
  hint(game, `Served ${order.recipe.short} for $${tip}.`, 'good', 2.4);
  return tip;
}

export function addPopup(game, text, x, y, color = PAL.gold, opts = {}) {
  game.popups.push({ text, x, y, color, t: 2.2, max: 2.2, vy: -18, ...opts });
  if (game.popups.length > 10) game.popups.shift();
}

// ---------------------------------------------------------------- per-frame
export function updateCooking(game, dt) {
  if (game.tray) {
    game.tray.t += dt;
    game.tray.flash = Math.max(0, game.tray.flash - dt);
    const order = game.orders[game.tray.slot];
    if (!order || order.step !== 'gather') game.tray = null;
  }
  if (game.chop) {
    const c = game.chop;
    c.pos += c.dir * c.speed * dt;
    if (c.pos > 1) {
      c.pos = 1;
      c.dir = -1;
    }
    if (c.pos < 0) {
      c.pos = 0;
      c.dir = 1;
    }
    c.flash = Math.max(0, c.flash - dt);
    c.miss = Math.max(0, c.miss - dt);
    const order = game.orders[c.slot];
    if (!order || order.step !== 'chop') game.chop = null;
    if (game.rng.chance(dt * 2.2)) emitFlour(game, 390, 500, 1);
  }
  if (game.cook) {
    const c = game.cook;
    c.heat += c.speed * dt;
    if (c.heat >= 1) {
      c.heat = 1;
      finishCook(game, 'burnt');
    }
    if (game.rng.chance(dt * 4)) emitSpark(game, c.station === 'oven' ? 870 : 578, c.station === 'oven' ? 440 : 438, 1);
    if (game.rng.chance(dt * 2)) emitSteam(game, c.station === 'oven' ? 870 : 600, 418, 1, 12, { a: 0.12 });
  }
  game.hintT = Math.max(0, game.hintT - dt);
  for (let i = game.popups.length - 1; i >= 0; i--) {
    const p = game.popups[i];
    p.t -= dt;
    p.y += p.vy * dt;
    if (p.t <= 0) game.popups.splice(i, 1);
  }
  game.shake = Math.max(0, game.shake - dt * 26);
  game.flash = Math.max(0, game.flash - dt * 1.7);
  game.comboPulse = Math.max(0, (game.comboPulse || 0) - dt);
  game.servePop = Math.max(0, (game.servePop || 0) - dt);
  if (game.lastTip) {
    game.lastTip.t -= dt;
    if (game.lastTip.t <= 0) game.lastTip = null;
  }
}
