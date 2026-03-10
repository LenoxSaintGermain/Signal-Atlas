import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { AmbientGuide } from './AmbientGuide';
import { ClientDoc, PlanContent, SuiteModuleId } from '../types';

type Props = {
  client: ClientDoc | null;
  plan: PlanContent | null;
  planLoading?: boolean;
  isFreeTier?: boolean;
  onOpenModule?: (id: SuiteModuleId) => void;
};

type FlashViewMode = 'entry' | 'browser' | 'review' | 'recap';
type FlashConfidence = 'low' | 'medium' | 'high';
type FlashRoomSource = 'foundational' | 'plan' | 'episode';

type FlashCard = {
  id: string;
  roomId: string;
  front: string;
  back: string;
  anchor: string;
  sourceRef?: string;
};

type FlashRoom = {
  id: string;
  name: string;
  cue: string;
  source: FlashRoomSource;
  accent: string;
  cards: FlashCard[];
};

type FlashReviewRecord = {
  confidence: FlashConfidence;
  revealedAt: string;
  nextDueAt: string;
};

type FlashStoragePayload = {
  reviewState: Record<string, FlashReviewRecord>;
  lastRoomId?: string;
};

type SessionSummary = {
  reviewed: number;
  roomName: string;
};

const storageKey = (uid: string) => `skillsync-flashcards:${uid}`;

const cardStageTransition = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1] as const,
};

const shellTransition = {
  duration: 0.34,
  ease: [0.16, 1, 0.3, 1] as const,
};

const confidenceOptions: Array<{ value: FlashConfidence; label: string; note: string }> = [
  { value: 'low', label: 'Needs work', note: 'Bring this back into rotation soon.' },
  { value: 'medium', label: 'Getting there', note: 'Keep this nearby for the next pass.' },
  { value: 'high', label: 'Locked', note: 'Push this further out and make room for the next idea.' },
];

const roomAccents: Record<FlashRoomSource, string> = {
  foundational: '#3b8c87',
  plan: '#7f6b43',
  episode: '#425a74',
};

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const trimSentence = (value: string, fallback: string) => {
  const text = String(value || '').trim();
  if (!text) return fallback;
  return text.endsWith('.') ? text : `${text}.`;
};

const normalizeList = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((entry) => String(entry || '').trim()).filter(Boolean) : [];

const addHours = (date: Date, hours: number) => new Date(date.getTime() + hours * 60 * 60 * 1000);

const scheduleNextDue = (confidence: FlashConfidence, now = new Date()) => {
  if (confidence === 'low') return addHours(now, 3).toISOString();
  if (confidence === 'medium') return addHours(now, 20).toISOString();
  return addHours(now, 72).toISOString();
};

const confidenceScore = (confidence?: FlashConfidence) => {
  if (confidence === 'high') return 3;
  if (confidence === 'medium') return 2;
  if (confidence === 'low') return 1;
  return 0;
};

const parseStoredState = (raw: string | null): FlashStoragePayload => {
  if (!raw) return { reviewState: {} };
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed && typeof parsed === 'object' && 'reviewState' in parsed) {
      return {
        reviewState: ((parsed.reviewState as Record<string, FlashReviewRecord>) || {}) ?? {},
        lastRoomId: typeof parsed.lastRoomId === 'string' ? parsed.lastRoomId : undefined,
      };
    }

    // Migrate the old `{ [cardId]: "low" | "medium" | "high" }` shape.
    const migrated: Record<string, FlashReviewRecord> = {};
    Object.entries(parsed || {}).forEach(([cardId, value]) => {
      if (value === 'low' || value === 'medium' || value === 'high') {
        migrated[cardId] = {
          confidence: value,
          revealedAt: new Date(0).toISOString(),
          nextDueAt: new Date(0).toISOString(),
        };
      }
    });
    return { reviewState: migrated };
  } catch {
    return { reviewState: {} };
  }
};

const uniqueCards = (cards: FlashCard[]) => {
  const seen = new Set<string>();
  return cards.filter((card) => {
    if (seen.has(card.id)) return false;
    seen.add(card.id);
    return true;
  });
};

const buildFoundationalRoom = (client: ClientDoc | null): FlashRoom => {
  const answers = client?.intake?.answers ?? {};
  const focus = client?.preferences?.focus || 'skills';
  const target = String(answers.target || answers.current_or_target_job_title || 'your next role').trim();
  const outcomes = normalizeList(answers.outcomes_goals);
  const modalities = normalizeList(answers.learning_modalities);
  const constraints = String(answers.constraints || 'Time and clarity under pressure').trim();

  return {
    id: 'room-orientation',
    name: 'The Orientation Deck',
    cue: 'A calm front room for the signals that should stay in working memory.',
    source: 'foundational',
    accent: roomAccents.foundational,
    cards: uniqueCards([
      {
        id: 'fc-orientation-focus',
        roomId: 'room-orientation',
        front: 'What rail are you optimizing right now?',
        back: trimSentence(`Your current focus rail is ${focus}.`, 'Your current focus rail is skills.'),
        anchor: 'Picture a single lit corridor. Everything outside it is noise for now.',
      },
      {
        id: 'fc-orientation-target',
        roomId: 'room-orientation',
        front: 'What direction are these reps supposed to strengthen?',
        back: trimSentence(`The current target direction is ${target || 'your next role'}.`, 'The current target direction is your next role.'),
        anchor: 'Place the title on a brass plaque at the end of the room. It keeps the route honest.',
      },
      {
        id: 'fc-orientation-pressure',
        roomId: 'room-orientation',
        front: 'What is the real pressure point to design around?',
        back: trimSentence(`Primary constraint: ${constraints}.`, 'Primary constraint: time and clarity under pressure.'),
        anchor: 'Think of a narrowing doorway. The plan fails if it cannot fit through that frame.',
      },
      {
        id: 'fc-orientation-outcome',
        roomId: 'room-orientation',
        front: 'What outcome deserves repeated attention?',
        back: trimSentence(
          `Current outcome signal: ${outcomes[0] || 'professional momentum'}.`,
          'Current outcome signal: professional momentum.'
        ),
        anchor: 'Put the outcome in a glass case. If it is not visible, it will not guide the room.',
      },
      {
        id: 'fc-orientation-habit',
        roomId: 'room-orientation',
        front: 'What is the AI habit worth keeping?',
        back: 'Use AI for structured first drafts, then tighten the work with your own judgment.',
        anchor: 'Treat the model like a fast junior partner, not the final signatory.',
      },
      {
        id: 'fc-orientation-modality',
        roomId: 'room-orientation',
        front: 'What learning mode should the room respect?',
        back: trimSentence(
          `Primary learning signal: ${modalities[0] || 'Short applied repetitions with clear relevance'}.`,
          'Primary learning signal: short applied repetitions with clear relevance.'
        ),
        anchor: 'The room should meet you in the form you actually absorb, not the form that looks clever.',
      },
    ]),
  };
};

const buildPlanRooms = (plan: PlanContent | null): FlashRoom[] => {
  if (!plan) return [];

  const next72 = Array.isArray(plan.next_72_hours) ? plan.next_72_hours : [];
  const next2Weeks = plan.next_2_weeks ?? { goal: '', cadence: [] };
  const needs = Array.isArray(plan.needs_from_you) ? plan.needs_from_you : [];

  const actionCards = uniqueCards(
    next72.map((task, index) => ({
      id: `fc-action-${toSlug(task.id || String(index)) || index}`,
      roomId: 'room-action-desk',
      front: `What visible move sits in the next 72 hours?`,
      back: trimSentence(task.label, 'Protect one visible action block this week.'),
      anchor: 'See a clean desk with one file open. Momentum comes from the next file, not the whole archive.',
      sourceRef: 'plan.next_72_hours',
    }))
  );

  const sprintCards = uniqueCards([
    {
      id: 'fc-sprint-goal',
      roomId: 'room-sprint-lab',
      front: 'What is the two-week sprint trying to change?',
      back: trimSentence(next2Weeks.goal || 'Create proof of movement over the next two weeks.', 'Create proof of movement over the next two weeks.'),
      anchor: 'Think of a long table with one headline at the center. If the sprint cannot fit under that headline, it is drift.',
      sourceRef: 'plan.next_2_weeks.goal',
    },
    ...normalizeList(next2Weeks.cadence).map((step, index) => ({
      id: `fc-sprint-step-${index + 1}`,
      roomId: 'room-sprint-lab',
      front: `What cadence move belongs in the sprint rhythm?`,
      back: trimSentence(step, 'Keep the sprint cadence visible and repeatable.'),
      anchor: 'Place each cadence step as a marker on the floor. Repetition is the architecture of recall.',
      sourceRef: 'plan.next_2_weeks.cadence',
    })),
  ]);

  const pressureCards = uniqueCards(
    needs.map((need, index) => ({
      id: `fc-pressure-${index + 1}`,
      roomId: 'room-pressure-vault',
      front: 'What condition needs your cooperation before this plan works?',
      back: trimSentence(need, 'Give the plan a real block of time and visible follow-through.'),
      anchor: 'Picture a vault door with three tumblers. The plan opens only when your behavior meets the mechanism.',
      sourceRef: 'plan.needs_from_you',
    }))
  );

  const rooms: FlashRoom[] = [];
  if (actionCards.length) {
    rooms.push({
      id: 'room-action-desk',
      name: 'The Action Desk',
      cue: 'This room holds the next visible moves. It should feel crisp, not crowded.',
      source: 'plan',
      accent: roomAccents.plan,
      cards: actionCards,
    });
  }
  if (sprintCards.length) {
    rooms.push({
      id: 'room-sprint-lab',
      name: 'The Sprint Lab',
      cue: 'Patterns live here. The goal is cadence, not adrenaline.',
      source: 'plan',
      accent: roomAccents.plan,
      cards: sprintCards,
    });
  }
  if (pressureCards.length) {
    rooms.push({
      id: 'room-pressure-vault',
      name: 'The Pressure Vault',
      cue: 'Constraints deserve a room of their own. They shape what actually survives contact.',
      source: 'plan',
      accent: roomAccents.plan,
      cards: pressureCards,
    });
  }
  return rooms;
};

const buildRooms = (client: ClientDoc | null, plan: PlanContent | null, isFreeTier: boolean) => {
  const foundationalRooms = [buildFoundationalRoom(client)];
  if (isFreeTier) return foundationalRooms;
  return [...foundationalRooms, ...buildPlanRooms(plan)];
};

const isDue = (record?: FlashReviewRecord | null) => {
  if (!record) return true;
  return new Date(record.nextDueAt).getTime() <= Date.now();
};

const buildSessionCardIds = (room: FlashRoom, reviewState: Record<string, FlashReviewRecord>, limit = 6) => {
  const cards = [...room.cards];
  const due = cards.filter((card) => isDue(reviewState[card.id]));
  const unseen = cards.filter((card) => !reviewState[card.id]);
  const later = cards
    .filter((card) => reviewState[card.id] && !isDue(reviewState[card.id]))
    .sort((a, b) => {
      const aTime = new Date(reviewState[a.id].nextDueAt).getTime();
      const bTime = new Date(reviewState[b.id].nextDueAt).getTime();
      return aTime - bTime;
    });

  return uniqueCards([...due, ...unseen, ...later])
    .slice(0, Math.min(limit, room.cards.length))
    .map((card) => card.id);
};

const prettySource = (source: FlashRoomSource) => {
  if (source === 'plan') return 'Plan';
  if (source === 'episode') return 'Episodes';
  return 'Foundation';
};

const dueLabel = (record?: FlashReviewRecord | null) => {
  if (!record || isDue(record)) return 'Due now';
  const hours = Math.round((new Date(record.nextDueAt).getTime() - Date.now()) / (1000 * 60 * 60));
  if (hours <= 12) return 'Later today';
  if (hours <= 36) return 'Tomorrow';
  return 'Later';
};

const roomAverage = (room: FlashRoom, reviewState: Record<string, FlashReviewRecord>) => {
  const scores = room.cards
    .map((card) => confidenceScore(reviewState[card.id]?.confidence))
    .filter((score) => score > 0);
  if (!scores.length) return 0;
  return scores.reduce((total, score) => total + score, 0) / scores.length;
};

const roomDueCount = (room: FlashRoom, reviewState: Record<string, FlashReviewRecord>) =>
  room.cards.filter((card) => isDue(reviewState[card.id])).length;

const roomCompletion = (room: FlashRoom, reviewState: Record<string, FlashReviewRecord>) => {
  if (!room.cards.length) return 0;
  const reviewedCount = room.cards.filter((card) => Boolean(reviewState[card.id])).length;
  return Math.round((reviewedCount / room.cards.length) * 100);
};

const strongestWeakest = (rooms: FlashRoom[], reviewState: Record<string, FlashReviewRecord>) => {
  const ranked = rooms
    .map((room) => ({ room, average: roomAverage(room, reviewState) }))
    .filter((entry) => entry.average > 0);
  if (!ranked.length) return { strongest: rooms[0] ?? null, weakest: rooms[0] ?? null };
  ranked.sort((a, b) => b.average - a.average);
  return {
    strongest: ranked[0]?.room ?? null,
    weakest: ranked[ranked.length - 1]?.room ?? null,
  };
};

const todayCount = (reviewState: Record<string, FlashReviewRecord>) => {
  const now = new Date();
  return Object.values(reviewState).filter((record) => {
    const date = new Date(record.revealedAt);
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }).length;
};

export function FlashCardsView({ client, plan, planLoading = false, isFreeTier = false, onOpenModule }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const [mode, setMode] = useState<FlashViewMode>('entry');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewState, setReviewState] = useState<Record<string, FlashReviewRecord>>({});
  const [sessionCardIds, setSessionCardIds] = useState<string[]>([]);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const advanceTimeoutRef = useRef<number | null>(null);

  const rooms = useMemo(() => buildRooms(client, plan, isFreeTier), [client, plan, isFreeTier]);

  useEffect(() => {
    if (!client?.uid) return;
    const stored = parseStoredState(window.localStorage.getItem(storageKey(client.uid)));
    setReviewState(stored.reviewState);
    setActiveRoomId(stored.lastRoomId ?? null);
  }, [client?.uid]);

  useEffect(() => {
    if (!client?.uid) return;
    window.localStorage.setItem(
      storageKey(client.uid),
      JSON.stringify({
        reviewState,
        lastRoomId: activeRoomId ?? undefined,
      } satisfies FlashStoragePayload)
    );
  }, [activeRoomId, client?.uid, reviewState]);

  useEffect(() => {
    if (!rooms.length) {
      setActiveRoomId(null);
      return;
    }
    if (activeRoomId && rooms.some((room) => room.id === activeRoomId)) return;

    const dueRoom = rooms
      .map((room) => ({ room, dueCount: roomDueCount(room, reviewState) }))
      .sort((a, b) => b.dueCount - a.dueCount)[0]?.room;

    setActiveRoomId(dueRoom?.id ?? rooms[0].id);
  }, [activeRoomId, reviewState, rooms]);

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current !== null) window.clearTimeout(advanceTimeoutRef.current);
    };
  }, []);

  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId) ?? rooms[0] ?? null,
    [activeRoomId, rooms]
  );

  const sessionCards = useMemo(() => {
    if (!activeRoom) return [];
    const byId = new Map(activeRoom.cards.map((card) => [card.id, card]));
    const ordered = sessionCardIds.map((id) => byId.get(id)).filter(Boolean) as FlashCard[];
    if (ordered.length) return ordered;
    return activeRoom.cards.slice(0, Math.min(activeRoom.cards.length, 6));
  }, [activeRoom, sessionCardIds]);

  const currentCard = sessionCards[activeCardIndex] ?? null;
  const dueNowCount = useMemo(
    () => rooms.reduce((total, room) => total + roomDueCount(room, reviewState), 0),
    [reviewState, rooms]
  );
  const reviewedToday = useMemo(() => todayCount(reviewState), [reviewState]);
  const completionByRoom = useMemo(
    () =>
      rooms.map((room) => ({
        room,
        dueCount: roomDueCount(room, reviewState),
        completion: roomCompletion(room, reviewState),
        average: roomAverage(room, reviewState),
      })),
    [reviewState, rooms]
  );
  const { strongest, weakest } = useMemo(() => strongestWeakest(rooms, reviewState), [reviewState, rooms]);

  const startRoom = (room: FlashRoom) => {
    const ids = buildSessionCardIds(room, reviewState, 6);
    setActiveRoomId(room.id);
    setSessionCardIds(ids);
    setActiveCardIndex(0);
    setRevealed(false);
    setSessionSummary(null);
    setMode('review');
  };

  const handleRate = (confidence: FlashConfidence) => {
    if (!client?.uid || !currentCard || !activeRoom) return;
    const now = new Date();
    setReviewState((prev) => ({
      ...prev,
      [currentCard.id]: {
        confidence,
        revealedAt: now.toISOString(),
        nextDueAt: scheduleNextDue(confidence, now),
      },
    }));

    if (advanceTimeoutRef.current !== null) window.clearTimeout(advanceTimeoutRef.current);
    advanceTimeoutRef.current = window.setTimeout(() => {
      const nextIndex = activeCardIndex + 1;
      if (nextIndex >= sessionCards.length) {
        setSessionSummary({ reviewed: sessionCards.length, roomName: activeRoom.name });
        setMode('recap');
        setActiveCardIndex(0);
        setRevealed(false);
        return;
      }
      setActiveCardIndex(nextIndex);
      setRevealed(false);
    }, prefersReducedMotion ? 90 : 170);
  };

  if (!client) {
    return <div className="border border-black/10 bg-[#fbf8f2] p-6 text-sm text-black/55">Complete intake to generate flash cards.</div>;
  }

  const recommendedRoom = activeRoom ?? rooms[0] ?? null;

  return (
    <LayoutGroup id="flash-cards">
      <div className="relative overflow-hidden border border-black/8 bg-[#f5f1e9] text-[#1f1b18] shadow-[0_30px_80px_-48px_rgba(25,22,18,0.45)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,140,135,0.13),transparent_28%),radial-gradient(circle_at_top_right,rgba(66,90,116,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.55),rgba(245,241,233,0.96))]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.85),transparent)]" />

        <div className="relative p-5 md:p-7">
          <div className="flex flex-col gap-4 border-b border-black/8 pb-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <div className="text-[10px] uppercase tracking-[0.28em] text-brand-teal">Flash Cards</div>
              <h2 className="mt-3 text-3xl font-editorial leading-tight md:text-5xl">Memory routes for your current learning arc.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-black/60 md:text-[15px]">
                Short bingeable review runs tied to your plan, with room cues strong enough to make the ideas easier to retrieve later.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] uppercase tracking-[0.18em] md:min-w-[320px]">
              <div className="border border-black/8 bg-white/55 px-3 py-3">
                <div className="text-black/40">Due now</div>
                <div className="mt-2 text-lg tracking-[0.08em] text-black/78">{String(dueNowCount).padStart(2, '0')}</div>
              </div>
              <div className="border border-black/8 bg-white/55 px-3 py-3">
                <div className="text-black/40">Rooms</div>
                <div className="mt-2 text-lg tracking-[0.08em] text-black/78">{String(rooms.length).padStart(2, '0')}</div>
              </div>
              <div className="border border-black/8 bg-white/55 px-3 py-3">
                <div className="text-black/40">Reviewed today</div>
                <div className="mt-2 text-lg tracking-[0.08em] text-black/78">{String(reviewedToday).padStart(2, '0')}</div>
              </div>
              <div className="border border-black/8 bg-white/55 px-3 py-3">
                <div className="text-black/40">State</div>
                <div className="mt-2 text-sm tracking-[0.12em] text-black/72">{mode === 'review' ? 'In review' : 'Ready'}</div>
              </div>
            </div>
          </div>

          {planLoading && !plan && !isFreeTier && (
            <div className="mt-4 border border-black/8 bg-white/45 px-4 py-3 text-xs uppercase tracking-[0.18em] text-black/48">
              Loading plan signals...
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-black/45">
            {strongest && (
              <span className="border border-black/8 bg-white/45 px-3 py-2">
                Strongest room: <span className="text-black/72">{strongest.name}</span>
              </span>
            )}
            {weakest && (
              <span className="border border-black/8 bg-white/45 px-3 py-2">
                Needs review: <span className="text-black/72">{weakest.name}</span>
              </span>
            )}
            {isFreeTier && <span className="border border-black/8 bg-[#edf7f6] px-3 py-2 text-brand-teal">Foundation access</span>}
          </div>

          <div className="mt-7">
            <AnimatePresence mode="wait">
              {mode === 'entry' && recommendedRoom && (
                <motion.div
                  key="entry"
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
                  transition={shellTransition}
                  className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_340px]"
                >
                  <motion.button
                    layoutId={`flash-room-${recommendedRoom.id}`}
                    type="button"
                    onClick={() => startRoom(recommendedRoom)}
                    className="group relative overflow-hidden border border-black/10 bg-[linear-gradient(140deg,rgba(255,255,255,0.82),rgba(247,243,236,0.92))] p-6 text-left shadow-[0_28px_72px_-48px_rgba(0,0,0,0.45)] transition-colors hover:border-black/18 md:p-7"
                  >
                    <div
                      className="pointer-events-none absolute inset-0 opacity-90"
                      style={{
                        background: `radial-gradient(circle at top left, ${recommendedRoom.accent}1f, transparent 36%), linear-gradient(180deg, rgba(255,255,255,0.64), rgba(255,255,255,0))`,
                      }}
                    />
                    <div className="relative">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-black/42">
                        <span>{prettySource(recommendedRoom.source)}</span>
                        <span className="h-1 w-1 rounded-full bg-black/18" />
                        <span>{roomDueCount(recommendedRoom, reviewState)} due</span>
                      </div>
                      <div className="mt-6 max-w-xl">
                        <div className="text-4xl font-editorial leading-none md:text-5xl">{recommendedRoom.name}</div>
                        <p className="mt-4 max-w-lg text-sm leading-6 text-black/62 md:text-[15px]">{recommendedRoom.cue}</p>
                      </div>
                      <div className="mt-8 flex flex-wrap gap-3">
                        <span className="border border-black/10 bg-white/72 px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-black/72">
                          Resume review
                        </span>
                        <span className="border border-black/10 bg-white/48 px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-black/52">
                          {roomCompletion(recommendedRoom, reviewState)}% familiar
                        </span>
                      </div>
                    </div>
                  </motion.button>

                  <div className="grid gap-3">
                    <div className="border border-black/8 bg-white/48 p-4">
                      <div className="text-[10px] uppercase tracking-[0.24em] text-black/40">Best room to continue</div>
                      <div className="mt-3 text-2xl font-editorial">{recommendedRoom.name}</div>
                      <div className="mt-2 text-sm leading-6 text-black/58">{dueNowCount ? 'Your next due cards are already surfaced.' : 'Nothing is urgent, so keep the streak warm.'}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => recommendedRoom && startRoom(recommendedRoom)}
                      className="border border-black/10 bg-[#17262b] px-4 py-4 text-left text-[10px] uppercase tracking-[0.22em] text-[#f3ede3] transition-colors hover:bg-[#20343a]"
                    >
                      Start room
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('browser')}
                      className="border border-black/10 bg-white/56 px-4 py-4 text-left text-[10px] uppercase tracking-[0.22em] text-black/62 transition-colors hover:border-black/18"
                    >
                      Browse rooms
                    </button>
                  </div>
                </motion.div>
              )}

              {mode === 'browser' && (
                <motion.div
                  key="browser"
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
                  transition={shellTransition}
                  className="space-y-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.24em] text-black/40">Browse rooms</div>
                      <div className="mt-2 text-2xl font-editorial">Choose the room you want to rehearse.</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMode('entry')}
                      className="border border-black/10 bg-white/56 px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-black/60"
                    >
                      Back
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {completionByRoom.map(({ room, dueCount, completion, average }, index) => (
                      <motion.button
                        key={room.id}
                        layoutId={`flash-room-${room.id}`}
                        type="button"
                        onClick={() => startRoom(room)}
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...shellTransition, delay: prefersReducedMotion ? 0 : index * 0.05 }}
                        className="group relative overflow-hidden border border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.74),rgba(248,244,237,0.94))] p-5 text-left shadow-[0_20px_56px_-42px_rgba(0,0,0,0.42)] transition-colors hover:border-black/18"
                      >
                        <div
                          className="pointer-events-none absolute inset-x-0 top-0 h-1"
                          style={{ backgroundColor: room.accent }}
                        />
                        <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] text-black/42">
                          <span>{prettySource(room.source)}</span>
                          <span>{dueCount} due</span>
                        </div>
                        <div className="mt-5 text-2xl font-editorial leading-tight">{room.name}</div>
                        <p className="mt-3 text-sm leading-6 text-black/58">{room.cue}</p>
                        <div className="mt-6 grid grid-cols-2 gap-2 text-[10px] uppercase tracking-[0.18em] text-black/44">
                          <span className="border border-black/8 bg-white/56 px-3 py-2">{completion}% familiar</span>
                          <span className="border border-black/8 bg-white/56 px-3 py-2">
                            {average > 0 ? `${average.toFixed(1)} strength` : 'New room'}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {mode === 'review' && activeRoom && currentCard && (
                <motion.div
                  key={`review-${activeRoom.id}-${currentCard.id}`}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -18 }}
                  transition={shellTransition}
                  className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]"
                >
                  <div className="relative">
                    <motion.div
                      layoutId={`flash-room-${activeRoom.id}`}
                      className="relative overflow-hidden border border-black/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.92),rgba(245,241,233,0.96))] p-6 shadow-[0_36px_96px_-54px_rgba(0,0,0,0.5)] md:p-8"
                    >
                      <div
                        className="pointer-events-none absolute inset-0 opacity-85"
                        style={{
                          background: `radial-gradient(circle at top left, ${activeRoom.accent}22, transparent 38%), linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0))`,
                        }}
                      />
                      <div className="relative">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/8 pb-4">
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.22em] text-black/40">{activeRoom.name}</div>
                            <div className="mt-2 text-sm leading-6 text-black/56">{activeRoom.cue}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <AmbientGuide
                              align="right"
                              label="Room cue"
                              message="This cue is the memory location. Let it hold the logic of the room while you move through the cards."
                            >
                              <span className="border border-black/8 bg-white/60 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-black/56">
                                Why this room
                              </span>
                            </AmbientGuide>
                            <button
                              type="button"
                              onClick={() => {
                                setMode('browser');
                                setRevealed(false);
                              }}
                              className="border border-black/8 bg-white/56 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-black/60"
                            >
                              Rooms
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] text-black/40">
                          <span>
                            Card {String(activeCardIndex + 1).padStart(2, '0')} / {String(sessionCards.length).padStart(2, '0')}
                          </span>
                          <span>{dueLabel(reviewState[currentCard.id])}</span>
                        </div>

                        <div className="mt-5 min-h-[360px] md:min-h-[420px]">
                          <div className="relative mx-auto flex h-full max-w-3xl items-center justify-center">
                            {!prefersReducedMotion && (
                              <>
                                <div className="pointer-events-none absolute inset-x-10 top-8 h-[82%] rounded-[32px] border border-black/6 bg-[#f2ece3] opacity-80 shadow-[0_18px_48px_-40px_rgba(0,0,0,0.4)]" />
                                <div className="pointer-events-none absolute inset-x-6 top-4 h-[88%] rounded-[34px] border border-black/6 bg-[#f7f3ec] opacity-75 shadow-[0_22px_52px_-42px_rgba(0,0,0,0.45)]" />
                              </>
                            )}

                            <AnimatePresence mode="wait">
                              <motion.div
                                key={`${currentCard.id}-${revealed ? 'back' : 'front'}`}
                                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.98, rotateX: 4 }}
                                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.985, y: -10 }}
                                transition={cardStageTransition}
                                className="relative w-full rounded-[30px] border border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,244,237,0.98))] p-6 shadow-[0_40px_100px_-56px_rgba(0,0,0,0.52)] md:p-8"
                              >
                                <div className="text-[10px] uppercase tracking-[0.22em] text-black/36">
                                  {revealed ? 'Answer' : 'Prompt'}
                                </div>
                                <div className="mt-6 text-3xl font-editorial leading-tight md:text-5xl">
                                  {revealed ? currentCard.back : currentCard.front}
                                </div>
                                <AnimatePresence>
                                  {revealed && (
                                    <motion.div
                                      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                                      transition={{ ...cardStageTransition, delay: prefersReducedMotion ? 0 : 0.08 }}
                                      className="mt-8 border-t border-black/8 pt-5 text-sm italic leading-6 text-black/58 md:text-[15px]"
                                    >
                                      {currentCard.anchor}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            </AnimatePresence>
                          </div>
                        </div>

                        {!revealed ? (
                          <div className="mt-6 flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setRevealed(true)}
                              className="border border-black/10 bg-[#17262b] px-5 py-3 text-[10px] uppercase tracking-[0.22em] text-[#f5efe6] transition-colors hover:bg-[#21373d]"
                            >
                              Reveal answer
                            </button>
                            <div className="text-[11px] leading-6 text-black/50">
                              Pause for a beat before revealing. The room only works if you let recall happen first.
                            </div>
                          </div>
                        ) : (
                          <div className="mt-6 space-y-3">
                            <div className="text-[10px] uppercase tracking-[0.22em] text-black/40">How stable does this feel?</div>
                            <div className="grid gap-2 md:grid-cols-3">
                              {confidenceOptions.map((option) => {
                                const isCurrent = reviewState[currentCard.id]?.confidence === option.value;
                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleRate(option.value)}
                                    className={`w-full border px-4 py-4 text-left transition-colors ${
                                      isCurrent
                                        ? 'border-brand-teal bg-[#eaf8f7] text-brand-teal'
                                        : 'border-black/10 bg-white/62 text-black/72 hover:border-black/18'
                                    }`}
                                  >
                                    <div className="text-[10px] uppercase tracking-[0.22em]">{option.label}</div>
                                    <div className="mt-2 text-sm leading-6 opacity-72">{option.note}</div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>

                  <div className="grid gap-3 self-start xl:pt-4">
                    <div className="border border-black/8 bg-white/56 p-4">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-black/40">Room posture</div>
                      <div className="mt-3 text-xl font-editorial">{prettySource(activeRoom.source)}</div>
                      <div className="mt-2 text-sm leading-6 text-black/56">{activeRoom.cards.length} total cards in this room.</div>
                    </div>
                    <div className="border border-black/8 bg-white/56 p-4">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-black/40">Progress</div>
                      <div className="mt-3 text-3xl font-editorial">{roomCompletion(activeRoom, reviewState)}%</div>
                      <div className="mt-2 text-sm leading-6 text-black/56">Review state stays local in this pass, so the room remains fast and private.</div>
                    </div>
                    <div className="border border-black/8 bg-white/56 p-4">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-black/40">After this run</div>
                      <div className="mt-3 text-sm leading-6 text-black/58">
                        Use recap to jump back into your plan or reopen the next room without losing your rhythm.
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {mode === 'recap' && sessionSummary && (
                <motion.div
                  key="recap"
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
                  transition={shellTransition}
                  className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"
                >
                  <div className="border border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.76),rgba(247,243,236,0.94))] p-6 shadow-[0_28px_72px_-48px_rgba(0,0,0,0.48)] md:p-7">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-black/40">Run complete</div>
                    <div className="mt-5 text-4xl font-editorial leading-none md:text-5xl">You reviewed {sessionSummary.reviewed} cards in {sessionSummary.roomName}.</div>
                    <div className="mt-5 max-w-2xl text-sm leading-6 text-black/58 md:text-[15px]">
                      Close the loop while the pattern is still warm. Either send the strongest room back into the background or move straight into a related module.
                    </div>

                    <div className="mt-8 grid gap-3 md:grid-cols-3">
                      {[
                        { label: 'Strongest room', value: strongest?.name || sessionSummary.roomName },
                        { label: 'Needs review', value: weakest?.name || sessionSummary.roomName },
                        { label: 'Due now', value: `${dueNowCount}` },
                      ].map((item, index) => (
                        <motion.div
                          key={item.label}
                          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ ...cardStageTransition, delay: prefersReducedMotion ? 0 : index * 0.05 }}
                          className="border border-black/8 bg-white/56 px-4 py-4"
                        >
                          <div className="text-[10px] uppercase tracking-[0.18em] text-black/40">{item.label}</div>
                          <div className="mt-3 text-xl font-editorial">{item.value}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 self-start">
                    <button
                      type="button"
                      onClick={() => (recommendedRoom ? startRoom(recommendedRoom) : setMode('browser'))}
                      className="border border-black/10 bg-[#17262b] px-4 py-4 text-left text-[10px] uppercase tracking-[0.22em] text-[#f3ede3]"
                    >
                      Continue review
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('browser')}
                      className="border border-black/10 bg-white/56 px-4 py-4 text-left text-[10px] uppercase tracking-[0.22em] text-black/60"
                    >
                      Browse rooms
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenModule?.('plan')}
                      className="border border-black/10 bg-white/56 px-4 py-4 text-left text-[10px] uppercase tracking-[0.22em] text-black/60"
                    >
                      Open plan
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenModule?.('episodes')}
                      className="border border-black/10 bg-white/56 px-4 py-4 text-left text-[10px] uppercase tracking-[0.22em] text-black/60"
                    >
                      Return to episodes
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </LayoutGroup>
  );
}
