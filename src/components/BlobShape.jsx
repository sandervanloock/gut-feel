export function BlobShape({ n = 4, size = 56, metaphor = 'blob', muted = false }) {
  if (metaphor === 'weather') return <WeatherShape n={n} size={size} muted={muted} />;
  if (metaphor === 'food') return <FoodShape n={n} size={size} muted={muted} />;
  return <BlobBlob n={n} size={size} muted={muted} />;
}

function BlobBlob({ n, size, muted }) {
  const fill = muted ? 'var(--ink-2)' : `var(--b${n})`;
  const opacity = muted ? 0.55 : 1;
  const common = { width: size, height: size, viewBox: '0 0 64 64' };
  switch (n) {
    case 1: return (
      <svg {...common}><g fill={fill} opacity={opacity}>
        <circle cx="22" cy="24" r="6"/><circle cx="38" cy="22" r="5.5"/>
        <circle cx="32" cy="36" r="6.5"/><circle cx="44" cy="38" r="5"/><circle cx="20" cy="42" r="5.5"/>
      </g></svg>);
    case 2: return (
      <svg {...common}><path d="M14 32 C 14 24, 22 18, 32 19 C 38 16, 48 22, 50 30 C 54 36, 48 44, 40 46 C 32 50, 22 48, 16 42 C 12 38, 13 35, 14 32 Z" fill={fill} opacity={opacity}/></svg>);
    case 3: return (
      <svg {...common}>
        <path d="M12 32 C 12 23, 22 20, 32 20 C 44 20, 52 24, 52 32 C 52 40, 44 44, 32 44 C 22 44, 12 41, 12 32 Z" fill={fill} opacity={opacity}/>
        <path d="M24 26 L 22 32 M 36 24 L 38 30 M 30 36 L 28 42 M 44 34 L 46 40" stroke="var(--bg)" strokeWidth="1.4" strokeLinecap="round" opacity={muted ? 0.4 : 0.7}/>
      </svg>);
    case 4: return (
      <svg {...common}><path d="M14 32 C 14 24, 22 21, 32 21 C 42 21, 50 24, 50 32 C 50 40, 42 43, 32 43 C 22 43, 14 40, 14 32 Z" fill={fill} opacity={opacity}/></svg>);
    case 5: return (
      <svg {...common}><g fill={fill} opacity={opacity}>
        <path d="M14 26 C 14 21, 22 19, 26 22 C 30 19, 32 24, 30 28 C 28 32, 18 32, 14 30 Z"/>
        <path d="M34 24 C 38 20, 46 22, 48 28 C 50 32, 44 36, 38 34 C 32 32, 32 27, 34 24 Z"/>
        <path d="M18 38 C 22 34, 30 36, 32 40 C 34 44, 26 46, 20 44 C 16 42, 16 40, 18 38 Z"/>
        <path d="M40 40 C 44 38, 50 40, 50 44 C 48 48, 42 48, 38 46 C 36 44, 38 41, 40 40 Z"/>
      </g></svg>);
    case 6: return (
      <svg {...common}><path d="M10 32 C 12 24, 18 22, 24 23 C 28 19, 36 20, 40 24 C 48 22, 54 28, 52 34 C 56 38, 50 44, 44 44 C 38 48, 28 47, 22 44 C 14 44, 8 38, 10 32 Z" fill={fill} opacity={opacity}/></svg>);
    case 7: return (
      <svg {...common}><path d="M6 36 C 10 30, 18 28, 28 30 C 38 28, 50 30, 56 34 C 60 36, 56 42, 48 42 C 38 44, 24 44, 14 42 C 6 40, 4 38, 6 36 Z" fill={fill} opacity={opacity}/></svg>);
    default: return null;
  }
}

function WeatherShape({ n, size, muted }) {
  const fill = muted ? 'var(--ink-2)' : `var(--b${n})`;
  const opacity = muted ? 0.55 : 1;
  const common = { width: size, height: size, viewBox: '0 0 64 64' };
  switch (n) {
    case 1: return (
      <svg {...common}>
        <circle cx="32" cy="32" r="10" fill={fill} opacity={opacity}/>
        <g stroke={fill} strokeWidth="2.5" strokeLinecap="round" opacity={opacity}>
          <line x1="32" y1="12" x2="32" y2="18"/><line x1="32" y1="46" x2="32" y2="52"/>
          <line x1="12" y1="32" x2="18" y2="32"/><line x1="46" y1="32" x2="52" y2="32"/>
          <line x1="18" y1="18" x2="22" y2="22"/><line x1="42" y1="42" x2="46" y2="46"/>
          <line x1="46" y1="18" x2="42" y2="22"/><line x1="18" y1="46" x2="22" y2="42"/>
        </g>
      </svg>);
    case 2: return (
      <svg {...common}>
        <circle cx="22" cy="24" r="8" fill={fill} opacity={opacity * 0.5}/>
        <path d="M18 38 C 18 32, 24 28, 30 30 C 34 26, 44 28, 46 34 C 50 36, 50 42, 44 42 L 22 42 C 18 42, 16 40, 18 38 Z" fill={fill} opacity={opacity}/>
      </svg>);
    case 3: return (
      <svg {...common}><path d="M14 36 C 14 30, 20 26, 26 28 C 30 22, 42 24, 44 30 C 50 30, 52 38, 46 40 L 18 40 C 14 40, 12 38, 14 36 Z" fill={fill} opacity={opacity}/></svg>);
    case 4: return (
      <svg {...common}>
        <path d="M12 32 C 12 26, 18 22, 24 24 C 28 18, 40 20, 42 26 C 50 26, 54 34, 48 38 L 18 38 C 12 38, 10 36, 12 32 Z" fill={fill} opacity={opacity}/>
        <circle cx="32" cy="48" r="3" fill={fill} opacity={opacity}/>
      </svg>);
    case 5: return (
      <svg {...common}>
        <path d="M14 28 C 14 22, 20 18, 26 20 C 30 14, 42 16, 44 22 C 52 22, 54 32, 48 34 L 18 34 C 14 34, 12 32, 14 28 Z" fill={fill} opacity={opacity}/>
        <g fill={fill} opacity={opacity}>
          <ellipse cx="22" cy="44" rx="2" ry="3"/><ellipse cx="32" cy="46" rx="2" ry="3"/>
          <ellipse cx="42" cy="44" rx="2" ry="3"/><ellipse cx="27" cy="52" rx="1.5" ry="2.5"/><ellipse cx="37" cy="52" rx="1.5" ry="2.5"/>
        </g>
      </svg>);
    case 6: return (
      <svg {...common}>
        <path d="M10 26 C 10 20, 18 16, 24 18 C 28 12, 42 14, 44 20 C 54 20, 56 32, 50 34 L 14 34 C 10 34, 8 30, 10 26 Z" fill={fill} opacity={opacity}/>
        <g stroke={fill} strokeWidth="2.5" strokeLinecap="round" opacity={opacity}>
          <line x1="18" y1="42" x2="16" y2="50"/><line x1="26" y1="42" x2="24" y2="52"/>
          <line x1="34" y1="42" x2="32" y2="52"/><line x1="42" y1="42" x2="40" y2="50"/><line x1="50" y1="42" x2="48" y2="52"/>
        </g>
      </svg>);
    case 7: return (
      <svg {...common}>
        <path d="M8 24 C 8 18, 16 14, 22 16 C 26 8, 44 10, 46 18 C 56 18, 58 32, 52 34 L 12 34 C 8 34, 6 28, 8 24 Z" fill={fill} opacity={opacity}/>
        <path d="M30 38 L 22 50 L 30 50 L 26 60 L 38 46 L 32 46 L 36 38 Z" fill={fill} opacity={opacity}/>
      </svg>);
    default: return null;
  }
}

function FoodShape({ n, size, muted }) {
  const fill = muted ? 'var(--ink-2)' : `var(--b${n})`;
  const opacity = muted ? 0.55 : 1;
  const common = { width: size, height: size, viewBox: '0 0 64 64' };
  switch (n) {
    case 1: return (
      <svg {...common}><g fill={fill} opacity={opacity}>
        <ellipse cx="22" cy="26" rx="6" ry="5" transform="rotate(-15 22 26)"/>
        <ellipse cx="40" cy="24" rx="6" ry="5" transform="rotate(20 40 24)"/>
        <ellipse cx="32" cy="38" rx="6" ry="5" transform="rotate(-5 32 38)"/>
        <ellipse cx="46" cy="40" rx="5" ry="4" transform="rotate(30 46 40)"/>
      </g></svg>);
    case 2: return (
      <svg {...common}>
        <path d="M14 32 C 14 24, 22 20, 32 20 C 44 20, 52 24, 52 32 C 52 40, 44 44, 32 44 C 22 44, 14 40, 14 32 Z" fill={fill} opacity={opacity}/>
        <g fill="var(--bg)" opacity={muted ? 0.3 : 0.5}>
          <circle cx="22" cy="28" r="1.4"/><circle cx="28" cy="26" r="1.4"/><circle cx="36" cy="26" r="1.4"/><circle cx="44" cy="28" r="1.4"/>
          <circle cx="22" cy="36" r="1.4"/><circle cx="28" cy="38" r="1.4"/><circle cx="36" cy="38" r="1.4"/><circle cx="44" cy="36" r="1.4"/>
        </g>
      </svg>);
    case 3: return (
      <svg {...common}>
        <path d="M12 32 C 12 22, 22 19, 32 19 C 44 19, 52 23, 52 32 C 52 41, 44 45, 32 45 C 22 45, 12 42, 12 32 Z" fill={fill} opacity={opacity}/>
        <g stroke="var(--bg)" strokeWidth="1.4" strokeLinecap="round" opacity={muted ? 0.4 : 0.7} fill="none">
          <path d="M22 24 L 22 40"/><path d="M30 22 L 30 42"/><path d="M38 22 L 38 42"/><path d="M46 26 L 46 38"/>
        </g>
      </svg>);
    case 4: return (
      <svg {...common}><path d="M14 24 C 18 18, 28 18, 38 22 C 46 26, 50 36, 48 42 C 46 46, 40 44, 36 38 C 30 32, 22 30, 16 30 C 12 30, 12 26, 14 24 Z" fill={fill} opacity={opacity}/></svg>);
    case 5: return (
      <svg {...common}>
        <ellipse cx="32" cy="38" rx="22" ry="10" fill={fill} opacity={opacity * 0.4}/>
        <g fill={fill} opacity={opacity}>
          <circle cx="20" cy="36" r="3.5"/><circle cx="30" cy="34" r="4"/><circle cx="40" cy="38" r="3.5"/>
          <circle cx="46" cy="34" r="3"/><circle cx="26" cy="42" r="3"/><circle cx="38" cy="42" r="2.5"/>
        </g>
      </svg>);
    case 6: return (
      <svg {...common}>
        <ellipse cx="32" cy="36" rx="24" ry="11" fill={fill} opacity={opacity * 0.45}/>
        <g fill={fill} opacity={opacity}>
          <circle cx="18" cy="34" r="2"/><circle cx="24" cy="38" r="1.5"/><circle cx="30" cy="32" r="2"/>
          <circle cx="36" cy="36" r="1.8"/><circle cx="42" cy="34" r="2"/><circle cx="46" cy="38" r="1.5"/>
          <circle cx="22" cy="42" r="1.5"/><circle cx="34" cy="42" r="1.8"/><circle cx="40" cy="40" r="1.4"/>
        </g>
      </svg>);
    case 7: return (
      <svg {...common}>
        <ellipse cx="32" cy="38" rx="26" ry="6" fill={fill} opacity={opacity}/>
        <ellipse cx="32" cy="34" rx="20" ry="3" fill={fill} opacity={opacity * 0.5}/>
      </svg>);
    default: return null;
  }
}
