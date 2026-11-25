// The five kitchen stations, the chef's position and the nearest-station logic.
import { STATION_DEFS, DECK_Y, CHEF_MIN_X, CHEF_MAX_X, CHEF_SPEED } from './config.js';
import { clamp } from './draw.js';

export const STATIONS = STATION_DEFS.map((s) => ({ ...s, cx: s.x }));

export function stationById(id) {
  return STATIONS.find((s) => s.id === id) || STATIONS[1];
}

export function stationIndex(id) {
  return STATIONS.findIndex((s) => s.id === id);
}

export function nearestStation(x) {
  let best = STATIONS[0];
  for (const s of STATIONS) if (Math.abs(s.x - x) < Math.abs(best.x - x)) best = s;
  return best;
}

export function nearStation(chef) {
  const st = nearestStation(chef.x);
  return Math.abs(st.x - chef.x) < 112 ? st : null;
}

export function distanceToStation(x, stationId) {
  return Math.abs(stationById(stationId).x - x);
}

export function createChef(x = 390) {
  return {
    x,
    vx: 0,
    walk: 0,
    bob: 0,
    lean: 0,
    facing: 1,
    station: 'prep',
    near: 'prep',
    pose: 'idle',
    poseT: 0,
    poseDur: 0,
    blink: 0,
    blinkIn: 2.6,
    action: 0,
  };
}

export function setPose(chef, pose, dur = 0.9) {
  chef.pose = pose;
  chef.poseT = 0;
  chef.poseDur = dur;
}

// Called every frame while the shift runs. Movement has a little inertia and a walk bob.
export function updateChef(game, dt, axis) {
  const chef = game.chef;
  const target = axis * CHEF_SPEED;
  const accel = axis === 0 ? 1900 : 1500;
  if (chef.vx < target) chef.vx = Math.min(target, chef.vx + accel * dt);
  else if (chef.vx > target) chef.vx = Math.max(target, chef.vx - accel * dt);
  if (Math.abs(chef.vx) < 2) chef.vx = 0;
  chef.x = clamp(chef.x + chef.vx * dt, CHEF_MIN_X, CHEF_MAX_X);
  const moving = Math.abs(chef.vx) > 8;
  chef.walk += (moving ? Math.abs(chef.vx) : 0) * dt * 0.03;
  chef.bob = moving ? Math.sin(chef.walk * 2.2) * 1.6 : Math.sin(game.time * 2.1) * 0.9;
  if (moving) chef.facing = chef.vx > 0 ? 1 : -1;
  const st = nearestStation(chef.x);
  const reach = clamp(1 - Math.abs(st.x - chef.x) / 160, 0, 1);
  chef.lean += ((st.x - chef.x) / 260) * 0.09 * reach - chef.lean * 0.2;
  chef.station = st.id;
  chef.near = reach > 0.06 ? st.id : null;
  chef.poseT += dt;
  if (chef.pose !== 'idle' && chef.pose !== 'walk' && chef.poseT > chef.poseDur) {
    chef.pose = 'idle';
    chef.poseT = 0;
  }
  if (chef.pose !== 'chop' && chef.pose !== 'stir' && chef.pose !== 'ring') {
    chef.pose = moving ? 'walk' : 'idle';
  }
  chef.blinkIn -= dt;
  if (chef.blinkIn <= 0) {
    chef.blink = 0.12;
    chef.blinkIn = 2.2 + (game.rng ? game.rng.range(0, 2.8) : 1);
  }
  if (chef.blink > 0) chef.blink -= dt;
  return chef;
}

// Where the chef's feet rest, kept for staged shots.
export function moveChefTo(chef, stationId, offset = 0) {
  chef.x = stationById(stationId).x + offset;
  chef.vx = 0;
  chef.station = stationId;
  chef.near = stationId;
  chef.facing = 1;
}

export function chefBaseY() {
  return DECK_Y;
}
