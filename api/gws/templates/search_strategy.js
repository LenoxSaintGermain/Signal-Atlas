import { DocBuilder } from './_helpers.js';

/**
 * Build a Google Doc for the Search Strategy artifact.
 *
 * @param {object} content - { headline: string, channels: string[], weekly_actions: string[], proof_points: string[] }
 * @param {object} clientMeta - { displayName: string, email: string }
 * @returns {DocBuilder}
 */
export default function buildSearchStrategy(content, clientMeta) {
  const doc = new DocBuilder();

  doc.brandHeader(clientMeta.displayName, 'Search Strategy');

  doc.paragraph(content.headline);

  doc.section('Channels', content.channels);
  doc.section('Weekly Actions', content.weekly_actions);
  doc.section('Proof Points', content.proof_points);

  return doc;
}
