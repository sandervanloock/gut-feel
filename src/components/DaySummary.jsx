import { BlobShape } from './BlobShape.jsx';

function gutSummary(meals, bowels, avg) {
  if (meals === 0 && bowels === 0) return 'A blank day. Log your first bite below.';
  if (avg === null) return `${meals} ${meals === 1 ? 'meal' : 'meals'} logged. No output yet.`;
  if (avg >= 3.5 && avg <= 4.5) return 'Smooth sailing — output looking ideal.';
  if (avg < 3.5) return 'Things are running a touch firm.';
  return 'Things are running a touch loose.';
}

export function DaySummary({ entries, metaphor }) {
  const meals = entries.filter(e => e.type === 'meal').length;
  const bowel = entries.filter(e => e.type === 'bowel');
  const avgBristol = bowel.length ? (bowel.reduce((s, e) => s + e.bristol, 0) / bowel.length) : null;

  return (
    <div style={{ padding: '14px 20px 24px' }}>
      <div className="card today-summary-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Today's gut</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 20, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
            {gutSummary(meals, bowel.length, avgBristol)}
          </div>
        </div>
        {avgBristol && (
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <BlobShape n={Math.round(avgBristol)} size={48} metaphor={metaphor} />
            <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 2, letterSpacing: '0.04em' }}>
              AVG · {avgBristol.toFixed(1)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
