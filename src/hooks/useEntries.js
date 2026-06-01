import {useEffect, useState} from 'react';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import {db} from '../config/firebase.js';

function isMealData(data) {
    return data?.type === 'meal' || (!data?.type && (data?.name !== undefined));
}

export function useEntries(uid, dateStr) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !dateStr) { setEntries([]); setLoading(false); return; }
    const ref = collection(db, 'users', uid, 'entries');
    const q = query(ref, where('date', '==', dateStr));
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [uid, dateStr]);

  const addEntry = async (data) => {
    const ref = collection(db, 'users', uid, 'entries');
      const extra = data.type === 'meal' ? {analysisRequestedAt: serverTimestamp()} : {};
      await addDoc(ref, {...data, ...extra, createdAt: serverTimestamp(), updatedAt: serverTimestamp()});
  };

  const updateEntry = async (id, data) => {
    const ref = doc(db, 'users', uid, 'entries', id);
      const extra = data.type === 'meal' && (data.name !== undefined || data.ingredients !== undefined)
          ? {analysisRequestedAt: serverTimestamp()}
          : {};
      await updateDoc(ref, {...data, ...extra, updatedAt: serverTimestamp()});
  };

  const deleteEntry = async (id) => {
    const ref = doc(db, 'users', uid, 'entries', id);
    await deleteDoc(ref);
  };

    const answerFollowup = async (id, followupId, answer) => {
        const ref = doc(db, 'users', uid, 'entries', id);
        await updateDoc(ref, {
            [`analysis.followupAnswers.${followupId}`]: answer,
            analysisRequestedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    };

    const dropTag = async (id, tagKey) => {
        const snap = entries.find(e => e.id === id);
        const dropped = snap?.analysis?.dropped ?? [];
        if (dropped.includes(tagKey)) return;
        const ref = doc(db, 'users', uid, 'entries', id);
        await updateDoc(ref, {
            'analysis.dropped': [...dropped, tagKey],
            updatedAt: serverTimestamp(),
        });
    };

    const restoreTags = async (id) => {
        const ref = doc(db, 'users', uid, 'entries', id);
        await updateDoc(ref, {'analysis.dropped': [], updatedAt: serverTimestamp()});
    };

    return {entries, loading, addEntry, updateEntry, deleteEntry, answerFollowup, dropTag, restoreTags};
}

export function useAllEntries(uid) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setEntries([]); setLoading(false); return; }
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const ref = collection(db, 'users', uid, 'entries');
    const q = query(ref, where('date', '>=', cutoffStr), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  return { entries, loading };
}
