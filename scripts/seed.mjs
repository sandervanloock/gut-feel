/**
 * Seed the local Firestore database with dummy meal + gut entries.
 *
 * Prerequisites:
 *   npm install --save-dev firebase-admin dotenv
 *   gcloud auth application-default login   (or set GOOGLE_APPLICATION_CREDENTIALS)
 *
 * Usage:
 *   node scripts/seed.mjs <uid> [--days=14] [--env=.env.local]
 *
 * <uid>  Your Firebase Auth UID — copy it from the browser console:
 *        firebase.auth().currentUser.uid  (or check the Network tab in DevTools)
 */

import {applicationDefault, initializeApp} from 'firebase-admin/app';
import {getFirestore, Timestamp} from 'firebase-admin/firestore';
import {existsSync, readFileSync} from 'fs';
import {dirname, resolve} from 'path';
import {fileURLToPath} from 'url';

// ---------------------------------------------------------------------------
// Parse args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const uid = args.find(a => !a.startsWith('--'));
const daysArg = args.find(a => a.startsWith('--days='));
const envArg = args.find(a => a.startsWith('--env='));

if (!uid) {
    console.error('Usage: node scripts/seed.mjs <uid> [--days=14] [--env=.env.local]');
    process.exit(1);
}

const DAYS = daysArg ? parseInt(daysArg.split('=')[1], 10) : 14;
const ENV_FILE = envArg ? envArg.split('=')[1] : '.env.local';

// ---------------------------------------------------------------------------
// Load .env.local manually (no dotenv import needed — we just parse KEY=VALUE)
// ---------------------------------------------------------------------------
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, '..', ENV_FILE);

if (!existsSync(envPath)) {
    console.error(`Env file not found: ${envPath}`);
    process.exit(1);
}

const envVars = {};
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+)\s*$/);
    if (m) envVars[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const PROJECT_ID = envVars.VITE_FIREBASE_PROJECT_ID;
const DATABASE_ID = envVars.VITE_FIRESTORE_DATABASE || '(default)';

if (!PROJECT_ID) {
    console.error('VITE_FIREBASE_PROJECT_ID not found in', ENV_FILE);
    process.exit(1);
}

// Hard guard: only the "local" database may be seeded.
if (DATABASE_ID !== 'local') {
    console.error(`\nABORTED — refusing to seed database "${DATABASE_ID}".`);
    console.error('This script only runs against the "local" database.');
    console.error('Check that you are using the right env file (e.g. .env.local).\n');
    process.exit(1);
}

console.log(`Project: ${PROJECT_ID}  Database: ${DATABASE_ID}  UID: ${uid}  Days: ${DAYS}`);

// ---------------------------------------------------------------------------
// Init Admin SDK
// ---------------------------------------------------------------------------
initializeApp({credential: applicationDefault(), projectId: PROJECT_ID});
const db = getFirestore(DATABASE_ID === '(default)' ? undefined : DATABASE_ID);
db.settings({ignoreUndefinedProperties: true});

// ---------------------------------------------------------------------------
// Seed data helpers
// ---------------------------------------------------------------------------
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'other'];
const MEAL_TIMES = {breakfast: '08:30', lunch: '12:15', dinner: '18:45', other: '15:00'};

const MEALS = [
    {name: 'Avocado toast', mealType: 'breakfast', ingredients: ['sourdough', 'avocado', 'eggs', 'tomato']},
    {
        name: 'Greek yogurt with granola',
        mealType: 'breakfast',
        ingredients: ['yogurt', 'granola', 'blueberries', 'honey']
    },
    {name: 'Oatmeal with banana', mealType: 'breakfast', ingredients: ['oats', 'banana', 'almond milk', 'cinnamon']},
    {name: 'Chicken salad', mealType: 'lunch', ingredients: ['chicken', 'romaine', 'tomato', 'cucumber', 'olive oil']},
    {name: 'Lentil soup', mealType: 'lunch', ingredients: ['lentils', 'onion', 'garlic', 'carrot', 'spinach']},
    {name: 'Quinoa bowl', mealType: 'lunch', ingredients: ['quinoa', 'chickpeas', 'pepper', 'feta', 'lemon']},
    {
        name: 'Pasta with tomato sauce',
        mealType: 'dinner',
        ingredients: ['pasta', 'tomato', 'garlic', 'olive oil', 'parmesan']
    },
    {name: 'Salmon with rice', mealType: 'dinner', ingredients: ['salmon', 'rice', 'broccoli', 'soy sauce', 'lemon']},
    {name: 'Stir-fry tofu', mealType: 'dinner', ingredients: ['tofu', 'noodles', 'pepper', 'onion', 'soy sauce']},
    {name: 'Beef tacos', mealType: 'dinner', ingredients: ['beef', 'tortilla', 'lettuce', 'tomato', 'cheese']},
    {name: 'Coffee', mealType: 'other', ingredients: []},
    {name: 'Fruit bowl', mealType: 'other', ingredients: ['apple', 'orange', 'strawberry', 'blueberries']},
];

const NOTES_POOL = [
    'Felt good after this.',
    'A bit heavy, could eat less next time.',
    'Really enjoyed it.',
    '',
    '',
    'Made at home.',
    'Restaurant meal.',
    'Leftovers from yesterday.',
    '',
];

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function dateStr(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
}

function now() {
    return Timestamp.now();
}

// ---------------------------------------------------------------------------
// Generate entries
// ---------------------------------------------------------------------------
async function seed() {
    const col = db.collection('users').doc(uid).collection('entries');
    const batch = db.batch();
    let count = 0;

    for (let day = 0; day < DAYS; day++) {
        const date = dateStr(day);

        // 2-3 meals per day
        const numMeals = randInt(2, 3);
        const usedTypes = new Set();

        for (let m = 0; m < numMeals; m++) {
            let meal;
            let attempts = 0;
            do {
                meal = pick(MEALS.filter(x => x.mealType !== 'other'));
                attempts++;
            } while (usedTypes.has(meal.mealType) && attempts < 10);

            usedTypes.add(meal.mealType);

            const ref = col.doc();
            batch.set(ref, {
                type: 'meal',
                date,
                name: meal.name,
                mealType: meal.mealType,
                ingredients: meal.ingredients,
                time: MEAL_TIMES[meal.mealType],
                notes: pick(NOTES_POOL),
                photoUrl: null,
                createdAt: now(),
                updatedAt: now(),
            });
            count++;
        }

        // 0-1 snack per day
        if (Math.random() > 0.5) {
            const ref = col.doc();
            batch.set(ref, {
                type: 'snack',
                date,
                item: pick(['coffee', 'water', 'tea', 'coffee']),
                time: pick(['09:15', '10:30', '14:00', '16:30']),
                createdAt: now(),
                updatedAt: now(),
            });
            count++;
        }

        // 1-2 gut entries per day
        const numGut = randInt(1, 2);
        for (let g = 0; g < numGut; g++) {
            const ref = col.doc();
            batch.set(ref, {
                type: 'gut',
                date,
                bristol: randInt(2, 5),
                urgency: randInt(1, 4),
                effort: randInt(1, 3),
                time: g === 0 ? '08:00' : '13:30',
                createdAt: now(),
                updatedAt: now(),
            });
            count++;
        }
    }

    await batch.commit();
    console.log(`Seeded ${count} entries across ${DAYS} days for UID ${uid}`);
}

seed().catch(e => {
    console.error(e);
    process.exit(1);
});
