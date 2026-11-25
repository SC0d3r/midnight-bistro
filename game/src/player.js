// The chef: a friendly, rounded cook in a toque, teal apron and rolled sleeves.
import { DECK_Y, PAL } from './config.js';
import { circle, rr, line, clamp, withAlpha } from './draw.js';

const SKIN = '#efc39a';
const SKIN_DARK = '#d9a878';
const HAIR = '#5c3a2a';
const SHIRT = '#f6eddb';
const APRON = '#3d8c86';
const APRON_DARK = '#2d6f6c';
const INK = '#3a241d';

function limb(ctx, x0, y0, x1, y1, x2, y2, midColor, endColor, w1, w2) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = midColor;
  ctx.lineWidth = w1;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.strokeStyle = endColor;
  ctx.lineWidth = w2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawKnife(ctx, x, y, rot, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#4b3020';
  rr(ctx, -24, 0, 16, 7, 3);
  ctx.fill();
  ctx.strokeStyle = '#2e1c12';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#cdd6d8';
  ctx.beginPath();
  ctx.moveTo(-9, -1);
  ctx.lineTo(18, -5);
  ctx.lineTo(22, 6);
  ctx.lineTo(-9, 7);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#6f797b';
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.fillStyle = '#f2f6f6';
  ctx.fillRect(-7, 0, 24, 2);
  ctx.restore();
}

function drawSpatula(ctx, x, y, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  line(ctx, 0, 0, 30, 24, '#8a5a33', 3.5);
  ctx.fillStyle = '#c8b18c';
  rr(ctx, 26, 20, 16, 11, 4);
  ctx.fill();
  ctx.restore();
}

function drawPeel(ctx, x, y, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  line(ctx, 0, 0, 42, 30, '#9a6a42', 3);
  ctx.fillStyle = '#b48a5c';
  rr(ctx, 36, 24, 26, 18, 5);
  ctx.fill();
  ctx.restore();
}

export function drawChef(ctx, game) {
  const c = game.chef;
  const base = DECK_Y + c.bob;
  const pose = c.pose;
  const flip = c.facing;
  ctx.save();
  ctx.translate(c.x, base);
  ctx.rotate(c.lean * 0.55);

  // soft contact shadow on the counter behind the body
  ctx.fillStyle = 'rgba(20,12,10,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 46, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // torso and shoulders
  ctx.beginPath();
  ctx.moveTo(-27, -78);
  ctx.quadraticCurveTo(-32, -35, -25, 3);
  ctx.lineTo(25, 3);
  ctx.quadraticCurveTo(32, -35, 27, -78);
  ctx.closePath();
  ctx.fillStyle = SHIRT;
  ctx.fill();
  ctx.strokeStyle = '#d8c8aa';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // apron
  ctx.beginPath();
  ctx.moveTo(-20, -48);
  ctx.lineTo(20, -48);
  ctx.lineTo(24, 4);
  ctx.quadraticCurveTo(0, 9, -24, 4);
  ctx.closePath();
  ctx.fillStyle = APRON;
  ctx.fill();
  ctx.fillStyle = APRON_DARK;
  ctx.fillRect(-3.5, -46, 7, 47);
  ctx.fillStyle = '#e8d9ba';
  ctx.fillRect(-13, -26, 26, 5);
  ctx.fillStyle = withAlpha('#12302e', 0.5);
  rr(ctx, 3, -17, 15, 12, 2);
  ctx.fill();
  ctx.strokeStyle = withAlpha('#f6e8cb', 0.8);
  ctx.lineWidth = 1;
  ctx.stroke();
  // neck strap
  line(ctx, -18, -48, -12, -76, APRON_DARK, 3);
  line(ctx, 18, -48, 12, -76, APRON_DARK, 3);

  // collar and scarf
  ctx.fillStyle = '#e8dcc4';
  ctx.beginPath();
  ctx.moveTo(-13, -79);
  ctx.lineTo(0, -68);
  ctx.lineTo(13, -79);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PAL.tealBright;
  ctx.beginPath();
  ctx.ellipse(0, -80, 13, 4.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.tealBright;
  ctx.beginPath();
  ctx.ellipse(9, -77, 4, 6, 0.5, 0, Math.PI * 2);
  ctx.fill();

  // neck
  ctx.fillStyle = SKIN_DARK;
  rr(ctx, -6, -90, 12, 12, 4);
  ctx.fill();

  // head, slightly tipped with the idle bob
  const hy = -104;
  ctx.save();
  ctx.translate(flip * 1.2, hy);
  ctx.rotate(flip * 0.035 + Math.sin(game.time * 1.4) * 0.012);
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.ellipse(0, 0, 21, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  // ears
  circle(ctx, -20, 0, 5, SKIN_DARK);
  circle(ctx, 20, 0, 5, SKIN_DARK);
  // hair sideburns
  ctx.fillStyle = HAIR;
  ctx.beginPath();
  ctx.ellipse(-16, -5, 6, 10, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(16, -5, 6, 10, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // eyes
  const blink = c.blink > 0;
  const look = flip * 1.6;
  if (blink) {
    line(ctx, -9, -2, -3, -2, INK, 1.6);
    line(ctx, 4, -2, 10, -2, INK, 1.6);
  } else {
    circle(ctx, -6 + look, -2, 2.1, INK);
    circle(ctx, 7 + look, -2, 2.1, INK);
    circle(ctx, -5.4 + look, -2.7, 0.7, '#ffffff');
    circle(ctx, 7.6 + look, -2.7, 0.7, '#ffffff');
  }
  // brows
  line(ctx, -10, -7.5, -3, -8.5, HAIR, 1.4);
  line(ctx, 4, -8.5, 11, -7.5, HAIR, 1.4);
  // nose and smile
  line(ctx, 0, 1, 2, 4, SKIN_DARK, 1.3);
  ctx.strokeStyle = '#9c5a45';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(1, 5, 6, 0.18, Math.PI - 0.25);
  ctx.stroke();
  // blush
  circle(ctx, -13, 5, 3.4, withAlpha('#d97b68', 0.28));
  circle(ctx, 14, 5, 3.4, withAlpha('#d97b68', 0.28));

  // toque
  ctx.fillStyle = '#f7f1e3';
  rr(ctx, -21, -23, 42, 11, 5);
  ctx.fill();
  ctx.strokeStyle = '#d9cbb0';
  ctx.lineWidth = 1;
  ctx.stroke();
  circle(ctx, -12, -29, 10.5, '#fbf7ec');
  circle(ctx, 2, -35, 12.5, '#fdfaf1');
  circle(ctx, 14, -28, 10, '#f7f1e3');
  circle(ctx, -2, -28, 10, '#fbf7ec');
  ctx.strokeStyle = withAlpha('#c9b998', 0.55);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(-12, -30, 8, 0.3, 2.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(3, -36, 9, 3.5, 5.6);
  ctx.stroke();

  // pencil behind the ear
  ctx.save();
  ctx.translate(19, -14);
  ctx.rotate(-0.5);
  ctx.fillStyle = '#e8b54a';
  ctx.fillRect(0, -1.7, 17, 3.4);
  ctx.fillStyle = '#d9d3c4';
  ctx.fillRect(15, -1.7, 4, 3.4);
  ctx.fillStyle = '#3b2a22';
  ctx.fillRect(18.5, -1.7, 2, 3.4);
  ctx.restore();
  ctx.restore();

  // arms: shoulder, elbow and hand targets depend on the pose
  let hands = [
    { x: -23, y: -10 },
    { x: 23, y: -10 },
  ];
  let elbows = [
    { x: -30, y: -34 },
    { x: 30, y: -34 },
  ];
  if (pose === 'walk') {
    const s = Math.sin(c.walk * 2.2) * 6;
    hands = [
      { x: -23 + s, y: -8 },
      { x: 23 - s, y: -8 },
    ];
  } else if (pose === 'chop') {
    const p = game.chop ? game.chop.pos : 0.5;
    const chopY = 16 + Math.sin(p * Math.PI) * 9;
    hands = [
      { x: -34, y: 4 },
      { x: -28 + p * 62, y: chopY },
    ];
    elbows = [
      { x: -34, y: -25 },
      { x: 8, y: -28 },
    ];
  } else if (pose === 'garnish') {
    // one hand steadies the board, the other pinches basil above the pizza
    const bob = Math.sin(c.poseT * 2.6) * 1.6;
    hands = [
      { x: -36, y: 2 },
      { x: 8, y: -3 + bob },
    ];
    elbows = [
      { x: -38, y: -26 },
      { x: 20, y: -26 },
    ];
  } else if (pose === 'stir') {
    hands = [
      { x: -46, y: 2 },
      { x: 18, y: -6 },
    ];
    elbows = [
      { x: -34, y: -26 },
      { x: 30, y: -28 },
    ];
  } else if (pose === 'bake') {
    hands = [
      { x: -17, y: 4 },
      { x: 18, y: 4 },
    ];
    elbows = [
      { x: -30, y: -28 },
      { x: 31, y: -28 },
    ];
  } else if (pose === 'ring') {
    const wob = Math.sin(c.poseT * 22) * 1.4;
    hands = [
      { x: -20, y: -2 },
      { x: 48 + wob, y: 28 },
    ];
    elbows = [
      { x: -28, y: -30 },
      { x: 40, y: -4 },
    ];
  } else if (pose === 'plate') {
    hands = [
      { x: -16, y: 5 },
      { x: 18, y: 5 },
    ];
  } else if (pose === 'cheer') {
    hands = [
      { x: -29, y: -86 },
      { x: 29, y: -86 },
    ];
    elbows = [
      { x: -36, y: -46 },
      { x: 36, y: -46 },
    ];
  } else if (pose === 'gather') {
    hands = [
      { x: -20, y: -6 },
      { x: 26, y: -10 },
    ];
  }

  for (let i = 0; i < 2; i++) {
    const sh = { x: i === 0 ? -21 : 21, y: -70 };
    const el = elbows[i];
    const hd = hands[i];
    limb(ctx, sh.x, sh.y, el.x, el.y, hd.x, hd.y, SHIRT, SKIN, 10, 7.4);
    circle(ctx, hd.x, hd.y, 4.6, SKIN);
    circle(ctx, hd.x - 1, hd.y - 1, 1.5, withAlpha('#ffe0bd', 0.8));
  }

  // props in hand
  if (pose === 'chop') {
    drawKnife(ctx, hands[1].x + 2, hands[1].y + 2, -0.55, 1.4);
  } else if (pose === 'garnish') {
    // a whole basil sprig held up between the fingers, loose leaves dropping to the pizza
    const hx = hands[1].x;
    const hy = hands[1].y;
    ctx.save();
    ctx.translate(hx, hy);
    ctx.strokeStyle = '#4a7534';
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(1, 4);
    ctx.lineTo(2, -12);
    ctx.stroke();
    const sprig = [
      [-3.6, -5.6, -0.75, 1.0],
      [6.2, -7.2, 0.6, 1.05],
      [1.4, -13.2, -0.1, 0.92],
    ];
    for (const [dx, dy, rot, s] of sprig) {
      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(rot);
      ctx.fillStyle = '#7dbf57';
      ctx.beginPath();
      ctx.ellipse(0, 0, 5.6 * s, 2.8 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3f6b2d';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();
    }
    // the hand and fingers closing over the stem, so it reads as held
    circle(ctx, 0, 1, 5.4, SKIN);
    ctx.strokeStyle = '#cf9a6a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-2.6, 1.5);
    ctx.lineTo(-1.6, 6.4);
    ctx.moveTo(0.4, 1.5);
    ctx.lineTo(0.8, 6.8);
    ctx.moveTo(3.2, 1.2);
    ctx.lineTo(3.4, 5.6);
    ctx.stroke();
    ctx.restore();
    // the loose leaves dropping toward the pizza
    for (let i = 0; i < 4; i++) {
      const fx = hx + 1 + i * 4.2 + Math.sin(game.time * 2 + i) * 1.5;
      const fy = hy + 10 + i * 5.5;
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(0.55 - i * 0.42);
      ctx.fillStyle = i % 2 ? '#6ea84f' : '#84bb5c';
      ctx.beginPath();
      ctx.ellipse(0, 0, 4.1, 1.9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (pose === 'stir') {
    drawSpatula(ctx, hands[0].x, hands[0].y - 2, -2.32 + Math.sin(game.time * 6) * 0.05);
  } else if (pose === 'bake') {
    drawPeel(ctx, hands[1].x - 6, hands[1].y + 4, -0.2);
  } else if (pose === 'ring') {
    const hx = hands[1].x;
    const hy = hands[1].y;
    ctx.strokeStyle = withAlpha('#fff2c8', 0.9);
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const a = -2.5 + i * 0.55 + Math.sin(game.time * 16) * 0.05;
      ctx.beginPath();
      ctx.moveTo(hx + Math.cos(a) * 9, hy - 4 + Math.sin(a) * 9);
      ctx.lineTo(hx + Math.cos(a) * (16 + i * 2), hy - 4 + Math.sin(a) * (16 + i * 2));
      ctx.stroke();
    }
  } else if (pose === 'plate') {
    ctx.fillStyle = '#f5eddb';
    ctx.beginPath();
    ctx.ellipse(hands[1].x + 2, hands[1].y + 9, 18, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
