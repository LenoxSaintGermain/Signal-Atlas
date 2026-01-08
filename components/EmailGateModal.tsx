import React from 'react';

interface EmailGateModalProps {
  isOpen: boolean;
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  loading?: boolean;
  error?: string | null;
}

const EmailGateModal: React.FC<EmailGateModalProps> = ({
  isOpen,
  email,
  onEmailChange,
  onSubmit,
  onClose,
  loading = false,
  error = null,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#0b0b0b] border border-white/10 rounded-lg w-full max-w-lg shadow-[0_40px_120px_rgba(0,0,0,0.55)] relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/10 via-white/40 to-white/10" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
          aria-label="Dismiss email gate"
        >
          ✕
        </button>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
              Third Signal
            </p>
            <h3 className="text-2xl sm:text-3xl text-white font-editorial italic leading-tight">
              Unlock Unlimited Perspectives
            </h3>
            <p className="text-white/60 text-sm leading-relaxed max-w-md">
              Get personalized scenarios across all 20 signals. One field. No spam.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-widest text-white/40 block">
              Work Email
            </label>
            <div className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="name@company.com"
                className="bg-[#0f0f0f] border border-white/10 focus:border-white/40 text-white placeholder-white/25 rounded-md px-4 py-3 text-sm outline-none transition-colors"
                autoFocus
                required
              />
              {error && <span className="text-red-400 text-xs">{error}</span>}
              <button
                type="button"
                onClick={onSubmit}
                disabled={loading}
                className="bg-white text-black rounded-md px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white/90 active:translate-y-[1px] transition-all disabled:opacity-50"
              >
                {loading ? 'Working...' : 'Continue'}
              </button>
              <p className="text-[11px] text-white/30">
                We only use this to personalize your Atlas experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailGateModal;
