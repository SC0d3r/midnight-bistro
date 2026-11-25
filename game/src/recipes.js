// Six dishes, their fifteen ingredients and the little vector icons drawn everywhere.
import { circle, line, withAlpha, rr } from './draw.js';

export const INGREDIENTS = {
  dough: { name: 'Dough', color: '#e3c08c' },
  tomato: { name: 'Tomato', color: '#d9533c' },
  mozzarella: { name: 'Mozzarella', color: '#f4ead0' },
  basil: { name: 'Basil', color: '#6ea84f' },
  noodles: { name: 'Noodles', color: '#e5c15f' },
  miso: { name: 'Miso', color: '#9a5a35' },
  egg: { name: 'Egg', color: '#f0c45e' },
  flour: { name: 'Flour', color: '#efe1c6' },
  berries: { name: 'Berries', color: '#8a5a9c' },
  honey: { name: 'Honey', color: '#e4a53f' },
  garlic: { name: 'Garlic', color: '#efe6d3' },
  chili: { name: 'Chili', color: '#cc4436' },
  cream: { name: 'Cream', color: '#f7f0e0' },
  salmon: { name: 'Salmon', color: '#e8886d' },
  lemon: { name: 'Lemon', color: '#f0d35b' },
  mushroom: { name: 'Mushroom', color: '#c8a47c' },
};

export const RECIPES = [
  {
    id: 'margherita',
    name: 'Midnight Margherita',
    short: 'Margherita',
    color: '#e0663f',
    cook: 'oven',
    ingredients: ['dough', 'tomato', 'mozzarella'],
    tip: 16,
    patience: 66,
    blurb: 'Wood fire, basil, a little char.',
  },
  {
    id: 'ramen',
    name: 'Miso Midnight Ramen',
    short: 'Miso Ramen',
    color: '#d9a441',
    cook: 'stove',
    ingredients: ['noodles', 'miso', 'egg'],
    tip: 15,
    patience: 62,
    blurb: 'Deep broth for a wet night.',
  },
  {
    id: 'pancakes',
    name: 'Berry Moon Pancakes',
    short: 'Moon Pancakes',
    color: '#a678c0',
    cook: 'stove',
    ingredients: ['flour', 'berries', 'honey'],
    tip: 13,
    patience: 72,
    blurb: 'Breakfast is a state of mind.',
  },
  {
    id: 'noodles',
    name: 'Ember Garlic Noodles',
    short: 'Garlic Noodles',
    color: '#c94f4f',
    cook: 'stove',
    ingredients: ['noodles', 'garlic', 'chili'],
    tip: 14,
    patience: 64,
    blurb: 'Enough garlic to keep the rain out.',
  },
  {
    id: 'soup',
    name: 'Rainy Day Tomato Soup',
    short: 'Tomato Soup',
    color: '#de7058',
    cook: 'stove',
    ingredients: ['tomato', 'cream', 'basil'],
    tip: 12,
    patience: 74,
    blurb: 'The colour of a good blanket.',
  },
  {
    id: 'salmon',
    name: 'Honey-Glazed Salmon',
    short: 'Honey Salmon',
    color: '#e48f6c',
    cook: 'oven',
    ingredients: ['salmon', 'honey', 'lemon'],
    tip: 18,
    patience: 68,
    blurb: 'Sticky, bright, gone too soon.',
  },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

export function recipeById(id) {
  return RECIPE_BY_ID[id] || RECIPES[0];
}

export function cookStationOf(recipe) {
  return recipe.cook === 'oven' ? 'oven' : 'stove';
}

// A small painted icon for one ingredient, centred on (x, y). `r` is its radius.
export function drawIngredient(ctx, id, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const lw = Math.max(1, r * 0.1);
  const dark = withAlpha('#2a1a16', 0.35);
  switch (id) {
    case 'dough': {
      circle(ctx, 0, 1, r * 0.9, '#d9b27b');
      circle(ctx, -r * 0.1, -r * 0.1, r * 0.82, '#efd3a3');
      for (let i = 0; i < 4; i++) {
        circle(ctx, Math.cos(i * 1.7) * r * 0.4, Math.sin(i * 1.7) * r * 0.35, r * 0.1, '#d3a873');
      }
      break;
    }
    case 'tomato': {
      circle(ctx, 0, r * 0.08, r * 0.85, '#c8432f');
      circle(ctx, -r * 0.2, -r * 0.16, r * 0.62, '#e15c40');
      circle(ctx, -r * 0.32, -r * 0.32, r * 0.18, withAlpha('#ffb08e', 0.8));
      ctx.fillStyle = '#4f8b3c';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * r * 0.3, -r * 0.68 + Math.sin(a) * r * 0.14, r * 0.3, r * 0.12, a, 0, Math.PI * 2);
        ctx.fill();
      }
      line(ctx, 0, -r * 0.7, 0, -r * 0.95, '#3f7132', lw);
      break;
    }
    case 'mozzarella': {
      circle(ctx, -r * 0.32, r * 0.12, r * 0.52, '#f6eed8');
      circle(ctx, r * 0.34, r * 0.2, r * 0.44, '#fbf5e6');
      circle(ctx, 0, -r * 0.32, r * 0.42, '#f2e7cc');
      circle(ctx, -r * 0.42, r * 0.02, r * 0.12, withAlpha('#ffffff', 0.7));
      circle(ctx, r * 0.3, -r * 0.44, r * 0.1, withAlpha('#ffffff', 0.6));
      break;
    }
    case 'basil': {
      for (let i = 0; i < 3; i++) {
        const a = -0.9 + i * 0.8;
        ctx.save();
        ctx.rotate(a);
        ctx.beginPath();
        ctx.ellipse(r * 0.18, 0, r * 0.62, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fillStyle = i === 1 ? '#78b457' : '#5f9845';
        ctx.fill();
        line(ctx, -r * 0.32, 0, r * 0.7, 0, withAlpha('#d7efbc', 0.5), Math.max(1, r * 0.06));
        ctx.restore();
      }
      break;
    }
    case 'noodles': {
      ctx.strokeStyle = '#e8c463';
      ctx.lineWidth = r * 0.16;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.7, i * r * 0.32 + r * 0.2);
        ctx.bezierCurveTo(-r * 0.25, i * r * 0.32 - r * 0.35, r * 0.1, i * r * 0.32 + r * 0.5, r * 0.72, i * r * 0.32 - r * 0.05);
        ctx.stroke();
      }
      break;
    }
    case 'miso': {
      ctx.beginPath();
      ctx.arc(0, r * 0.1, r * 0.78, 0.12 * Math.PI, 0.88 * Math.PI);
      ctx.fillStyle = '#7d4527';
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, r * 0.1, r * 0.78, r * 0.28, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#a9683d';
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, r * 0.1, r * 0.58, r * 0.18, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#5c331c';
      ctx.fill();
      ctx.strokeStyle = withAlpha('#f6e8cb', 0.55);
      ctx.lineWidth = lw;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * r * 0.3, -r * 0.2);
        ctx.quadraticCurveTo(i * r * 0.3 + r * 0.16, -r * 0.5, i * r * 0.3, -r * 0.8);
        ctx.stroke();
      }
      break;
    }
    case 'egg': {
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.78, r * 0.62, 0.2, 0, Math.PI * 2);
      ctx.fillStyle = '#faf4e4';
      ctx.fill();
      circle(ctx, r * 0.05, 0, r * 0.3, '#f0b83f');
      circle(ctx, -r * 0.02, -r * 0.06, r * 0.12, withAlpha('#fff3c4', 0.8));
      break;
    }
    case 'flour': {
      ctx.beginPath();
      ctx.moveTo(-r * 0.48, -r * 0.5);
      ctx.lineTo(r * 0.42, -r * 0.5);
      ctx.quadraticCurveTo(r * 0.7, r * 0.3, r * 0.44, r * 0.76);
      ctx.lineTo(-r * 0.5, r * 0.76);
      ctx.quadraticCurveTo(-r * 0.72, r * 0.2, -r * 0.48, -r * 0.5);
      ctx.fillStyle = '#e7d8bb';
      ctx.fill();
      ctx.fillStyle = '#c9b48e';
      ctx.fillRect(-r * 0.52, -r * 0.56, r * 0.98, r * 0.2);
      ctx.strokeStyle = '#a08a66';
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(-r * 0.3, r * 0.05);
      ctx.lineTo(r * 0.3, r * 0.05);
      ctx.moveTo(0, r * 0.05);
      ctx.lineTo(0, r * 0.5);
      ctx.stroke();
      break;
    }
    case 'berries': {
      circle(ctx, -r * 0.34, r * 0.16, r * 0.35, '#6d447e');
      circle(ctx, r * 0.3, r * 0.22, r * 0.33, '#7c4f91');
      circle(ctx, 0, -r * 0.24, r * 0.34, '#8a5a9c');
      circle(ctx, -r * 0.44, r * 0.02, r * 0.1, withAlpha('#d9b8e6', 0.7));
      ctx.fillStyle = '#5c8a45';
      ctx.beginPath();
      ctx.ellipse(r * 0.28, -r * 0.5, r * 0.3, r * 0.13, 0.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'honey': {
      rr(ctx, -r * 0.44, -r * 0.38, r * 0.88, r * 0.98, r * 0.18);
      ctx.fillStyle = '#d99a35';
      ctx.fill();
      ctx.fillStyle = withAlpha('#f7cd72', 0.9);
      ctx.fillRect(-r * 0.34, -r * 0.22, r * 0.68, r * 0.5);
      ctx.fillStyle = '#7c4a26';
      ctx.fillRect(-r * 0.5, -r * 0.56, r, r * 0.24);
      line(ctx, 0, -r * 0.9, r * 0.42, -r * 0.5, '#8a5527', r * 0.12);
      break;
    }
    case 'garlic': {
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.5);
      ctx.bezierCurveTo(r * 0.8, -r * 0.3, r * 0.75, r * 0.6, 0, r * 0.7);
      ctx.bezierCurveTo(-r * 0.75, r * 0.6, -r * 0.8, -r * 0.3, 0, -r * 0.5);
      ctx.fillStyle = '#f1e8d5';
      ctx.fill();
      ctx.strokeStyle = '#cdbfa4';
      ctx.lineWidth = lw;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * r * 0.28, -r * 0.3);
        ctx.quadraticCurveTo(i * r * 0.44, r * 0.2, i * r * 0.28, r * 0.62);
        ctx.stroke();
      }
      line(ctx, 0, -r * 0.5, r * 0.1, -r * 0.86, '#8eae63', r * 0.1);
      break;
    }
    case 'chili': {
      ctx.beginPath();
      ctx.moveTo(-r * 0.35, -r * 0.2);
      ctx.bezierCurveTo(r * 0.2, -r * 0.55, r * 0.72, r * 0.1, r * 0.35, r * 0.7);
      ctx.bezierCurveTo(r * 0.18, r * 0.34, -r * 0.1, r * 0.2, -r * 0.35, -r * 0.2);
      ctx.fillStyle = '#c93f32';
      ctx.fill();
      ctx.strokeStyle = '#8f2d25';
      ctx.lineWidth = lw;
      ctx.stroke();
      line(ctx, -r * 0.35, -r * 0.2, -r * 0.55, -r * 0.62, '#5c8a45', r * 0.14);
      break;
    }
    case 'cream': {
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, -r * 0.3);
      ctx.lineTo(r * 0.5, -r * 0.3);
      ctx.quadraticCurveTo(r * 0.35, r * 0.2, r * 0.18, r * 0.66);
      ctx.lineTo(-r * 0.18, r * 0.66);
      ctx.quadraticCurveTo(-r * 0.35, r * 0.2, -r * 0.5, -r * 0.3);
      ctx.fillStyle = '#f7f0e0';
      ctx.fill();
      ctx.fillStyle = '#dfd3bd';
      ctx.fillRect(-r * 0.56, -r * 0.44, r * 1.12, r * 0.2);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(r * 0.1, -r * 0.62, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'salmon': {
      ctx.beginPath();
      ctx.moveTo(-r * 0.66, r * 0.2);
      ctx.quadraticCurveTo(-r * 0.2, -r * 0.7, r * 0.7, -r * 0.3);
      ctx.quadraticCurveTo(r * 0.6, r * 0.6, -r * 0.5, r * 0.5);
      ctx.closePath();
      ctx.fillStyle = '#e8886d';
      ctx.fill();
      ctx.strokeStyle = withAlpha('#fff0e4', 0.75);
      ctx.lineWidth = Math.max(1, r * 0.08);
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.4, r * 0.12 + i * r * 0.18);
        ctx.quadraticCurveTo(0, -r * 0.2 + i * r * 0.18, r * 0.5, r * 0.02 + i * r * 0.18);
        ctx.stroke();
      }
      break;
    }
    case 'lemon': {
      circle(ctx, 0, 0, r * 0.72, '#efd04f');
      circle(ctx, -r * 0.2, -r * 0.22, r * 0.3, withAlpha('#fff2a8', 0.5));
      ctx.strokeStyle = withAlpha('#fff6c9', 0.85);
      ctx.lineWidth = lw;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        line(ctx, 0, 0, Math.cos(a) * r * 0.64, Math.sin(a) * r * 0.64, withAlpha('#fff6c9', 0.8), lw);
      }
      ctx.beginPath();
      ctx.ellipse(r * 0.5, -r * 0.62, r * 0.28, r * 0.12, -0.6, 0, Math.PI * 2);
      ctx.fillStyle = '#6d9c4c';
      ctx.fill();
      break;
    }
    case 'mushroom':
    default: {
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.8, Math.PI, Math.PI * 2);
      ctx.fillStyle = '#a5774f';
      ctx.fill();
      ctx.fillStyle = '#e3c8a5';
      ctx.fillRect(-r * 0.22, r * 0.02, r * 0.44, r * 0.62);
      circle(ctx, -r * 0.3, -r * 0.24, r * 0.1, withAlpha('#f0dcc2', 0.8));
      circle(ctx, r * 0.22, -r * 0.36, r * 0.09, withAlpha('#f0dcc2', 0.8));
      break;
    }
  }
  ctx.restore();
  if (dark) {
    // no-op: keeps dark referenced for linters that read it
  }
}

// The three ingredient icons for a recipe, laid out in a row.
export function drawRecipeIcons(ctx, recipe, x, y, r, gap = 0.5) {
  const step = r * (2 + gap);
  recipe.ingredients.forEach((id, i) => drawIngredient(ctx, id, x + i * step, y, r));
}
