export const DEFAULT_GEMINI_UTILITY_MODEL = 'gemini-2.5-flash-lite';
export const DEFAULT_GEMINI_SUITE_MODEL = 'gemini-2.5-pro';
export const DEFAULT_GEMINI_BINGE_MODEL = 'gemini-2.5-pro';
export const DEFAULT_GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';
export const DEFAULT_GEMINI_VIDEO_MODEL = 'veo-3.1-generate-preview';

export const GEMINI_TEXT_MODEL_OPTIONS = [
  {
    id: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    note: 'Highest-quality stable route for executive synthesis, suite artifacts, and hero episode writing.',
  },
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    note: 'Balanced stable route for faster interactive generation with strong reasoning.',
  },
  {
    id: 'gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash-Lite',
    note: 'Lowest-cost stable route for high-volume utility passes and draft loops.',
  },
  {
    id: 'gemini-3-pro-preview',
    label: 'Gemini 3 Pro Preview',
    note: 'Preview route only. AI Studio now warns this preview is deprecated.',
  },
  {
    id: 'gemini-3-flash-preview',
    label: 'Gemini 3 Flash Preview',
    note: 'Preview route for Gemini 3 experimentation. Keep off the primary production default.',
  },
  {
    id: 'gemini-3.1-pro-preview',
    label: 'Gemini 3.1 Pro Preview',
    note: 'AI Studio migration target. Validate project access before promoting to production.',
  },
  {
    id: 'gemini-3.1-flash-lite-preview',
    label: 'Gemini 3.1 Flash-Lite Preview',
    note: 'AI Studio migration target for low-cost utility work. Validate project access before production.',
  },
];

export const GEMINI_IMAGE_MODEL_OPTIONS = [
  {
    id: 'gemini-2.5-flash-image',
    label: 'Gemini 2.5 Flash Image',
    note: 'Stable multimodal image generation and editing route for stills, covers, and placeholders.',
  },
  {
    id: 'gemini-2.5-flash-image-preview',
    label: 'Gemini 2.5 Flash Image Preview',
    note: 'Legacy preview route kept for backward compatibility while migrations settle.',
  },
  {
    id: 'gemini-3.1-flash-image-preview',
    label: 'Gemini 3.1 Flash Image Preview',
    note: 'AI Studio-style migration target. Validate access before promoting to production.',
  },
];

export const GEMINI_VIDEO_MODEL_OPTIONS = [
  {
    id: 'veo-3.1-generate-preview',
    label: 'Veo 3.1 Generate',
    note: 'Highest-quality cinematic video route for client-facing stage moments.',
  },
  {
    id: 'veo-3.1-fast-generate-preview',
    label: 'Veo 3.1 Fast Generate',
    note: 'Faster storyboard and operator-review route when iteration speed matters more than polish.',
  },
];

export const GEMINI_ROUTE_PRESETS = [
  {
    id: 'demo_quality',
    label: 'Demo Quality',
    summary: 'Best-looking default for The Brief, Your Plan, and Episodes during demos.',
    suite_model: 'gemini-2.5-pro',
    binge_model: 'gemini-2.5-pro',
    image_model: 'gemini-2.5-flash-image',
    video_model: 'veo-3.1-generate-preview',
  },
  {
    id: 'balanced_production',
    label: 'Balanced Production',
    summary: 'Keeps strategic artifacts strong while reducing episode-generation latency.',
    suite_model: 'gemini-2.5-pro',
    binge_model: 'gemini-2.5-flash',
    image_model: 'gemini-2.5-flash-image',
    video_model: 'veo-3.1-generate-preview',
  },
  {
    id: 'high_throughput',
    label: 'High Throughput',
    summary: 'Cheaper operator mode for rehearsals, QA, and rapid content iteration.',
    suite_model: 'gemini-2.5-flash',
    binge_model: 'gemini-2.5-flash-lite',
    image_model: 'gemini-2.5-flash-image',
    video_model: 'veo-3.1-fast-generate-preview',
  },
];
