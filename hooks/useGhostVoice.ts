import { useState, useCallback, useRef } from 'react';

export interface GhostAction {
  id: string;
  tool: string;
  params: Record<string, unknown>;
  timestamp: number;
}

export interface GhostCallbacks {
  onNavigateModule: (target: string) => void;
  onCloseModule: () => void;
  onToggleAdmin: () => void;
  onDispatchAgent: (codename: string) => void;
  onUpdateStance: (stance: 'delegator' | 'copilot') => void;
  onAddressGap: (gapId: string) => void;
}

/**
 * Ghost client tool handlers.
 * Returns a clientTools map compatible with @elevenlabs/react useConversation
 * and a log of recent actions for the GhostActionFeed.
 */
export function useGhostVoice(callbacks: GhostCallbacks) {
  const [actionLog, setActionLog] = useState<GhostAction[]>([]);
  const [connected, setConnected] = useState(false);
  const idCounter = useRef(0);

  const logAction = useCallback((tool: string, params: Record<string, unknown>) => {
    const id = `ghost-${++idCounter.current}`;
    const action: GhostAction = { id, tool, params, timestamp: Date.now() };
    setActionLog((prev) => [action, ...prev].slice(0, 20));
    return action;
  }, []);

  const clientTools = {
    navigate_module: (parameters: { target: string }) => {
      logAction('navigate_module', parameters);
      callbacks.onNavigateModule(parameters.target);
      return 'Routed.';
    },
    close_module: () => {
      logAction('close_module', {});
      callbacks.onCloseModule();
      return 'Closed.';
    },
    toggle_admin: () => {
      logAction('toggle_admin', {});
      callbacks.onToggleAdmin();
      return 'Toggled.';
    },
    dispatch_agent: (parameters: { codename: string }) => {
      logAction('dispatch_agent', parameters);
      callbacks.onDispatchAgent(parameters.codename);
      return 'Dispatched.';
    },
    update_stance: (parameters: { stance: 'delegator' | 'copilot' }) => {
      logAction('update_stance', parameters);
      callbacks.onUpdateStance(parameters.stance);
      return 'Stance updated.';
    },
    address_gap: (parameters: { gap_id: string }) => {
      logAction('address_gap', parameters);
      callbacks.onAddressGap(parameters.gap_id);
      return 'Gap addressed.';
    },
  };

  return {
    clientTools,
    actionLog,
    connected,
    setConnected,
  };
}
