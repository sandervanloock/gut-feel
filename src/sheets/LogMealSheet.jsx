import {useEffect, useState} from 'react';
import {BottomSheet} from '../components/BottomSheet.jsx';
import {PhotoUpload} from '../components/PhotoUpload.jsx';
import {IngredientInput} from '../components/IngredientInput.jsx';
import {Icon} from '../components/Icon.jsx';
import {NutritionPanel} from '../components/NutritionPanel.jsx';

function defaultTimeForMeal(type) {
  const h = new Date().getHours();
  switch (type) {
    case 'breakfast': return '09:00';
    case 'lunch':     return '12:00';
    case 'dinner':    return '17:00';
    default:          return `${String(h).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}`;
  }
}

export function LogMealSheet({
                                 open,
                                 initial,
                                 liveAnalysis,
                                 onClose,
                                 onSave,
                                 onDelete,
                                 ingredientHistory,
                                 recentMeals,
                                 onAnswerFollowup,
                                 onDropTag,
                                 onRestoreTags
                             }) {
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [time, setTime] = useState('12:00');
  const [mealType, setMealType] = useState('lunch');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);
  const [showSugg, setShowSugg] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      if (initial) {
        setName(initial.name);
        setIngredients(initial.ingredients || []);
        setTime(initial.time);
        setMealType(initial.mealType);
        setNotes(initial.notes || '');
        setPhoto(initial.photoUrl || null);
      } else {
        setName('');
        setIngredients([]);
        setNotes('');
        setPhoto(null);
        const h = new Date().getHours();
        const guess = h < 11 ? 'breakfast' : h < 15 ? 'lunch' : h < 21 ? 'dinner' : 'other';
        setMealType(guess);
        setTime(defaultTimeForMeal(guess));
      }
      setShowSugg(true);
      setSaving(false);
      setError(null);
      setTouched(false);
    }
  }, [open, initial]);

  const nameValid = name.trim().length > 0;

  const handleSave = async () => {
    setTouched(true);
    if (!nameValid) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({ name, ingredients, time, mealType, notes, photo });
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
        color: saving ? 'var(--faint)' : nameValid ? 'var(--sage)' : 'var(--faint)',
        fontWeight: 500, fontSize: 15, padding: '6px 4px',
      }}>
      {saving ? <Icon name="spinner" size={16} color="var(--sage)" /> : null}
      Save
    </button>
  );

  return (
    <BottomSheet open={open} onClose={onClose} title={initial ? 'Edit meal' : 'Log meal'} action={action} saving={saving}>
      {error && <div className="save-error">{error}</div>}

      {/* Meal type */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, padding: 3, background: 'var(--surface-2)', borderRadius: 12 }}>
        {[
          { id: 'breakfast', label: 'Breakfast' },
          { id: 'lunch',     label: 'Lunch' },
          { id: 'dinner',    label: 'Dinner' },
          { id: 'other',     label: 'Other' },
        ].map(o => (
          <button key={o.id}
            disabled={saving}
            onClick={() => { setMealType(o.id); if (!initial) setTime(defaultTimeForMeal(o.id)); }}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: 9, fontSize: 13,
              background: mealType === o.id ? 'var(--surface)' : 'transparent',
              color: mealType === o.id ? 'var(--ink)' : 'var(--muted)',
              boxShadow: mealType === o.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s',
            }}>{o.label}</button>
        ))}
      </div>

      {/* Photo */}
      <PhotoUpload value={photo} onChange={saving ? undefined : setPhoto} />
      <div style={{ height: 14 }} />

      {/* Recent meals */}
      {showSugg && !initial && recentMeals.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Recent meals</div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginLeft: -20, paddingLeft: 20, marginRight: -20, paddingRight: 20 }}>
            {recentMeals.slice(0, 6).map((m, i) => (
              <button key={i}
                disabled={saving}
                onClick={() => { setName(m.name); setIngredients(m.ingredients || []); setShowSugg(false); }}
                style={{ flexShrink: 0, padding: '10px 12px', background: 'var(--surface)', border: '0.5px solid var(--line-2)', borderRadius: 12, textAlign: 'left', minWidth: 140 }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 14, marginBottom: 2 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>×{m.count}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Name */}
      <div style={{ marginBottom: 14 }}>
        <div className="label" style={{ marginBottom: 6 }}>What did you eat?</div>
        <input
          className="input"
          placeholder="e.g. Avocado toast"
          value={name}
          onChange={e => { setName(e.target.value); setTouched(false); }}
          disabled={saving}
          autoFocus
          style={touched && !nameValid ? { borderColor: 'var(--terracotta)' } : undefined}
        />
        {touched && !nameValid && <div className="field-error">Name is required</div>}
      </div>

      {/* Ingredients */}
      <div style={{ marginBottom: 14 }}>
        <div className="label" style={{ marginBottom: 6 }}>Ingredients <span style={{ color: 'var(--faint)' }}>· tagged for later analysis</span></div>
        <IngredientInput ingredients={ingredients} onChange={saving ? undefined : setIngredients} history={ingredientHistory} />
      </div>

      {/* Time */}
      <div style={{ marginBottom: 14 }}>
        <div className="label" style={{ marginBottom: 6 }}>Time</div>
        <input type="time" className="input" value={time} onChange={e => setTime(e.target.value)}
          disabled={saving} style={{ fontFamily: 'var(--mono)', fontSize: 15 }} />
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 14 }}>
        <div className="label" style={{ marginBottom: 6 }}>Notes <span style={{ color: 'var(--faint)' }}>· optional</span></div>
        <textarea className="input"
          placeholder="How did it taste? Where? Anything unusual?"
          value={notes} onChange={e => setNotes(e.target.value)}
          disabled={saving}
          rows={3} style={{ resize: 'vertical', minHeight: 64, fontFamily: 'inherit', lineHeight: 1.4 }}
        />
      </div>

        {liveAnalysis && (
            <div style={{marginBottom: 14}}>
                <NutritionPanel
                    analysis={liveAnalysis}
                    onAnswerFollowup={onAnswerFollowup}
                    onDropTag={onDropTag}
                    onRestoreTags={onRestoreTags}
                />
            </div>
        )}

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
