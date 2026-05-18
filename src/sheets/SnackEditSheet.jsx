import { useState, useEffect } from 'react';
import { BottomSheet } from '../components/BottomSheet.jsx';
import { Icon, SnackIcon } from '../components/Icon.jsx';
import { fmtTime } from '../data.js';

export function SnackEditSheet({ open, initial, onClose, onSave, onDelete, onMerge, mergeCandidates }) {
  const [count, setCount] = useState(1);
  const [time, setTime] = useState('12:00');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && initial) {
      setCount(initial.count);
      setTime(initial.time);
      setNotes(initial.notes || '');
      setSaving(false);
      setError(null);
    }
  }, [open, initial]);

  if (!initial) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave({ count, time, notes });
    } catch (e) {
      setError('Failed to save. Please try again.');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setError(null);
    try {
      await onDelete(initial.id);
    } catch (e) {
      setError('Failed to delete. Please try again.');
      setSaving(false);
    }
  };

  const handleMerge = async (targetId) => {
    setSaving(true);
    setError(null);
    try {
      await onMerge(targetId);
    } catch (e) {
      setError('Failed to merge. Please try again.');
      setSaving(false);
    }
  };

  const action = (
    <button
      onClick={handleSave}
      disabled={saving}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        color: saving ? 'var(--faint)' : 'var(--sage)',
        fontWeight: 500, fontSize: 15, padding: '6px 4px',
      }}>
      {saving ? <Icon name="spinner" size={16} color="var(--sage)" /> : null}
      Save
    </button>
  );

  return (
    <BottomSheet open={open} onClose={onClose} title={'Edit ' + initial.item} action={action} saving={saving}>
      {error && <div className="save-error">{error}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 0 16px' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 999,
          background: 'var(--surface-2)', border: '0.5px solid var(--line-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <SnackIcon id={initial.item.toLowerCase()} size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, letterSpacing: '-0.01em' }}>{initial.item}</div>
          <div className="eyebrow" style={{ marginTop: 2 }}>Quick edit</div>
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div className="label" style={{ marginBottom: 8 }}>Amount</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--surface)', border: '0.5px solid var(--line-2)', borderRadius: 16 }}>
          <button
            onClick={() => setCount(c => Math.max(1, c - 1))}
            disabled={count <= 1 || saving}
            aria-label="Decrease"
            style={{
              width: 44, height: 44, borderRadius: 999,
              background: count <= 1 ? 'var(--surface-2)' : 'var(--bg-2)',
              color: count <= 1 ? 'var(--faint)' : 'var(--ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <svg width="14" height="14" viewBox="0 0 14 14"><line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 40, lineHeight: 1, letterSpacing: '-0.02em' }}>{count}</div>
            <div className="eyebrow" style={{ marginTop: 4 }}>{count === 1 ? initial.item.toLowerCase() : initial.item.toLowerCase() + 's'}</div>
          </div>
          <button
            onClick={() => setCount(c => c + 1)}
            disabled={saving}
            aria-label="Increase"
            style={{
              width: 44, height: 44, borderRadius: 999,
              background: saving ? 'var(--surface-2)' : 'var(--sage)', color: saving ? 'var(--faint)' : 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <Icon name="plus" size={18} color="currentColor" />
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div className="label" style={{ marginBottom: 6 }}>Time</div>
        <input type="time" className="input" value={time} onChange={e => setTime(e.target.value)}
          disabled={saving} style={{ fontFamily: 'var(--mono)', fontSize: 15 }} />
      </div>

      <div style={{ marginBottom: 18 }}>
        <div className="label" style={{ marginBottom: 6 }}>Notes <span style={{ color: 'var(--faint)' }}>· optional</span></div>
        <textarea className="input"
          placeholder="e.g. with milk, after lunch, in a hurry…"
          value={notes} onChange={e => setNotes(e.target.value)}
          disabled={saving}
          rows={2} style={{ resize: 'vertical', minHeight: 56, fontFamily: 'inherit', lineHeight: 1.4 }}
        />
      </div>

      {mergeCandidates && mergeCandidates.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div className="label" style={{ marginBottom: 8 }}>Merge duplicates</div>
          <div style={{ background: 'var(--surface)', border: '0.5px solid var(--line-2)', borderRadius: 14, overflow: 'hidden' }}>
            {mergeCandidates.map(c => (
              <button key={c.id}
                onClick={() => handleMerge(c.id)}
                disabled={saving}
                style={{ width: '100%', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '0.5px solid var(--line-2)', textAlign: 'left' }}>
                <SnackIcon id={c.item.toLowerCase()} size={16} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14 }}>{c.item} <span style={{ color: 'var(--muted)' }}>×{c.count}</span></div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>at {fmtTime(c.time)}</div>
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--sage)', letterSpacing: '0.04em' }}>MERGE →</span>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, lineHeight: 1.4 }}>
            Combines counts and keeps this entry's time.
          </div>
        </div>
      )}

      <button
        onClick={handleDelete}
        disabled={saving}
        style={{ marginTop: 4, padding: 14, color: saving ? 'var(--faint)' : 'var(--terracotta)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', fontSize: 14, background: 'var(--terracotta-soft)', borderRadius: 14 }}>
        <Icon name="trash" size={16} /> Delete this entry
      </button>
      <div style={{ height: 16 }} />
    </BottomSheet>
  );
}
