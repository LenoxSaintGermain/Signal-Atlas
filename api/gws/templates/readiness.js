import { DocBuilder } from './_helpers.js';

/**
 * Build a Google Doc for the AI Readiness Report artifact.
 *
 * @param {object} content - { executive_overview: string[], from_awareness_to_action: string[], targeted_ai_development_priorities: string[], technical_development_areas: string[], tier_recommendation: 'Foundation' | 'Select' | 'Premier' }
 * @param {object} clientMeta - { displayName: string, email: string }
 * @returns {DocBuilder}
 */
export default function buildReadiness(content, clientMeta) {
  const doc = new DocBuilder();

  doc.brandHeader(clientMeta.displayName, 'AI Readiness Report');

  doc.keyValue('Tier Recommendation', content.tier_recommendation);

  doc.section('Executive Overview', content.executive_overview);

  doc.section('From Awareness to Action', content.from_awareness_to_action);

  doc.section('Targeted AI Development Priorities', content.targeted_ai_development_priorities);

  doc.section('Technical Development Areas', content.technical_development_areas);

  return doc;
}
