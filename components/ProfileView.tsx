import React from 'react';
import { CompensationPosture, DnaEvidenceNote, DnaFinding, DnaMarker, ProfileContent } from '../types';
import {
  buildProfileTelemetry,
  DnaCommandBar,
  DnaCompensationLadderPanel,
  DnaDemandAnalysisPanel,
  DnaEvidenceNodeGrid,
  DnaMarketSignalPanel,
  DnaTickerBar,
  EditorialList,
  hasItems,
} from './professionalDnaUi';

const SECTION_LABELS: Record<string, string> = {
  case_summary: 'Case Summary',
  genome_markers: 'Genome Markers',
  behavioral_propensities: 'Behavioral Propensities',
  pressure_response: 'Pressure Response',
  environmental_fit: 'Environmental Fit',
  market_climate: 'Market Climate',
  compensation_position: 'Market Value',
  extinction_risks: 'Extinction Risks',
  adaptive_assets: 'Adaptive Assets',
  lean_into: 'Lean Into',
  let_go: 'Let Go',
  build_next: 'Build Next',
  evolution_path_90_days: '90-Day Evolution Path',
};

const SCORE_TONE: Record<string, string> = {
  emerging: 'border-amber-500/25 bg-amber-50 text-amber-900',
  viable: 'border-sky-500/20 bg-sky-50 text-sky-900',
  strong: 'border-[#2d7b6a]/25 bg-[#eef9f5] text-[#17443f]',
  distinguished: 'border-emerald-500/20 bg-emerald-50 text-emerald-900',
};

const renderBullets = (items: string[] = [], accent: 'teal' | 'amber' | 'red' | 'ink' = 'teal') => (
  <EditorialList items={items} accent={accent} />
);

const SectionFrame = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
  <section className="space-y-2 border border-black/10 bg-white p-3 shadow-[0_18px_50px_-44px_rgba(40,33,30,0.35)]">
    <div className="flex items-end justify-between gap-3 flex-wrap">
      <div>
        <div className="text-[9px] uppercase tracking-[0.24em] text-black/40 font-data">{subtitle}</div>
        <div className="mt-1 text-base text-[#09161a] font-editorial">{title}</div>
      </div>
    </div>
    {children}
  </section>
);

const FindingList = ({ items }: { items: DnaFinding[] }) => (
  <div className="grid gap-1.5">
    {items.map((item, index) => (
      <div key={`${item.label}-${index}`} className="border border-black/10 bg-[#FBF8F2] p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm text-[#09161a] font-editorial">{item.label}</div>
          <div className="border border-black/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-black/45 font-data">
            {item.evidence}
          </div>
        </div>
        <div className="mt-1.5 text-xs leading-5 text-black/74 font-body">{item.finding}</div>
        <div className="mt-1.5 border-t border-black/10 pt-1.5 text-[9px] uppercase tracking-[0.2em] text-black/40 font-data">
          Implication
        </div>
        <div className="mt-1 text-xs leading-5 text-black/68 font-body">{item.implication}</div>
      </div>
    ))}
  </div>
);

const MarkerGrid = ({ markers }: { markers: DnaMarker[] }) => (
  <div className="grid gap-1.5 md:grid-cols-2 xl:grid-cols-4">
    {markers.map((marker) => (
      <div key={marker.id} className="border border-black/10 bg-[#FBF8F2] p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[9px] uppercase tracking-[0.2em] text-black/45 font-data">{marker.label}</div>
          <div className={`border px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] ${SCORE_TONE[marker.band] || SCORE_TONE.viable}`}>
            {marker.band}
          </div>
        </div>
        <div className="mt-2 flex items-end gap-1.5">
          <div className="text-2xl leading-none text-[#09161a] font-data">{marker.score}</div>
          <div className="pb-0.5 text-[9px] uppercase tracking-[0.18em] text-black/35 font-data">/ 100</div>
        </div>
        <div className="mt-2 text-xs leading-5 text-black/74 font-body">{marker.interpretation}</div>
        <div className="mt-2 text-[9px] uppercase tracking-[0.18em] text-[#0f5d53] font-data">{marker.evidence}</div>
      </div>
    ))}
  </div>
);

const CompensationCard = ({ value }: { value: CompensationPosture }) => (
  <div className="grid gap-1.5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
    <div className="border border-[#28211E]/12 bg-[#28211E] p-3 text-[#f7f1e8] shadow-[0_26px_70px_-52px_rgba(40,33,30,0.85)]">
      <div className="text-[9px] uppercase tracking-[0.24em] text-[#8DD9BF] font-data">Market Value</div>
      <div className="mt-2 text-xl leading-tight text-white font-editorial">{value.market_value_range}</div>
      <div className="mt-3 text-[9px] uppercase tracking-[0.2em] text-[#8DD9BF] font-data">Target Ask</div>
      <div className="mt-1 text-base text-white font-editorial">{value.target_ask}</div>
    </div>
    <div className="grid gap-1.5 md:grid-cols-2">
      <div className="border border-black/10 bg-[#FBF8F2] p-3">
        <div className="text-[9px] uppercase tracking-[0.2em] text-black/45 font-data">Ask Justification Receipt</div>
        <div className="mt-2">{renderBullets(value.ask_justification_receipt || [])}</div>
      </div>
      <div className="border border-black/10 bg-[#FBF8F2] p-3">
        <div className="text-[9px] uppercase tracking-[0.2em] text-black/45 font-data">Negotiation Strategy</div>
        <div className="mt-2">{renderBullets(value.negotiation_strategy || [], 'amber')}</div>
      </div>
      <div className="border border-black/10 bg-[#FBF8F2] p-3">
        <div className="text-[9px] uppercase tracking-[0.2em] text-black/45 font-data">High-Pay Habitats</div>
        <div className="mt-2">{renderBullets(value.high_pay_habitats || [])}</div>
      </div>
      <div className="border border-black/10 bg-[#FBF8F2] p-3">
        <div className="text-[9px] uppercase tracking-[0.2em] text-black/45 font-data">Underpay Risk</div>
        <div className="mt-2">{renderBullets(value.underpay_risk_habitats || [], 'red')}</div>
      </div>
    </div>
  </div>
);

const EvidenceNotes = ({ notes }: { notes: DnaEvidenceNote[] }) => (
  <div className="grid gap-1.5 lg:grid-cols-3">
    {notes.map((note, index) => (
      <div key={`${note.source_label}-${index}`} className="border border-black/10 bg-[#FBF8F2] p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[9px] uppercase tracking-[0.18em] text-[#0f5d53] font-data">{note.class}</div>
          {note.confidence ? (
            <div className="text-[9px] uppercase tracking-[0.16em] text-black/40 font-data">{note.confidence}</div>
          ) : null}
        </div>
        <div className="mt-1.5 text-sm leading-5 text-[#09161a] font-editorial">{note.source_label}</div>
        <div className="mt-1.5 text-xs leading-5 text-black/72 font-body">{note.note}</div>
      </div>
    ))}
  </div>
);

export function ProfileView(props: { profile: ProfileContent }) {
  const { profile } = props;
  const telemetry = buildProfileTelemetry(profile);
  const sectionOrder =
    Array.isArray(profile.section_order) && profile.section_order.length
      ? profile.section_order
      : [
          'case_summary',
          'genome_markers',
          'behavioral_propensities',
          'pressure_response',
          'environmental_fit',
          'market_climate',
          'compensation_position',
          'extinction_risks',
          'adaptive_assets',
          'lean_into',
          'let_go',
          'build_next',
          'evolution_path_90_days',
        ];

  const sections: Record<string, React.ReactNode | null> = {
    case_summary: profile.case_summary ? (
      <div className="grid gap-1.5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="border border-black/10 bg-[#FBF8F2] p-3">
          <div className="text-[9px] uppercase tracking-[0.2em] text-black/45 font-data">Operating Context</div>
          <div className="mt-2 text-xs leading-5 text-black/72 font-body">
            <div><span className="font-medium text-[#09161a]">Current:</span> {profile.case_summary.current_identity}</div>
            <div className="mt-1"><span className="font-medium text-[#09161a]">Target:</span> {profile.case_summary.target_identity}</div>
          </div>
        </div>
        <div className="border border-black/10 bg-white p-3">
          <div className="text-[9px] uppercase tracking-[0.2em] text-black/45 font-data">Report Thesis</div>
          <div className="mt-2 text-base leading-tight text-[#09161a] font-editorial">{profile.case_summary.report_thesis}</div>
          {hasItems(profile.case_summary.constraints) ? (
            <>
              <div className="mt-2 text-[9px] uppercase tracking-[0.16em] text-black/40 font-data">Constraints</div>
              <div className="mt-1.5">{renderBullets(profile.case_summary.constraints, 'amber')}</div>
            </>
          ) : null}
        </div>
      </div>
    ) : null,
    genome_markers:
      Array.isArray(profile.genome_markers) && profile.genome_markers.length ? <MarkerGrid markers={profile.genome_markers} /> : null,
    behavioral_propensities:
      Array.isArray(profile.behavioral_propensities) && profile.behavioral_propensities.length ? <FindingList items={profile.behavioral_propensities} /> : null,
    pressure_response:
      Array.isArray(profile.pressure_response) && profile.pressure_response.length ? <FindingList items={profile.pressure_response} /> : null,
    environmental_fit: profile.environmental_fit ? (
      <div className="grid gap-1.5 md:grid-cols-2">
        <div className="border border-black/10 bg-[#FBF8F2] p-3">
          <div className="text-[9px] uppercase tracking-[0.2em] text-black/45 font-data">Advantaged In</div>
          <div className="mt-2">{renderBullets(profile.environmental_fit.advantaged_in)}</div>
        </div>
        <div className="border border-black/10 bg-[#FBF8F2] p-3">
          <div className="text-[9px] uppercase tracking-[0.2em] text-black/45 font-data">Punished In</div>
          <div className="mt-2">{renderBullets(profile.environmental_fit.punished_in, 'red')}</div>
        </div>
        <div className="border border-black/10 bg-[#FBF8F2] p-3">
          <div className="text-[9px] uppercase tracking-[0.2em] text-black/45 font-data">Adjacency Paths</div>
          <div className="mt-2">{renderBullets(profile.environmental_fit.adjacency_paths, 'amber')}</div>
        </div>
        <div className="border border-black/10 bg-[#FBF8F2] p-3">
          <div className="text-[9px] uppercase tracking-[0.2em] text-black/45 font-data">Recommended Habitat</div>
          <div className="mt-2">{renderBullets(profile.environmental_fit.recommended_habitat)}</div>
        </div>
      </div>
    ) : null,
    market_climate: profile.market_climate ? (
      <div className="grid gap-1.5">
        <div className="border border-black/10 bg-white p-3">
          <div className="text-[9px] uppercase tracking-[0.2em] text-black/45 font-data">Climate Summary</div>
          <div className="mt-2 text-base leading-tight text-[#09161a] font-editorial">{profile.market_climate.summary}</div>
        </div>
        <div className="grid gap-1.5 md:grid-cols-2 xl:grid-cols-4">
          <div className="border border-black/10 bg-[#FBF8F2] p-3">
            <div className="text-[9px] uppercase tracking-[0.2em] text-black/45 font-data">National</div>
            <div className="mt-2">{renderBullets(profile.market_climate.national_signals)}</div>
          </div>
          <div className="border border-black/10 bg-[#FBF8F2] p-3">
            <div className="text-[9px] uppercase tracking-[0.2em] text-black/45 font-data">Occupation</div>
            <div className="mt-2">{renderBullets(profile.market_climate.occupation_signals, 'amber')}</div>
          </div>
          <div className="border border-black/10 bg-[#FBF8F2] p-3">
            <div className="text-[9px] uppercase tracking-[0.2em] text-black/45 font-data">Geography</div>
            <div className="mt-2">{renderBullets(profile.market_climate.geography_signals)}</div>
          </div>
          <div className="border border-black/10 bg-[#FBF8F2] p-3">
            <div className="text-[9px] uppercase tracking-[0.2em] text-black/45 font-data">Company Posture</div>
            <div className="mt-2">
              {hasItems(profile.market_climate.company_posture_notes) ? renderBullets(profile.market_climate.company_posture_notes, 'red') : (
                <div className="text-xs leading-5 text-black/55 font-body">Company posture notes are disabled for this report.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    ) : null,
    compensation_position: profile.compensation_position ? <CompensationCard value={profile.compensation_position} /> : null,
    extinction_risks: hasItems(profile.extinction_risks) ? (
      <div className="border border-red-500/15 bg-red-50/70 p-3">{renderBullets(profile.extinction_risks, 'red')}</div>
    ) : null,
    adaptive_assets: hasItems(profile.adaptive_assets) ? (
      <div className="border border-emerald-500/15 bg-emerald-50/70 p-3">{renderBullets(profile.adaptive_assets)}</div>
    ) : null,
    lean_into: hasItems(profile.lean_into) ? (
      <div className="border border-black/10 bg-[#FBF8F2] p-3">{renderBullets(profile.lean_into)}</div>
    ) : null,
    let_go: hasItems(profile.let_go) ? (
      <div className="border border-black/10 bg-[#FBF8F2] p-3">{renderBullets(profile.let_go, 'red')}</div>
    ) : null,
    build_next: hasItems(profile.build_next) ? (
      <div className="border border-black/10 bg-[#FBF8F2] p-3">{renderBullets(profile.build_next, 'amber')}</div>
    ) : null,
    evolution_path_90_days: hasItems(profile.evolution_path_90_days) ? (
      <div className="border border-black/10 bg-[#FBF8F2] p-3">{renderBullets(profile.evolution_path_90_days, 'ink')}</div>
    ) : null,
  };

  return (
    <div className="space-y-3">
      <DnaCommandBar items={telemetry.signalStrip} />

      <section className="overflow-hidden border border-[#28211E]/12 bg-[#28211E] text-[#f7f1e8] shadow-[0_26px_70px_-52px_rgba(40,33,30,0.85)]">
        <div className="grid gap-3 px-4 py-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
          <div>
            <div className="text-[9px] uppercase tracking-[0.28em] text-[#8DD9BF] font-data">Adaptive Career Research Dossier</div>
            <h2 className="mt-2 max-w-4xl text-2xl leading-[0.96] text-white md:text-3xl font-editorial">
              Bloomberg terminal discipline, McKinsey report posture, career-market reality.
            </h2>
            <div className="mt-3 max-w-3xl text-sm leading-6 text-white/72 font-body">
              {profile.thesis || 'This dossier maps your professional DNA against the world you want to operate in, the environments that reward or punish it, and the receipt required for a stronger ask.'}
            </div>
          </div>

          <div className="border border-white/10 bg-white/[0.04] p-3">
            <div className="text-[9px] uppercase tracking-[0.26em] text-[#8DD9BF] font-data">Target Environment</div>
            <div className="mt-2 text-lg leading-tight text-white font-editorial">
              {profile.target_environment || 'Target environment pending calibration.'}
            </div>
            <div className="mt-3 border-t border-white/10 pt-3 text-xs leading-5 text-white/68 font-body">
              {profile.case_summary?.report_thesis || 'This report is not a personality test. It is a market-facing adaptation brief backed by observed, inferred, and external signals.'}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.06fr)_minmax(300px,0.94fr)]">
        <DnaMarketSignalPanel signal={telemetry.marketSignal} />
        <DnaCompensationLadderPanel
          ladder={telemetry.compensationLadder}
          receipt={profile.compensation_position?.ask_justification_receipt || profile.leverage || []}
        />
      </div>

      <DnaDemandAnalysisPanel
        summary={telemetry.marketDemandAnalysis.summary}
        environments={telemetry.marketDemandAnalysis.environments}
      />

      {Array.isArray(telemetry.evidenceNodes) && telemetry.evidenceNodes.length > 0 ? (
        <SectionFrame title="Evidence Nodes" subtitle="Appendix">
          <DnaEvidenceNodeGrid nodes={telemetry.evidenceNodes} />
        </SectionFrame>
      ) : null}

      {sectionOrder.map((sectionId) => {
        const content = sections[sectionId];
        if (!content) return null;
        return (
          <SectionFrame key={sectionId} title={SECTION_LABELS[sectionId] || sectionId} subtitle={sectionId.replace(/_/g, ' ')}>
            {content}
          </SectionFrame>
        );
      })}

      {Array.isArray(profile.evidence_notes) && profile.evidence_notes.length > 0 ? (
        <SectionFrame title="Evidence Notes" subtitle="Appendix">
          <EvidenceNotes notes={profile.evidence_notes} />
        </SectionFrame>
      ) : null}

      <DnaTickerBar ticker={telemetry.reportTicker} />
    </div>
  );
}
