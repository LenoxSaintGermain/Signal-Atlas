import { DocBuilder } from './_helpers.js';

/**
 * Build a Google Doc for the Professional DNA (Profile) artifact.
 *
 * @param {object} content - See ProfileContent interface
 * @param {object} clientMeta - { displayName: string, email: string }
 * @returns {DocBuilder}
 */
export default function buildProfile(content, clientMeta) {
  const doc = new DocBuilder();

  doc.brandHeader(clientMeta.displayName, 'Professional DNA');

  // Thesis
  if (content.thesis) {
    doc.paragraph(content.thesis);
  }

  // Case Summary
  if (content.case_summary) {
    doc.heading('Case Summary', 2);
    doc.keyValue('Current Identity', content.case_summary.current_identity);
    doc.keyValue('Target Identity', content.case_summary.target_identity);
    if (content.case_summary.constraints?.length) {
      doc.heading('Constraints', 3);
      doc.bulletList(content.case_summary.constraints);
    }
    if (content.case_summary.report_thesis) {
      doc.paragraph(content.case_summary.report_thesis);
    }
  }

  // Core sections
  doc.section('Strengths', content.strengths);
  doc.section('Patterns', content.patterns);
  doc.section('Leverage', content.leverage);

  // Genome Markers
  if (content.genome_markers?.length) {
    doc.heading('Genome Markers', 2);
    const markerItems = content.genome_markers.map(
      (m) => `${m.label} (${m.band}, ${m.score}): ${m.interpretation}`,
    );
    doc.bulletList(markerItems);
  }

  // Behavioral Propensities
  if (content.behavioral_propensities?.length) {
    doc.heading('Behavioral Propensities', 2);
    const propItems = content.behavioral_propensities.map(
      (p) => `${p.label} — ${p.finding}. Implication: ${p.implication}`,
    );
    doc.bulletList(propItems);
  }

  // Pressure Response
  if (content.pressure_response?.length) {
    doc.heading('Pressure Response', 2);
    const pressureItems = content.pressure_response.map(
      (p) => `${p.label} — ${p.finding}. Implication: ${p.implication}`,
    );
    doc.bulletList(pressureItems);
  }

  // Environmental Fit
  if (content.environmental_fit) {
    const fit = content.environmental_fit;
    doc.heading('Environmental Fit', 2);
    doc.section('Advantaged In', fit.advantaged_in, 3);
    doc.section('Punished In', fit.punished_in, 3);
    doc.section('Adjacency Paths', fit.adjacency_paths, 3);
    doc.section('Recommended Habitat', fit.recommended_habitat, 3);
  }

  // Market Climate
  if (content.market_climate) {
    const mc = content.market_climate;
    doc.heading('Market Climate', 2);
    if (mc.summary) {
      doc.paragraph(mc.summary);
    }
    doc.section('National Signals', mc.national_signals, 3);
    doc.section('Occupation Signals', mc.occupation_signals, 3);
    doc.section('Geography Signals', mc.geography_signals, 3);
    doc.section('Company Posture Notes', mc.company_posture_notes, 3);
  }

  // Compensation Position
  if (content.compensation_position) {
    const cp = content.compensation_position;
    doc.heading('Compensation Position', 2);
    doc.keyValue('Market Value Range', cp.market_value_range);
    doc.keyValue('Target Ask', cp.target_ask);
    if (cp.ask_justification_receipt?.length) {
      doc.heading('Ask Justification', 3);
      doc.bulletList(cp.ask_justification_receipt);
    }
  }

  // Extinction Risks & Adaptive Assets
  doc.section('Extinction Risks', content.extinction_risks);
  doc.section('Adaptive Assets', content.adaptive_assets);

  // Lean Into / Let Go / Build Next
  doc.section('Lean Into', content.lean_into);
  doc.section('Let Go', content.let_go);
  doc.section('Build Next', content.build_next);

  // Evolution Path — 90 Days
  doc.section('Evolution Path — 90 Days', content.evolution_path_90_days);

  // Signal Strip
  if (content.signal_strip?.length) {
    doc.heading('Signal Strip', 2);
    const stripItems = content.signal_strip.map(
      (s) => `${s.label}: ${s.value} (${s.tone})`,
    );
    doc.bulletList(stripItems);
  }

  // Market Signal
  if (content.market_signal) {
    doc.heading('Market Signal', 2);
    doc.keyValue('Composite Score', content.market_signal.composite_score);
    doc.keyValue('Momentum', content.market_signal.momentum_label);
    if (content.market_signal.breakdown?.length) {
      const breakdownItems = content.market_signal.breakdown.map(
        (b) => `${b.label} (${b.tone}, ${b.score}): ${b.rationale}`,
      );
      doc.bulletList(breakdownItems);
    }
  }

  // Report Ticker footer
  if (content.report_ticker) {
    doc.divider();
    const ticker = content.report_ticker;
    const parts = [
      ticker.generated_at && `Generated: ${ticker.generated_at}`,
      ticker.model_version && `Model: ${ticker.model_version}`,
      ticker.confidence_rating && `Confidence: ${ticker.confidence_rating}`,
      ticker.evidence_nodes && `Evidence Nodes: ${ticker.evidence_nodes}`,
    ].filter(Boolean);
    if (parts.length) {
      doc.paragraph(parts.join(' · '));
    }
  }

  return doc;
}
