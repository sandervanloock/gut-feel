import { useState, useMemo } from 'react';
import { Tag } from './Tag.jsx';
import { COMMON_INGREDIENTS } from '../data.js';

export function IngredientInput({ ingredients, onChange, history = [] }) {
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);

  const lowerCurrent = ingredients.map(s => s.toLowerCase());

  const matches = useMemo(() => {
    if (!focused) return [];
    const q = draft.trim().toLowerCase();
    const pool = [...new Set([...history, ...COMMON_INGREDIENTS])];
    return pool
      .filter(s => !lowerCurrent.includes(s.toLowerCase()))
      .filter(s => q ? s.toLowerCase().includes(q) : true)
      .slice(0, q ? 8 : 6);
  }, [draft, focused, ingredients, history]);

  const add = (s) => {
    const v = s.trim().toLowerCase();
    if (!v || lowerCurrent.includes(v)) { setDraft(''); return; }
    onChange([...ingredients, v]);
    setDraft('');
  };

  const remove = (i) => onChange(ingredients.filter((_, k) => k !== i));

  return (
    <div>
      {ingredients.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ingredients.map((s, i) => (
              <Tag key={i} onRemove={() => remove(i)}>{s}</Tag>
            ))}
          </div>
          <button
            onClick={() => onChange([])}
            style={{
              flexShrink: 0, padding: '4px 8px', borderRadius: 999,
              fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: 'var(--muted)',
              background: 'var(--surface-2)',
            }}
            aria-label="Remove all ingredients">
            Clear all
          </button>
        </div>
      )}
      <input
        className="input"
        placeholder="Add ingredient…"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); add(draft); }
          if (e.key === 'Backspace' && !draft && ingredients.length) {
            onChange(ingredients.slice(0, -1));
          }
        }}
      />
      {focused && matches.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {matches.map(m => (
            <button key={m} className="tag"
              onMouseDown={(e) => { e.preventDefault(); add(m); }}
              style={{ cursor: 'pointer', background: 'var(--sage-soft)', color: 'var(--sage)' }}>
              + {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
