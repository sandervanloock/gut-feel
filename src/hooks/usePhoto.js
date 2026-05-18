import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase.js';

export function usePhoto() {
  const uploadPhoto = async (uid, file) => {
    const path = `users/${uid}/photos/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const deletePhoto = async (url) => {
    try {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
    } catch {
      // photo may already be deleted
    }
  };

  return { uploadPhoto, deletePhoto };
}
