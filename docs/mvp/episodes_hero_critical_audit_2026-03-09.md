# Episodes Hero Critical Audit

Audit date: March 9, 2026

This document is the critical audit for the Episodes flow as the hero feature of the Career Concierge OS demo. It checks the current implementation against:

- Jim's extracted requirements
- the Lucidchart journey baseline
- the shipped admin/config surfaces
- current official Gemini API model and Live API guidance

## Executive Conclusion

Episodes is now materially better than it was in the March 9 morning build, but it is still not at the bar implied by the product thesis.

The flow is now cinematic enough to demo.
It is not yet cinematic enough to claim category-leading polish.

The main reason is structural, not decorative:

1. the client player now stages six beats cleanly
2. the backend still only generates one image route and one video route per episode pack
3. admin can now flip model routing quickly, but it still cannot validate or compare route quality from inside the control plane

## Findings

### 1. Scene-level media orchestration is still incomplete

Severity: high

The client player now treats `hook`, `swipe1`, `swipe2`, `swipe3`, `challenge`, and `reward` as distinct stage slots.
That is the correct direction.

The backend media pack, however, still produces one image route and one video route per episode pack, not a true per-beat manifest.
That means the player is still composing a cinematic illusion from limited supply rather than receiving a real scene plan.

Result:

- the UI can look polished
- the operator story can sound polished
- the underlying asset system is not yet truly beat-native

Until scene-level media manifests exist, Episodes should be described as a strong demo surface, not the final operating form.

### 2. Model routing had drifted onto stale preview defaults

Severity: high

Before this pass, the runtime and admin defaults still centered on `gemini-3-flash-preview` and `gemini-2.5-flash-image-preview`.
That was not a safe production posture.

The repo now defaults to:

- `gemini-2.5-pro` for suite artifacts
- `gemini-2.5-pro` for hero episode writing
- `gemini-2.5-flash-lite` as the cheap utility fallback
- `gemini-2.5-flash-image` for still generation
- `veo-3.1-generate-preview` for cinematic video

Important note:

- AI Studio is explicitly warning that `Gemini 3 Pro Preview` is deprecated and points users to `Gemini 3.1 Pro Preview`
- public Gemini model docs on March 9, 2026 still prominently list `Gemini 2.5` stable models and `Gemini 3` preview models, not a full public `3.1` catalog

So the responsible operating stance is:

- keep stable `2.5` routes as production defaults
- expose `3.x` and `3.1` preview ids as selectable migration options
- do not silently make preview ids the default without validated runtime access

### 3. Admin control improved, but not yet to operator-grade observability

Severity: medium

Admin now supports:

- quick routing presets
- explicit model selectors
- clearer config-save error copy

That is materially better.

Admin still lacks:

- route-by-route success metrics
- cost/latency comparison traces
- a model validation action that proves a selected route is actually callable before an operator saves it as the default

This is enough for controlled operator use.
It is not yet a mature control plane.

### 4. Episodes still falls short of the product promise in four ways

Severity: medium

Relative to Jim's notes and the Lucidchart posture, the remaining gaps are:

1. no true per-beat generated media manifest
2. no audio-bed or soundtrack layer per episode beat
3. no premium continuation logic that feels like a serialized season arc
4. no operator-side approval ritual that turns episode quality into a governed content pipeline

The current build is attractive.
It does not yet surpass the Lucid inspiration or feel "more intuitive than Apple" in the literal sense the product ambition implies.

## Model Guidance

### Production Defaults

- `suite_model`: `gemini-2.5-pro`
- `binge_model`: `gemini-2.5-pro`
- `utility_model`: `gemini-2.5-flash-lite`
- `image_model`: `gemini-2.5-flash-image`
- `video_model`: `veo-3.1-generate-preview`
- `live_voice_model`: `gemini-2.5-flash-native-audio-preview-12-2025`

### When To Use Lower-Cost Routes

- Use `gemini-2.5-flash` for faster interactive episode iteration when quality can drop slightly.
- Use `gemini-2.5-flash-lite` for QA loops, draft-only passes, and operator-side experimentation.
- Use `veo-3.1-fast-generate-preview` only when iteration speed matters more than polish.

### `3.1` Migration Stance

Treat `gemini-3.1-pro-preview`, `gemini-3.1-flash-lite-preview`, and `gemini-3.1-flash-image-preview` as gated migration targets.

They are useful to expose in admin for controlled testing.
They should not replace stable defaults until:

1. the project can call them successfully
2. the operator has compared quality and latency inside this product
3. the public Gemini docs clearly carry them as current supported routes

### Live API Guidance

The Live API path in this repo is directionally correct because it already uses:

- ephemeral tokens
- transcription toggles
- VAD tuning
- affective-dialog support
- proactive-audio support
- thinking-budget controls

But the defaults remain conservative.

That is the right production stance for now.
Do not enable affective, proactive, or thinking by default until the team validates them against the Chief of Staff voice contract.

## Demo Validation Read

Against Jim's explicit MVP demo asks:

- intake submission and Firestore storage: covered
- Chief of Staff summary and next-step logging: covered
- episode generation triggered and playable in UI: covered
- admin dashboard for runtime and job health: covered

Against the stronger Episodes thesis:

- cinematic stage: partial
- per-beat media authorship: partial
- operator-manageable narrative system: partial
- standout premium feel: partial

## Outcome Of This Pass

This pass should be treated as:

- a routing and governance hardening pass
- a model-default correction pass
- a critical audit baseline for the next Episodes hero sprint

It should not be treated as the final Episodes completion milestone.

## Sources

- Gemini models: https://ai.google.dev/gemini-api/docs/models
- Gemini Live API: https://ai.google.dev/gemini-api/docs/live
- Gemini image generation: https://ai.google.dev/gemini-api/docs/image-generation
- Jim baseline: `docs/mvp/Jim's Notes - Key Requirements Extracted.md`
- Lucid baseline: `docs/mvp/lucidchart_analysis.md`
