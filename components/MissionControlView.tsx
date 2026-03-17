import React, { useState } from 'react';
import { AIProfileContent, Mission, SwatAgent } from '../types';

/* ── Agent metadata ── */

const SWAT_SQUAD_DEFAULTS: SwatAgent[] = [
  { codename: 'signal_strategist', title: 'Signal Strategist', status: 'idle', current_mission_id: null, last_active_at: '' },
  { codename: 'gap_closer', title: 'Gap Closer', status: 'idle', current_mission_id: null, last_active_at: '' },
  { codename: 'intel_analyst', title: 'Intel Analyst', status: 'idle', current_mission_id: null, last_active_at: '' },
  { codename: 'comms_officer', title: 'Comms Officer', status: 'idle', current_mission_id: null, last_active_at: '' },
  { codename: 'readiness_coach', title: 'Readiness Coach', status: 'idle', current_mission_id: null, last_active_at: '' },
];

interface AgentMeta {
  specialty: string;
  reads: string[];
  enriches: string[];
  triggers: string;
  description: string;
}

const AGENT_META: Record<string, AgentMeta> = {
  signal_strategist: {
    specialty: 'Positioning, narrative, differentiation',
    reads: ['brief', 'profile', 'dna_research'],
    enriches: ['brief', 'profile'],
    triggers: 'Suite generated · DNA refreshed · intake updated',
    description: 'Reads your brief, profile, and DNA research to sharpen positioning. Proposes narrative refinements that strengthen your signal in the market.',
  },
  gap_closer: {
    specialty: 'Targeted micro-plans, skill acquisition',
    reads: ['gaps', 'plan', 'readiness'],
    enriches: ['gaps', 'plan'],
    triggers: 'Gaps unactioned 7d+ · readiness score changes',
    description: 'Surfaces targeted micro-actions for unaddressed gaps. Fires when gaps have been unactioned for 7+ days or when readiness score changes meaningfully.',
  },
  intel_analyst: {
    specialty: 'Company/market research, opportunity surfacing',
    reads: ['dna_research', 'profile'],
    enriches: ['brief', 'gaps'],
    triggers: 'DNA refresh · 7d+ since last intel · user request',
    description: 'Runs company and market research on demand. Surfaces opportunities, competitive intelligence, and industry shifts relevant to your trajectory.',
  },
  comms_officer: {
    specialty: 'High-stakes drafts in your voice',
    reads: ['brief', 'profile', 'brand config'],
    enriches: ['assets', 'plan'],
    triggers: 'User-initiated · plan has pending deliverables',
    description: 'Drafts executive-grade communication artifacts in your voice — applying brand voice constraints and the Robert Frost restraint principle.',
  },
  readiness_coach: {
    specialty: 'Scenario drills, pressure testing, scoring',
    reads: ['readiness', 'gaps', 'profile'],
    enriches: ['readiness', 'gaps'],
    triggers: 'Readiness score <70% · interview prep needed',
    description: 'Schedules pressure-test scenario drills, scores interview readiness, and identifies preparation gaps before high-stakes conversations.',
  },
};

/* ── Status helpers ── */

const dotColor = (status: string) => {
  switch (status) {
    case 'working': return 'bg-brand-teal animate-pulse';
    case 'awaiting_review': return 'bg-amber-500';
    default: return 'bg-black/20';
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'working': return { text: 'Running', color: 'text-brand-teal' };
    case 'awaiting_review': return { text: 'Awaiting', color: 'text-amber-600' };
    default: return { text: 'Idle', color: 'text-black/35' };
  }
};

const missionBadge = (status: string) => {
  switch (status) {
    case 'ready_for_review': return { text: 'Approval Needed', cls: 'border-amber-500/30 bg-amber-50 text-amber-800' };
    case 'auto_applied': return { text: 'Auto-Applied', cls: 'border-emerald-500/25 bg-emerald-50 text-emerald-800' };
    case 'in_progress': return { text: 'Running', cls: 'border-brand-teal/25 bg-brand-soft text-brand-teal' };
    case 'accepted': return { text: 'Accepted', cls: 'border-emerald-500/25 bg-emerald-50 text-emerald-800' };
    case 'dismissed': return { text: 'Dismissed', cls: 'border-black/10 bg-white text-black/40' };
    default: return { text: status.replace(/_/g, ' '), cls: 'border-black/10 bg-white text-black/45' };
  }
};

/* ── Demo missions (shown when backend hasn't populated yet) ── */

const DEMO_MISSIONS: Mission[] = [
  {
    id: 'demo-1', agent_codename: 'signal_strategist', title: 'Refreshing positioning narrative from updated DNA research',
    target_artifact: 'brief', status: 'in_progress', confidence: 85,
    rationale: 'Brief section 2 · DNA research updated 4 hours ago · auto-triggered by DNA refresh event',
    proposed_changes: [], created_at: '', resolved_at: null, user_note: null,
  },
  {
    id: 'demo-2', agent_codename: 'gap_closer', title: 'Propose 3 micro-actions for Leadership Communication gap',
    target_artifact: 'gaps', status: 'ready_for_review', confidence: 64,
    rationale: 'Gaps section 4 unactioned 9 days · confidence 64% — below your 72% threshold, needs your approval',
    proposed_changes: [], created_at: '', resolved_at: null, user_note: null,
  },
  {
    id: 'demo-3', agent_codename: 'comms_officer', title: 'Drafting executive summary asset for pending plan deliverable',
    target_artifact: 'assets', status: 'in_progress', confidence: 78,
    rationale: 'Assets · Plan section has 3 pending deliverables · applying brand voice + Robert Frost restraint constraint',
    proposed_changes: [], created_at: '', resolved_at: null, user_note: null,
  },
  {
    id: 'demo-4', agent_codename: 'readiness_coach', title: 'Schedule pressure-test scenario drill for Director-level interview',
    target_artifact: 'readiness', status: 'in_progress', confidence: 71,
    rationale: 'Readiness score 68% · below 70% threshold · queued behind 2 running jobs',
    proposed_changes: [], created_at: '', resolved_at: null, user_note: null,
  },
];

const DEMO_SQUAD: SwatAgent[] = [
  { codename: 'signal_strategist', title: 'Signal Strategist', status: 'working', current_mission_id: 'demo-1', last_active_at: '' },
  { codename: 'gap_closer', title: 'Gap Closer', status: 'awaiting_review', current_mission_id: 'demo-2', last_active_at: '' },
  { codename: 'intel_analyst', title: 'Intel Analyst', status: 'idle', current_mission_id: null, last_active_at: '' },
  { codename: 'comms_officer', title: 'Comms Officer', status: 'working', current_mission_id: 'demo-3', last_active_at: '' },
  { codename: 'readiness_coach', title: 'Readiness Coach', status: 'working', current_mission_id: 'demo-4', last_active_at: '' },
];

/* ── Component ── */

export function MissionControlView({
  aiProfile,
  onAccept,
  onRevise,
  onDismiss,
  onUndo,
  onDispatch,
  onStanceChange,
}: {
  aiProfile: AIProfileContent;
  onAccept?: (missionId: string) => void;
  onRevise?: (missionId: string, note: string) => void;
  onDismiss?: (missionId: string) => void;
  onUndo?: (missionId: string) => void;
  onDispatch?: (agentCodename: string) => void;
  onStanceChange?: (stance: 'delegator' | 'copilot') => void;
}) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [filterAgent, setFilterAgent] = useState<string | null>(null);
  const [reviseNote, setReviseNote] = useState('');

  const hasBackendData = Boolean(aiProfile.squad?.length && aiProfile.missions?.length);
  const squad = hasBackendData ? aiProfile.squad : DEMO_SQUAD;
  const allMissions = hasBackendData ? aiProfile.missions : DEMO_MISSIONS;
  const stance = aiProfile.stance ?? 'copilot';
  const threshold = aiProfile.confidence_thresholds?.auto_apply ?? (stance === 'delegator' ? 70 : 90);

  const missions = filterAgent ? allMissions.filter((m) => m.agent_codename === filterAgent) : allMissions;
  const statusOrder: Record<string, number> = { ready_for_review: 0, in_progress: 1, auto_applied: 2, accepted: 3, dismissed: 4 };
  const sorted = [...missions].sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));

  const reviewCount = allMissions.filter((m) => m.status === 'ready_for_review').length;
  const runningCount = allMissions.filter((m) => m.status === 'in_progress').length;
  const activeCount = runningCount + reviewCount;

  const detail = selectedAgent ? AGENT_META[selectedAgent] : null;
  const detailAgent = selectedAgent ? squad.find((a) => a.codename === selectedAgent) : null;

  return (
    <div className="flex flex-col h-full">

      {/* ── Operating Stance Bar ── */}
      <div className="flex items-center justify-between gap-4 bg-[#ede7da] border-b border-black/10 px-5 py-2.5 -mx-2 -mt-2 mb-0">
        <div className="flex items-center gap-3">
          <span className="admin-mono text-[8px] font-bold uppercase tracking-[0.14em] text-black/40">Operating Stance</span>
          <span className="admin-body text-[12px] italic text-black/45">Controls what agents auto-apply vs. surface for your approval.</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-black/10">
            {(['copilot', 'delegator'] as const).map((s) => (
              <button key={s} type="button" onClick={() => onStanceChange?.(s)}
                className={`admin-mono px-3 py-1 text-[8px] font-bold uppercase tracking-[0.1em] border-r border-black/10 last:border-r-0 transition-colors ${
                  stance === s ? 'bg-brand-soft/60 text-brand-teal' : 'text-black/40 hover:bg-brand-soft/20 hover:text-brand-teal'
                }`}>
                {s === 'copilot' ? 'Co-Pilot' : 'Delegator'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="admin-mono text-[8px] font-bold uppercase tracking-[0.14em] text-black/40">Auto-Apply</span>
            <div className="relative w-28 h-1 bg-black/10">
              <div className="absolute inset-y-0 left-0 bg-brand-teal" style={{ width: `${threshold}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-brand-teal bg-[#f4f1eb]" style={{ left: `${threshold}%`, transform: `translateX(-50%) translateY(-50%)` }} />
            </div>
            <span className="admin-mono text-[10px] font-bold text-brand-teal">{threshold}%</span>
          </div>
        </div>
      </div>

      {/* ── Section: Your AI Profile + Positioning ── */}
      <div className="px-3 pt-4 pb-2">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <div className="admin-mono text-[8px] font-bold uppercase tracking-[0.18em] text-brand-teal flex items-center gap-2 mb-1">
              Your AI Profile <span className="inline-block w-5 h-px bg-brand-teal/40" />
            </div>
            <div className="admin-display text-lg leading-tight text-[#09161a]">How you should use AI.</div>
          </div>
          <div className="admin-body text-[12px] italic text-black/45">This is your operating stance. Less &ldquo;tools&rdquo;. More leverage, constraints, and truth.</div>
        </div>
      </div>

      {/* Positioning card */}
      <div className="mx-3 mb-3 flex items-start gap-4 border border-black/10 border-l-[3px] border-l-brand-teal bg-[#ede7da] px-4 py-3">
        <span className="admin-mono text-[8px] font-bold uppercase tracking-[0.14em] text-brand-teal shrink-0 pt-0.5 w-20">Positioning</span>
        <span className="admin-display text-[15px] italic leading-snug text-[#09161a]">{aiProfile.positioning}</span>
      </div>

      {/* ── Section: SWAT Operations Board ── */}
      <div className="px-3 mb-2">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="admin-mono text-[8px] font-bold uppercase tracking-[0.18em] text-brand-teal flex items-center gap-2 mb-1">
              SWAT Operations Board <span className="inline-block w-5 h-px bg-brand-teal/40" />
            </div>
            <div className="admin-display text-base leading-tight text-[#09161a]">Five specialists. Already briefed.</div>
          </div>
          <div className="admin-body text-[12px] italic text-black/45">Your job is to steer.</div>
        </div>
      </div>

      {/* ── Agent Grid ── */}
      <div className="grid grid-cols-5 gap-1.5 px-3 mb-3">
        {squad.map((agent) => {
          const meta = AGENT_META[agent.codename];
          const isFiltered = filterAgent === agent.codename;
          const agentMissions = allMissions.filter((m) => m.agent_codename === agent.codename);
          const activeMissions = agentMissions.filter((m) => m.status === 'in_progress' || m.status === 'ready_for_review').length;
          const sl = statusLabel(agent.status);
          return (
            <button
              key={agent.codename}
              type="button"
              onClick={() => { setFilterAgent(isFiltered ? null : agent.codename); setSelectedAgent(null); }}
              onDoubleClick={() => setSelectedAgent(agent.codename)}
              className={`border text-left px-2.5 py-2 transition-colors ${
                isFiltered ? 'border-brand-teal/40 bg-brand-soft/20' : 'border-black/8 hover:border-brand-teal/30'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor(agent.status)}`} />
                <span className={`admin-mono text-[8px] uppercase tracking-[0.1em] ${
                  agent.status === 'working' ? 'text-brand-teal' : agent.status === 'awaiting_review' ? 'text-amber-600' : 'text-black/30'
                }`}>{agent.status === 'working' ? 'Auto' : agent.status === 'awaiting_review' ? 'Review' : 'Idle'}</span>
              </div>
              <div className="admin-mono text-[9px] font-bold text-[#09161a] mb-0.5">{agent.title}</div>
              <div className="admin-body text-[10px] italic text-black/45 mb-1.5">{meta?.specialty || ''}</div>
              <div className="mb-1">
                <span className="admin-mono text-[7px] uppercase tracking-[0.1em] text-black/30">Reads</span>
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {meta?.reads.map((r) => (
                    <span key={r} className="admin-mono text-[7px] border border-brand-teal/20 text-brand-teal bg-brand-soft/30 px-1 py-px">{r}</span>
                  ))}
                </div>
              </div>
              <div className="mb-1.5">
                <span className="admin-mono text-[7px] uppercase tracking-[0.1em] text-black/30">Enriches</span>
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {meta?.enriches.map((r) => (
                    <span key={r} className="admin-mono text-[7px] border border-brand-teal/25 text-brand-teal bg-brand-soft/40 px-1 py-px">{r}</span>
                  ))}
                </div>
              </div>
              <div className="admin-mono text-[7px] text-black/30 truncate">{meta?.triggers || ''}</div>
              <div className="w-full h-0.5 bg-black/8 mt-1">
                <div className="h-full bg-brand-teal transition-all" style={{ width: `${activeMissions > 0 ? Math.min(activeMissions * 40, 100) : 0}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Agent Detail Modal ── */}
      {selectedAgent && detail && detailAgent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSelectedAgent(null)}>
          <div className="w-[500px] max-h-[80vh] overflow-y-auto bg-[#f4f1eb] animate-in fade-in slide-in-from-bottom-2" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#1a1814] px-5 py-4 flex items-baseline justify-between">
              <div>
                <span className="admin-mono text-[8px] text-brand-teal uppercase tracking-[0.14em] block mb-1">{detailAgent.codename.replace(/_/g, ' ')}</span>
                <span className="admin-display text-lg text-[#f4f1eb]">{detailAgent.title}</span>
              </div>
              <button type="button" onClick={() => setSelectedAgent(null)}
                className="admin-mono text-[9px] text-[#f4f1eb]/50 border border-[#f4f1eb]/10 px-2 py-1 hover:text-[#f4f1eb] hover:border-[#f4f1eb]/30">
                Close
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="admin-mono text-[8px] font-bold uppercase tracking-[0.14em] text-black/40 w-24">Status</span>
                <span className={`admin-body text-[13px] ${statusLabel(detailAgent.status).color}`}>
                  {statusLabel(detailAgent.status).text} — {threshold}% confidence
                </span>
              </div>
              <div>
                <div className="admin-mono text-[8px] font-bold uppercase tracking-[0.14em] text-black/40 flex items-center gap-2 mb-2">
                  Description <span className="flex-1 h-px bg-black/10" />
                </div>
                <div className="admin-body text-[13px] italic text-[#09161a] leading-relaxed">{detail.description}</div>
              </div>
              <div>
                <div className="admin-mono text-[8px] font-bold uppercase tracking-[0.14em] text-black/40 flex items-center gap-2 mb-2">
                  Data Access <span className="flex-1 h-px bg-black/10" />
                </div>
                <div className="flex items-center gap-2 py-1.5 border-b border-black/8">
                  <span className="admin-mono text-[9px] font-bold uppercase tracking-[0.1em] text-black/40 w-24">Reads</span>
                  <div className="flex flex-wrap gap-1">
                    {detail.reads.map((r) => (
                      <span key={r} className="admin-mono text-[8px] border border-brand-teal/20 text-brand-teal px-1.5 py-0.5">{r}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 py-1.5 border-b border-black/8">
                  <span className="admin-mono text-[9px] font-bold uppercase tracking-[0.1em] text-black/40 w-24">Enriches</span>
                  <div className="flex flex-wrap gap-1">
                    {detail.enriches.map((r) => (
                      <span key={r} className="admin-mono text-[8px] border border-brand-teal/25 bg-brand-soft/30 text-brand-teal px-1.5 py-0.5">{r}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <div className="admin-mono text-[8px] font-bold uppercase tracking-[0.14em] text-black/40 flex items-center gap-2 mb-2">
                  Trigger Events <span className="flex-1 h-px bg-black/10" />
                </div>
                {detail.triggers.split(' · ').map((t) => (
                  <div key={t} className="flex items-center gap-2 py-1 border-b border-black/6 last:border-b-0">
                    <span className="w-1 h-1 rounded-full bg-brand-teal/40 shrink-0" />
                    <span className="admin-body text-[12px] text-[#09161a]">{t}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 py-1.5">
                <span className="admin-mono text-[9px] font-bold uppercase tracking-[0.1em] text-black/40 w-24">Operating</span>
                <span className="admin-body text-[13px] text-[#09161a]">Below threshold — requires your approval</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Mission Queue Header ── */}
      <div className="flex items-baseline justify-between px-3 mb-1">
        <div className="admin-mono text-[8px] font-bold uppercase tracking-[0.18em] text-black/40 flex items-center gap-2">
          Active Mission Queue <span className="inline-block w-5 h-px bg-black/10" />
        </div>
        <div className="flex items-center gap-2">
          <span className="admin-mono text-[8px] text-black/40">{activeCount} active · {reviewCount} awaiting approval</span>
          {reviewCount > 0 && (
            <button type="button" onClick={() => allMissions.filter((m) => m.status === 'ready_for_review').forEach((m) => onAccept?.(m.id))}
              className="admin-mono text-[8px] font-bold uppercase tracking-[0.1em] border border-black/10 text-black/50 px-2.5 py-1 hover:border-brand-teal hover:text-brand-teal transition-colors">
              Approve All &rarr;
            </button>
          )}
        </div>
      </div>

      {/* ── Mission Rows ── */}
      <div className="flex-1 min-h-0 px-3 space-y-0">
        {sorted.length === 0 ? (
          <div className="border border-dashed border-black/15 bg-[#fbfcfa] p-4 text-center admin-body text-[12px] text-black/45">
            {filterAgent ? 'No missions for this agent.' : 'No missions yet. Your SWAT team will activate after suite generation.'}
          </div>
        ) : sorted.map((mission) => {
          const agent = squad.find((a) => a.codename === mission.agent_codename);
          const sl = statusLabel(agent?.status || 'idle');
          const badge = missionBadge(mission.status);
          return (
            <div key={mission.id} className={`flex items-stretch border-b border-black/8 ${mission.status === 'ready_for_review' ? 'bg-amber-50/30' : ''}`}>
              {/* Agent column */}
              <div className="w-36 shrink-0 py-2.5 px-2 border-r border-black/8">
                <div className="admin-mono text-[10px] font-bold text-[#09161a]">{agent?.title || mission.agent_codename}</div>
                <div className={`flex items-center gap-1.5 mt-0.5 ${sl.color}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${dotColor(agent?.status || 'idle')}`} />
                  <span className="admin-mono text-[9px]">{sl.text}</span>
                </div>
              </div>
              {/* Mission body */}
              <div className="flex-1 min-w-0 py-2.5 px-3">
                <div className="admin-display text-[13px] text-[#09161a] leading-snug truncate">{mission.title}</div>
                <div className="admin-body text-[10px] italic text-black/40 mt-0.5 truncate">{mission.rationale}</div>
              </div>
              {/* Right: badge + actions */}
              <div className="w-40 shrink-0 flex flex-col items-end justify-center gap-1 py-2 px-2">
                <span className={`inline-flex border px-2 py-0.5 text-[8px] uppercase tracking-[0.1em] ${badge.cls}`}>{badge.text}</span>
                {mission.status === 'ready_for_review' && (
                  <div className="flex gap-1">
                    <button type="button" onClick={() => onAccept?.(mission.id)}
                      className="admin-mono text-[8px] font-bold border border-brand-teal/40 bg-brand-soft text-brand-teal px-2 py-0.5 hover:border-brand-teal transition-colors">
                      Approve &rarr;
                    </button>
                    <button type="button" onClick={() => onDismiss?.(mission.id)}
                      className="admin-mono text-[8px] border border-black/10 text-black/40 px-2 py-0.5 hover:border-red-400 hover:text-red-600 transition-colors">
                      Skip
                    </button>
                  </div>
                )}
                {mission.status === 'auto_applied' && (
                  <button type="button" onClick={() => onUndo?.(mission.id)}
                    className="admin-mono text-[8px] text-black/35 hover:text-red-600 hover:underline">Undo</button>
                )}
                {mission.status === 'in_progress' && (
                  <span className="admin-mono text-[8px] text-black/30">Auto · {mission.confidence}% conf</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Operating Rules ── */}
      <div className="px-3 py-2 flex items-center gap-2 border-t border-black/8 mt-1">
        <span className="admin-mono text-[8px] font-bold uppercase tracking-[0.14em] text-black/30">Operating Rules</span>
        <span className="admin-body text-[10px] italic text-black/35">In {aiProfile.how_to_use_ai?.length || 0} use profiles · applied to all agents</span>
      </div>

      {/* ── Use AI For / Guardrails ── */}
      <div className="grid grid-cols-2 gap-1.5 px-3 mb-2">
        <div className="border border-black/8 bg-[#ede7da] p-3">
          <div className="admin-mono text-[8px] font-bold uppercase tracking-[0.14em] text-black/35 flex items-center gap-2 mb-2">
            Use AI For <span className="flex-1 h-px bg-black/8" />
          </div>
          <div className="space-y-1.5">
            {aiProfile.how_to_use_ai.map((x, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="admin-mono text-[9px] font-bold text-brand-teal shrink-0 w-4">{String(i + 1).padStart(2, '0')}</span>
                <span className="admin-body text-[12px] text-[#09161a] leading-snug">{x}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="border border-black/8 bg-[#ede7da] p-3">
          <div className="admin-mono text-[8px] font-bold uppercase tracking-[0.14em] text-black/35 flex items-center gap-2 mb-2">
            Guardrails <span className="flex-1 h-px bg-black/8" />
          </div>
          <div className="space-y-1.5">
            {aiProfile.guardrails.map((x, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="admin-mono text-[9px] font-bold text-brand-teal shrink-0 w-4">{String(i + 1).padStart(2, '0')}</span>
                <span className="admin-body text-[12px] text-[#09161a] leading-snug">{x}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sticky Footer ── */}
      <div className="sticky bottom-0 flex items-center justify-between gap-2 bg-[#1a1814] border-t border-[#f4f1eb]/10 px-4 py-2.5 -mx-2 -mb-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-pulse" />
          <span className="admin-mono text-[9px] text-[#f4f1eb]/50 tracking-[0.1em]">
            Module 08 · SWAT Board · {runningCount} agents running · {reviewCount} awaiting approval
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => {}}
            className="admin-mono text-[9px] text-[#f4f1eb]/40 border border-[#f4f1eb]/10 px-3 py-1 hover:text-[#f4f1eb] hover:border-[#f4f1eb]/30 transition-colors">
            Discard
          </button>
          <button type="button" onClick={() => onDispatch?.(filterAgent || 'signal_strategist')}
            className="admin-mono text-[9px] font-bold bg-brand-teal text-white px-4 py-1 hover:bg-brand-teal/80 transition-colors tracking-[0.14em] uppercase">
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
