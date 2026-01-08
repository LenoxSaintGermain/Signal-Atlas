
export type Role = 'Exec' | 'Operator' | 'Product';
export type Industry = 'Auto' | 'Logistics' | 'Retail' | 'Manufacturing' | 'Finance' | 'Healthcare' | 'SaaS' | 'Energy';

export interface Signal {
  id: string;
  index: string;
  title: string;
  truth: string;
  default_outcome_anchor?: string;
  relatedIds?: string[]; // IDs of signals this compounds with visually on the grid
}

export interface OutcomeAnchor {
  metric: string;
  direction: 'up' | 'down';
  note: string;
}

export interface GeneratedScenario {
  scenario_title: string;
  scenario: string;
  why_it_matters: string;
  outcome_anchors: OutcomeAnchor[];
  hidden_failure_mode: string;
  compounds_with: string[];
}

export interface Gem {
  id?: string; // Optional because Firestore generates it
  user_email: string;
  created_at: any; // Firestore Timestamp
  
  // Signal Context
  signal_id: string;
  signal_title: string;
  signal_truth: string;
  
  // Generation Context
  role: Role;
  industry: Industry;
  
  // Full Scenario
  scenario: GeneratedScenario;
  
  // Metadata
  generation_model: string;
  generation_latency_ms: number;
}

export interface SignalState {
  selectedSignalId: string | null;
  role: Role;
  industry: Industry;
}

export interface LeadUtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
}

export interface Lead {
  email: string;
  captured_at?: any; // Firestore Timestamp injected on write
  source_signal: string;
  source_role: string;
  source_industry: string;
  user_agent: string;
  referrer: string;
  utm_params: LeadUtmParams;
}
