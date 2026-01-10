import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { SIGNALS, ROLES, INDUSTRIES } from './constants';
import { Signal, Role, Industry, GeneratedScenario, Gem, Lead } from './types';
import { generateSignalScenario } from './services/geminiService';
import { saveGem, getUserGems, deleteGem } from './services/gemService';
import { saveLead } from './services/leadService';
import { logEvent } from 'firebase/analytics';
import { analytics } from './services/firebase';
import EmailGateModal from './components/EmailGateModal';
import { buildScenarioPdf, slugify } from './utils/pdf';
import html2canvas from 'html2canvas';

// Animation Phases
type IntroPhase = 'init' | 'measuring' | 'stack' | 'expanding' | 'complete';
type AppView = 'grid' | 'gems';

const App: React.FC = () => {
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [hoveredSignal, setHoveredSignal] = useState<Signal | null>(null);
  const [role, setRole] = useState<Role>('Exec');
  const [industry, setIndustry] = useState<Industry>('SaaS');
  const [scenarioData, setScenarioData] = useState<GeneratedScenario | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Analytics State
  const [generationLatency, setGenerationLatency] = useState<number>(0);
  // Access / Session State
  const [hasUnlockedAccess, setHasUnlockedAccess] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('hasUnlockedAccess') === 'true';
  });
  const [generationCount, setGenerationCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const stored = sessionStorage.getItem('generationCount');
    return stored ? parseInt(stored, 10) || 0 : 0;
  });

  // User / Gems State
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [emailGateOpen, setEmailGateOpen] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateLoading, setGateLoading] = useState(false);
  const [myGems, setMyGems] = useState<Gem[]>([]);
  const [currentView, setCurrentView] = useState<AppView>('grid');
  const [savingGem, setSavingGem] = useState(false);
  const [gemSavedSuccess, setGemSavedSuccess] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [lastSavedGemId, setLastSavedGemId] = useState<string | null>(null);
  const [welcomeToast, setWelcomeToast] = useState(false);
  const [pendingGate, setPendingGate] = useState<{
    action: 'generate' | 'save-gem';
    payload?: { signal: Signal; role: Role; industry: Industry };
  } | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showEmailBriefModal, setShowEmailBriefModal] = useState(false);
  const [sharingSignal, setSharingSignal] = useState<Signal | null>(null);
  const [shareGenerating, setShareGenerating] = useState(false);
  const shareCanvasRef = useRef<HTMLDivElement>(null);

  // Outro
  const [showOutroOverlay, setShowOutroOverlay] = useState(false);
  const outroTimeoutRef = useRef<number | null>(null);

  // Intro Orchestration State
  const [introPhase, setIntroPhase] = useState<IntroPhase>('init');
  const [showTitleOverlay, setShowTitleOverlay] = useState(false);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Mobile Detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Restore Email Session
  useEffect(() => {
    const storedEmail = localStorage.getItem('third_signal_email');
    if (storedEmail) {
      setUserEmail(storedEmail);
      loadGems(storedEmail);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('hasUnlockedAccess', hasUnlockedAccess ? 'true' : 'false');
  }, [hasUnlockedAccess]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('generationCount', generationCount.toString());
  }, [generationCount]);

  useEffect(() => {
    return () => {
      if (outroTimeoutRef.current) {
        window.clearTimeout(outroTimeoutRef.current);
      }
    };
  }, []);

  // Preload animation state
  const [isModalVisible, setIsModalVisible] = useState(false);

  // --- ORCHESTRATION ENGINE ---
  useLayoutEffect(() => {
    // 1. MEASUREMENT PHASE
    if (introPhase === 'init') {
      const timer = setTimeout(() => {
        if (!gridContainerRef.current) return;
        
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        cardRefs.current.forEach((card, i) => {
          if (!card) return;
          const rect = card.getBoundingClientRect();
          const cardCenterX = rect.left + rect.width / 2;
          const cardCenterY = rect.top + rect.height / 2;
          const deltaX = centerX - cardCenterX;
          const deltaY = centerY - cardCenterY;
          const randomRot = ((i % 5) - 2) * 2 + (Math.random() * 2 - 1); 
          const randomOffsetX = (Math.random() * 4) - 2;
          const randomOffsetY = (Math.random() * 4) - 2;

          card.style.setProperty('--intro-x', `${deltaX + randomOffsetX}px`);
          card.style.setProperty('--intro-y', `${deltaY + randomOffsetY}px`);
          card.style.setProperty('--intro-r', `${randomRot}deg`);
        });

        setIntroPhase('stack');
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [introPhase]);

  useEffect(() => {
    if (introPhase === 'stack') {
      const titleTimer = setTimeout(() => setShowTitleOverlay(true), 1200);
      const titleHideTimer = setTimeout(() => setShowTitleOverlay(false), 2800);
      const expandTimer = setTimeout(() => {
        setIntroPhase('expanding');
      }, 3200);

      return () => {
        clearTimeout(titleTimer);
        clearTimeout(titleHideTimer);
        clearTimeout(expandTimer);
      };
    }

    if (introPhase === 'expanding') {
      const completeTimer = setTimeout(() => {
        setIntroPhase('complete');
      }, 1400); 
      return () => clearTimeout(completeTimer);
    }
  }, [introPhase]);

  // --- APP LOGIC ---

  const trackEvent = (name: string, params?: Record<string, any>) => {
    try {
      if (analytics) {
        logEvent(analytics, name, params);
      }
    } catch (err) {
      console.debug('Analytics unavailable', err);
    }
  };

  const getUtmParams = (): Lead['utm_params'] => {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(window.location.search);
    return {
      source: params.get('utm_source') || undefined,
      medium: params.get('utm_medium') || undefined,
      campaign: params.get('utm_campaign') || undefined,
    };
  };

  const openEmailGate = (context?: {
    action: 'generate' | 'save-gem';
    payload?: { signal: Signal; role: Role; industry: Industry };
  }) => {
    setPendingGate(context || null);
    setEmailGateOpen(true);
    trackEvent('email_gate_shown', {
      source_signal: context?.payload?.signal?.title || selectedSignal?.title || null,
    });
  };

  const closeEmailGate = () => {
    setEmailGateOpen(false);
    setGateError(null);
    setGateLoading(false);
    setPendingGate(null);
    trackEvent('email_gate_dismissed');
  };

  const unlockAccess = (email: string) => {
    localStorage.setItem('third_signal_email', email);
    setUserEmail(email);
    setHasUnlockedAccess(true);
    setWelcomeToast(true);
    setTimeout(() => setWelcomeToast(false), 2000);
  };

  const resumePendingFlow = (email: string) => {
    if (pendingGate?.action === 'generate' && pendingGate.payload) {
      runScenarioGeneration(
        pendingGate.payload.signal,
        pendingGate.payload.role,
        pendingGate.payload.industry
      );
    } else if (pendingGate?.action === 'save-gem') {
      executeSaveGem(email);
    }
    setPendingGate(null);
  };

  const handleGateSubmit = async () => {
    const trimmedEmail = emailInput.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setGateError('Enter a valid email.');
      return;
    }

    setGateLoading(true);
    setGateError(null);

    const targetSignal = pendingGate?.payload?.signal || selectedSignal;
    const lead: Lead = {
      email: trimmedEmail,
      source_signal: targetSignal?.title || 'unknown',
      source_role: pendingGate?.payload?.role || role,
      source_industry: pendingGate?.payload?.industry || industry,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      referrer: typeof document !== 'undefined' ? document.referrer || window.location.href : 'direct',
      utm_params: getUtmParams(),
    };

    try {
      await saveLead(lead);
    } catch (e) {
      console.error('Lead capture failed; unlocking anyway', e);
    } finally {
      unlockAccess(trimmedEmail);
      setEmailGateOpen(false);
      trackEvent('email_gate_completed', { source_signal: lead.source_signal });
      resumePendingFlow(trimmedEmail);
      setGateLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSignal) {
      setIsModalVisible(true);
      setGemSavedSuccess(false); // Reset save state on new open
      if (!scenarioData || scenarioData.scenario_title !== selectedSignal.title) {
        // Only generate if we don't have data or it's new
        requestScenarioGeneration(selectedSignal, role, industry);
      }
    } else {
      setIsModalVisible(false);
    }
  }, [selectedSignal]);

  // Handle Scroll to Saved Gem
  useEffect(() => {
    if (lastSavedGemId && currentView === 'gems' && myGems.length > 0) {
      // Small delay to ensure view transition and DOM rendering are complete
      const timer = setTimeout(() => {
        const element = document.getElementById(`gem-${lastSavedGemId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add temporary highlight
          element.classList.add('ring-2', 'ring-black', 'ring-offset-4');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-black', 'ring-offset-4');
          }, 2500);
        }
        setLastSavedGemId(null); // Reset
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [lastSavedGemId, currentView, myGems]);

  const loadGems = async (email: string) => {
    try {
      const gems = await getUserGems(email);
      setMyGems(gems);
      setPermissionError(false);
    } catch (e: any) {
      console.error("Failed to load gems", e);
      if (e.code === 'permission-denied') {
        setPermissionError(true);
      }
    }
  };

  const handleGenerate = async (s: Signal, r: Role, i: Industry) => {
    setLoading(true);
    setError(null);
    setGemSavedSuccess(false);
    const startTime = Date.now();
    try {
      const data = await generateSignalScenario(s, r, i);
      setScenarioData(data);
      setGenerationLatency(Date.now() - startTime);
    } catch (e) {
      setError("Unable to decode signal. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const runScenarioGeneration = (s: Signal, r: Role, i: Industry) => {
    setGenerationCount((count) => count + 1);
    handleGenerate(s, r, i);
  };

  const requestScenarioGeneration = (s: Signal, r: Role, i: Industry) => {
    if (!hasUnlockedAccess && generationCount >= 1) {
      openEmailGate({ action: 'generate', payload: { signal: s, role: r, industry: i } });
      return;
    }
    runScenarioGeneration(s, r, i);
  };

  const handleReshuffle = () => {
    if (selectedSignal) {
      requestScenarioGeneration(selectedSignal, role, industry);
    }
  };

  const triggerOutro = () => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('atlas_outro_seen') === 'true') return;

    sessionStorage.setItem('atlas_outro_seen', 'true');
    setShowOutroOverlay(true);

    if (outroTimeoutRef.current) {
      window.clearTimeout(outroTimeoutRef.current);
    }

    outroTimeoutRef.current = window.setTimeout(() => {
      setShowOutroOverlay(false);
      outroTimeoutRef.current = null;
    }, 4200);
  };

  const closeModal = (options?: { showOutro?: boolean }) => {
    const shouldShowOutro = options?.showOutro ?? true;
    const hadScenario = Boolean(scenarioData);

    setIsModalVisible(false);
    setTimeout(() => {
      setSelectedSignal(null);
      setScenarioData(null);
    }, 100);

    if (shouldShowOutro && hadScenario) {
      triggerOutro();
    }
  };

  const handleClose = (_e?: React.MouseEvent) => {
    closeModal();
  };

  // --- GEM LOGIC ---

  const handleSaveClick = () => {
    if (!userEmail) {
      openEmailGate({ 
        action: 'save-gem', 
        payload: selectedSignal ? { signal: selectedSignal, role, industry } : undefined 
      });
      return;
    }
    executeSaveGem(userEmail);
  };

  const executeSaveGem = async (email: string) => {
    if (!selectedSignal || !scenarioData) return;
    
    setSavingGem(true);
    try {
      const newGem: Omit<Gem, 'id' | 'created_at'> = {
        user_email: email,
        signal_id: selectedSignal.id,
        signal_title: selectedSignal.title,
        signal_truth: selectedSignal.truth,
        role: role,
        industry: industry,
        scenario: scenarioData,
        generation_model: 'gemini-3-flash-preview',
        generation_latency_ms: generationLatency
      };
      
      const newGemId = await saveGem(newGem);
      await loadGems(email);
      setGemSavedSuccess(true);
      setPermissionError(false);

      // UX: Wait for user to see "Saved", then close modal and scroll to gem
      setTimeout(() => {
        closeModal({ showOutro: false });
        setCurrentView('gems');
        setLastSavedGemId(newGemId);
      }, 1000);

    } catch (e: any) {
      console.error("Failed to save gem", e);
      if (e.code === 'permission-denied') {
        setPermissionError(true);
      }
    } finally {
      setSavingGem(false);
    }
  };

  const handleDeleteGemAction = async (e: React.MouseEvent, gemId: string) => {
    e.stopPropagation();
    if (window.confirm("Delete this gem?")) {
      await deleteGem(gemId);
      if (userEmail) loadGems(userEmail);
    }
  };

  const handleViewGem = (gem: Gem) => {
    const signal = SIGNALS.find(s => s.id === gem.signal_id);
    if (signal) {
      // Set context
      setRole(gem.role);
      setIndustry(gem.industry);
      setScenarioData(gem.scenario);
      setSelectedSignal(signal);
      setGemSavedSuccess(true); // It's already saved
    }
  };

  // --- INTERACTION LOGIC ---

  const handleSignalClick = (e: React.MouseEvent, signal: Signal, isDisabled: boolean) => {
    e.stopPropagation();
    if (isDisabled || introPhase !== 'complete') return;

    if (isMobile) {
      if (hoveredSignal?.id === signal.id) {
        // Generate fresh if not viewing a gem
        setSelectedSignal(signal);
      } else {
        setHoveredSignal(signal);
      }
    } else {
      setSelectedSignal(signal);
    }
  };

  const handleBackgroundClick = () => {
    if (isMobile) {
      setHoveredSignal(null);
    }
  };

  const findSignalByTitle = (title: string) => SIGNALS.find(s => s.title === title);

  const isIntroDark = introPhase === 'init' || introPhase === 'stack' || introPhase === 'measuring';

  const handleDownloadPdf = async () => {
    if (!selectedSignal || !scenarioData) return;
    trackEvent('pdf_download_initiated', {
      signal_id: selectedSignal.id,
      role,
      industry,
    });
    setGeneratingPdf(true);
    try {
      const blob = await buildScenarioPdf(selectedSignal, scenarioData, role, industry);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const slug = slugify(selectedSignal.title);
      link.href = url;
      link.download = `Signal-Atlas-${selectedSignal.index}-${slug}-${industry}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      trackEvent('pdf_download_completed', {
        signal_id: selectedSignal.id,
        role,
        industry,
      });
    } catch (err) {
      console.error('PDF generation failed', err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const copyShareCopy = (signal: Signal) => {
    const text = `The average proprietary algorithm now has a mass-market equivalent within 18 months.\n\nYour moat isn't what you know. It's how fast you learn.\n\nSignal ${signal.index}: ${signal.title}\n→ https://thirdsignal.com/atlas\n\n#AI #Strategy #BusinessIntelligence`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  const handleShareSignal = async (signal: Signal) => {
    if (!shareCanvasRef.current) return;
    setSharingSignal(signal);
    setShareGenerating(true);
    try {
      await new Promise(res => setTimeout(res, 50));
      const node = shareCanvasRef.current;
      const canvas = await html2canvas(node, {
        backgroundColor: '#0f1012',
        width: 1200,
        height: 628,
        scale: 2,
      });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Third-Signal-${signal.index}-${slugify(signal.title)}.png`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
      copyShareCopy(signal);
    } catch (err) {
      console.error('Share image failed', err);
    } finally {
      setShareGenerating(false);
      setSharingSignal(null);
    }
  };

  return (
    <div className={`min-h-screen selection:bg-black selection:text-white font-light intro-container-transition overflow-hidden ${isIntroDark ? 'bg-[#111]' : 'bg-[#f5f5f5] text-[#1a1a1a]'}`}>
      
      {/* ERROR BANNER */}
      {permissionError && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-red-600 text-white p-4 z-[100] shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest mb-1">Database Access Denied</h4>
            <p className="text-xs opacity-90 leading-relaxed">Please ensure you have published the Firestore Security Rules in your Firebase Console.</p>
          </div>
          <button onClick={() => setPermissionError(false)} className="ml-auto opacity-50 hover:opacity-100"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      )}

      <EmailGateModal
        isOpen={emailGateOpen}
        email={emailInput}
        onEmailChange={(value) => {
          setEmailInput(value);
          if (gateError) setGateError(null);
        }}
        onSubmit={handleGateSubmit}
        onClose={closeEmailGate}
        loading={gateLoading}
        error={gateError}
      />
      {showEmailBriefModal && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowEmailBriefModal(false)}
              className="absolute top-3 right-3 text-black/50 hover:text-black"
            >
              ✕
            </button>
            <h3 className="text-xl font-editorial mb-2">Email this brief</h3>
            <p className="text-sm text-black/60 mb-4">
              Attach the downloaded PDF to your email. (Server-side send not wired yet.)
            </p>
            <div className="flex flex-col gap-3">
              <input
                type="email"
                defaultValue={userEmail || ''}
                className="border border-black/10 px-3 py-2 text-sm"
                placeholder="you@company.com"
                disabled
              />
              <button
                onClick={() => setShowEmailBriefModal(false)}
                className="bg-black text-white px-3 py-2 text-xs uppercase tracking-widest"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {welcomeToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[95] animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white text-black px-4 py-2 shadow-2xl border border-black/5 text-[11px] uppercase tracking-[0.2em] rounded-full">
            Welcome to the Atlas
          </div>
        </div>
      )}

      {showOutroOverlay && (
        <div className="fixed inset-0 z-[85] bg-[#0b0b0b] text-white flex items-center justify-center p-8 animate-in fade-in duration-700">
          <button
            onClick={() => setShowOutroOverlay(false)}
            className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors"
            aria-label="Close outro"
          >
            ✕
          </button>
          <div className="max-w-2xl w-full text-center">
            <div className="text-[10px] uppercase tracking-[0.35em] text-white/40 mb-8 animate-fade-up" style={{ animationDelay: '100ms' }}>
              Third Signal
            </div>
            <div className="text-3xl md:text-4xl font-editorial italic leading-tight mb-4 animate-fade-up" style={{ animationDelay: '250ms' }}>
              Definitions don’t move outcomes.
            </div>
            <p className="text-white/55 text-sm md:text-base leading-relaxed max-w-xl mx-auto animate-fade-up" style={{ animationDelay: '400ms' }}>
              If one signal changed the way you see a decision, imagine twenty applied to your roadmap.
            </p>
            <div className="mt-10 text-[10px] font-mono tracking-widest text-white/35 animate-fade-up" style={{ animationDelay: '550ms' }}>
              thirdsignal.com/atlas
            </div>
          </div>
        </div>
      )}

      {/* SCENE 2: TITLE OVERLAY */}
      <div 
        className={`fixed inset-0 z-[60] flex flex-col items-center justify-center pointer-events-none transition-opacity duration-1000 ease-in-out ${showTitleOverlay ? 'opacity-100' : 'opacity-0'}`}
      >
         <h1 className="text-white text-xs font-bold tracking-[0.3em] uppercase mb-2">Third Signal</h1>
         <div className="w-8 h-[1px] bg-white/30 mb-2"></div>
         <p className="text-white/50 text-[10px] font-mono tracking-widest">Signal Atlas v0.1</p>
      </div>

      {/* Header */}
      <header 
        className={`fixed top-0 left-0 w-full z-10 px-6 py-6 flex justify-between items-center text-black pointer-events-none transition-opacity duration-1000 delay-500 ${introPhase === 'complete' ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="flex items-center gap-6 pointer-events-auto">
          <h1 
            className="text-xs font-bold tracking-widest uppercase cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => setCurrentView('grid')}
          >
            Third Signal <span className="opacity-40 ml-2 font-normal hidden sm:inline">Signal Atlas v0.1</span>
          </h1>
          {/* My Gems Nav Item */}
          {userEmail && (
            <button 
              onClick={() => setCurrentView(currentView === 'grid' ? 'gems' : 'grid')}
              className={`text-[10px] uppercase tracking-widest transition-all dur-sm flex items-center gap-2 ${currentView === 'gems' ? 'opacity-100 font-bold border-b border-black' : 'opacity-40 hover:opacity-100'}`}
            >
              My Gems {myGems.length > 0 && <span className="opacity-50">({myGems.length})</span>}
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-6 pointer-events-auto">
          <div className="relative group flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
             </svg>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="FILTER"
              className="bg-transparent text-right border-b border-black/10 focus:border-black outline-none text-xs uppercase tracking-widest py-1 w-16 focus:w-32 transition-all dur-md ease-exit placeholder-black/30"
            />
          </div>
        </div>
      </header>

      {/* MAIN VIEW: GRID OR GEMS */}
      <main 
        ref={gridContainerRef}
        className={`transition-all dur-lg ease-standard pt-24 pb-24 px-6 min-h-screen ${selectedSignal ? 'opacity-20 blur-sm scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}
        onClick={handleBackgroundClick} 
        onMouseLeave={() => !isMobile && setHoveredSignal(null)}
      >
        {currentView === 'grid' ? (
          <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px transition-colors duration-[2000ms] ${isIntroDark ? 'border-transparent bg-transparent' : 'bg-gray-200 border border-gray-200'}`}>
            {SIGNALS.map((signal, index) => {
              const isSearchMatch = 
                signal.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                signal.index.includes(searchTerm);
              const isSearchDimmed = searchTerm !== '' && !isSearchMatch;
              const isHovered = hoveredSignal?.id === signal.id;
              const isRelated = hoveredSignal?.relatedIds?.includes(signal.id);
              const isConstellationDimmed = !searchTerm && hoveredSignal && !isHovered && !isRelated;
              const isDisabled = isSearchDimmed || isConstellationDimmed;
              const isStacking = introPhase === 'stack';
              const isContentVisible = introPhase === 'expanding' || introPhase === 'complete';

              return (
                <div
                  key={signal.id}
                  ref={el => { cardRefs.current[index] = el; }}
                  onClick={(e) => handleSignalClick(e, signal, isDisabled)}
                  onMouseEnter={() => !isMobile && !searchTerm && introPhase === 'complete' && setHoveredSignal(signal)}
                  className={`
                    group relative aspect-square md:aspect-square p-3 md:p-6 flex flex-col justify-between
                    intro-card
                    ${isStacking ? 'intro-stack-state bg-[#1a1a1a] border border-white/10' : 'intro-grid-state'}
                    ${introPhase === 'complete' ? 'cursor-pointer hover:bg-white hover:shadow-card-hover hover:scale-[1.025] hover:z-20' : ''}
                    ${!isStacking && introPhase !== 'complete' ? 'bg-[#f5f5f5]' : ''} 
                    ${introPhase === 'complete' && !isStacking ? 'bg-[#f5f5f5]' : ''}
                    ${isDisabled && introPhase === 'complete' ? 'opacity-20 blur-[1px] scale-[0.98] grayscale pointer-events-none' : ''}
                    ${isRelated && introPhase === 'complete' ? 'bg-white z-10 scale-[1.005] ring-1 ring-black/5' : ''}
                    ${isHovered && isMobile && introPhase === 'complete' ? 'bg-white shadow-card-hover scale-[1.025] z-20' : ''}
                  `}
                >
                  <div className="flex justify-between items-start">
                    <div className={`text-[8px] md:text-[10px] font-mono transition-all dur-md 
                        ${isStacking ? 'text-white/30' : 'text-black/40'}
                        ${isRelated || isHovered ? 'opacity-100 text-black font-bold' : ''}
                    `}>
                        {signal.index}
                    </div>
                    {!isStacking && introPhase === 'complete' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleShareSignal(signal); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-black/60 hover:text-black"
                        title="Share as image"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 16V3m0 0 4 4m-4-4-4 4"/></svg>
                      </button>
                    )}
                    {isMobile && isHovered && introPhase === 'complete' && (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <span className="text-[8px] font-bold uppercase tracking-widest bg-black text-white px-2 py-1">Tap to Decode</span>
                      </div>
                    )}
                  </div>

                  <div className={`relative overflow-hidden ${isContentVisible ? 'intro-content-visible' : 'intro-content-hidden'}`}>
                    <h2 className="text-sm sm:text-base md:text-2xl font-editorial tracking-tight leading-none group-hover:translate-y-[-2px] transition-transform dur-md ease-exit">
                      {signal.title}
                    </h2>
                    <div className={`w-8 h-[1px] bg-black mt-2 md:mt-4 origin-left transition-transform dur-md ease-exit ${isRelated ? 'scale-x-50 opacity-30' : (isHovered && isMobile) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></div>
                  </div>
                  
                  <div className={`absolute bottom-3 right-3 md:bottom-6 md:right-6 transition-all dur-md group-hover:translate-x-0 translate-x-2 ${isContentVisible && (isRelated || (isMobile && isHovered)) ? 'opacity-100 translate-x-0' : 'opacity-0 group-hover:opacity-100'}`}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 11L11 1M11 1H1M11 1V11" stroke="currentColor" strokeWidth="1"/>
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* GEMS VIEW */
          <div className="w-full max-w-6xl mx-auto animate-in fade-in duration-500">
             <div className="mb-12 border-b border-black/10 pb-8">
               <h2 className="text-4xl font-editorial italic mb-2">My Gems</h2>
               <p className="text-black/50 text-sm font-light">Your saved intelligence scenarios.</p>
             </div>
             
             {myGems.length === 0 ? (
               <div className="text-center py-20 opacity-40">
                 <div className="text-xl font-editorial italic mb-4">No gems yet.</div>
                 <div className="text-xs uppercase tracking-widest">Generate scenarios and save the ones that resonate.</div>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {myGems.map((gem) => (
                    <div 
                      key={gem.id} 
                      id={`gem-${gem.id}`}
                      onClick={() => handleViewGem(gem)}
                      className="group bg-white p-8 cursor-pointer hover:shadow-card-hover transition-all dur-md ease-exit relative border border-transparent hover:border-black/5"
                    >
                       {/* Delete Action */}
                       <button 
                          onClick={(e) => gem.id && handleDeleteGemAction(e, gem.id)}
                          className="absolute top-4 right-4 opacity-0 group-hover:opacity-30 hover:!opacity-100 transition-opacity"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                       </button>

                       <div className="text-[9px] uppercase tracking-widest opacity-40 mb-4 flex justify-between">
                          <span>{gem.signal_title}</span>
                          <span>{new Date(gem.created_at.seconds * 1000).toLocaleDateString()}</span>
                       </div>
                       <h3 className="text-xl font-editorial leading-tight mb-4 group-hover:underline decoration-black/20 underline-offset-4">{gem.scenario.scenario_title}</h3>
                       <div className="flex gap-2 text-[9px] uppercase tracking-widest opacity-60">
                          <span className="border border-black/10 px-2 py-1">{gem.role}</span>
                          <span className="border border-black/10 px-2 py-1">{gem.industry}</span>
                       </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
        )}
      </main>

      {/* REVEAL STATE (MODAL) */}
      {selectedSignal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 transition-opacity dur-md ease-standard ${isModalVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div 
            className="absolute inset-0 bg-[#e5e5e5]/80 backdrop-blur-md transition-opacity dur-lg ease-standard"
            onClick={handleClose}
          />
          
          <div className="bg-white w-full max-w-6xl h-full max-h-[90vh] shadow-2xl relative flex flex-col md:flex-row overflow-y-auto md:overflow-hidden animate-in fade-in zoom-in-95 dur-lg ease-standard ring-1 ring-black/5">
            
            {/* Top Right Controls */}
            <div className="absolute top-6 right-6 z-20 flex items-center gap-4">
               {/* Save Gem Button */}
               {scenarioData && !loading && !error && (
                 <button 
                   onClick={handleSaveClick}
                   disabled={gemSavedSuccess || savingGem}
                   className={`
                      group flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest transition-all dur-md 
                      ${gemSavedSuccess ? 'text-black cursor-default' : 'text-gray-400 hover:text-black'}
                   `}
                 >
                   <div className="relative">
                      {/* Diamond Icon */}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={gemSavedSuccess ? "black" : "none"} stroke="currentColor" strokeWidth="1.5" className="transition-all dur-sm ease-spring-soft group-hover:scale-110">
                        <path d="M6 3L2 9L12 21L22 9L18 3H6Z"/>
                      </svg>
                      {/* Sparkle Animation */}
                      {gemSavedSuccess && (
                         <div className="absolute inset-0 animate-ping opacity-30">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3L2 9L12 21L22 9L18 3H6Z"/></svg>
                         </div>
                      )}
                   </div>
                   <span>{savingGem ? 'Saving...' : gemSavedSuccess ? 'Saved' : 'Save Gem'}</span>
                 </button>
               )}

               {/* Close Button */}
               <button onClick={handleClose} className="p-2 opacity-50 hover:opacity-100 transition-opacity dur-xs rounded-full mix-blend-difference text-white/80 hover:text-white">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                   <line x1="18" y1="6" x2="6" y2="18"></line>
                   <line x1="6" y1="6" x2="18" y2="18"></line>
                 </svg>
               </button>
            </div>

            {/* Left Column: Context (Static) */}
            <div className="w-full md:w-1/3 bg-[#111] text-white p-8 md:p-12 flex flex-col justify-between shrink-0">
              <div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
                <div className="text-xs font-mono opacity-50 mb-8 flex justify-between">
                    <span>{selectedSignal.index} / 20</span>
                    <span className="opacity-50">STATIC CONTEXT</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-editorial leading-none mb-10">{selectedSignal.title}</h2>
                <p className="text-lg md:text-xl font-light opacity-80 leading-relaxed font-editorial italic border-l border-white/20 pl-6 py-1">
                  "{selectedSignal.truth}"
                </p>
              </div>

              <div className="mt-12 space-y-10 animate-fade-up" style={{ animationDelay: '200ms' }}>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest opacity-40 block">Perspective</label>
                  <div className="flex gap-2 flex-wrap">
                    {ROLES.map(r => (
                      <button 
                        key={r}
                        onClick={() => { 
                          setRole(r); 
                          if(!loading && selectedSignal) requestScenarioGeneration(selectedSignal, r, industry); 
                        }}
                        className={`px-4 py-1.5 text-xs border transition-all dur-sm ease-exit ${role === r ? 'bg-white text-black border-white' : 'border-white/20 text-white hover:border-white hover:bg-white/5'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest opacity-40 block">Industry</label>
                  <div className="flex gap-2 flex-wrap">
                    {INDUSTRIES.map(i => (
                      <button 
                        key={i}
                        onClick={() => { 
                          setIndustry(i); 
                          if(!loading && selectedSignal) requestScenarioGeneration(selectedSignal, role, i); 
                        }}
                        className={`px-4 py-1.5 text-xs border transition-all dur-sm ease-exit ${industry === i ? 'bg-white text-black border-white' : 'border-white/20 text-white hover:border-white hover:bg-white/5'}`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Intelligence (Dynamic) */}
            <div className="w-full md:w-2/3 p-8 md:p-16 relative bg-[#fff] md:overflow-y-auto">
              <div className="md:hidden flex justify-center pb-8 opacity-40 text-[10px] tracking-widest uppercase animate-pulse">
                 Scroll for Intel ↓
              </div>

              {loading ? (
                <div className="h-full flex flex-col justify-center items-center py-20 md:py-0">
                  <div className="relative w-64 h-64 flex items-center justify-center">
                      <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0 opacity-40">
                        <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="0.2" fill="none" className="animate-[spin_10s_linear_infinite] origin-center" strokeDasharray="4 4" />
                        <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="0.1" fill="none" className="animate-[spin_15s_linear_infinite_reverse] origin-center opacity-50" />
                        <rect x="35" y="35" width="30" height="30" stroke="currentColor" strokeWidth="0.2" fill="none" className="animate-construct origin-center" style={{ animationDelay: '0ms' }} />
                        <rect x="30" y="30" width="40" height="40" stroke="currentColor" strokeWidth="0.1" fill="none" className="animate-construct origin-center" style={{ animationDelay: '1000ms' }} />
                        <polygon points="50,10 90,80 10,80" stroke="currentColor" strokeWidth="0.2" fill="none" className="animate-[spin_20s_linear_infinite] origin-center opacity-30" />
                      </svg>
                      <div className="w-1 h-1 bg-black rounded-full animate-ping absolute"></div>
                  </div>
                  <div className="mt-8 flex flex-col items-center space-y-2">
                     <div className="text-[10px] uppercase tracking-[0.3em] text-black animate-pulse">Simulating Scenario</div>
                     <div className="text-[8px] font-mono text-black/40">Gemini 3 Flash • Processing</div>
                  </div>
                </div>
              ) : error ? (
                <div className="h-full flex flex-col justify-center items-center py-20 md:py-0">
                  <div className="text-red-600 mb-4 font-mono text-sm">{error}</div>
                  <button onClick={handleReshuffle} className="underline text-xs uppercase tracking-widest hover:text-black/60">Retry</button>
                </div>
              ) : scenarioData ? (
                <div className="max-w-3xl mx-auto space-y-16">
                  
                  {/* Scenario */}
                  <section className="animate-fade-up">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-2 h-2 bg-black rounded-full"></div>
                        <div className="text-xs font-mono uppercase tracking-widest text-gray-400">Generated Scenario</div>
                    </div>
                    <h3 className="text-3xl font-editorial mb-8 leading-tight">{scenarioData.scenario_title}</h3>
                    <div className="prose prose-lg text-gray-800 leading-relaxed font-light drop-cap">
                        {scenarioData.scenario}
                    </div>
                  </section>

                  {/* Strategy */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-gray-100 pt-12 animate-fade-up" style={{ animationDelay: '150ms' }}>
                    <section>
                      <div className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-4">Strategic Implication</div>
                      <p className="text-sm leading-relaxed text-gray-600">{scenarioData.why_it_matters}</p>
                    </section>
                    <section className="relative">
                      <div className="text-xs font-mono uppercase tracking-widest text-red-500 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                        Hidden Failure Mode
                      </div>
                      <div className="bg-red-50/50 p-6 border-l-2 border-red-100">
                        <p className="text-sm leading-relaxed text-gray-700 italic font-editorial">"{scenarioData.hidden_failure_mode}"</p>
                      </div>
                    </section>
                  </div>

                  {/* Outcome Anchors */}
                  <section className="bg-gray-50 p-8 animate-fade-up" style={{ animationDelay: '300ms' }}>
                    <div className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-6">Outcome Anchors</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {scenarioData.outcome_anchors.map((anchor, idx) => (
                        <div key={idx} className="flex flex-col group">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-xl font-bold group-hover:translate-x-1 transition-transform dur-sm ease-spring-soft">{anchor.metric}</span>
                            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wide ${anchor.direction === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {anchor.direction}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 leading-snug">{anchor.note}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Compounds With */}
                  {scenarioData.compounds_with.length > 0 && (
                     <section className="border-t border-gray-100 pt-12 pb-12 animate-fade-up" style={{ animationDelay: '450ms' }}>
                       <div className="flex flex-col sm:flex-row items-baseline gap-6">
                         <span className="text-xs font-mono uppercase tracking-widest text-gray-400 shrink-0">Compounds With</span>
                         <div className="flex flex-wrap gap-x-8 gap-y-2">
                           {scenarioData.compounds_with.map((title) => {
                             const s = findSignalByTitle(title);
                             if (!s) return null;
                             return (
                               <button 
                                 key={title}
                                 onClick={() => { 
                                   const container = document.querySelector('.overflow-y-auto');
                                   if(container) container.scrollTop = 0;
                                   setSelectedSignal(s); 
                                  }}
                                 className="text-xl font-editorial italic underline decoration-gray-200 hover:decoration-black transition-all dur-sm ease-exit text-left hover:text-black/80"
                               >
                                 {title}
                               </button>
                             );
                           })}
                         </div>
                       </div>
                     </section>
                  )}

                  {/* Footer */}
                  <div className="flex justify-between items-center border-t border-gray-100 pt-8 opacity-60 hover:opacity-100 transition-opacity dur-md animate-fade-up" style={{ animationDelay: '600ms' }}>
                    <div className="flex gap-3 flex-wrap">
                      <button onClick={handleReshuffle} className="flex items-center gap-2 text-xs uppercase tracking-widest hover:text-black transition-colors group">
                        <svg className="group-hover:rotate-180 transition-transform dur-md ease-spring-soft" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                        Shuffle Scenario
                      </button>
                      <button
                        onClick={handleDownloadPdf}
                        disabled={generatingPdf}
                        className="flex items-center gap-2 text-xs uppercase tracking-widest bg-black text-white px-3 py-2 rounded hover:bg-black/90 disabled:opacity-60"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v14m0 0l-5-5m5 5l5-5"/><path d="M5 21h14"/></svg>
                        {generatingPdf ? 'Preparing...' : 'Save Intelligence Brief'}
                      </button>
                      <button
                        onClick={() => setShowEmailBriefModal(true)}
                        className="flex items-center gap-2 text-[11px] uppercase tracking-widest border border-black/10 px-3 py-2 rounded hover:border-black"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z"/><path d="m4 4 8 8 8-8"/></svg>
                        Email this brief
                      </button>
                      <button
                        onClick={() => selectedSignal && handleShareSignal(selectedSignal)}
                        disabled={shareGenerating}
                        className="flex items-center gap-2 text-[11px] uppercase tracking-widest border border-black/10 px-3 py-2 rounded hover:border-black disabled:opacity-60"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 16V3m0 0 4 4m-4-4-4 4"/></svg>
                        {shareGenerating ? 'Rendering...' : 'Share as Image'}
                      </button>
                    </div>
                    <span className="text-[10px] text-gray-400 text-right">AI output may vary. Evaluate critically.</span>
                  </div>

                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
      {/* Hidden canvas for share image */}
      <div
        ref={shareCanvasRef}
        style={{
          position: 'fixed',
          left: -2000,
          top: 0,
          width: '1200px',
          height: '628px',
          background: '#0f1012',
          color: 'white',
          fontFamily: 'Helvetica, Arial, sans-serif',
          padding: '64px',
        }}
      >
        {sharingSignal && (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, letterSpacing: 2, opacity: 0.7, marginBottom: 16 }}>
                SIGNAL {sharingSignal.index} / 20
              </div>
              <div style={{ fontSize: 56, lineHeight: '1.05', fontWeight: 700, textTransform: 'uppercase' }}>
                {sharingSignal.title}
              </div>
              <div style={{ width: '50%', height: 2, background: '#2f2f36', margin: '24px 0' }} />
              <div style={{ fontSize: 20, lineHeight: 1.5, fontStyle: 'italic', color: '#d3d4d8', maxWidth: '70%' }}>
                “{sharingSignal.truth}”
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ border: '1px solid #2f2f36', padding: '12px 16px', fontSize: 14, letterSpacing: 1.2, textTransform: 'uppercase', display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                <span>Tap to decode →</span>
                <span>thirdsignal.com/atlas</span>
              </div>
              <div style={{ fontSize: 14, letterSpacing: 1.2, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                Third Signal <span style={{ fontSize: 10 }}>▲</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;