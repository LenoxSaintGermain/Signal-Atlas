# Governance Section Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the Governance/Policy section to fit in one viewport — same accordion + compact treatment applied to Media and Professional DNA sections.

**Architecture:** Collapse 5 sprawling panels (Access, Concierge Requests, Orchestration Control Plane, Approval Rail, Agent Registry) into a single dense layout: metric cards at top, collapsible `<details>` rows for each concern, compact inline rows for data lists (runs, requests, queue items). No scrolling.

**Tech Stack:** React 19, Tailwind CSS via CDN, existing admin-display/admin-body/admin-mono typography classes, existing SectionShell/Panel/ToggleField/TextField components.

---

## Current State (lines 2709-3108 in AdminConsole.tsx)

The section has 5 full `<Panel>` blocks:
1. **Access & entitlements** — 3 fields (toggle + 2 text inputs) — ~35 lines
2. **Concierge requests** — sprawling article cards with goal, service, timing, resume, action buttons — ~65 lines
3. **Orchestration control plane** — description block + 4 large metric cards + approval triggers/current stack chips + full run articles with policy flags, next roles, recommended actions — ~190 lines
4. **Approval rail** — already uses `<details>` rows — ~45 lines
5. **Agent registry** — already uses `<details>` rows — ~40 lines

**Total: ~400 lines, heavy vertical scroll**

## Target State (matching Media section pattern)

1. **Metric strip** — 4 compact metric cards (active roles, tracked runs, avg confidence, pending approvals) in `grid-cols-4 gap-1`
2. **6 collapsible `<details>` rows** (32px each collapsed = 192px):
   - ACCESS — entitlements (toggle + text fields)
   - REQUESTS — concierge/Smart Start requests as compact inline rows
   - CONTROL PLANE — orchestration posture, approval triggers, current stack chips
   - RUNS — orchestration run history as compact inline rows
   - APPROVALS — approval rail (already compact, keep `<details>` pattern)
   - AGENTS — agent registry (already compact, keep `<details>` pattern)
3. **Sticky footer** — run count + pending count

**Target: ~250 lines, zero scroll**

---

### Task 1: Metric strip + operator bar

**Files:**
- Modify: `components/AdminConsole.tsx:2709-2712` (replace Panel opening with metric strip)

**Step 1: Replace the opening of renderGovernance**

Remove the `<Panel title="Access and entitlements" ...>` wrapper and replace with a compact operator bar + 4-across metric cards.

```tsx
// Replace lines 2712-2749 (first Panel) and the orchestration metric cards (2849-2878)
// with a single operator bar + metric strip at the top of the section
```

New code for the section opening (after `<SectionShell>`):

```tsx
{/* Operator bar */}
<div className="flex items-center justify-between gap-2 border border-black/10 bg-[#f8faf8] px-2.5 py-1">
  <div className="flex items-center gap-3">
    <span className="admin-mono text-[9px] uppercase tracking-[0.16em] text-brand-teal">Staff Policy</span>
    <span className="admin-body text-[10px] italic text-black/45">Approvals, entitlements, and orchestration governance.</span>
  </div>
  <button type="button" onClick={refreshOrchestrationOverview}
    className="border border-black/15 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-[#09161a] hover:border-brand-teal">
    Refresh
  </button>
</div>

{orchestrationError ? (
  <div className="border border-red-500/20 bg-red-50 px-3 py-1.5 text-xs text-red-700">{orchestrationError}</div>
) : null}

{/* 4-across metric cards */}
<div className="grid grid-cols-4 gap-1">
  {[
    { label: 'Active roles', value: orchestrationOverview?.summary.role_count ?? agents.count, meta: `${agents.approval_required_count} need approval` },
    { label: 'Tracked runs', value: orchestrationOverview?.summary.run_count ?? 0, meta: `${orchestrationOverview?.summary.flagged_runs ?? 0} flagged` },
    { label: 'Avg confidence', value: `${Math.round((orchestrationOverview?.summary.average_confidence ?? 0) * 100)}%`, meta: `${orchestrationOverview?.summary.low_confidence_runs ?? 0} low` },
    { label: 'Pending', value: queue.pending_count + bookings.pending_count, meta: `${queue.pending_count} approvals · ${bookings.pending_count} requests` },
  ].map((card) => (
    <div key={card.label} className="border border-black/10 bg-[#fbfcfa] px-2 py-1">
      <div className="admin-mono text-[8px] uppercase tracking-[0.14em] text-black/40">{card.label}</div>
      <div className="admin-display text-lg leading-none text-[#09161a]">{card.value}</div>
      <div className="admin-body text-[10px] italic text-black/45">{card.meta}</div>
    </div>
  ))}
</div>
```

**Step 2: Verify build**

Run: `npx vite build`
Expected: Build passes

---

### Task 2: ACCESS details row

**Files:**
- Modify: `components/AdminConsole.tsx` (replace Access panel with `<details>` row)

Collapse the 3-field Access panel into a single `<details>` row:

```tsx
<details className="group border border-black/8">
  <summary className="flex h-8 cursor-pointer items-center gap-2 px-2.5 text-left hover:bg-black/[0.015]">
    <span className="text-[9px] text-black/30 transition-transform group-open:rotate-90">&#9656;</span>
    <span className="admin-mono text-[9px] uppercase tracking-[0.14em] text-brand-teal">Access</span>
    <span className="admin-body text-[11px] text-[#09161a]">Entitlements + onboarding</span>
    <span className="ml-auto admin-mono text-[9px] text-black/35">{config.operations.onboarding_email_enabled ? 'ON' : 'OFF'}</span>
  </summary>
  <div className="border-t border-black/8 px-2.5 py-1.5 grid grid-cols-3 gap-2">
    <ToggleField checked={config.operations.onboarding_email_enabled} label="Onboarding email" hint="Post-intake automation."
      onChange={(checked) => setConfig((prev) => prev ? { ...prev, operations: { ...prev.operations, onboarding_email_enabled: checked } } : prev)} />
    <TextField label="Intro course offer" value={config.operations.intro_course_offer}
      onChange={(value) => setConfig((prev) => prev ? { ...prev, operations: { ...prev.operations, intro_course_offer: value } } : prev)} />
    <TextField label="Curriculum code" value={config.operations.curriculum_code}
      onChange={(value) => setConfig((prev) => prev ? { ...prev, operations: { ...prev.operations, curriculum_code: value } } : prev)} />
  </div>
</details>
```

---

### Task 3: REQUESTS details row

**Files:**
- Modify: `components/AdminConsole.tsx` (replace Concierge requests Panel with `<details>` row)

Collapse sprawling request article cards into compact inline rows:

```tsx
<details className="group border border-black/8">
  <summary className="flex h-8 cursor-pointer items-center gap-2 px-2.5 text-left hover:bg-black/[0.015]">
    <span className="text-[9px] text-black/30 transition-transform group-open:rotate-90">&#9656;</span>
    <span className="admin-mono text-[9px] uppercase tracking-[0.14em] text-brand-teal">Requests</span>
    <span className="admin-body text-[11px] text-[#09161a]">Concierge + Smart Start</span>
    <span className="ml-auto admin-mono text-[9px] text-black/35">{bookings.pending_count} new</span>
  </summary>
  <div className="border-t border-black/8 px-2.5 py-1.5 space-y-0.5">
    {bookings.items.length === 0 ? (
      <div className="admin-body text-[10px] italic text-black/40 py-1">No requests yet.</div>
    ) : bookings.items.map((request) => (
      <div key={request.id} className="flex items-center gap-2 border border-black/8 bg-white px-2 py-1">
        <span className="admin-mono text-[10px] text-[#09161a] min-w-0 flex-1 truncate">
          {request.name} · {request.email}{request.company ? ` · ${request.company}` : ''}
        </span>
        <span className="admin-body text-[9px] text-black/40 truncate max-w-[120px]">
          {request.request_kind.replace(/_/g, ' ')}
        </span>
        <span className={`shrink-0 inline-flex border px-1.5 py-0.5 text-[8px] uppercase tracking-[0.12em] ${mediaPipelineTone(request.status)}`}>
          {request.status.replace(/_/g, ' ')}
        </span>
        {(['reviewed', 'scheduled'] as const).map((status) => (
          <button key={status} type="button" onClick={() => updateConciergeRequestStatus(request.id, status)}
            disabled={Boolean(bookingBusyKey)}
            className="admin-mono text-[8px] text-black/40 hover:text-brand-teal hover:underline disabled:opacity-40">
            {status}
          </button>
        ))}
      </div>
    ))}
  </div>
</details>
```

---

### Task 4: CONTROL PLANE details row

**Files:**
- Modify: `components/AdminConsole.tsx` (replace orchestration description + chips with `<details>` row)

Collapse the orchestration posture description, approval triggers, and current stack into one row:

```tsx
<details className="group border border-black/8">
  <summary className="flex h-8 cursor-pointer items-center gap-2 px-2.5 text-left hover:bg-black/[0.015]">
    <span className="text-[9px] text-black/30 transition-transform group-open:rotate-90">&#9656;</span>
    <span className="admin-mono text-[9px] uppercase tracking-[0.14em] text-brand-teal">Control</span>
    <span className="admin-body text-[11px] text-[#09161a]">Orchestration policy</span>
    <span className="ml-auto admin-mono text-[9px] text-black/35">
      {(orchestrationOverview?.policy.current_stack ?? []).length} stack · {(orchestrationOverview?.policy.approval_triggers ?? []).length} triggers
    </span>
  </summary>
  <div className="border-t border-black/8 px-2.5 py-1.5 space-y-1.5">
    <div className="grid grid-cols-2 gap-2">
      <div>
        <div className="admin-mono text-[8px] uppercase tracking-[0.14em] text-black/40 mb-0.5">Approval triggers</div>
        <div className="flex flex-wrap gap-1">
          {(orchestrationOverview?.policy.approval_triggers ?? []).map((t) => (
            <span key={t} className="border border-amber-500/20 bg-amber-50 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-amber-800">{labelize(t)}</span>
          ))}
        </div>
      </div>
      <div>
        <div className="admin-mono text-[8px] uppercase tracking-[0.14em] text-black/40 mb-0.5">Current stack</div>
        <div className="flex flex-wrap gap-1">
          {(orchestrationOverview?.policy.current_stack ?? []).map((s) => (
            <span key={s} className="border border-brand-teal/25 bg-brand-soft px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-brand-teal">{labelize(s)}</span>
          ))}
        </div>
      </div>
    </div>
    <div className="admin-mono text-[8px] text-black/35">
      Free-tier: {(orchestrationOverview?.policy.free_roles ?? []).map(labelize).join(', ') || 'none'}
    </div>
  </div>
</details>
```

---

### Task 5: RUNS details row

**Files:**
- Modify: `components/AdminConsole.tsx` (replace orchestration run articles with compact inline rows)

```tsx
<details className="group border border-black/8">
  <summary className="flex h-8 cursor-pointer items-center gap-2 px-2.5 text-left hover:bg-black/[0.015]">
    <span className="text-[9px] text-black/30 transition-transform group-open:rotate-90">&#9656;</span>
    <span className="admin-mono text-[9px] uppercase tracking-[0.14em] text-brand-teal">Runs</span>
    <span className="admin-body text-[11px] text-[#09161a]">Orchestration history</span>
    <span className="ml-auto admin-mono text-[9px] text-black/35">{orchestrationOverview?.runs.length ?? 0} runs</span>
  </summary>
  <div className="border-t border-black/8 px-2.5 py-1.5 space-y-0.5">
    {(orchestrationOverview?.runs ?? []).length === 0 ? (
      <div className="admin-body text-[10px] italic text-black/40 py-1">No runs recorded yet.</div>
    ) : (orchestrationOverview?.runs ?? []).map((run) => (
      <div key={`${run.client_uid}-${run.run_id}`} className="flex items-center gap-2 border border-black/8 bg-white px-2 py-1">
        <span className="admin-mono text-[10px] text-[#09161a] min-w-0 flex-1 truncate">
          {run.client_name || 'Client'} · {run.started_by_role || 'staff'} · {Math.round((run.confidence || 0) * 100)}%
        </span>
        <span className={`shrink-0 inline-flex border px-1.5 py-0.5 text-[8px] uppercase tracking-[0.12em] ${mediaPipelineTone(run.status)}`}>
          {run.status.replace(/_/g, ' ')}
        </span>
        <span className={`shrink-0 inline-flex border px-1.5 py-0.5 text-[8px] uppercase tracking-[0.12em] ${mediaPipelineTone(run.approval_state)}`}>
          {run.approval_state.replace(/_/g, ' ')}
        </span>
        <button type="button" onClick={() => reviewOrchestrationRun(run.client_uid, run.run_id, 'approved')}
          disabled={bookingBusyKey === `orchestration:${run.client_uid}:${run.run_id}:approved`}
          className="admin-mono text-[8px] text-brand-teal hover:underline disabled:opacity-40">approve</button>
        <button type="button" onClick={() => reviewOrchestrationRun(run.client_uid, run.run_id, 'request_human_followup')}
          disabled={bookingBusyKey === `orchestration:${run.client_uid}:${run.run_id}:request_human_followup`}
          className="admin-mono text-[8px] text-black/40 hover:underline disabled:opacity-40">follow-up</button>
      </div>
    ))}
  </div>
</details>
```

---

### Task 6: Keep APPROVALS + AGENTS rows (already compact)

The approval rail (lines 3018-3062) and agent registry (lines 3064-3105) already use `<details>` rows. Only changes needed:

1. Remove the `<Panel>` wrappers
2. Wrap each in a single outer `<details>` to match the accordion pattern
3. Keep the inner `<details>` rows as-is

---

### Task 7: Sticky footer + wrap-up

Add sticky footer matching Media section pattern:

```tsx
<div className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-black/15 bg-[#f4f1eb] px-3 py-1.5 -mx-2 -mb-2">
  <span className="admin-mono text-[10px] text-black/50">
    Governance · {agents.count} agents · {queue.pending_count} pending · {orchestrationOverview?.summary.run_count ?? 0} runs
  </span>
</div>
```

**Step: Verify build**

Run: `npx vite build`
Expected: Build passes

**Step: Commit**

```bash
git add components/AdminConsole.tsx
git commit -m "Governance section overhaul: accordion rows, metric strip, compact inline data"
```

---

## Execution Summary

| # | Row | Lines before | Lines after (est) |
|---|-----|-------------|-------------------|
| 1 | Metric strip | 30 (metric cards) | 20 |
| 2 | ACCESS | 35 | 15 |
| 3 | REQUESTS | 65 | 20 |
| 4 | CONTROL PLANE | 90 | 25 |
| 5 | RUNS | 100 | 20 |
| 6 | APPROVALS | 45 | 40 (mostly unchanged) |
| 7 | AGENTS | 40 | 35 (mostly unchanged) |
| - | Footer | 0 | 5 |
| **Total** | | **~400** | **~180** |

Net savings: ~220 lines, zero scroll.
