export function Icon({ name, size = 22, color = 'currentColor', strokeWidth = 1.6 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'home':      return <svg {...p}><path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/></svg>;
    case 'plus':      return <svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case 'chart':     return <svg {...p}><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-4"/><path d="M12 16V9"/><path d="M16 16v-7"/></svg>;
    case 'chevron-l': return <svg {...p}><polyline points="15 6 9 12 15 18"/></svg>;
    case 'chevron-r': return <svg {...p}><polyline points="9 6 15 12 9 18"/></svg>;
    case 'chevron-d': return <svg {...p}><polyline points="6 9 12 15 18 9"/></svg>;
    case 'x':         return <svg {...p}><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>;
    case 'camera':    return <svg {...p}><path d="M3 7h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="13" r="4"/></svg>;
    case 'edit':      return <svg {...p}><path d="M14 4l6 6-10 10H4v-6z"/></svg>;
    case 'trash':     return <svg {...p}><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/></svg>;
    case 'clock':     return <svg {...p}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>;
    case 'utensils':  return <svg {...p}><path d="M7 4v7a2 2 0 0 0 2 2v7"/><path d="M11 4v6"/><path d="M15 4c-1 0-2 2-2 4s1 4 2 4v8"/></svg>;
    case 'mug':       return <svg {...p}><path d="M5 8h11v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 11h2a2 2 0 0 1 0 4h-2"/><path d="M8 4v2M11 4v2"/></svg>;
    case 'water':     return <svg {...p}><path d="M12 3c4 5 6 8 6 12a6 6 0 0 1-12 0c0-4 2-7 6-12z"/></svg>;
    case 'wine':      return <svg {...p}><path d="M8 4h8l-1 6a3 3 0 0 1-6 0z"/><path d="M12 13v6"/><path d="M9 20h6"/></svg>;
    case 'beer':      return <svg {...p}><rect x="6" y="6" width="10" height="14" rx="1"/><path d="M16 9h2a2 2 0 0 1 0 5h-2"/><path d="M9 10v6M12 10v6"/></svg>;
    case 'soda':      return <svg {...p}><path d="M7 7l1 13h8l1-13z"/><path d="M7 7l-1-3h12l-1 3"/></svg>;
    case 'tea':       return <svg {...p}><path d="M5 8h11v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 11h2a2 2 0 0 1 0 4h-2"/><path d="M9 3c1 1 0 3 1 4M13 3c1 1 0 3 1 4"/></svg>;
    case 'leaf':      return <svg {...p}><path d="M5 19c8 0 14-6 14-14 0 0-7 0-11 4s-3 10-3 10z"/><path d="M5 19c0-4 4-8 8-8"/></svg>;
    case 'check':     return <svg {...p}><polyline points="5 12 10 17 19 7"/></svg>;
    case 'sparkle':   return <svg {...p}><path d="M12 4l1.5 4.5L18 10l-4.5 1.5L12 16l-1.5-4.5L6 10l4.5-1.5z"/></svg>;
    case 'history':   return <svg {...p}><path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 4 3 9 8 9"/><polyline points="12 7 12 12 15 14"/></svg>;
    case 'note':      return <svg {...p}><path d="M5 4h14v16H5z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>;
    case 'dots':      return <svg {...p}><circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/></svg>;
    case 'spinner':   return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.7s linear infinite' }}>
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} strokeOpacity="0.25"/>
        <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      </svg>);
    default: return null;
  }
}

const SNACK_ICON_MAP = { coffee: 'mug', water: 'water', wine: 'wine', beer: 'beer', soda: 'soda', tea: 'tea', other: 'dots' };

export function SnackIcon({ id, size = 18 }) {
  return <Icon name={SNACK_ICON_MAP[id] || 'dots'} size={size} />;
}
