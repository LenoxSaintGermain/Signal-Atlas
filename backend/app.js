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
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { GoogleGenAI, Type } = require("@google/genai");
const { Firestore, Timestamp } = require('@google-cloud/firestore');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

// Initialize Gemini
// NOTE: Ensure GEMINI_API_KEY is set in Cloud Run environment variables
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });

// Firestore (uses Cloud Run default service account / ADC)
const firestore = new Firestore({
  ignoreUndefinedProperties: true,
});
const CACHE_COLLECTION = 'cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

app.use(express.json());

// Security headers
app.use(helmet({ crossOriginResourcePolicy: false }));

// Trust proxy for real IP (Cloud Run)
app.set('trust proxy', 1);

// CORS: lock to allowed origins (comma-separated). In development, allow all.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || process.env.NODE_ENV === 'development' || allowedOrigins.length === 0) {
      return callback(null, true);
    }
    return allowedOrigins.includes(origin) ? callback(null, true) : callback(new Error('CORS blocked'), false);
  }
}));

// Rate limiting: 20 requests/hour per IP
app.use(rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: "You're exploring fast! Take a breath and try again in a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
}));

// Health Check
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Validation Helper
const isValidRole = (r) => ['Exec', 'Operator', 'Product'].includes(r);
const isValidIndustry = (i) => ['Auto', 'Logistics', 'Retail', 'Manufacturing', 'Finance', 'Healthcare', 'SaaS', 'Energy'].includes(i);

// Sanitizer
const sanitize = (val) => typeof val === 'string' ? val.replace(/<script.*?>.*?<\\/script>/gi, '').trim() : val;

const cacheKey = (signalId, role, industry) =>
  `${(signalId || 'unknown').toLowerCase()}|${role.toLowerCase()}|${industry.toLowerCase()}`;

const getCachedScenario = async (key) => {
  const docRef = firestore.collection(CACHE_COLLECTION).doc(`scenario_${key}`);
  const snap = await docRef.get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (!data || !data.payload || !data.created_at) return null;
  const ageMs = Date.now() - data.created_at.toMillis();
  if (ageMs > CACHE_TTL_MS) return null;
  return data.payload;
};

const setCachedScenario = async (key, payload) => {
  const docRef = firestore.collection(CACHE_COLLECTION).doc(`scenario_${key}`);
  await docRef.set({
    payload,
    created_at: Timestamp.now(),
  }, { merge: true });
};

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
  const requestStart = Date.now();
  console.log(`[REQ] Generate for ${signal_title} (${role}/${industry})`);

  const key = cacheKey(signal_id || signal_title || truth, role, industry);

  // 2.5 Cache lookup
  try {
    const cached = await getCachedScenario(key);
    if (cached) {
      console.log(`[CACHE] hit for ${key}`);
      return res.json({ ...cached, _meta: { cached: true, age_ms: Date.now() - requestStart } });
    }
  } catch (err) {
    console.warn('[CACHE] lookup failed', err);
  }

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
    const sanitized = {
      scenario_title: sanitize(data.scenario_title),
      scenario: sanitize(data.scenario),
      why_it_matters: sanitize(data.why_it_matters),
      outcome_anchors: Array.isArray(data.outcome_anchors) ? data.outcome_anchors.map(a => ({
        metric: sanitize(a.metric),
        direction: a.direction,
        note: sanitize(a.note),
      })) : [],
      hidden_failure_mode: sanitize(data.hidden_failure_mode),
      compounds_with: Array.isArray(data.compounds_with) ? data.compounds_with.map(sanitize) : [],
    };

    // Save to cache (fire-and-forget)
    setCachedScenario(key, sanitized).catch(err => console.warn('[CACHE] set failed', err));

    console.log(`[OK] ${signal_title} latency=${Date.now() - requestStart}ms`);
    res.json({ ...sanitized, _meta: { cached: false, latency_ms: Date.now() - requestStart } });
    res.json(data);

  } catch (error) {
    console.error("[ERR] Gemini API Error:", error);
    // Try cached fallback
    try {
      const cached = await getCachedScenario(key);
      if (cached) {
        console.warn('[DEGRADE] returning cached due to generation failure');
        return res.status(200).json({ ...cached, _meta: { degraded: true, reason: 'generation_error_cached' } });
      }
    } catch (cacheErr) {
      console.warn('[CACHE] fallback lookup failed', cacheErr);
    }

    // Graceful degradation by error type
    const code = error?.code || error?.response?.status;
    if (code === 'RESOURCE_EXHAUSTED' || code === 429) {
      return res.status(429).json({ error: "Quota exhausted. Please retry shortly.", _meta: { degraded: true, reason: 'quota' } });
    }
    if (code === 'DEADLINE_EXCEEDED' || code === 'ETIMEDOUT') {
      return res.status(504).json({ error: "Generation timeout. Please retry.", _meta: { degraded: true, reason: 'timeout' } });
    }

    res.status(500).json({ error: "Failed to generate intelligence" });
  }
});

app.listen(port, () => {
  console.log(`Signal Atlas backend listening on port ${port}`);
});
