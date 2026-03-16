import { DocBuilder } from './_helpers.js';

/**
 * Build a Google Doc for the Skill Gaps Analysis artifact.
 *
 * @param {object} content - { near_term: string[], for_target_role: string[], constraints: string[] }
 * @param {object} clientMeta - { displayName: string, email: string }
 * @returns {DocBuilder}
 */
export default function buildGaps(content, clientMeta) {
  const doc = new DocBuilder();

  doc.brandHeader(clientMeta.displayName, 'Skill Gaps Analysis');

  doc.section('Near-Term Gaps', content.near_term);
  doc.section('For Target Role', content.for_target_role);
  doc.section('Constraints', content.constraints);

  return doc;
}
