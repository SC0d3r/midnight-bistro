// Fixed logical stage, palette, layout and timings for Midnight Bistro.
// Everything is expressed in 1280x720 logical pixels; the page scales the canvas.
export const W = 1280;
export const H = 720;
export const HUD_H = 96;
export const SHIFT_SECONDS = 180;
export const RUSH_SECONDS = 30;
export const RUSH_TIP_MULT = 2;
export const COMBO_MAX = 5;
export const START_CLOCK = 167; // 02:47 in minutes since midnight
export const CLOCK_MINUTES_PER_SECOND = 1 / 13;
export const CHEF_MIN_X = 96;
export const CHEF_MAX_X = 1188;
export const CHEF_SPEED = 320;
export const DECK_Y = 455;
export const COUNTER_FRONT = 566;
export const TRAY_TITLE = 'FRIDGE TRAY';

export const FONT = {
  ui: "'Trebuchet MS', 'Segoe UI', Verdana, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'Courier New', Courier, monospace",
};

export const PAL = {
  ink: '#161018',
  night: '#1b1220',
  wall: '#2a1c24',
  wallDeep: '#1e141c',
  cream: '#f6e8cb',
  creamDim: '#d9c5a3',
  paper: '#f2e1be',
  teal: '#3f9189',
  tealBright: '#6cc0b3',
  tealDeep: '#1f504e',
  gold: '#f3bf6d',
  goldSoft: '#ffd79a',
  amber: '#e8913f',
  copper: '#c47a4c',
  copperDeep: '#8b4c31',
  wood: '#6b422b',
  woodLight: '#a9744a',
  woodDark: '#3c2419',
  brick: '#8a5039',
  brickDark: '#5e3325',
  slate: '#222a2b',
  tomato: '#d9533c',
  basil: '#6ea84f',
  cheese: '#f0dfab',
  glass: '#20364c',
  cold: '#cfe7e0',
  red: '#b3453b',
  iron: '#2b2c31',
};

export const STATION_DEFS = [
  { id: 'fridge', label: 'FRIDGE', x: 156, left: 42, right: 276, promptY: 232, verb: 'GATHER' },
  { id: 'prep', label: 'PREP', x: 390, left: 294, right: 516, promptY: 300, verb: 'CHOP' },
  { id: 'stove', label: 'STOVE', x: 630, left: 530, right: 728, promptY: 250, verb: 'COOK' },
  { id: 'oven', label: 'OVEN', x: 870, left: 778, right: 966, promptY: 292, verb: 'BAKE' },
  { id: 'pass', label: 'PASS', x: 1102, left: 1000, right: 1228, promptY: 270, verb: 'PLATE' },
];

export const SEAT_DEFS = [
  { x: 296, hair: '#4a2c25', sweater: '#6b3f5b' },
  { x: 632, hair: '#2a2320', sweater: '#2f5e63' },
  { x: 966, hair: '#7a4a2c', sweater: '#7b4a33' },
];

export const CAT = { x: 1192, y: 640 };
export const BULBS = [250, 640, 1012];
export const ORDER_INTERVAL = [12, 18];
export const RUSH_INTERVAL = [7, 10];
export const WINDOW = { x: 52, y: 106, w: 372, h: 158 };
export const DECK = { y: 455, front: 552, rail: 566 };
