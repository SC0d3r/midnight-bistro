// The four staged states used by ?shot=... . Each one is a real game state built with the game's own
// helpers, then drawn by the normal renderer and HUD.
import { makeRng } from './random.js';
import { CUSTOMERS, makeSeat, createOrder } from './orders.js';
import { moveChefTo, setPose } from './kitchen.js';
import { startChop, startCook, addPopup } from './cooking.js';
import { createFx, emitSteam, emitSpark, emitFlour, emitBits, emitHearts, emitCoins } from './particles.js';
import { recipeById } from './recipes.js';
import { createCamera } from './render.js';

function reset(game, seed) {
  game.rng = makeRng(seed);
  game.fx = createFx();
  game.popups = [];
  game.tray = null;
  game.chop = null;
  game.cook = null;
  game.orders = [null, null, null];
  game.seats = [null, null, null];
  game.hintT = 0;
  game.shake = 0;
  game.flash = 0;
  game.lastTip = null;
  game.screen = 'play';
  game.book = false;
  game.tips = 128;
  game.tipsEarned = 96;
  game.combo = 3;
  game.comboPulse = 0;
  game.served = 2;
  game.perfects = 1;
  game.expired = 0;
  game.misses = 0;
  game.shiftTime = 16;
  game.clockMinutes = 167;
  game.shiftNumber = 1;
  game.hintText = '';
  game.hintTone = 'info';
  game.muted = false;
  game.chef.pose = 'idle';
  game.chef.lean = 0;
  game.camera = createCamera();
}

function seat(game, slot, customer, bubble, mood = 'waiting') {
  const s = makeSeat(customer, game.rng);
  s.bubble = bubble;
  s.bubbleT = 99;
  s.mood = mood;
  game.seats[slot] = s;
  return s;
}

function ticket(game, slot, recipe, step, patience, opts = {}) {
  const order = createOrder(recipeById(recipe), slot, game.rng, { step: 'gather', patience, born: slot * 4 });
  order.step = step;
  if (opts.gathered) order.gathered = recipeById(recipe).ingredients.slice();
  if (opts.chops) order.chops = opts.chops;
  if (opts.quality) order.quality = opts.quality;
  if (step === 'serve') order.plated = true;
  game.orders[slot] = order;
  return order;
}

function linger(game, kind, keep = 0.55) {
  for (const p of game.fx.list) {
    p.life = Math.max(p.life * keep, 0.25);
    p.max = Math.max(p.max, p.life + 0.4);
    if (kind === 'flour' && p.k === 'flour') p.life = 1.1;
    if (kind === 'steam' && p.k === 'steam') p.life = 1.6;
  }
}

export function stageShot(game, kind, seed = 7) {
  reset(game, seed);
  game.shot = kind;
  const rng = game.rng;
  const seat0 = CUSTOMERS[0];
  const seat1 = CUSTOMERS[1];
  const seat2 = CUSTOMERS[2];

  if (kind === 'chop') {
    seat(game, 0, seat0, 'Extra basil, please');
    seat(game, 1, seat1, 'I am starving');
    seat(game, 2, seat2, 'Take your time, chef');
    const o0 = ticket(game, 0, 'margherita', 'chop', 0.74, { gathered: true, chops: 2 });
    ticket(game, 1, 'soup', 'gather', 0.9);
    ticket(game, 2, 'salmon', 'cook', 0.52);
    moveChefTo(game.chef, 'prep', 0);
    setPose(game.chef, 'chop', 99);
    startChop(game, 0);
    if (game.chop) {
      game.chop.chops = 2;
      game.chop.pos = 0.51;
      game.chop.speed = 1.0;
      o0.chops = 2;
    }
    game.camera = createCamera(390, 416, 1.74);
    game.tips = 128;
    game.combo = 3;
    game.clockMinutes = 167;
    emitFlour(game, 386, 486, 26);
    emitBits(game, 392, 486, '#6ea84f', 7);
    emitSteam(game, 674, 404, 4, 10, { a: 0.13 });
    linger(game, 'flour');
  } else if (kind === 'stove') {
    seat(game, 0, seat0, 'Extra basil, please');
    seat(game, 1, seat1, 'I am starving');
    seat(game, 2, seat2, 'Take your time, chef');
    const o0 = ticket(game, 0, 'ramen', 'cook', 0.66, { gathered: true, chops: 3 });
    ticket(game, 1, 'pancakes', 'gather', 0.84);
    ticket(game, 2, 'noodles', 'chop', 0.48, { gathered: true, chops: 1 });
    moveChefTo(game.chef, 'stove', -6);
    setPose(game.chef, 'stir', 99);
    startCook(game, 0);
    if (game.cook) {
      game.cook.heat = 0.685;
      game.cook.band = [0.6, 0.78];
      game.cook.speed = 0.11;
      o0.quality = null;
    }
    game.camera = createCamera(628, 414, 1.72);
    emitSteam(game, 674, 402, 12, 12, { a: 0.2 });
    emitSteam(game, 578, 424, 6, 16, { a: 0.12 });
    emitSpark(game, 566, 440, 8);
    linger(game, 'steam');
  } else if (kind === 'serve') {
    seat(game, 0, seat0, 'Extra basil, please');
    seat(game, 1, seat1, 'I am starving');
    seat(game, 2, seat2, 'Mmm. Perfect.', 'happy');
    ticket(game, 0, 'ramen', 'cook', 0.72, { gathered: true, chops: 3 });
    ticket(game, 1, 'margherita', 'chop', 0.55, { gathered: true, chops: 1 });
    moveChefTo(game.chef, 'pass', 0);
    setPose(game.chef, 'ring', 99);
    game.camera = createCamera(750, 440, 1.22);
    game.tips = 128;
    game.combo = 3;
    game.tipsEarned = 114;
    game.served = 3;
    game.lastTip = { amount: 18, mult: 3, t: 2.1, slot: 2 };
    addPopup(game, '+$18 x3', 966, 512, '#ffd79a');
    emitHearts(game, 966, 582, 7);
    emitCoins(game, 966, 596, 1004, 54, 4);
    emitSteam(game, 1058, 452, 8, 14, { a: 0.16 });
    linger(game, 'steam');
  } else {
    // cover: the busiest, warmest frame
    seat(game, 0, seat0, 'Extra basil, please');
    seat(game, 1, seat1, 'I am starving');
    seat(game, 2, seat2, 'Take your time, chef');
    const o0 = ticket(game, 0, 'margherita', 'chop', 0.76, { gathered: true, chops: 2 });
    ticket(game, 1, 'ramen', 'cook', 0.54, { gathered: true, chops: 3 });
    ticket(game, 2, 'salmon', 'gather', 0.88);
    moveChefTo(game.chef, 'prep', 2);
    setPose(game.chef, 'chop', 99);
    startChop(game, 0);
    if (game.chop) {
      game.chop.chops = 2;
      game.chop.pos = 0.47;
      o0.chops = 2;
    }
    game.camera = createCamera(640, 400, 1);
    game.tips = 128;
    game.combo = 3;
    game.clockMinutes = 167;
    game.flash = 0.12;
    emitSteam(game, 674, 400, 14, 12, { a: 0.2 });
    emitSteam(game, 1058, 448, 6, 12, { a: 0.14 });
    emitSpark(game, 566, 440, 7);
    emitFlour(game, 384, 486, 16);
    emitBits(game, 400, 486, '#6ea84f', 5);
    emitHearts(game, 632, 560, 2);
    linger(game, 'steam');
  }
  game.screen = 'play';
  game.shot = kind;
  game.tray = null;
  if (kind !== 'chop' && kind !== 'stove') {
    game.chop = kind === 'cover' ? game.chop : null;
  }
  if (kind !== 'stove') game.cook = null;
  game.hintT = 0;
  return game;
}

// A quiet bistro behind the title card: regulars, one cat, no tickets yet.
export function stageTitle(game, seed = 7) {
  reset(game, seed);
  game.shot = null;
  game.screen = 'title';
  seat(game, 0, CUSTOMERS[0], 'Extra basil, please');
  seat(game, 1, CUSTOMERS[1], 'I am starving');
  seat(game, 2, CUSTOMERS[2], 'Take your time, chef');
  game.orders = [null, null, null];
  game.tips = 128;
  game.combo = 1;
  game.tipsEarned = 0;
  game.shiftTime = 0;
  game.clockMinutes = 167;
  moveChefTo(game.chef, 'prep', 12);
  setPose(game.chef, 'idle', 99);
  game.camera = createCamera(640, 400, 1);
  emitSteam(game, 674, 402, 8, 10, { a: 0.14 });
  emitSpark(game, 566, 440, 3);
  emitFlour(game, 380, 486, 8);
  linger(game, 'steam');
  return game;
}
