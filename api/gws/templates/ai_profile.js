import { DocBuilder } from './_helpers.js';

/**
 * Build a Google Doc for the AI Positioning artifact.
 *
 * @param {object} content - { positioning: string, how_to_use_ai: string[], guardrails: string[] }
 * @param {object} clientMeta - { displayName: string, email: string }
 * @returns {DocBuilder}
 */
export default function buildAiProfile(content, clientMeta) {
  const doc = new DocBuilder();

  doc.brandHeader(clientMeta.displayName, 'AI Positioning');

  doc.paragraph(content.positioning);

  doc.heading('How to Use AI', 2);
  // Numbered list via individual paragraphs with numbering prefix
  if (content.how_to_use_ai?.length) {
    for (let i = 0; i < content.how_to_use_ai.length; i++) {
      doc.paragraph(`${i + 1}. ${content.how_to_use_ai[i]}`);
    }
  }

  doc.section('Guardrails', content.guardrails);

  return doc;
}
