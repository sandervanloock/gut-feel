export function BottomSheet({ open, onClose, children, title, action, saving = false }) {
  if (!open) return null;
  return (
    <>
      <div className="sheet-backdrop" onClick={saving ? undefined : onClose} />
      <div className="sheet">
        <div className="sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px 8px' }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{ color: saving ? 'var(--faint)' : 'var(--muted)', fontSize: 15, padding: '6px 4px' }}>
            Cancel
          </button>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 18, letterSpacing: '-0.01em' }}>{title}</div>
          {action || <span style={{ width: 50 }} />}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>
          {children}
        </div>
      </div>
    </>
  );
}
