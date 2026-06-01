import {useState} from 'react';
import {Icon} from './Icon.jsx';

export function FollowupPrompt({followup, onAnswer}) {
    const [typed, setTyped] = useState('');

    if (!followup) return null;

    const handleChip = (value) => onAnswer(followup.id, value);
    const handleText = () => {
        if (typed.trim()) {
            onAnswer(followup.id, typed.trim());
            setTyped('');
        }
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
                    {followup.options.map(o => (
                        <button key={o.value} className="chip" onClick={() => handleChip(o.value)}>
                            {o.label}
                        </button>
                    ))}
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
                        style={{fontSize: 14, padding: '10px 12px'}}
                    />
                    <button className="chip chip--sage" onClick={handleText} disabled={!typed.trim()}>
                        <Icon name="check" size={14}/>
                    </button>
                </div>
            )}
        </div>
    );
}
