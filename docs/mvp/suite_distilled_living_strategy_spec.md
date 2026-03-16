# Suite Distilled Living Strategy Spec

## Intent

Upgrade `Suite Distilled` from a generic summary artifact into a high-trust strategic mandate that feels closer to a living advisor briefing than a recap screen.

The module should act as the operating bridge between machine synthesis and human consultation:

- summarize the user's current market position
- define the highest-value strategic workstreams
- convert scattered suite outputs into one executable narrative
- prepare the next human advisor session with specific questions, priorities, and markup space

This is not a visual reskin. It is a contract change for the artifact itself.

## Current-State Diagnosis

Current implementation in `components/SuiteDistilledView.tsx` is structurally too thin for the role the module should play.

Problems:

- the artifact schema only supports `what_i_learned`, `what_needs_to_happen`, and `next_to_do`
- the UI is a two-list summary, not a strategy surface
- there is no distinction between observation, inference, and evidence-backed external signal
- the module does not bridge clearly into advisor sessions, which leaves it as a static recap rather than a living document
- it has no explicit market-position posture, no alpha thesis, and no executive workstream logic

## Product Reframe

Rename the internal posture of the module from `Suite Distilled` to `Living Strategy`.
The module ID can remain `suite_distilled` for compatibility, but the artifact should behave as:

- `Strategic Mandate`
- `AI Deployment Mandate`
- `Living Strategy Brief`

Recommended client-facing title:

- `Your Living Strategy`

Recommended subtitle:

- `The current state, future alpha, and advisor mandate shaping your next move.`

## Core Narrative Model

The module should read as `Current State vs Future Alpha`, not `summary vs checklist`.

### Section 1: Market Position & AI Arbitrage

Replace `What I learned`.

Purpose:

- define the strategic thesis
- identify the user's differentiating edge
- identify the core friction suppressing value
- explain where AI creates real arbitrage rather than generic productivity theater

Required content:

- `thesis`
- `current_position`
- `future_alpha`
- `edge_signals`
- `friction_points`
- `ai_arbitrage`
- `market_context`
- `evidence_ledger`

### Section 2: Strategic Workstreams

Replace `What needs to happen`.

Purpose:

- convert the thesis into 3 focused workstreams
- make each workstream feel executive, not motivational
- tie activity to outcome and proof

Recommended workstream families:

- `Narrative Calibration`
- `Market Penetration`
- `Asset Hardening`

Each workstream needs:

- `name`
- `mandate`
- `why_now`
- `success_metric`
- `first_moves`
- `roi_if_executed`
- `risk_if_ignored`

### Section 3: Advisor Consultation Brief

New section.

Purpose:

- make the artifact handoff-ready for the human concierge
- reduce time wasted on recap in the live session
- create a place where strategy evolves after human intervention

Required content:

- `session_goal`
- `discussion_points`
- `strategic_questions`
- `pricing_question`
- `decision_points`
- `advisor_markup_prompt`
- `post_session_update_slot`

### Section 4: 72-Hour and 2-Week Playbook

Keep the useful immediacy of `next_to_do`, but upgrade it into time-bounded execution.

Required content:

- `next_72_hours`
- `next_2_weeks`
- `proof_targets`
- `owner`
- `status`

## Recommended Information Architecture

The module should use a three-zone editorial briefing layout.

### Zone A: Context

WSJ-style top section.

Contents:

- strategy status line
- thesis
- current state vs future alpha comparison
- concise market-context note
- evidence / confidence strip

### Zone B: Playbook

McKinsey-style execution middle section.

Contents:

- 3 workstream cards
- each card with mandate, metric, first moves, and risk/ROI note
- a compact sprint rail for `72 hours` and `2 weeks`

### Zone C: Advisor Bridge

Consultation handoff section.

Contents:

- advisor brief summary
- discussion agenda
- strategic questions
- markup-ready prompt block

## UI Direction

The surface should feel sober, sharp, and boardroom-ready.

Design posture:

- lighter editorial palette, not dark-terminal dominance
- typographic hierarchy aligned to the main suite, not a separate novelty system
- one dominant thesis block per viewport
- evidence and confidence rendered as compact secondary strips
- workstreams presented as disciplined strategy cards, not consumer checklists

Avoid:

- generic bullet-dump layouts
- oversized explainer copy
- wide dead-space rails
- decorative charts without source-backed meaning

## Protocol Check

This proposal aligns to the existing interface protocols as follows.

| Protocol | Requirement | Living Strategy Response |
| :--- | :--- | :--- |
| `global_interaction_density_and_guidance_spec` | first useful action and first proof of state must appear inside first viewport | top section carries thesis, status, and primary mandate before deeper strategy blocks |
| `global_interaction_density_and_guidance_spec` | only one dominant narrative block per surface | thesis / current-state block is the dominant narrative; workstreams become secondary structured cards |
| `micro_interaction_cinematography_spec` | motion explains hierarchy, not decoration | section reveals should be restrained fades and drifts only when changing tabs or advisor-state context |
| `micro_interaction_cinematography_spec` | persistent UI retreats when it competes with narrative focus | supporting evidence, provenance, and export actions stay compact or hover-revealed |
| `dossier wsj / microinteraction appendix` | interface should feel attentive, not animated | workstream highlight, confidence strip changes, and advisor-bridge state changes should use quiet confirmatory motion only |

## Data Integrity Rules

No decorative or invented market intelligence should appear in this module.

Every meaningful claim must be tagged as one of:

- `Observed` — directly derived from intake or another generated artifact
- `Inferred` — synthesized from multiple internal signals
- `External` — grounded in public market or labor data already present in Professional DNA

If no external evidence exists, the module must not imply it.
In that case, it should explicitly render as:

- `Internal strategy draft`
- `Awaiting market validation`

## Proposed Artifact Schema

```ts
export interface SuiteDistilledContentV2 {
  strategy_status: 'internal_strategy_draft' | 'market_validated' | 'advisor_revised';
  title?: string;
  subtitle?: string;
  market_position: {
    thesis: string;
    current_position: string;
    future_alpha: string;
    edge_signals: string[];
    friction_points: string[];
    ai_arbitrage: string[];
    market_context?: string;
  };
  strategic_workstreams: {
    id: string;
    name: string;
    mandate: string;
    why_now: string;
    success_metric: string;
    first_moves: string[];
    roi_if_executed: string;
    risk_if_ignored: string;
  }[];
  advisor_bridge: {
    session_goal: string;
    discussion_points: string[];
    strategic_questions: string[];
    pricing_question?: string;
    decision_points: string[];
    advisor_markup_prompt: string;
    post_session_update_slot?: string;
  };
  playbook: {
    next_72_hours: { id: string; label: string; done: boolean }[];
    next_2_weeks: { id: string; label: string; done: boolean }[];
    proof_targets: string[];
  };
  evidence_ledger: {
    label: string;
    class: 'Observed' | 'Inferred' | 'External';
    note: string;
    source_ref?: string;
  }[];
  confidence_strip?: {
    strategic_coherence: number;
    market_grounding: number;
    advisor_readiness: number;
  };
}
```

## Generation Contract

`suite_distilled` should stop generating as a standalone shallow recap.
It should be composed from:

- `brief`
- `profile`
- `ai_profile`
- `gaps`
- `plan`
- `readiness`
- Professional DNA fields when available:
  - `market_signal`
  - `market_demand_analysis`
  - `compensation_position`
  - `source_registry`
  - `evidence_nodes`

Generation rules:

1. Start with internal artifacts first.
2. Pull external market context only from Professional DNA or another source-backed lane.
3. Never fabricate role, compensation, or market assertions.
4. Collapse noisy advice into 3 workstreams maximum.
5. Keep the advisor brief concise enough to use live in-session.

## Fallback Rules

The module must degrade gracefully.

If only the legacy shape exists:

- render the current view without crashing
- map old fields into transitional headings
- show a muted status chip: `Legacy strategic summary`

If the new shape exists but external evidence is absent:

- keep the mandate layout
- switch status to `Internal strategy draft`
- suppress external-market phrasing

## Admin / Operator Considerations

This module should remain client-safe by default.

Future admin controls should allow:

- preferred section title variants
- workstream naming presets
- advisor-bridge verbosity
- confidence-strip visibility
- whether external evidence references are shown inline or only in the appendix

## Acceptance Criteria

1. The first viewport shows the thesis, current state, future alpha, and strategy status without requiring scroll on a typical laptop.
2. The module reads as a strategy brief, not a recap list.
3. At least one advisor-ready section can be copied directly into a live consultation agenda.
4. No market or compensation claim appears without an evidence class.
5. Legacy `suite_distilled` artifacts still render safely.
6. Mobile stacks into a clean single-column article flow without wide dead space.

## Implementation Plan

### Pass 1

- expand `SuiteDistilledContent` schema
- update generator prompt / response contract
- add backward-compatible view model mapper
- rebuild `SuiteDistilledView.tsx` into the new editorial structure
- preserve legacy rendering fallback

### Pass 2

- add advisor revision state and post-session updates
- add exportable consultation brief
- optionally add source-linked appendix cards when external evidence is present

## Recommended Backlog Mapping

- `E04-S04 Suite Distilled Living Strategy Mandate`
- Priority: `P1`
- Status: `Queued`

This is the right next-level refinement for the core artifact layer because it strengthens the bridge between machine synthesis, market context, and human advisory execution without introducing a separate module.
