import React from 'react';

export type DnaProgressStageStatus = 'complete' | 'loading' | 'pending';

export type DnaProgressStage = {
  id: string;
  label: string;
  status: DnaProgressStageStatus;
};

export function DNAProgressIndicator({ stages }: { stages: DnaProgressStage[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {stages.map((stage) => (
        <div key={stage.id} className="border border-[#D0CEC5] bg-[#F5F2EA] px-4 py-4">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex h-5 w-5 items-center justify-center border text-[10px] ${
                stage.status === 'complete'
                  ? 'border-[#4B9E8D] text-[#4B9E8D]'
                  : stage.status === 'loading'
                    ? 'border-[#C9853A] text-[#C9853A]'
                    : 'border-[#D0CEC5] text-[#8A8A7A]'
              }`}
            >
              {stage.status === 'complete' ? '✓' : stage.status === 'loading' ? '•' : '·'}
            </span>
            <span
              className={`font-intake-mono text-[9px] uppercase tracking-[0.14em] ${
                stage.status === 'complete'
                  ? 'text-[#2D7A6B]'
                  : stage.status === 'loading'
                    ? 'text-[#C9853A] animate-pulse'
                    : 'text-[#8A8A7A]'
              }`}
            >
              {stage.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
