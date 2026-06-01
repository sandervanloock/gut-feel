import {Icon} from './Icon.jsx';

export function MealAnalysisStrip({analysis, onClick}) {
    if (!analysis) return null;
    const {status} = analysis;

    if (status === 'pending') {
        return (
            <div className="analysis-strip analysis-strip--pending" onClick={onClick}>
                <Icon name="spinner" size={13} color="var(--muted)"/>
                <span>Analysing…</span>
            </div>
        );
    }

    if (status === 'needs-input') {
        return (
            <div className="analysis-strip analysis-strip--needs-input" onClick={onClick}>
                <Icon name="sparkle" size={13} color="var(--sage)"/>
                <span>{analysis.followup?.prompt ?? 'Question about this meal'}</span>
                <Icon name="chevron-r" size={13} color="var(--muted)"/>
            </div>
        );
    }

    if (status === 'ready' && analysis.nutrition) {
        const {kcal, macros, conf} = analysis.nutrition;
        const confDot = conf?.calories === 'high' ? 'var(--sage)' : conf?.calories === 'med' ? 'var(--amber)' : 'var(--terracotta)';
        return (
            <div className="analysis-strip analysis-strip--ready" onClick={onClick}>
                <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: confDot,
                    display: 'inline-block',
                    flexShrink: 0
                }}/>
                <span className="analysis-kcal">{Math.round(kcal)} kcal</span>
                <span className="analysis-macro">P {Math.round(macros.protein)}g</span>
                <span className="analysis-macro">C {Math.round(macros.carbs)}g</span>
                <span className="analysis-macro">F {Math.round(macros.fat)}g</span>
                <Icon name="chevron-r" size={13} color="var(--faint)" style={{marginLeft: 'auto'}}/>
            </div>
        );
    }

    return null;
}
