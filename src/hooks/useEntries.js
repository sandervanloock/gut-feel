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
    await addDoc(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  };

  const updateEntry = async (id, data) => {
    const ref = doc(db, 'users', uid, 'entries', id);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  };

  const deleteEntry = async (id) => {
    const ref = doc(db, 'users', uid, 'entries', id);
    await deleteDoc(ref);
  };

  return { entries, loading, addEntry, updateEntry, deleteEntry };
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
