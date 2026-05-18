export function Tag({ children, onRemove }) {
  return (
    <span className={'tag' + (onRemove ? ' removable' : '')}>
      {children}
      {onRemove && (
        <button className="tag-x" onClick={onRemove} aria-label="Remove">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M2 2l4 4M6 2l-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </span>
  );
}
