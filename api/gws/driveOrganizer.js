import * as gws from './gwsClient.js';

const ROOT_FOLDER_ID = () => process.env.GWS_DRIVE_ROOT_FOLDER_ID || '';

/** Human-readable doc titles keyed by artifact type. */
export const ARTIFACT_DOC_TITLES = {
  brief: 'The Brief',
  suite_distilled: 'Strategic Map',
  profile: 'Professional DNA',
  ai_profile: 'AI Positioning',
  gaps: 'Skill Gaps Analysis',
  readiness: 'AI Readiness Report',
  cjs_execution: 'Job Search Execution',
  plan: '72-Hour Plan',
  resume_review: 'Resume Review',
  search_strategy: 'Search Strategy',
};

/**
 * Ensure a Drive folder exists for a client. Returns the folder ID.
 * Caches the folder ID on the client Firestore document.
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {string} uid
 * @returns {Promise<string>} Drive folder ID
 */
export const ensureClientFolder = async (db, uid) => {
  const clientRef = db.collection('clients').doc(uid);
  const clientSnap = await clientRef.get();
  const clientData = clientSnap.exists ? clientSnap.data() : {};

  // Return cached folder ID if present
  if (clientData.drive_folder_id) return clientData.drive_folder_id;

  const displayName = clientData.display_name || clientData.email || uid;
  const email = clientData.email || '';
  const folderName = email
    ? `${displayName} (${email})`
    : displayName;

  const folder = await gws.createFolder(folderName, ROOT_FOLDER_ID());

  // Share the folder with the client if we have their email
  if (email) {
    await gws.shareWithUser(folder.id, email, 'writer');
  }

  // Cache the folder ID (merge in case client doc doesn't exist yet)
  await clientRef.set({ drive_folder_id: folder.id }, { merge: true });

  return folder.id;
};

/**
 * Get the Google Doc title for an artifact type.
 * @param {string} artifactType
 * @param {string} [clientName]
 * @returns {string}
 */
export const getDocTitle = (artifactType, clientName) => {
  const base = ARTIFACT_DOC_TITLES[artifactType] || artifactType;
  return clientName ? `${base} — ${clientName}` : base;
};
