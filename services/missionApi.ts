import { auth } from './firebase';
import { Mission } from '../types';
import { resolveApiOrigin } from './apiOrigin';

const authedFetch = async (path: string, options: RequestInit = {}) => {
  const origin = resolveApiOrigin();
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();

  const resp = await fetch(`${origin}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`API error (${resp.status}): ${txt || resp.statusText}`);
  }

  return resp.json();
};

export const missionSweep = (triggerEvent: string): Promise<{ missions: Mission[] }> =>
  authedFetch('/v1/missions/sweep', {
    method: 'POST',
    body: JSON.stringify({ trigger_event: triggerEvent }),
  });

export const missionDispatch = (agentCodename: string, instructions?: string): Promise<{ mission: Mission }> =>
  authedFetch('/v1/missions/dispatch', {
    method: 'POST',
    body: JSON.stringify({ agent_codename: agentCodename, instructions }),
  });

export const missionAccept = (missionId: string): Promise<{ mission: Mission }> =>
  authedFetch(`/v1/missions/${missionId}/accept`, { method: 'POST' });

export const missionRevise = (missionId: string, note: string): Promise<{ mission: Mission }> =>
  authedFetch(`/v1/missions/${missionId}/revise`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });

export const missionDismiss = (missionId: string): Promise<{ mission: Mission }> =>
  authedFetch(`/v1/missions/${missionId}/dismiss`, { method: 'POST' });

export const missionUndo = (missionId: string): Promise<{ mission: Mission }> =>
  authedFetch(`/v1/missions/${missionId}/undo`, { method: 'POST' });

export const updateStance = (stance: 'delegator' | 'copilot'): Promise<void> =>
  authedFetch('/v1/ai-profile/stance', {
    method: 'PATCH',
    body: JSON.stringify({ stance }),
  });
