/**
 * DELIVERABLE E: Backend Code (Cloud Run / Node.js)
 * 
 * To run locally:
 * 1. npm init -y
 * 2. npm install express cors dotenv @google/genai
 * 3. node app.js
 */

const express = require('express');
const cors = require('cors');
const { GoogleGenAI, Type } = require("@google/genai");
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

// Initialize Gemini
// NOTE: Ensure GEMINI_API_KEY is set in Cloud Run environment variables
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });

app.use(express.json());

// Allow requests from Framer (configure exact domain in production)
app.use(cors({ origin: '*' })); 

// Health Check
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Validation Helper
const isValidRole = (r) => ['Exec', 'Operator', 'Product'].includes(r);
const isValidIndustry = (i) => ['Auto', 'Logistics', 'Retail', 'Manufacturing', 'Finance', 'Healthcare', 'SaaS'].includes(i);

// Generator Endpoint
app.post('/generate', async (req, res) => {
  const { signal_id, signal_title, truth, role, industry, all_signals } = req.body;

  // 1. Validation
  if (!signal_title || !truth || !role || !industry) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (!isValidRole(role) || !isValidIndustry(industry)) {
    return res.status(400).json({ error: "Invalid role or industry" });
  }

  // 2. Logging
  console.log(`[REQ] Generate for ${signal_title} (${role}/${industry})`);

  // 3. Schema Definition
  const responseSchema = {
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

  const compoundList = all_signals ? all_signals.join(", ") : "provided signals";

  const prompt = `
    Context: You are the strategic engine for 'Third Signal', a high-status consultancy.
    Task: Generate a business scenario for the signal "${signal_title}".
    Signal Truth: "${truth}"
    Target Audience: ${role} in the ${industry} industry.
    
    Guidelines:
    - Tone: Swiss editorial, cinematic, restrained, high-status. No sales hype. No buzzwords.
    - Focus: Leverage, outcomes, and failure modes.
    - Constraints: 
      - "compounds_with" must strictly be chosen from this list: [${compoundList}].
      - Do not include the current signal in "compounds_with".
      - Scenario should feel real, not generic. Use specific terminology relevant to ${industry}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "You are a senior strategist who sells outcomes, not technology. You are precise, contrarian, and calm.",
        temperature: 0.7,
      },
    });

    const data = JSON.parse(response.text);
    res.json(data);

  } catch (error) {
    console.error("[ERR] Gemini API Error:", error);
    res.status(500).json({ error: "Failed to generate intelligence" });
  }
});

app.listen(port, () => {
  console.log(`Signal Atlas backend listening on port ${port}`);
});
