import { DocBuilder } from './_helpers.js';

/**
 * Build a Google Doc for the 72-Hour Plan artifact.
 *
 * @param {object} content - { next_72_hours: { id: string, label: string, done: boolean }[], next_2_weeks: { goal: string, cadence: string[] }, needs_from_you: string[] }
 * @param {object} clientMeta - { displayName: string, email: string }
 * @returns {DocBuilder}
 */
export default function buildPlan(content, clientMeta) {
  const doc = new DocBuilder();

  doc.brandHeader(clientMeta.displayName, '72-Hour Plan');

  doc.heading('72-Hour Sprint', 2);
  doc.checklist(content.next_72_hours);

  doc.heading('2-Week Roadmap', 2);
  if (content.next_2_weeks) {
    doc.paragraph(content.next_2_weeks.goal);
    doc.bulletList(content.next_2_weeks.cadence);
  }

  doc.section('What We Need From You', content.needs_from_you);

  return doc;
}
