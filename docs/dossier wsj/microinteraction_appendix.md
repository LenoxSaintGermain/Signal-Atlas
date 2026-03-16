# APPENDIX — Micro-Interaction & Motion Guidance
## Smart Start Intake · Journey Guide · Suite Dashboard
### Appended to: Implementation Brief v1

---

## PHILOSOPHY FIRST

Micro-interactions in this system follow one rule: **the UI should feel like it is paying attention.**

Not animated. Not bouncy. Not gamified. *Attentive.*

Every motion has a reason. Every cue earns its place. If you can remove it and the experience doesn't lose anything, remove it. The goal is not delight for its own sake — it is the feeling that this product is reading the room and responding accordingly.

The aesthetic register is: **quiet confidence**. Like a well-trained concierge who anticipates before you ask. Nothing shouts. Everything responds.

---

## TIMING & EASING SYSTEM

Define these as CSS custom properties and use them consistently. Never use linear or `ease` defaults.

```css
:root {
  /* Entrances — things appearing */
  --ease-appear:   cubic-bezier(0.16, 1, 0.3, 1);   /* fast out, slow settle */
  --dur-appear:    320ms;

  /* Exits — things leaving */
  --ease-exit:     cubic-bezier(0.4, 0, 1, 0.6);    /* slow start, fast out */
  --dur-exit:      180ms;

  /* Hover states */
  --ease-hover:    cubic-bezier(0.2, 0, 0, 1);
  --dur-hover:     150ms;

  /* Content transitions (tab changes, chapter switches) */
  --ease-cross:    cubic-bezier(0.4, 0, 0.2, 1);
  --dur-cross:     220ms;

  /* Nudges / micro-shifts */
  --ease-nudge:    cubic-bezier(0.34, 1.56, 0.64, 1); /* slight overshoot */
  --dur-nudge:     240ms;
}
```

**Hard rules:**
- Nothing animates longer than 400ms. If it takes longer, it's structural, not decorative.
- Stagger lists with `animation-delay` increments of 40–60ms. Never more than 6 items in a stagger.
- Reduced motion: wrap all decorative animations in `@media (prefers-reduced-motion: no-preference)`. Functional transitions (panel open/close) may remain at 50% duration.

---

## 1 · FORM CUES — The Intake Knows You're Working

### 1.1 Input Focus — The Field Wakes Up
When a user focuses any text input or textarea:
```css
/* The label slides up and shrinks — classic floating label but editorial */
.field-label {
  transition: transform var(--dur-hover) var(--ease-hover),
              font-size var(--dur-hover) var(--ease-hover),
              color var(--dur-hover) var(--ease-hover);
}
.field:focus-within .field-label {
  transform: translateY(-18px);
  font-size: 8px;
  letter-spacing: 0.16em;
  color: var(--color-teal);
}

/* Left border activates on focus — top to bottom reveal */
.field::before {
  content: '';
  position: absolute; left: 0; top: 0;
  width: 2px; height: 0;
  background: var(--color-teal);
  transition: height var(--dur-appear) var(--ease-appear);
}
.field:focus-within::before { height: 100%; }
```

### 1.2 Chip Selection — The Tap Registers
When a chip/tag is selected, it should not just change color — it should confirm receipt.

```css
@keyframes chip-confirm {
  0%   { transform: scale(1); }
  40%  { transform: scale(0.94); }
  70%  { transform: scale(1.03); }
  100% { transform: scale(1); }
}
.chip.selected {
  animation: chip-confirm var(--dur-nudge) var(--ease-nudge);
}
```

On deselect, reverse: brief scale-down (0.96) then back to 1. No bounce on deselect — that would feel like rejection.

### 1.3 Textarea Fill — The Field Fills With Intention
As a textarea fills with content, show a subtle ink-fill effect along the left edge:
```css
/* Height of filled indicator = percentage of content / max */
.textarea-wrapper .fill-indicator {
  position: absolute; left: 0; bottom: 0;
  width: 2px;
  background: linear-gradient(to top, var(--color-teal), transparent);
  transition: height 0.4s var(--ease-hover);
  /* height is set via JS: (value.length / maxLength) * 100 + '%' */
}
```
Cap at 80% height — never complete-looking, because a conversation is never complete.

### 1.4 Autofill Arrival — Fields That Arrive From Voice
When `voice_to_form_autofill` populates a field, the value should not snap in — it should type itself:

```js
// Typewriter fill for autofilled values
async function typewriterFill(element, value, speed = 18) {
  element.value = '';
  for (let i = 0; i < value.length; i++) {
    element.value += value[i];
    element.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, speed + Math.random() * 12));
  }
}
```

Follow the typewriter with the `← FROM VOICE SESSION` label fading in:
```css
@keyframes label-arrive {
  from { opacity: 0; transform: translateX(-6px); }
  to   { opacity: 1; transform: translateX(0); }
}
.voice-label { animation: label-arrive 280ms var(--ease-appear) forwards; }
```

### 1.5 Continue Button — It Earns Its Activation
The CONTINUE button starts visually subdued when required fields are incomplete. As fields fill, it gradually resolves:

```css
.continue-btn {
  opacity: 0.4;
  filter: saturate(0.3);
  transform: none;
  transition: opacity 0.3s var(--ease-hover),
              filter 0.3s var(--ease-hover),
              background 0.2s;
  pointer-events: none;
}
.continue-btn.ready {
  opacity: 1;
  filter: saturate(1);
  pointer-events: auto;
}
```

When it becomes `.ready`, don't just snap — add a single, subtle pulse:
```css
@keyframes btn-ready {
  0%   { box-shadow: 0 0 0 0 rgba(75, 158, 141, 0.35); }
  60%  { box-shadow: 0 0 0 8px rgba(75, 158, 141, 0); }
  100% { box-shadow: 0 0 0 0 rgba(75, 158, 141, 0); }
}
.continue-btn.ready { animation: btn-ready 600ms var(--ease-appear); }
```

---

## 2 · NAVIGATION CUES — The System Remembers Where You Are

### 2.1 Tab Indicator — It Slides, It Doesn't Jump
The active tab indicator (bottom border) should slide between tabs, not flash:

```js
// Measure the active tab's offsetLeft and width
// Move a single indicator bar absolutely underneath all tabs
function moveIndicator(targetTab) {
  const { offsetLeft, offsetWidth } = targetTab;
  indicator.style.transform = `translateX(${offsetLeft}px)`;
  indicator.style.width = `${offsetWidth}px`;
}
```

```css
.tab-indicator {
  position: absolute; bottom: 0; left: 0;
  height: 2px; background: var(--color-teal);
  transition: transform var(--dur-cross) var(--ease-cross),
              width var(--dur-cross) var(--ease-cross);
}
```

### 2.2 Journey Guide Act Switch — Content Cross-Fades
When switching acts in the Journey Guide, the center column content exits slightly down and new content enters slightly up:

```js
async function switchAct(newIdx) {
  // Exit
  content.style.opacity = '0';
  content.style.transform = 'translateY(8px)';
  await wait(160);
  // Swap
  setAct(newIdx);
  // Enter
  content.style.transform = 'translateY(-6px)';
  await wait(20);
  content.style.opacity = '1';
  content.style.transform = 'translateY(0)';
}
```

```css
.chapter-content {
  transition: opacity var(--dur-exit) var(--ease-exit),
              transform var(--dur-exit) var(--ease-exit);
}
```

The left rail act buttons: the active teal border grows from 0 height, not from full height. Use `scaleY` transform — it's GPU-accelerated:

```css
.act-btn::before {
  content: '';
  position: absolute; left: 0; top: 0;
  width: 2px; height: 100%;
  background: var(--color-teal);
  transform: scaleY(0);
  transform-origin: top;
  transition: transform var(--dur-appear) var(--ease-appear);
}
.act-btn.active::before { transform: scaleY(1); }
```

### 2.3 Module Tile Highlight — The Board Responds
When an act is selected in the Journey Guide, tiles on the main board highlight. This should feel like a spotlight, not a toggle:

```css
/* All tiles start dimming before the highlights appear */
.module-tile { transition: opacity 0.25s var(--ease-hover), transform 0.25s var(--ease-hover), box-shadow 0.25s; }

.board.act-active .module-tile          { opacity: 0.2; filter: saturate(0.3); }
.board.act-active .module-tile.in-act   {
  opacity: 1;
  filter: saturate(1);
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(75, 158, 141, 0.1);
}
```

Stagger the `.in-act` tiles appearing using `animation-delay`:
```js
inActTiles.forEach((tile, i) => {
  tile.style.animationDelay = `${i * 50}ms`;
  tile.classList.add('spotlight-in');
});
```

```css
@keyframes spotlight-in {
  from { opacity: 0.2; transform: translateY(0); }
  to   { opacity: 1;   transform: translateY(-3px); }
}
.spotlight-in {
  animation: spotlight-in 300ms var(--ease-appear) both;
}
```

---

## 3 · OVERLAY BEHAVIOR — The Panel Has Presence

### 3.1 Journey Guide Opening — The World Contracts
When the Journey Guide overlay opens, the board below doesn't just sit there — it visually recedes:

```css
.board-container {
  transition: transform 0.4s var(--ease-appear),
              filter 0.4s var(--ease-appear),
              opacity 0.4s;
}
.board-container.guide-open {
  transform: scale(0.985) translateY(6px);
  filter: blur(0.5px) saturate(0.7);
  opacity: 0.6;
}
```

The overlay itself should slide down and expand, not just appear:
```css
.overlay-panel {
  transform-origin: top center;
  transform: scaleY(0.92) translateY(-12px);
  opacity: 0;
  transition: transform var(--dur-appear) var(--ease-appear),
              opacity var(--dur-appear) var(--ease-appear);
}
.overlay-panel.open {
  transform: scaleY(1) translateY(0);
  opacity: 1;
}
```

### 3.2 Invite Strip — It Pulses Once on First Load
On the user's first visit (no `hasSeenOverlay`), the invite strip should pulse once ~2 seconds after load to draw the eye without screaming:

```js
useEffect(() => {
  if (!hasSeenOverlay) {
    const t = setTimeout(() => {
      strip.current?.classList.add('nudge-pulse');
    }, 2200);
    return () => clearTimeout(t);
  }
}, []);
```

```css
@keyframes nudge-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(75, 158, 141, 0.0); }
  30%  { box-shadow: 0 0 0 4px rgba(75, 158, 141, 0.18); }
  100% { box-shadow: 0 0 0 0 rgba(75, 158, 141, 0.0); }
}
.nudge-pulse { animation: nudge-pulse 900ms var(--ease-appear) forwards; }
```

One pulse. Never repeat. Remove the class after animation ends.

### 3.3 Fixed Anchor (Bottom-Right) — Breathes, Doesn't Blink
The persistent `YOUR JOURNEY GUIDE` anchor should have a slow, gentle pulse on the dot indicator — not a blink, a breath:

```css
@keyframes dot-breathe {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50%       { opacity: 1;   transform: scale(1.25); }
}
.anchor-dot {
  animation: dot-breathe 3.2s ease-in-out infinite;
}
```

The anchor itself: on hover, the text slides right by 3px and the dot moves left by 2px — they stretch apart slightly:
```css
.journey-anchor:hover .anchor-text { transform: translateX(3px); }
.journey-anchor:hover .anchor-dot  { transform: translateX(-2px); }
.anchor-text, .anchor-dot { transition: transform var(--dur-hover) var(--ease-hover); }
```

---

## 4 · DATA REVEALS — The Intelligence Arrives

### 4.1 DNA Progress Indicator — Pipeline Stages Arrive in Sequence
When the pipeline status indicator appears post-intake, each stage should arrive with a stagger, and the loading stage should have a genuine "working" feel:

```css
/* Stage entrance */
@keyframes stage-arrive {
  from { opacity: 0; transform: translateX(-10px); }
  to   { opacity: 1; transform: translateX(0); }
}
.pipeline-stage {
  opacity: 0;
  animation: stage-arrive 300ms var(--ease-appear) forwards;
}
.pipeline-stage:nth-child(1) { animation-delay: 0ms; }
.pipeline-stage:nth-child(2) { animation-delay: 120ms; }
.pipeline-stage:nth-child(3) { animation-delay: 240ms; }

/* Loading state — not a spinner, a scan line */
@keyframes scan {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
.stage-loading-bar {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(75,158,141,0.35), transparent);
  animation: scan 1.4s var(--ease-cross) infinite;
}
```

### 4.2 The Brief — Signal Scores Count Up
When Market Fit (73), Signal Clarity (41), and other scores first render, they should count up from 0:

```js
function countUp(el, target, duration = 900) {
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target; // snap to exact value
  };
  requestAnimationFrame(step);
}
```

The score bars should fill after the number lands — 200ms delay after count ends:
```css
.signal-bar-fill {
  width: 0;
  transition: width 600ms var(--ease-appear);
}
/* Add class after countUp resolves */
.signal-bar-fill.filled { width: var(--fill-width); }
```

### 4.3 Evidence Node Counter — It Tallies Live
In the Brief header (`14 evidence nodes · 3 intake signals · 11 market sources`), if this renders after an async research pass, tally each number separately with a slight stagger between them:

```js
// Stagger the three counters
countUp(evidenceEl, 14, 700);
setTimeout(() => countUp(intakeEl, 3, 400), 200);
setTimeout(() => countUp(marketEl, 11, 600), 350);
```

### 4.4 Comp Grade — Letter Grade Flips In
The comp posture grade (B+, A−, A+) should flip in like a departure board letter, not fade:

```css
@keyframes grade-flip {
  0%   { transform: rotateX(90deg); opacity: 0; }
  60%  { transform: rotateX(-8deg); opacity: 1; }
  100% { transform: rotateX(0deg);  opacity: 1; }
}
.comp-grade {
  display: inline-block;
  transform-style: preserve-3d;
  animation: grade-flip 420ms var(--ease-appear) forwards;
  animation-delay: 300ms;
  opacity: 0;
}
```

---

## 5 · VOICE AGENT — It Has Physical Presence

### 5.1 Standby → Live Transition
The status indicator transition from STANDBY to LIVE should feel like a room changing:

```css
/* Standby: slow, calm pulse */
@keyframes standby-breathe {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50%       { opacity: 0.9; transform: scale(1.2); }
}
.status-dot.standby {
  background: var(--color-teal);
  animation: standby-breathe 3s ease-in-out infinite;
}

/* Live: fast, confident double-pulse */
@keyframes live-pulse {
  0%   { transform: scale(1);    opacity: 1; }
  20%  { transform: scale(1.35); opacity: 0.8; }
  40%  { transform: scale(1);    opacity: 1; }
  60%  { transform: scale(1.15); opacity: 0.85; }
  80%  { transform: scale(1);    opacity: 1; }
  100% { transform: scale(1);    opacity: 1; }
}
.status-dot.live {
  background: var(--color-teal);
  animation: live-pulse 1.8s ease-in-out infinite;
}
```

### 5.2 Voice Waveform — While Speaking
While the voice agent is speaking, show a minimal waveform: 5 bars, each with independent randomized animation:

```css
@keyframes bar-wave {
  0%, 100% { transform: scaleY(0.3); }
  50%       { transform: scaleY(1); }
}
.wave-bar {
  width: 3px;
  height: 18px;
  background: var(--color-teal);
  transform-origin: bottom;
  border-radius: 1px;
  animation: bar-wave 0.8s ease-in-out infinite;
}
.wave-bar:nth-child(1) { animation-delay: 0ms;   animation-duration: 0.75s; }
.wave-bar:nth-child(2) { animation-delay: 100ms; animation-duration: 0.9s; }
.wave-bar:nth-child(3) { animation-delay: 50ms;  animation-duration: 0.7s; }
.wave-bar:nth-child(4) { animation-delay: 180ms; animation-duration: 0.85s; }
.wave-bar:nth-child(5) { animation-delay: 80ms;  animation-duration: 0.95s; }
```

When agent stops speaking, bars settle smoothly to `scaleY(0.3)` — don't cut them. Use a CSS transition override when inactive:
```css
.wave-bar.idle {
  animation: none;
  transform: scaleY(0.3);
  transition: transform 400ms var(--ease-hover);
}
```

### 5.3 CLOSE Stage — The Session Resolves
When the voice agent completes and says "We are preparing your suite now," the cinematic dark panel should:
1. Waveform bars settle to idle (400ms)
2. Status dot transitions from LIVE → a held steady teal (no animation)
3. A single horizontal scan line sweeps across the panel bottom to top (400ms, once)
4. A `✓ SESSION COMPLETE` label fades in

```css
@keyframes session-scan {
  from { transform: translateY(100%); opacity: 0.4; }
  to   { transform: translateY(-100%); opacity: 0; }
}
.session-scan-line {
  position: absolute; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(to right, transparent, var(--color-teal), transparent);
  animation: session-scan 500ms var(--ease-appear) forwards;
}

@keyframes complete-arrive {
  from { opacity: 0; letter-spacing: 0.3em; }
  to   { opacity: 1; letter-spacing: 0.16em; }
}
.session-complete-label {
  animation: complete-arrive 400ms var(--ease-appear) 400ms both;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px; color: var(--color-teal);
  text-transform: uppercase;
}
```

---

## 6 · HOVER LANGUAGE — The Interface Communicates Intent

### 6.1 Module Tiles — The Tile Knows It's Selected
On hover, each module tile should do two things simultaneously — the top border reveals (left to right) AND the number nudges up by 2px:

```css
.module-tile .tile-num {
  transition: transform var(--dur-hover) var(--ease-nudge);
}
.module-tile:hover .tile-num { transform: translateY(-2px); }

.module-tile::before {
  content: '';
  position: absolute; top: 0; left: 0;
  height: 2px; width: 0;
  background: var(--color-teal);
  transition: width 200ms var(--ease-appear);
}
.module-tile:hover::before { width: 100%; }
```

### 6.2 CTA Buttons — Arrow Travels
All CTA buttons containing `→` should have the arrow travel slightly right on hover:

```css
.cta-arrow {
  display: inline-block;
  transition: transform var(--dur-hover) var(--ease-nudge);
}
.next-btn:hover .cta-arrow { transform: translateX(4px); }
```

For the `← Prev` button, the arrow travels left:
```css
.prev-btn:hover .cta-arrow { transform: translateX(-4px); }
```

### 6.3 Intent Selector Cards — The Selection Radiates
When an intent card is selected, its sibling cards should slightly compress (scale 0.99) rather than just dim. The selected card expands by 1px on all sides:

```css
.intent-group:has(.intent-card.selected) .intent-card:not(.selected) {
  transform: scale(0.99);
  opacity: 0.65;
  transition: transform 200ms var(--ease-hover), opacity 200ms;
}
.intent-card.selected {
  transform: scale(1.005);
  transition: transform 200ms var(--ease-nudge);
}
```

### 6.4 The Suite Graph Nodes — Hover Radiates Out
On the architecture/branch map, when hovering a node, the connecting paths to it should thicken from the node outward — not all at once:

```js
// On node hover, animate stroke-dashoffset on connected paths
function animateEdgeIn(path) {
  const len = path.getTotalLength();
  path.style.strokeDasharray = len;
  path.style.strokeDashoffset = len;
  path.style.transition = `stroke-dashoffset 300ms ${easingCross}, stroke-width 150ms`;
  requestAnimationFrame(() => { path.style.strokeDashoffset = '0'; });
}
```

---

## 7 · IDLE & AMBIENT — The System That Waits Gracefully

### 7.1 The Dashboard on First Load — Staggered Grid Arrival
On first render of the module grid, tiles should arrive in reading order (left-to-right, top-to-bottom) with a stagger:

```css
@keyframes tile-arrive {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.module-tile {
  opacity: 0;
  animation: tile-arrive 360ms var(--ease-appear) both;
}
/* Set animation-delay via inline style or JS: i * 35ms, max 16 tiles = 560ms total */
```

Cap the stagger so the last tile arrives within 560ms of the first. After 600ms, all tiles are settled. The grid should feel like it's loading a document, not performing a trick.

### 7.2 Long Idle — Gentle Reminder
If the user has been on the intake form > 4 minutes with no interaction, the AUTOFILL REMAINDER button gets a single, soft attention-getter:

```css
@keyframes soft-attention {
  0%, 100% { box-shadow: none; }
  50% { box-shadow: 0 0 0 3px rgba(75, 158, 141, 0.2); }
}
.autofill-btn.idle-nudge {
  animation: soft-attention 1.2s var(--ease-appear) 2;
  /* Only plays twice — then stops. One nudge. */
}
```

Remove `.idle-nudge` class after animation completes. Never repeat it.

### 7.3 Skeleton Loading — The Brief Arrives as a Draft
When the Brief is generating, show a skeleton state that uses the actual Brief layout — not a generic spinner. Each text block pulses with a warm shimmer:

```css
@keyframes skeleton-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.skeleton-block {
  background: linear-gradient(
    90deg,
    #E5E2DA 25%,
    #EDEAE2 50%,
    #E5E2DA 75%
  );
  background-size: 800px 100%;
  animation: skeleton-shimmer 1.6s ease-in-out infinite;
  border-radius: 0; /* match the design system — no rounded corners */
}
```

The skeleton layout must mirror the real Brief layout — headline width, two body paragraphs, three signal bars, the compensation card. When real content arrives, each skeleton block fades out as the real content fades in, one section at a time (top to bottom, 80ms stagger).

---

## WHAT NOT TO DO

These are as important as the above. Violating them will break the register.

- **No bounce on exits.** `ease-nudge` is only for confirmations (chip select, button ready). Things leaving should be fast and clean.
- **No spin animations** unless it's a loading state and even then, prefer the scan-line pattern over a spinner.
- **No parallax** on scroll. This is editorial, not a marketing site.
- **No hover color changes on dark surfaces** — use opacity and subtle glow instead of color swaps.
- **No more than two simultaneous animations** on any single element.
- **No animation on text** unless it's a count-up or a letter-flip grade reveal. Animated body copy is always a mistake.
- **Never autoplay sound** as a micro-interaction feedback. The voice agent is opt-in. Everything else is silent.
- **The `nudge-pulse` on the invite strip fires once, ever.** Not on every page load. Not after each session. Once. Log it to localStorage.

---

## IMPLEMENTATION CHECKLIST

Before considering micro-interactions done, verify:

- [ ] All `transition` declarations use CSS custom property easing vars, not raw values
- [ ] `@media (prefers-reduced-motion)` wrapper exists for all decorative animations
- [ ] No animation duration exceeds 400ms (structural transitions excepted)
- [ ] Grid stagger completes within 560ms total
- [ ] Invite strip pulse is gated to `!hasSeenOverlay` and fires exactly once
- [ ] Idle nudge plays exactly twice then self-clears the class
- [ ] Voice waveform goes idle (not cut) on agent pause
- [ ] Autofill typewriter effect fires only for voice-populated fields, not user-entered
- [ ] Score count-ups use eased interpolation, not linear
- [ ] Skeleton layout mirrors real Brief layout precisely
- [ ] Arrow travel on hover CTAs is `translateX` only — never margins

---

*Professional DNA · Smart Start Intake · Micro-Interaction Appendix v1 · Third Signal Labs*
