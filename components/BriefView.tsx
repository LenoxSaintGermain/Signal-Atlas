import React from 'react';
import { BriefContent } from '../types';
import {
  buildBriefTelemetry,
  DnaCommandBar,
  DnaCompensationLadderPanel,
  DnaMarketSignalPanel,
  DnaTickerBar,
  DnaWarRoom,
  EditorialList,
  hasItems,
} from './professionalDnaUi';

const numbered = (value: number) => String(value + 1).padStart(2, '0');

export function BriefView(props: {
  brief: BriefContent;
  onOpenPlan: () => void;
}) {
  const { brief } = props;
  const summary = hasItems(brief.executive_summary) ? brief.executive_summary : brief.learned;
  const receipt = hasItems(brief.market_receipt) ? brief.market_receipt : brief.needle;
  const observed = hasItems(brief.evidence_ledger?.observed) ? brief.evidence_ledger?.observed : [];
  const inferred = hasItems(brief.evidence_ledger?.inferred) ? brief.evidence_ledger?.inferred : [];
  const external = hasItems(brief.evidence_ledger?.external) ? brief.evidence_ledger?.external : [];
  const telemetry = buildBriefTelemetry(brief);
  const hasEvidenceLedger = observed.length > 0 || inferred.length > 0 || external.length > 0;
  const evidenceNodeCount = observed.length + inferred.length + external.length;
  const intakeSignalCount = observed.length;
  const marketSourceCount = inferred.length + external.length;

  return (
    <div className="space-y-8 md:space-y-10">
      <DnaCommandBar items={telemetry.signalStrip} />

      <section className="overflow-hidden border border-[#28211E]/12 bg-[#28211E] text-[#f7f1e8] shadow-[0_26px_70px_-52px_rgba(40,33,30,0.85)]">
        <div className="grid gap-8 px-6 py-7 md:px-8 md:py-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <div>
            <div className="text-[10px] uppercase tracking-[0.32em] text-[#8DD9BF] font-data">Professional DNA // Executive Abstract</div>
            <h2 className="mt-4 max-w-4xl text-5xl leading-[0.94] text-white md:text-6xl font-editorial">
              The market should know your numbers before it meets your story.
            </h2>
            <div className="mt-6 max-w-3xl text-base leading-8 text-white/72 font-body">
              {brief.thesis || 'This brief compresses the adaptation case: where your market position is strong, where signal is leaking, and what needs to change before the ask becomes more credible.'}
            </div>
            <div className="mt-5 flex flex-wrap gap-4 font-data text-[9px] uppercase tracking-[0.12em] text-white/46">
              <span>{evidenceNodeCount} evidence nodes</span>
              <span>·</span>
              <span>{intakeSignalCount} intake signals</span>
              <span>·</span>
              <span>{marketSourceCount} market sources</span>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                ['Primary Opportunity', brief.primary_opportunity || 'Convert experience into decision-grade proof.'],
                ['Primary Risk', brief.primary_risk || 'Broad ambition without evidence will read as narrative inflation.'],
                ['Recommended Habitat', brief.recommended_habitat || 'Environments that reward visible ownership and translation leverage.'],
              ].map(([label, value]) => (
                <div key={label} className="border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-white/45 font-data">{label}</div>
                  <div className="mt-3 text-lg leading-7 text-white font-editorial">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-white/10 bg-white/[0.04] p-5 md:p-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#8DD9BF] font-data">Abstract Verdict</div>
            <div className="mt-4 text-3xl leading-tight text-white font-editorial">
              {brief.adaptation_verdict || 'Viable with adaptation pressure.'}
            </div>
            <div className="mt-5 border-t border-white/10 pt-5 text-sm leading-7 text-white/68 font-body">
              {brief.compensation_posture || 'Ask from proof, not aspiration. The market pays for visible scope, receipts, and the right habitat.'}
            </div>
            <div className="mt-6 grid gap-3">
              {telemetry.compensationLadder.map((rung, index) => (
                <div key={rung.id} className="flex items-center justify-between border border-white/8 bg-[#332b28] px-4 py-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.22em] text-white/42 font-data">
                      {numbered(index)} {rung.label}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-white/65 font-body">{rung.detail}</div>
                  </div>
                  <div className="text-2xl tracking-tight text-white font-data">{rung.grade}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
        <DnaMarketSignalPanel signal={telemetry.marketSignal} />
        <DnaCompensationLadderPanel ladder={telemetry.compensationLadder} receipt={receipt} />
      </div>

      <div className={hasEvidenceLedger ? 'grid gap-6 xl:grid-cols-[minmax(0,0.96fr)_minmax(320px,0.82fr)]' : 'space-y-6'}>
        <section className="border border-black/10 bg-white p-6 shadow-[0_18px_50px_-44px_rgba(40,33,30,0.35)] md:p-8">
          <div className="text-[10px] uppercase tracking-[0.3em] text-black/42 font-data">Executive Summary</div>
          <div className="mt-5">
            <EditorialList items={summary} accent="ink" />
          </div>
        </section>

        {hasEvidenceLedger && (
          <section className="border border-black/10 bg-[#FBF8F2] p-6 shadow-[0_18px_50px_-44px_rgba(40,33,30,0.35)] md:p-8">
            <div className="text-[10px] uppercase tracking-[0.3em] text-black/42 font-data">Evidence Ledger</div>
            <div className="mt-5 grid gap-4">
              {[
                { label: 'Observed', items: observed, accent: 'teal' as const },
                { label: 'Inferred', items: inferred, accent: 'amber' as const },
                { label: 'External', items: external, accent: 'red' as const },
              ]
                .filter((group) => group.items.length)
                .map((group) => (
                  <div key={group.label} className="border border-black/10 bg-white p-4">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-black/42 font-data">{group.label}</div>
                    <div className="mt-3">
                      <EditorialList items={group.items} accent={group.accent} />
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}
      </div>

      <DnaWarRoom tasks={telemetry.warRoom} />

      <section className="grid gap-4 border border-black/10 bg-white px-6 py-5 shadow-[0_18px_50px_-44px_rgba(40,33,30,0.35)] md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="max-w-2xl">
          <div className="text-[10px] uppercase tracking-[0.3em] text-black/42 font-data">Execution Link</div>
          <div className="mt-2 text-xl text-[#09161a] font-editorial">Turn the brief into a controlled plan.</div>
        </div>
        <button
          onClick={props.onOpenPlan}
          className="justify-self-start border border-[#28211E] bg-[#28211E] px-6 py-3 text-[10px] uppercase tracking-[0.28em] text-white transition-transform duration-200 hover:-translate-y-0.5 md:justify-self-end"
        >
          Open Your Plan
        </button>
      </section>

      <DnaTickerBar ticker={telemetry.reportTicker} />
    </div>
  );
}
