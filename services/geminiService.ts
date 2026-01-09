import { Signal, Role, Industry, GeneratedScenario } from '../types';
import { SIGNALS } from '../constants';

export const generateSignalScenario = async (
  signal: Signal,
  role: Role,
  industry: Industry
): Promise<GeneratedScenario> => {
  const sanitizeScenario = (raw: GeneratedScenario): GeneratedScenario => {
    const compounds = (raw.compounds_with || []).filter(title => title && title !== signal.title);
    return {
      ...raw,
      compounds_with: compounds.slice(0, 2)
    };
  };

  const generateViaBackend = async (): Promise<GeneratedScenario> => {
    const res = await fetch('/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        signal_id: signal.id,
        signal_title: signal.title,
        truth: signal.truth,
        role,
        industry,
        all_signals: SIGNALS.map(s => s.title),
      })
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Backend generation failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as GeneratedScenario;
    return sanitizeScenario(data);
  };

  const generateMockScenario = (): GeneratedScenario => {
    return sanitizeScenario({
      scenario_title: `${signal.title} under pressure (${industry})`,
      scenario: `A ${role.toLowerCase()} in ${industry} discovers that ignoring ${signal.title.toLowerCase()} lets a small inefficiency cascade into a systemic failure. Data freshness slips, frontline teams route around the system, and executive reports disagree by 8%.`,
      why_it_matters: `The organization is now making decisions on divergent realities. Fixing ${signal.title.toLowerCase()} restores a single source of truth and stops rework cycles.`,
      outcome_anchors: [
        { metric: "Cycle Time", direction: "down", note: "fewer manual reconciliations" },
        { metric: "OPEX", direction: "down", note: "reduced shadow processes" },
        { metric: "Trust Surface", direction: "up", note: "auditable decisions" }
      ],
      hidden_failure_mode: "Teams silently fork workflows; recovery costs spike later.",
      compounds_with: ["CONTEXT DECAY", "FAILURE VISIBILITY"]
    });
  };

  try {
    return await generateViaBackend();
  } catch (error) {
    console.error("Error generating scenario via backend, falling back to mock:", error);
    return generateMockScenario();
  }
};
