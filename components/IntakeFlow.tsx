import React, { useEffect, useMemo, useState } from 'react';
import {
  CLIENT_INTENTS,
  FOCUS_PREFS,
  FREE_TIER_SMART_START_FIELD_IDS,
  PACE_PREFS,
  SMART_START_FIELDS,
} from '../constants';
import {
  ClientDoc,
  ClientIntent,
  ClientPreferences,
  FocusPreference,
  IntakeAnswers,
  IntakeAnswerValue,
  PacePreference,
  PublicConfig,
  SuiteModuleId,
} from '../types';
import { saveIntake } from '../services/clientService';
import { upsertArtifact } from '../services/artifactService';
import {
  generateAIProfileDoc,
  generateBrief,
  generateCjsExecutionDoc,
  generateGapsDoc,
  generatePlan,
  generateProfileDoc,
  generateReadinessDoc,
  generateSuiteDistilledDoc,
} from '../services/stubGenerator';
import { generateSuiteArtifacts } from '../services/suiteApi';
import { extractIntakeFromTranscript } from '../services/voiceApi';
import { ElevenLabsConvaiPanel } from './ElevenLabsConvaiPanel';
import { GeminiLivePanel } from './GeminiLivePanel';
import { HeroVideoSection } from './HeroVideoSection';
import { DNAProgressIndicator, DnaProgressStage } from './DNAProgressIndicator';

type Step = 'screen_1' | 'screen_2' | 'screen_3' | 'screen_4' | 'plating' | 'done';
type VoiceSessionState = 'idle' | 'connecting' | 'connected' | 'completed' | 'error';

const SUITE_FEEL_OPTIONS = ['STRATEGIC', 'GROUNDED', 'STORY', 'JOB-SEARCH', 'SKILLS', 'LEADERSHIP'];
const BENEFITS_OPTIONS = [
  { label: 'Not yet', value: 'NOT_YET' },
  { label: 'Upcoming', value: 'UPCOMING' },
  { label: 'In progress', value: 'IN_PROGRESS' },
] as const;
const AI_USAGE_OPTIONS = [
  { label: 'Rarely or Never', value: 'RARELY_OR_NEVER' },
  { label: 'Occasionally', value: 'OCCASIONALLY' },
  { label: 'Regularly', value: 'REGULARLY' },
  { label: 'Daily', value: 'DAILY' },
] as const;
const INTENT_COPY: Record<ClientIntent, { label: string; description: string }> = {
  current_role: {
    label: 'Stay sharp in my current role',
    description: 'Protect momentum, increase signal, and strengthen leverage where I already operate.',
  },
  target_role: {
    label: 'Move into a specific next role',
    description: 'Build a case for a defined move, with evidence, fit, and compensation clarity.',
  },
  not_sure: {
    label: 'Help me design the direction',
    description: 'Surface the strongest path before I overinvest in the wrong market story.',
  },
};
const ARTIFACT_PREVIEW = [
  {
    icon: '◉',
    label: 'Your Brief',
    promise: 'A market-calibrated verdict on where your value lands and what is suppressing it.',
  },
  {
    icon: '◈',
    label: 'Your Profile',
    promise: 'Your career genome - adaptive assets, extinction risks, and behavioral propensities.',
  },
  {
    icon: '◎',
    label: 'Your Plan',
    promise: 'A 72-hour action sequence and a 90-day adaptation roadmap, built around your constraints.',
  },
];

const intakeTheme = {
  '--intake-bg': '#EDEAE2',
  '--intake-bg-alt': '#E5E2DA',
  '--intake-dark': '#1B1E1C',
  '--intake-dark-mid': '#252A27',
  '--intake-teal': '#4B9E8D',
  '--intake-teal-dim': '#2D7A6B',
  '--intake-teal-light': '#6BBFAF',
  '--intake-teal-bg': '#E0F0ED',
  '--intake-amber': '#C9853A',
  '--intake-border': '#D0CEC5',
  '--intake-border-dark': '#303530',
  '--intake-cream': '#F5F2EA',
  '--intake-muted': '#8A8A7A',
  '--intake-muted-light': '#AEADA0',
} as React.CSSProperties;

const cardClass = 'border border-[var(--intake-border)] bg-[var(--intake-cream)] p-5 md:p-6';
const darkCardClass = 'border border-[var(--intake-border-dark)] bg-[var(--intake-dark)] p-5 md:p-6 text-[#F5F2EA]';
const labelClass = 'font-intake-mono text-[9px] uppercase tracking-[0.18em] text-[var(--intake-teal-dim)]';
const fieldLabelClass = 'flex items-center gap-2 font-intake-mono text-[9px] uppercase tracking-[0.18em] text-[var(--intake-muted)]';
const inputBaseClass = 'w-full border border-[var(--intake-border)] bg-white px-4 py-3 text-sm text-[#1B1E1C] outline-none transition-colors focus:border-[var(--intake-teal)]';
const secondaryButtonClass =
  'border border-[var(--intake-border)] bg-transparent px-4 py-3 font-intake-mono text-[10px] uppercase tracking-[0.12em] text-[#1B1E1C] transition-colors hover:border-[var(--intake-teal)]';
const primaryButtonClass =
  'bg-[var(--intake-teal)] px-4 py-3 font-intake-mono text-[10px] uppercase tracking-[0.16em] text-white transition-colors hover:bg-[var(--intake-teal-dim)] disabled:opacity-50';

const isValueFilled = (value: IntakeAnswerValue | undefined) => {
  if (typeof value === 'string') return Boolean(value.trim());
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'boolean') return true;
  return false;
};

const dedupeStrings = (values: string[]) => Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const mapIntentToIntakeType = (intent: ClientIntent) =>
  intent === 'current_role' ? 'STAY_SHARP' : intent === 'target_role' ? 'SPECIFIC_MOVE' : 'DESIGN_DIRECTION';

const titleFromIntent = (intent: ClientIntent) =>
  intent === 'current_role'
    ? 'Where are you heading?'
    : intent === 'target_role'
      ? 'What move are we pricing?'
      : 'What direction is worth designing?';

const normalizeAnswersForSubmission = (intent: ClientIntent, answers: IntakeAnswers): IntakeAnswers => {
  const normalized: IntakeAnswers = { ...answers };
  normalized.intent_type = mapIntentToIntakeType(intent);
  normalized.outcome_goals = Array.isArray(answers.outcomes_goals) ? answers.outcomes_goals : [];
  normalized.comp_level = typeof answers.target_compensation_level === 'string' ? answers.target_compensation_level : '';
  normalized.target_title =
    typeof answers.current_or_target_job_title === 'string' ? answers.current_or_target_job_title : '';
  normalized.salary_range =
    typeof answers.current_or_target_salary === 'string' ? answers.current_or_target_salary : '';
  normalized.comp_range = typeof answers.current_or_target_salary === 'string' ? answers.current_or_target_salary : '';
  normalized.benefits_timing =
    typeof answers.benefits_timing === 'string' ? answers.benefits_timing : 'NOT_YET';
  normalized.benefits_under_review = normalized.benefits_timing !== 'NOT_YET';
  normalized.enterprise_ai_context = Array.isArray(answers.enterprise_context) ? answers.enterprise_context : [];
  normalized.resume_url = typeof answers.resume_source === 'string' ? answers.resume_source : '';
  normalized.align_bio_on_upload = answers.bio_alignment_requested === true;
  normalized.learning_modality = Array.isArray(answers.learning_modalities) ? answers.learning_modalities : [];
  normalized.direction_aim = typeof answers.target === 'string' ? answers.target : '';
  normalized.momentum_source = typeof answers.work_style === 'string' ? answers.work_style : '';
  normalized.tone_preference =
    typeof answers.suite_feel === 'string' && answers.suite_feel ? [answers.suite_feel] : [];
  normalized.voice_extracted_fields = Array.isArray(answers.voice_extracted_fields) ? answers.voice_extracted_fields : [];
  return normalized;
};

function FieldShell({
  label,
  fieldId,
  voiceFilled,
  helper,
  children,
  wide = false,
}: {
  label: string;
  fieldId?: string;
  voiceFilled?: boolean;
  helper?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-3 ${wide ? 'md:col-span-2' : ''}`}>
      <div className={fieldLabelClass}>
        <span>{label}</span>
        {fieldId && voiceFilled ? (
          <span className="text-[var(--intake-teal)]">{'<-'} From voice session</span>
        ) : null}
      </div>
      {helper ? <div className="font-intake-body text-sm leading-relaxed text-[var(--intake-muted)]">{helper}</div> : null}
      {children}
    </div>
  );
}

function ChipGroup({
  options,
  selected,
  onToggle,
  multi = false,
}: {
  options: Array<{ label: string; value: string }>;
  selected: string[];
  onToggle: (value: string) => void;
  multi?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => {
        const active = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onToggle(option.value)}
            className={`border bg-white px-3 py-2 font-intake-mono text-[9px] uppercase tracking-[0.1em] transition-colors ${
              active
                ? 'border-t-2 border-[var(--intake-teal)] bg-[var(--intake-teal-bg)] text-[var(--intake-teal-dim)]'
                : 'border-[var(--intake-border)] text-[#1B1E1C] hover:bg-[var(--intake-teal-bg)]'
            }`}
            aria-pressed={active}
          >
            {option.label}
            {!multi && active ? null : null}
          </button>
        );
      })}
    </div>
  );
}

export function IntakeFlow(props: {
  uid: string;
  tier?: string;
  client?: ClientDoc | null;
  isAdminUser?: boolean;
  voiceConfig: PublicConfig['voice'];
  intakeConfig: PublicConfig['professional_dna'];
  onComplete: (
    nextModuleId: SuiteModuleId,
    payload: { intent: ClientIntent; preferences: ClientPreferences; answers: IntakeAnswers }
  ) => void;
}) {
  const isFreeTier = props.tier === 'free_foundation_access';
  const [step, setStep] = useState<Step>('screen_1');
  const [intent, setIntent] = useState<ClientIntent>('current_role');
  const [answers, setAnswers] = useState<IntakeAnswers>({});
  const [pace, setPace] = useState<PacePreference>('standard');
  const [focus, setFocus] = useState<FocusPreference>('job_search');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceSessionState, setVoiceSessionState] = useState<VoiceSessionState>('idle');
  const [voicePanelOpen, setVoicePanelOpen] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceAutofillBusy, setVoiceAutofillBusy] = useState(false);
  const [progressStages, setProgressStages] = useState<DnaProgressStage[]>([
    { id: 'intake', label: 'INTAKE SIGNALS', status: 'complete' },
    { id: 'market', label: 'MARKET DATA', status: 'loading' },
    { id: 'research', label: 'RESEARCH PASS', status: 'pending' },
  ]);
  const [voiceLaneChoice, setVoiceLaneChoice] = useState<PublicConfig['voice']['active_panel']>(
    props.intakeConfig.voice_model === 'elevenlabs_conversational' && props.voiceConfig.elevenlabs_enabled
      ? 'elevenlabs'
      : props.voiceConfig.active_panel
  );

  const prefs: ClientPreferences = useMemo(() => ({ pace, focus }), [pace, focus]);
  const fieldOptions = useMemo(() => {
    const map = new Map<string, string[]>();
    SMART_START_FIELDS.forEach((field) => {
      map.set(field.id, field.options ?? []);
    });
    return map;
  }, []);
  const freeTierFieldSet = useMemo(() => new Set(FREE_TIER_SMART_START_FIELD_IDS), []);

  useEffect(() => {
    setVoiceLaneChoice(
      props.intakeConfig.voice_model === 'elevenlabs_conversational' && props.voiceConfig.elevenlabs_enabled
        ? 'elevenlabs'
        : props.voiceConfig.active_panel
    );
  }, [props.intakeConfig.voice_model, props.voiceConfig.active_panel, props.voiceConfig.elevenlabs_enabled]);

  useEffect(() => {
    if (step !== 'plating') {
      setProgressStages([
        { id: 'intake', label: 'INTAKE SIGNALS', status: 'complete' },
        { id: 'market', label: 'MARKET DATA', status: 'loading' },
        { id: 'research', label: 'RESEARCH PASS', status: 'pending' },
      ]);
      return;
    }
    const first = window.setTimeout(() => {
      setProgressStages([
        { id: 'intake', label: 'INTAKE SIGNALS', status: 'complete' },
        { id: 'market', label: 'MARKET DATA', status: 'complete' },
        { id: 'research', label: 'RESEARCH PASS', status: 'loading' },
      ]);
    }, 850);
    const second = window.setTimeout(() => {
      setProgressStages([
        { id: 'intake', label: 'INTAKE SIGNALS', status: 'complete' },
        { id: 'market', label: 'MARKET DATA', status: 'complete' },
        { id: 'research', label: 'RESEARCH PASS', status: 'complete' },
      ]);
    }, 1750);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(second);
    };
  }, [step]);

  const hasAutofillSource = useMemo(
    () => Boolean(props.client?.intake?.answers || props.client?.demo_profile),
    [props.client?.demo_profile, props.client?.intake?.answers]
  );

  const readText = (id: string) => (typeof answers[id] === 'string' ? (answers[id] as string) : '');
  const readList = (id: string) => (Array.isArray(answers[id]) ? (answers[id] as string[]) : []);
  const readBool = (id: string) => answers[id] === true;
  const voiceFieldSet = useMemo(
    () => new Set(Array.isArray(answers.voice_extracted_fields) ? answers.voice_extracted_fields : []),
    [answers.voice_extracted_fields]
  );
  const isFieldAvailable = (id: string) => !isFreeTier || freeTierFieldSet.has(id);

  const setValue = (id: string, value: IntakeAnswerValue) =>
    setAnswers((prev) => ({
      ...prev,
      [id]: value,
    }));

  const setText = (id: string, value: string) => setValue(id, value);
  const setList = (id: string, value: string[]) => setValue(id, value);
  const toggleList = (id: string, value: string) => {
    const existing = readList(id);
    setList(id, existing.includes(value) ? existing.filter((entry) => entry !== value) : [...existing, value]);
  };

  const buildProfileAutofillState = () => {
    const seededAnswers = props.client?.intake?.answers ?? {};
    const demoProfile = props.client?.demo_profile ?? {};
    const inferredAnswers: IntakeAnswers = {
      ...seededAnswers,
      current_title:
        typeof seededAnswers.current_title === 'string'
          ? seededAnswers.current_title
          : typeof seededAnswers.current_or_target_job_title === 'string'
            ? seededAnswers.current_or_target_job_title
            : demoProfile?.name || '',
      suite_feel:
        typeof seededAnswers.suite_feel === 'string'
          ? seededAnswers.suite_feel
          : props.client?.preferences?.focus === 'leadership'
            ? 'LEADERSHIP'
            : props.client?.preferences?.focus === 'skills'
              ? 'SKILLS'
              : 'STRATEGIC',
    };

    return {
      nextIntent: props.client?.intent ?? intent,
      nextPace: props.client?.preferences?.pace ?? pace,
      nextFocus: props.client?.preferences?.focus ?? focus,
      nextAnswers: inferredAnswers,
    };
  };

  const mergeOnlyEmptyAnswers = (base: IntakeAnswers, incoming: IntakeAnswers) => {
    const next: IntakeAnswers = { ...base };
    Object.entries(incoming).forEach(([key, value]) => {
      if (!isValueFilled(base[key])) {
        next[key] = value;
      }
    });
    return next;
  };

  const applyProfileAutofill = (nextStep?: Step, onlyEmpty = false) => {
    const next = buildProfileAutofillState();
    setIntent(next.nextIntent);
    setPace(next.nextPace);
    setFocus(next.nextFocus);
    setAnswers((prev) => (onlyEmpty ? mergeOnlyEmptyAnswers(prev, next.nextAnswers) : next.nextAnswers));
    setError(null);
    if (nextStep) setStep(nextStep);
  };

  const mergeVoiceExtractedFields = (extractedAnswers: IntakeAnswers, sessionId?: string, completed = true) => {
    setAnswers((prev) => {
      const merged: IntakeAnswers = { ...prev };
      const appliedFields: string[] = Array.isArray(prev.voice_extracted_fields) ? [...prev.voice_extracted_fields] : [];

      Object.entries(extractedAnswers).forEach(([key, value]) => {
        if (!isValueFilled(prev[key])) {
          merged[key] = value;
          appliedFields.push(key);
        }
      });

      merged.voice_session_id = sessionId || readText('voice_session_id');
      merged.voice_session_completed = completed;
      merged.voice_extracted_fields = dedupeStrings(appliedFields);

      if (!isValueFilled(prev.current_or_target_salary) && typeof merged.comp_range === 'string' && merged.comp_range) {
        merged.current_or_target_salary = merged.comp_range;
        merged.salary_range = merged.comp_range;
      }
      if (!isValueFilled(prev.current_or_target_job_title) && typeof merged.target_title === 'string' && merged.target_title) {
        merged.current_or_target_job_title = merged.target_title;
      }
      if (!isValueFilled(prev.enterprise_context) && Array.isArray(merged.enterprise_ai_context)) {
        merged.enterprise_context = merged.enterprise_ai_context;
      }

      return merged;
    });
  };

  const handleVoiceSessionComplete = async (payload: { transcript: string; sessionId?: string; completed: boolean }) => {
    setVoiceSessionState(payload.completed ? 'completed' : 'idle');
    setVoiceError(null);
    if (!props.intakeConfig.voice_to_form_autofill) {
      setAnswers((prev) => ({
        ...prev,
        voice_session_id: payload.sessionId || '',
        voice_session_completed: payload.completed,
      }));
      return;
    }

    setVoiceAutofillBusy(true);
    try {
      const extraction = await extractIntakeFromTranscript(payload.transcript, answers);
      mergeVoiceExtractedFields(extraction.extracted as IntakeAnswers, payload.sessionId, payload.completed);
    } catch (extractionError: any) {
      setVoiceError(extractionError?.message ?? 'Unable to structure the voice session into intake fields.');
    } finally {
      setVoiceAutofillBusy(false);
    }
  };

  const submitWithPayload = async (
    nextIntent: ClientIntent,
    nextPreferences: ClientPreferences,
    rawAnswers: IntakeAnswers
  ) => {
    setBusy(true);
    setError(null);
    try {
      const nextAnswers = normalizeAnswersForSubmission(nextIntent, rawAnswers);
      const intakePayload = { intent: nextIntent, preferences: nextPreferences, answers: nextAnswers };
      await saveIntake(props.uid, intakePayload);
      setStep('plating');

      if (isFreeTier) {
        const readiness = generateReadinessDoc(nextAnswers);
        const resourceGuide = {
          resource_guide: [
            'Intro path: AI essentials for career acceleration.',
            'Workflow starter: one prompt template + one execution loop.',
            'Upgrade unlock: personalized Brief, Plan, and concierge support.',
          ],
          upgrade_cta: 'Upgrade to unlock full personalized suite artifacts and ConciergeJobSearch.',
        };
        await upsertArtifact(props.uid, 'readiness', 'AI Readiness Assessment', {
          ...readiness,
          ...resourceGuide,
        } as any);
        setStep('done');
        props.onComplete('readiness', intakePayload);
        return;
      }

      let brief: any, plan: any, profile: any, aiProfile: any, gaps: any;
      try {
        const artifacts = await generateSuiteArtifacts({
          intent: nextIntent,
          preferences: nextPreferences,
          answers: nextAnswers,
        });
        brief = artifacts.brief;
        plan = artifacts.plan;
        profile = artifacts.profile;
        aiProfile = artifacts.ai_profile;
        gaps = artifacts.gaps;
      } catch {
        brief = generateBrief(nextAnswers);
        plan = generatePlan(nextAnswers);
        profile = generateProfileDoc(nextAnswers);
        aiProfile = generateAIProfileDoc(nextAnswers);
        gaps = generateGapsDoc(nextAnswers);
      }

      await Promise.all([
        upsertArtifact(props.uid, 'brief', 'The Brief', brief),
        upsertArtifact(props.uid, 'suite_distilled', 'Your Suite, Distilled', generateSuiteDistilledDoc(brief, nextAnswers)),
        upsertArtifact(props.uid, 'plan', 'Your Plan', plan),
        upsertArtifact(props.uid, 'profile', 'Your Profile', profile),
        upsertArtifact(props.uid, 'ai_profile', 'Your AI Profile', aiProfile),
        upsertArtifact(props.uid, 'gaps', 'Your Gaps', gaps),
        upsertArtifact(props.uid, 'readiness', 'AI Readiness Assessment', generateReadinessDoc(nextAnswers)),
        upsertArtifact(props.uid, 'cjs_execution', 'ConciergeJobSearch Execution', generateCjsExecutionDoc(nextAnswers, nextIntent)),
      ]);

      setStep('done');
      const nextModuleId: SuiteModuleId = nextIntent === 'not_sure' ? 'my_concierge' : 'brief';
      props.onComplete(nextModuleId, intakePayload);
    } catch (submitError: any) {
      setError(submitError?.message ?? 'Unable to complete intake.');
      setStep('screen_4');
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => submitWithPayload(intent, prefs, answers);

  const speedRunProfileSubmit = async () => {
    const next = buildProfileAutofillState();
    const nextPreferences: ClientPreferences = { pace: next.nextPace, focus: next.nextFocus };
    setIntent(next.nextIntent);
    setPace(next.nextPace);
    setFocus(next.nextFocus);
    setAnswers(next.nextAnswers);
    await submitWithPayload(next.nextIntent, nextPreferences, next.nextAnswers);
  };

  const renderVoiceRail = props.intakeConfig.voice_agent_enabled === false ? null : (
    <section className={darkCardClass}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="font-intake-mono text-[9px] uppercase tracking-[0.18em] text-[var(--intake-teal)]">
              Immersive Play Rail
            </div>
            <div className="mt-3 font-intake-body text-base italic leading-relaxed text-[#F5F2EA]">
              Start with voice to set tone, then move into the live studio scrollytelling flow.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setVoicePanelOpen((prev) => !prev)}
            className={primaryButtonClass}
          >
            {voiceSessionState === 'connected' ? 'Voice Channel Active' : 'Begin Voice Intake'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center">
            <span
              className={`mr-2 inline-block h-2 w-2 rounded-full bg-[var(--intake-teal)] ${
                voiceSessionState === 'connected' ? '' : 'animate-pulse'
              }`}
            />
            <span className="font-intake-mono text-[9px] uppercase tracking-[0.14em] text-[var(--intake-teal)]">
              {voiceSessionState === 'connected' ? 'Live' : 'Standby'}
            </span>
          </div>
          <div className="font-intake-mono text-[9px] uppercase tracking-[0.14em] text-[#AEADA0]">
            {voiceAutofillBusy
              ? 'Structuring transcript'
              : voiceFieldSet.size > 0
                ? `${voiceFieldSet.size} fields from voice`
                : 'Voice channel ready'}
          </div>
        </div>

        <div className="border border-[var(--intake-border-dark)] bg-[var(--intake-dark-mid)] p-5">
          <div className="font-intake-mono text-[9px] uppercase tracking-[0.18em] text-[var(--intake-teal)]">
            Conversation Memory
          </div>
          <div className="mt-3 font-intake-body text-base leading-relaxed text-[#AEADA0]">
            Your answers are being structured in real time.
          </div>
        </div>

        {voiceError ? (
          <div className="border border-[var(--intake-border-dark)] bg-[#2E2018] px-4 py-3 font-intake-body text-sm leading-relaxed text-[#F5D7C1]">
            {voiceError}
          </div>
        ) : null}

        {voicePanelOpen ? (
          <div className="pt-2">
            {props.voiceConfig.elevenlabs_enabled ? (
              <div className="mb-4 flex flex-wrap gap-3">
                {[
                  { id: 'gemini_live', label: 'Gemini Live' },
                  { id: 'elevenlabs', label: 'ElevenLabs' },
                ].map((option) => {
                  const active = voiceLaneChoice === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setVoiceLaneChoice(option.id as PublicConfig['voice']['active_panel'])}
                      className={`border px-3 py-2 font-intake-mono text-[9px] uppercase tracking-[0.14em] transition-colors ${
                        active
                          ? 'border-t-2 border-[var(--intake-teal)] bg-[var(--intake-teal-bg)] text-[var(--intake-teal-dim)]'
                          : 'border-[var(--intake-border)] bg-white text-[#1B1E1C] hover:border-[var(--intake-teal)]'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {props.voiceConfig.elevenlabs_enabled && voiceLaneChoice === 'elevenlabs' ? (
              <ElevenLabsConvaiPanel agentId={props.voiceConfig.elevenlabs_agent_id} />
            ) : (
              <GeminiLivePanel
                onStateChange={(state) => setVoiceSessionState(state)}
                onSessionComplete={handleVoiceSessionComplete}
                transcriptVisible={props.intakeConfig.voice_transcription_visible}
              />
            )}
          </div>
        ) : null}
      </div>
    </section>
  );

  const renderOperatorSpeedRun =
    props.isAdminUser ? (
      <section className="border border-[var(--intake-border)] bg-[#E0F0ED] p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className={labelClass}>Operator Speed Run</div>
            <div className="mt-3 font-intake-body text-base leading-relaxed text-[var(--intake-teal-dim)]">
              Use seeded profile context to prefill intake and jump straight into suite preparation.
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => applyProfileAutofill('screen_2')} className={secondaryButtonClass}>
              Autofill intake
            </button>
            <button type="button" onClick={() => applyProfileAutofill('screen_4')} className={primaryButtonClass}>
              Autofill + jump
            </button>
            <button type="button" onClick={speedRunProfileSubmit} disabled={busy} className={secondaryButtonClass}>
              {busy ? 'Preparing...' : 'Autofill + prepare suite'}
            </button>
          </div>
        </div>
      </section>
    ) : null;

  const renderScreenOne = () => (
    <section className="space-y-6">
      <div className={cardClass}>
        <div className={labelClass}>Screen 01 · Positioning</div>
        <h2 className="mt-4 font-editorial text-4xl font-black leading-[0.94] tracking-tight text-[#1B1E1C] md:text-5xl">
          {titleFromIntent(intent)}
        </h2>
        <div className="mt-4 max-w-3xl font-intake-body text-lg leading-relaxed text-[var(--intake-muted)]">
          Users should know their numbers before they know their narrative. Start with direction, target outcomes, and the compensation frame.
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {CLIENT_INTENTS.map((option) => {
          const active = option === intent;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setIntent(option)}
              className={`group border p-6 text-left transition-colors ${
                active
                  ? 'border-t-2 border-[var(--intake-teal)] bg-[var(--intake-teal-bg)]'
                  : 'border-[var(--intake-border)] bg-white hover:border-[var(--intake-teal)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="font-intake-mono text-[8px] uppercase tracking-[0.14em] text-[var(--intake-muted)]">Intent</div>
                <span className="font-intake-mono text-sm text-[var(--intake-teal)] opacity-0 transition-opacity group-hover:opacity-100">
                  →
                </span>
              </div>
              <div className="mt-4 font-intake-body text-base italic leading-relaxed text-[#1B1E1C]">
                {INTENT_COPY[option].label}
              </div>
              <div className="mt-4 font-intake-body text-sm leading-relaxed text-[var(--intake-muted)]">
                {INTENT_COPY[option].description}
              </div>
            </button>
          );
        })}
      </div>

      <div className={`${cardClass} grid gap-6 md:grid-cols-2`}>
        {isFieldAvailable('outcomes_goals') ? (
          <FieldShell
            label="Primary outcome goals"
            fieldId="outcomes_goals"
            voiceFilled={voiceFieldSet.has('outcomes_goals')}
            wide
          >
            <ChipGroup
              options={(fieldOptions.get('outcomes_goals') ?? []).map((value) => ({ label: value, value }))}
              selected={readList('outcomes_goals')}
              onToggle={(value) => toggleList('outcomes_goals', value)}
              multi
            />
          </FieldShell>
        ) : null}

        {isFieldAvailable('target_compensation_level') ? (
          <FieldShell
            label="Target compensation level"
            fieldId="target_compensation_level"
            voiceFilled={voiceFieldSet.has('target_compensation_level') || voiceFieldSet.has('comp_level')}
          >
            <select
              value={readText('target_compensation_level')}
              onChange={(event) => setText('target_compensation_level', event.target.value)}
              className={inputBaseClass}
            >
              <option value="">Select...</option>
              {(fieldOptions.get('target_compensation_level') ?? []).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FieldShell>
        ) : null}

        {isFieldAvailable('current_or_target_job_title') ? (
          <FieldShell
            label="Current or target job title"
            fieldId="current_or_target_job_title"
            voiceFilled={voiceFieldSet.has('current_or_target_job_title') || voiceFieldSet.has('target_title')}
          >
            <input
              value={readText('current_or_target_job_title')}
              onChange={(event) => setText('current_or_target_job_title', event.target.value)}
              placeholder="e.g., Program Manager"
              className={inputBaseClass}
            />
          </FieldShell>
        ) : null}

        {isFieldAvailable('current_or_target_salary') ? (
          <FieldShell
            label="Current or target salary range"
            fieldId="current_or_target_salary"
            voiceFilled={voiceFieldSet.has('current_or_target_salary') || voiceFieldSet.has('comp_range')}
          >
            <input
              value={readText('current_or_target_salary')}
              onChange={(event) => setText('current_or_target_salary', event.target.value)}
              placeholder="e.g., $120k-$160k"
              className={inputBaseClass}
            />
          </FieldShell>
        ) : null}

        <FieldShell label="Benefits at or near review" fieldId="benefits_timing" voiceFilled={voiceFieldSet.has('benefits_timing')} wide>
          <ChipGroup
            options={BENEFITS_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
            selected={[readText('benefits_timing') || 'NOT_YET']}
            onToggle={(value) => {
              setText('benefits_timing', value);
              setValue('benefits_under_review', value !== 'NOT_YET');
            }}
          />
        </FieldShell>
      </div>
    </section>
  );

  const renderScreenTwo = () => (
    <section className="space-y-6">
      <div className={cardClass}>
        <div className={labelClass}>Screen 02 · Context</div>
        <h2 className="mt-4 font-editorial text-4xl font-black leading-[0.94] tracking-tight text-[#1B1E1C] md:text-5xl">
          Where are you now?
        </h2>
        <div className="mt-4 max-w-3xl font-intake-body text-lg leading-relaxed text-[var(--intake-muted)]">
          Capture the current operating environment, the AI context around the role, and the actual job signal you want us to calibrate against.
        </div>
      </div>

      <div className={`${cardClass} grid gap-6 md:grid-cols-2`}>
        {isFieldAvailable('current_title') ? (
          <FieldShell label="Current title" fieldId="current_title" voiceFilled={voiceFieldSet.has('current_title')}>
            <input
              value={readText('current_title')}
              onChange={(event) => setText('current_title', event.target.value)}
              placeholder="e.g., Executive Assistant"
              className={inputBaseClass}
            />
          </FieldShell>
        ) : null}

        {isFieldAvailable('industry') ? (
          <FieldShell label="Industry" fieldId="industry" voiceFilled={voiceFieldSet.has('industry')}>
            <input
              value={readText('industry')}
              onChange={(event) => setText('industry', event.target.value)}
              placeholder="e.g., Healthcare, SaaS, Public sector"
              className={inputBaseClass}
            />
          </FieldShell>
        ) : null}

        {isFieldAvailable('ai_usage_frequency') ? (
          <FieldShell label="AI usage frequency" fieldId="ai_usage_frequency" voiceFilled={voiceFieldSet.has('ai_usage_frequency')} wide>
            <ChipGroup
              options={AI_USAGE_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
              selected={readText('ai_usage_frequency') ? [readText('ai_usage_frequency')] : []}
              onToggle={(value) => setText('ai_usage_frequency', value)}
            />
          </FieldShell>
        ) : null}

        {isFieldAvailable('enterprise_context') ? (
          <FieldShell
            label="Enterprise AI context"
            fieldId="enterprise_context"
            voiceFilled={voiceFieldSet.has('enterprise_context') || voiceFieldSet.has('enterprise_ai_context')}
            wide
          >
            <ChipGroup
              options={(fieldOptions.get('enterprise_context') ?? []).map((value) => ({ label: value, value }))}
              selected={readList('enterprise_context')}
              onToggle={(value) => toggleList('enterprise_context', value)}
              multi
            />
          </FieldShell>
        ) : null}

        {isFieldAvailable('job_description') ? (
          <FieldShell
            label="Paste your current or target job description"
            fieldId="job_description"
            voiceFilled={voiceFieldSet.has('job_description')}
            helper="This is your most valuable input. Alignment and gap analysis depends on it."
            wide
          >
            <textarea
              value={readText('job_description')}
              onChange={(event) => setText('job_description', event.target.value)}
              placeholder="Paste the role, scope, requirements, and language the market is already using."
              className={`${inputBaseClass} min-h-[220px] resize-y font-intake-body text-base leading-relaxed`}
            />
          </FieldShell>
        ) : null}
      </div>
    </section>
  );

  const renderScreenThree = () => (
    <section className="space-y-6">
      <div className={cardClass}>
        <div className={labelClass}>Screen 03 · Inputs</div>
        <h2 className="mt-4 font-editorial text-4xl font-black leading-[0.94] tracking-tight text-[#1B1E1C] md:text-5xl">
          What are we working with?
        </h2>
        <div className="mt-4 max-w-3xl font-intake-body text-lg leading-relaxed text-[var(--intake-muted)]">
          This screen captures source material, interest clusters, and learning posture so the suite can respond like a living system, not a form response.
        </div>
      </div>

      <div className={`${cardClass} grid gap-6 md:grid-cols-2`}>
        {isFieldAvailable('resume_source') ? (
          <FieldShell label="Resume link or upload reference" fieldId="resume_source" voiceFilled={voiceFieldSet.has('resume_source')}>
            <input
              value={readText('resume_source')}
              onChange={(event) => setText('resume_source', event.target.value)}
              placeholder="URL, file name, or notes"
              className={inputBaseClass}
            />
          </FieldShell>
        ) : null}

        {isFieldAvailable('bio_alignment_requested') ? (
          <FieldShell label="Run ALIGN MY BIO after upload" fieldId="bio_alignment_requested" voiceFilled={voiceFieldSet.has('bio_alignment_requested')}>
            <ChipGroup
              options={[
                { label: 'Not now', value: 'false' },
                { label: 'Run it', value: 'true' },
              ]}
              selected={[readBool('bio_alignment_requested') ? 'true' : 'false']}
              onToggle={(value) => setValue('bio_alignment_requested', value === 'true')}
            />
          </FieldShell>
        ) : null}

        {isFieldAvailable('foundational_interests') ? (
          <FieldShell label="Foundational areas of interest" fieldId="foundational_interests" voiceFilled={voiceFieldSet.has('foundational_interests')} wide>
            <ChipGroup
              options={(fieldOptions.get('foundational_interests') ?? []).map((value) => ({ label: value, value }))}
              selected={readList('foundational_interests')}
              onToggle={(value) => toggleList('foundational_interests', value)}
              multi
            />
          </FieldShell>
        ) : null}

        {!isFreeTier && isFieldAvailable('advanced_interests') ? (
          <FieldShell label="Advanced areas of interest" fieldId="advanced_interests" voiceFilled={voiceFieldSet.has('advanced_interests')} wide>
            <ChipGroup
              options={(fieldOptions.get('advanced_interests') ?? []).map((value) => ({ label: value, value }))}
              selected={readList('advanced_interests')}
              onToggle={(value) => toggleList('advanced_interests', value)}
              multi
            />
          </FieldShell>
        ) : null}

        {isFieldAvailable('learning_modalities') ? (
          <FieldShell label="Learning modality preferences" fieldId="learning_modalities" voiceFilled={voiceFieldSet.has('learning_modalities')} wide>
            <ChipGroup
              options={(fieldOptions.get('learning_modalities') ?? []).map((value) => ({ label: value, value }))}
              selected={readList('learning_modalities')}
              onToggle={(value) => toggleList('learning_modalities', value)}
              multi
            />
          </FieldShell>
        ) : null}

        <FieldShell label="Suite tone" fieldId="suite_feel" voiceFilled={voiceFieldSet.has('suite_feel') || voiceFieldSet.has('tone_preference')} wide>
          <ChipGroup
            options={SUITE_FEEL_OPTIONS.map((value) => ({ label: value, value }))}
            selected={readText('suite_feel') ? [readText('suite_feel')] : []}
            onToggle={(value) => setText('suite_feel', value)}
          />
        </FieldShell>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {ARTIFACT_PREVIEW.map((artifact) => (
          <article key={artifact.label} className={cardClass}>
            <div className="font-intake-mono text-xl text-[var(--intake-teal)]">{artifact.icon}</div>
            <div className="mt-4 font-intake-mono text-[9px] uppercase tracking-[0.18em] text-[var(--intake-muted)]">
              {artifact.label}
            </div>
            <div className="mt-3 font-intake-body text-sm italic leading-relaxed text-[#1B1E1C]">
              {artifact.promise}
            </div>
          </article>
        ))}
      </div>
    </section>
  );

  const renderScreenFour = () => (
    <section className="space-y-6">
      <div className={cardClass}>
        <div className={labelClass}>Screen 04 · Constraints</div>
        <h2 className="mt-4 font-editorial text-4xl font-black leading-[0.94] tracking-tight text-[#1B1E1C] md:text-5xl">
          What do we need to know?
        </h2>
        <div className="mt-4 max-w-3xl font-intake-body text-lg leading-relaxed text-[var(--intake-muted)]">
          This is the operating reality layer: direction, pressure pattern, momentum source, and the constraints the system needs to respect.
        </div>
      </div>

      <div className={`${cardClass} grid gap-6 md:grid-cols-2`}>
        {isFieldAvailable('target') ? (
          <FieldShell label="If you had to pick a direction, what are you aiming at?" fieldId="target" voiceFilled={voiceFieldSet.has('target') || voiceFieldSet.has('direction_aim')}>
            <input
              value={readText('target')}
              onChange={(event) => setText('target', event.target.value)}
              placeholder="e.g., Program manager"
              className={inputBaseClass}
            />
          </FieldShell>
        ) : null}

        <FieldShell label="Timeline urgency" fieldId="timeline_urgency" voiceFilled={voiceFieldSet.has('timeline_urgency')}>
          <input
            value={readText('timeline_urgency')}
            onChange={(event) => setText('timeline_urgency', event.target.value)}
            placeholder="e.g., 30 days, this quarter, immediate"
            className={inputBaseClass}
          />
        </FieldShell>

        {isFieldAvailable('pressure_breaks') ? (
          <FieldShell label="Under pressure, what breaks first?" fieldId="pressure_breaks" voiceFilled={voiceFieldSet.has('pressure_breaks')}>
            <input
              value={readText('pressure_breaks')}
              onChange={(event) => setText('pressure_breaks', event.target.value)}
              placeholder="Time, clarity, confidence, energy"
              className={inputBaseClass}
            />
          </FieldShell>
        ) : null}

        {isFieldAvailable('work_style') ? (
          <FieldShell label="When you need momentum, what helps most?" fieldId="work_style" voiceFilled={voiceFieldSet.has('work_style') || voiceFieldSet.has('momentum_source')}>
            <input
              value={readText('work_style')}
              onChange={(event) => setText('work_style', event.target.value)}
              placeholder="A template, a blank page, a conversation"
              className={inputBaseClass}
            />
          </FieldShell>
        ) : null}

        {isFieldAvailable('constraints') ? (
          <FieldShell label="Constraints we should respect?" fieldId="constraints" voiceFilled={voiceFieldSet.has('constraints')} wide>
            <input
              value={readText('constraints')}
              onChange={(event) => setText('constraints', event.target.value)}
              placeholder="Time, location, salary, caregiving, etc."
              className={inputBaseClass}
            />
          </FieldShell>
        ) : null}
      </div>

      <div className={`${cardClass} grid gap-6 md:grid-cols-2`}>
        <FieldShell label="Pace">
          <ChipGroup
            options={PACE_PREFS.map((value) => ({ label: value, value }))}
            selected={[pace]}
            onToggle={(value) => setPace(value as PacePreference)}
          />
        </FieldShell>

        <FieldShell label="Focus">
          <ChipGroup
            options={FOCUS_PREFS.map((value) => ({ label: value, value }))}
            selected={[focus]}
            onToggle={(value) => setFocus(value as FocusPreference)}
          />
        </FieldShell>
      </div>
    </section>
  );

  const renderNavigation = () => {
    const nextStep =
      step === 'screen_1'
        ? 'screen_2'
        : step === 'screen_2'
          ? 'screen_3'
          : step === 'screen_3'
            ? 'screen_4'
            : null;
    const previousStep =
      step === 'screen_2'
        ? 'screen_1'
        : step === 'screen_3'
          ? 'screen_2'
          : step === 'screen_4'
            ? 'screen_3'
            : null;

    if (!['screen_1', 'screen_2', 'screen_3', 'screen_4'].includes(step)) return null;

    return (
      <div className="flex flex-wrap items-center gap-3 pt-2">
        {previousStep ? (
          <button type="button" onClick={() => setStep(previousStep as Step)} className={secondaryButtonClass}>
            Back
          </button>
        ) : null}

        {step !== 'screen_1' && hasAutofillSource ? (
          <button type="button" onClick={() => applyProfileAutofill(step as Step, true)} className={secondaryButtonClass}>
            Autofill remainder
          </button>
        ) : null}

        {nextStep ? (
          <button type="button" onClick={() => setStep(nextStep as Step)} className={primaryButtonClass}>
            Continue
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={busy || voiceAutofillBusy} className={primaryButtonClass}>
            {busy ? 'Preparing...' : 'Prepare My Suite'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-[980px] space-y-8 bg-[var(--intake-bg)]" style={intakeTheme}>
      <div className="border border-[var(--intake-border-dark)] bg-[var(--intake-dark)] px-5 py-4 text-white md:px-6">
        <div className="font-intake-mono text-[9px] uppercase tracking-[0.18em] text-[#6BBFAF]">Professional DNA · Module 01/18</div>
      </div>

      <HeroVideoSection
        visible={props.intakeConfig.hero_visible}
        videoUrl={props.intakeConfig.hero_video_url}
        videoTitle={props.intakeConfig.hero_video_title}
        autoplayMuted={props.intakeConfig.hero_autoplay_muted}
        loop={props.intakeConfig.hero_loop}
        fallbackImageUrl={props.intakeConfig.hero_fallback_image_url}
      />

      <section className="space-y-4">
        <div className={labelClass}>Smart Start Intake</div>
        <h1 className="font-editorial text-5xl font-black tracking-tight text-[#1B1E1C]">A concierge conversation, tailored to you.</h1>
        <p className="max-w-3xl font-intake-body text-xl leading-relaxed text-[var(--intake-muted)]">
          No tests. No quiz energy. This is a serious intake that turns context into signal before we prepare the suite.
        </p>
      </section>

      {renderVoiceRail}
      {renderOperatorSpeedRun}

      {error ? (
        <div className="border border-[#C9853A] bg-[#F4E8DA] px-4 py-3 font-intake-body text-base leading-relaxed text-[#6E4318]">
          {error}
        </div>
      ) : null}

      {step === 'screen_1' ? renderScreenOne() : null}
      {step === 'screen_2' ? renderScreenTwo() : null}
      {step === 'screen_3' ? renderScreenThree() : null}
      {step === 'screen_4' ? renderScreenFour() : null}

      {renderNavigation()}

      {step === 'plating' ? (
        <section className="space-y-6 border border-[var(--intake-border)] bg-[var(--intake-cream)] p-5 md:p-6">
          <div>
            <div className={labelClass}>Preparing your suite</div>
            <div className="mt-4 font-editorial text-4xl font-black leading-[0.96] tracking-tight text-[#1B1E1C]">
              We are preparing your suite now.
            </div>
            <p className="mt-4 max-w-3xl font-intake-body text-lg leading-relaxed text-[var(--intake-muted)]">
              This is the intentional pause. Intake signals, market framing, and the research pass are being assembled into your Brief, Profile, and Plan.
            </p>
          </div>

          <DNAProgressIndicator stages={progressStages} />
        </section>
      ) : null}
    </div>
  );
}
