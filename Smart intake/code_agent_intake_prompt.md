# IMPLEMENTATION BRIEF — Smart Start Intake Enhancement
## Professional DNA · Module 01/18 · Third Signal Labs
### Prompt to Code Agent

---

## CONTEXT

You are implementing a series of enhancements to the Smart Start Intake module (Module 01/18) of the Professional DNA product, built on the existing Third Signal Labs / SkillSync codebase.

The primary files you will be working in are:
- `components/IntakeView.tsx` (or equivalent intake component file)
- `components/BriefView.tsx` (for thread visibility — already partially built)
- `components/ProfileView.tsx`
- `api/index.js` (orchestration, if voice extraction layer touches the pipeline)
- `api/prompts/conciergeRom.js` (voice agent persona prompt)
- `types.ts` (schema — add new intake fields if missing)
- Any relevant CSS/Tailwind configuration files

Before writing a single line of code, do the following:
1. **Read the full file tree** of the project and map which files own the intake UI, the intake form state, the voice agent session, and the post-intake pipeline trigger.
2. **Identify the current intake data schema** in `types.ts` and note which fields are already present vs. which need to be added.
3. **Check the existing voice agent integration** — identify the current ElevenLabs or Gemini Live connection point, the session state management, and where transcript data currently goes (if anywhere).
4. **Do not refactor the entire codebase.** Surgical enhancements only. Preserve existing behavior for every feature not explicitly listed below.

---

## WAVE 1 — LUXURY BASELINE (Do This First)
### Pure styling pass. No new components. No logic changes.

### 1.1 Typography System

Add or update the global font imports. The stack is:
- **Display / H1:** `Playfair Display` (Google Fonts) — weights 700, 900. Use for all page-level headings.
- **UI Labels / Tags / Buttons:** `IBM Plex Mono` — weights 400, 500, 700. Use for ALL caps labels, module badges, CTA buttons, status indicators.
- **Body / Descriptions:** `EB Garamond` — weights 400, 500, italic variants. Use for descriptive body text, card descriptions, intake instructions.

If the project uses Tailwind, extend `tailwind.config.js` with these font families:
```js
fontFamily: {
  display: ['"Playfair Display"', 'Georgia', 'serif'],
  mono: ['"IBM Plex Mono"', 'monospace'],
  body: ['"EB Garamond"', 'Georgia', 'serif'],
}
```

Apply immediately:
- All `<h1>` in the intake header → `font-display text-5xl font-black tracking-tight`
- All section label tags (e.g., "SMART START INTAKE", "OPERATOR SPEED RUN") → `font-mono text-[9px] tracking-[0.18em] uppercase`
- All card body text and descriptions → `font-body text-base leading-relaxed`
- All CTA buttons → `font-mono text-[10px] tracking-[0.16em] uppercase`

Remove any usage of `Inter`, `Roboto`, `Arial`, or `system-ui` in the intake component files.

---

### 1.2 Color Tokens

Define or update the CSS custom properties / Tailwind color tokens. Use these exact values:

```css
--color-bg: #EDEAE2;          /* Warm linen — page background */
--color-bg-alt: #E5E2DA;      /* Slightly darker linen */
--color-dark: #1B1E1C;        /* Near-black — header bar, dark cards */
--color-dark-mid: #252A27;    /* Secondary dark surface */
--color-teal: #4B9E8D;        /* Primary interactive teal */
--color-teal-dim: #2D7A6B;    /* Labels, section accents */
--color-teal-light: #6BBFAF;  /* Hover states, selected fills */
--color-teal-bg: #E0F0ED;     /* Selected chip fill */
--color-amber: #C9853A;       /* Warning / secondary accent */
--color-border: #D0CEC5;      /* Standard card border */
--color-border-dark: #303530; /* Border on dark surfaces */
--color-cream: #F5F2EA;       /* Card background */
--color-muted: #8A8A7A;       /* Secondary text */
--color-muted-light: #AEADA0; /* Placeholder text */
```

Apply immediately:
- Page/layout background → `--color-bg`
- Dark masthead bar → `--color-dark` background
- All card backgrounds → `--color-cream` or `#FFFFFF` with `1px solid --color-border`
- **Remove all `box-shadow` from intake cards.** Replace with border-only treatment.

---

### 1.3 Spacing Pass

Apply to all existing intake cards and sections:
- **Section vertical padding:** `py-12` (48px). Current is likely `py-6` — increase it.
- **Card interior padding:** `p-5` minimum (20px). Never less.
- **Label-to-content gap inside cards:** `mb-3` (12px).
- **Gap between sibling CTA buttons in a row:** `gap-3` (12px).
- **Gap between intent selector cards:** `gap-3`.

---

### 1.4 Component-Level Tweaks

**Tab Navigation (`FRAMING | EPISODES | THE BRIEF | YOUR PROFILE | OPERATOR-AWARE VIEW`):**
- Active tab indicator: **bottom border only** — `border-b-2 border-teal` on active tab.
- Remove any background fill or box-shadow on the active tab.
- All tab labels: `font-mono text-[9px] tracking-[0.12em] uppercase`.

**CTA Buttons:**
- Primary (e.g., "AUTOFILL + JUMP", "CONTINUE"): `bg-teal text-white font-mono text-[10px] tracking-[0.16em] uppercase px-4 py-3 rounded-none` — **no border-radius, ever**.
- Secondary (e.g., "AUTOFILL INTAKE", "BACK"): `bg-transparent border border-[--color-border] text-dark font-mono text-[10px] tracking-[0.12em] uppercase px-4 py-3 rounded-none`.
- Remove all `rounded-*` classes from intake buttons.

**Intent Selector Cards (`Stay sharp in my current role`, etc.):**
- Increase card padding to `p-6`.
- Intent label: `font-mono text-[8px] tracking-[0.14em] uppercase text-muted`.
- Intent description text: `font-body text-base italic text-dark`.
- Selected state: `border-t-2 border-teal bg-[--color-teal-bg]`. Remove any background that isn't this.
- Hover state: `hover:border-teal cursor-pointer transition-colors duration-150`.
- Add a right-pointing arrow `→` that appears on hover: use a `group-hover:opacity-100 opacity-0` transition.

**Chip/Tag Selectors (tone chips, outcome chips, etc.):**
- Default: `border border-[--color-border] bg-white font-mono text-[9px] tracking-[0.1em] uppercase px-3 py-2`.
- Selected: `border-t-2 border-teal bg-[--color-teal-bg] font-mono text-[9px]`.
- Hover: `hover:bg-[--color-teal-bg] transition-colors`.

**Operator Speed Run card:**
- If the current user session is NOT an operator session, hide this card entirely: `{isOperator && <OperatorSpeedRun />}`.
- If `isOperator` context does not exist yet, add a simple boolean check from the session/auth context. Default to `false` (hidden).

---

## WAVE 2 — ENTRY EXPERIENCE
### New components + repositioning. Build after Wave 1 is merged.

### 2.1 HeroVideoSection Component

Create `components/HeroVideoSection.tsx`.

**Props:**
```ts
interface HeroVideoSectionProps {
  videoUrl?: string;
  videoTitle?: string;
  autoplaysaMuted?: boolean;
  loop?: boolean;
  fallbackImageUrl?: string;
  visible?: boolean;
}
```

**Behavior:**
- If `visible === false`, render nothing.
- If `videoUrl` is present: render an HTML5 `<video>` element. `autoPlay`, `muted` (always), `loop` if prop is true, `playsInline`. Show a minimal custom controls overlay (not browser default controls — `controls={false}`).
- If `videoUrl` is null/undefined: render a fallback dark panel with `fallbackImageUrl` as background-image. If no fallback image either, render the text overlay only against a solid `--color-dark` background.

**Visual structure:**
```
┌─────────────────────────────────────────────────────────┐  ← border-t-2 border-teal
│                                                         │
│   [VIDEO OR FALLBACK IMAGE]                             │  ← 16:9 aspect ratio enforced
│                                                         │     max-w-[840px] mx-auto
│                                                         │
│  ┌────────────────────────────────────┐  [DURATION]    │
│  │ PROFESSIONAL DNA · INTAKE          │  [▶ / ‖]       │  ← bottom overlay gradient
│  │ "A concierge conversation,         │                │     bg-gradient from transparent
│  │  tailored to you."                 │                │     to dark (bottom 25%)
│  └────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘  ← bg-[--color-dark]
```

**Overlay text:**
- Top label: `font-mono text-[9px] tracking-[0.18em] uppercase text-teal` — "PROFESSIONAL DNA · INTAKE"
- Below: `font-body text-base italic text-[#D0EDE6]` — the `videoTitle` prop value.

**Controls (bottom-right):**
- Play/Pause toggle icon — minimal SVG, no library dependency.
- Unmute icon — show only when video is muted. Click to unmute (add `unmutedByUser` state).
- Duration badge (top-right): `font-mono text-[9px] text-white/70` — read from `video.duration` on load.

**Placement in intake layout:**
Insert `<HeroVideoSection />` immediately after the dark masthead bar and before the first body content section. Pass config from the operator config object.

---

### 2.2 Immersive Play Rail — Repositioning

Find the `ImmersivePlayRail` section in the current intake layout. Move it so it renders **above** the Operator Speed Run card and **above** the intent selector section.

Update the CTA copy:
- `"PLAY CONCIERGE PREVIEW"` → `"BEGIN VOICE INTAKE"`
- `"PLAY IMMERSIVE SESSION"` → `"BEGIN VOICE INTAKE"`
- `"ENABLE VOICE CHANNEL"` → `"VOICE CHANNEL ACTIVE"` (when connected) / `"ENABLE VOICE CHANNEL"` (when not)

Give the Immersive Play Rail a dark surface treatment:
- Card background: `bg-[--color-dark]`
- Card border: `border border-[--color-border-dark]`
- All text on this card: light variants — section label in teal, body in `text-[#AEADA0]`

Add a pulsing status indicator:
```tsx
// Standby state
<span className="inline-block w-2 h-2 rounded-full bg-teal animate-pulse mr-2" />
<span className="font-mono text-[9px] text-teal tracking-[0.14em]">STANDBY</span>

// Live state (when voice session is active)
<span className="inline-block w-2 h-2 rounded-full bg-teal mr-2" />
<span className="font-mono text-[9px] text-teal tracking-[0.14em]">LIVE</span>
```

Update the `Conversation Memory` card text to add:
> "Your answers are being structured in real time."

---

### 2.3 DNAProgressIndicator Component

Create `components/DNAProgressIndicator.tsx`.

This renders after the user completes the intake form (or voice session) and the pipeline is triggered.

**Three pipeline stages to display:**
```ts
const stages = [
  { id: 'intake', label: 'INTAKE SIGNALS', status: 'complete' },
  { id: 'market', label: 'MARKET DATA', status: 'loading' },   // loading = animated
  { id: 'research', label: 'RESEARCH PASS', status: 'pending' },
]
```

**Visual:**
- Horizontal sequence of three status blocks.
- Each block: `font-mono text-[9px] tracking-[0.14em] uppercase` label + status icon.
- Complete: `✓` in teal.
- Loading: animated spinner or pulsing dot in amber.
- Pending: `·` in muted.

Connect the status to actual pipeline events via existing WebSocket/SSE or polling mechanism if one exists. If not, use a timer-based simulation for now and note it as `// TODO: wire to actual pipeline status event`.

---

## WAVE 3 — FORM CONSOLIDATION
### Restructure screens. Zero field loss. This is critical.

### 3.1 Four-Screen Architecture

Consolidate the current multi-card layout into exactly 4 grouped screens. A "screen" here means a step in a multi-step form — the user sees one screen at a time, with BACK / CONTINUE navigation.

**SCREEN 1 — "Where Are You Heading?" (Intent + Comp)**
Fields to include:
- Intent selector (3 cards: Stay sharp / Move to specific role / Help me design direction)
- Primary outcome goals (chips: Professional Visibility, Professional Advancement, Increased Compensation, Increased Stability)
- Target compensation level (dropdown)
- Current or target job title (text input)
- Current or target salary range (text input — update placeholder to `e.g., $120k–$160k`)
- Benefits at or near review → change from single checkbox to 3-option toggle: `NOT YET | UPCOMING | IN PROGRESS`

**SCREEN 2 — "Where Are You Now?" (Context + AI + JD)**
Fields to include:
- Current title (text input)
- Industry (text input)
- AI usage frequency (chips: Rarely or Never / Occasionally / Regularly / Daily)
- Enterprise AI context (chips: ChatGPT Enterprise / Gemini / Copilot / Claude / No Formal Mandate / Other)
- Job description paste (textarea — large, prominent)
  - Update label to: `"Paste your current or target job description"`
  - Update helper text to: `"This is your most valuable input. Alignment and gap analysis depends on it."`

**SCREEN 3 — "What Are We Working With?" (Resume + Interests + Modality)**
Fields to include:
- Resume link or upload reference (text input)
- "Run ALIGN MY BIO after upload" toggle (keep as-is)
- Foundational areas of interest (all existing chips)
- Advanced areas of interest (all existing chips)
- Learning modality preferences (all existing chips)

**SCREEN 4 — "What Do We Need to Know?" (Reality + Constraints)**
Fields to include:
- Current title (if not already captured — de-dupe if Screen 2 captured it)
- Industry (de-dupe)
- "If you had to pick a direction, what are you aiming at?" (text input)
- "Under pressure, what breaks first?" (text input)
- "When you need momentum, what helps most?" (text input)
- "Constraints we should respect?" (text input: Time, location, salary, caregiving, etc.)

At bottom of Screen 4: **"AUTOFILL REMAINDER"** button — keep this, and promote it to be visible from Screen 2 onward as a secondary option in the navigation row.

---

### 3.2 SuitePreview Enhancement

Find the `SuitePreview` card (currently shows a single line of text about three pillars).

Replace with a three-column artifact preview:
```tsx
const artifacts = [
  {
    icon: '◉',
    label: 'YOUR BRIEF',
    promise: 'A market-calibrated verdict on where your value lands and what is suppressing it.'
  },
  {
    icon: '◈',
    label: 'YOUR PROFILE',
    promise: 'Your career genome — adaptive assets, extinction risks, and behavioral propensities.'
  },
  {
    icon: '◎',
    label: 'YOUR PLAN',
    promise: 'A 72-hour action sequence and a 90-day adaptation roadmap, built around your constraints.'
  },
]
```

Render each as a small card: icon + `font-mono text-[9px] uppercase` label + `font-body text-sm italic` promise text.

---

## WAVE 4 — VOICE AGENT COMPLETION
### Wire the extraction layer. Complete the arc. This is the intelligence layer.

### 4.1 Voice Agent Conversation Arc

The voice agent currently runs a session. You need to verify and complete the following:

**System prompt location:** Find where the voice agent system prompt is defined (likely in `api/prompts/conciergeRom.js` or a dedicated voice prompt file). The system prompt must include the following arc instructions:

```
You are conducting a structured career intelligence intake. Your tone is warm, precise, and unhurried — like a senior partner at a boutique firm who has done a thousand of these conversations. Do not read from a script. Adapt based on what the user reveals.

You will guide the user through seven stages. In each stage, ask one well-formed question and listen carefully before moving on. Do not rush. Do not pepper the user with multiple questions at once.

STAGE 1 — ANCHOR
Ask: "Tell me what you're navigating right now — professionally."
Listen for: current role, tension signals, timeline pressure, constraints.
Target fields: current_title, industry, constraints, timeline_urgency

STAGE 2 — INTENT
Ask: "Are you optimizing where you are, making a specific move, or still designing the direction?"
Map their answer to: STAY_SHARP | SPECIFIC_MOVE | DESIGN_DIRECTION
Target fields: intent_type, search_mode

STAGE 3 — PROOF
Ask: "What's the work you're most proud of in the past 18 months? What would you point to if I asked you to prove your impact?"
Do not accept vague answers. Ask one follow-up if needed: "Can you put a number or outcome on that?"
Target fields: proof_artifacts, quantified_outcomes, role_ownership

STAGE 4 — MARKET
Ask: "Where are you targeting — what kind of organizations, what sector, what geography? And what does the right next step look like financially?"
Target fields: target_sector, target_companies, comp_range, comp_posture

STAGE 5 — FRICTION
Ask: "What's getting in the way? Time, narrative, visibility — or something else?"
Target fields: extinction_risks, suppressor_signals, adaptation_urgency

STAGE 6 — CONTEXT
Ask: "How are you currently using AI in your work? Does your organization have a platform mandate?"
Keep this conversational — do not make it feel like a survey question.
Target fields: ai_usage_frequency, enterprise_ai_context, ai_proficiency_self_report

STAGE 7 — CLOSE
Synthesize what you heard into 3 sentences. Read it back. Ask: "Is that right, or did I miss something important?"
Target fields: intent_confirmed, corrections_noted, synthesis_approval

On completion, say: "That gives us what we need. We are preparing your suite now." Then end the session cleanly.
```

---

### 4.2 Transcript Extraction → Intake Field Mapping

After the voice session closes, the transcript (or structured session data) must be passed through an extraction function that populates the intake form fields.

Create or update the extraction function. Location: wherever the voice session close handler lives.

```ts
async function extractIntakeFromTranscript(transcript: string): Promise<Partial<IntakeFormData>> {
  // Call the API extraction endpoint (or run locally if transcript is short enough)
  // The extraction prompt should instruct the model to output structured JSON matching IntakeFormData
  // Map the following fields:
  // transcript signal → intake field
  // current role mention → current_title
  // industry mention → industry
  // timeline/urgency signals → constraints, timeline_urgency
  // intent classification → intent_type
  // proof artifact descriptions → proof_artifacts (array of strings)
  // quantified outcomes → quantified_outcomes
  // target sector/company mentions → target_sector, target_companies
  // compensation mentions → comp_range
  // friction/blocker descriptions → suppressor_signals
  // AI usage frequency signals → ai_usage_frequency
  // enterprise AI tool mentions → enterprise_ai_context
  
  // Return a partial IntakeFormData object — only populate fields with high-confidence extractions
  // Leave uncertain fields empty (do not hallucinate intake data)
}
```

After extraction, call `autofillFormFromVoice(extractedFields)` which merges the extracted fields into the existing intake form state. Fields already filled by the user take precedence over voice-extracted values (do not overwrite user input).

---

### 4.3 Voice-to-Form Autofill

The `voice_to_form_autofill` behavior:
- After extraction runs, visually indicate which fields were pre-filled from voice: add a small `font-mono text-[8px] text-teal` label `"← FROM VOICE SESSION"` next to each auto-populated field.
- User can edit any auto-filled field normally.
- The AUTOFILL REMAINDER button should be aware of which fields came from voice vs. which are still empty, and only autofill the remaining empty ones.

---

## TYPES.TS — SCHEMA ADDITIONS

If any of the following fields are missing from the intake schema in `types.ts`, add them:

```ts
interface IntakeFormData {
  // Existing fields (confirm these are present)
  intent_type: 'STAY_SHARP' | 'SPECIFIC_MOVE' | 'DESIGN_DIRECTION';
  outcome_goals: string[];
  comp_level: string;
  current_title: string;
  target_title: string;
  salary_range: string;           // Updated from single value
  benefits_timing: 'NOT_YET' | 'UPCOMING' | 'IN_PROGRESS'; // Updated from boolean
  ai_usage_frequency: 'RARELY_OR_NEVER' | 'OCCASIONALLY' | 'REGULARLY' | 'DAILY';
  enterprise_ai_context: string[];
  job_description: string;
  resume_url: string;
  align_bio_on_upload: boolean;
  foundational_interests: string[];
  advanced_interests: string[];
  learning_modality: string[];
  direction_aim: string;
  pressure_breaks: string;
  momentum_source: string;
  constraints: string;
  industry: string;

  // New fields to add if missing
  tone_preference: string[];         // From tone chip selector
  timeline_urgency: string;          // Extracted from voice or conversation flow
  target_sector: string;             // From voice MARKET stage
  target_companies: string[];        // From voice MARKET stage
  comp_range: string;                // Structured range (from voice or form)
  comp_posture: string;              // Derived: SUPPRESSED | MARKET | PREMIUM
  proof_artifacts: string[];         // From voice PROOF stage
  quantified_outcomes: string[];     // From voice PROOF stage
  role_ownership: string;            // From voice PROOF stage
  suppressor_signals: string[];      // From voice FRICTION stage
  ai_proficiency_self_report: string; // From voice CONTEXT stage

  // Voice session metadata
  voice_session_id?: string;
  voice_session_completed?: boolean;
  voice_extracted_fields?: string[]; // Which fields were populated from voice
  synthesis_approval?: boolean;      // Did user confirm the CLOSE stage summary?
}
```

---

## OPERATOR CONFIG ADDITIONS

In the shared config model (`types.ts` or wherever the operator config schema lives), add the following to the Professional DNA config block if not already present:

```ts
interface ProfessionalDNAConfig {
  // ... existing fields ...
  
  // Hero video
  hero_video_url?: string;
  hero_video_title?: string;
  hero_autoplay_muted?: boolean;
  hero_loop?: boolean;
  hero_fallback_image_url?: string;
  hero_visible?: boolean;

  // Voice agent
  voice_agent_enabled?: boolean;
  voice_agent_persona?: string;
  voice_arc_sections?: string[];
  voice_model?: 'elevenlabs_conversational' | 'gemini_live';
  voice_agent_voice_id?: string;
  voice_transcription_visible?: boolean;
  voice_to_form_autofill?: boolean;
}
```

Expose the new hero video fields and voice agent fields in the Admin Console's `Experience` rail (`components/AdminConsole.tsx`). Group them under two new sub-sections: `HERO VIDEO` and `VOICE AGENT`.

---

## BRIEF THREAD VISIBILITY

In `components/BriefView.tsx`, locate the header or abstract section and add the following source count display if not already present:

```tsx
<div className="font-mono text-[9px] tracking-[0.12em] text-muted uppercase flex gap-4">
  <span>{evidenceNodeCount} evidence nodes</span>
  <span>·</span>
  <span>{intakeSignalCount} intake signals</span>
  <span>·</span>
  <span>{marketSourceCount} market sources</span>
</div>
```

These values should come from the `evidence_ledger` array in the Brief data object:
- `evidenceNodeCount` = `brief.evidence_ledger.length`
- `intakeSignalCount` = `brief.evidence_ledger.filter(e => e.source === 'intake').length`
- `marketSourceCount` = `brief.evidence_ledger.filter(e => e.source !== 'intake').length`

---

## EXECUTION ORDER

Work through the waves in strict order. Do not start Wave 2 until Wave 1 changes are in place and visually confirmed. Each wave should be a separate commit or PR.

```
Wave 1: Typography + Colors + Spacing + Component tweaks       → commit: "feat: intake luxury baseline"
Wave 2: HeroVideoSection + PlayRail reposition + Progress UI  → commit: "feat: intake entry experience"
Wave 3: Form consolidation + SuitePreview + Field updates      → commit: "feat: intake form consolidation"
Wave 4: Voice arc + Extraction layer + Autofill                → commit: "feat: intake voice agent completion"
Types:  Schema additions (can go with Wave 1 or Wave 4)        → commit: "types: intake schema expansion"
Admin:  Operator config additions                              → commit: "feat: admin intake config surface"
Brief:  Thread visibility in BriefView                        → commit: "feat: brief source count display"
```

---

## CONSTRAINTS & GUARDRAILS

- **Do not touch** `BriefView.tsx` beyond the thread visibility addition specified above.
- **Do not touch** `ProfileView.tsx` in this sprint.
- **Do not touch** `api/index.js` orchestration beyond wiring the transcript extraction if needed.
- **Do not change** the post-intake pipeline trigger logic — only add the `DNAProgressIndicator` to surface what is already happening.
- **Preserve all existing intake form field names exactly** — the API contract depends on them. Add new fields, do not rename existing ones.
- **Never hardcode operator config values** in components. Always read from the operator config object.
- **The voice agent system prompt is operator-configurable.** The arc instructions above are the DEFAULT. The operator's `voice_agent_persona` appendix is appended after them. Always append, never replace.

---

## DEFINITION OF DONE

Wave 1 is done when:
- [ ] All intake typography uses Playfair Display / IBM Plex Mono / EB Garamond
- [ ] No `box-shadow` on intake cards
- [ ] Active tab shows bottom-border only, no fill
- [ ] All CTAs are `rounded-none` mono font
- [ ] Operator Speed Run is hidden for non-operator users
- [ ] Intent cards have teal top-border selected state and hover arrow

Wave 2 is done when:
- [ ] HeroVideoSection renders with video or fallback
- [ ] Immersive Play Rail is positioned above the form path
- [ ] CTA reads "BEGIN VOICE INTAKE"
- [ ] Session mood pulse indicator is live
- [ ] DNAProgressIndicator component exists and renders post-completion

Wave 3 is done when:
- [ ] All intake fields are preserved and mapped to one of the 4 screens
- [ ] No field from the MVP is missing
- [ ] SuitePreview shows three artifact cards with promises
- [ ] Benefits is a 3-state toggle
- [ ] Salary field accepts range format
- [ ] Job description textarea has updated prominence and helper text
- [ ] AUTOFILL REMAINDER visible from Screen 2 onward

Wave 4 is done when:
- [ ] Voice arc system prompt is updated with 7-stage structure
- [ ] Transcript extraction function exists and maps to IntakeFormData
- [ ] Voice-extracted fields are visually labeled in the form
- [ ] CLOSE stage triggers verbal synthesis + session close + pipeline start
- [ ] voice_to_form_autofill merges without overwriting user-entered data

Brief thread is done when:
- [ ] Evidence node count, intake signal count, and market source count display in BriefView header
- [ ] Counts correctly reflect data from evidence_ledger

---

*Professional DNA · Smart Start Intake Implementation Brief · Third Signal Labs*
*operator@thirdsignal.ai*
