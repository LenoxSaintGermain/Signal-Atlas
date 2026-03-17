# Module 08: Mission Control — Design Document

## Overview

Replace the static "Your AI Profile" module (48 lines, 3 fields, zero interaction) with **Mission Control** — a living operations board staffed by 5 purpose-built SWAT agents. The board is pre-populated with active missions when the user arrives. Agents enrich existing suite artifacts. A confidence threshold governs what auto-applies vs. what needs approval, calibrated to the user's operating stance.

**System prompt to the user:**

> *This is your personal SWAT team. Five specialists assigned to your career operation — already briefed on your signal, your gaps, and your market. They don't wait for instructions. They're working. Your job is to steer.*

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Operator persona | Stance toggle (delegator / co-pilot) | Intake signals infer default; user can switch. Differentiates from every AI career tool assuming one mode. |
| Agent composition | 5 purpose-built SWAT specialists | "Gartner fixer A-Team" energy. Client sees dedicated squad, not backend services. |
| Operating model | Mission board (agents already working) | User steers, not prompts. Board is alive on arrival. |
| Artifact strategy | Missions enrich existing artifacts | Suite becomes a living system. Every module benefits. Retention moat. |
| Trigger model | Event-driven + user-initiated | Auto-trigger on meaningful events; user can also manually dispatch. Board is never empty. |
| Approval model | Confidence threshold | High-confidence auto-applies, medium needs review, low suggests only. Threshold calibrated to stance. |
| Module name | "Mission Control" | Frames user as authority, implies active operations. |

## The SWAT Squad

| Codename | Specialty | Reads | Enriches | Trigger Events |
|----------|-----------|-------|----------|----------------|
| Signal Strategist | Positioning, narrative, differentiation | brief, profile, dna_research | brief, profile | Suite generated, DNA refreshed, intake updated |
| Gap Closer | Targeted micro-plans, skill acquisition | gaps, plan, readiness | gaps, plan | Gaps unactioned 7d+, readiness score changes |
| Intel Analyst | Company/market research, opportunity surfacing | dna_research, profile | brief, gaps | DNA refresh, 7d+ since last intel, user request |
| Comms Officer | High-stakes drafts in user's voice | brief, profile, brand config | assets, plan | User-initiated, plan has pending deliverables |
| Readiness Coach | Scenario drills, pressure testing, scoring | readiness, gaps, profile | readiness, gaps | Readiness score <70%, interview prep needed |

## UI Layout

### Zone 1 — Team Strip (top, ~60px)

Horizontal row of 5 agent cards with live status:
- Codename in `admin-mono`
- Status pill: `WORKING` / `IDLE` / `AWAITING REVIEW`
- One-line current mission summary (truncated)
- Active agent has teal left-border highlight
- Click to filter board to that agent's missions

### Zone 2 — Mission Board (middle, flex-1)

Vertical stack of mission cards sorted: needs-review → in-progress → completed.

**Collapsed row (~48px):**
```
[confidence %]  [agent icon]  Mission title · target artifact    [status pill]   [▸]
   92%         Signal Strategist  Reframe positioning for VP ops · brief    READY FOR REVIEW
```

**Expanded card reveals:**
- Before/after artifact preview (styled cards, not raw diff)
- Agent rationale (1-2 sentences)
- Action buttons: **Accept** / **Revise** (opens note field) / **Dismiss**
- Auto-applied missions show "Auto-applied · tap to review" with **Undo**

### Zone 3 — Dispatch Bar (bottom, sticky, ~44px)

```
[stance toggle: Delegator / Co-pilot]   3 missions active · 1 awaiting review   [+ New Mission]
```

Stance toggle adjusts confidence thresholds live:
- **Delegator**: auto-apply >70%, review 40-70%, suggest-only <40%
- **Co-pilot**: auto-apply >90%, review 60-90%, suggest-only <60%

## Data Model

### Expanded AIProfileContent (types.ts)

```typescript
export interface AIProfileContent {
  // Legacy fields (preserved for backwards compat)
  positioning: string;
  how_to_use_ai: string[];
  guardrails: string[];

  // SWAT operating model
  stance: 'delegator' | 'copilot';
  confidence_thresholds: {
    auto_apply: number;
    review: number;
  };
  squad: SwatAgent[];
  missions: Mission[];
}

export interface SwatAgent {
  codename: string;
  title: string;
  status: 'working' | 'idle' | 'awaiting_review';
  current_mission_id: string | null;
  last_active_at: string;
}

export interface Mission {
  id: string;
  agent_codename: string;
  title: string;
  target_artifact: string;
  status: 'in_progress' | 'ready_for_review' | 'auto_applied' | 'accepted' | 'dismissed';
  confidence: number;
  rationale: string;
  proposed_changes: {
    field: string;
    before: string;
    after: string;
  }[];
  created_at: string;
  resolved_at: string | null;
  user_note: string | null;
}
```

**Storage:** `clients/{uid}/artifacts/ai_profile` — existing path, no migration.

### API Endpoints (additions to api/index.js)

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/missions/dispatch` | User manually dispatches a mission |
| POST | `/api/missions/:id/accept` | Accept proposed changes |
| POST | `/api/missions/:id/revise` | Send back with a note |
| POST | `/api/missions/:id/dismiss` | Dismiss a mission |
| POST | `/api/missions/:id/undo` | Undo auto-applied change |
| POST | `/api/missions/sweep` | Event-driven mission generation |
| PATCH | `/api/ai-profile/stance` | Toggle delegator/copilot |

### Mission Generation Flow

1. `/api/missions/sweep` receives `{ uid, trigger_event }`
2. Reads user's full artifact set (brief, profile, gaps, plan, readiness, dna_research)
3. For each SWAT agent, evaluates trigger conditions against event type
4. If triggered: calls Gemini 2.5 Pro with agent-specific system prompt + full user context
5. Gemini returns proposed changes as structured JSON
6. System scores confidence, creates Mission record
7. If confidence > `auto_apply` threshold → applies changes to target artifact, marks `auto_applied`
8. Otherwise → marks `ready_for_review`, agent status becomes `awaiting_review`

### Confidence Scoring

Confidence derived from:
- **Data completeness**: how much of the user's context is populated (0-30 pts)
- **Change magnitude**: small refinements score higher than rewrites (0-30 pts)
- **Agent track record**: acceptance rate of past missions from this agent (0-20 pts)
- **Artifact freshness**: recently updated artifacts get lower confidence for changes (0-20 pts)

## Dependency Update Map

| File | Change |
|------|--------|
| `suite/modules.ts` | title → "Mission Control", subtitle → "Your SWAT team is already working. Steer from here.", relatedIds expanded |
| `types.ts` | Expand `AIProfileContent`, add `SwatAgent`, `Mission` interfaces |
| `components/AIProfileView.tsx` → `MissionControlView.tsx` | Complete rebuild: 48 → ~250 lines. 3-zone layout. Backwards compat for legacy data. |
| `App.tsx` | Import swap, wire mission action callbacks, add fetch helpers |
| `api/index.js` | 6 new endpoints, 5 agent system prompts, confidence scoring, `initializeSwatSquad()`, sweep hooks |
| `components/AdminConsole.tsx` | Label: `'08 AI Profile'` → `'08 Mission Control'` |
| `components/admin/BrandStudioSection.tsx` | Label: `'08 AI Profile'` → `'08 Mission Control'` |

## Backwards Compatibility

- Artifact storage path stays `ai_profile` — no migration needed
- Module id stays `ai_profile` — no route changes
- Legacy `AIProfileContent` (positioning + how_to_use_ai + guardrails only) still renders via fallback: if `missions` field is missing, show the original static view
- `initializeSwatSquad()` upgrades legacy artifacts on first load by seeding squad + initial missions

## Event Triggers

| Event | Agents Triggered | Source |
|-------|-----------------|--------|
| Suite generated | All 5 (initial sweep) | Suite generation completion |
| DNA research refreshed | Signal Strategist, Intel Analyst | DNA research cron / manual refresh |
| Intake updated | Signal Strategist, Gap Closer | Intake form re-submission |
| Gaps unactioned 7d+ | Gap Closer | Sweep cron check |
| Readiness score < 70% | Readiness Coach | Readiness artifact update |
| Plan has pending deliverables | Comms Officer | Plan artifact change |
| 7d+ since last intel | Intel Analyst | Sweep cron check |
| User manual dispatch | Any single agent | Mission Control UI |
