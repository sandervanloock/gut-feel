export function ScalePicker({ value, max = 5, onChange, labels }) {
  return (
    <div>
      <div className="stepper">
        {Array.from({ length: max }, (_, i) => i + 1).map(n => (
          <button key={n}
            className={'stepper-btn' + (value === n ? ' active' : '')}
            onClick={() => onChange(n)}>{n}</button>
        ))}
      </div>
      {labels && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
          <span>{labels[0]}</span>
          <span>{labels[1]}</span>
        </div>
      )}
    </div>
  );
}
