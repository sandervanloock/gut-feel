import { useState, useMemo, useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { useAuth } from './auth/AuthContext.jsx';
import { useAllEntries } from './hooks/useEntries.js';
import { Icon } from './components/Icon.jsx';
import { BlobShape } from './components/BlobShape.jsx';
import { DayStrip } from './components/DayStrip.jsx';
import { TimelineRow } from './components/TimelineRow.jsx';
import { InlineQuickAdd } from './components/InlineQuickAdd.jsx';
import { DaySummary } from './components/DaySummary.jsx';
import { LogMealSheet } from './sheets/LogMealSheet.jsx';
import { LogGutSheet } from './sheets/LogGutSheet.jsx';
import { SnackEditSheet } from './sheets/SnackEditSheet.jsx';
import { TODAY, addDays, dayKey, relativeDay } from './data.js';
import { db, storage, auth } from './config/firebase.js';

function computeSlotTime(dayEntries, afterIndex) {
  const cur = dayEntries[afterIndex];
  const next = dayEntries[afterIndex + 1];
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fromMin = (m) => `${String(Math.floor(m / 60)).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`;
  const a = toMin(cur.time);
  if (!next) return fromMin(Math.min(24 * 60 - 1, a + 30));
  const b = toMin(next.time);
  if (b - a >= 2) return fromMin(Math.floor((a + b) / 2));
  return fromMin(Math.min(24 * 60 - 1, a + 1));
}

export function App() {
  const { user } = useAuth();
  const uid = user.uid;
  const { entries } = useAllEntries(uid);
  const [tab, setTab] = useState('today');
  const [currentDate, setCurrentDate] = useState(TODAY);

  const [mealSheet, setMealSheet] = useState({ open: false, initial: null });
  const [bowelSheet, setBowelSheet] = useState({ open: false, initial: null });
  const [snackSheet, setSnackSheet] = useState({ open: false, initial: null });

  const dKey = dayKey(currentDate);

  const dayEntries = useMemo(() =>
    entries.filter(e => e.date === dKey).sort((a, b) => a.time.localeCompare(b.time)),
    [entries, dKey]);

  const snackCounts = useMemo(() => {
    const o = {};
    dayEntries.filter(e => e.type === 'snack').forEach(e => {
      const id = e.item.toLowerCase();
      o[id] = (o[id] || 0) + e.count;
    });
    return o;
  }, [dayEntries]);

  const recentMeals = useMemo(() => {
    const m = new Map();
    entries.filter(e => e.type === 'meal' && e.date < dKey).forEach(e => {
      if (!m.has(e.name)) m.set(e.name, { name: e.name, ingredients: e.ingredients || [], count: 0 });
      m.get(e.name).count++;
    });
    return [...m.values()].sort((a, b) => b.count - a.count);
  }, [entries, dKey]);

  const ingredientHistory = useMemo(() => {
    const s = new Set();
    entries.filter(e => e.type === 'meal').forEach(e => (e.ingredients || []).forEach(i => s.add(i)));
    return [...s];
  }, [entries]);

  const entriesRef = () => collection(db, 'users', uid, 'entries');

  const saveMeal = useCallback(async ({ name, ingredients, time, mealType, notes, photo }) => {
    let photoUrl = mealSheet.initial?.photoUrl || null;
    if (photo && typeof photo !== 'string') {
      const path = `users/${uid}/photos/${Date.now()}_${photo.name}`;
      const sr = storageRef(storage, path);
      await uploadBytes(sr, photo);
      photoUrl = await getDownloadURL(sr);
    } else if (photo === null && mealSheet.initial?.photoUrl) {
      try { await deleteObject(storageRef(storage, mealSheet.initial.photoUrl)); } catch {}
      photoUrl = null;
    } else if (typeof photo === 'string') {
      photoUrl = photo;
    }

    const data = { type: 'meal', date: dKey, name, ingredients, time, mealType, notes: notes || '', ...(photoUrl ? { photoUrl } : {}) };

    if (mealSheet.initial) {
      await updateDoc(doc(db, 'users', uid, 'entries', mealSheet.initial.id), { ...data, updatedAt: serverTimestamp() });
    } else {
      await addDoc(entriesRef(), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
    setMealSheet({ open: false, initial: null });
  }, [uid, dKey, mealSheet.initial]);

  const saveBowel = useCallback(async ({ bristol, urgency, effort, time }) => {
    const data = { type: 'bowel', date: dKey, bristol, urgency, effort, time };
    if (bowelSheet.initial) {
      await updateDoc(doc(db, 'users', uid, 'entries', bowelSheet.initial.id), { ...data, updatedAt: serverTimestamp() });
    } else {
      await addDoc(entriesRef(), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
    setBowelSheet({ open: false, initial: null });
  }, [uid, dKey, bowelSheet.initial]);

  const saveSnack = useCallback(async ({ count, time, notes }) => {
    if (!snackSheet.initial) return;
    await updateDoc(doc(db, 'users', uid, 'entries', snackSheet.initial.id), { count, time, notes: notes || '', updatedAt: serverTimestamp() });
    setSnackSheet({ open: false, initial: null });
  }, [uid, snackSheet.initial]);

  const deleteEntry = useCallback(async (id) => {
    await deleteDoc(doc(db, 'users', uid, 'entries', id));
    setMealSheet({ open: false, initial: null });
    setBowelSheet({ open: false, initial: null });
    setSnackSheet({ open: false, initial: null });
  }, [uid]);

  const mergeSnack = useCallback(async (targetId) => {
    if (!snackSheet.initial) return;
    const id = snackSheet.initial.id;
    const a = entries.find(e => e.id === id);
    const b = entries.find(e => e.id === targetId);
    if (!a || !b) return;
    await updateDoc(doc(db, 'users', uid, 'entries', id), { count: a.count + b.count, updatedAt: serverTimestamp() });
    await deleteDoc(doc(db, 'users', uid, 'entries', targetId));
    setSnackSheet({ open: false, initial: null });
  }, [uid, snackSheet.initial, entries]);

  const addSnack = useCallback(async (snack) => {
    const existing = dayEntries.find(e => e.type === 'snack' && e.item.toLowerCase() === snack.id);
    if (existing) {
      await updateDoc(doc(db, 'users', uid, 'entries', existing.id), { count: (existing.count || 1) + 1, updatedAt: serverTimestamp() });
    } else {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      await addDoc(entriesRef(), { type: 'snack', date: dKey, time, item: snack.label, count: 1, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
  }, [uid, dKey, dayEntries]);

  const addSnackAt = useCallback(async (snack, time) => {
    await addDoc(entriesRef(), { type: 'snack', date: dKey, time, item: snack.label, count: 1, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }, [uid, dKey]);

  const incrementEntry = useCallback(async (id) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    await updateDoc(doc(db, 'users', uid, 'entries', id), { count: (entry.count || 1) + 1, updatedAt: serverTimestamp() });
  }, [uid, entries]);

  const [dragId, setDragId] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const moveSnackEntry = useCallback(async (snackId, targetId, pos) => {
    const target = entries.find(e => e.id === targetId);
    const snack = entries.find(e => e.id === snackId);
    if (!target || !snack || snack.type !== 'snack') return;

    if (target.type === 'snack' && target.item === snack.item) {
      await updateDoc(doc(db, 'users', uid, 'entries', targetId), { count: (target.count || 1) + (snack.count || 1), updatedAt: serverTimestamp() });
      await deleteDoc(doc(db, 'users', uid, 'entries', snackId));
      return;
    }

    const [th, tm] = target.time.split(':').map(Number);
    const tMin = th * 60 + tm;
    const sameDay = entries.filter(e => e.date === target.date && e.id !== snackId);
    const sorted = [...sameDay].sort((a, b) => a.time.localeCompare(b.time));
    const idx = sorted.findIndex(e => e.id === targetId);
    let newMin;
    if (pos === 'above') {
      const before = idx > 0 ? sorted[idx - 1] : null;
      if (before) {
        const [bh, bm] = before.time.split(':').map(Number);
        newMin = Math.floor(((bh * 60 + bm) + tMin) / 2);
        if (newMin === bh * 60 + bm) newMin = tMin - 1;
      } else { newMin = tMin - 1; }
    } else {
      const after = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;
      if (after) {
        const [ah, am] = after.time.split(':').map(Number);
        newMin = Math.ceil((tMin + (ah * 60 + am)) / 2);
        if (newMin === ah * 60 + am) newMin = tMin + 1;
      } else { newMin = tMin + 1; }
    }
    newMin = Math.max(0, Math.min(24 * 60 - 1, newMin));
    const hh = String(Math.floor(newMin / 60)).padStart(2, '0');
    const mm = String(newMin % 60).padStart(2, '0');
    await updateDoc(doc(db, 'users', uid, 'entries', snackId), { time: `${hh}:${mm}`, updatedAt: serverTimestamp() });
  }, [uid, entries]);

  const dragHandlers = useMemo(() => ({
    onDragStart: (e, entry) => {
      setDragId(entry.id);
      try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(entry.id)); } catch {}
    },
    onDragEnd: () => { setDragId(null); setDragOver(null); },
    onDragOver: (e, entry) => {
      if (dragId == null || dragId === entry.id) return;
      e.preventDefault();
      const r = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientY - r.top) < r.height / 2 ? 'above' : 'below';
      setDragOver(prev => (prev && prev.id === entry.id && prev.pos === pos) ? prev : { id: entry.id, pos });
    },
    onDragLeave: () => {},
    onDrop: (e, target) => {
      e.preventDefault();
      if (dragId == null || dragId === target.id) { setDragId(null); setDragOver(null); return; }
      const pos = (dragOver && dragOver.id === target.id) ? dragOver.pos : 'below';
      moveSnackEntry(dragId, target.id, pos);
      setDragId(null); setDragOver(null);
    },
  }), [dragId, dragOver, moveSnackEntry]);

  const [openSlot, setOpenSlot] = useState(null);
  const isToday = dKey === dayKey(TODAY);
  const isFuture = currentDate > TODAY;

  return (
    <>
      <div className="scroll-area">
        {tab === 'today' && (
          <>
            {/* Header */}
            <div style={{ padding: '20px 20px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="eyebrow">{relativeDay(currentDate)}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => setCurrentDate(addDays(currentDate, -1))}
                    style={{ width: 32, height: 32, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                    <Icon name="chevron-l" size={18} />
                  </button>
                  <button onClick={() => !isFuture && setCurrentDate(addDays(currentDate, 1))} disabled={isToday}
                    style={{ width: 32, height: 32, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isToday ? 'var(--faint)' : 'var(--muted)' }}>
                    <Icon name="chevron-r" size={18} />
                  </button>
                </div>
              </div>
              <h1 className="h-title" style={{ margin: 0 }}>
                {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
                <span style={{ color: 'var(--muted)' }}>, </span>
                <em style={{ fontStyle: 'italic' }}>{currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</em>
              </h1>
            </div>

            {/* Day strip */}
            <DayStrip currentDate={currentDate} setCurrentDate={setCurrentDate} entries={entries} />

            {/* Action buttons */}
            <div style={{ padding: '14px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button className="btn btn-primary" onClick={() => setMealSheet({ open: true, initial: null })}>
                <Icon name="utensils" size={18} color="currentColor" /> Log meal
              </button>
              <button className="btn btn-ghost" onClick={() => setBowelSheet({ open: true, initial: null })}>
                <BlobShape n={4} size={20} /> Log gut
              </button>
            </div>

            {/* Timeline */}
            <div style={{ padding: '20px 20px 8px' }}>
              <div className="eyebrow" style={{ marginBottom: 12 }}>Timeline</div>
              {dayEntries.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon"><Icon name="utensils" size={20} color="var(--muted)" /></div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink)' }}>Nothing logged yet.</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Use the buttons above to start logging.</div>
                  <div style={{ marginTop: 16 }}>
                    <InlineQuickAdd open={openSlot === 'empty'} onToggle={() => setOpenSlot(openSlot === 'empty' ? null : 'empty')}
                      onPick={(snack) => { addSnack(snack); setOpenSlot(null); }} snackCounts={snackCounts} />
                  </div>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div className="rail" />
                  {dayEntries.map((e, i) => {
                    const next = dayEntries[i + 1];
                    const isLast = i === dayEntries.length - 1;
                    const showSlot = (next && next.type === 'meal') || isLast;
                    return (
                      <div key={e.id}>
                        <TimelineRow entry={e} metaphor="blob"
                          onEdit={() => {
                            if (e.type === 'meal') setMealSheet({ open: true, initial: e });
                            if (e.type === 'bowel') setBowelSheet({ open: true, initial: e });
                            if (e.type === 'snack') setSnackSheet({ open: true, initial: e });
                          }}
                          onIncrementSnack={() => incrementEntry(e.id)}
                          dragHandlers={dragHandlers}
                          dragging={dragId}
                          dragOver={dragOver}
                        />
                        {showSlot && (
                          <InlineQuickAdd
                            open={openSlot === i}
                            onToggle={() => setOpenSlot(openSlot === i ? null : i)}
                            onPick={(snack) => {
                              const t = computeSlotTime(dayEntries, i);
                              addSnackAt(snack, t);
                              setOpenSlot(null);
                            }}
                            snackCounts={snackCounts}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <DaySummary entries={dayEntries} metaphor="blob" />
            <div style={{ height: 8 }} />
          </>
        )}

        {tab === 'insights' && (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div className="empty-icon" style={{ margin: '0 auto 16px' }}>
              <Icon name="chart" size={22} color="var(--muted)" />
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginBottom: 8 }}>Insights</div>
            <div style={{ color: 'var(--muted)', fontSize: 14 }}>Coming in a future update.</div>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="tabbar">
        <button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}>
          <span className="tab-icon"><Icon name="home" size={22} /></span>
          <span>Today</span>
        </button>
        <button className={tab === 'insights' ? 'active' : ''} onClick={() => setTab('insights')}>
          <span className="tab-icon"><Icon name="chart" size={22} /></span>
          <span>Insights</span>
        </button>
      </div>

      {/* Sheets */}
      <LogMealSheet
        open={mealSheet.open}
        initial={mealSheet.initial}
        onClose={() => setMealSheet({ open: false, initial: null })}
        onSave={saveMeal}
        onDelete={deleteEntry}
        ingredientHistory={ingredientHistory}
        recentMeals={recentMeals}
      />
      <LogGutSheet
        open={bowelSheet.open}
        initial={bowelSheet.initial}
        onClose={() => setBowelSheet({ open: false, initial: null })}
        onSave={saveBowel}
        onDelete={deleteEntry}
        metaphor="blob"
      />
      <SnackEditSheet
        open={snackSheet.open}
        initial={snackSheet.initial}
        onClose={() => setSnackSheet({ open: false, initial: null })}
        onSave={saveSnack}
        onDelete={deleteEntry}
        onMerge={mergeSnack}
        mergeCandidates={snackSheet.initial
          ? entries.filter(e => e.type === 'snack' && e.date === snackSheet.initial.date && e.item.toLowerCase() === snackSheet.initial.item.toLowerCase() && e.id !== snackSheet.initial.id)
          : []}
      />
    </>
  );
}
