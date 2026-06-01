import {useEffect, useMemo, useState} from 'react';
import {Icon, SnackIcon} from './Icon.jsx';
import {QUICK_SNACKS} from '../data.js';

const QUICK_SNACK_MAP = Object.fromEntries(QUICK_SNACKS.map(s => [s.id, s]));

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export function InlineQuickAdd({open, onToggle, onPick, snackCounts, history = []}) {
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherText, setOtherText] = useState('');

  useEffect(() => {
    if (!open) { setOtherOpen(false); setOtherText(''); }
  }, [open]);

    const suggestions = useMemo(() => {
        if (history.length === 0) return QUICK_SNACKS;
        const seen = new Set();
        const result = [];
        for (const item of history) {
            const key = item.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            result.push(QUICK_SNACK_MAP[key] || {id: key, label: capitalize(item), icon: 'other'});
            if (result.length >= 6) break;
        }
        for (const s of QUICK_SNACKS) {
            if (result.length >= 6) break;
            if (!seen.has(s.id)) result.push(s);
        }
        return result;
    }, [history]);

    const otherMatches = useMemo(() => {
        const q = otherText.trim().toLowerCase();
        if (!q) return [];
        return history
            .filter(item => item.toLowerCase().includes(q))
            .slice(0, 6);
    }, [otherText, history]);

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
              {suggestions.map(s => (
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
              <div className="fade-in" style={{display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2}}>
                  <div style={{display: 'flex', gap: 6}}>
                      <input className="input" autoFocus
                             placeholder="e.g. apple, smoothie, cookie…"
                             value={otherText}
                             onChange={e => setOtherText(e.target.value)}
                             onKeyDown={e => {
                                 if (e.key === 'Enter') submitOther();
                                 if (e.key === 'Escape') {
                                     setOtherOpen(false);
                                     setOtherText('');
                                 }
                             }}
                             style={{flex: 1, padding: '10px 12px', fontSize: 14}}
                      />
                      <button onClick={submitOther}
                              disabled={!otherText.trim()}
                              style={{
                                  padding: '0 14px', borderRadius: 12,
                                  background: otherText.trim() ? 'var(--sage)' : 'var(--surface-2)',
                                  color: otherText.trim() ? 'white' : 'var(--faint)',
                                  fontSize: 13, fontWeight: 500,
                              }}>Add
                      </button>
                  </div>
                  {otherMatches.length > 0 && (
                      <div style={{display: 'flex', flexWrap: 'wrap', gap: 6}}>
                          {otherMatches.map(item => (
                              <button key={item} className="tag"
                                      onMouseDown={e => {
                                          e.preventDefault();
                                          onPick({
                                              id: 'other:' + item.toLowerCase(),
                                              label: capitalize(item),
                                              icon: 'other',
                                              custom: true
                                          });
                                          setOtherOpen(false);
                                          setOtherText('');
                                      }}
                                      style={{cursor: 'pointer', background: 'var(--sage-soft)', color: 'var(--sage)'}}>
                                  + {capitalize(item)}
                              </button>
                          ))}
                      </div>
                  )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
