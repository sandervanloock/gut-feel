import { useState, useEffect } from 'react';
import { BottomSheet } from '../components/BottomSheet.jsx';
import { BristolPicker } from '../components/BristolPicker.jsx';
import { ScalePicker } from '../components/ScalePicker.jsx';
import { Icon } from '../components/Icon.jsx';

export function LogGutSheet({ open, initial, onClose, onSave, onDelete, metaphor }) {
  const [bristol, setBristol] = useState(4);
  const [urgency, setUrgency] = useState(2);
  const [effort, setEffort] = useState(2);
  const [time, setTime] = useState('12:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      if (initial) {
        setBristol(initial.bristol);
        setUrgency(initial.urgency);
        setEffort(initial.effort);
        setTime(initial.time);
      } else {
        setBristol(4); setUrgency(2); setEffort(2);
        const now = new Date();
        setTime(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`);
      }
      setSaving(false);
      setError(null);
    }
  }, [open, initial]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave({ bristol, urgency, effort, time });
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
    <BottomSheet open={open} onClose={onClose} title={initial ? 'Edit entry' : 'Log gut'} action={action} saving={saving}>
      {error && <div className="save-error">{error}</div>}

      <div style={{ marginBottom: 18 }}>
        <div className="label" style={{ marginBottom: 8 }}>How did it feel? <span style={{ color: 'var(--faint)' }}>· shape</span></div>
        <BristolPicker value={bristol} onChange={saving ? undefined : setBristol} metaphor={metaphor} />
      </div>
      <div style={{ marginBottom: 18 }}>
        <div className="label" style={{ marginBottom: 8 }}>Urgency</div>
        <ScalePicker value={urgency} max={5} onChange={saving ? undefined : setUrgency} labels={['relaxed', 'urgent']} />
      </div>
      <div style={{ marginBottom: 18 }}>
        <div className="label" style={{ marginBottom: 8 }}>Effort</div>
        <ScalePicker value={effort} max={5} onChange={saving ? undefined : setEffort} labels={['effortless', 'strain']} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <div className="label" style={{ marginBottom: 6 }}>Time</div>
        <input type="time" className="input" value={time} onChange={e => setTime(e.target.value)}
          disabled={saving} style={{ fontFamily: 'var(--mono)', fontSize: 15 }} />
      </div>

      {initial && (
        <button
          onClick={handleDelete}
          disabled={saving}
          style={{ marginTop: 12, padding: 12, color: saving ? 'var(--faint)' : 'var(--terracotta)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', fontSize: 14 }}>
          <Icon name="trash" size={16} /> Delete this entry
        </button>
      )}
      <div style={{ height: 16 }} />
    </BottomSheet>
  );
}
