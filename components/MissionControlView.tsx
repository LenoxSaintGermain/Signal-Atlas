import React, { useState } from 'react';
import { AIProfileContent, Mission, SwatAgent } from '../types';

const SWAT_SQUAD_DEFAULTS: SwatAgent[] = [
  { codename: 'signal_strategist', title: 'Signal Strategist', status: 'idle', current_mission_id: null, last_active_at: '' },
  { codename: 'gap_closer', title: 'Gap Closer', status: 'idle', current_mission_id: null, last_active_at: '' },
  { codename: 'intel_analyst', title: 'Intel Analyst', status: 'idle', current_mission_id: null, last_active_at: '' },
  { codename: 'comms_officer', title: 'Comms Officer', status: 'idle', current_mission_id: null, last_active_at: '' },
  { codename: 'readiness_coach', title: 'Readiness Coach', status: 'idle', current_mission_id: null, last_active_at: '' },
];

const AGENT_SPECIALTY: Record<string, string> = {
  signal_strategist: 'Positioning & narrative',
  gap_closer: 'Micro-plans & skill acquisition',
  intel_analyst: 'Market research & opportunities',
  comms_officer: 'High-stakes drafts in your voice',
  readiness_coach: 'Scenario drills & scoring',
};

const statusPill = (status: string) => {
  switch (status) {
    case 'working': return 'border-amber-500/25 bg-amber-50 text-amber-800';
    case 'awaiting_review': return 'border-brand-teal/25 bg-brand-soft text-brand-teal';
    default: return 'border-black/10 bg-white text-black/45';
  }
};

const missionStatusPill = (status: string) => {
  switch (status) {
    case 'ready_for_review': return 'border-brand-teal/25 bg-brand-soft text-brand-teal';
    case 'auto_applied': return 'border-emerald-500/25 bg-emerald-50 text-emerald-800';
    case 'in_progress': return 'border-amber-500/25 bg-amber-50 text-amber-800';
    case 'accepted': return 'border-emerald-500/25 bg-emerald-50 text-emerald-800';
    case 'dismissed': return 'border-black/10 bg-white text-black/45';
    default: return 'border-black/10 bg-white text-black/45';
  }
};

function LegacyAIProfileView({ data }: { data: AIProfileContent }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="admin-mono text-[10px] uppercase tracking-[0.18em] text-brand-teal mb-2">Mission Control</div>
        <h2 className="admin-display text-2xl leading-tight text-[#08161a]">Your operating stance.</h2>
        <p className="admin-body text-[12px] text-black/55 mt-2 max-w-2xl">
          Less &ldquo;tools&rdquo;. More leverage, constraints, and truth. Your SWAT team is being assembled.
        </p>
      </div>
      <section className="border border-black/8 p-4">
        <div className="admin-mono text-[9px] uppercase tracking-[0.14em] text-black/40 mb-2">Positioning</div>
        <div className="admin-body text-[14px] italic leading-relaxed text-[#09161a]">{data.positioning}</div>
      </section>
      <div className="grid grid-cols-2 gap-3">
        <section className="border border-black/8 bg-[#fbfcfa] p-4">
          <div className="admin-mono text-[9px] uppercase tracking-[0.14em] text-black/40 mb-3">Use AI for</div>
          <ul className="space-y-2">
            {data.how_to_use_ai.map((x, i) => (
              <li key={i} className="flex gap-2 admin-body text-[12px] text-[#09161a]">
                <span className="admin-mono text-[10px] text-black/30">{String(i + 1).padStart(2, '0')}</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="border border-black/8 bg-[#fbfcfa] p-4">
          <div className="admin-mono text-[9px] uppercase tracking-[0.14em] text-black/40 mb-3">Guardrails</div>
          <ul className="space-y-2">
            {data.guardrails.map((x, i) => (
              <li key={i} className="flex gap-2 admin-body text-[12px] text-[#09161a]">
                <span className="admin-mono text-[10px] text-black/30">{String(i + 1).padStart(2, '0')}</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

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
  const [expandedMissionId, setExpandedMissionId] = useState<string | null>(null);
  const [reviseNote, setReviseNote] = useState('');
  const [filterAgent, setFilterAgent] = useState<string | null>(null);

  if (!aiProfile.squad || !aiProfile.missions) {
    return <LegacyAIProfileView data={aiProfile} />;
  }

  const squad = aiProfile.squad.length > 0 ? aiProfile.squad : SWAT_SQUAD_DEFAULTS;
  const stance = aiProfile.stance ?? 'copilot';
  const allMissions = aiProfile.missions;
  const missions = filterAgent ? allMissions.filter((m) => m.agent_codename === filterAgent) : allMissions;

  const statusOrder: Record<string, number> = { ready_for_review: 0, in_progress: 1, auto_applied: 2, accepted: 3, dismissed: 4 };
  const sorted = [...missions].sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));

  const reviewCount = allMissions.filter((m) => m.status === 'ready_for_review').length;
  const activeCount = allMissions.filter((m) => m.status === 'in_progress' || m.status === 'ready_for_review').length;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-3">
        <div className="admin-mono text-[10px] uppercase tracking-[0.18em] text-brand-teal mb-1">Mission Control</div>
        <h2 className="admin-display text-xl leading-tight text-[#08161a]">
          Your SWAT team is already working. Steer from here.
        </h2>
      </div>

      <div className="flex gap-1.5 mb-3 overflow-x-auto">
        {squad.map((agent) => {
          const isFiltered = filterAgent === agent.codename;
          const missionCount = allMissions.filter((m) => m.agent_codename === agent.codename && (m.status === 'in_progress' || m.status === 'ready_for_review')).length;
          return (
            <button
              key={agent.codename}
              type="button"
              onClick={() => setFilterAgent(isFiltered ? null : agent.codename)}
              className={`shrink-0 border px-3 py-2 text-left transition-colors ${
                isFiltered ? 'border-l-2 border-l-brand-teal border-brand-teal/25 bg-brand-soft/30' : 'border-black/8 hover:border-brand-teal/40'
              }`}
              style={{ minWidth: 150 }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="admin-mono text-[9px] uppercase tracking-[0.12em] text-[#09161a]">{agent.title}</span>
                <span className={`inline-flex border px-1.5 py-0.5 text-[8px] uppercase tracking-[0.1em] ${statusPill(agent.status)}`}>
                  {agent.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="admin-body text-[10px] text-black/45 mt-0.5">{AGENT_SPECIALTY[agent.codename] || ''}</div>
              {missionCount > 0 && (
                <div className="admin-mono text-[9px] text-brand-teal mt-0.5">{missionCount} active</div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 space-y-0.5">
        {sorted.length === 0 ? (
          <div className="border border-dashed border-black/15 bg-[#fbfcfa] p-6 text-center">
            <div className="admin-body text-[12px] text-black/45">
              {filterAgent ? 'No missions for this agent.' : 'No missions yet. Your SWAT team will activate after suite generation.'}
            </div>
          </div>
        ) : (
          sorted.map((mission) => {
            const expanded = expandedMissionId === mission.id;
            const agent = squad.find((a) => a.codename === mission.agent_codename);
            return (
              <div key={mission.id} className="border border-black/8">
                <button
                  type="button"
                  onClick={() => { setExpandedMissionId(expanded ? null : mission.id); setReviseNote(''); }}
                  className="flex w-full items-center gap-2 px-2.5 py-2 text-left hover:bg-black/[0.015] transition-colors"
                >
                  <span className="admin-mono text-[10px] text-brand-teal w-8 shrink-0">{mission.confidence}%</span>
                  <span className="admin-mono text-[9px] text-black/40 w-28 shrink-0 truncate">{agent?.title || mission.agent_codename}</span>
                  <span className="admin-body text-[12px] text-[#09161a] flex-1 min-w-0 truncate">
                    {mission.title} <span className="text-black/30">&middot; {mission.target_artifact}</span>
                  </span>
                  <span className={`shrink-0 inline-flex border px-1.5 py-0.5 text-[8px] uppercase tracking-[0.1em] ${missionStatusPill(mission.status)}`}>
                    {mission.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[9px] text-black/30">{expanded ? '\u25BE' : '\u25B8'}</span>
                </button>

                {expanded && (
                  <div className="border-t border-black/8 px-3 py-2.5 space-y-2">
                    <div className="admin-body text-[11px] text-black/60 leading-snug">{mission.rationale}</div>

                    {mission.proposed_changes.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="border border-black/8 bg-[#fbfcfa] p-2">
                          <div className="admin-mono text-[8px] uppercase tracking-[0.12em] text-black/35 mb-1">Current</div>
                          {mission.proposed_changes.map((c, i) => (
                            <div key={i} className="mb-1">
                              <div className="admin-mono text-[8px] text-black/30">{c.field}</div>
                              <div className="admin-body text-[11px] text-black/55">{c.before}</div>
                            </div>
                          ))}
                        </div>
                        <div className="border border-brand-teal/20 bg-brand-soft/20 p-2">
                          <div className="admin-mono text-[8px] uppercase tracking-[0.12em] text-brand-teal mb-1">Proposed</div>
                          {mission.proposed_changes.map((c, i) => (
                            <div key={i} className="mb-1">
                              <div className="admin-mono text-[8px] text-brand-teal/60">{c.field}</div>
                              <div className="admin-body text-[11px] text-[#09161a]">{c.after}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {(mission.status === 'ready_for_review' || mission.status === 'auto_applied') && (
                        <>
                          {mission.status === 'auto_applied' ? (
                            <button type="button" onClick={() => onUndo?.(mission.id)}
                              className="border border-black/15 px-2 py-0.5 admin-mono text-[9px] uppercase tracking-[0.14em] text-[#09161a] hover:border-brand-teal">
                              Undo
                            </button>
                          ) : (
                            <>
                              <button type="button" onClick={() => onAccept?.(mission.id)}
                                className="border border-brand-teal/40 bg-brand-soft px-2 py-0.5 admin-mono text-[9px] uppercase tracking-[0.14em] text-brand-teal hover:border-brand-teal">
                                Accept
                              </button>
                              <button type="button" onClick={() => { if (reviseNote.trim()) onRevise?.(mission.id, reviseNote.trim()); }}
                                className="border border-black/15 px-2 py-0.5 admin-mono text-[9px] uppercase tracking-[0.14em] text-[#09161a] hover:border-brand-teal">
                                Revise
                              </button>
                              <input type="text" value={reviseNote} onChange={(e) => setReviseNote(e.target.value)}
                                placeholder="Note for revision..."
                                className="flex-1 border border-black/10 px-2 py-0.5 admin-mono text-[10px] text-[#09161a] placeholder:text-black/25 focus:border-brand-teal focus:outline-none" />
                            </>
                          )}
                          <button type="button" onClick={() => onDismiss?.(mission.id)}
                            className="admin-mono text-[9px] text-black/35 hover:text-red-600/80 hover:underline">
                            Dismiss
                          </button>
                        </>
                      )}
                      {mission.status === 'accepted' && (
                        <span className="admin-mono text-[9px] text-emerald-600">Applied to {mission.target_artifact}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-black/15 bg-[#f4f1eb] px-3 py-1.5 mt-3 -mx-2 -mb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {(['delegator', 'copilot'] as const).map((s) => (
              <button key={s} type="button" onClick={() => onStanceChange?.(s)}
                className={`admin-mono px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] border transition-colors ${
                  stance === s ? 'border-brand-teal bg-brand-soft text-brand-teal' : 'border-black/10 text-black/40 hover:border-brand-teal'
                }`}>
                {s}
              </button>
            ))}
          </div>
          <span className="admin-mono text-[10px] text-black/50">
            {activeCount} active &middot; {reviewCount} awaiting review
          </span>
        </div>
        <button type="button" onClick={() => onDispatch?.(filterAgent || 'signal_strategist')}
          className="admin-mono border border-brand-teal/40 bg-brand-soft px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-brand-teal hover:border-brand-teal">
          + New Mission
        </button>
      </div>
    </div>
  );
}
