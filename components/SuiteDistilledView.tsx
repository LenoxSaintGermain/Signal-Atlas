import React from 'react';
import {
  DnaEvidenceClass,
  DnaUrgencyTask,
  SuiteDistilledCommandCenterStatus,
  SuiteDistilledContent,
  SuiteDistilledMatrixState,
  SuiteDistilledStrategyStatus,
} from '../types';

type NormalizedSuiteDistilled = {
  title: string;
  subtitle: string;
  strategyStatus: SuiteDistilledStrategyStatus;
  commandStatus: SuiteDistilledCommandCenterStatus;
  strategyThesis: string;
  currentPosition: string;
  futureAlpha: string;
  marketFrame: {
    marketSentimentSummary: string;
    hotSkillPremiums: string[];
    coolingSignals: string[];
    whatChanged: string;
    freshnessNote: string;
  };
  positioningMatrix: {
    currentState: SuiteDistilledMatrixState;
    rationale: string;
    demandStrength: string;
    proofStrength: string;
    narrativeStrength: string;
    nextStateTarget: string;
  };
  laneRecommendation: {
    primaryLane: string;
    secondaryLane?: string;
    whyThisLaneNow: string;
    avoidForNow: string[];
  };
  playbooks: {
    proxyInterview: string[];
    narrativeShaping: string[];
    recruiterLanguage: string[];
    evidenceHardening: string[];
  };
  livingSequence: {
    currentBranch: string;
    alternateBranch?: string;
    unlockConditions: string[];
    proofTargets: string[];
    recalibrationTriggers: string[];
    next72Hours: DnaUrgencyTask[];
    next2Weeks: DnaUrgencyTask[];
  };
  advisorBridge: {
    whatChangedSinceLastReview: string[];
    needsAdvisorJudgment: string[];
    canBeAiDelegated: string[];
    strategicQuestions: string[];
  };
  evidenceLedger: Array<{
    label: string;
    class: DnaEvidenceClass;
    note: string;
    sourceRef?: string;
  }>;
};

const MATRIX_STATES: SuiteDistilledMatrixState[] = ['Leader', 'Challenger', 'Specialist', 'At Risk'];

const statusToneClass: Record<SuiteDistilledStrategyStatus, string> = {
  internal_strategy_draft: 'text-[#8f7652] bg-[#f3ece0] border-[#e7dac5]',
  market_validated: 'text-[#0d6152] bg-[#e2f3ef] border-[#c5e4dd]',
  advisor_revised: 'text-[#234655] bg-[#e7eff4] border-[#d2e0ea]',
};

const commandToneClass: Record<SuiteDistilledCommandCenterStatus, string> = {
  steady: 'text-[#0d6152] bg-[#e2f3ef] border-[#c5e4dd]',
  recalibrating: 'text-[#8f7652] bg-[#f3ece0] border-[#e7dac5]',
  signal_shift: 'text-[#8f7652] bg-[#f7ecda] border-[#ead8bc]',
  awaiting_proof: 'text-[#764e4e] bg-[#f5e6e3] border-[#e7d0cb]',
};

const evidenceToneClass: Record<DnaEvidenceClass, string> = {
  observed: 'text-[#234655] bg-[#edf3f6] border-[#dbe6ec]',
  inferred: 'text-[#8f7652] bg-[#f3ece0] border-[#e7dac5]',
  external: 'text-[#0d6152] bg-[#e2f3ef] border-[#c5e4dd]',
};

const matrixToneClass: Record<SuiteDistilledMatrixState, string> = {
  Leader: 'border-[#63cdb7] bg-[#e2f3ef] text-[#0d6152]',
  Challenger: 'border-[#9bc5b9] bg-[#edf5f1] text-[#24594e]',
  Specialist: 'border-[#d7cab1] bg-[#f6efe4] text-[#745c36]',
  'At Risk': 'border-[#e6d6cf] bg-[#f9edea] text-[#7a514d]',
};

const titleCase = (value: string) => value.replace(/_/g, ' ');

const toLegacyNext = (tasks: DnaUrgencyTask[] | undefined, fallback: DnaUrgencyTask[]) =>
  Array.isArray(tasks) && tasks.length ? tasks : fallback;

const normalizeSuiteDistilled = (doc: SuiteDistilledContent): NormalizedSuiteDistilled => {
  const legacyLearned = doc.what_i_learned || [];
  const legacyNeeds = doc.what_needs_to_happen || [];
  const legacyNext = doc.next_to_do || [];
  const legacyEvidence = [
    ...legacyLearned.slice(0, 2).map((note, index) => ({
      label: `Observed ${index + 1}`,
      class: 'observed' as const,
      note,
    })),
    ...legacyNeeds.slice(0, 1).map((note, index) => ({
      label: `Inferred ${index + 1}`,
      class: 'inferred' as const,
      note,
    })),
  ];
  const inferredState: SuiteDistilledMatrixState = legacyLearned.join(' ').toLowerCase().includes('market')
    ? 'Challenger'
    : 'Specialist';

  return {
    title: doc.title || 'Your Command Center',
    subtitle: doc.subtitle || 'A living execution sequence recalibrated by market signal, proof, and momentum.',
    strategyStatus: doc.strategy_status || 'internal_strategy_draft',
    commandStatus: doc.command_center_status || (legacyNext.length ? 'recalibrating' : 'steady'),
    strategyThesis:
      doc.strategy_thesis ||
      legacyLearned[0] ||
      'Your suite sees a viable move, but the market will only reward it if your signal becomes tighter and easier to price.',
    currentPosition:
      doc.current_position ||
      legacyLearned[1] ||
      'Current market signal is stronger in execution than in visible packaging.',
    futureAlpha:
      doc.future_alpha ||
      legacyNeeds[0] ||
      'Future upside comes from better proof density, stronger narrative control, and tighter lane selection.',
    marketFrame: {
      marketSentimentSummary:
        doc.market_frame?.market_sentiment_summary ||
        legacyLearned[1] ||
        'Selective markets reward clarity, proof, and disciplined scope over broad activity.',
      hotSkillPremiums:
        doc.market_frame?.hot_skill_premiums?.length
          ? doc.market_frame.hot_skill_premiums
          : ['Proof-led communication', 'Decision-grade AI leverage', 'Visible operating range'],
      coolingSignals:
        doc.market_frame?.restructuring_or_cooling_signals?.length
          ? doc.market_frame.restructuring_or_cooling_signals
          : legacyNeeds.slice(1, 3),
      whatChanged:
        doc.market_frame?.what_changed ||
        'This is no longer a volume game. It is a packaging and proof game.',
      freshnessNote:
        doc.market_frame?.freshness_note || 'Legacy strategic summary mapped into command-center view.',
    },
    positioningMatrix: {
      currentState: doc.positioning_matrix?.current_state || inferredState,
      rationale:
        doc.positioning_matrix?.rationale ||
        'There is viable demand, but the story still needs tighter proof and better market-safe framing.',
      demandStrength: doc.positioning_matrix?.demand_strength || 'Selective demand present',
      proofStrength: doc.positioning_matrix?.proof_strength || 'Proof still under-packaged',
      narrativeStrength: doc.positioning_matrix?.narrative_strength || 'Narrative needs tightening',
      nextStateTarget: doc.positioning_matrix?.next_state_target || 'Leader',
    },
    laneRecommendation: {
      primaryLane:
        doc.career_lane_recommendation?.primary_lane || 'Selective opportunities where clear proof can be repriced',
      secondaryLane: doc.career_lane_recommendation?.secondary_lane,
      whyThisLaneNow:
        doc.career_lane_recommendation?.why_this_lane_now ||
        legacyNeeds[0] ||
        'The right lane now is the one that rewards signal quality more than generic brand adjacency.',
      avoidForNow:
        doc.career_lane_recommendation?.avoid_for_now || ['Broad-volume search behavior without proof packaging'],
    },
    playbooks: {
      proxyInterview:
        doc.surgical_ai_playbooks?.proxy_interview_playbook || [
          'Simulate a hiring panel with one skeptic, one operator, and one executive sponsor.',
          'Turn every weak answer into a tighter, more decision-ready version.',
        ],
      narrativeShaping:
        doc.surgical_ai_playbooks?.narrative_shaping_playbook || [
          'Rewrite your evidence into recruiter-safe language.',
          'Remove jargon and generalized ambition.',
        ],
      recruiterLanguage:
        doc.surgical_ai_playbooks?.recruiter_language_playbook || [
          'Translate effort into scope, outcomes, and decision impact.',
          'Draft short and long versions of the same positioning case.',
        ],
      evidenceHardening:
        doc.surgical_ai_playbooks?.evidence_hardening_playbook || [
          'Identify missing metrics on every proof point.',
          'Promote only receipts that survive executive scrutiny.',
        ],
    },
    livingSequence: {
      currentBranch:
        doc.living_sequence?.current_branch || 'Proof-hardening branch before broad outreach.',
      alternateBranch: doc.living_sequence?.alternate_branch,
      unlockConditions:
        doc.living_sequence?.unlock_conditions?.length
          ? doc.living_sequence.unlock_conditions
          : ['One proof point is quantified.', 'One concise positioning statement survives review.'],
      proofTargets:
        doc.living_sequence?.proof_targets?.length
          ? doc.living_sequence.proof_targets
          : ['Quantified outcome', 'Visible artifact', 'Recruiter-safe narrative asset'],
      recalibrationTriggers:
        doc.living_sequence?.recalibration_triggers?.length
          ? doc.living_sequence.recalibration_triggers
          : ['Feedback says the story is too broad.', 'A narrower lane starts producing better signal.'],
      next72Hours: toLegacyNext(doc.living_sequence?.next_72_hours, legacyNext),
      next2Weeks:
        doc.living_sequence?.next_2_weeks?.length
          ? doc.living_sequence.next_2_weeks
          : legacyNext.map((task, index) => ({
              id: `${task.id || `next-${index + 1}`}-2w`,
              label: task.label,
              done: Boolean(task.done),
            })),
    },
    advisorBridge: {
      whatChangedSinceLastReview:
        doc.advisor_bridge?.what_changed_since_last_review?.length
          ? doc.advisor_bridge.what_changed_since_last_review
          : [legacyLearned[0] || 'The market now rewards tighter proof and narrower sequencing.'],
      needsAdvisorJudgment:
        doc.advisor_bridge?.needs_advisor_judgment?.length
          ? doc.advisor_bridge.needs_advisor_judgment
          : ['Which lane is most credible right now?', 'What habitat should be avoided despite title appeal?'],
      canBeAiDelegated:
        doc.advisor_bridge?.can_be_ai_delegated?.length
          ? doc.advisor_bridge.can_be_ai_delegated
          : ['Mock panel generation', 'Evidence restructuring', 'Narrative variants for different stakeholders'],
      strategicQuestions:
        doc.advisor_bridge?.strategic_questions?.length
          ? doc.advisor_bridge.strategic_questions
          : ['What would make this profile look immediately more expensive?', 'Should the next sprint focus on packaging or new evidence?'],
    },
    evidenceLedger: doc.evidence_ledger?.length ? doc.evidence_ledger : legacyEvidence,
  };
};

function StatusChip(props: { label: string; value: string; toneClass: string }) {
  return (
    <div className={`border px-3 py-3 ${props.toneClass}`}>
      <div className="text-[9px] uppercase tracking-[0.24em] opacity-70">{props.label}</div>
      <div className="mt-2 text-sm font-medium">{props.value}</div>
    </div>
  );
}

function ListSection(props: { title: string; items: string[]; compact?: boolean }) {
  return (
    <section className="border border-black/5 bg-[#f7f3ea] p-5">
      <div className="text-[10px] uppercase tracking-[0.24em] text-[#8d8d88]">{props.title}</div>
      <ul className={`mt-4 ${props.compact ? 'space-y-2' : 'space-y-3'} text-sm leading-6 text-[#2b3134]`}>
        {props.items.map((item, index) => (
          <li key={`${props.title}-${index}`} className="flex gap-3">
            <span className="font-mono text-[#9fa7ab]">{String(index + 1).padStart(2, '0')}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TaskRail(props: { title: string; tasks: DnaUrgencyTask[] }) {
  return (
    <section className="border border-black/5 bg-white p-5">
      <div className="text-[10px] uppercase tracking-[0.24em] text-[#8d8d88]">{props.title}</div>
      <div className="mt-4 grid gap-3">
        {props.tasks.map((task, index) => (
          <div key={task.id || `${props.title}-${index}`} className="border border-black/5 bg-[#faf7f2] px-4 py-4">
            <div className="text-[9px] uppercase tracking-[0.22em] text-[#9d968a]">
              {task.timebox ? titleCase(task.timebox) : 'Action'}
            </div>
            <div className="mt-2 text-sm leading-6 text-[#2b3134]">{task.label}</div>
            {task.rationale ? <div className="mt-2 text-xs leading-5 text-[#667176]">{task.rationale}</div> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function SuiteDistilledView(props: { doc: SuiteDistilledContent }) {
  const doc = normalizeSuiteDistilled(props.doc);

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <div className="text-xs font-mono uppercase tracking-[0.3em] text-[#a4a6a0]">Suite Distilled</div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.8fr)]">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-editorial leading-[0.95] text-[#231f1a]">{doc.title}</h2>
            <p className="max-w-3xl text-sm leading-6 text-[#617078]">{doc.subtitle}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <StatusChip
                label="Strategy Status"
                value={titleCase(doc.strategyStatus)}
                toneClass={statusToneClass[doc.strategyStatus]}
              />
              <StatusChip
                label="Command Status"
                value={titleCase(doc.commandStatus)}
                toneClass={commandToneClass[doc.commandStatus]}
              />
            </div>
          </div>

          <section className="border border-black/5 bg-[#f7f3ea] p-5">
            <div className="text-[10px] uppercase tracking-[0.24em] text-[#8d8d88]">Current Position vs Future Alpha</div>
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-[9px] uppercase tracking-[0.22em] text-[#9d968a]">Current Position</div>
                <p className="mt-2 text-sm leading-6 text-[#2b3134]">{doc.currentPosition}</p>
              </div>
              <div className="border-l-[3px] border-[#b4874f] bg-[#efe6d9] px-4 py-4">
                <div className="text-[9px] uppercase tracking-[0.22em] text-[#8b6a3f]">Future Alpha</div>
                <p className="mt-2 text-sm leading-6 text-[#483b2d]">{doc.futureAlpha}</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="border border-black/5 bg-white p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
          <div className="space-y-4">
            <div className="text-[10px] uppercase tracking-[0.24em] text-[#8d8d88]">Strategy Thesis</div>
            <h3 className="text-2xl md:text-[2rem] font-editorial leading-tight text-[#231f1a]">{doc.strategyThesis}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="border border-black/5 bg-[#faf7f2] p-4">
                <div className="text-[9px] uppercase tracking-[0.22em] text-[#9d968a]">Market Sentiment</div>
                <p className="mt-2 text-sm leading-6 text-[#2b3134]">{doc.marketFrame.marketSentimentSummary}</p>
              </div>
              <div className="border border-black/5 bg-[#faf7f2] p-4">
                <div className="text-[9px] uppercase tracking-[0.22em] text-[#9d968a]">What Changed</div>
                <p className="mt-2 text-sm leading-6 text-[#2b3134]">{doc.marketFrame.whatChanged}</p>
              </div>
            </div>
          </div>

          <div className="border border-black/5 bg-[#faf7f2] p-4">
            <div className="text-[9px] uppercase tracking-[0.22em] text-[#9d968a]">Freshness Note</div>
            <p className="mt-2 text-sm leading-6 text-[#617078]">{doc.marketFrame.freshnessNote}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <section className="border border-black/5 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-[#8d8d88]">Career Positioning Matrix</div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#617078]">{doc.positioningMatrix.rationale}</p>
            </div>
            <div className="border border-black/5 bg-[#faf7f2] px-4 py-3 text-right">
              <div className="text-[9px] uppercase tracking-[0.22em] text-[#9d968a]">Target State</div>
              <div className="mt-2 text-sm font-medium text-[#231f1a]">{doc.positioningMatrix.nextStateTarget}</div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {MATRIX_STATES.map((state) => {
              const active = state === doc.positioningMatrix.currentState;
              return (
                <div
                  key={state}
                  className={`border px-4 py-4 ${active ? matrixToneClass[state] : 'border-black/5 bg-[#faf7f2] text-[#6a7478]'}`}
                >
                  <div className="text-[9px] uppercase tracking-[0.22em] opacity-70">{active ? 'Current State' : 'Matrix'}</div>
                  <div className="mt-2 text-sm font-medium">{state}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <StatusChip label="Demand" value={doc.positioningMatrix.demandStrength} toneClass="text-[#234655] bg-[#edf3f6] border-[#dbe6ec]" />
            <StatusChip label="Proof" value={doc.positioningMatrix.proofStrength} toneClass="text-[#8f7652] bg-[#f3ece0] border-[#e7dac5]" />
            <StatusChip label="Narrative" value={doc.positioningMatrix.narrativeStrength} toneClass="text-[#234655] bg-[#edf3f6] border-[#dbe6ec]" />
          </div>
        </section>

        <section className="border border-black/5 bg-[#f7f3ea] p-6">
          <div className="text-[10px] uppercase tracking-[0.24em] text-[#8d8d88]">Lane Recommendation</div>
          <div className="mt-4 space-y-4">
            <div>
              <div className="text-[9px] uppercase tracking-[0.22em] text-[#9d968a]">Primary Lane</div>
              <div className="mt-2 text-lg font-editorial leading-tight text-[#231f1a]">{doc.laneRecommendation.primaryLane}</div>
            </div>
            {doc.laneRecommendation.secondaryLane ? (
              <div>
                <div className="text-[9px] uppercase tracking-[0.22em] text-[#9d968a]">Secondary Lane</div>
                <div className="mt-2 text-sm leading-6 text-[#2b3134]">{doc.laneRecommendation.secondaryLane}</div>
              </div>
            ) : null}
            <div className="border-l-[3px] border-[#b4874f] bg-[#efe6d9] px-4 py-4">
              <div className="text-[9px] uppercase tracking-[0.22em] text-[#8b6a3f]">Why This Lane Now</div>
              <p className="mt-2 text-sm leading-6 text-[#483b2d]">{doc.laneRecommendation.whyThisLaneNow}</p>
            </div>
            {doc.laneRecommendation.avoidForNow.length ? (
              <div>
                <div className="text-[9px] uppercase tracking-[0.22em] text-[#9d968a]">Avoid For Now</div>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[#2b3134]">
                  {doc.laneRecommendation.avoidForNow.map((item, index) => (
                    <li key={`avoid-${index}`} className="flex gap-3">
                      <span className="font-mono text-[#9fa7ab]">{String(index + 1).padStart(2, '0')}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <section className="border border-black/5 bg-white p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-[#8d8d88]">Surgical AI Playbooks</div>
            <h3 className="mt-3 text-2xl font-editorial leading-tight text-[#231f1a]">
              Exact AI leverage for this branch, not generic tool advice.
            </h3>
          </div>
        </div>
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <ListSection title="Proxy Interview Playbook" items={doc.playbooks.proxyInterview} />
          <ListSection title="Narrative Shaping" items={doc.playbooks.narrativeShaping} />
          <ListSection title="Recruiter Language" items={doc.playbooks.recruiterLanguage} />
          <ListSection title="Evidence Hardening" items={doc.playbooks.evidenceHardening} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="border border-black/5 bg-white p-6">
          <div className="text-[10px] uppercase tracking-[0.24em] text-[#8d8d88]">Living Sequence</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="border border-black/5 bg-[#faf7f2] p-4">
              <div className="text-[9px] uppercase tracking-[0.22em] text-[#9d968a]">Current Branch</div>
              <p className="mt-2 text-sm leading-6 text-[#2b3134]">{doc.livingSequence.currentBranch}</p>
            </div>
            {doc.livingSequence.alternateBranch ? (
              <div className="border border-black/5 bg-[#faf7f2] p-4">
                <div className="text-[9px] uppercase tracking-[0.22em] text-[#9d968a]">Alternate Branch</div>
                <p className="mt-2 text-sm leading-6 text-[#2b3134]">{doc.livingSequence.alternateBranch}</p>
              </div>
            ) : null}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <ListSection title="Unlock Conditions" items={doc.livingSequence.unlockConditions} compact />
            <ListSection title="Proof Targets" items={doc.livingSequence.proofTargets} compact />
            <ListSection title="Recalibration Triggers" items={doc.livingSequence.recalibrationTriggers} compact />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <TaskRail title="Next 72 Hours" tasks={doc.livingSequence.next72Hours} />
            <TaskRail title="Next 2 Weeks" tasks={doc.livingSequence.next2Weeks} />
          </div>
        </section>

        <section className="border border-black/5 bg-[#f7f3ea] p-6">
          <div className="text-[10px] uppercase tracking-[0.24em] text-[#8d8d88]">Advisor Bridge</div>
          <div className="mt-4 grid gap-4">
            <ListSection title="What Changed Since Last Review" items={doc.advisorBridge.whatChangedSinceLastReview} compact />
            <ListSection title="Needs Advisor Judgment" items={doc.advisorBridge.needsAdvisorJudgment} compact />
            <ListSection title="Can Be AI Delegated" items={doc.advisorBridge.canBeAiDelegated} compact />
            <ListSection title="Strategic Questions" items={doc.advisorBridge.strategicQuestions} compact />
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <ListSection title="Market Skill Premiums" items={doc.marketFrame.hotSkillPremiums} />
        <ListSection title="Cooling Signals" items={doc.marketFrame.coolingSignals} />
      </div>

      {doc.evidenceLedger.length ? (
        <section className="border border-black/5 bg-white p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-[#8d8d88]">Evidence Ledger</div>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#617078]">
                This surface should feel expensive because it is disciplined. Every meaningful claim is tagged by evidence class.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            {doc.evidenceLedger.map((entry, index) => (
              <div key={`${entry.label}-${index}`} className={`border p-4 ${evidenceToneClass[entry.class]}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[9px] uppercase tracking-[0.22em] opacity-70">{entry.label}</div>
                  <div className="text-[9px] uppercase tracking-[0.22em] opacity-70">{titleCase(entry.class)}</div>
                </div>
                <p className="mt-3 text-sm leading-6">{entry.note}</p>
                {entry.sourceRef ? <div className="mt-3 text-xs leading-5 opacity-75">{entry.sourceRef}</div> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
