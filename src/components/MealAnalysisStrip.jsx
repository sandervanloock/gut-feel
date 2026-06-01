import {Icon} from './Icon.jsx';

const MACRO_COLOR = {
    protein: 'var(--macro-p)',
    carbs: 'var(--macro-c)',
    fat: 'var(--macro-f)',
};

export function MealAnalysisStrip({analysis}) {
    if (!analysis) return null;
    const {status, nutrition, dropped = []} = analysis;

    if (status === 'pending') {
        return (
            <div className="mstrip mstrip--pending">
                <span className="mstrip-spark"><Icon name="sparkle" size={12} color="currentColor"/></span>
                <span className="mstrip-shimmer">reading nutrition…</span>
            </div>
        );
    }

    if (status === 'needs-input') {
        return (
            <div className="mstrip mstrip--ask">
                {nutrition && (
                    <span className="mstrip-kcal">≈ {Math.round(nutrition.kcal)} kcal</span>
                )}
                <span className="mstrip-nudge">
          <Icon name="sparkle" size={12} color="currentColor"/>
          <span>one quick question</span>
          <Icon name="chevron-r" size={13} color="currentColor"/>
        </span>
            </div>
        );
    }

    if (status === 'ready' && nutrition) {
        const m = nutrition.macros;
        const cals = {protein: m.protein * 4, carbs: m.carbs * 4, fat: m.fat * 9};
        const total = Math.max(cals.protein + cals.carbs + cals.fat, 1);
        return (
            <div className="mstrip mstrip--ready">
                <span className="mstrip-spark"><Icon name="sparkle" size={12} color="currentColor"/></span>
                <span className="mstrip-kcal">{Math.round(nutrition.kcal)} kcal</span>
                <span className="mstrip-bar">
          {['protein', 'carbs', 'fat'].map(k => (
              <i key={k} style={{width: (cals[k] / total * 100) + '%', background: MACRO_COLOR[k]}}/>
          ))}
        </span>
                <span className="mstrip-macros">
          <b style={{color: MACRO_COLOR.protein}}>{m.protein}P</b>
          <b style={{color: MACRO_COLOR.carbs}}>{m.carbs}C</b>
          <b style={{color: MACRO_COLOR.fat}}>{m.fat}F</b>
        </span>
                {dropped.length > 0 && <span className="mstrip-edited">edited</span>}
            </div>
        );
    }

    return null;
}
