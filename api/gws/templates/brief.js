import { DocBuilder } from './_helpers.js';

/**
 * Build a Google Doc for The Brief artifact.
 *
 * @param {object} content - See BriefContent interface
 * @param {object} clientMeta - { displayName: string, email: string }
 * @returns {DocBuilder}
 */
export default function buildBrief(content, clientMeta) {
  const doc = new DocBuilder();

  doc.brandHeader(clientMeta.displayName, 'The Brief');

  // Thesis
  if (content.thesis) {
    doc.paragraph(content.thesis);
  }

  // Executive Summary
  doc.section('Executive Summary', content.executive_summary);

  doc.divider();

  // What I Learned
  doc.section('What I Learned', content.learned);

  // What Matters Most
  doc.section('What Matters Most', content.needle);

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

  // Compensation Ladder
  if (content.compensation_ladder?.length) {
    doc.heading('Compensation Ladder', 2);
    const ladderItems = content.compensation_ladder.map(
      (r) => `${r.grade} — ${r.label}: ${r.detail}`,
    );
    doc.bulletList(ladderItems);
  }

  // Evidence Ledger
  if (content.evidence_ledger) {
    doc.heading('Evidence Ledger', 2);
    doc.section('Observed', content.evidence_ledger.observed, 3);
    doc.section('Inferred', content.evidence_ledger.inferred, 3);
    doc.section('External', content.evidence_ledger.external, 3);
  }

  // 72-Hour Actions
  if (content.next_72_hours?.length) {
    doc.heading('72-Hour Actions', 2);
    doc.checklist(content.next_72_hours);
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
