import {useState} from 'react';
import {Icon} from './Icon.jsx';

export function FollowupPrompt({followup, onAnswer}) {
    const [selected, setSelected] = useState(null);
    const [typed, setTyped] = useState('');

    if (!followup) return null;

    const handleChip = (value) => {
        if (selected) return;
        setSelected(value);
        onAnswer(followup.id, value);
    };

    const handleText = () => {
        if (selected || !typed.trim()) return;
        setSelected(typed.trim());
        onAnswer(followup.id, typed.trim());
        setTyped('');
    };

    return (
        <div className="followup-card">
            <div className="followup-header">
                <Icon name="sparkle" size={14} color="var(--sage)"/>
                <span className="followup-prompt">{followup.prompt}</span>
            </div>
            <div className="followup-hint">{followup.hint}</div>
            {followup.kind === 'chips' && followup.options && (
                <div className="followup-chips">
                    {followup.options.map(o => {
                        const isSelected = selected === o.value;
                        const isDisabled = selected !== null && !isSelected;
                        return (
                            <button
                                key={o.value}
                                className={`chip${isSelected ? ' chip--selected' : ''}`}
                                onClick={() => handleChip(o.value)}
                                disabled={isDisabled}
                                style={{opacity: isDisabled ? 0.35 : 1}}
                            >
                                {isSelected && <Icon name="check" size={12} color="var(--sage)"/>}
                                {o.label}
                            </button>
                        );
                    })}
                </div>
            )}
            {followup.kind === 'text' && (
                <div className="followup-text-row">
                    <input
                        className="input"
                        placeholder={followup.placeholder || 'Type your answer…'}
                        value={typed}
                        onChange={e => setTyped(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleText()}
                        disabled={!!selected}
                        style={{fontSize: 14, padding: '10px 12px'}}
                    />
                    <button
                        className="chip chip--sage"
                        onClick={handleText}
                        disabled={!!selected || !typed.trim()}
                    >
                        {selected ? <Icon name="check" size={14}/> : <Icon name="check" size={14}/>}
                    </button>
                </div>
            )}
            {selected && (
                <div style={{marginTop: 8, fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)'}}>
                    <Icon name="spinner" size={11} color="var(--muted)"/> Updating estimate…
                </div>
            )}
        </div>
    );
}
