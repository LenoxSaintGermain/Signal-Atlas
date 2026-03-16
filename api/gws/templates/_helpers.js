/**
 * Google Docs API batchUpdate request builders.
 *
 * The Docs API uses index-based insertion — content is inserted at a numeric
 * position and everything after it shifts. We build requests in *reading order*
 * and then reverse them so insertions at the same starting index produce the
 * correct final layout.
 */

// ─── Index Tracker ──────────────────────────────────────────────────────────

/**
 * Accumulates requests in reading order, then reverses them for the Docs API.
 * All insert helpers push to an internal array; call `build()` to get the
 * final request list.
 */
export class DocBuilder {
  constructor() {
    /** @type {object[]} */
    this._requests = [];
  }

  /** Append raw request object(s). */
  push(...reqs) {
    this._requests.push(...reqs);
  }

  /** Return the final request array (reversed for index-1 insertion). */
  build() {
    return [...this._requests].reverse();
  }

  // ─── Convenience methods ────────────────────────────────────────────────

  heading(text, level = 1) {
    this.push(
      { insertText: { location: { index: 1 }, text: text + '\n' } },
      {
        updateParagraphStyle: {
          range: { startIndex: 1, endIndex: 1 + text.length + 1 },
          paragraphStyle: { namedStyleType: `HEADING_${level}` },
          fields: 'namedStyleType',
        },
      },
    );
  }

  paragraph(text) {
    if (!text) return;
    this.push({ insertText: { location: { index: 1 }, text: text + '\n' } });
  }

  /** Insert a bulleted list. Each item becomes a paragraph with a bullet. */
  bulletList(items) {
    if (!items?.length) return;
    for (const item of items) {
      this.push(
        { insertText: { location: { index: 1 }, text: item + '\n' } },
        {
          createParagraphBullets: {
            range: { startIndex: 1, endIndex: 1 + item.length + 1 },
            bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE',
          },
        },
      );
    }
  }

  /** Insert a checklist (tasks with done status). */
  checklist(items) {
    if (!items?.length) return;
    for (const item of items) {
      const label = typeof item === 'string' ? item : item.label || item.id || '';
      const done = typeof item === 'object' ? item.done : false;
      const prefix = done ? '\u2611 ' : '\u2610 ';
      const text = prefix + label;
      this.push(
        { insertText: { location: { index: 1 }, text: text + '\n' } },
        {
          createParagraphBullets: {
            range: { startIndex: 1, endIndex: 1 + text.length + 1 },
            bulletPreset: 'BULLET_CHECKBOX',
          },
        },
      );
    }
  }

  /** Insert a simple table with headers and rows. */
  table(headers, rows) {
    if (!headers?.length) return;
    const numRows = (rows?.length || 0) + 1; // +1 for header
    const numCols = headers.length;

    this.push({
      insertTable: {
        rows: numRows,
        columns: numCols,
        location: { index: 1 },
      },
    });

    // We'll populate the table after creation using a separate batch update.
    // For now, store the data so the caller can use populateTable().
    this._pendingTable = { headers, rows: rows || [] };
  }

  /** Insert a horizontal rule. */
  divider() {
    this.push({ insertText: { location: { index: 1 }, text: '\u2500'.repeat(40) + '\n' } });
  }

  /** Insert branded header block. */
  brandHeader(clientName, artifactTitle, date) {
    const dateLine = date || new Date().toISOString().split('T')[0];
    this.heading(`${artifactTitle}`, 1);
    if (clientName) this.paragraph(`Prepared for ${clientName}`);
    this.paragraph(`Generated ${dateLine} · Career Concierge OS`);
    this.divider();
  }

  /** Insert a key-value summary line. */
  keyValue(key, value) {
    if (!value) return;
    this.push({
      insertText: { location: { index: 1 }, text: `${key}: ${value}\n` },
    });
  }

  /** Insert a section with heading + bullet list. */
  section(title, items, level = 2) {
    if (!items?.length) return;
    this.heading(title, level);
    this.bulletList(items);
  }
}
