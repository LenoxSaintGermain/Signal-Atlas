import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Signal, Role, Industry, GeneratedScenario } from '../types';
import { SIGNALS } from '../constants';

const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.API_KEY ||
  (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_GEMINI_API_KEY : undefined) ||
  (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_API_KEY : undefined);

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    scenario_title: { type: Type.STRING, description: "A punchy, editorial title for the scenario (max 8 words)" },
    scenario: { type: Type.STRING, description: "The scenario narrative (90-160 words). Present tense. Specific. Concrete. Business focus." },
    why_it_matters: { type: Type.STRING, description: "Strategic interpretation (60-120 words). Calm, outcome-linked." },
    outcome_anchors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          metric: { type: Type.STRING, description: "e.g., EBITDA, OPEX, Cycle Time" },
          direction: { type: Type.STRING, enum: ["up", "down"] },
          note: { type: Type.STRING, description: "Short context (max 12 words)" }
        },
        required: ["metric", "direction", "note"]
      }
    },
    hidden_failure_mode: { type: Type.STRING, description: "A risk if this signal is ignored (max 24 words)" },
    compounds_with: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 1 or 2 other Signal Titles that relate to this one."
    }
  },
  required: ["scenario_title", "scenario", "why_it_matters", "outcome_anchors", "hidden_failure_mode", "compounds_with"]
};

export const generateSignalScenario = async (
  signal: Signal,
  role: Role,
  industry: Industry
): Promise<GeneratedScenario> => {
  const allSignalTitles = SIGNALS.map(s => s.title).join(", ");

  const prompt = `
    Context: You are the strategic engine for 'Third Signal', a high-status consultancy.
    Task: Generate a business scenario for the signal "${signal.title}".
    Signal Truth: "${signal.truth}"
    Target Audience: ${role} in the ${industry} industry.
    
    Guidelines:
    - Tone: Swiss editorial, cinematic, restrained, high-status. No sales hype. No buzzwords.
    - Focus: Leverage, outcomes, and failure modes.
    - Constraints: 
      - "compounds_with" must strictly be chosen from this list: [${allSignalTitles}].
      - Do not include the current signal in "compounds_with".
      - Scenario should feel real, not generic. Use specific terminology relevant to ${industry}.
  `;

  const sanitizeScenario = (raw: GeneratedScenario): GeneratedScenario => {
    const compounds = (raw.compounds_with || []).filter(title => title && title !== signal.title);
    return {
      ...raw,
      compounds_with: compounds.slice(0, 2)
    };
  };

  const generateViaGemini = async (): Promise<GeneratedScenario> => {
    if (!ai) throw new Error("Missing GEMINI_API_KEY");

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        systemInstruction: "You are a senior strategist who sells outcomes, not technology. You are precise, contrarian, and calm.",
        temperature: 0.7,
      },
    });

    const text =
      // New SDK shape
      (response as any)?.response?.text?.() ??
      // Older helper
      (response as any)?.text ??
      null;

    if (!text || typeof text !== 'string') {
      throw new Error("No response text from Gemini");
    }

    return sanitizeScenario(JSON.parse(text) as GeneratedScenario);
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
    return await generateViaGemini();
  } catch (error) {
    console.error("Error generating scenario, falling back to mock:", error);
    return generateMockScenario();
  }
};
