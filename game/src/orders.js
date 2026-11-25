// Tickets, patience, customers and the order queue for a night shift.
import { RUSH_SECONDS, RUSH_INTERVAL, ORDER_INTERVAL, SHIFT_SECONDS, PAL } from './config.js';
import { RECIPES, recipeById, INGREDIENTS } from './recipes.js';
import { heartBubble } from './particles.js';

export const CUSTOMERS = [
  { name: 'Mara', line: 'Extra basil, please', hair: '#4a2c25', skin: '#d9a878', sweater: '#6b3f5b', style: 'bun' },
  { name: 'Ivo', line: 'I am starving', hair: '#2a2320', skin: '#b98357', sweater: '#2f5e63', style: 'beanie' },
  { name: 'June', line: 'Take your time, chef', hair: '#8a5a33', skin: '#e6bb92', sweater: '#7b4a33', style: 'curls' },
  { name: 'Theo', line: 'Smells like midnight', hair: '#3a2a22', skin: '#c89266', sweater: '#40526e', style: 'cap' },
  { name: 'Wren', line: 'Rain makes me hungry', hair: '#6b4032', skin: '#e2b28a', sweater: '#6d5a3c', style: 'bob' },
];

const THANKS = ['Mmm. Perfect.', 'You angel.', 'Worth the wait.', 'Exactly right.', 'Oh, warm.', 'Bless this kitchen.'];
const SAD = ['Rain check, chef...', 'Maybe next time.', 'Aw. I had hope.'];

export function makeSeat(customer, rng) {
  return {
    customer,
    bubble: customer.line,
    bubbleT: 7,
    mood: 'waiting',
    gone: false,
    emptyT: 0,
    leaveT: 0,
    hatTilt: rng ? rng.range(-0.1, 0.1) : 0,
    blinkIn: rng ? rng.range(1, 4) : 2,
    sip: rng ? rng.range(0, 1) : 0,
  };
}

export function newCustomer(rng, seats) {
  const used = new Set(seats.filter(Boolean).map((s) => s.customer.name));
  const pool = CUSTOMERS.filter((c) => !used.has(c.name));
  return (pool.length ? rng.pick(pool) : rng.pick(CUSTOMERS));
}

export function buildTray(recipe, rng) {
  const wrong = rng.shuffle(Object.keys(INGREDIENTS).filter((id) => !recipe.ingredients.includes(id))).slice(0, 5);
  return rng.shuffle([...recipe.ingredients, ...wrong]);
}

export function createOrder(recipe, slot, rng, opts = {}) {
  const r = typeof recipe === 'string' ? recipeById(recipe) : recipe;
  return {
    recipe: r,
    slot,
    step: opts.step || 'gather',
    patience: opts.patience === undefined ? 1 : opts.patience,
    patienceMax: opts.patienceMax || r.patience,
    born: opts.born === undefined ? 0 : opts.born,
    gathered: [],
    chops: 0,
    quality: opts.quality || null,
    tray: buildTray(r, rng),
    perfectCook: false,
    plated: false,
    tip: 0,
    id: Math.floor(rng.f() * 1e9),
  };
}

export function activeOrders(game) {
  return game.orders.filter(Boolean);
}

export function orderCount(game) {
  return activeOrders(game).length;
}

export function freeSlot(game) {
  for (let i = 0; i < 3; i++) if (!game.orders[i]) return i;
  return -1;
}

export function isRush(game) {
  return game.shiftTime >= SHIFT_SECONDS - RUSH_SECONDS;
}

export function startOrders(game) {
  const rng = game.rng;
  for (const slot of [0, 1]) {
    if (!game.seats[slot]) game.seats[slot] = makeSeat(newCustomer(rng, game.seats), rng);
    const recipe = pickRecipe(game);
    game.orders[slot] = createOrder(recipe, slot, rng, { born: 0 });
    game.seats[slot].bubble = game.seats[slot].customer.line;
    game.seats[slot].bubbleT = 8;
    game.seats[slot].mood = 'waiting';
  }
  game.nextOrderIn = 7.5;
}

export function pickRecipe(game) {
  const active = new Set(activeOrders(game).map((o) => o.recipe.id));
  const pool = RECIPES.filter((r) => !active.has(r.id));
  return game.rng.pick(pool.length ? pool : RECIPES);
}

export function spawnDueOrder(game) {
  const slot = freeSlot(game);
  if (slot < 0) return false;
  if (!game.seats[slot] || game.seats[slot].gone) {
    const cust = newCustomer(game.rng, game.seats);
    game.seats[slot] = makeSeat(cust, game.rng);
  }
  const seat = game.seats[slot];
  const order = createOrder(pickRecipe(game), slot, game.rng, { born: game.shiftTime });
  game.orders[slot] = order;
  seat.bubbleT = 7;
  seat.bubble = seat.customer.line;
  seat.mood = 'waiting';
  game.arrived += 1;
  return true;
}

export function updateOrders(game, dt) {
  const rush = isRush(game);
  for (let i = 0; i < 3; i++) {
    const order = game.orders[i];
    const seat = game.seats[i];
    if (order) {
      order.patience -= (dt / order.patienceMax) * (rush ? 1.18 : 1);
      if (order.patience <= 0) {
        expireOrder(game, i);
        continue;
      }
      if (seat) {
        seat.bubbleT -= dt;
        if (seat.bubbleT <= 0 && order.patience < 0.42) {
          seat.bubble = 'Any time now...';
          seat.bubbleT = 3.2;
        }
      }
    } else if (seat) {
      seat.bubbleT -= dt;
      if (seat.gone) {
        seat.emptyT -= dt;
        if (seat.emptyT <= 0) {
          game.seats[i] = null;
        }
      }
    }
  }
  for (const seat of game.seats) {
    if (!seat) continue;
    seat.sip += dt;
    seat.blinkIn -= dt;
    if (seat.blinkIn < 0) seat.blinkIn = 2 + game.rng.range(0, 3);
  }

  game.nextOrderIn -= dt;
  const free = freeSlot(game);
  if (game.nextOrderIn <= 0 && free >= 0 && game.shiftTime < SHIFT_SECONDS - 6) {
    spawnDueOrder(game);
    const gap = rush ? RUSH_INTERVAL : ORDER_INTERVAL;
    game.nextOrderIn = game.rng.range(gap[0], gap[1]);
  }
}

export function expireOrder(game, slot) {
  const seat = game.seats[slot];
  game.orders[slot] = null;
  game.combo = 1;
  game.comboPulse = 0.4;
  game.shake = Math.max(game.shake, 13);
  game.expired += 1;
  game.hintText = 'A ticket walked out. Combo reset.';
  game.hintTone = 'bad';
  game.hintT = 3.2;
  if (seat) {
    seat.mood = 'sad';
    seat.bubble = game.rng.pick(SAD);
    seat.bubbleT = 3.4;
    seat.leaveT = 2.2;
    seat.gone = true;
    seat.emptyT = 4.4;
  }
  game.audio.error();
}

export function seatServed(game, slot, order, tip) {
  const seat = game.seats[slot];
  if (seat) {
    seat.mood = 'happy';
    seat.bubble = game.rng.pick(THANKS);
    seat.bubbleT = 4.5;
  }
  game.orders[slot] = null;
  game.served += 1;
  game.servePop = 0.5;
  if (seat) {
    heartBubble(game, seat.x, 596);
  }
  game.audio.bell();
  game.audio.coin();
  game.tips += tip;
  const wasRush = isRush(game);
  game.lastTip = { amount: tip, slot, t: 2.2, mult: game.combo, rush: wasRush };
  game.coinBurst += 1;
  game.combo = Math.min(5, game.combo + 1);
  game.comboPulse = 0.5;
  game.hintText = `Served ${order.recipe.short} for $${tip}.`;
  game.hintTone = 'good';
  game.hintT = 2.4;
  if (tip > 0) game.tipsEarned += tip;
  return tip;
}

export function patienceColor(p) {
  if (p > 0.55) return PAL.tealBright;
  if (p > 0.25) return PAL.gold;
  return PAL.red;
}
