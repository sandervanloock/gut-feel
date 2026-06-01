import {useState} from 'react';
import {Icon} from './Icon.jsx';

export function FollowupPrompt({followup, onAnswer, onSkip}) {
    const [selected, setSelected] = useState(null);
    const [typed, setTyped] = useState('');

    if (!followup) return null;

    const handleChip = (value) => {
        if (selected) return;
        setSelected(value);
        onAnswer(value);
    };

    const handleText = () => {
        const v = typed.trim();
        if (selected || !v) return;
        setSelected(v);
        onAnswer(v);
        setTyped('');
    };

    return (
        <div className="followup">
            <div className="followup-head">
                <span className="followup-spark"><Icon name="sparkle" size={13} color="currentColor"/></span>
                <div style={{flex: 1, minWidth: 0}}>
                    <div className="followup-q">{followup.prompt}</div>
                    {followup.hint && <div className="followup-hint">{followup.hint}</div>}
                </div>
                {onSkip && !selected && (
                    <button className="followup-skip" onClick={onSkip}>Skip</button>
                )}
            </div>
            {followup.kind === 'chips' && followup.options && (
                <div className="followup-chips">
                    {followup.options.map(o => {
                        const isSelected = selected === o.value;
                        const isDisabled = selected !== null && !isSelected;
                        return (
                            <button
                                key={o.value}
                                className={'followup-chip' + (isSelected ? ' followup-chip--selected' : '')}
                                onClick={() => handleChip(o.value)}
                                disabled={isDisabled}
                                style={{opacity: isDisabled ? 0.35 : 1}}
                            >
                                {isSelected &&
                                    <Icon name="check" size={12} color="currentColor" style={{marginRight: 4}}/>}
                                {o.label}
                            </button>
                        );
                    })}
                </div>
            )}
            {followup.kind === 'text' && (
                <div className="followup-text">
                    <input
                        className="input"
                        autoFocus
                        placeholder={followup.placeholder || 'Type a quick answer…'}
                        value={typed}
                        onChange={e => setTyped(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleText()}
                        disabled={!!selected}
                    />
                    <button className="followup-send" onClick={handleText} disabled={!!selected || !typed.trim()}>
                        <Icon name="check" size={15} color="currentColor"/>
                    </button>
                </div>
            )}
        </div>
    );
}
