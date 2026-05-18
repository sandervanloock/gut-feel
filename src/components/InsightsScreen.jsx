import { useMemo } from 'react';
import { Icon } from './Icon.jsx';
import { BlobShape } from './BlobShape.jsx';
import { Tag } from './Tag.jsx';
import { TODAY, addDays, dayKey } from '../data.js';

export function InsightsScreen({ entries, metaphor = 'blob' }) {
  const days = useMemo(() => {
    const arr = [];
    for (let i = -6; i <= 0; i++) arr.push(addDays(TODAY, i));
    return arr;
  }, []);

  const dist = [0, 0, 0, 0, 0, 0, 0];
  let totalBowel = 0;
  let avgB = 0;
  entries.forEach(e => {
    if (e.type === 'bowel') {
      const ed = new Date(e.date);
      ed.setHours(0, 0, 0, 0);
      if (ed >= addDays(TODAY, -6) && ed <= TODAY) {
        dist[e.bristol - 1]++;
        totalBowel++;
        avgB += e.bristol;
      }
    }
  });
  avgB = totalBowel ? avgB / totalBowel : 0;

  const daily = days.map(d => {
    const k = dayKey(d);
    const dayBowel = entries.filter(e => e.date === k && e.type === 'bowel');
    const dayAvg = dayBowel.length ? dayBowel.reduce((s, e) => s + e.bristol, 0) / dayBowel.length : null;
    return { date: d, bowel: dayBowel.length, avg: dayAvg };
  });

  const ingredientStats = useMemo(() => {
    const m = new Map();
    days.forEach(d => {
      const k = dayKey(d);
      const dayBowel = entries.filter(e => e.date === k && e.type === 'bowel');
      if (!dayBowel.length) return;
      const dayAvg = dayBowel.reduce((s, e) => s + e.bristol, 0) / dayBowel.length;
      const ings = new Set();
      entries.filter(e => e.date === k && e.type === 'meal').forEach(e => (e.ingredients || []).forEach(i => ings.add(i)));
      ings.forEach(i => {
        if (!m.has(i)) m.set(i, { count: 0, sum: 0 });
        const r = m.get(i);
        r.count++; r.sum += dayAvg;
      });
    });
    return [...m.entries()]
      .filter(([, v]) => v.count >= 2)
      .map(([k, v]) => ({ name: k, avg: v.sum / v.count, count: v.count }))
      .sort((a, b) => b.avg - a.avg);
  }, [entries, days]);

  const looser = ingredientStats.slice(0, 3);
  const firmer = ingredientStats.slice(-3).reverse();

  const topIng = useMemo(() => {
    const m = new Map();
    entries.filter(e => e.type === 'meal').forEach(e => (e.ingredients || []).forEach(i => m.set(i, (m.get(i) || 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [entries]);

  return (
    <div className="insights-page">
      <div className="insights-header" style={{ padding: '20px 20px 0' }}>
        <div className="eyebrow">Past 7 days</div>
        <h1 className="h-title" style={{ margin: '4px 0 4px' }}>
          The <em>shape</em> of your week.
        </h1>
        <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 18 }}>
          Quiet patterns across what you eat and what comes out.
        </div>
      </div>

      <div className="insights-grid">
        {/* Average bristol */}
        <div className="insights-cell insights-cell--avg" style={{ padding: '0 20px 20px' }}>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 18 }}>
            <BlobShape n={Math.round(avgB) || 4} size={64} metaphor={metaphor} />
            <div style={{ flex: 1 }}>
              <div className="eyebrow">Average shape</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 28, lineHeight: 1, letterSpacing: '-0.02em' }}>
                Type {avgB ? avgB.toFixed(1) : '—'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                {avgB === 0
                  ? 'No data yet'
                  : (avgB >= 3.5 && avgB <= 4.5)
                    ? 'Right in the sweet spot.'
                    : avgB < 3.5
                      ? 'Trending firm — try more water + fiber.'
                      : 'Trending loose — note triggers below.'}
              </div>
            </div>
          </div>
        </div>

        {/* Bristol distribution */}
        <div className="insights-cell insights-cell--dist" style={{ padding: '0 20px 20px' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Distribution</div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', alignItems: 'end', gap: 6, height: 96 }}>
              {dist.map((c, i) => {
                const max = Math.max(...dist, 1);
                const h = (c / max) * 80;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', height: 12 }}>{c || ''}</div>
                    <div className="spark-bar" style={{ width: '100%', height: Math.max(h, 4), background: `var(--b${i + 1})`, opacity: c ? 1 : 0.25 }} />
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginTop: 8 }}>
              {[1, 2, 3, 4, 5, 6, 7].map(n => (
                <div key={n} style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{n}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Daily output */}
        <div className="insights-cell insights-cell--daily" style={{ padding: '0 20px 20px' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Daily output</div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', alignItems: 'end', gap: 6, height: 100 }}>
              {daily.map((d, i) => {
                const fill = d.avg ? `var(--b${Math.round(d.avg)})` : 'var(--line)';
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 3, width: '100%' }}>
                      {Array.from({ length: d.bowel }, (_, k) => (
                        <div key={k} style={{ width: '60%', height: 12, borderRadius: 6, background: fill }} />
                      ))}
                      {d.bowel === 0 && <div style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--line)' }} />}
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>
                      {d.date.toLocaleDateString('en-US', { weekday: 'narrow' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Ingredient patterns */}
        {ingredientStats.length > 0 && (
          <div className="insights-cell insights-cell--patterns" style={{ padding: '0 20px 20px' }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Patterns spotted</div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                <Icon name="sparkle" size={16} color="var(--terracotta)" />
                <div style={{ fontFamily: 'var(--serif)', fontSize: 16 }}>Ingredient ↔ output</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.4 }}>
                Days with these ingredients ran softer or firmer than average. Needs more data to be reliable.
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {looser.length > 0 && (
                  <div>
                    <div className="eyebrow" style={{ marginBottom: 6, color: 'oklch(58% 0.085 215)' }}>Looser days</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {looser.map(s => (
                        <span key={s.name} className="tag" style={{ background: 'oklch(94% 0.025 215)', color: 'oklch(40% 0.05 215)' }}>
                          {s.name} <span style={{ opacity: 0.6 }}>{s.avg.toFixed(1)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {firmer.length > 0 && (
                  <div>
                    <div className="eyebrow" style={{ marginBottom: 6, color: 'oklch(50% 0.07 60)' }}>Firmer days</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {firmer.map(s => (
                        <span key={s.name} className="tag" style={{ background: 'oklch(94% 0.03 65)', color: 'oklch(40% 0.05 65)' }}>
                          {s.name} <span style={{ opacity: 0.6 }}>{s.avg.toFixed(1)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Top ingredients */}
        {topIng.length > 0 && (
          <div className="insights-cell insights-cell--top" style={{ padding: '0 20px 32px' }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Most logged</div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {topIng.map(([name, count]) => (
                  <span key={name} className="tag">
                    {name} <span style={{ opacity: 0.55 }}>×{count}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
