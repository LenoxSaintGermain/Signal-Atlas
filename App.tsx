import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { SIGNALS, ROLES, INDUSTRIES } from './constants';
import { Signal, Role, Industry, GeneratedScenario, Gem } from './types';
import { generateSignalScenario } from './services/geminiService';
import { saveGem, getUserGems, deleteGem } from './services/gemService';

// Animation Phases
// prologue: The cinematic text intro
// init/measuring: Calculating grid positions (happens behind prologue)
// stack: Cards piled in center
// expanding: Cards moving to grid
// complete: Interactive state
type IntroPhase = 'prologue' | 'init' | 'measuring' | 'stack' | 'expanding' | 'complete';
type AppView = 'grid' | 'gems';

// Navigation Hint for Mobile HUD
interface NavHint {
  id: string;
  index: string;
  title: string;
  direction: 'up' | 'down';
}

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

  // User / Gems State
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [myGems, setMyGems] = useState<Gem[]>([]);
  const [currentView, setCurrentView] = useState<AppView>('grid');
  const [savingGem, setSavingGem] = useState(false);
  const [gemSavedSuccess, setGemSavedSuccess] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [lastSavedGemId, setLastSavedGemId] = useState<string | null>(null);

  // Intro Orchestration State
  const [introPhase, setIntroPhase] = useState<IntroPhase>('prologue');
  
  // Prologue Sub-states (for text sequencing)
  const [prologueLine, setPrologueLine] = useState(0);
  const [prologueFading, setPrologueFading] = useState(false);
  
  // Mobile HUD State
  const [navHints, setNavHints] = useState<NavHint[]>([]);
  
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentScrollRef = useRef<HTMLDivElement>(null);

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

  // Preload animation state
  const [isModalVisible, setIsModalVisible] = useState(false);

  // --- ORCHESTRATION ENGINE ---

  // 1. PROLOGUE SEQUENCER
  useEffect(() => {
    // Check if user has seen intro before to skip? 
    // For now, we play it every time for effect, or user can click to skip.
    
    if (introPhase === 'prologue') {
      // Timeline Adjustment for longer text & cinematic exit:
      // 0ms: Start
      // 500ms: Beat 1 (Hook)
      // 3000ms: Beat 2 (Analysis - Long)
      // 8000ms: Beat 3 (Solution)
      // 12500ms: Begin Exit Sequence (Fade Text, Emerge Cards)
      // 13500ms: Transition to Stack Phase
      
      const t1 = setTimeout(() => setPrologueLine(1), 500);
      const t2 = setTimeout(() => setPrologueLine(2), 3000);
      const t3 = setTimeout(() => setPrologueLine(3), 8000);
      
      const tFade = setTimeout(() => {
        setPrologueFading(true);
      }, 12500);

      // End prologue, fully reveal the stack
      const tEnd = setTimeout(() => {
        setIntroPhase('stack');
      }, 13500);

      // Initialize grid positions in background while text is playing
      // We set a small timeout to ensure DOM is ready, then trigger measurement
      const tInit = setTimeout(() => {
         calculateStackPositions();
      }, 100);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(tFade);
        clearTimeout(tEnd);
        clearTimeout(tInit);
      };
    }
  }, []);

  const calculateStackPositions = () => {
    if (!gridContainerRef.current) return;
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;
      
      // Calculate delta to center
      const deltaX = centerX - cardCenterX;
      const deltaY = centerY - cardCenterY;
      
      // Randomize slightly for the "messy stack" look
      const randomRot = ((i % 5) - 2) * 2 + (Math.random() * 4 - 2); 
      const randomOffsetX = (Math.random() * 6) - 3;
      const randomOffsetY = (Math.random() * 6) - 3;

      card.style.setProperty('--intro-x', `${deltaX + randomOffsetX}px`);
      card.style.setProperty('--intro-y', `${deltaY + randomOffsetY}px`);
      card.style.setProperty('--intro-r', `${randomRot}deg`);
    });
  };

  // 2. MAIN ANIMATION LOOP (Post-Prologue)
  useEffect(() => {
    if (introPhase === 'stack') {
      // Hold the stack for a beat so user registers it
      const expandTimer = setTimeout(() => {
        setIntroPhase('expanding');
      }, 800);

      return () => {
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

  const skipIntro = () => {
    calculateStackPositions();
    setIntroPhase('complete');
  };

  // --- MOBILE TACTICAL HUD ENGINE ---
  useEffect(() => {
    if (!hoveredSignal || !hoveredSignal.relatedIds || !isMobile || selectedSignal) {
      setNavHints([]);
      return;
    }

    const checkVisibility = () => {
      const hints: NavHint[] = [];
      const buffer = 80; // pixels from edge to consider "off screen"
      const viewportHeight = window.innerHeight;

      hoveredSignal.relatedIds?.forEach(relatedId => {
        const relatedSignal = SIGNALS.find(s => s.id === relatedId);
        const index = SIGNALS.findIndex(s => s.id === relatedId);
        const el = cardRefs.current[index];

        if (el && relatedSignal) {
          const rect = el.getBoundingClientRect();
          
          if (rect.bottom < buffer) {
             hints.push({ ...relatedSignal, direction: 'up' });
          } else if (rect.top > viewportHeight - buffer) {
             hints.push({ ...relatedSignal, direction: 'down' });
          }
        }
      });
      setNavHints(hints);
    };

    window.addEventListener('scroll', checkVisibility);
    // Initial check
    checkVisibility();
    
    return () => window.removeEventListener('scroll', checkVisibility);
  }, [hoveredSignal, isMobile, selectedSignal]); // Re-run when focus changes

  const handleNavHintClick = (hint: NavHint) => {
    const index = SIGNALS.findIndex(s => s.id === hint.id);
    const el = cardRefs.current[index];
    const signal = SIGNALS.find(s => s.id === hint.id);

    if (el && signal) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHoveredSignal(signal); // Transfer focus
      // Small vibration if supported
      if (navigator.vibrate) navigator.vibrate(5);
    }
  };


  // --- APP LOGIC ---

  useEffect(() => {
    if (selectedSignal) {
      setIsModalVisible(true);
      setGemSavedSuccess(false); // Reset save state on new open
      setNavHints([]); // Clear HUD when modal opens
      if (!scenarioData || scenarioData.scenario_title !== selectedSignal.title) {
        // Only generate if we don't have data or it's new
        handleGenerate(selectedSignal, role, industry);
      }
    } else {
      setIsModalVisible(false);
    }
  }, [selectedSignal]);

  // Handle Scroll to Saved Gem
  useEffect(() => {
    if (lastSavedGemId && currentView === 'gems' && myGems.length > 0) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`gem-${lastSavedGemId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-black', 'ring-offset-4');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-black', 'ring-offset-4');
          }, 2500);
        }
        setLastSavedGemId(null); 
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

  const handleReshuffle = () => {
    if (selectedSignal) {
      handleGenerate(selectedSignal, role, industry);
    }
  };

  const handleClose = () => {
    setIsModalVisible(false);
    setTimeout(() => {
      setSelectedSignal(null);
      setScenarioData(null); 
    }, 100); 
  };

  // --- GEM LOGIC ---

  const handleSaveClick = () => {
    if (!userEmail) {
      setShowEmailGate(true);
    } else {
      executeSaveGem(userEmail);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput && emailInput.includes('@')) {
      localStorage.setItem('third_signal_email', emailInput);
      setUserEmail(emailInput);
      setShowEmailGate(false);
      loadGems(emailInput);
      if (selectedSignal && scenarioData) {
        executeSaveGem(emailInput);
      }
    }
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

      setTimeout(() => {
        handleClose();
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
      setRole(gem.role);
      setIndustry(gem.industry);
      setScenarioData(gem.scenario);
      setSelectedSignal(signal);
      setGemSavedSuccess(true); 
    }
  };

  // --- INTERACTION LOGIC ---

  const handleSignalClick = (e: React.MouseEvent, signal: Signal, isDisabled: boolean) => {
    e.stopPropagation();
    // On Mobile: Allow "clicking" a disabled (constellation-dimmed) card to switch focus to it.
    // Only block if search has explicitly filtered it out.
    if (isDisabled && !isMobile) return; 
    if (introPhase !== 'complete') return;
    
    // Explicit search filter check again to be safe
    const isSearchMatch = signal.title.toLowerCase().includes(searchTerm.toLowerCase()) || signal.index.includes(searchTerm);
    if (searchTerm !== '' && !isSearchMatch) return;

    if (isMobile) {
      if (hoveredSignal?.id === signal.id) {
        // Second tap -> Reveal
        setSelectedSignal(signal);
      } else {
        // First tap -> Focus (Hover state)
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

  // Background control
  const isIntroDark = introPhase === 'prologue' || introPhase === 'stack';

  // Prepare Gravitational Echoes (Max 3 visible)
  const visibleHints = navHints.slice(0, 3);
  const topHints = visibleHints.filter(h => h.direction === 'up');
  const bottomHints = visibleHints.filter(h => h.direction === 'down');

  return (
    <div className={`min-h-screen selection:bg-black selection:text-white font-light intro-container-transition overflow-hidden ${isIntroDark ? 'bg-[#050505]' : 'bg-[#f5f5f5] text-[#1a1a1a]'}`}>
      
      {/* GRAVITATIONAL ECHO LAYER (MOBILE ONLY) */}
      {isMobile && !selectedSignal && introPhase === 'complete' && (
        <>
          {/* Top Echoes */}
          <div className="fixed top-0 left-0 right-0 pt-24 pb-8 flex justify-center gap-3 pointer-events-none z-30">
             {topHints.map(hint => (
               <div 
                  key={hint.id}
                  onClick={(e) => { e.stopPropagation(); handleNavHintClick(hint); }}
                  className="pointer-events-auto w-20 h-20 bg-[#f5f5f5]/80 backdrop-blur-[2px] border border-black/5 flex flex-col justify-between p-2.5 animate-in fade-in slide-in-from-top-4 duration-700 ease-out hover:opacity-100 transition-opacity cursor-pointer shadow-[0_0_15px_rgba(0,0,0,0.02)]"
               >
                 <span className="text-[9px] font-mono text-black/30 leading-none">{hint.index}</span>
                 <span className="text-[9px] font-editorial text-black/50 leading-tight line-clamp-2">{hint.title}</span>
               </div>
             ))}
          </div>

          {/* Bottom Echoes */}
          <div className="fixed bottom-0 left-0 right-0 pt-8 pb-8 flex justify-center gap-3 pointer-events-none z-30">
             {bottomHints.map(hint => (
               <div 
                  key={hint.id}
                  onClick={(e) => { e.stopPropagation(); handleNavHintClick(hint); }}
                  className="pointer-events-auto w-20 h-20 bg-[#f5f5f5]/80 backdrop-blur-[2px] border border-black/5 flex flex-col justify-between p-2.5 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out hover:opacity-100 transition-opacity cursor-pointer shadow-[0_0_15px_rgba(0,0,0,0.02)]"
               >
                 <span className="text-[9px] font-mono text-black/30 leading-none">{hint.index}</span>
                 <span className="text-[9px] font-editorial text-black/50 leading-tight line-clamp-2">{hint.title}</span>
               </div>
             ))}
          </div>
        </>
      )}

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

      {/* EMAIL GATE MODAL */}
      {showEmailGate && (
         <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#111] border border-white/20 p-8 w-full max-w-md shadow-2xl relative">
               <button onClick={() => setShowEmailGate(false)} className="absolute top-4 right-4 text-white/40 hover:text-white">✕</button>
               <h3 className="text-white text-xl font-editorial italic mb-2">Initialize Personal Atlas</h3>
               <p className="text-white/60 text-xs mb-6 leading-relaxed">To save scenarios to your permanent collection, please identify yourself. We use this strictly to index your Gems.</p>
               <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                  <input 
                    type="email" 
                    placeholder="ENTER YOUR EMAIL" 
                    autoFocus
                    className="bg-transparent border-b border-white/30 text-white py-2 text-sm focus:border-white outline-none placeholder-white/20 tracking-widest uppercase font-mono"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                  />
                  <button type="submit" className="bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-colors mt-2">
                    Access My Gems
                  </button>
               </form>
            </div>
         </div>
      )}

      {/* PROLOGUE SCENE (The Cinematic Intro) */}
      <div 
        className={`fixed inset-0 z-[60] flex flex-col items-center justify-center pointer-events-none transition-opacity duration-1000 ease-in-out ${introPhase === 'prologue' ? 'opacity-100' : 'opacity-0'}`}
      >
         <div className="max-w-3xl px-6 text-center space-y-8 md:space-y-12">
            {/* Beat 1: The Hook */}
            <h1 className={`text-white text-2xl md:text-4xl font-editorial italic transition-all duration-700 ease-out ${(prologueLine >= 1 && !prologueFading) ? 'opacity-100 translate-y-0' : (prologueFading ? 'opacity-0 delay-300 translate-y-[-10px]' : 'opacity-0 translate-y-8')}`}>
              "Most AI investments don’t fail.<br/>
              They just quietly disappoint."
            </h1>

            {/* Beat 2: The Analysis */}
            <div className={`text-white/95 text-base md:text-xl font-light tracking-normal leading-[1.55] transition-all duration-500 delay-300 ease-out ${(prologueLine >= 2 && !prologueFading) ? 'opacity-100 translate-y-0' : (prologueFading ? 'opacity-0 translate-y-[-10px]' : 'opacity-0 translate-y-4')}`}>
              <p className="mb-4">
                Not because the technology is weak —<br className="hidden md:block"/>
                but because organizations misread the signals around it.
              </p>
              <p>
                Small, often invisible forces decide whether AI<br className="hidden md:block"/>
                compounds value… or turns into an expensive experiment.
              </p>
            </div>

            {/* Beat 3: The Offer */}
            <div className={`transition-all duration-500 delay-500 ease-out space-y-8 ${(prologueLine >= 3 && !prologueFading) ? 'opacity-100 scale-100' : (prologueFading ? 'opacity-0 scale-95' : 'opacity-0 scale-95')}`}>
               <p className="text-white/60 text-xs md:text-sm font-light tracking-widest uppercase">
                  This atlas helps you see the signals<br/>
                  that actually determine ROI, speed, and risk.
               </p>
               <div className="inline-block border-t border-b border-white/30 py-4 px-8">
                  <div className="text-white text-xs font-bold tracking-[0.3em] uppercase">20 AI Signals. One Atlas.</div>
               </div>
            </div>
         </div>

         {/* Skip Button (Bottom Right) */}
         <div className={`fixed bottom-8 right-8 pointer-events-auto transition-opacity duration-500 ${prologueFading ? 'opacity-0' : 'opacity-100'}`}>
            <button 
              onClick={skipIntro}
              className="text-white/20 text-[10px] uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2 group"
            >
              <span>View the Signals</span>
              <span className="group-hover:translate-x-1 transition-transform duration-300">-></span>
            </button>
         </div>
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
              
              // Mobile Focus State (Tap 1)
              const isMobileFocused = isMobile && isHovered;

              const isConstellationDimmed = !searchTerm && hoveredSignal && !isHovered && !isRelated;
              
              // Interaction Disabled Logic
              // Mobile: Allow clicking 'dimmed' cards to switch focus (unless search filtered)
              const isDisabled = isMobile ? isSearchDimmed : (isSearchDimmed || isConstellationDimmed);
              
              // Visual Dimming Logic
              const isVisuallyDimmed = isSearchDimmed || isConstellationDimmed;

              // Only stack during 'stack' phase. Prologue handles visibility via opacity.
              const isStacking = introPhase === 'stack' || introPhase === 'prologue'; 
              const isContentVisible = introPhase === 'expanding' || introPhase === 'complete';

              // Cinematic Emergence Logic:
              // During prologue reading: Cards are faint and blurred (opacity-20 blur-sm)
              // During prologue fading (Exit): Cards emerge (opacity-100 blur-0)
              const isPrologueReading = introPhase === 'prologue' && !prologueFading;
              const isPrologueExiting = introPhase === 'prologue' && prologueFading;

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
                    ${introPhase === 'complete' ? 'cursor-pointer' : ''}

                    /* Prologue Visibility States */
                    ${isPrologueReading ? 'opacity-20 blur-[2px] scale-95 grayscale' : ''}
                    ${isPrologueExiting ? 'opacity-100 blur-0 scale-105 duration-[1500ms]' : ''}
                    
                    /* Desktop Hover Styles */
                    ${introPhase === 'complete' && !isMobile && !isStacking ? 'bg-[#f5f5f5] hover:bg-white hover:shadow-card-hover hover:scale-[1.025] hover:z-20' : ''}
                    
                    /* Mobile Focused Style (Cinematic Pulse) */
                    ${isMobileFocused && introPhase === 'complete' ? 'mobile-active-card' : ''}
                    ${!isMobileFocused && !isStacking && introPhase === 'complete' ? 'bg-[#f5f5f5]' : ''}

                    /* Dimming States */
                    ${isVisuallyDimmed && introPhase === 'complete' ? 'opacity-20 blur-[1px] scale-[0.98] grayscale pointer-events-none' : ''}
                    
                    /* Related Cards */
                    ${isRelated && introPhase === 'complete' ? 'bg-white z-10 scale-[1.005] ring-1 ring-black/5' : ''}
                  `}
                >
                  <div className="flex justify-between items-start">
                    <div className={`text-[8px] md:text-[10px] font-mono transition-all dur-md 
                        ${isStacking ? 'text-white/30' : 'text-black/40'}
                        ${isRelated || isHovered ? 'opacity-100 text-black font-bold' : ''}
                    `}>
                        {signal.index}
                    </div>
                    {isMobileFocused && introPhase === 'complete' && (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <span className="text-[8px] font-bold uppercase tracking-widest bg-black text-white px-2 py-1 animate-pulse">Tap to Decode</span>
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
                        onClick={() => { setRole(r); if(!loading) handleGenerate(selectedSignal, r, industry); }}
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
                        onClick={() => { setIndustry(i); if(!loading) handleGenerate(selectedSignal, role, i); }}
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
            <div ref={contentScrollRef} className="w-full md:w-2/3 p-8 md:p-16 relative bg-[#fff] md:overflow-y-auto">
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
                       <div className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-6">Compounds With</div>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           {scenarioData.compounds_with.map((title) => {
                             const s = findSignalByTitle(title);
                             if (!s) return null;
                             return (
                               <button 
                                 key={title}
                                 onClick={() => { 
                                   if (contentScrollRef.current) contentScrollRef.current.scrollTop = 0;
                                   setSelectedSignal(s); 
                                  }}
                                 className="group flex items-start gap-4 p-4 -ml-4 border border-transparent hover:border-black/5 hover:bg-gray-50 transition-all dur-md ease-exit text-left rounded-sm"
                               >
                                 <span className="text-xs font-mono text-gray-300 group-hover:text-black transition-colors pt-1.5">{s.index}</span>
                                 <div className="flex flex-col">
                                    <span className="text-xl font-editorial italic text-gray-800 group-hover:text-black transition-colors leading-tight">
                                        {s.title}
                                    </span>
                                    <span className="text-[9px] uppercase tracking-widest text-gray-400 mt-2 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all dur-sm">
                                        Decode Signal &rarr;
                                    </span>
                                 </div>
                               </button>
                             );
                           })}
                       </div>
                     </section>
                  )}

                  {/* Footer */}
                  <div className="flex justify-between items-center border-t border-gray-100 pt-8 opacity-60 hover:opacity-100 transition-opacity dur-md animate-fade-up" style={{ animationDelay: '600ms' }}>
                    <button onClick={handleReshuffle} className="flex items-center gap-2 text-xs uppercase tracking-widest hover:text-black transition-colors group">
                      <svg className="group-hover:rotate-180 transition-transform dur-md ease-spring-soft" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                      Shuffle Scenario
                    </button>
                    <span className="text-[10px] text-gray-400">AI output may vary. Evaluate critically.</span>
                  </div>

                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;