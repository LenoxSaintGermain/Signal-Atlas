import React, { useMemo, useRef, useState } from 'react';

export interface HeroVideoSectionProps {
  videoUrl?: string;
  videoTitle?: string;
  autoplayMuted?: boolean;
  loop?: boolean;
  fallbackImageUrl?: string;
  visible?: boolean;
}

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'LIVE';
  const whole = Math.round(seconds);
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

export function HeroVideoSection({
  videoUrl,
  videoTitle,
  autoplayMuted = true,
  loop = true,
  fallbackImageUrl,
  visible = false,
}: HeroVideoSectionProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(Boolean(videoUrl));
  const [muted, setMuted] = useState(autoplayMuted);
  const [duration, setDuration] = useState('LIVE');

  const hasVideo = Boolean(videoUrl);
  const backgroundStyle = useMemo(
    () =>
      fallbackImageUrl
        ? {
            backgroundImage: `linear-gradient(180deg, rgba(7,22,26,0.18) 0%, rgba(7,22,26,0.78) 100%), url(${fallbackImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }
        : undefined,
    [fallbackImageUrl]
  );

  if (!visible) return null;

  const togglePlayback = () => {
    const node = videoRef.current;
    if (!node) return;
    if (node.paused) {
      void node.play();
      setPlaying(true);
    } else {
      node.pause();
      setPlaying(false);
    }
  };

  const toggleMuted = () => {
    const node = videoRef.current;
    if (!node) return;
    const nextMuted = !node.muted;
    node.muted = nextMuted;
    setMuted(nextMuted);
  };

  return (
    <section className="border border-[#303530] border-t-[2px] border-t-[#4B9E8D] bg-[#1B1E1C]">
      <div className="mx-auto max-w-[840px] p-5 md:p-6">
        <div className="relative overflow-hidden border border-[#303530] bg-[#1B1E1C]">
          <div className="relative aspect-[16/9]">
            {hasVideo ? (
              <video
                ref={videoRef}
                src={videoUrl}
                autoPlay
                muted={autoplayMuted}
                loop={loop}
                playsInline
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onLoadedMetadata={(event) => setDuration(formatDuration(event.currentTarget.duration))}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-[#1B1E1C]" style={backgroundStyle} />
            )}

            <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(7,22,26,0.72)_50%,rgba(7,22,26,0.96)_100%)] p-5 md:p-6">
              <div className="flex items-end justify-between gap-4">
                <div className="max-w-[460px]">
                  <div className="font-intake-mono text-[9px] uppercase tracking-[0.18em] text-[#6BBFAF]">
                    Professional DNA · Intake
                  </div>
                  <div className="mt-3 font-intake-body text-base italic leading-relaxed text-[#D0EDE6]">
                    {videoTitle || 'A concierge conversation, tailored to you.'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="border border-white/16 bg-black/30 px-3 py-2 font-intake-mono text-[9px] uppercase tracking-[0.18em] text-white/70">
                    {duration}
                  </div>
                  {hasVideo ? (
                    <>
                      <button
                        type="button"
                        onClick={togglePlayback}
                        className="border border-white/16 bg-black/30 px-3 py-2 font-intake-mono text-[9px] uppercase tracking-[0.18em] text-white/88 transition-colors hover:border-[#6BBFAF] hover:text-[#6BBFAF]"
                        aria-label={playing ? 'Pause video' : 'Play video'}
                      >
                        {playing ? '‖' : '▶'}
                      </button>
                      {muted ? (
                        <button
                          type="button"
                          onClick={toggleMuted}
                          className="border border-white/16 bg-black/30 px-3 py-2 font-intake-mono text-[9px] uppercase tracking-[0.18em] text-white/88 transition-colors hover:border-[#6BBFAF] hover:text-[#6BBFAF]"
                          aria-label="Unmute video"
                        >
                          Unmute
                        </button>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
