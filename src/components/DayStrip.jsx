import { useRef, useEffect, useMemo } from 'react';
import { addDays, dayKey, TODAY } from '../data.js';

export function DayStrip({ currentDate, setCurrentDate, entries }) {
  const daystripRef = useRef(null);
  const dKey = dayKey(currentDate);

  const stripDays = useMemo(() => {
    const arr = [];
    for (let i = -90; i <= 0; i++) arr.push(addDays(TODAY, i));
    return arr;
  }, []);

  useEffect(() => {
    const el = daystripRef.current;
    if (!el) return;
    const sel = el.querySelector('.daydot.selected');
    if (sel) {
      const er = el.getBoundingClientRect();
      const sr = sel.getBoundingClientRect();
      const off = (sr.left - er.left) - (er.width / 2 - sr.width / 2);
      el.scrollTo({ left: el.scrollLeft + off, behavior: 'smooth' });
    }
  }, [dKey]);

  return (
    <div className="daystrip" ref={daystripRef}>
      {stripDays.map(d => {
        const k = dayKey(d);
        const isSel = k === dKey;
        const isToday = k === dayKey(TODAY);
        const hasData = entries.some(e => e.date === k);
        return (
          <button key={k}
            className={'daydot' + (isSel ? ' selected' : '') + (isToday && !isSel ? ' today' : '')}
            onClick={() => setCurrentDate(d)}>
            <div style={{ fontSize: 10, opacity: 0.7 }}>{d.toLocaleDateString('en-US', { weekday: 'narrow' })}</div>
            <div className="dnum">{d.getDate()}</div>
            {hasData && <div className="daydot-marker" />}
          </button>
        );
      })}
    </div>
  );
}
