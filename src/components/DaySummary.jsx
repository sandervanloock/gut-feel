import {BlobShape} from './BlobShape.jsx';
import {Icon} from './Icon.jsx';

const VIT_NAME = {
    c: 'Vitamin C', d: 'Vitamin D', b12: 'B12', iron: 'Iron',
    calcium: 'Calcium', potassium: 'Potassium', magnesium: 'Magnesium',
};

function gutSummary(meals, bowels, avg) {
  if (meals === 0 && bowels === 0) return 'A blank day. Log your first bite below.';
  if (avg === null) return `${meals} ${meals === 1 ? 'meal' : 'meals'} logged. No output yet.`;
  if (avg >= 3.5 && avg <= 4.5) return 'Smooth sailing — output looking ideal.';
  if (avg < 3.5) return 'Things are running a touch firm.';
  return 'Things are running a touch loose.';
}

function aggregateDayNutrition(dayEntries) {
    const meals = dayEntries.filter(e => e.type === 'meal');
    let analysed = 0, pending = 0;
    let kcal = 0;
    const macros = {protein: 0, carbs: 0, fat: 0};
    let estimate = false;

    meals.forEach(m => {
        const a = m.analysis;
        if (!a || a.status === 'pending' || !a.nutrition) {
            pending++;
            return;
        }
        analysed++;
        const n = a.nutrition;
        const dropped = a.dropped || [];
        const has = (k) => !dropped.includes(k);
        if (has('calories')) kcal += n.kcal;
        if (has('protein')) macros.protein += n.macros.protein;
        if (has('carbs')) macros.carbs += n.macros.carbs;
        if (has('fat')) macros.fat += n.macros.fat;
        if (a.status === 'needs-input' || (n.conf && n.conf.calories === 'low')) estimate = true;
    });

    return {totalMeals: meals.length, analysed, pending, kcal, macros, estimate};
}

export function DaySummary({ entries, metaphor }) {
    const activities = entries.filter(e => e.type === 'activity');
    const burned = activities.reduce((s, a) => s + (a.caloriesBurned || 0), 0);
    const activeMin = activities.reduce((s, a) => s + (a.durationMinutes || 0), 0);
    const actTypes = [...new Set(activities.map(a => a.activityType).filter(Boolean))];

  const bowel = entries.filter(e => e.type === 'bowel');
    const avgBristol = bowel.length
        ? bowel.reduce((s, e) => s + e.bristol, 0) / bowel.length
        : null;

    const agg = aggregateDayNutrition(entries);
    const hasNutrition = agg.analysed > 0;

    const mc = {
        protein: agg.macros.protein * 4,
        carbs: agg.macros.carbs * 4,
        fat: agg.macros.fat * 9,
    };
    const mcTotal = Math.max(mc.protein + mc.carbs + mc.fat, 1);
    const macroMeta = [
        {key: 'protein', label: 'Protein', g: agg.macros.protein, color: 'var(--macro-p)'},
        {key: 'carbs', label: 'Carbs', g: agg.macros.carbs, color: 'var(--macro-c)'},
        {key: 'fat', label: 'Fat', g: agg.macros.fat, color: 'var(--macro-f)'},
    ];

    let calSub;
    if (!hasNutrition) {
        calSub = agg.totalMeals === 0 ? 'No meals logged yet.' : 'Nutrition still being tagged…';
    } else {
        const mealWord = agg.analysed === 1 ? 'meal' : 'meals';
        calSub = `across ${agg.analysed} ${mealWord}`;
        if (agg.pending > 0) calSub += ` · ${agg.pending} still tagging`;
    }

  return (
    <div style={{ padding: '14px 20px 24px' }}>
        <div className="card today-summary-card gut-card">
            {/* Calories hero */}
            <div className="gut-cal-block">
                <div className="eyebrow">Today's gut</div>
                {hasNutrition ? (
                    <>
                        <div className="gut-cal-row">
                            <span className="gut-cal-num">{agg.estimate ? '≈ ' : ''}{agg.kcal.toLocaleString()}</span>
                            <span className="gut-cal-unit">kcal</span>
                        </div>
                        <div className="gut-cal-sub">{calSub}</div>
                        {burned > 0 && (
                            <div className="gut-energy">
                                <div className="gut-energy-cell">
                                    <span className="gut-energy-num">{agg.kcal.toLocaleString()}</span>
                                    <span className="gut-energy-lbl">in</span>
                                </div>
                                <span className="gut-energy-op">−</span>
                                <div className="gut-energy-cell">
                                    <span className="gut-energy-num">{burned.toLocaleString()}</span>
                                    <span className="gut-energy-lbl">burned</span>
                                </div>
                                <span className="gut-energy-op">=</span>
                                <div className="gut-energy-cell">
                                    <span
                                        className="gut-energy-num gut-energy-net">{(agg.kcal - burned).toLocaleString()}</span>
                                    <span className="gut-energy-lbl">net</span>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="gut-cal-empty">{calSub}</div>
                )}
            </div>

            {/* Macro split */}
            {hasNutrition && (
                <div className="gut-macros">
                    <div className="gut-macro-bar">
                        {macroMeta.map(m => (
                            <i key={m.key} style={{width: (mc[m.key] / mcTotal * 100) + '%', background: m.color}}/>
                        ))}
                    </div>
                    <div className="gut-macro-legend">
                        {macroMeta.map(m => (
                            <div key={m.key} className="gut-macro-item">
                                <span className="gut-macro-dot" style={{background: m.color}}/>
                                <span className="gut-macro-name">{m.label}</span>
                                <span className="gut-macro-g">{m.g}<span className="gut-macro-u">g</span></span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Activity footer */}
            {activities.length > 0 && (
                <div className="gut-activity">
                    <div className="gut-act-icon">
                        <Icon name="activity" size={20} color="var(--move-ink)"/>
                    </div>
                    <div className="gut-output-text">
                        <div className="gut-output-line">
                            {burned > 0 ? `≈${burned.toLocaleString()} kcal burned` : `${activeMin} min active`}
                        </div>
                        <div className="gut-output-meta">
                            {activeMin} min active
                            · {activities.length} {activities.length === 1 ? 'session' : 'sessions'}
                            {actTypes.length > 0 ? ' · ' + actTypes.join(', ').toLowerCase() : ''}
                        </div>
                    </div>
                </div>
            )}

            {/* Gut output footer */}
            <div className="gut-output">
                {avgBristol ? (
                    <>
                        <BlobShape n={Math.round(avgBristol)} size={40} metaphor={metaphor}/>
                        <div className="gut-output-text">
                            <div className="gut-output-line">{gutSummary(0, bowel.length, avgBristol)}</div>
                            <div className="gut-output-meta">
                                {bowel.length} {bowel.length === 1 ? 'movement' : 'movements'} ·
                                Type {avgBristol.toFixed(1)} avg
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="gut-output-meta gut-output-none">No gut output logged yet.</div>
                )}
            </div>
      </div>
    </div>
  );
}
