import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { SIGNALS, ROLES, INDUSTRIES } from './constants';
import { Signal, Role, Industry, GeneratedScenario } from './types';
import { generateSignalScenario } from './services/geminiService';

// Animation Phases
type IntroPhase = 'init' | 'measuring' | 'stack' | 'expanding' | 'complete';

const App: React.FC = () => {
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [hoveredSignal, setHoveredSignal] = useState<Signal | null>(null);
  const [role, setRole] = useState<Role>('Exec');
  const [industry, setIndustry] = useState<Industry>('SaaS');
  const [scenarioData, setScenarioData] = useState<GeneratedScenario | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  // Preload animation state
  const [isModalVisible, setIsModalVisible] = useState(false);

  // --- ORCHESTRATION ENGINE ---
  useLayoutEffect(() => {
    // 1. MEASUREMENT PHASE
    if (introPhase === 'init') {
      // Small delay to ensure DOM is painted
      const timer = setTimeout(() => {
        if (!gridContainerRef.current) return;
        
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        cardRefs.current.forEach((card, i) => {
          if (!card) return;
          const rect = card.getBoundingClientRect();
          const cardCenterX = rect.left + rect.width / 2;
          const cardCenterY = rect.top + rect.height / 2;

          // Vector to center
          const deltaX = centerX - cardCenterX;
          const deltaY = centerY - cardCenterY;

          // Random aesthetic jitter for the "Deck" look
          // We use deterministic randomness based on index so it's consistent
          const randomRot = ((i % 5) - 2) * 2 + (Math.random() * 2 - 1); 
          const randomOffsetX = (Math.random() * 4) - 2;
          const randomOffsetY = (Math.random() * 4) - 2;

          // Set CSS Variables on the element itself for performance
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
    // 2. TIMELINE EXECUTION
    if (introPhase === 'stack') {
      // Scene 0: Pre-UI Hold (Black screen, Stack invisible -> visible)
      // Scene 1: Stack appears
      
      // Scene 2: Title Overlay (1.2s in)
      const titleTimer = setTimeout(() => setShowTitleOverlay(true), 1200);
      
      // Scene 2b: Title Overlay Fade Out (2.8s in)
      const titleHideTimer = setTimeout(() => setShowTitleOverlay(false), 2800);

      // Scene 3: Decomposition (3.2s in) - The "Slide Out"
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
      // Scene 4: Grid Lock-In & Interaction Enable (Wait for transition duration)
      const completeTimer = setTimeout(() => {
        setIntroPhase('complete');
      }, 1400); // Matches CSS transition duration
      return () => clearTimeout(completeTimer);
    }
  }, [introPhase]);

  // --- STANDARD APP LOGIC ---

  useEffect(() => {
    if (selectedSignal) {
      setIsModalVisible(true);
      handleGenerate(selectedSignal, role, industry);
    } else {
      setScenarioData(null);
      setError(null);
      setIsModalVisible(false);
    }
  }, [selectedSignal]);

  const handleGenerate = async (s: Signal, r: Role, i: Industry) => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateSignalScenario(s, r, i);
      setScenarioData(data);
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
    setTimeout(() => setSelectedSignal(null), 100); 
  };

  const handleSignalClick = (e: React.MouseEvent, signal: Signal, isDisabled: boolean) => {
    e.stopPropagation();
    if (isDisabled || introPhase !== 'complete') return; // Disable during intro

    if (isMobile) {
      if (hoveredSignal?.id === signal.id) {
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

  // Background Color Logic
  // Scene 0-3: Black (#111). Scene 4+: Gray (#f5f5f5).
  const isIntroDark = introPhase === 'init' || introPhase === 'stack' || introPhase === 'measuring';

  return (
    <div className={`min-h-screen selection:bg-black selection:text-white font-light intro-container-transition overflow-hidden ${isIntroDark ? 'bg-[#111]' : 'bg-[#f5f5f5] text-[#1a1a1a]'}`}>
      
      {/* SCENE 2: TITLE OVERLAY */}
      <div 
        className={`fixed inset-0 z-[60] flex flex-col items-center justify-center pointer-events-none transition-opacity duration-1000 ease-in-out ${showTitleOverlay ? 'opacity-100' : 'opacity-0'}`}
      >
         <h1 className="text-white text-xs font-bold tracking-[0.3em] uppercase mb-2">Third Signal</h1>
         <div className="w-8 h-[1px] bg-white/30 mb-2"></div>
         <p className="text-white/50 text-[10px] font-mono tracking-widest">Signal Atlas v0.1</p>
      </div>

      {/* Header (Fades in at end) */}
      <header 
        className={`fixed top-0 left-0 w-full z-10 px-6 py-6 flex justify-between items-center text-black pointer-events-none transition-opacity duration-1000 delay-500 ${introPhase === 'complete' ? 'opacity-100' : 'opacity-0'}`}
      >
        <h1 className="text-xs font-bold tracking-widest uppercase pointer-events-auto">Third Signal <span className="opacity-40 ml-2 font-normal">Signal Atlas v0.1</span></h1>
        
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
              placeholder="FILTER SIGNALS"
              className="bg-transparent text-right border-b border-black/10 focus:border-black outline-none text-xs uppercase tracking-widest py-1 w-24 focus:w-48 transition-all dur-md ease-exit placeholder-black/30"
            />
          </div>
          <div className="text-xs tracking-widest uppercase hidden sm:block">Decode. Deploy. Deliver.</div>
        </div>
      </header>

      {/* Grid State */}
      <main 
        ref={gridContainerRef}
        className={`transition-all dur-lg ease-standard pt-24 pb-24 px-6 min-h-screen ${selectedSignal ? 'opacity-20 blur-sm scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}
        onClick={handleBackgroundClick} 
        onMouseLeave={() => !isMobile && setHoveredSignal(null)}
      >
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px transition-colors duration-[2000ms] ${isIntroDark ? 'border-transparent bg-transparent' : 'bg-gray-200 border border-gray-200'}`}>
          {SIGNALS.map((signal, index) => {
            // Search Logic
            const isSearchMatch = 
              signal.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
              signal.index.includes(searchTerm);
            const isSearchDimmed = searchTerm !== '' && !isSearchMatch;

            // Constellation Logic
            const isHovered = hoveredSignal?.id === signal.id;
            const isRelated = hoveredSignal?.relatedIds?.includes(signal.id);
            const isConstellationDimmed = !searchTerm && hoveredSignal && !isHovered && !isRelated;

            const isDisabled = isSearchDimmed || isConstellationDimmed;
            
            // Intro Logic
            const isStacking = introPhase === 'stack';
            const isContentVisible = introPhase === 'expanding' || introPhase === 'complete';

            return (
              <div
                key={signal.id}
                ref={el => cardRefs.current[index] = el}
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
                {/* Index Number */}
                <div className="flex justify-between items-start">
                   <div className={`text-[8px] md:text-[10px] font-mono transition-all dur-md 
                      ${isStacking ? 'text-white/30' : 'text-black/40'}
                      ${isRelated || isHovered ? 'opacity-100 text-black font-bold' : ''}
                   `}>
                      {signal.index}
                   </div>
                   {/* Mobile Tap Hint */}
                   {isMobile && isHovered && introPhase === 'complete' && (
                     <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <span className="text-[8px] font-bold uppercase tracking-widest bg-black text-white px-2 py-1">Tap to Decode</span>
                     </div>
                   )}
                </div>

                {/* Content (Hidden in Stack) */}
                <div className={`relative overflow-hidden ${isContentVisible ? 'intro-content-visible' : 'intro-content-hidden'}`}>
                  <h2 className="text-sm sm:text-base md:text-2xl font-editorial tracking-tight leading-none group-hover:translate-y-[-2px] transition-transform dur-md ease-exit">
                    {signal.title}
                  </h2>
                  <div className={`w-8 h-[1px] bg-black mt-2 md:mt-4 origin-left transition-transform dur-md ease-exit ${isRelated ? 'scale-x-50 opacity-30' : (isHovered && isMobile) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></div>
                </div>
                
                {/* Arrow Icon */}
                <div className={`absolute bottom-3 right-3 md:bottom-6 md:right-6 transition-all dur-md group-hover:translate-x-0 translate-x-2 ${isContentVisible && (isRelated || (isMobile && isHovered)) ? 'opacity-100 translate-x-0' : 'opacity-0 group-hover:opacity-100'}`}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 11L11 1M11 1H1M11 1V11" stroke="currentColor" strokeWidth="1"/>
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Reveal State (Mode Shift) */}
      {selectedSignal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 transition-opacity dur-md ease-standard ${isModalVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div 
            className="absolute inset-0 bg-[#e5e5e5]/80 backdrop-blur-md transition-opacity dur-lg ease-standard"
            onClick={handleClose}
          />
          
          <div className="bg-white w-full max-w-6xl h-full max-h-[90vh] shadow-2xl relative flex flex-col md:flex-row overflow-y-auto md:overflow-hidden animate-in fade-in zoom-in-95 dur-lg ease-standard ring-1 ring-black/5">
            
            {/* Close Button */}
            <button onClick={handleClose} className="absolute top-6 right-6 z-20 p-2 opacity-50 hover:opacity-100 transition-opacity dur-xs rounded-full mix-blend-difference text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

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
            <div className="w-full md:w-2/3 p-8 md:p-16 relative bg-[#fff] md:overflow-y-auto">
              {/* Mobile Scroll Hint */}
              <div className="md:hidden flex justify-center pb-8 opacity-40 text-[10px] tracking-widest uppercase animate-pulse">
                 Scroll for Intel ↓
              </div>

              {loading ? (
                <div className="h-full flex flex-col justify-center items-center py-20 md:py-0">
                  <div className="relative w-64 h-64 flex items-center justify-center">
                      {/* Abstract Geometry */}
                      <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0 opacity-40">
                        {/* Rotating Rings */}
                        <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="0.2" fill="none" className="animate-[spin_10s_linear_infinite] origin-center" strokeDasharray="4 4" />
                        <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="0.1" fill="none" className="animate-[spin_15s_linear_infinite_reverse] origin-center opacity-50" />
                        
                        {/* Geometric Core */}
                        <rect x="35" y="35" width="30" height="30" stroke="currentColor" strokeWidth="0.2" fill="none" className="animate-construct origin-center" style={{ animationDelay: '0ms' }} />
                        <rect x="30" y="30" width="40" height="40" stroke="currentColor" strokeWidth="0.1" fill="none" className="animate-construct origin-center" style={{ animationDelay: '1000ms' }} />
                        <polygon points="50,10 90,80 10,80" stroke="currentColor" strokeWidth="0.2" fill="none" className="animate-[spin_20s_linear_infinite] origin-center opacity-30" />
                      </svg>
                      
                      {/* Central Pulse */}
                      <div className="w-1 h-1 bg-black rounded-full animate-ping absolute"></div>
                  </div>
                  
                  {/* Text */}
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
                  
                  {/* Scenario - Intent: Insight */}
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

                  {/* Strategy & Risk - Intent: Intelligence */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-gray-100 pt-12 animate-fade-up" style={{ animationDelay: '150ms' }}>
                    <section>
                      <div className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-4">Strategic Implication</div>
                      <p className="text-sm leading-relaxed text-gray-600">{scenarioData.why_it_matters}</p>
                    </section>
                    
                    {/* Failure Mode - Warning Block */}
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

                  {/* Outcome Anchors - Intent: Progression */}
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

                  {/* Compounds With - Intent: Discovery */}
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

                  {/* Footer Action */}
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