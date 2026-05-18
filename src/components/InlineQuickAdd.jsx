import { useState, useEffect } from 'react';
import { Icon, SnackIcon } from './Icon.jsx';
import { QUICK_SNACKS } from '../data.js';

export function InlineQuickAdd({ open, onToggle, onPick, snackCounts }) {
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherText, setOtherText] = useState('');

  useEffect(() => {
    if (!open) { setOtherOpen(false); setOtherText(''); }
  }, [open]);

  const submitOther = () => {
    const v = otherText.trim();
    if (!v) return;
    onPick({ id: 'other:' + v.toLowerCase(), label: v, icon: 'other', custom: true });
    setOtherOpen(false);
    setOtherText('');
  };

  return (
    <div style={{ position: 'relative', paddingLeft: 22, paddingRight: 4, paddingTop: 2, paddingBottom: 2 }}>
      {!open ? (
        <button onClick={onToggle} className="inline-add-btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
          <span className="inline-add-plus">+</span>
          <span className="inline-add-label">add snack</span>
        </button>
      ) : (
        <div className="fade-in" style={{
          padding: '10px 10px 8px',
          background: 'var(--surface)', border: '0.5px solid var(--line-2)',
          borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="eyebrow">Quick add</div>
            <button onClick={onToggle} style={{ color: 'var(--muted)', padding: 4 }}>
              <Icon name="x" size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {QUICK_SNACKS.map(s => (
              <button key={s.id} onClick={() => onPick(s)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 12px', borderRadius: 999,
                  background: 'var(--bg)', border: '0.5px solid var(--line-2)',
                  fontSize: 13, color: 'var(--ink)',
                }}>
                <SnackIcon id={s.id} size={14} />
                <span>{s.label}</span>
                {snackCounts[s.id] > 0 && (
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>·{snackCounts[s.id]}</span>
                )}
              </button>
            ))}
            <button onClick={() => setOtherOpen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 12px', borderRadius: 999,
                background: 'var(--bg)', border: '0.5px dashed var(--line-2)',
                fontSize: 13, color: 'var(--muted)',
              }}>
              <SnackIcon id="other" size={14} />
              <span>Other…</span>
            </button>
          </div>
          {otherOpen && (
            <div className="fade-in" style={{ display: 'flex', gap: 6, marginTop: 2 }}>
              <input className="input" autoFocus
                placeholder="e.g. apple, smoothie, cookie…"
                value={otherText}
                onChange={e => setOtherText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') submitOther();
                  if (e.key === 'Escape') { setOtherOpen(false); setOtherText(''); }
                }}
                style={{ flex: 1, padding: '10px 12px', fontSize: 14 }}
              />
              <button onClick={submitOther}
                disabled={!otherText.trim()}
                style={{
                  padding: '0 14px', borderRadius: 12,
                  background: otherText.trim() ? 'var(--sage)' : 'var(--surface-2)',
                  color: otherText.trim() ? 'white' : 'var(--faint)',
                  fontSize: 13, fontWeight: 500,
                }}>Add</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
