import {Icon} from './Icon.jsx';
import {FollowupPrompt} from './FollowupPrompt.jsx';

function ConfBar({level}) {
    const color = level === 'high' ? 'var(--sage)' : level === 'med' ? 'var(--amber)' : 'var(--terracotta)';
    const fill = level === 'high' ? 1 : level === 'med' ? 0.6 : 0.3;
    return (
        <div style={{display: 'flex', gap: 2}}>
            {[1, 2, 3].map(i => (
                <div key={i} style={{
                    width: 6, height: 6, borderRadius: 2,
                    background: i / 3 <= fill ? color : 'var(--line-2)',
                }}/>
            ))}
        </div>
    );
}

function MacroBlock({label, value, unit = 'g', conf}) {
    return (
        <div className="macro-block">
            <div className="macro-value">{Math.round(value)}<span className="macro-unit">{unit}</span></div>
            <div className="macro-label">{label}</div>
            {conf && <ConfBar level={conf}/>}
        </div>
    );
}

export function NutritionPanel({analysis, onAnswerFollowup, onDropTag, onRestoreTags}) {
    if (!analysis) return null;
    const {status, nutrition, followup, dropped = []} = analysis;

    if (status === 'pending') {
        return (
            <div className="nutrition-panel nutrition-panel--loading">
                <Icon name="spinner" size={16} color="var(--muted)"/>
                <span>Calculating nutrition…</span>
            </div>
        );
    }

    return (
        <div className="nutrition-panel">
            <div className="nutrition-panel-header">
                <Icon name="sparkle" size={14} color="var(--sage)"/>
                <span className="nutrition-panel-title">Nutrition estimate</span>
                {dropped.length > 0 && (
                    <button className="restore-btn" onClick={onRestoreTags}>Restore tags</button>
                )}
            </div>

            {status === 'needs-input' && followup && (
                <FollowupPrompt followup={followup} onAnswer={onAnswerFollowup}/>
            )}

            {nutrition && (
                <>
                    <div className="macro-row">
                        <MacroBlock label="Calories" value={nutrition.kcal} unit=" kcal"
                                    conf={nutrition.conf?.calories}/>
                        <MacroBlock label="Protein" value={nutrition.macros.protein} conf={nutrition.conf?.protein}/>
                        <MacroBlock label="Carbs" value={nutrition.macros.carbs} conf={nutrition.conf?.carbs}/>
                        <MacroBlock label="Fat" value={nutrition.macros.fat} conf={nutrition.conf?.fat}/>
                    </div>

                    <div className="nutrition-secondary">
                        {!dropped.includes('fiber') && (
                            <NutritionTag label="Fiber" value={`${nutrition.fiber.toFixed(1)}g`}
                                          conf={nutrition.conf?.fiber}
                                          onDrop={() => onDropTag?.('fiber')}/>
                        )}
                        {!dropped.includes('sugar') && (
                            <NutritionTag label="Sugar" value={`${nutrition.sugar.toFixed(1)}g`}
                                          conf={nutrition.conf?.sugar}
                                          onDrop={() => onDropTag?.('sugar')}/>
                        )}
                        {!dropped.includes('sodium') && (
                            <NutritionTag label="Sodium" value={`${Math.round(nutrition.sodium)}mg`}
                                          conf={nutrition.conf?.sodium}
                                          onDrop={() => onDropTag?.('sodium')}/>
                        )}
                        {(nutrition.vitamins || []).filter(v => !dropped.includes(`vit:${v.key}`)).map(v => (
                            <NutritionTag key={v.key} label={v.name} value={`${Math.round(v.dv)}% DV`}
                                          conf={nutrition.conf?.vitamins} onDrop={() => onDropTag?.(`vit:${v.key}`)}/>
                        ))}
                    </div>

                    {nutrition.knownRatio < 0.7 && (
                        <div className="nutrition-caveat">
                            <Icon name="note" size={12} color="var(--faint)"/>
                            <span>Estimate based on {Math.round(nutrition.knownRatio * 100)}% known ingredients</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function NutritionTag({label, value, conf, onDrop}) {
    return (
        <div className="nutrition-tag">
            <span className="nutrition-tag-label">{label}</span>
            <span className="nutrition-tag-value">{value}</span>
            {conf && <ConfBar level={conf}/>}
            {onDrop && (
                <button className="nutrition-tag-drop" onClick={onDrop} aria-label={`Dismiss ${label}`}>
                    <Icon name="x" size={10}/>
                </button>
            )}
        </div>
    );
}
