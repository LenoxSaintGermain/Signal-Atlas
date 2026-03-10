import React from 'react';
import {
  BriefContent,
  DnaCompensationLadderRung,
  DnaEvidenceNode,
  DnaMarketDemandEnvironment,
  DnaMarketSignal,
  DnaReportTicker,
  DnaSignalBreakdownItem,
  DnaSignalStripItem,
  DnaUrgencyTask,
  ProfileContent,
} from '../types';

export const hasItems = (items: unknown): items is string[] =>
  Array.isArray(items) && items.some((item) => String(item).trim());

export const asTextList = (items: unknown): string[] =>
  Array.isArray(items) ? items.map((item) => String(item ?? '').trim()).filter(Boolean) : [];

const asUrgencyTasks = (items: unknown): DnaUrgencyTask[] =>
  Array.isArray(items)
    ? items
        .map((item, index) => {
          if (typeof item === 'string') {
            return {
              id: `n72-${index + 1}`,
              label: item,
              done: false,
            };
          }
          if (!item || typeof item !== 'object') return null;
          const label = String((item as DnaUrgencyTask).label ?? '').trim();
          if (!label) return null;
          return {
            id: String((item as DnaUrgencyTask).id ?? `n72-${index + 1}`),
            label,
            done: (item as DnaUrgencyTask).done === true,
            timebox: (item as DnaUrgencyTask).timebox,
            rationale: (item as DnaUrgencyTask).rationale,
          };
        })
        .filter((item): item is DnaUrgencyTask => Boolean(item))
    : [];

const clampScore = (value: unknown, fallback = 50) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  if (number < 0) return 0;
  if (number > 100) return 100;
  return Math.round(number);
};

const toneForScore = (score: number): 'strong' | 'watch' | 'risk' => {
  if (score >= 70) return 'strong';
  if (score >= 45) return 'watch';
  return 'risk';
};

const gradeFromScore = (score: number) => {
  if (score >= 94) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 74) return 'B';
  if (score >= 68) return 'B-';
  if (score >= 62) return 'C+';
  return 'C';
};

const styleTone = (tone: string) =>
  tone === 'strong'
    ? {
        border: 'border-[#5FAF95]/35',
        bg: 'bg-[#28211E]',
        surface: 'bg-[#F4F1EB]',
        text: 'text-[#5FAF95]',
        accent: 'bg-[#8DD9BF]',
      }
    : tone === 'watch'
      ? {
          border: 'border-[#b8893a]/35',
          bg: 'bg-[#28211E]',
          surface: 'bg-[#FBF8F2]',
          text: 'text-[#9f7640]',
          accent: 'bg-[#f0b14a]',
        }
      : {
          border: 'border-[#b56565]/35',
          bg: 'bg-[#28211E]',
          surface: 'bg-[#FBF3F0]',
          text: 'text-[#a25555]',
          accent: 'bg-[#f2757b]',
        };

const buildFallbackSignalBreakdown = (brief?: BriefContent, profile?: ProfileContent): DnaSignalBreakdownItem[] => {
  const markers = Array.isArray(profile?.genome_markers) ? profile.genome_markers : [];
  const getMarker = (id: string, fallback: number) =>
    clampScore(markers.find((entry) => entry.id === id)?.score ?? fallback, fallback);
  const observed = hasItems(brief?.evidence_ledger?.observed) ? brief?.evidence_ledger?.observed.length : 0;
  const external = hasItems(brief?.evidence_ledger?.external) ? brief?.evidence_ledger?.external.length : 0;
  const leverage = hasItems(profile?.leverage) ? profile!.leverage.length : 0;

  const narrativeClarity = getMarker('market_signaling', 41);
  const marketDemandFit = clampScore((getMarker('strategic_translation', 72) * 0.4) + (getMarker('execution_reliability', 78) * 0.35) + (getMarker('tooling_fluency', 56) * 0.25), 68);
  const networkCapital = clampScore(40 + leverage * 6 + (hasItems(profile?.adaptive_assets) ? profile!.adaptive_assets.length * 3 : 0), 55);
  const proofDensity = clampScore(34 + observed * 11 + external * 7, 38);

  return [
    {
      id: 'narrative_clarity',
      label: 'Narrative Clarity',
      score: narrativeClarity,
      tone: toneForScore(narrativeClarity),
      rationale: 'How legible the profile reads before a buyer makes charitable assumptions.',
      evidence: 'inferred',
    },
    {
      id: 'market_demand_fit',
      label: 'Market Demand Fit',
      score: marketDemandFit,
      tone: toneForScore(marketDemandFit),
      rationale: 'Role-fit score inferred from strengths, operating markers, and selective labor conditions.',
      evidence: 'inferred',
    },
    {
      id: 'network_capital',
      label: 'Network Capital',
      score: networkCapital,
      tone: toneForScore(networkCapital),
      rationale: 'Directional proxy from leverage surfaces and adjacency strength, not vanity metrics.',
      evidence: 'inferred',
    },
    {
      id: 'proof_density',
      label: 'Proof Density',
      score: proofDensity,
      tone: toneForScore(proofDensity),
      rationale: 'How much verified, market-facing proof is already visible in the dossier.',
      evidence: 'observed',
    },
  ];
};

const buildFallbackSignalStrip = (breakdown: DnaSignalBreakdownItem[]): DnaSignalStripItem[] => {
  const byId = Object.fromEntries(breakdown.map((item) => [item.id, item.score]));
  const currentCompGrade = gradeFromScore(clampScore((byId.proof_density || 38) * 0.58 + (byId.narrative_clarity || 41) * 0.42, 72));
  const adaptationPressure = (byId.narrative_clarity || 41) < 45 || (byId.proof_density || 38) < 45 ? 'HIGH' : 'MED';

  return [
    { id: 'market_fit', label: 'Market Fit', value: String(clampScore(byId.market_demand_fit, 68)), detail: 'Role-habitat fit under current market conditions.', tone: toneForScore(byId.market_demand_fit || 68) },
    { id: 'signal_clarity', label: 'Signal Clarity', value: String(clampScore(byId.narrative_clarity, 41)), detail: 'How quickly the market can understand the case.', tone: toneForScore(byId.narrative_clarity || 41) },
    { id: 'comp_index', label: 'Comp Index', value: currentCompGrade, detail: 'Current compensation posture justified by visible signal.', tone: currentCompGrade.startsWith('A') ? 'strong' : currentCompGrade.startsWith('B') ? 'watch' : 'risk' },
    { id: 'adapt_pressure', label: 'Adapt Pressure', value: adaptationPressure, detail: 'Pressure imposed by selectivity and evidence gaps.', tone: adaptationPressure === 'HIGH' ? 'risk' : 'watch' },
    { id: 'live_dossier', label: 'Live Dossier', value: 'ACTIVE', detail: 'Refreshable research document, not a static quiz result.', tone: 'strong' },
  ];
};

const buildFallbackMarketSignal = (breakdown: DnaSignalBreakdownItem[]): DnaMarketSignal => {
  const byId = Object.fromEntries(breakdown.map((item) => [item.id, item.score]));
  const composite = clampScore(breakdown.reduce((sum, item) => sum + item.score, 0) / Math.max(breakdown.length, 1), 60);
  return {
    composite_score: composite,
    momentum_label: composite >= 75 ? 'Signal strengthening' : composite >= 58 ? 'Signal mixed' : 'Signal vulnerable',
    trajectory_type: 'projection',
    trajectory_basis: 'Projection from current signal quality toward a stronger ask. Historical timeline is not yet available.',
    trajectory: [
      { label: 'Current', score: clampScore((byId.narrative_clarity || 41) * 0.55 + (byId.proof_density || 38) * 0.45, 49) },
      { label: 'Narrative', score: clampScore((byId.narrative_clarity || 41) * 0.72 + (byId.market_demand_fit || 68) * 0.28, 58) },
      { label: 'Proof', score: clampScore((byId.proof_density || 38) * 0.54 + (byId.market_demand_fit || 68) * 0.46, 64) },
      { label: 'Ceiling', score: clampScore((byId.market_demand_fit || 68) * 0.45 + (byId.proof_density || 38) * 0.35 + (byId.network_capital || 55) * 0.2 + 10, 76) },
    ],
    breakdown,
  };
};

const buildFallbackCompensationLadder = (
  profile: ProfileContent | undefined,
  signal: DnaMarketSignal
): DnaCompensationLadderRung[] => {
  const current = clampScore((signal.breakdown.find((item) => item.id === 'proof_density')?.score || 38) * 0.6 + (signal.breakdown.find((item) => item.id === 'narrative_clarity')?.score || 41) * 0.4, 72);
  const currentRange = profile?.compensation_position?.market_value_range || 'Current band depends on proof, scope, and geography.';
  const targetAsk = profile?.compensation_position?.target_ask || 'Narrative-adjusted ask pending calibration.';
  return [
    { id: 'current', label: 'Current', grade: gradeFromScore(current), detail: currentRange },
    { id: 'narrative_adjusted', label: 'Narrative-Adjusted', grade: gradeFromScore(clampScore(current + 7, 78)), detail: targetAsk },
    { id: 'market_ceiling', label: 'Market Ceiling', grade: gradeFromScore(clampScore(signal.composite_score + 12, 88)), detail: 'Ceiling if the narrative, proof, and environment all tighten together.' },
  ];
};

const buildFallbackTicker = (profile?: ProfileContent, evidenceCount = 0): DnaReportTicker => {
  const generatedAt = profile?.generated_at || new Date().toISOString().slice(0, 10);
  const dateOnly = generatedAt.slice(0, 10);
  const nextReview = new Date(`${dateOnly}T00:00:00Z`);
  nextReview.setUTCDate(nextReview.getUTCDate() + 14);
  return {
    generated_at: dateOnly,
    model_version: profile?.report_version || 'dna-report-v2',
    evidence_nodes: evidenceCount,
    confidence_rating: `${Math.min(96, 48 + evidenceCount * 5)} / 100`,
    next_review_date: nextReview.toISOString().slice(0, 10),
    source_snapshot_date: '2026-03-10',
    source_count: Math.max(3, evidenceCount > 0 ? 5 : 3),
    update_cadence: '14-day review',
  };
};

export const buildBriefTelemetry = (brief: BriefContent) => {
  const breakdown = brief.market_signal?.breakdown?.length ? brief.market_signal.breakdown : buildFallbackSignalBreakdown(brief);
  const marketSignal = brief.market_signal?.trajectory?.length ? brief.market_signal : buildFallbackMarketSignal(breakdown);
  const signalStrip = brief.signal_strip?.length ? brief.signal_strip : buildFallbackSignalStrip(breakdown);
  const compensationLadder = brief.compensation_ladder?.length ? brief.compensation_ladder : buildFallbackCompensationLadder(undefined, marketSignal);
  const reportTicker = brief.report_ticker || buildFallbackTicker(undefined, breakdown.length);
  const baselineWarRoom =
    asUrgencyTasks(brief.next_72_hours).length > 0
      ? asUrgencyTasks(brief.next_72_hours)
      : asTextList(brief.needle).slice(0, 3).map((label, index) => ({
          id: `fallback-${index + 1}`,
          label,
          done: false,
        }));
  const warRoom: DnaUrgencyTask[] = baselineWarRoom.map((task, index) => ({
    ...task,
    timebox: task.timebox || (index === 0 ? 'do_now' : index === 1 ? '48h' : '72h'),
  }));
  return { breakdown, marketSignal, signalStrip, compensationLadder, reportTicker, warRoom };
};

export const buildProfileTelemetry = (profile: ProfileContent) => {
  const breakdown = profile.market_signal?.breakdown?.length ? profile.market_signal.breakdown : buildFallbackSignalBreakdown(undefined, profile);
  const marketSignal = profile.market_signal?.trajectory?.length ? profile.market_signal : buildFallbackMarketSignal(breakdown);
  const signalStrip = profile.signal_strip?.length ? profile.signal_strip : buildFallbackSignalStrip(breakdown);
  const compensationLadder =
    profile.compensation_ladder?.length ? profile.compensation_ladder : buildFallbackCompensationLadder(profile, marketSignal);
  const evidenceNodes =
    Array.isArray(profile.evidence_nodes) && profile.evidence_nodes.length
      ? profile.evidence_nodes
      : (profile.evidence_notes || []).map((note, index) => ({
          id: `note-${index + 1}`,
          title: note.source_label,
          class: note.class,
          source_label: note.source_label,
          source_type: note.class === 'observed' ? 'intake' : note.class === 'external' ? 'government' : 'artifact',
          source_url: note.source_url,
          statement: note.note,
          confidence: note.confidence || 'medium',
        }));
  const reportTicker = profile.report_ticker || buildFallbackTicker(profile, evidenceNodes.length);
  const environments =
    profile.market_demand_analysis?.environments?.length
      ? profile.market_demand_analysis.environments
      : [
          ...(profile.environmental_fit?.recommended_habitat || []).slice(0, 2).map((label, index) => ({
            id: `recommended-${index + 1}`,
            label,
            demand_score: 74 - index * 4,
            fit_score: 81 - index * 5,
            compensation_band: profile.compensation_position?.market_value_range || 'Premium scope if proof is visible.',
            hiring_posture: 'Selective',
            rationale: 'Recommended habitat based on operating strengths and fit markers.',
            evidence: 'inferred' as const,
          })),
          ...(profile.compensation_position?.underpay_risk_habitats || []).slice(0, 1).map((label, index) => ({
            id: `underpay-${index + 1}`,
            label,
            demand_score: 58 - index * 4,
            fit_score: 49 - index * 6,
            compensation_band: 'Access may outpace pay.',
            hiring_posture: 'Budget-sensitive',
            rationale: 'Potentially viable but at risk of low cash compensation or weak role shape.',
            evidence: 'inferred' as const,
          })),
        ].slice(0, 4);
  return {
    breakdown,
    marketSignal,
    signalStrip,
    compensationLadder,
    evidenceNodes,
    reportTicker,
    marketDemandAnalysis: {
      summary:
        profile.market_demand_analysis?.summary ||
        'Demand and fit must clear together. Chasing raw demand without habitat fit usually produces the wrong receipt.',
      environments,
    },
  };
};

export const EditorialList = ({ items, accent = 'teal' }: { items: string[]; accent?: 'teal' | 'amber' | 'red' | 'ink' }) => {
  const dotClass =
    accent === 'amber' ? 'bg-[#b8893a]' : accent === 'red' ? 'bg-[#a25555]' : accent === 'ink' ? 'bg-[#28211E]' : 'bg-[#5FAF95]';
  return (
    <ul className="space-y-3 text-sm leading-7 text-black/72 font-body">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-3">
          <span className={`mt-[10px] h-1.5 w-1.5 flex-none rounded-full ${dotClass}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
};

export const DnaCommandBar = ({ items }: { items: DnaSignalStripItem[] }) => (
  <div className="overflow-hidden border border-[#28211E]/12 bg-[#28211E] text-[#f7f1e8] shadow-[0_26px_70px_-52px_rgba(40,33,30,0.85)]">
    <div className="flex flex-wrap items-center gap-x-0 gap-y-4 divide-y divide-white/8 sm:divide-y-0 sm:divide-x sm:divide-white/8">
      {items.map((item) => {
        const tone = styleTone(item.tone);
        return (
          <div key={item.id} className="min-w-[160px] flex-1 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              {item.id === 'live_dossier' ? <span className="h-2.5 w-2.5 rounded-full bg-[#8DD9BF] shadow-[0_0_12px_rgba(141,217,191,0.5)]" /> : null}
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/45 font-data">{item.label}</div>
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              <div className="text-3xl font-data tracking-tight text-white">{item.value}</div>
              <span className={`border px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] ${tone.border} ${tone.text}`}>
                {item.tone}
              </span>
            </div>
            {item.detail ? <div className="mt-2 text-xs leading-5 text-white/55 font-body">{item.detail}</div> : null}
          </div>
        );
      })}
    </div>
  </div>
);

const buildPolyline = (points: { score: number }[], width = 420, height = 180, padding = 18) => {
  if (!points.length) return '';
  return points
    .map((point, index) => {
      const x = padding + (index * (width - padding * 2)) / Math.max(points.length - 1, 1);
      const y = height - padding - ((clampScore(point.score) / 100) * (height - padding * 2));
      return `${x},${y}`;
    })
    .join(' ');
};

export const DnaMarketSignalPanel = ({ signal }: { signal: DnaMarketSignal }) => {
  const polyline = buildPolyline(signal.trajectory);
  return (
    <section className="border border-[#28211E]/12 bg-[#28211E] p-6 text-[#f7f1e8] shadow-[0_26px_70px_-52px_rgba(40,33,30,0.85)] md:p-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#8DD9BF] font-data">Career Market Signal</div>
          <div className="mt-4 text-5xl font-data tracking-tight text-white">+{signal.composite_score}</div>
          <div className="mt-2 text-sm uppercase tracking-[0.22em] text-white/45 font-data">{signal.momentum_label}</div>
        </div>
        <div className="max-w-[250px] text-right text-xs leading-5 text-white/55 font-body">
          <div>{signal.trajectory_type === 'history' ? 'Historical trajectory' : 'Projection path'}</div>
          <div className="mt-2">{signal.trajectory_basis}</div>
        </div>
      </div>

      <div className="mt-6 border border-white/8 bg-white/[0.03] p-4">
        <svg viewBox="0 0 420 180" className="h-[180px] w-full">
          <defs>
            <linearGradient id="dna-signal-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(141,217,191,0.35)" />
              <stop offset="100%" stopColor="rgba(141,217,191,0.02)" />
            </linearGradient>
          </defs>
          {[25, 50, 75].map((grid) => {
            const y = 180 - 18 - ((grid / 100) * (180 - 36));
            return <line key={grid} x1="18" x2="402" y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 6" />;
          })}
          {polyline ? (
            <>
              <polyline
                points={`${polyline} 402,162 18,162`}
                fill="url(#dna-signal-fill)"
                opacity="0.7"
              />
              <polyline points={polyline} fill="none" stroke="#8DD9BF" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
            </>
          ) : null}
          {signal.trajectory.map((point, index) => {
            const x = 18 + (index * (420 - 36)) / Math.max(signal.trajectory.length - 1, 1);
            const y = 180 - 18 - ((clampScore(point.score) / 100) * (180 - 36));
            return <rect key={point.label} x={x - 4} y={y - 4} width="8" height="8" fill="#f7f1e8" stroke="#8DD9BF" strokeWidth="2" />;
          })}
        </svg>
        <div className="mt-3 grid grid-cols-4 gap-3 text-[10px] uppercase tracking-[0.22em] text-white/42 font-data">
          {signal.trajectory.map((point) => (
            <div key={point.label} className="flex flex-col gap-1">
              <span>{point.label}</span>
              <span className="text-white/72">{point.score}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {signal.breakdown.map((item) => {
          const tone = styleTone(item.tone);
          return (
            <div key={item.id} className={`border p-4 ${tone.border} ${tone.surface}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] uppercase tracking-[0.22em] text-black/45 font-data">{item.label}</div>
                <span className={`px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${tone.text}`}>{item.score}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden bg-black/10">
                <div className={`h-full ${tone.accent}`} style={{ width: `${item.score}%` }} />
              </div>
              <div className="mt-3 text-xs leading-5 text-black/62 font-body">{item.rationale}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export const DnaDemandAnalysisPanel = ({
  summary,
  environments,
}: {
  summary: string;
  environments: DnaMarketDemandEnvironment[];
}) => (
  <section className="border border-black/10 bg-[#FBF8F2] p-6 shadow-[0_18px_50px_-44px_rgba(40,33,30,0.35)] md:p-8">
    <div className="flex items-start justify-between gap-6">
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-black/42 font-data">Market Demand Analysis</div>
        <div className="mt-3 max-w-3xl text-lg leading-8 text-[#09161a] font-editorial">{summary}</div>
      </div>
    </div>
    <div className="mt-8 space-y-5">
      {environments.map((environment) => (
        <div key={environment.id} className="border border-black/10 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-base text-[#09161a] font-editorial">{environment.label}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-black/40 font-data">{environment.hiring_posture}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-[0.22em] text-black/40 font-data">Comp Band</div>
              <div className="mt-1 text-sm text-black/72 font-body">{environment.compensation_band}</div>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-black/45 font-data">
              <span>Demand</span>
              <span>{environment.demand_score}</span>
            </div>
            <div className="relative mt-2 h-3 bg-[#ddd5c6]">
              <div className="h-full bg-[#28211E]" style={{ width: `${environment.demand_score}%` }} />
              <div className="absolute inset-y-[-4px] w-[2px] bg-[#b8893a]" style={{ left: `${environment.fit_score}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-black/40 font-data">
              <span>Fit</span>
              <span>{environment.fit_score}</span>
            </div>
          </div>
          <div className="mt-4 text-sm leading-7 text-black/70 font-body">{environment.rationale}</div>
        </div>
      ))}
    </div>
  </section>
);

export const DnaCompensationLadderPanel = ({
  title = 'Compensation Posture',
  ladder,
  receipt,
}: {
  title?: string;
  ladder: DnaCompensationLadderRung[];
  receipt: string[];
}) => (
  <section className="border border-[#28211E]/12 bg-[#28211E] p-6 text-[#f7f1e8] shadow-[0_26px_70px_-52px_rgba(40,33,30,0.85)] md:p-8">
    <div className="text-[10px] uppercase tracking-[0.3em] text-[#8DD9BF] font-data">{title}</div>
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      {ladder.map((rung) => (
        <div key={rung.id} className="border border-white/10 bg-white/[0.04] p-4">
          <div className="text-[10px] uppercase tracking-[0.22em] text-white/45 font-data">{rung.label}</div>
          <div className="mt-3 text-4xl font-data tracking-tight text-white">{rung.grade}</div>
          <div className="mt-3 text-sm leading-6 text-white/62 font-body">{rung.detail}</div>
        </div>
      ))}
    </div>
    {receipt.length ? (
      <div className="mt-6 border border-white/10 bg-white/[0.03] p-5">
        <div className="text-[10px] uppercase tracking-[0.22em] text-white/45 font-data">Needle Movers</div>
        <div className="mt-4">
          <EditorialList items={receipt} />
        </div>
      </div>
    ) : null}
  </section>
);

export const DnaWarRoom = ({ tasks }: { tasks: DnaUrgencyTask[] }) => {
  const accentForTimebox = (timebox?: string) =>
    timebox === 'do_now' ? 'border-l-[#5ed3b4]' : timebox === '48h' ? 'border-l-[#f0b14a]' : 'border-l-[#d9777f]';
  const labelForTimebox = (timebox?: string) => (timebox === 'do_now' ? 'Do Now' : timebox === '48h' ? '48H' : '72H');
  const gridClass = tasks.length >= 3 ? 'xl:grid-cols-3' : tasks.length === 2 ? 'xl:grid-cols-2' : 'xl:grid-cols-1';

  return (
    <section className="border border-black/10 bg-[#FBF8F2] p-6 shadow-[0_18px_50px_-44px_rgba(40,33,30,0.35)] md:p-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-black/42 font-data">72-Hour War Room</div>
          <div className="mt-3 text-3xl text-[#09161a] font-editorial">Move before the market rewrites the receipt.</div>
        </div>
      </div>
      <div className={`mt-6 grid gap-4 ${gridClass}`}>
        {tasks.map((task) => (
          <div key={task.id} className={`border border-black/10 border-l-4 bg-white p-5 ${accentForTimebox(task.timebox)}`}>
            <div className="text-[10px] uppercase tracking-[0.24em] text-black/45 font-data">{labelForTimebox(task.timebox)}</div>
            <div className="mt-3 text-lg leading-8 text-[#09161a] font-editorial">{task.label}</div>
            {task.rationale ? <div className="mt-3 text-sm leading-6 text-black/68 font-body">{task.rationale}</div> : null}
          </div>
        ))}
      </div>
    </section>
  );
};

export const DnaEvidenceNodeGrid = ({ nodes }: { nodes: DnaEvidenceNode[] }) => (
  <div className="grid gap-4 lg:grid-cols-3">
    {nodes.map((node) => (
      <div key={node.id} className="border border-black/10 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="text-[10px] uppercase tracking-[0.22em] text-black/42 font-data">{node.class}</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-black/35 font-data">{node.confidence}</div>
        </div>
        <div className="mt-3 text-xl leading-7 text-[#09161a] font-editorial">{node.title}</div>
        <div className="mt-2 text-[11px] uppercase tracking-[0.22em] text-black/42 font-data">{node.source_label}</div>
        <div className="mt-3 text-sm leading-7 text-black/72 font-body">{node.statement}</div>
        {node.source_url ? (
          <a href={node.source_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-[10px] uppercase tracking-[0.22em] text-[#0f5d53] font-data">
            Source
          </a>
        ) : null}
      </div>
    ))}
  </div>
);

export const DnaTickerBar = ({ ticker }: { ticker: DnaReportTicker }) => (
  <div className="overflow-hidden border border-[#28211E]/12 bg-[#28211E] px-5 py-4 text-[#f7f1e8] shadow-[0_18px_50px_-44px_rgba(40,33,30,0.4)]">
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[10px] uppercase tracking-[0.26em] text-white/48 font-data">
      <span>Report generated {ticker.generated_at}</span>
      <span>Model {ticker.model_version}</span>
      <span>Evidence nodes {ticker.evidence_nodes}</span>
      <span>Confidence {ticker.confidence_rating}</span>
      <span>Source snapshot {ticker.source_snapshot_date}</span>
      <span>Sources active {ticker.source_count}</span>
      <span>Next review {ticker.next_review_date}</span>
    </div>
  </div>
);
