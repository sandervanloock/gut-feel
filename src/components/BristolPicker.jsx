import { BlobShape } from './BlobShape.jsx';
import { BRISTOL_LABELS } from '../data.js';

export function BristolPicker({ value, onChange, metaphor = 'blob' }) {
  return (
    <div>
      <div className="blob-grid">
        {BRISTOL_LABELS.map(b => (
          <button key={b.n}
            className={'blob-cell' + (value === b.n ? ' selected' : '')}
            onClick={() => onChange(b.n)}>
            <BlobShape n={b.n} size={38} metaphor={metaphor} />
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
        <span>1 · firm</span>
        <span>4 · ideal</span>
        <span>7 · loose</span>
      </div>
      {value && (
        <div className="fade-in" style={{ marginTop: 12, padding: '12px 16px', background: 'var(--surface)', borderRadius: 14, border: '0.5px solid var(--line-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <BlobShape n={value} size={36} metaphor={metaphor} />
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>Type {value} — {BRISTOL_LABELS[value - 1].name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{BRISTOL_LABELS[value - 1].hint}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
