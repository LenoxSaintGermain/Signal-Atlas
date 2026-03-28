# Ghost Voice Agent — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Configure the ElevenLabs Ghost agent as the Chief of Staff voice layer for Signal Atlas, then spec the Gemini 3.1 Flash Live integration as the primary engine.

**Architecture:** Dual-engine voice agent. ElevenLabs (premium voice, modular LLM) and Gemini 3.1 Flash Live (native audio-to-audio, lower latency, lower cost) share the same Ghost persona and tool definitions. The frontend detects which engine is active via `publicConfig.voice.active_panel` and routes accordingly. Server tools hit Express.js endpoints authenticated via webhook secret.

**Tech Stack:** ElevenLabs Conversational AI SDK (`@elevenlabs/react`), Gemini 3.1 Flash Live API, Express.js server tools, Firestore, Google Drive API (via existing GWS module).

---

## Research Summary

### Gemini 3.1 Flash Live (announced 2026-03-26)
- **Architecture:** Native audio-to-audio — no ASR→LLM→TTS pipeline
- **Tool calling:** 90.8% on ComplexFuncBench Audio (multi-step function calling from voice)
- **Context:** 128K tokens per session
- **Cost:** ~$0.023/min ($0.005 input + $0.018 output audio)
- **Multimodal:** Voice + video + images + text simultaneously
- **Model ID:** `gemini-3.1-flash-live-preview`
- **Constraint:** Locked to Gemini models, GCP-coupled

### ElevenLabs Conversational AI (current)
- **Architecture:** Modular pipeline: Scribe ASR → Any LLM → Flash v2.5 TTS (75ms)
- **Tool calling:** Client + Server + MCP tools. Docs warn against Gemini Flash for tool reliability.
- **LLM flexibility:** Any OpenAI-compatible endpoint (GPT-4o, Claude, Qwen, custom)
- **Voice quality:** Industry-leading, 10K+ voices, voice cloning, emotional depth
- **Cost:** ~$0.08-0.15/min + LLM costs
- **Advantage:** Brand voice, premium quality, LLM swap flexibility

### Decision
- **Primary:** Gemini 3.1 Flash Live — native stack fit, 4x cheaper, superior tool calling
- **Secondary:** ElevenLabs — premium voice, fallback, A/B testing option
- **Both get:** Same Ghost persona, same tool definitions, same server endpoints

---

## Ghost Persona: Chief of Staff

**Identity:** The Ghost is the Chief of Staff of Signal Atlas — the same intelligence that orchestrates suite generation, now with a voice. It speaks as the system itself. Named "Donna" in the existing UI.

**Tone — Contextual Shift (Option C):**
- **Tool actions:** Ghost protocol cadence — "Routing.", "Active.", "Dispatched.", "Gap Stack open."
- **Career guidance:** Executive advisor — warm, strategic, specific. "Your positioning is strong on AI strategy, but the gap in stakeholder communication is holding back your readiness score."
- **Destructive actions:** `[whispers] Confirm: dismiss this mission?`

**Context Loading — Hybrid (Option C):**
- **On connect:** Eager-load lightweight briefing (name, tier, top 3 gaps, stance, active missions)
- **On demand:** Lazy-fetch full artifacts when conversation requires them

---

## Tool Definitions

### Client Tools (execute in browser via React)

| Tool | Parameters | Description |
|------|-----------|-------------|
| `navigate_module` | `target: SuiteModuleId` | Open any of the 11 suite modules |
| `close_module` | (none) | Dismiss the current module modal |
| `toggle_admin` | (none) | Open/close the admin console |
| `dispatch_agent` | `codename: string` | Kick off a SWAT agent mission |
| `update_stance` | `stance: 'delegator' \| 'copilot'` | Switch operating stance |
| `address_gap` | `gap_id: string` | Mark a gap as addressed in the Gap Stack |

### Server Tools (ElevenLabs calls Express.js webhook)

| Tool | Endpoint | Description |
|------|----------|-------------|
| `fetch_briefing` | `POST /v1/ghost/briefing` | Lightweight candidate context (name, tier, top gaps, stance, missions) |
| `fetch_artifact` | `POST /v1/ghost/artifact` | Full artifact by type (brief, profile, gaps, readiness, plan, etc.) |
| `fetch_drive_documents` | `POST /v1/ghost/drive` | List/read docs from candidate's Google Drive folder |

---

## Backlog

### Phase 1: ElevenLabs Ghost Configuration (this session)
- [ ] Task 1: Write the Ghost system prompt
- [ ] Task 2: Create server tool endpoints (`/v1/ghost/*`)
- [ ] Task 3: Upgrade `ElevenLabsConvaiPanel.tsx` from widget embed to `@elevenlabs/react` SDK with client tools
- [ ] Task 4: Create `useGhostVoice` hook with client tool bindings
- [ ] Task 5: Create `GhostActionFeed` HUD component
- [ ] Task 6: Write ElevenLabs Dashboard manual setup guide (user performs)
- [ ] Task 7: Create verification script (`verify_elevenlabs_client_tools.ts`)
- [ ] Task 8: Build, test, commit, deploy

### Phase 2: Gemini 3.1 Flash Live Integration (future session)
- [ ] Task 9: Add `gemini-3.1-flash-live-preview` model config to voiceRuntime
- [ ] Task 10: Create `useGeminiLive` hook with identical client tool bindings
- [ ] Task 11: Build server-side function declarations matching client tool schema
- [ ] Task 12: Implement engine switcher in App.tsx (reads `active_panel` config)
- [ ] Task 13: Update `/v1/live/token` endpoint for 3.1 Flash Live
- [ ] Task 14: A/B comparison tooling (latency, quality, tool success metrics)

### Phase 3: Production Hardening (future session)
- [ ] Task 15: Toast/notification system for Ghost actions
- [ ] Task 16: Conversation history persistence (Firestore)
- [ ] Task 17: Rate limiting and cost controls
- [ ] Task 18: Voice cloning for branded concierge voice (ElevenLabs)
- [ ] Task 19: Admin dashboard voice analytics panel

---

## Task 1: Write the Ghost System Prompt

**Files:**
- Create: `api/config/ghostPrompt.js`

**The prompt** (to be used in both ElevenLabs dashboard and Gemini system instruction):

See implementation below.

---

## Task 2: Create Server Tool Endpoints

**Files:**
- Modify: `api/index.js` — add 3 new endpoints under `/v1/ghost/*`

**Endpoints:**
- `POST /v1/ghost/briefing` — returns lightweight candidate context
- `POST /v1/ghost/artifact` — returns full artifact by type
- `POST /v1/ghost/drive` — lists/reads Google Drive documents

**Auth:** Webhook secret header (`X-Ghost-Secret`) for ElevenLabs server tools. Firebase auth token for direct frontend calls.

---

## Task 3: Upgrade ElevenLabsConvaiPanel to SDK

**Files:**
- Modify: `components/ElevenLabsConvaiPanel.tsx`
- Modify: `package.json` — add `@elevenlabs/react`

**Change:** Replace the custom element embed with the `useConversation` hook from `@elevenlabs/react`, passing `clientTools` object.

---

## Task 4: Create useGhostVoice Hook

**Files:**
- Create: `hooks/useGhostVoice.ts`

**Binds client tools** to App.tsx state setters passed via props/context.

---

## Task 5: Create GhostActionFeed HUD

**Files:**
- Create: `components/GhostActionFeed.tsx`

**Renders** a monospace action log overlay showing Ghost tool executions in real-time.

---

## Task 6: ElevenLabs Dashboard Manual Setup Guide

**Output:** Printed instructions for the user to configure the agent in the ElevenLabs dashboard.

---

## Task 7: Verification Script

**Files:**
- Create: `scripts/verify_elevenlabs_tools.ts`

**Hits** `GET https://api.elevenlabs.io/v1/convai/agents/{agent_id}` and verifies all client + server tools are registered.
