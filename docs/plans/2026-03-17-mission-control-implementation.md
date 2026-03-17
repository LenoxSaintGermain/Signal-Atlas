# Mission Control Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the static "Your AI Profile" module (08) with Mission Control — a living operations board staffed by 5 SWAT agents that enrich existing artifacts via confidence-scored missions.

**Architecture:** Phase 1 ships the full frontend (MissionControlView, data model, API service) + module rename across all dependencies. Phase 2 adds the backend endpoints and agent prompts. Phase 3 wires event triggers. Each phase is independently deployable — Phase 1 renders with mock/seeded data until Phase 2 lands.

**Tech Stack:** React 19, TypeScript, Tailwind CSS (CDN), Vite, Express.js, Firestore, Gemini 2.5 Pro

---

## Phase 1: Frontend + Data Model + Dependency Updates

### Task 1: Expand AIProfileContent types

**Files:**
- Modify: `types.ts:404-408`

**Step 1: Add new interfaces after existing AIProfileContent**

Replace lines 404-408 in `types.ts` with:

```typescript
export interface SwatAgent {
  codename: string;
  title: string;
  status: 'working' | 'idle' | 'awaiting_review';
  current_mission_id: string | null;
  last_active_at: string;
}

export interface MissionProposedChange {
  field: string;
  before: string;
  after: string;
}

export interface Mission {
  id: string;
  agent_codename: string;
  title: string;
  target_artifact: string;
  status: 'in_progress' | 'ready_for_review' | 'auto_applied' | 'accepted' | 'dismissed';
  confidence: number;
  rationale: string;
  proposed_changes: MissionProposedChange[];
  created_at: string;
  resolved_at: string | null;
  user_note: string | null;
}

export interface AIProfileContent {
  // Legacy fields (backwards compat — old artifacts still render)
  positioning: string;
  how_to_use_ai: string[];
  guardrails: string[];

  // Mission Control fields (optional for backwards compat)
  stance?: 'delegator' | 'copilot';
  confidence_thresholds?: {
    auto_apply: number;
    review: number;
  };
  squad?: SwatAgent[];
  missions?: Mission[];
}
```

**Step 2: Verify build**

Run: `npx vite build`
Expected: PASS (all existing consumers still work because new fields are optional)

**Step 3: Commit**

```bash
git add types.ts
git commit -m "feat: expand AIProfileContent with Mission Control types (SwatAgent, Mission)"
```

---

### Task 2: Rename module in suite/modules.ts

**Files:**
- Modify: `suite/modules.ts:63-69`

**Step 1: Update module metadata**

Replace lines 63-69:

```typescript
  {
    id: 'ai_profile',
    index: '08',
    title: 'Mission Control',
    subtitle: 'Your SWAT team is already working. Steer from here.',
    kind: 'artifact',
    relatedIds: ['brief', 'profile', 'plan', 'gaps', 'readiness'],
  },
```

**Step 2: Verify build**

Run: `npx vite build`
Expected: PASS

**Step 3: Commit**

```bash
git add suite/modules.ts
git commit -m "feat: rename module 08 from 'Your AI Profile' to 'Mission Control'"
```

---

### Task 3: Update BrandStudioSection label

**Files:**
- Modify: `components/admin/BrandStudioSection.tsx:28`

**Step 1: Update label**

Change line 28 from:
```typescript
  ai_profile: '08 AI Profile',
```
to:
```typescript
  ai_profile: '08 Mission Control',
```

**Step 2: Verify build**

Run: `npx vite build`
Expected: PASS

**Step 3: Commit**

```bash
git add components/admin/BrandStudioSection.tsx
git commit -m "feat: update admin label for module 08 to Mission Control"
```

---

### Task 4: Create missionApi service

**Files:**
- Create: `services/missionApi.ts`

**Step 1: Create the API service**

This follows the same pattern as `suiteApi.ts` — uses `resolveApiOrigin()` and Firebase auth token.

```typescript
import { auth } from './firebase';
import { Mission } from '../types';
import { resolveApiOrigin } from './apiOrigin';

const authedFetch = async (path: string, options: RequestInit = {}) => {
  const origin = resolveApiOrigin();
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();

  const resp = await fetch(`${origin}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`API error (${resp.status}): ${txt || resp.statusText}`);
  }

  return resp.json();
};

export const missionSweep = (triggerEvent: string): Promise<{ missions: Mission[] }> =>
  authedFetch('/v1/missions/sweep', {
    method: 'POST',
    body: JSON.stringify({ trigger_event: triggerEvent }),
  });

export const missionDispatch = (agentCodename: string, instructions?: string): Promise<{ mission: Mission }> =>
  authedFetch('/v1/missions/dispatch', {
    method: 'POST',
    body: JSON.stringify({ agent_codename: agentCodename, instructions }),
  });

export const missionAccept = (missionId: string): Promise<{ mission: Mission }> =>
  authedFetch(`/v1/missions/${missionId}/accept`, { method: 'POST' });

export const missionRevise = (missionId: string, note: string): Promise<{ mission: Mission }> =>
  authedFetch(`/v1/missions/${missionId}/revise`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });

export const missionDismiss = (missionId: string): Promise<{ mission: Mission }> =>
  authedFetch(`/v1/missions/${missionId}/dismiss`, { method: 'POST' });

export const missionUndo = (missionId: string): Promise<{ mission: Mission }> =>
  authedFetch(`/v1/missions/${missionId}/undo`, { method: 'POST' });

export const updateStance = (stance: 'delegator' | 'copilot'): Promise<void> =>
  authedFetch('/v1/ai-profile/stance', {
    method: 'PATCH',
    body: JSON.stringify({ stance }),
  });
```

**Step 2: Verify build**

Run: `npx vite build`
Expected: PASS

**Step 3: Commit**

```bash
git add services/missionApi.ts
git commit -m "feat: add missionApi service for Mission Control endpoints"
```

---

### Task 5: Build MissionControlView component

**Files:**
- Create: `components/MissionControlView.tsx`

**Step 1: Create the full component**

This is the core UI — 3 zones (team strip, mission board, dispatch bar). It must handle both legacy data (positioning/how_to_use_ai/guardrails only) and new Mission Control data (squad/missions).

```typescript
import React, { useState } from 'react';
import { AIProfileContent, Mission, SwatAgent } from '../types';

/* ── Constants ── */

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

/* ── Legacy fallback ── */

function LegacyAIProfileView({ data }: { data: AIProfileContent }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="admin-mono text-[10px] uppercase tracking-[0.18em] text-brand-teal mb-2">Your AI Profile</div>
        <h2 className="admin-display text-2xl leading-tight text-[#08161a]">How you should use AI.</h2>
        <p className="admin-body text-[12px] text-black/55 mt-2 max-w-2xl">
          This is your operating stance. Less "tools". More leverage, constraints, and truth.
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

/* ── Main component ── */

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

  // Backwards compat: if no missions, render legacy view
  if (!aiProfile.squad || !aiProfile.missions) {
    return <LegacyAIProfileView data={aiProfile} />;
  }

  const squad = aiProfile.squad.length > 0 ? aiProfile.squad : SWAT_SQUAD_DEFAULTS;
  const stance = aiProfile.stance ?? 'copilot';
  const allMissions = aiProfile.missions;
  const missions = filterAgent ? allMissions.filter((m) => m.agent_codename === filterAgent) : allMissions;

  // Sort: ready_for_review first, then in_progress, then auto_applied, then rest
  const statusOrder: Record<string, number> = { ready_for_review: 0, in_progress: 1, auto_applied: 2, accepted: 3, dismissed: 4 };
  const sorted = [...missions].sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));

  const reviewCount = allMissions.filter((m) => m.status === 'ready_for_review').length;
  const activeCount = allMissions.filter((m) => m.status === 'in_progress' || m.status === 'ready_for_review').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-3">
        <div className="admin-mono text-[10px] uppercase tracking-[0.18em] text-brand-teal mb-1">Mission Control</div>
        <h2 className="admin-display text-xl leading-tight text-[#08161a]">
          Your SWAT team is already working. Steer from here.
        </h2>
      </div>

      {/* Zone 1: Team strip */}
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

      {/* Zone 2: Mission board */}
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
                    {mission.title} <span className="text-black/30">· {mission.target_artifact}</span>
                  </span>
                  <span className={`shrink-0 inline-flex border px-1.5 py-0.5 text-[8px] uppercase tracking-[0.1em] ${missionStatusPill(mission.status)}`}>
                    {mission.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[9px] text-black/30">{expanded ? '▾' : '▸'}</span>
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

      {/* Zone 3: Dispatch bar */}
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
            {activeCount} active · {reviewCount} awaiting review
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
```

**Step 2: Verify build**

Run: `npx vite build`
Expected: PASS

**Step 3: Commit**

```bash
git add components/MissionControlView.tsx
git commit -m "feat: create MissionControlView with team strip, mission board, dispatch bar"
```

---

### Task 6: Wire MissionControlView into App.tsx

**Files:**
- Modify: `App.tsx:14` (import)
- Modify: `App.tsx:1558-1559` (render)

**Step 1: Replace import**

Change line 14 from:
```typescript
import { AIProfileView } from './components/AIProfileView';
```
to:
```typescript
import { MissionControlView } from './components/MissionControlView';
```

**Step 2: Replace render block**

Change lines 1558-1559 from:
```tsx
{artifact && artifact.type === 'ai_profile' && openModule.id === 'ai_profile' && artifact.content && (
  <AIProfileView aiProfile={artifact.content} />
)}
```
to:
```tsx
{artifact && artifact.type === 'ai_profile' && openModule.id === 'ai_profile' && artifact.content && (
  <MissionControlView
    aiProfile={artifact.content}
    onAccept={(id) => console.log('accept', id)}
    onRevise={(id, note) => console.log('revise', id, note)}
    onDismiss={(id) => console.log('dismiss', id)}
    onUndo={(id) => console.log('undo', id)}
    onDispatch={(agent) => console.log('dispatch', agent)}
    onStanceChange={(stance) => console.log('stance', stance)}
  />
)}
```

Note: callbacks are console.log stubs for Phase 1. Phase 2 will wire them to `missionApi`.

**Step 3: Verify build**

Run: `npx vite build`
Expected: PASS

**Step 4: Commit**

```bash
git add App.tsx
git commit -m "feat: wire MissionControlView into App.tsx (Phase 1 — stub callbacks)"
```

---

### Task 7: Delete old AIProfileView and verify

**Files:**
- Delete: `components/AIProfileView.tsx`

**Step 1: Remove the old file**

```bash
rm components/AIProfileView.tsx
```

The legacy rendering logic is now inside `MissionControlView.tsx` as `LegacyAIProfileView`.

**Step 2: Verify no other imports**

```bash
grep -r "AIProfileView" components/ App.tsx services/ suite/ types.ts
```
Expected: No matches

**Step 3: Verify build**

Run: `npx vite build`
Expected: PASS

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove old AIProfileView (legacy render moved into MissionControlView)"
```

---

### Task 8: Verify full build and deploy

**Step 1: Final build check**

Run: `npx vite build`
Expected: PASS

**Step 2: Commit all Phase 1 work (if any stragglers)**

```bash
git status
```

**Step 3: Push and deploy**

```bash
git push origin LenoxSaintGermain/admin-console-overhaul
gcloud builds submit --tag europe-west1-docker.pkg.dev/ssai-f6191/cloud-run-source-deploy/career-concierge-suite:latest --project ssai-f6191 --region europe-west1
gcloud run deploy career-concierge-suite --image europe-west1-docker.pkg.dev/ssai-f6191/cloud-run-source-deploy/career-concierge-suite:latest --project ssai-f6191 --region europe-west1
```

---

## Phase 2: Backend Endpoints + Agent Prompts

> Phase 2 adds the 6 API endpoints and 5 SWAT agent system prompts to `api/index.js`.
> Prerequisite: Phase 1 deployed.

### Task 9: Add SWAT agent system prompts to api/index.js

**Files:**
- Modify: `api/index.js` (add after AGENT_REGISTRY, before route handlers)

Add a `SWAT_AGENTS` constant with system prompts for each agent. Each prompt receives the full user context (all artifacts) and must return structured JSON with `title`, `target_artifact`, `rationale`, and `proposed_changes[]`.

### Task 10: Add /v1/missions/sweep endpoint

POST endpoint that:
1. Reads user's full artifact set
2. Evaluates trigger conditions per agent
3. Calls Gemini 2.5 Pro with agent prompt + context for triggered agents
4. Scores confidence
5. Creates Mission records in ai_profile artifact
6. Auto-applies if above threshold

### Task 11: Add mission action endpoints

- POST `/v1/missions/:id/accept` — apply changes to target artifact, mark accepted
- POST `/v1/missions/:id/revise` — mark in_progress, store note, re-dispatch to agent
- POST `/v1/missions/:id/dismiss` — mark dismissed
- POST `/v1/missions/:id/undo` — revert auto-applied changes
- POST `/v1/missions/dispatch` — user-initiated mission for specific agent
- PATCH `/v1/ai-profile/stance` — update stance + thresholds

### Task 12: Wire App.tsx callbacks to missionApi

Replace console.log stubs with actual API calls and artifact refresh.

---

## Phase 3: Event Triggers

### Task 13: Hook sweep into suite generation

Call `initializeSwatSquad()` after ai_profile creation in all 3 generation paths.

### Task 14: Hook sweep into DNA research refresh

After `recordDnaResearchRun()`, trigger sweep with `trigger_event: 'dna_refreshed'`.

### Task 15: Add staleness cron check

Cloud Scheduler job that calls `/v1/missions/sweep` with `trigger_event: 'staleness_check'` for users with >7d inactive artifacts.

---

## Summary

| Phase | Tasks | Deployable | What ships |
|-------|-------|------------|------------|
| 1 | 1-8 | Yes | Full UI + data model + module rename. Legacy data renders via fallback. New data renders mission board. |
| 2 | 9-12 | Yes | Backend endpoints. Missions become live. |
| 3 | 13-15 | Yes | Auto-triggering. Board is populated without user action. |
