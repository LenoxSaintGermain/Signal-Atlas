import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Signal, Role, Industry, GeneratedScenario } from '../types';
import { SIGNALS } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

  try {
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

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as GeneratedScenario;
  } catch (error) {
    console.error("Error generating scenario:", error);
    // Fallback or re-throw depending on app needs. 
    // For this app, we'll rethrow so the UI can show an error state.
    throw error;
  }
};
