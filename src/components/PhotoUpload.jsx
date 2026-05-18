import { useRef, useState } from 'react';
import { Icon } from './Icon.jsx';

const MAX_BYTES = 10 * 1024 * 1024;

function validate(file) {
  if (!file.type.startsWith('image/')) return 'Only image files are supported.';
  if (file.size > MAX_BYTES) return `File too large — max 10 MB (this file is ${(file.size / 1024 / 1024).toFixed(1)} MB).`;
  return null;
}

export function PhotoUpload({ value, onChange }) {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);

  const handleFile = (file) => {
    if (!file) return;
    const err = validate(file);
    if (err) {
      setError(err);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setError(null);
    onChange(file);
  };

  const onInput = (e) => handleFile(e.target.files?.[0]);
  const onDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };

  const remove = (e) => {
    e.stopPropagation();
    setError(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (!value) {
    return (
      <div>
        <div
          className="photo-placeholder"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          style={{ height: 120, cursor: 'pointer', borderColor: error ? 'var(--terracotta)' : undefined }}
        >
          <input ref={inputRef} type="file" accept="image/*" capture="environment"
            onChange={onInput} style={{ display: 'none' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Icon name="camera" size={22} color={error ? 'var(--terracotta)' : 'var(--muted)'} />
            <span>TAP TO ADD PHOTO</span>
            {!error && <span style={{ fontSize: 9, color: 'var(--faint)' }}>max 10 MB</span>}
          </div>
        </div>
        {error && <div className="field-error">{error}</div>}
      </div>
    );
  }

  const src = typeof value === 'string' ? value : URL.createObjectURL(value);

  return (
    <div style={{ position: 'relative' }}>
      <input ref={inputRef} type="file" accept="image/*" capture="environment"
        onChange={onInput} style={{ display: 'none' }} />
      <div style={{
        position: 'relative', borderRadius: 16, overflow: 'hidden',
        border: '0.5px solid var(--line-2)', background: 'var(--surface)',
      }}>
        <img src={src} alt="meal"
          style={{ display: 'block', width: '100%', height: 200, objectFit: 'cover' }} />
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
          <button
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            style={{
              padding: '6px 10px', borderRadius: 999,
              background: 'rgba(255,255,255,0.92)', color: 'var(--ink)',
              fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.04em', textTransform: 'uppercase',
              backdropFilter: 'blur(6px)',
            }}>Replace</button>
          <button onClick={remove}
            style={{
              width: 28, height: 28, borderRadius: 999,
              background: 'rgba(0,0,0,0.55)', color: 'white',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(6px)',
            }}>
            <Icon name="x" size={14} />
          </button>
        </div>
      </div>
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}
