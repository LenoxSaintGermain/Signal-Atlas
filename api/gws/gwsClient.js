import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const GWS_BIN = process.env.GWS_BIN_PATH || 'gws';
const SA_KEY_PATH = process.env.GWS_SERVICE_ACCOUNT_KEY_PATH || '';
const EXEC_TIMEOUT_MS = 30_000;

/**
 * Run a gws CLI command and return parsed JSON output.
 * @param {string[]} args — command arguments after `gws`
 * @returns {Promise<object>}
 */
const run = async (args) => {
  const fullArgs = SA_KEY_PATH
    ? ['--service-account-key', SA_KEY_PATH, ...args]
    : args;

  const { stdout, stderr } = await execFileAsync(GWS_BIN, fullArgs, {
    timeout: EXEC_TIMEOUT_MS,
    maxBuffer: 4 * 1024 * 1024,
  });
  if (stderr) console.warn('[gws]', stderr.trim());
  try {
    return JSON.parse(stdout);
  } catch (parseErr) {
    throw new Error(`gws returned non-JSON output: ${stdout.slice(0, 200)}`);
  }
};

/** Create an empty Google Doc. Returns { documentId, title }. */
export const createDocument = async (title) => {
  const result = await run([
    'docs', 'documents', 'create',
    '--params', JSON.stringify({ title }),
  ]);
  return { documentId: result.documentId, title: result.title };
};

/** Apply a batchUpdate to a Google Doc. */
export const batchUpdate = async (documentId, requests) => {
  return run([
    'docs', 'documents', 'batchUpdate',
    '--documentId', documentId,
    '--params', JSON.stringify({ requests }),
  ]);
};

/** Read a Google Doc's metadata. */
export const getDocument = async (documentId) => {
  return run(['docs', 'documents', 'get', '--documentId', documentId]);
};

/** Create a Drive folder. Returns { id, name }. */
export const createFolder = async (name, parentId) => {
  const metadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) metadata.parents = [parentId];

  const result = await run([
    'drive', 'files', 'create',
    '--params', JSON.stringify(metadata),
  ]);
  return { id: result.id, name: result.name };
};

/** Move a file into a folder (add parent). */
export const moveToFolder = async (fileId, folderId) => {
  return run([
    'drive', 'files', 'update',
    '--fileId', fileId,
    '--params', JSON.stringify({ addParents: folderId }),
  ]);
};

/** Share a Drive file/folder with a user. */
export const shareWithUser = async (fileId, email, role = 'writer') => {
  return run([
    'drive', 'permissions', 'create',
    '--fileId', fileId,
    '--params', JSON.stringify({
      type: 'user',
      role,
      emailAddress: email,
    }),
  ]);
};

/** List files inside a Drive folder. */
export const listFolderContents = async (folderId) => {
  return run([
    'drive', 'files', 'list',
    '--params', JSON.stringify({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id,name,mimeType,modifiedTime)',
    }),
  ]);
};

/** Clear all body content from a Google Doc (for re-rendering). */
export const clearDocumentBody = async (documentId) => {
  const doc = await getDocument(documentId);
  const endIndex = doc?.body?.content?.slice(-1)?.[0]?.endIndex;
  if (!endIndex || endIndex <= 2) return; // already empty

  return batchUpdate(documentId, [
    {
      deleteContentRange: {
        range: { startIndex: 1, endIndex: endIndex - 1 },
      },
    },
  ]);
};
