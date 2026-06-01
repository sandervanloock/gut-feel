import {Icon} from './Icon.jsx';
import {FollowupPrompt} from './FollowupPrompt.jsx';

const MACRO_COLOR = {
    protein: 'var(--macro-p)',
    carbs: 'var(--macro-c)',
    fat: 'var(--macro-f)',
};

function ConfMeter({level}) {
    const filled = level === 'high' ? 3 : level === 'med' ? 2 : 1;
    return (
        <span className="conf-meter" title={'AI confidence: ' + level} aria-label={'confidence ' + level}>
      {[0, 1, 2].map(i => (
          <i key={i} className={'conf-seg' + (i < filled ? ' on' : '') + (level === 'low' ? ' low' : '')}/>
      ))}
    </span>
    );
}

function DropX({onClick}) {
    return (
        <button className="nutri-drop" onClick={e => {
            e.stopPropagation();
            onClick();
        }} aria-label="Drop this tag">
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M2 2l5 5M7 2l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
        </button>
    );
}

function NutriSkeleton() {
    return (
        <div className="nutri-skel" aria-hidden>
            <div className="skel-row" style={{width: '52%', height: 34}}/>
            <div className="skel-bar"/>
            <div style={{display: 'flex', gap: 8, marginTop: 4}}>
                <div className="skel-row" style={{flex: 1, height: 16}}/>
                <div className="skel-row" style={{flex: 1, height: 16}}/>
                <div className="skel-row" style={{flex: 1, height: 16}}/>
            </div>
        </div>
    );
}

function MacroBlock({nutrition, isDropped, onDropTag}) {
    const m = nutrition.macros;
    const cals = {protein: m.protein * 4, carbs: m.carbs * 4, fat: m.fat * 9};
    const total = Math.max(cals.protein + cals.carbs + cals.fat, 1);
    const order = ['protein', 'carbs', 'fat'];
    const visible = order.filter(k => !isDropped(k));
    const label = {protein: 'Protein', carbs: 'Carbs', fat: 'Fat'};
    return (
        <div className="nutri-macro">
            <div className="macro-bar">
                {visible.map(k => (
                    <div key={k} className="macro-seg"
                         style={{width: (cals[k] / total * 100) + '%', background: MACRO_COLOR[k]}}/>
                ))}
                {visible.length === 0 &&
                    <div className="macro-seg" style={{width: '100%', background: 'var(--line)'}}/>}
            </div>
            <div className="macro-legend">
                {visible.map(k => (
                    <div key={k} className="macro-item">
                        <span className="macro-dot" style={{background: MACRO_COLOR[k]}}/>
                        <span className="macro-name">{label[k]}</span>
                        <span className={'macro-g' + (nutrition.conf?.[k] === 'low' ? ' is-est' : '')}>
              {m[k]}<span className="nutri-unit">g</span>
            </span>
                        <ConfMeter level={nutrition.conf?.[k] ?? 'med'}/>
                        {onDropTag && <DropX onClick={() => onDropTag(k)}/>}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function NutritionPanel({analysis, onAnswerFollowup, onDropTag, onRestoreTags, isNew}) {
    if (isNew) {
    return (
        <div className="nutri nutri-idle">
            <div className="nutri-idle-row">
                <span className="followup-spark"><Icon name="sparkle" size={13} color="currentColor"/></span>
                <span>Nutrition gets tagged automatically once you save.</span>
            </div>
        </div>
    );
    }
    if (!analysis) return null;

    const {status, nutrition, followup, dropped = []} = analysis;
    const isDropped = k => dropped.includes(k);
    const statusWord = status === 'pending' ? 'analysing' : status === 'needs-input' ? 'needs a detail' : 'tagged by AI';

    return (
        <div className="nutri">
            <div className="nutri-head">
                <div className="nutri-title">
                    <span className="followup-spark"><Icon name="sparkle" size={13} color="currentColor"/></span>
                    <span className="nutri-title-text">Nutrition</span>
                    <span className={'nutri-status nutri-status--' + status}>{statusWord}</span>
                </div>
                {dropped.length > 0 && (
                    <button className="nutri-edited" onClick={onRestoreTags}>edited · undo</button>
                )}
            </div>

            {status === 'pending' && <NutriSkeleton/>}

            {status !== 'pending' && nutrition && (
                <>
                    {status === 'needs-input' && followup && (
                        <FollowupPrompt
                            followup={followup}
                            onAnswer={v => onAnswerFollowup(followup.id, v)}
                            onSkip={() => onAnswerFollowup(followup.id, null)}
                        />
                    )}

                    <div className={status === 'needs-input' ? 'nutri-body is-prelim' : 'nutri-body'}>
                        {status === 'needs-input' && (
                            <div className="nutri-prelim-note">Best guess so far — answer above to sharpen it.</div>
            )}

                        {!isDropped('calories') && (
                            <div className="nutri-cal">
                                <div className="nutri-cal-main">
                  <span className={'nutri-cal-num' + (nutrition.conf?.calories === 'low' ? ' is-est' : '')}>
                    {Math.round(nutrition.kcal)}
                  </span>
                                    <span className="nutri-cal-unit">kcal</span>
                                </div>
                                <div className="nutri-cal-side">
                                    <ConfMeter level={nutrition.conf?.calories ?? 'med'}/>
                                    {onDropTag && <DropX onClick={() => onDropTag('calories')}/>}
                                </div>
                            </div>
                        )}

                        <MacroBlock nutrition={nutrition} isDropped={isDropped} onDropTag={onDropTag}/>

                        <div className="nutri-detail">
                            {[
                                {key: 'fiber', label: 'Fiber', value: nutrition.fiber, unit: 'g'},
                                {key: 'sugar', label: 'Sugar', value: nutrition.sugar, unit: 'g'},
                                {key: 'sodium', label: 'Sodium', value: nutrition.sodium, unit: 'mg'},
                            ].filter(r => !isDropped(r.key)).map(r => (
                                <div key={r.key} className="nutri-drow">
                                    <span className="nutri-drow-label">{r.label}</span>
                                    <span
                                        className={'nutri-drow-val' + (nutrition.conf?.[r.key] === 'low' ? ' is-est' : '')}>
                    {typeof r.value === 'number' ? r.value.toFixed(r.unit === 'mg' ? 0 : 1) : r.value}
                                        <span className="nutri-unit">{r.unit}</span>
                  </span>
                                    <ConfMeter level={nutrition.conf?.[r.key] ?? 'med'}/>
                                    {onDropTag && <DropX onClick={() => onDropTag(r.key)}/>}
                                </div>
                            ))}
                        </div>

                        {(nutrition.vitamins || []).length > 0 && (
                            <div className="nutri-vits">
                                <div className="nutri-vits-head">
                                    <span>Vitamins &amp; minerals</span>
                                    <ConfMeter level={nutrition.conf?.vitamins ?? 'med'}/>
                                </div>
                                <div className="nutri-vit-chips">
                                    {(nutrition.vitamins || []).filter(v => !isDropped('vit:' + v.key)).map(v => (
                                        <span key={v.key} className="nutri-vit-chip">
                      <span className="nutri-vit-name">{v.name}</span>
                      <span className="nutri-vit-dv">{Math.round(v.dv)}%</span>
                                            {onDropTag && <DropX onClick={() => onDropTag('vit:' + v.key)}/>}
                    </span>
                                    ))}
                                </div>
                                <div className="nutri-vit-foot">% of daily value · estimated</div>
                            </div>
                        )}

                        <div className="nutri-foot">
                            <Icon name="sparkle" size={11} color="var(--ai)"/>
                            <span>Estimated by Gut Feel AI. Tap <span className="nutri-foot-x">×</span> on any tag that looks wrong.</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
