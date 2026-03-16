import { DocBuilder } from './_helpers.js';

/**
 * Build a Google Doc for the Job Search Execution artifact.
 *
 * @param {object} content - { intent_summary: string, stages: { step: number, title: string, status: 'ready' | 'planned' | 'blocked', description: string }[] }
 * @param {object} clientMeta - { displayName: string, email: string }
 * @returns {DocBuilder}
 */
export default function buildCjsExecution(content, clientMeta) {
  const doc = new DocBuilder();

  doc.brandHeader(clientMeta.displayName, 'Job Search Execution');

  doc.paragraph(content.intent_summary);

  if (content.stages?.length) {
    doc.heading('Execution Stages', 2);
    for (const stage of content.stages) {
      doc.heading(`Stage ${stage.step}: ${stage.title} [${stage.status}]`, 3);
      doc.paragraph(stage.description);
    }
  }

  return doc;
}
