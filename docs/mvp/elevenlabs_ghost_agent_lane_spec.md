# Implementation Plan: ElevenLabs Ghost Agent Lane

## Objective

Upgrade the current ElevenLabs intake lane from a staged widget embed into a true `Ghost` agent integration that can:

- run as a first-class voice lane in the Smart Start intake
- execute client-side tools against the React shell
- surface a visible action feed so users can see what the agent is doing
- support private or public agent sessions without exposing secrets in the client
- remain operator-configurable from Admin

This plan is based on:

- the local Orbital `elevenlabs-ghost-agent` skill
- the local Orbital `/plan-feature` workflow
- official ElevenLabs docs for the React SDK, client tools, and session authentication

## Current State

Current implementation is intentionally shallow.

What exists:

- `components/ElevenLabsConvaiPanel.tsx` mounts the hosted widget with an `agent-id`
- `/v1/public/config` exposes `voice.elevenlabs_agent_id` when env is present
- admin can flip the public intake lane between Gemini and ElevenLabs
- runtime/admin surfaces already report ElevenLabs readiness from API env

What is missing:

- no `@elevenlabs/react` integration
- no client tools
- no signed session / private-agent token path
- no action feed / HUD
- no structured logging of tool calls or conversation sessions
- no admin control surface for Ghost prompt, tool policy, or lane scope

## Implementation Decision

Do not treat the current widget as the final architecture.

The widget embed is acceptable as a fallback or emergency lane, but it is not sufficient for the Ghost pattern because the Ghost pattern depends on:

- `useConversation`
- client tools registered in code
- UI-aware action logging
- dynamic prompt / first-message / voice overrides
- conversation token or signed URL support for private agents

So the implementation should pivot to an SDK-backed lane, not try to stretch the widget into something it cannot reliably do.

## Target Architecture

### Frontend

Replace the intake-only widget lane with an SDK-backed `ElevenLabsGhostPanel`.

Responsibilities:

- initialize `useConversation`
- request microphone access intentionally
- start session with `agentId` for public mode or `conversationToken` for private mode
- register intake-safe client tools
- append all tool activity to a visible action feed
- drive UI changes through explicit React state handlers rather than DOM mutation

### API

Add a dedicated ElevenLabs session-init route.

Responsibilities:

- validate auth or public-lane access policy
- decide between public `agentId` mode and private-token mode
- when private mode is enabled, mint a `conversationToken` or signed URL from ElevenLabs server-side
- return only the values the client needs for `startSession`
- optionally persist session metadata for audit and support

### Admin

Extend voice controls so operators can configure the ElevenLabs Ghost lane instead of only toggling the public widget.

Required controls:

- `elevenlabs_mode`: `public_agent` or `private_agent`
- `elevenlabs_agent_id`
- `elevenlabs_agent_branch_id`
- `elevenlabs_connection_type`: `webrtc` or `websocket`
- `elevenlabs_lane_scope`: `intake_only` or future multi-surface scopes
- `elevenlabs_first_message_override`
- `elevenlabs_prompt_appendix`
- `elevenlabs_voice_id`
- `elevenlabs_enabled_tools`
- `elevenlabs_action_feed_visible`
- `elevenlabs_widget_fallback_enabled`

### Logging

Persist enough session telemetry to make the lane supportable.

Recommended minimum record:

- `conversation_id`
- `client_uid`
- `lane`
- `agent_id`
- `connection_type`
- `started_at`
- `ended_at`
- `tool_calls[]`
- `status`
- `error_code`

## Intake-Safe Client Tools

Phase-one tools should be narrow and deterministic.

Recommended initial set:

- `focus_field(field_id)`
- `set_field_value(field_id, value)`
- `jump_to_step(step_id)`
- `toggle_memory_panel(state)`
- `highlight_prompt(prompt_id)`
- `append_action_feed(message)`

Avoid in phase one:

- arbitrary DOM tools
- destructive submit tools
- cross-module navigation
- any tool that can leave the intake shell without explicit user intent

## UX Contract

The Ghost lane should feel active, but not theatrical.

Required behaviors:

- the agent speaks briefly and confirms action, then acts
- the UI visibly changes when a tool fires
- the action feed shows what happened in plain language
- if the lane is private-token based and session init fails, fall back cleanly
- if the user switches back to Gemini, the lane exits without stale HUD state

## Security / Runtime Rules

- never expose `ELEVENLABS_API_KEY` to the client
- prefer server-minted token/signed-session flow for any non-public agent
- keep the public `agentId` path only for intentionally public/demo agents
- tool policy must remain allowlisted in the client
- the client should reject unknown tool calls even if misconfigured upstream

## Source Notes

Official docs supporting this direction:

- React SDK and `useConversation`:
  - https://elevenlabs.io/docs/conversational-ai/libraries/react
- Client tools:
  - https://elevenlabs.io/docs/conversational-ai/customization/tools/client-tools
- JavaScript SDK auth/session model:
  - https://elevenlabs.io/docs/libraries/conversational-ai-sdk-js
- WebSocket auth note:
  - https://elevenlabs.io/docs/eleven-agents/libraries/web-sockets

Inference:

- The current widget path can remain as a fallback, but the official SDK path is the correct path for Ghost-style client tools and action logging.

## Task Breakdown

- [ ] **Task 1: Freeze the current lane boundary and add the new config contract**
  - Files: `/Users/lenoxparis/conductor/workspaces/Signal-Atlas/atlanta/types.ts`, `/Users/lenoxparis/conductor/workspaces/Signal-Atlas/atlanta/services/adminApi.ts`, `/Users/lenoxparis/conductor/workspaces/Signal-Atlas/atlanta/api/index.js`
  - Action: Add typed config fields for ElevenLabs Ghost mode, connection type, lane scope, prompt appendix, first message override, enabled tools, and widget fallback.
  - Verification: `npm run build` and `node --check api/index.js`

- [ ] **Task 2: Add the session-init API route**
  - Files: `/Users/lenoxparis/conductor/workspaces/Signal-Atlas/atlanta/api/index.js`
  - Action: Create a new route such as `POST /v1/voice/elevenlabs/session` that returns `agentId` for public mode or a server-minted token/signed session for private mode.
  - Verification: `node --check api/index.js` and a local `curl` against the route with expected JSON shape

- [ ] **Task 3: Replace the widget-only panel with an SDK-backed Ghost panel**
  - Files: `/Users/lenoxparis/conductor/workspaces/Signal-Atlas/atlanta/components/ElevenLabsConvaiPanel.tsx` or a new `/Users/lenoxparis/conductor/workspaces/Signal-Atlas/atlanta/components/ElevenLabsGhostPanel.tsx`, `/Users/lenoxparis/conductor/workspaces/Signal-Atlas/atlanta/components/IntakeFlow.tsx`
  - Action: Install and wire `@elevenlabs/react`, initialize `useConversation`, start/stop session, and preserve a fallback path when Ghost mode is unavailable.
  - Verification: `npm run build`

- [ ] **Task 4: Add intake-safe client tools and a visible action feed**
  - Files: `/Users/lenoxparis/conductor/workspaces/Signal-Atlas/atlanta/components/IntakeFlow.tsx`, `/Users/lenoxparis/conductor/workspaces/Signal-Atlas/atlanta/components/ElevenLabsGhostPanel.tsx`
  - Action: Map a small allowlisted set of client tools to existing intake state transitions and render an action feed/HUD panel.
  - Verification: manual browser test with a configured agent and observed UI state changes per tool call

- [ ] **Task 5: Add admin controls for Ghost-agent operation**
  - Files: `/Users/lenoxparis/conductor/workspaces/Signal-Atlas/atlanta/components/AdminConsole.tsx`, `/Users/lenoxparis/conductor/workspaces/Signal-Atlas/atlanta/services/adminApi.ts`, `/Users/lenoxparis/conductor/workspaces/Signal-Atlas/atlanta/types.ts`
  - Action: Expose the Ghost-lane controls in Admin `Voice` / `Experience` without regressing Gemini or current public-lane toggles.
  - Verification: `npm run build` and manual save/load roundtrip in Admin

- [ ] **Task 6: Add telemetry and support-grade failure handling**
  - Files: `/Users/lenoxparis/conductor/workspaces/Signal-Atlas/atlanta/api/index.js`, `/Users/lenoxparis/conductor/workspaces/Signal-Atlas/atlanta/components/ElevenLabsGhostPanel.tsx`
  - Action: Log session start/end, tool calls, and fallback reasons; render operator-safe errors in the UI.
  - Verification: local route validation plus manual UI failure-mode checks

- [ ] **Task 7: Keep the legacy widget as a fallback only**
  - Files: `/Users/lenoxparis/conductor/workspaces/Signal-Atlas/atlanta/components/ElevenLabsConvaiPanel.tsx`, `/Users/lenoxparis/conductor/workspaces/Signal-Atlas/atlanta/components/IntakeFlow.tsx`
  - Action: Preserve the current widget path behind `elevenlabs_widget_fallback_enabled` so operators retain a backup lane during rollout.
  - Verification: manual toggle test between Ghost mode and widget fallback

- [ ] **Task 8: Update docs and backlog state**
  - Files: `/Users/lenoxparis/conductor/workspaces/Signal-Atlas/atlanta/docs/backlog-ledger.md`, `/Users/lenoxparis/conductor/workspaces/Signal-Atlas/atlanta/docs/progress-log.md`, `/Users/lenoxparis/conductor/workspaces/Signal-Atlas/atlanta/docs/career-concierge-os.md`, `/Users/lenoxparis/conductor/workspaces/Signal-Atlas/atlanta/docs/operations-runbook.md`
  - Action: Record the lane as Ghost-agent implementation work rather than a vague staged ElevenLabs lane.
  - Verification: docs mention the new route, config, and fallback posture accurately

## Recommended Delivery Phasing

### Pass 1

- config contract
- session-init API route
- SDK-backed panel
- public-agent mode
- action feed
- intake-safe client tools

### Pass 2

- private-token mode
- richer admin controls
- telemetry persistence
- widget fallback toggle
- rollout hardening

## Backlog Mapping

- `E15-S05 ElevenLabs Secondary Voice Lane Planning`
  - keep `In Progress` for the staged/widget work already shipped
- `E15-S07 ElevenLabs Ghost Agent Lane`
  - add as `Queued`
  - represents the real client-tool / SDK / tokenized lane described here
