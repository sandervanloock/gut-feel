import { Icon, SnackIcon } from './Icon.jsx';
import { BlobShape } from './BlobShape.jsx';
import { Tag } from './Tag.jsx';
import { BRISTOL_LABELS, fmtTime } from '../data.js';

export function TimelineRow({ entry, metaphor, onEdit, onIncrementSnack, dragHandlers, dragOver, dragging }) {
  const dotStyle = {
    position: 'absolute', left: 22, width: 13, height: 13, borderRadius: 999,
    background: 'var(--bg)', border: '1.5px solid var(--ink)', top: 18,
  };
  const isDragging = dragging === entry.id;
  const showDropTop = dragOver && dragOver.id === entry.id && dragOver.pos === 'above';
  const showDropBot = dragOver && dragOver.id === entry.id && dragOver.pos === 'below';
  const baseStyle = {
    position: 'relative', paddingLeft: 56, paddingRight: 4,
    paddingTop: 10, paddingBottom: 10,
    opacity: isDragging ? 0.35 : 1,
    transition: 'opacity 0.12s',
  };
  const dropLine = (top) => (
    <div style={{
      position: 'absolute', left: 56, right: 4,
      [top ? 'top' : 'bottom']: 2,
      height: 2, borderRadius: 2, background: 'var(--sage)',
      boxShadow: '0 0 0 3px var(--sage-soft)',
      pointerEvents: 'none',
    }} />
  );
  const rowDnd = dragHandlers ? {
    onDragOver: (e) => dragHandlers.onDragOver(e, entry),
    onDragLeave: dragHandlers.onDragLeave,
    onDrop: (e) => dragHandlers.onDrop(e, entry),
  } : {};

  if (entry.type === 'meal') {
    const mealLabel = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', other: 'Meal' };
    return (
      <div style={baseStyle} {...rowDnd}>
        {showDropTop && dropLine(true)}
        {showDropBot && dropLine(false)}
        <div style={{ ...dotStyle, background: 'var(--sage)', borderColor: 'var(--sage)' }} />
        <button onClick={onEdit} style={{ width: '100%', textAlign: 'left', display: 'block' }}>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div className="eyebrow">{mealLabel[entry.mealType] || 'Meal'} · {fmtTime(entry.time)}</div>
              <Icon name="edit" size={14} color="var(--faint)" />
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 19, letterSpacing: '-0.01em', marginBottom: 8 }}>{entry.name}</div>
            {entry.photoUrl && (
              <img src={entry.photoUrl} alt="meal"
                style={{ display: 'block', width: '100%', height: 120, objectFit: 'cover', borderRadius: 10, marginBottom: 8 }} />
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {(entry.ingredients || []).map((s, i) => <Tag key={i}>{s}</Tag>)}
            </div>
            {entry.notes && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '0.5px solid var(--line-2)', display: 'flex', gap: 6, fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>
                <Icon name="note" size={12} color="var(--faint)" />
                <span style={{ flex: 1 }}>{entry.notes}</span>
              </div>
            )}
          </div>
        </button>
      </div>
    );
  }

  if (entry.type === 'snack') {
    return (
      <div style={baseStyle}
        draggable={!!dragHandlers}
        onDragStart={dragHandlers ? (e) => dragHandlers.onDragStart(e, entry) : undefined}
        onDragEnd={dragHandlers ? dragHandlers.onDragEnd : undefined}
        {...rowDnd}>
        {showDropTop && dropLine(true)}
        {showDropBot && dropLine(false)}
        <div style={{ ...dotStyle, background: 'var(--bg)', borderColor: 'var(--line)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', cursor: dragHandlers ? 'grab' : 'default' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
            style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: 0, textAlign: 'left', minWidth: 0 }}>
            <SnackIcon id={entry.item.toLowerCase()} size={16} />
            <div style={{ flex: 1, fontSize: 14, color: 'var(--ink-2)', minWidth: 0 }}>
              {entry.item} {entry.count > 1 && <span style={{ color: 'var(--muted)' }}>×{entry.count}</span>}
              {entry.notes && (
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.notes}</div>
              )}
            </div>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onIncrementSnack?.(); }}
            aria-label={'Add another ' + entry.item}
            style={{
              width: 28, height: 28, borderRadius: 999,
              background: 'var(--surface-2)', color: 'var(--ink-2)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <Icon name="plus" size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
            aria-label={'Edit ' + entry.item}
            style={{
              width: 28, height: 28, borderRadius: 999,
              background: 'transparent', color: 'var(--muted)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <Icon name="edit" size={15} />
          </button>
        </div>
      </div>
    );
  }

  if (entry.type === 'bowel') {
    const label = BRISTOL_LABELS[entry.bristol - 1];
    return (
      <div style={baseStyle} {...rowDnd}>
        {showDropTop && dropLine(true)}
        {showDropBot && dropLine(false)}
        <div style={{ ...dotStyle, background: `var(--b${entry.bristol})`, borderColor: `var(--b${entry.bristol})` }} />
        <button onClick={onEdit} style={{ width: '100%', textAlign: 'left', display: 'block' }}>
          <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <BlobShape n={entry.bristol} size={44} metaphor={metaphor} />
            <div style={{ flex: 1 }}>
              <div className="eyebrow" style={{ marginBottom: 2 }}>Output · {fmtTime(entry.time)}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 17 }}>Type {entry.bristol} — {label.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, fontFamily: 'var(--mono)' }}>
                urgency {entry.urgency}/5 · effort {entry.effort}/5
              </div>
            </div>
            <Icon name="edit" size={14} color="var(--faint)" />
          </div>
        </button>
      </div>
    );
  }

  return null;
}
