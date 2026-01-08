import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, Timestamp, deleteDoc, doc } from "firebase/firestore";
import { Gem } from '../types';

const GEMS_COLLECTION = 'gems';

export const saveGem = async (gem: Omit<Gem, 'id' | 'created_at'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, GEMS_COLLECTION), {
      ...gem,
      created_at: Timestamp.now()
    });
    return docRef.id;
  } catch (e) {
    console.error("Error adding gem: ", e);
    throw e;
  }
};

export const getUserGems = async (email: string): Promise<Gem[]> => {
  try {
    // FETCH: Query by user_email only.
    // NOTE: We do not use orderBy("created_at") in the query here to avoid 
    // the "FAILED_PRECONDITION: The query requires an index" error.
    // Instead, we sort the results in memory below.
    const q = query(
      collection(db, GEMS_COLLECTION), 
      where("user_email", "==", email)
    );
    
    const querySnapshot = await getDocs(q);
    const gems = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Gem));

    // SORT: Client-side by created_at descending (newest first)
    return gems.sort((a, b) => {
      const secondsA = a.created_at?.seconds ?? 0;
      const secondsB = b.created_at?.seconds ?? 0;
      return secondsB - secondsA;
    });
  } catch (e) {
    console.error("Error fetching gems: ", e);
    throw e;
  }
};

export const deleteGem = async (gemId: string) => {
  try {
    await deleteDoc(doc(db, GEMS_COLLECTION, gemId));
  } catch (e) {
    console.error("Error deleting gem: ", e);
    throw e;
  }
};
