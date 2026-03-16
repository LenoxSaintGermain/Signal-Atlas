import {
  BriefContent,
  CjsExecutionContent,
  IntakeAnswers,
  PlanContent,
  ReadinessContent,
  SuiteDistilledContent,
} from '../types';

const nonEmpty = (s: unknown) => String(s ?? '').trim();
const asList = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
const resolveCurrentTitle = (answers: IntakeAnswers) =>
  nonEmpty(answers.current_title || answers.current_or_target_job_title) || 'your current role';
const resolveTargetRole = (answers: IntakeAnswers) =>
  nonEmpty(answers.target || answers.current_or_target_job_title) || 'your next role';
const resolveIndustry = (answers: IntakeAnswers) => nonEmpty(answers.industry) || 'your industry';

export const generateBrief = (answers: IntakeAnswers): BriefContent => {
  const currentTitle = resolveCurrentTitle(answers);
  const industry = resolveIndustry(answers);
  const target = resolveTargetRole(answers);
  const today = new Date().toISOString().slice(0, 10);

  return {
    adaptation_verdict: 'Viable with adaptation pressure.',
    thesis: `Your profile can move from ${currentTitle} toward ${target}, but the market will reward clearer proof and stronger positioning discipline before it rewards ambition alone.`,
    primary_opportunity: `Use ${industry} context as proof of domain credibility while repositioning around ${target}.`,
    primary_risk: 'Broad ambition without hard evidence will read as narrative inflation.',
    recommended_habitat: 'Mid-market or transformation-heavy teams that reward visible operators with strategic range.',
    compensation_posture: 'Ask should rise only when proof, role-fit, and negotiation posture are aligned.',
    learned: [
      `You are reallocating from ${currentTitle} toward ${target}.`,
      `Your market context is ${industry}, and specificity will outperform volume.`,
      'Your edge increases when each action has an explicit decision target.',
    ],
    needle: [
      'Convert experience into proof that survives executive scrutiny.',
      'Protect optionality by concentrating effort on high-leverage moves.',
      'Use AI to structure work, not to manufacture credibility.',
    ],
    next_72_hours: [
      { id: 'n72-1', label: 'Build a verified evidence list: outcomes, scope, and metrics.', done: false },
      { id: 'n72-2', label: 'Define one target lane and remove adjacent noise.', done: false },
      { id: 'n72-3', label: 'Draft a concise positioning statement for stakeholder-facing use.', done: false },
    ],
    executive_summary: [
      `The market can understand your move if you package ${currentTitle} experience as decision-grade evidence, not general ambition.`,
      `The fastest path to credibility is not more activity. It is tighter proof, stronger role naming, and better compensation posture.`,
      `You are better suited to selective, evidence-led moves than broad-volume application behavior.`,
    ],
    market_receipt: [
      'Current market conditions reward fit, proof, and clear scope more than generalized potential.',
      'The top end of a compensation ask requires visible evidence, not only narrative confidence.',
      'Geography, title scope, and sector posture will move your range materially.',
    ],
    evidence_ledger: {
      observed: [
        `Current role signal: ${currentTitle}.`,
        `Target direction signal: ${target}.`,
        `Industry context: ${industry}.`,
      ],
      inferred: [
        'Execution quality appears stronger than visible market signaling.',
        'This profile is likely advantaged by clarity, rhythm, and defined operating scope.',
      ],
      external: [
        'The labor market is selective rather than loose.',
        'Compensation upside concentrates around proof, scope, and environment fit.',
      ],
    },
    signal_strip: [
      { id: 'market_fit', label: 'Market Fit', value: '73', detail: 'Role-habitat fit under selective market conditions.', tone: 'strong' },
      { id: 'signal_clarity', label: 'Signal Clarity', value: '41', detail: 'How quickly the market can understand the case.', tone: 'risk' },
      { id: 'comp_index', label: 'Comp Index', value: 'B+', detail: 'Current compensation posture justified by visible proof.', tone: 'watch' },
      { id: 'adapt_pressure', label: 'Adapt Pressure', value: 'HIGH', detail: 'Pressure imposed by evidence gaps and market selectivity.', tone: 'risk' },
      { id: 'live_dossier', label: 'Live Dossier', value: 'ACTIVE', detail: 'Refreshable research document, not a static quiz result.', tone: 'strong' },
    ],
    market_signal: {
      composite_score: 57,
      momentum_label: 'Signal mixed',
      trajectory_type: 'projection',
      trajectory_basis: 'Projection path from current signal quality toward a more credible market ask.',
      trajectory: [
        { label: 'Current', score: 49 },
        { label: 'Narrative', score: 58 },
        { label: 'Proof', score: 63 },
        { label: 'Ceiling', score: 76 },
      ],
      breakdown: [
        { id: 'narrative_clarity', label: 'Narrative Clarity', score: 41, tone: 'risk', rationale: 'Legibility to the market is still thin.', evidence: 'inferred' },
        { id: 'market_demand_fit', label: 'Market Demand Fit', score: 73, tone: 'strong', rationale: 'Operator demand still exists where proof is visible.', evidence: 'external' },
        { id: 'network_capital', label: 'Network Capital', score: 55, tone: 'watch', rationale: 'Leverage exists but is not yet fully market-facing.', evidence: 'inferred' },
        { id: 'proof_density', label: 'Proof Density', score: 38, tone: 'risk', rationale: 'Receipts and measurable outcomes are not yet packaged hard enough.', evidence: 'observed' },
      ],
    },
    compensation_ladder: [
      { id: 'current', label: 'Current', grade: 'B+', detail: '$145k-$185k total compensation, pending geography, scope, and proof density.' },
      { id: 'narrative_adjusted', label: 'Narrative-Adjusted', grade: 'A-', detail: '$172k target ask with room to trade on title, scope, or bonus structure.' },
      { id: 'market_ceiling', label: 'Market Ceiling', grade: 'A+', detail: 'Ceiling if proof density, environment fit, and market positioning tighten together.' },
    ],
    report_ticker: {
      generated_at: today,
      model_version: 'dna-report-v2',
      evidence_nodes: 6,
      confidence_rating: '72 / 100',
      next_review_date: today,
      source_snapshot_date: '2026-03-10',
      source_count: 5,
      update_cadence: '14-day review',
    },
  };
};

export const generatePlan = (answers: IntakeAnswers): PlanContent => {
  const target = resolveTargetRole(answers);

  const next72 = [
    { id: 'p72-1', label: 'Confirm your constraints (location, time, salary floor).', done: false },
    { id: 'p72-2', label: 'Create a one-page “evidence inventory” (projects, wins, metrics).', done: false },
    { id: 'p72-3', label: `Choose 1 role story: why ${target} makes sense for you now.`, done: false },
  ];

  return {
    next_72_hours: next72,
    next_2_weeks: {
      goal: 'Increase career optionality through disciplined positioning.',
      cadence: [
        'Two focused outreach actions with explicit asks.',
        'One public credibility artifact tied to your target lane.',
        'One decision review: what changed the math this week.',
      ],
    },
    needs_from_you: [
      'Current resume or equivalent fact set.',
      'Target opportunities ranked by strategic fit.',
    ],
  };
};

export const generateProfileDoc = (answers: IntakeAnswers) => {
  const workStyle = nonEmpty(answers.work_style);
  const pressure = nonEmpty(answers.pressure_breaks);
  const currentTitle = resolveCurrentTitle(answers);
  const target = resolveTargetRole(answers);
  const industry = resolveIndustry(answers);
  const constraints = nonEmpty(answers.constraints);
  const today = new Date().toISOString();

  return {
    strengths: [
      'You favor clear thinking over performative busyness.',
      'You can operate inside constraints without losing quality.',
      'You compound progress through repeatable systems.',
    ],
    patterns: [
      pressure ? `Pressure pattern: ${pressure.toLowerCase()}.` : 'Pressure pattern: decision load rises before clarity.',
      workStyle ? `Stabilizer: ${workStyle.toLowerCase()}.` : 'Stabilizer: short execution cycles with explicit outputs.',
    ],
    leverage: [
      'Turn recurring work into reusable strategic assets.',
      'Translate execution history into board-readable proof.',
      'Use concise language to reduce friction in high-stakes decisions.',
    ],
    report_version: 'dna-report-v1',
    generated_at: today,
    section_order: [
      'case_summary',
      'genome_markers',
      'behavioral_propensities',
      'pressure_response',
      'environmental_fit',
      'market_climate',
      'compensation_position',
      'extinction_risks',
      'adaptive_assets',
      'lean_into',
      'let_go',
      'build_next',
      'evolution_path_90_days',
    ],
    thesis: `Your advantage sits in disciplined execution and strategic translation, but your market value will rise only when those traits are packaged for ${target}.`,
    target_environment: `${target} in ${industry}, with preference for teams that reward visible ownership and pragmatic AI fluency.`,
    case_summary: {
      current_identity: currentTitle,
      target_identity: target,
      constraints: constraints ? [constraints] : ['Constraint register still needs refinement.'],
      report_thesis:
        'This profile is credible for upward movement, but only if evidence, environment selection, and compensation positioning are tightened together.',
    },
    genome_markers: [
      {
        id: 'strategic_translation',
        label: 'Strategic Translation',
        score: 78,
        band: 'strong',
        interpretation: 'You likely make complexity legible for other people, which compounds in operator and cross-functional roles.',
        evidence: 'inferred',
      },
      {
        id: 'execution_reliability',
        label: 'Execution Reliability',
        score: 82,
        band: 'distinguished',
        interpretation: 'Your profile reads as dependable under pressure when scope is explicit.',
        evidence: 'observed',
      },
      {
        id: 'tooling_fluency',
        label: 'Tooling Fluency',
        score: 56,
        band: 'viable',
        interpretation: 'AI and tooling signal appears serviceable but not yet premium enough to command the top band alone.',
        evidence: 'inferred',
      },
      {
        id: 'market_signaling',
        label: 'Market Signaling',
        score: 49,
        band: 'emerging',
        interpretation: 'The likely gap is not raw capability. It is how clearly that capability is packaged for the market.',
        evidence: 'inferred',
      },
    ],
    behavioral_propensities: [
      {
        label: 'Operating style',
        finding: workStyle ? `You report a preferred work style of ${workStyle.toLowerCase()}.` : 'You appear to prefer structured movement over improvised chaos.',
        implication: 'This profile is likely strongest in environments with clear goals and visible ownership.',
        evidence: workStyle ? 'observed' : 'inferred',
      },
      {
        label: 'Decision posture',
        finding: 'You likely create value by reducing ambiguity for other people.',
        implication: 'That trait raises value in operationally messy teams and transformation mandates.',
        evidence: 'inferred',
      },
    ],
    pressure_response: [
      {
        label: 'Pressure pattern',
        finding: pressure ? `You describe your pressure pattern as ${pressure.toLowerCase()}.` : 'Pressure seems to increase once decision load outruns clarity.',
        implication: 'The report should prescribe tighter scoping and stronger evidence rituals rather than more raw volume.',
        evidence: pressure ? 'observed' : 'inferred',
      },
    ],
    environmental_fit: {
      advantaged_in: [
        'Mid-market teams with visible scope and imperfect systems.',
        'Cross-functional roles where translation and execution both matter.',
      ],
      punished_in: [
        'Prestige-heavy environments that require pre-packaged brand signal before capability can be seen.',
        'Highly political cultures where vague role boundaries conceal ownership.',
      ],
      adjacency_paths: [
        `Bridge from ${currentTitle} into ${target} through proof-led role reframing.`,
        'Use AI-fluency and systems thinking as leverage rather than as a complete reinvention story.',
      ],
      recommended_habitat: [
        'Transformation teams',
        'Mid-market operators',
        'Execution-heavy strategic functions',
      ],
    },
    market_climate: {
      summary:
        'The current labor market is selective. Strong asks still clear, but only when evidence, scope, and market fit are obvious.',
      national_signals: [
        'Payroll softness and cooling openings argue for selectivity over application volume.',
        'Hiring managers can afford to prefer proof over narrative.',
      ],
      occupation_signals: [
        `Roles adjacent to ${target} reward operators who can show measurable impact and practical AI adoption.`,
      ],
      geography_signals: [
        'Compensation and title velocity will differ materially by geography and company stage.',
      ],
      company_posture_notes: [
        'Some companies pay aggressively but extract that premium through churn and pace.',
        'Others underpay cash but improve title scope and survivability.',
      ],
    },
    compensation_position: {
      market_value_range: '$145k-$185k total compensation, pending geography, scope, and proof density.',
      target_ask: '$172k target ask with room to trade on title, scope, or bonus structure.',
      ask_justification_receipt: [
        'Operational reliability under pressure.',
        'Cross-functional communication leverage.',
        'Evidence of system building and repeated execution.',
      ],
      high_pay_habitats: [
        'Transformation-heavy product and operations roles.',
        'Companies paying for visible ownership rather than narrow task execution.',
      ],
      underpay_risk_habitats: [
        'Roles with inflated title and deflated scope.',
        'Companies using “mission” language to hide weak compensation bands.',
      ],
      negotiation_strategy: [
        'Lead with scope and measurable outcomes before numbers.',
        'Use role calibration and market comparisons, not personal need, to justify the ask.',
        'Trade compensation against title velocity and environment quality consciously, not accidentally.',
      ],
    },
    signal_strip: [
      { id: 'market_fit', label: 'Market Fit', value: '73', detail: 'Role-habitat fit under selective market conditions.', tone: 'strong' },
      { id: 'signal_clarity', label: 'Signal Clarity', value: '41', detail: 'How quickly the market can understand the case.', tone: 'risk' },
      { id: 'comp_index', label: 'Comp Index', value: 'B+', detail: 'Current compensation posture justified by visible proof.', tone: 'watch' },
      { id: 'adapt_pressure', label: 'Adapt Pressure', value: 'HIGH', detail: 'Pressure imposed by evidence gaps and market selectivity.', tone: 'risk' },
      { id: 'live_dossier', label: 'Live Dossier', value: 'ACTIVE', detail: 'Refreshable research document, not a static quiz result.', tone: 'strong' },
    ],
    market_signal: {
      composite_score: 57,
      momentum_label: 'Signal mixed',
      trajectory_type: 'projection',
      trajectory_basis: 'Projection path from current signal quality toward a more credible market ask.',
      trajectory: [
        { label: 'Current', score: 49 },
        { label: 'Narrative', score: 58 },
        { label: 'Proof', score: 63 },
        { label: 'Ceiling', score: 76 },
      ],
      breakdown: [
        { id: 'narrative_clarity', label: 'Narrative Clarity', score: 41, tone: 'risk', rationale: 'Legibility to the market is still thin.', evidence: 'inferred' },
        { id: 'market_demand_fit', label: 'Market Demand Fit', score: 73, tone: 'strong', rationale: 'Operator demand still exists where proof is visible.', evidence: 'external' },
        { id: 'network_capital', label: 'Network Capital', score: 55, tone: 'watch', rationale: 'Leverage exists but is not yet fully market-facing.', evidence: 'inferred' },
        { id: 'proof_density', label: 'Proof Density', score: 38, tone: 'risk', rationale: 'Receipts and measurable outcomes are not yet packaged hard enough.', evidence: 'observed' },
      ],
    },
    market_demand_analysis: {
      summary: 'Demand strength and personal fit are not the same variable. The strongest habitats are where both clear the threshold at the same time.',
      environments: [
        {
          id: 'transformation-teams',
          label: 'Transformation teams',
          demand_score: 74,
          fit_score: 82,
          compensation_band: '$145k-$185k total compensation, pending geography, scope, and proof density.',
          hiring_posture: 'Selective',
          rationale: 'The profile fits transformation-heavy teams that reward visible ownership and ambiguity reduction.',
          evidence: 'inferred',
        },
        {
          id: 'mid-market-operators',
          label: 'Mid-market operators',
          demand_score: 71,
          fit_score: 79,
          compensation_band: '$145k-$185k total compensation, pending geography, scope, and proof density.',
          hiring_posture: 'Healthy',
          rationale: 'Mid-market teams are more likely to reward strategic range and execution reliability.',
          evidence: 'inferred',
        },
        {
          id: 'companies-paying-for-visible-ownership',
          label: 'Companies paying for visible ownership',
          demand_score: 78,
          fit_score: 73,
          compensation_band: '$172k target ask with room to trade on title, scope, or bonus structure.',
          hiring_posture: 'Aggressive but selective',
          rationale: 'These environments can pay up when proof and scope are easy to verify.',
          evidence: 'external',
        },
        {
          id: 'roles-with-inflated-title-and-deflated-scope',
          label: 'Roles with inflated title and deflated scope',
          demand_score: 57,
          fit_score: 45,
          compensation_band: 'Scope may improve faster than cash.',
          hiring_posture: 'Budget-sensitive',
          rationale: 'These environments can look attractive while suppressing compensation and durable leverage.',
          evidence: 'inferred',
        },
      ],
    },
    compensation_ladder: [
      { id: 'current', label: 'Current', grade: 'B+', detail: '$145k-$185k total compensation, pending geography, scope, and proof density.' },
      { id: 'narrative_adjusted', label: 'Narrative-Adjusted', grade: 'A-', detail: '$172k target ask with room to trade on title, scope, or bonus structure.' },
      { id: 'market_ceiling', label: 'Market Ceiling', grade: 'A+', detail: 'Ceiling if proof density, environment fit, and market positioning tighten together.' },
    ],
    extinction_risks: [
      'Being interpreted as broadly capable but insufficiently packaged.',
      'Allowing proof to remain buried inside general experience language.',
      'Targeting brand-heavy environments without enough visible signal.',
    ],
    adaptive_assets: [
      'Clear thinking under pressure.',
      'Systems orientation.',
      'Cross-functional trust potential.',
      'High ability to turn repeatable work into reusable leverage.',
    ],
    lean_into: [
      'Proof-led positioning.',
      'Visible ownership and measurable scope.',
      'Roles where AI fluency compounds execution rather than replaces judgment.',
    ],
    let_go: [
      'Generic ambition language.',
      'Broad search behavior without one defined target lane.',
      'Confusing busy activity with strategic movement.',
    ],
    build_next: [
      'A concise proof portfolio.',
      'A role-calibrated positioning narrative.',
      'A compensation receipt tied to outcomes, scope, and market fit.',
    ],
    evolution_path_90_days: [
      'Weeks 1-2: tighten target lane, proof inventory, and constraints.',
      'Weeks 3-6: create two visible market-facing assets and test narrative fit.',
      'Weeks 7-12: push calibrated outreach and compensation conversations only where habitat fit is credible.',
    ],
    evidence_notes: [
      {
        class: 'observed',
        source_label: 'Smart Start Intake',
        note: 'Role, target direction, constraints, and stated work-style inputs come directly from intake.',
        confidence: 'high',
      },
      {
        class: 'inferred',
        source_label: 'Profile synthesis',
        note: 'Genome markers and pressure-response interpretations are directional, not psychometric diagnoses.',
        confidence: 'medium',
      },
      {
        class: 'external',
        source_label: 'Public labor snapshot',
        note: 'Market climate statements are based on current labor softness, compensation selectivity, and role-fit pressure.',
        confidence: 'medium',
      },
    ],
    source_registry: [
      {
        id: 'bls-employment-situation-feb-2026',
        label: 'BLS Employment Situation - February 2026',
        authority: 'government',
        url: 'https://www.bls.gov/news.release/archives/empsit_03062026.htm',
        as_of: '2026-03-06',
        coverage: 'National payrolls, unemployment, participation, and long-term unemployment.',
      },
      {
        id: 'bls-jolts-dec-2025',
        label: 'BLS Job Openings and Labor Turnover - December 2025',
        authority: 'government',
        url: 'https://www.bls.gov/news.release/archives/jolts_02052026.pdf',
        as_of: '2026-02-05',
        coverage: 'Job openings, hires, separations, quits, and layoffs.',
      },
      {
        id: 'smart-start-intake',
        label: 'Smart Start Intake',
        authority: 'client',
        as_of: today.slice(0, 10),
        coverage: 'Client-stated role, target, constraints, work style, and pressure patterns.',
      },
    ],
    evidence_nodes: [
      {
        id: 'observed-intake-role',
        title: 'Observed role and target',
        class: 'observed',
        source_label: 'Smart Start Intake',
        source_type: 'intake',
        statement: `Current role signal: ${currentTitle}. Target direction signal: ${target}.`,
        confidence: 'high',
      },
      {
        id: 'external-market-selective',
        title: 'External market selectivity',
        class: 'external',
        source_label: 'BLS Employment Situation - February 2026',
        source_type: 'government',
        source_url: 'https://www.bls.gov/news.release/archives/empsit_03062026.htm',
        statement: 'The labor market is selective rather than loose, so proof and scope matter more than generalized ambition.',
        confidence: 'medium',
      },
      {
        id: 'inferred-proof-gap',
        title: 'Inferred proof gap',
        class: 'inferred',
        source_label: 'Profile synthesis',
        source_type: 'artifact',
        statement: 'Execution quality appears stronger than visible market signaling and proof packaging.',
        confidence: 'medium',
      },
    ],
    report_ticker: {
      generated_at: today.slice(0, 10),
      model_version: 'dna-report-v2',
      evidence_nodes: 3,
      confidence_rating: '72 / 100',
      next_review_date: today.slice(0, 10),
      source_snapshot_date: '2026-03-10',
      source_count: 3,
      update_cadence: '14-day review',
    },
  };
};

export const generateAIProfileDoc = (answers: IntakeAnswers) => {
  const industry = resolveIndustry(answers);
  return {
    positioning: `In ${industry}, your advantage is disciplined signal extraction and controlled execution.`,
    how_to_use_ai: [
      'Condense raw notes into decision-grade briefs.',
      'Pressure-test messaging before stakeholder exposure.',
      'Standardize repeatable outputs with verification steps.',
    ],
    guardrails: [
      'No invented credentials or fabricated metrics.',
      'Prefer measured specificity over dramatic language.',
      'When uncertain, state assumptions and ask one clarifying question.',
    ],
  };
};

export const generateGapsDoc = (answers: IntakeAnswers) => {
  const target = resolveTargetRole(answers);
  const constraints = nonEmpty(answers.constraints);
  return {
    near_term: [
      'Proof points are not yet packaged for executive review.',
      'Positioning lane needs tighter exclusion criteria.',
      'Weekly cadence requires explicit leverage metrics.',
    ],
    for_target_role: [
      `Translate your experience into the operating language of ${target}.`,
      'Add one visible artifact that demonstrates decision quality.',
    ],
    constraints: constraints ? [`Constraint register: ${constraints}.`] : ['Constraint register is incomplete.'],
  };
};

export const generateSuiteDistilledDoc = (
  brief: BriefContent,
  answers: IntakeAnswers
): SuiteDistilledContent => {
  const currentTitle = resolveCurrentTitle(answers);
  const target = resolveTargetRole(answers);
  const industry = resolveIndustry(answers);
  const learned =
    Array.isArray(brief?.learned) && brief.learned.length
      ? brief.learned
      : Array.isArray(brief?.executive_summary) && brief.executive_summary.length
        ? brief.executive_summary
        : [
            `Your profile needs tighter packaging for ${target}.`,
            'The market is rewarding proof, scope, and clarity over broad activity.',
            'A smaller number of higher-signal moves will outperform generic volume.',
          ];
  const next72 =
    Array.isArray(brief?.next_72_hours) && brief.next_72_hours.length
      ? brief.next_72_hours
          .map((task, index) => ({
            id: String(task?.id || `distilled-${index + 1}`),
            label: String(task?.label || '').trim(),
            done: Boolean(task?.done),
          }))
          .filter((task) => task.label)
      : [
          { id: 'distilled-1', label: 'Build a verified evidence list with outcomes, scope, and metrics.', done: false },
          { id: 'distilled-2', label: 'Choose one target lane and remove adjacent noise.', done: false },
          { id: 'distilled-3', label: 'Draft a concise positioning statement for stakeholder-facing use.', done: false },
        ];

  const breakdown = Array.isArray(brief?.market_signal?.breakdown) ? brief.market_signal.breakdown : [];
  const findScore = (id: string, fallback: number) => {
    const match = breakdown.find((item) => item.id === id);
    return Number(match?.score ?? fallback);
  };
  const demandScore = findScore('market_demand_fit', 68);
  const proofScore = findScore('proof_density', 42);
  const narrativeScore = findScore('narrative_clarity', 46);

  const currentState =
    demandScore >= 70 && proofScore >= 65 && narrativeScore >= 60
      ? 'Leader'
      : demandScore >= 65 && (proofScore >= 45 || narrativeScore >= 45)
        ? 'Challenger'
        : demandScore >= 50
          ? 'Specialist'
          : 'At Risk';
  const nextStateTarget = currentState === 'Leader' ? 'Leader' : currentState === 'At Risk' ? 'Specialist' : 'Leader';
  const freshNote = brief?.report_ticker?.source_snapshot_date
    ? `Snapshot ${brief.report_ticker.source_snapshot_date} · ${brief.report_ticker.source_count || 0} sources · ${brief.report_ticker.update_cadence || 'periodic review'}.`
    : 'Internal strategy draft awaiting a source-backed market refresh.';
  const marketReceipt = Array.isArray(brief?.market_receipt) ? brief.market_receipt.filter(Boolean) : [];
  const observed = Array.isArray(brief?.evidence_ledger?.observed) ? brief.evidence_ledger.observed : [];
  const inferred = Array.isArray(brief?.evidence_ledger?.inferred) ? brief.evidence_ledger.inferred : [];
  const external = Array.isArray(brief?.evidence_ledger?.external) ? brief.evidence_ledger.external : [];
  const evidenceLedger = [
    ...observed.map((note, index) => ({
      label: `Observed ${index + 1}`,
      class: 'observed' as const,
      note,
    })),
    ...inferred.map((note, index) => ({
      label: `Inferred ${index + 1}`,
      class: 'inferred' as const,
      note,
    })),
    ...external.map((note, index) => ({
      label: `External ${index + 1}`,
      class: 'external' as const,
      note,
    })),
  ];
  const nextTwoWeeks = [
    { id: 'distilled-2w-1', label: `Run two selective conversations tied to ${target}.`, done: false, timebox: '72h' as const },
    { id: 'distilled-2w-2', label: 'Turn one proof point into a recruiter-safe narrative asset.', done: false, timebox: '72h' as const },
    { id: 'distilled-2w-3', label: 'Review feedback for signal drift and tighten the branch.', done: false, timebox: '72h' as const },
  ];

  return {
    what_i_learned: learned,
    what_needs_to_happen: [
      `Package your profile for ${target} in language the hiring panel already trusts.`,
      'Convert noisy activity into a tight leverage sequence.',
      'Run one high-signal outreach cycle per week with explicit asks.',
    ],
    next_to_do: next72,
    title: 'Your Command Center',
    subtitle: 'A living execution sequence recalibrated by market signal, proof, and momentum.',
    strategy_status: external.length ? 'market_validated' : 'internal_strategy_draft',
    command_center_status: proofScore < 45 || narrativeScore < 45 ? 'recalibrating' : 'steady',
    strategy_thesis:
      brief?.thesis ||
      `Your move from ${currentTitle} toward ${target} is viable, but the market will only reward it if the signal becomes easier to price.`,
    current_position: `Current signal reads as ${currentTitle} in ${industry}, with more strategic value than the market can currently see.`,
    future_alpha: `Future alpha comes from packaging proof, tightening narrative quality, and using AI to compress the path from evidence to market-ready positioning.`,
    market_frame: {
      market_sentiment_summary:
        marketReceipt[0] ||
        `The market for ${target} is selective. Clear proof, disciplined scope, and strong narrative packaging outperform broad activity.`,
      hot_skill_premiums: [
        `Evidence-led communication for ${target}`,
        `AI-assisted execution fluency in ${industry}`,
        'Visible proof density over generalized ambition',
      ],
      restructuring_or_cooling_signals: marketReceipt.slice(1, 3).length
        ? marketReceipt.slice(1, 3)
        : [
            'Broad-volume search behavior is losing leverage in selective environments.',
            'Teams are rewarding operators who can translate execution into board-readable signal.',
          ],
      what_changed:
        proofScore < 45
          ? 'The opportunity is real, but proof density is still suppressing the price the market will put on the story.'
          : 'The strategy is no longer about broad exploration. It is about advancing a narrower lane with clearer proof.',
      freshness_note: freshNote,
    },
    positioning_matrix: {
      current_state: currentState,
      rationale:
        currentState === 'Leader'
          ? 'Demand, proof, and narrative clarity are aligned strongly enough to support a premium push.'
          : currentState === 'Challenger'
            ? 'Demand is present, but the story still needs sharper proof and market-safe framing.'
            : currentState === 'Specialist'
              ? 'The profile has value, but it currently reads as narrow or under-packaged rather than market-leading.'
              : 'The market may punish broad positioning until proof and narrative clarity improve.',
      demand_strength: `${demandScore}/100 demand fit`,
      proof_strength: `${proofScore}/100 proof density`,
      narrative_strength: `${narrativeScore}/100 narrative clarity`,
      next_state_target: nextStateTarget,
    },
    career_lane_recommendation: {
      primary_lane: brief?.recommended_habitat || `Operator-led ${industry} teams moving toward ${target}`,
      secondary_lane: `Transformation-heavy mid-market environments where ${currentTitle} experience can be repriced`,
      why_this_lane_now:
        brief?.primary_opportunity ||
        `This lane rewards strategic translation, visible ownership, and applied AI leverage more than generic brand signaling alone.`,
      avoid_for_now: [
        'Broad-volume application sprints without proof packaging',
        'Roles that punish range and only reward narrowly credentialed specialists',
      ],
    },
    surgical_ai_playbooks: {
      proxy_interview_playbook: [
        `Use AI to simulate a hiring panel for ${target} with one operator, one executive sponsor, and one skeptic.`,
        'Force the mock panel to challenge missing proof, unclear scope, and weak business language.',
        'Turn every failed answer into one tighter, stakeholder-safe response.',
      ],
      narrative_shaping_playbook: [
        `Feed AI one evidence point at a time and ask it to rewrite the story for ${target} in recruiter-safe language.`,
        'Reject output that sounds generic, inflated, or tool-centric.',
        'Keep only phrasing that clarifies scope, outcomes, and decision impact.',
      ],
      recruiter_language_playbook: [
        'Convert project detail into market-facing verbs: led, translated, shipped, de-risked, scaled.',
        'Ask AI to remove internal jargon and replace it with hiring-panel legibility.',
        'Draft one concise positioning statement and one longer executive summary version.',
      ],
      evidence_hardening_playbook: [
        'Use AI to sort outcomes into scope, metrics, stakeholder impact, and decision quality.',
        'Turn each weak proof point into a gap list: missing metric, missing ownership, or missing business result.',
        'Promote only the receipts that can survive executive scrutiny.',
      ],
    },
    living_sequence: {
      current_branch:
        proofScore < 45
          ? 'Proof-hardening branch before broad market push.'
          : 'Selective market-push branch with tighter narrative control.',
      alternate_branch: 'If the market starts rejecting the story as too technical, shift into executive-framing branch.',
      unlock_conditions: [
        'Verified evidence list is complete and quantified.',
        'One concise positioning statement survives stakeholder review.',
        'Two external conversations confirm the lane is legible.',
      ],
      proof_targets: [
        'One quantified outcome with scope and business effect.',
        'One artifact that shows decision quality, not only activity.',
        'One recruiter-safe version of the career story.',
      ],
      recalibration_triggers: [
        'Feedback says the story is too broad or too technical.',
        'A target lane consistently responds better than adjacent lanes.',
        'New market evidence changes the compensation or habitat math.',
      ],
      next_72_hours: next72,
      next_2_weeks: nextTwoWeeks,
    },
    advisor_bridge: {
      what_changed_since_last_review: [
        'The command center now emphasizes market legibility over generic momentum.',
        proofScore < 45 ? 'Proof density remains the main suppressor of value.' : 'Narrative and proof are starting to align.',
      ],
      needs_advisor_judgment: [
        `Which version of ${target} is the most credible lane right now?`,
        'Where should compensation ambition be tightened or stretched based on proof?',
        'What habitat should be avoided even if title or pay looks attractive?',
      ],
      can_be_ai_delegated: [
        'Mock panel generation and response drills.',
        'Evidence list restructuring and phrasing alternatives.',
        'Narrative variants for recruiter, sponsor, and operator audiences.',
      ],
      strategic_questions: [
        'What would make this profile look immediately more expensive to the market?',
        'Which proof gaps are fatal versus merely inconvenient?',
        'Should the next sprint prioritize narrative packaging or new evidence creation?',
      ],
    },
    evidence_ledger: evidenceLedger,
  };
};

export const generateReadinessDoc = (answers: IntakeAnswers): ReadinessContent => {
  const usage = nonEmpty(answers.ai_usage_frequency).toLowerCase();
  const advanced = asList(answers.advanced_interests);
  const foundational = asList(answers.foundational_interests);
  const target = resolveTargetRole(answers);
  const industry = resolveIndustry(answers);

  let tier: ReadinessContent['tier_recommendation'] = 'Foundation';
  if (usage === 'daily' || advanced.length >= 3) tier = 'Premier';
  else if (usage === 'regularly' || advanced.length >= 1 || foundational.length >= 3) tier = 'Select';

  return {
    tier_recommendation: tier,
    executive_overview: [
      `Readiness is calibrated for ${target} in ${industry}.`,
      `Current usage signal indicates ${usage || 'early-stage'} AI operational maturity.`,
      `Recommended tier: ${tier}.`,
    ],
    from_awareness_to_action: [
      'Shift from ad-hoc prompting to repeatable operating patterns.',
      'Map each AI output to a business decision or measurable outcome.',
      'Instrument one workflow for weekly review and iteration.',
    ],
    targeted_ai_development_priorities: [
      'Strengthen role-specific prompt architecture for decision support.',
      'Increase stakeholder-ready communication quality and traceability.',
      'Build reusable assets that compound across job search and execution.',
    ],
    technical_development_areas: [
      'Prompt system design with guardrails and context windows.',
      'Workflow automation fundamentals and integration hygiene.',
      'Multimodal communication assembly for executive narratives.',
    ],
  };
};

export const generateCjsExecutionDoc = (
  answers: IntakeAnswers,
  intent: 'current_role' | 'target_role' | 'not_sure' = 'target_role'
): CjsExecutionContent => {
  const target = resolveTargetRole(answers);
  const constraints = nonEmpty(answers.constraints);
  const blocked = constraints ? 'blocked' : 'planned';

  if (intent === 'current_role') {
    return {
      intent_summary: `Internal mobility rail is available for ${target}, but the active focus stays on performance elevation and AI-led leverage in your current role.`,
      stages: [
        { step: 1, title: 'Smart Start Intake', status: 'ready', description: 'Professional DNA and internal operating context are captured.' },
        { step: 2, title: 'AI Insights Report', status: 'ready', description: 'Readiness and AI usage patterns are framed for internal leverage.' },
        { step: 3, title: 'Internal Pilot Brief', status: 'planned', description: 'Translate one recurring workflow into a small AI pilot proposal.' },
        { step: 4, title: 'Sponsor Map', status: 'planned', description: 'Identify leaders who can validate the impact of an internal initiative.' },
        { step: 5, title: 'External Search', status: 'blocked', description: 'Inactive by default for the current-role journey unless the client changes intent.' },
      ],
    };
  }

  if (intent === 'not_sure') {
    return {
      intent_summary: `Exploration rail is visible for ${target}, but execution is centered on role-fit discovery instead of active search volume.`,
      stages: [
        { step: 1, title: 'Smart Start Intake', status: 'ready', description: 'Transferable skills and constraints are mapped from your current background.' },
        { step: 2, title: 'Role-Fit Hypotheses', status: 'planned', description: 'Generate 2-3 plausible role lanes and the proof each one requires.' },
        { step: 3, title: 'Resume Reframe', status: 'planned', description: 'Translate current experience into language tech-adjacent teams already trust.' },
        { step: 4, title: 'Informational Interviews', status: blocked, description: constraints ? `Waiting on constraints: ${constraints}` : 'Queue three exploratory conversations before any application sprint.' },
      ],
    };
  }

  return {
    intent_summary: `Promotion-first ConciergeJobSearch execution is live for ${target}, with internal networking and proposal-driven momentum.`,
    stages: [
      { step: 1, title: 'Smart Start Intake', status: 'ready', description: 'Foundation event captured and mapped into Professional DNA.' },
      { step: 2, title: 'AI Insights Report', status: 'ready', description: 'Readiness and market context synthesized into execution guidance.' },
      { step: 3, title: 'Resume Optimization', status: 'planned', description: 'Resume reframed against target role language and keyword strategy.' },
      { step: 4, title: 'Internal Search Strategy', status: 'planned', description: 'Stakeholder map, sponsor outreach, and proposal channels prioritized by signal score.' },
      { step: 5, title: 'Project Proposal Push', status: blocked, description: constraints ? `Waiting on constraints: ${constraints}` : 'Internal campaign assets prepared for presentation and review.' },
      { step: 6, title: 'Executive Proof Pack', status: 'planned', description: 'Briefing materials for ROI, role readiness, and team-level leverage.' },
      { step: 7, title: 'Interview Preparation', status: 'planned', description: 'Narrative frameworks and response structures tailored to role.' },
      { step: 8, title: 'Salary Negotiation', status: 'planned', description: 'Compensation framing and script set calibrated to market data.' },
      { step: 9, title: 'Decision-to-Counter', status: 'planned', description: 'Promotion or offer response strategy with data-backed decision logic.' },
    ],
  };
};
