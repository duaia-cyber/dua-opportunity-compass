const MAX_TEXT_LENGTH = 150000;
const MAX_URL_LENGTH = 2048;
const MAX_NOTES_COUNT = 200;
const MAX_NOTE_LENGTH = 1000;
const MAX_INPUT_SIZE = 600000;
const REVIEWED_ID_PATTERN = /^item_\d{1,6}_[a-z]{1,30}$/;
const READY_ID_PATTERN = /^need_\d{1,6}_\d{1,3}$/;

// Page map: 1-based line numbers where each PDF page starts, strictly ascending, first page at line 1.
function validatePages(pages) {
  if (pages === undefined) return true;
  if (!Array.isArray(pages) || pages.length > 2000) return false;
  if (pages.length && pages[0] !== 1) return false;
  return pages.every((line, index) => Number.isInteger(line) && line >= 1 && line <= 999999 && (index === 0 || line > pages[index - 1]));
}

function validateReady(ready) {
  if (ready === undefined) return true;
  return Array.isArray(ready) && ready.length <= 200 && ready.every((id) => typeof id === 'string' && READY_ID_PATTERN.test(id));
}

function isValidUrl(url) {
  if (typeof url !== 'string') return false;
  if (url.length > MAX_URL_LENGTH) return false;
  if (url === '') return true;
  try { const parsed = new URL(url); return ['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password; }
  catch { return false; }
}

function validateNotes(notes) {
  if (typeof notes !== 'object' || notes === null || Array.isArray(notes)) {
    return false;
  }
  const keys = Object.keys(notes);
  if (keys.length > MAX_NOTES_COUNT) return false;
  for (const key of keys) {
    if (!REVIEWED_ID_PATTERN.test(key)) return false;
    if (typeof notes[key] !== 'string' || notes[key].length > MAX_NOTE_LENGTH) return false;
  }
  return true;
}

export function encodeWorkspace(workspace) {
  if (!workspace || typeof workspace !== 'object' || Array.isArray(workspace)) throw new Error('Invalid workspace');
  if (typeof workspace.text !== 'string' || workspace.text.length > MAX_TEXT_LENGTH) {
    throw new Error('Invalid text');
  }
  if (typeof workspace.previousText !== 'string' || workspace.previousText.length > MAX_TEXT_LENGTH) {
    throw new Error('Invalid previousText');
  }
  if (!isValidUrl(workspace.url)) {
    throw new Error('Invalid url');
  }
  if (!Array.isArray(workspace.reviewed) || workspace.reviewed.length > 200) {
    throw new Error('Invalid reviewed');
  }
  for (const id of workspace.reviewed) {
    if (typeof id !== 'string' || !REVIEWED_ID_PATTERN.test(id)) {
      throw new Error('Invalid reviewed id');
    }
  }
  if (!validateNotes(workspace.notes)) {
    throw new Error('Invalid notes');
  }
  if (!validateReady(workspace.ready)) throw new Error('Invalid ready');
  if (!validatePages(workspace.pages)) throw new Error('Invalid pages');

  const encoded = JSON.stringify({
    version: 2,
    text: workspace.text,
    previousText: workspace.previousText,
    url: workspace.url,
    reviewed: workspace.reviewed,
    notes: workspace.notes,
    ready: workspace.ready || [],
    pages: workspace.pages || []
  });
  if (new TextEncoder().encode(encoded).length > MAX_INPUT_SIZE) throw new Error('Workspace too large');
  return encoded;
}

export function decodeWorkspace(input) {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  if (new TextEncoder().encode(input).length > MAX_INPUT_SIZE) {
    throw new Error('Input too large');
  }

  let data;
  try {
    data = JSON.parse(input);
  } catch (e) {
    throw new Error('Invalid JSON');
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error('Invalid workspace structure');
  }
  const allowed = new Set(['version','text','previousText','url','reviewed','notes','ready','pages']);
  if (Object.keys(data).some((key) => !allowed.has(key))) throw new Error('Unexpected key');

  if (data.version !== 1 && data.version !== 2) {
    throw new Error('Unsupported version');
  }

  if (typeof data.text !== 'string' || data.text.length > MAX_TEXT_LENGTH) {
    throw new Error('Invalid text');
  }
  if (typeof data.previousText !== 'string' || data.previousText.length > MAX_TEXT_LENGTH) {
    throw new Error('Invalid previousText');
  }
  if (!isValidUrl(data.url)) {
    throw new Error('Invalid url');
  }
  if (!Array.isArray(data.reviewed) || data.reviewed.length > 200) {
    throw new Error('Invalid reviewed');
  }
  for (const id of data.reviewed) {
    if (typeof id !== 'string' || !REVIEWED_ID_PATTERN.test(id)) {
      throw new Error('Invalid reviewed id');
    }
  }
  if (!validateNotes(data.notes)) {
    throw new Error('Invalid notes');
  }
  if (data.version === 1 && (data.ready !== undefined || data.pages !== undefined)) throw new Error('Unexpected key');
  if (!validateReady(data.ready)) throw new Error('Invalid ready');
  if (!validatePages(data.pages)) throw new Error('Invalid pages');

  return {
    text: data.text,
    previousText: data.previousText,
    url: data.url,
    reviewed: data.reviewed,
    notes: data.notes,
    ready: data.ready || [],
    pages: data.pages || []
  };
}
