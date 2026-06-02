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

function makeAnalysis(kcal, protein, carbs, fat, fiber, sugar, sodium, confLevel = 'med') {
    return {
        status: 'ready',
        nutrition: {
            kcal,
            macros: {protein, carbs, fat},
            fiber,
            sugar,
            sodium,
            vitamins: [],
            conf: {
                calories: confLevel,
                protein: confLevel,
                carbs: confLevel,
                fat: confLevel,
                fiber: confLevel,
                sugar: confLevel,
                sodium: confLevel,
                vitamins: 'low',
            },
            knownRatio: confLevel === 'high' ? 0.95 : 0.75,
        },
        followup: null,
        followupAnswers: {},
        dropped: [],
        inputHash: 'seed',
        model: 'seed',
        version: 1,
        updatedAt: now(),
    };
}

const MEALS = [
    {
        name: 'Avocado toast', mealType: 'breakfast', ingredients: ['sourdough', 'avocado', 'eggs', 'tomato'],
        analysis: makeAnalysis(420, 18, 38, 22, 8, 4, 480, 'high')
    },
    {
        name: 'Greek yogurt with granola',
        mealType: 'breakfast',
        ingredients: ['yogurt', 'granola', 'blueberries', 'honey'],
        analysis: makeAnalysis(340, 15, 52, 9, 4, 28, 120, 'high'),
    },
    {
        name: 'Oatmeal with banana', mealType: 'breakfast', ingredients: ['oats', 'banana', 'almond milk', 'cinnamon'],
        analysis: makeAnalysis(310, 8, 58, 6, 7, 18, 80, 'high')
    },
    {
        name: 'Chicken salad',
        mealType: 'lunch',
        ingredients: ['chicken', 'romaine', 'tomato', 'cucumber', 'olive oil'],
        analysis: makeAnalysis(380, 34, 12, 22, 4, 6, 310, 'high')
    },
    {
        name: 'Lentil soup', mealType: 'lunch', ingredients: ['lentils', 'onion', 'garlic', 'carrot', 'spinach'],
        analysis: makeAnalysis(280, 18, 44, 4, 14, 8, 620, 'med')
    },
    {
        name: 'Quinoa bowl', mealType: 'lunch', ingredients: ['quinoa', 'chickpeas', 'pepper', 'feta', 'lemon'],
        analysis: makeAnalysis(420, 19, 54, 14, 9, 7, 480, 'med')
    },
    {
        name: 'Pasta with tomato sauce',
        mealType: 'dinner',
        ingredients: ['pasta', 'tomato', 'garlic', 'olive oil', 'parmesan'],
        analysis: makeAnalysis(520, 18, 72, 16, 5, 9, 540, 'med'),
    },
    {
        name: 'Salmon with rice', mealType: 'dinner', ingredients: ['salmon', 'rice', 'broccoli', 'soy sauce', 'lemon'],
        analysis: makeAnalysis(490, 38, 48, 14, 4, 4, 820, 'high')
    },
    {
        name: 'Stir-fry tofu', mealType: 'dinner', ingredients: ['tofu', 'noodles', 'pepper', 'onion', 'soy sauce'],
        analysis: makeAnalysis(410, 22, 52, 12, 5, 8, 920, 'med')
    },
    {
        name: 'Beef tacos', mealType: 'dinner', ingredients: ['beef', 'tortilla', 'lettuce', 'tomato', 'cheese'],
        analysis: makeAnalysis(560, 32, 38, 28, 4, 6, 740, 'med')
    },
    {
        name: 'Coffee', mealType: 'other', ingredients: [],
        analysis: makeAnalysis(5, 0, 1, 0, 0, 0, 5, 'high')
    },
    {
        name: 'Fruit bowl', mealType: 'other', ingredients: ['apple', 'orange', 'strawberry', 'blueberries'],
        analysis: makeAnalysis(180, 2, 44, 1, 7, 34, 10, 'high')
    },
];

const ACTIVITIES = [
    {activityType: 'Run', durationMinutes: 32, caloriesBurned: 310, distanceMeters: 5200},
    {activityType: 'Run', durationMinutes: 45, caloriesBurned: 420, distanceMeters: 7500},
    {activityType: 'Ride', durationMinutes: 48, caloriesBurned: 480, distanceMeters: 18000},
    {activityType: 'Strength', durationMinutes: 45, caloriesBurned: 280, distanceMeters: null},
    {activityType: 'Walk', durationMinutes: 35, caloriesBurned: 180, distanceMeters: 3200},
    {activityType: 'Yoga', durationMinutes: 40, caloriesBurned: 120, distanceMeters: null},
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
                analysis: meal.analysis ?? null,
                analysisRequestedAt: now(),
                createdAt: now(),
                updatedAt: now(),
            });
            count++;
        }

        // ~40% chance of an activity
        if (Math.random() > 0.6) {
            const act = pick(ACTIVITIES);
            const ref = col.doc();
            batch.set(ref, {
                type: 'activity',
                date,
                time: pick(['06:30', '07:00', '07:30', '08:00', '17:00', '18:00']),
                activityType: act.activityType,
                durationMinutes: act.durationMinutes,
                caloriesBurned: act.caloriesBurned,
                distanceMeters: act.distanceMeters,
                source: 'Garmin',
                sourceId: `seed-${date}-${Math.random().toString(36).slice(2, 8)}`,
                syncedAt: now(),
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
