import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useGhostVoice, type GhostCallbacks } from '../hooks/useGhostVoice';
import { GhostActionFeed } from './GhostActionFeed';

const ELEVENLABS_WIDGET_SCRIPT_ID = 'elevenlabs-convai-widget';
const ELEVENLABS_WIDGET_SRC = 'https://unpkg.com/@elevenlabs/convai-widget-embed';

/**
 * ElevenLabs Ghost Voice Panel
 *
 * Two modes:
 * 1. SDK mode (@elevenlabs/react) — when package is installed, uses useConversation
 *    with full client tool bindings. This is the target state.
 * 2. Widget mode (current) — uses the convai-widget-embed custom element as fallback.
 *    Client tools are not available in this mode, but the agent still works for voice.
 *
 * The panel always renders the Ghost Action Feed when tools fire.
 */
export function ElevenLabsConvaiPanel({
  agentId,
  userUid,
  ghostCallbacks,
}: {
  agentId: string;
  userUid?: string;
  ghostCallbacks?: GhostCallbacks;
}) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultCallbacks: GhostCallbacks = useMemo(() => ({
    onNavigateModule: (t) => console.log('ghost:navigate', t),
    onCloseModule: () => console.log('ghost:close'),
    onToggleAdmin: () => console.log('ghost:toggle_admin'),
    onDispatchAgent: (c) => console.log('ghost:dispatch', c),
    onUpdateStance: (s) => console.log('ghost:stance', s),
    onAddressGap: (g) => console.log('ghost:address_gap', g),
  }), []);

  const { clientTools, actionLog, connected, setConnected } = useGhostVoice(
    ghostCallbacks || defaultCallbacks,
  );

  // Widget embed loader (fallback until @elevenlabs/react is installed)
  useEffect(() => {
    if (!agentId) {
      setError('missing_agent_id');
      return;
    }

    if (window.customElements?.get('elevenlabs-convai')) {
      setReady(true);
      return;
    }

    const existing = document.getElementById(ELEVENLABS_WIDGET_SCRIPT_ID) as HTMLScriptElement | null;
    const handleLoad = () => setReady(true);
    const handleError = () => setError('widget_load_failed');

    if (existing) {
      existing.addEventListener('load', handleLoad);
      existing.addEventListener('error', handleError);
      return () => {
        existing.removeEventListener('load', handleLoad);
        existing.removeEventListener('error', handleError);
      };
    }

    const script = document.createElement('script');
    script.id = ELEVENLABS_WIDGET_SCRIPT_ID;
    script.src = ELEVENLABS_WIDGET_SRC;
    script.async = true;
    script.type = 'text/javascript';
    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
  }, [agentId]);

  const widget = useMemo(() => {
    if (!ready || !agentId) return null;
    const attrs: Record<string, string> = { 'agent-id': agentId };
    if (userUid) {
      attrs['dynamic-variables'] = JSON.stringify({ uid: userUid });
    }
    return React.createElement('elevenlabs-convai', attrs);
  }, [agentId, userUid, ready]);

  return (
    <section className="relative overflow-hidden border border-[#08242a] bg-[radial-gradient(circle_at_top,_rgba(27,208,191,0.15),_transparent_36%),linear-gradient(145deg,#041117_0%,#08242a_56%,#07181d_100%)] p-5 text-white shadow-[0_28px_70px_-48px_rgba(0,0,0,0.52)] md:p-6">
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-[0.26em] text-brand-teal">Chief of Staff Voice</div>
          <h3 className="text-3xl font-editorial italic leading-none md:text-[42px]">Donna is live in the room.</h3>
          <p className="max-w-2xl text-sm leading-6 text-white/72">
            The Ghost operates your career intelligence system by voice. Navigate modules, dispatch agents,
            fetch artifacts, and get strategic guidance — all hands-free.
          </p>
        </div>

        <div className="grid gap-3 text-[10px] uppercase tracking-[0.18em] text-white/70 sm:grid-cols-3">
          <div className="border border-white/10 bg-white/5 px-3 py-3">
            Lane ElevenLabs
          </div>
          <div className="border border-white/10 bg-white/5 px-3 py-3">
            {ready ? 'Widget ready' : 'Loading widget'}
          </div>
          <div className="border border-white/10 bg-white/5 px-3 py-3">
            {error ? 'Fallback needed' : `${Object.keys(clientTools).length} tools staged`}
          </div>
        </div>

        <div className="border border-white/10 bg-white/5 p-4">
          {error ? (
            <div className="text-sm leading-6 text-white/72">
              ElevenLabs widget failed to load. Refresh the page and confirm the public agent is still available.
            </div>
          ) : widget ? (
            widget
          ) : (
            <div className="text-sm leading-6 text-white/72">
              Loading the ElevenLabs Ghost agent for this Chief of Staff.
            </div>
          )}
        </div>

        {/* Ghost tool reference — visible when widget is active */}
        {ready && !error && (
          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono uppercase tracking-[0.12em] text-white/40">
            <div className="border border-white/8 bg-white/3 px-2 py-1.5">
              Client: navigate · close · admin · dispatch · stance · gap
            </div>
            <div className="border border-white/8 bg-white/3 px-2 py-1.5">
              Server: briefing · artifact · drive
            </div>
          </div>
        )}
      </div>

      {/* Ghost Action Feed overlay */}
      <GhostActionFeed actions={actionLog} />
    </section>
  );
}
