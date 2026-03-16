import { DocBuilder } from './_helpers.js';

/**
 * Build a Google Doc for the Suite Distilled (Strategic Map) artifact.
 *
 * @param {object} content - Suite Distilled / Command Center content
 * @param {object} clientMeta - { displayName: string, email: string }
 * @returns {DocBuilder}
 */
export default function buildSuiteDistilled(content, clientMeta) {
  const doc = new DocBuilder();

  doc.brandHeader(clientMeta.displayName, content.title || 'Command Center');

  if (content.strategy_thesis) {
    doc.heading(content.title || 'Your Command Center', 1);
    doc.paragraph(content.strategy_thesis);
  }

  if (content.market_frame) {
    doc.section('Market Frame', [
      content.market_frame.market_sentiment_summary,
      content.market_frame.what_changed,
      content.market_frame.freshness_note,
      ...(content.market_frame.hot_skill_premiums || []),
    ]);
  } else {
    doc.section('What I Learned', content.what_i_learned);
  }

  if (content.positioning_matrix) {
    doc.section('Positioning Matrix', [
      `${content.positioning_matrix.current_state}: ${content.positioning_matrix.rationale}`,
      content.positioning_matrix.demand_strength,
      content.positioning_matrix.proof_strength,
      content.positioning_matrix.narrative_strength,
      `Target state: ${content.positioning_matrix.next_state_target}`,
    ]);
  } else {
    doc.section('What Needs to Happen', content.what_needs_to_happen);
  }

  if (content.surgical_ai_playbooks) {
    doc.section('Surgical AI Playbooks', [
      ...(content.surgical_ai_playbooks.proxy_interview_playbook || []),
      ...(content.surgical_ai_playbooks.narrative_shaping_playbook || []),
    ]);
  }

  if (content.living_sequence?.next_72_hours?.length) {
    doc.heading('Next 72 Hours', 2);
    doc.checklist(content.living_sequence.next_72_hours);
  } else if (content.next_to_do?.length) {
    doc.heading('Next Actions', 2);
    doc.checklist(content.next_to_do);
  }

  if (content.advisor_bridge?.strategic_questions?.length) {
    doc.section('Advisor Bridge', content.advisor_bridge.strategic_questions);
  }

  return doc;
}
