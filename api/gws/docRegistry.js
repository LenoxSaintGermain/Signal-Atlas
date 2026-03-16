/**
 * Firestore document registry — tracks Google Doc IDs for each artifact.
 * Path: clients/{uid}/doc_registry/{artifact_type}
 */

/** @param {FirebaseFirestore.Firestore} db */
const registryRef = (db, uid, artifactType) =>
  db.collection('clients').doc(uid).collection('doc_registry').doc(artifactType);

/**
 * Get a registry entry for a specific artifact type.
 * @returns {Promise<object|null>}
 */
export const getDocRegistryEntry = async (db, uid, artifactType) => {
  const snap = await registryRef(db, uid, artifactType).get();
  return snap.exists ? snap.data() : null;
};

/**
 * Create or update a registry entry.
 */
export const upsertDocRegistryEntry = async (db, uid, artifactType, data) => {
  const ref = registryRef(db, uid, artifactType);
  const snap = await ref.get();
  const now = new Date().toISOString();

  if (snap.exists) {
    await ref.update({ ...data, updated_at: now });
  } else {
    await ref.set({
      artifact_type: artifactType,
      created_at: now,
      updated_at: now,
      ...data,
    });
  }
};

/**
 * List all registry entries for a client.
 * @returns {Promise<object[]>}
 */
export const listDocRegistry = async (db, uid) => {
  const snap = await db
    .collection('clients').doc(uid)
    .collection('doc_registry')
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Mark a registry entry as errored.
 */
export const markDocRegistryError = async (db, uid, artifactType, errorDetail) => {
  await upsertDocRegistryEntry(db, uid, artifactType, {
    status: 'error',
    error_detail: String(errorDetail).slice(0, 500),
  });
};
