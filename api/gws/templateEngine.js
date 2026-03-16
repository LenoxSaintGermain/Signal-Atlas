import buildBrief from './templates/brief.js';
import buildSuiteDistilled from './templates/suite_distilled.js';
import buildProfile from './templates/profile.js';
import buildAiProfile from './templates/ai_profile.js';
import buildGaps from './templates/gaps.js';
import buildReadiness from './templates/readiness.js';
import buildCjsExecution from './templates/cjs_execution.js';
import buildPlan from './templates/plan.js';
import buildResumeReview from './templates/resume_review.js';
import buildSearchStrategy from './templates/search_strategy.js';

const TEMPLATE_MAP = {
  brief: buildBrief,
  suite_distilled: buildSuiteDistilled,
  profile: buildProfile,
  ai_profile: buildAiProfile,
  gaps: buildGaps,
  readiness: buildReadiness,
  cjs_execution: buildCjsExecution,
  plan: buildPlan,
  resume_review: buildResumeReview,
  search_strategy: buildSearchStrategy,
};

/**
 * Build a Google Docs batchUpdate request array for a given artifact.
 *
 * @param {string} artifactType — one of the ArtifactType keys
 * @param {object} content — artifact content matching the type's interface
 * @param {{ displayName?: string, email?: string }} clientMeta
 * @returns {object[]} Google Docs API batchUpdate requests
 */
export const buildDocRequests = (artifactType, content, clientMeta) => {
  const builder = TEMPLATE_MAP[artifactType];
  if (!builder) {
    throw new Error(`No Google Docs template for artifact type: ${artifactType}`);
  }
  const doc = builder(content || {}, clientMeta || {});
  return doc.build();
};

/** Check whether a template exists for the given artifact type. */
export const hasTemplate = (artifactType) => artifactType in TEMPLATE_MAP;

/** List all supported artifact types. */
export const supportedTypes = () => Object.keys(TEMPLATE_MAP);
