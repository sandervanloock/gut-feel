export const TODAY = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function dayKey(d) {
  return d.toISOString().slice(0, 10);
}

export function fmtTime(t) {
  const [h, m] = t.split(':');
  return `${parseInt(h, 10)}:${m}`;
}

export function fmtDate(d) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function relativeDay(d) {
  const diff = Math.round((d - TODAY) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0 && diff > -7) return `${-diff} days ago`;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export const COMMON_INGREDIENTS = [
  'eggs', 'bread', 'sourdough', 'avocado', 'tomato', 'onion', 'garlic',
  'chicken', 'salmon', 'beef', 'tofu', 'pork', 'bacon', 'ham',
  'rice', 'quinoa', 'pasta', 'noodles', 'oats', 'tortilla',
  'broccoli', 'spinach', 'lettuce', 'romaine', 'cucumber', 'pepper', 'carrot',
  'banana', 'apple', 'blueberries', 'lemon', 'orange', 'strawberry',
  'cheese', 'parmesan', 'mozzarella', 'feta', 'yogurt', 'milk', 'butter',
  'olive oil', 'soy sauce', 'honey', 'salt', 'pepper', 'chili',
  'beans', 'lentils', 'chickpeas', 'almond butter', 'peanut butter',
  'granola', 'chia seeds', 'almond milk', 'cinnamon',
];

export const QUICK_SNACKS = [
  { id: 'coffee', label: 'Coffee', icon: 'coffee' },
  { id: 'water',  label: 'Water',  icon: 'water'  },
  { id: 'wine',   label: 'Wine',   icon: 'wine'   },
  { id: 'beer',   label: 'Beer',   icon: 'beer'   },
  { id: 'soda',   label: 'Soda',   icon: 'soda'   },
  { id: 'tea',    label: 'Tea',    icon: 'tea'    },
];

export const BRISTOL_LABELS = [
  { n: 1, name: 'Pebbles',   hint: 'hard, separate'             },
  { n: 2, name: 'Lumpy',     hint: 'sausage-like, lumpy'        },
  { n: 3, name: 'Cracked',   hint: 'sausage with cracks'        },
  { n: 4, name: 'Smooth',    hint: 'smooth, soft — ideal'       },
  { n: 5, name: 'Soft bits', hint: 'soft pieces, edges defined' },
  { n: 6, name: 'Mushy',     hint: 'fluffy, ragged edges'       },
  { n: 7, name: 'Liquid',    hint: 'watery, no solids'          },
];
