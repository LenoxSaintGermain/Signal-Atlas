import React, { useMemo, useState } from 'react';
import { GapsContent, Gap, GapSeverity, GapCategory } from '../types';

/* ── severity palette ── */
const SEVERITY: Record<GapSeverity, { bg: string; border: string; text: string; label: string }> = {
  critical: { bg: 'bg-red-700',    border: 'border-red-700/30',  text: 'text-red-800',    label: 'Critical' },
  high:     { bg: 'bg-amber-500',  border: 'border-amber-500/25', text: 'text-amber-800',  label: 'High' },
  medium:   { bg: 'bg-yellow-600', border: 'border-yellow-600/20', text: 'text-yellow-800', label: 'Medium' },
  low:      { bg: 'bg-emerald-500', border: 'border-emerald-500/20', text: 'text-emerald-700', label: 'Low' },
  closed:   { bg: 'bg-teal-500',   border: 'border-teal-500/20',  text: 'text-teal-700',   label: 'Closed' },
};

const CATEGORY_LABEL: Record<GapCategory, string> = {
  near_term: 'Near-term',
  target_role: 'Target Role',
  constraint: 'Constraint',
};

/* ── agent meta (mirrors MissionControlView) ── */
const AGENT_META: Record<string, { icon: string; label: string }> = {
  gap_closer:       { icon: '🎯', label: 'Gap Closer' },
  signal_strategist: { icon: '📡', label: 'Signal Strategist' },
  intel_analyst:     { icon: '🔬', label: 'Intel Analyst' },
  comms_officer:     { icon: '📝', label: 'Comms Officer' },
  readiness_coach:   { icon: '🏋️', label: 'Readiness Coach' },
};

/* ── demo data ── */
const DEMO_SEVERITY: GapSeverity[] = ['critical', 'high', 'high', 'medium', 'medium', 'low', 'low', 'low'];
const DEMO_URGENCY = [9, 8, 7, 6, 5, 4, 3, 2];
const DEMO_AGENTS: (string | undefined)[] = ['gap_closer', 'signal_strategist', undefined, 'gap_closer', undefined, 'readiness_coach', undefined, undefined];
const DEMO_AGENT_STATUS: ('investigating' | 'recommendation_ready' | 'addressed' | undefined)[] = [
  'investigating', 'recommendation_ready', undefined, 'addressed', undefined, 'investigating', undefined, undefined,
];
const DEMO_DAYS = [12, 8, 5, 3, 7, 2, 1, 0];

function deriveGapStack(gaps: GapsContent): Gap[] {
  if (gaps.gap_stack?.length) return gaps.gap_stack;
  const all: { title: string; category: GapCategory }[] = [
    ...gaps.near_term.map((t) => ({ title: t, category: 'near_term' as GapCategory })),
    ...gaps.for_target_role.map((t) => ({ title: t, category: 'target_role' as GapCategory })),
    ...gaps.constraints.map((t) => ({ title: t, category: 'constraint' as GapCategory })),
  ];
  return all.map((g, i) => ({
    id: `gap-${i}`,
    title: g.title,
    detail: g.title,
    category: g.category,
    severity: DEMO_SEVERITY[i % DEMO_SEVERITY.length],
    urgency: DEMO_URGENCY[i % DEMO_URGENCY.length],
    days_unactioned: DEMO_DAYS[i % DEMO_DAYS.length],
    agent_codename: DEMO_AGENTS[i % DEMO_AGENTS.length],
    agent_status: DEMO_AGENT_STATUS[i % DEMO_AGENT_STATUS.length],
    addressed: false,
  }));
}

function computeWeight(g: Gap): number {
  if (g.addressed) return -1;
  const sevWeight = { critical: 10, high: 7, medium: 4, low: 2, closed: 0 }[g.severity];
  return sevWeight * g.urgency * Math.max(1, g.days_unactioned);
}

type SortMode = 'weight' | 'severity' | 'category';
type FilterMode = 'all' | GapSeverity | GapCategory;

export function GapsView({ gaps }: { gaps: GapsContent }) {
  const [sort, setSort] = useState<SortMode>('weight');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [addressed, setAddressed] = useState<Set<string>>(new Set());

  const stack = useMemo(() => deriveGapStack(gaps), [gaps]);

  const processedStack = useMemo(() => {
    let items = stack.map((g) => ({
      ...g,
      addressed: g.addressed || addressed.has(g.id),
      severity: (g.addressed || addressed.has(g.id)) ? 'closed' as GapSeverity : g.severity,
    }));

    if (filter !== 'all') {
      items = items.filter((g) => {
        if (filter in SEVERITY) return g.severity === filter;
        if (filter in CATEGORY_LABEL) return g.category === filter;
        return true;
      });
    }

    items.sort((a, b) => {
      if (sort === 'weight') return computeWeight(b) - computeWeight(a);
      if (sort === 'severity') {
        const order: GapSeverity[] = ['critical', 'high', 'medium', 'low', 'closed'];
        return order.indexOf(a.severity) - order.indexOf(b.severity);
      }
      return a.category.localeCompare(b.category);
    });

    return items;
  }, [stack, sort, filter, addressed]);

  const openCount = processedStack.filter((g) => !g.addressed).length;
  const closedCount = processedStack.filter((g) => g.addressed).length;
  const totalWeight = processedStack.reduce((s, g) => s + Math.max(0, computeWeight(g)), 0);
  const maxWeight = stack.length * 10 * 10 * 14;
  const readinessScore = gaps.readiness_score ?? Math.round((1 - totalWeight / Math.max(1, maxWeight)) * 100);

  const segments = gaps.readiness_segments ?? {
    awareness: Math.min(100, readinessScore + 20),
    skill_building: Math.min(100, readinessScore + 5),
    application: readinessScore,
    mastery: Math.max(0, readinessScore - 15),
  };

  function handleAddress(id: string) {
    setAddressed((prev) => new Set(prev).add(id));
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── header ── */}
      <div className="mb-4">
        <div className="admin-mono text-[9px] uppercase tracking-[0.16em] text-black/40 mb-1">Module 09</div>
        <h2 className="admin-display text-3xl leading-none text-[#09161a]">The Gap Stack</h2>
        <p className="admin-body text-sm italic text-black/50 mt-1 max-w-xl">
          Not a list of flaws. The shortest set of gaps that unlocks the next level.
        </p>
      </div>

      {/* ── readiness instrument ── */}
      <div className="border border-black/10 bg-[#f8faf8] p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="admin-mono text-[8px] uppercase tracking-[0.14em] text-black/40">Readiness Score</div>
            <div className="admin-display text-4xl leading-none text-[#09161a]">{readinessScore}%</div>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <div className="admin-mono text-[8px] uppercase tracking-[0.14em] text-black/40">Open</div>
              <div className="admin-display text-lg leading-none text-[#09161a]">{openCount}</div>
            </div>
            <div>
              <div className="admin-mono text-[8px] uppercase tracking-[0.14em] text-black/40">Closed</div>
              <div className="admin-display text-lg leading-none text-teal-600">{closedCount}</div>
            </div>
            <div>
              <div className="admin-mono text-[8px] uppercase tracking-[0.14em] text-black/40">Total Weight</div>
              <div className="admin-display text-lg leading-none text-[#09161a]">{totalWeight.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* four-segment readiness track */}
        <div className="grid grid-cols-4 gap-1">
          {([
            { key: 'awareness', label: 'Awareness', value: segments.awareness },
            { key: 'skill_building', label: 'Skill Building', value: segments.skill_building },
            { key: 'application', label: 'Application', value: segments.application },
            { key: 'mastery', label: 'Mastery', value: segments.mastery },
          ] as const).map((seg) => (
            <div key={seg.key}>
              <div className="flex justify-between mb-0.5">
                <span className="admin-mono text-[7px] uppercase tracking-[0.12em] text-black/40">{seg.label}</span>
                <span className="admin-mono text-[8px] text-black/50">{seg.value}%</span>
              </div>
              <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, seg.value)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── sort / filter controls ── */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="admin-mono text-[8px] uppercase tracking-[0.14em] text-black/40">Sort</span>
        {(['weight', 'severity', 'category'] as SortMode[]).map((s) => (
          <button key={s} type="button" onClick={() => setSort(s)}
            className={`admin-mono text-[9px] uppercase tracking-[0.12em] border px-1.5 py-0.5 transition-colors ${
              sort === s ? 'border-teal-500 text-teal-700 bg-teal-50' : 'border-black/10 text-black/40 hover:border-black/25'
            }`}>
            {s}
          </button>
        ))}

        <span className="admin-mono text-[8px] uppercase tracking-[0.14em] text-black/40 ml-2">Filter</span>
        <button type="button" onClick={() => setFilter('all')}
          className={`admin-mono text-[9px] uppercase tracking-[0.12em] border px-1.5 py-0.5 ${
            filter === 'all' ? 'border-teal-500 text-teal-700 bg-teal-50' : 'border-black/10 text-black/40 hover:border-black/25'
          }`}>
          All
        </button>
        {(['critical', 'high', 'medium', 'low'] as GapSeverity[]).map((sev) => (
          <button key={sev} type="button" onClick={() => setFilter(sev)}
            className={`admin-mono text-[9px] uppercase tracking-[0.12em] border px-1.5 py-0.5 ${
              filter === sev ? `${SEVERITY[sev].border} ${SEVERITY[sev].text} bg-white` : 'border-black/10 text-black/40 hover:border-black/25'
            }`}>
            {SEVERITY[sev].label}
          </button>
        ))}
      </div>

      {/* ── gap stack ── */}
      <div className="flex-1 space-y-1 overflow-y-auto min-h-0">
        {processedStack.map((gap, rank) => {
          const sev = SEVERITY[gap.severity];
          const weight = computeWeight(gap);
          const agent = gap.agent_codename ? AGENT_META[gap.agent_codename] : null;

          return (
            <div
              key={gap.id}
              className={`flex items-stretch border transition-all duration-300 ${
                gap.addressed ? 'border-teal-500/20 bg-teal-50/30 opacity-60' : `${sev.border} bg-white`
              }`}
            >
              {/* severity bar */}
              <div className={`w-1 shrink-0 ${gap.addressed ? 'bg-teal-500' : sev.bg}`} />

              {/* rank */}
              <div className="flex items-center justify-center w-8 shrink-0">
                <span className={`admin-mono text-[10px] ${gap.addressed ? 'text-teal-500 line-through' : 'text-black/30'}`}>
                  {String(rank + 1).padStart(2, '0')}
                </span>
              </div>

              {/* content */}
              <div className="flex-1 min-w-0 py-1.5 pr-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`admin-mono text-[8px] uppercase tracking-[0.12em] border px-1 py-px ${
                    gap.addressed ? 'border-teal-500/20 text-teal-600' : `${sev.border} ${sev.text}`
                  }`}>
                    {gap.addressed ? 'Closed' : sev.label}
                  </span>
                  <span className="admin-mono text-[8px] uppercase tracking-[0.12em] border border-black/8 text-black/35 px-1 py-px">
                    {CATEGORY_LABEL[gap.category]}
                  </span>
                  {!gap.addressed && (
                    <span className="admin-mono text-[8px] text-black/25">
                      wt {weight.toLocaleString()} · urg {gap.urgency} · {gap.days_unactioned}d
                    </span>
                  )}
                </div>

                <div className={`admin-body text-[13px] leading-snug ${
                  gap.addressed ? 'text-black/40 line-through' : 'text-[#09161a]'
                }`}>
                  {gap.title}
                </div>

                {/* agent presence */}
                {agent && !gap.addressed && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px]">{agent.icon}</span>
                    <span className="admin-mono text-[8px] text-black/40">{agent.label}</span>
                    {gap.agent_status && (
                      <span className={`admin-mono text-[8px] border px-1 py-px ${
                        gap.agent_status === 'recommendation_ready'
                          ? 'border-amber-400/30 text-amber-700 bg-amber-50'
                          : gap.agent_status === 'addressed'
                          ? 'border-teal-500/20 text-teal-600 bg-teal-50'
                          : 'border-black/10 text-black/35'
                      }`}>
                        {gap.agent_status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* action */}
              <div className="flex items-center pr-2.5 shrink-0">
                {gap.addressed ? (
                  <span className="admin-mono text-[9px] text-teal-500">✓</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAddress(gap.id)}
                    className="admin-mono text-[9px] uppercase tracking-[0.12em] border border-black/15 px-2 py-0.5 text-[#09161a] hover:border-teal-500 hover:text-teal-700 transition-colors"
                  >
                    Address →
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {processedStack.length === 0 && (
          <div className="admin-body text-sm italic text-black/40 py-6 text-center">
            No gaps match the current filter.
          </div>
        )}
      </div>

      {/* ── sticky footer ── */}
      <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-black/15 bg-[#f4f1eb] px-3 py-1.5 mt-2 -mx-2 -mb-2">
        <span className="admin-mono text-[10px] text-black/50">
          Gap Stack · {openCount} open · {closedCount} closed · readiness {readinessScore}%
        </span>
        <span className="admin-mono text-[10px] text-black/35">
          weight {totalWeight.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
