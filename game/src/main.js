// Boot, fixed-step loop, screens, input wiring and the deterministic screenshot mode.
import {
  W, H, SHIFT_SECONDS, START_CLOCK, CLOCK_MINUTES_PER_SECOND, PAL,
} from './config.js';
import { makeRng } from './random.js';
import { createChef, updateChef, nearestStation, STATIONS, setPose } from './kitchen.js';
import { createFx, updateAmbience } from './particles.js';
import { updateOrders, startOrders } from './orders.js';
import { updateCooking, interact, serveSlot, pickChip, hint, chopHit, cookHit } from './cooking.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { createCamera, clampCamera, drawWorld } from './render.js';
import { drawHUD, drawTitle, drawPause, drawSummary, drawRecipeBook, trayChipRect, TRAY } from './hud.js';
import { stageShot, stageTitle } from './shots.js';

const BEST_KEY = 'midnight-bistro-best';
const STEP = 1 / 60;

function readBest() {
  try {
    const v = Number(window.localStorage.getItem(BEST_KEY));
    return Number.isFinite(v) && v > 0 ? v : 0;
  } catch (err) {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch (err) {
    // A private window should still be able to play; the score just will not stick.
  }
}

function createGame(seed) {
  return {
    screen: 'title',
    time: 0,
    shiftTime: 0,
    clockMinutes: START_CLOCK,
    shiftNumber: 1,
    tips: 128,
    tipsEarned: 0,
    combo: 1,
    comboPulse: 0,
    served: 0,
    perfects: 0,
    expired: 0,
    misses: 0,
    arrived: 0,
    best: readBest(),
    muted: false,
    orders: [null, null, null],
    seats: [null, null, null],
    chef: createChef(390),
    camera: createCamera(),
    fx: createFx(),
    fxTimers: { pot: 0, pass: 0, spark: 0, flour: 0 },
    popups: [],
    tray: null,
    chop: null,
    cook: null,
    hintText: '',
    hintTone: 'info',
    hintT: 0,
    shake: 0,
    flash: 0,
    servePop: 0,
    lastTip: null,
    nextOrderIn: 0,
    book: false,
    rng: makeRng(seed),
    audio: createAudio(),
    shot: null,
  };
}

function startShift(game) {
  game.screen = 'play';
  game.shiftTime = 0;
  game.clockMinutes = START_CLOCK;
  game.orders = [null, null, null];
  game.seats = [null, null, null];
  game.combo = 1;
  game.comboPulse = 0;
  game.tipsEarned = 0;
  game.served = 0;
  game.perfects = 0;
  game.expired = 0;
  game.misses = 0;
  game.arrived = 0;
  game.tray = null;
  game.chop = null;
  game.cook = null;
  game.popups = [];
  game.hintT = 0;
  game.shake = 0;
  game.flash = 0;
  game.lastTip = null;
  game.book = false;
  game.chef = createChef(390);
  game.camera = createCamera();
  game.fx = createFx();
  game.fxTimers = { pot: 0, pass: 0, spark: 0, flour: 0 };
  game.rng = makeRng(Math.floor(Math.random() * 1e9));
  startOrders(game);
  game.nextOrderIn = 8;
  game.audio.ensure();
  game.audio.startRain();
  game.audio.sizzle(false);
}

function endShift(game) {
  game.screen = 'summary';
  game.audio.sizzle(false);
  game.hintT = 0;
  if (game.tipsEarned > game.best) {
    game.best = game.tipsEarned;
    saveBest(game.best);
  }
}

function boot() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const params = new URLSearchParams(window.location.search);
  const shotName = params.get('shot');
  const seed = Number(params.get('seed') || 7) || 7;
  const game = createGame(seed);
  window.__game = game;

  function fit() {
    const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
    canvas.style.width = Math.round(W * scale) + 'px';
    canvas.style.height = Math.round(H * scale) + 'px';
  }
  window.addEventListener('resize', fit);
  fit();

  let input = null;

  function onTrayClick(x, y) {
    if (!game.tray) return false;
    if (x < TRAY.x || x > TRAY.x + TRAY.w || y < TRAY.y || y > TRAY.y + TRAY.h) return false;
    for (let i = 0; i < 8; i++) {
      const r = trayChipRect(i);
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        pickChip(game, i);
        return true;
      }
    }
    return true;
  }

  function clickStation(x, y) {
    const st = STATIONS.find((s) => x >= s.left - 6 && x <= s.right + 6);
    if (!st) return;
    if (Math.abs(game.chef.x - st.x) < 118) {
      if (nearestStation(game.chef.x).id === st.id) interact(game);
      else hint(game, 'The chef is at the ' + nearestStation(game.chef.x).label.toLowerCase() + '. Use A and D.', 'info', 1.8);
    } else {
      hint(game, 'Walk over to the ' + st.label.toLowerCase() + ' first.', 'info', 1.8);
    }
  }

  function clickCustomer(x, y) {
    if (y < 566) return false;
    let best = -1;
    let dist = 120;
    game.seats.forEach((s, i) => {
      const cx = [296, 632, 966][i];
      if (s && Math.abs(x - cx) < dist) {
        dist = Math.abs(x - cx);
        best = i;
      }
    });
    if (best < 0) {
      const idx = x < 464 ? 0 : x < 800 ? 1 : 2;
      serveSlot(game, idx);
      return true;
    }
    serveSlot(game, best);
    return true;
  }

  const handlers = {
    firstGesture() {
      game.audio.ensure();
      game.audio.startRain();
    },
    enter() {
      if (game.shot) return;
      if (game.screen === 'title') {
        game.shiftNumber = 1;
        startShift(game);
      } else if (game.screen === 'summary') {
        game.shiftNumber += 1;
        startShift(game);
      } else if (game.screen === 'paused') {
        game.screen = 'play';
      }
    },
    tab() {
      if (game.shot) return;
      if (game.screen === 'play' || game.screen === 'paused') {
        game.book = !game.book;
      }
    },
    pause() {
      if (game.shot) return;
      if (game.screen === 'play') game.screen = 'paused';
      else if (game.screen === 'paused') game.screen = 'play';
    },
    mute() {
      game.muted = game.audio.toggleMute();
    },
    interact() {
      if (game.shot || game.screen !== 'play' || game.book) return;
      interact(game);
    },
    space() {
      if (game.shot || game.screen !== 'play' || game.book) return;
      if (game.cook) {
        cookHit(game);
      } else if (game.chop) {
        chopHit(game);
      }
    },
    digit(n) {
      if (game.shot || game.screen !== 'play' || game.book) return;
      if (game.tray && n <= 8) {
        pickChip(game, n - 1);
        return;
      }
      if (n <= 3) serveSlot(game, n - 1);
    },
    escape() {
      if (game.book) game.book = false;
      else if (game.tray) game.tray = null;
    },
    click(x, y) {
      if (game.shot) return;
      game.audio.ensure();
      game.audio.startRain();
      if (game.screen === 'title') {
        game.shiftNumber = 1;
        startShift(game);
        return;
      }
      if (game.screen === 'summary') {
        game.shiftNumber += 1;
        startShift(game);
        return;
      }
      if (game.screen === 'paused') {
        game.screen = 'play';
        return;
      }
      if (game.book) {
        game.book = false;
        return;
      }
      if (game.tray) {
        onTrayClick(x, y);
        return;
      }
      if (game.screen !== 'play') return;
      if (clickCustomer(x, y)) return;
      clickStation(x, y);
    },
  };

  input = createInput(canvas, handlers);

  if (shotName && ['cover', 'chop', 'stove', 'serve'].includes(shotName)) {
    stageShot(game, shotName, seed);
  } else {
    stageTitle(game, seed);
  }

  let last = performance.now();
  let acc = 0;
  let frames = 0;
  let ready = false;

  function simulate(dt) {
    if (game.shot) {
      game.time += dt;
      updateAmbience(game, dt);
      return;
    }
    game.time += dt;
    if (game.screen === 'play' && !game.book) {
      updateChef(game, dt, input.axis());
      updateOrders(game, dt);
      updateCooking(game, dt);
      updateAmbience(game, dt);
      game.shiftTime += dt;
      game.clockMinutes = START_CLOCK + game.shiftTime * CLOCK_MINUTES_PER_SECOND;
      if (game.shiftTime >= SHIFT_SECONDS) endShift(game);
    } else if (game.screen === 'title' || game.screen === 'summary') {
      updateAmbience(game, dt);
    }
  }

  function render() {
    ctx.fillStyle = '#0b080d';
    ctx.fillRect(0, 0, W, H);
    drawWorld(ctx, game);
    if (game.screen === 'title') {
      drawTitle(ctx, game);
    } else {
      drawHUD(ctx, game);
      if (game.book) drawRecipeBook(ctx, game);
      if (game.screen === 'paused') drawPause(ctx, game);
      if (game.screen === 'summary') drawSummary(ctx, game);
    }
  }

  function frame(now) {
    const elapsed = Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;
    if (game.shot) {
      simulate(elapsed);
    } else {
      acc += elapsed;
      let guard = 0;
      while (acc >= STEP && guard < 8) {
        simulate(STEP);
        acc -= STEP;
        guard++;
      }
    }
    render();
    frames++;
    if (game.shot && !ready && frames >= 3) {
      ready = true;
      window.__shotReady = true;
    }
    window.requestAnimationFrame(frame);
  }
  window.requestAnimationFrame(frame);
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
