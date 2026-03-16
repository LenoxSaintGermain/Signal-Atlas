import { DocBuilder } from './_helpers.js';

/**
 * Build a Google Doc for the Resume Review artifact.
 *
 * @param {object} content - { summary: string, role_alignment_score: number, strengths: string[], gaps: string[], rewrite_focus: string[] }
 * @param {object} clientMeta - { displayName: string, email: string }
 * @returns {DocBuilder}
 */
export default function buildResumeReview(content, clientMeta) {
  const doc = new DocBuilder();

  doc.brandHeader(clientMeta.displayName, 'Resume Review');

  doc.paragraph(content.summary);

  if (content.role_alignment_score != null) {
    doc.keyValue('Role Alignment Score', `${content.role_alignment_score}/100`);
  }

  doc.section('Strengths', content.strengths);
  doc.section('Gaps', content.gaps);
  doc.section('Rewrite Focus', content.rewrite_focus);

  return doc;
}
