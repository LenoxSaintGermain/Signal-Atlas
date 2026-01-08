import { db } from './firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { Lead } from '../types';

const LEADS_COLLECTION = 'leads';

export const saveLead = async (lead: Lead) => {
  try {
    const normalizedEmail = lead.email.trim().toLowerCase();
    const leadDoc = doc(db, LEADS_COLLECTION, normalizedEmail);

    await setDoc(
      leadDoc,
      {
        ...lead,
        email: normalizedEmail,
        captured_at: Timestamp.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error saving lead: ', error);
    throw error;
  }
};
