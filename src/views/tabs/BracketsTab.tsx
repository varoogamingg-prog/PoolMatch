import React, { useState, useRef } from 'react';
import { Match, EventType } from '../../types';
import { motion } from 'motion/react';
import { getFlagUrl } from '../../iocToAlpha2';
import { Trophy } from 'lucide-react';

import { generateBracketLayout } from '../../utils/bracketLogic';

const BracketNode = ({ match, route, delay = 0, onClick, isQualifierFinal, isLoserNode = false, bpMap, highlightedMatchId }: { match?: Match, route?: any, delay?: number, onClick?: (id: string) => void, isQualifierFinal?: boolean, isLoserNode?: boolean, bpMap?: Record<string, string>, highlightedMatchId?: string | null }) => {
  let bgColor = 'bg-zinc-900';
  let borderColor = 'border-zinc-800';
  if (isQualifierFinal && match?.status === 'finished') {
    bgColor = 'bg-green-500/10';
    borderColor = 'border-green-500/50';
  } else if (isLoserNode) {
    bgColor = 'bg-zinc-950/80';
    borderColor = 'border-zinc-800/80';
  }

  const extraLabel = match ? <span className="text-zinc-600 lowercase ml-1">{match.scoringSystem === 'race' ? `(Race to ${match.raceTo})` : `(Best of ${match.bestOfSets})`}</span> : null;

  return (
  <motion.div 
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3, delay }}
    className={`relative shrink-0 w-[110px] md:w-56 mx-auto ${isLoserNode ? 'mb-4' : ''}`}
  >
    <div className={`text-[8px] md:text-[10px] ${isLoserNode ? 'text-orange-500/80' : 'text-emerald-500'} font-bold mb-1 ml-1 md:ml-2 tracking-widest uppercase flex items-center gap-1`}>
      <span>{route?.label}</span>{extraLabel}
      {route?.loseTo && bpMap && bpMap[route.loseTo] && <span className="text-zinc-500 ml-auto mr-1 md:mr-2 lowercase font-normal">(Loser to #{bpMap[route.loseTo].replace('M', '')})</span>}
    </div>
    <div 
      id={match ? `bracket-match-${match.id}` : undefined}
      className={`w-full ${bgColor} border ${borderColor} rounded-2xl overflow-hidden flex flex-col z-20 relative shadow-md transition-all duration-300 cursor-pointer ${isLoserNode ? 'hover:border-orange-500/50' : 'hover:border-emerald-500/50'} ${match?.id === highlightedMatchId ? '!border-emerald-500 !bg-emerald-500/20 ring-2 ring-emerald-500 z-50' : ''}`}
      onClick={() => {
        match && onClick && onClick(match.id);
      }}
    >
      {match ? (
        <>
           <div className={`p-1.5 md:p-2 flex items-center justify-between border-b ${match.score1 > match.score2 && match.status === 'finished' ? `bg-zinc-800/80 ${isLoserNode ? 'border-orange-500/50' : 'border-green-500/50'}` : 'border-zinc-800'}`}>
             <div className="flex items-center gap-1.5 md:gap-2 overflow-hidden mr-1 md:mr-2">
               {typeof match.player1 !== 'string' && getFlagUrl(match.player1.country) && <img src={getFlagUrl(match.player1.country)!} className="w-2.5 md:w-3 h-auto rounded border border-black/50 object-cover opacity-80 shrink-0" />}
               <span className={`font-semibold text-[10px] md:text-xs ${match.score1 > match.score2 ? (isQualifierFinal && match.status === 'finished' ? 'text-green-400 font-black' : 'text-white') : 'text-zinc-400'} truncate`}>{typeof match.player1 === 'string' ? (match.player1 === 'BYE' ? '(BYE)' : match.player1) : match.player1.name}</span>
             </div>
             <span className="font-mono font-bold text-[10px] md:text-xs text-white">{match.score1}</span>
          </div>
          <div className={`p-1.5 md:p-2 flex items-center justify-between ${match.score2 > match.score1 && match.status === 'finished' ? `bg-zinc-800/80 ${isLoserNode ? 'border-orange-500/50 border-t' : 'border-green-500/50 border-t'}` : ''}`}>
             <div className="flex items-center gap-1.5 md:gap-2 overflow-hidden mr-1 md:mr-2">
               {typeof match.player2 !== 'string' && getFlagUrl(match.player2.country) && <img src={getFlagUrl(match.player2.country)!} className="w-2.5 md:w-3 h-auto rounded border border-black/50 object-cover opacity-80 shrink-0" />}
               <span className={`font-semibold text-[10px] md:text-xs ${match.score2 > match.score1 ? (isQualifierFinal && match.status === 'finished' ? 'text-green-400 font-black' : 'text-white') : 'text-zinc-400'} truncate`}>{typeof match.player2 === 'string' ? (match.player2 === 'BYE' ? '(BYE)' : match.player2) : match.player2.name}</span>
             </div>
             <span className="font-mono font-bold text-[10px] md:text-xs text-white">{match.score2}</span>
          </div>
        </>
      ) : (
         <div className="p-4 flex items-center justify-center text-zinc-600 font-medium text-xs italic">
           TBA
         </div>
      )}
    </div>
  </motion.div>
  )};

export function BracketsTab({ event, matches, onMatchClick, highlightedMatchId }: { event: EventType, matches: Match[], onMatchClick?: (id: string) => void, highlightedMatchId?: string | null }) {
  const hasHybridKnockout = event.format === 'hybrid' && matches.some(m => m.eventId === event.id && m.stage === 'knockout');
  const [activeStage, setActiveStage] = useState<'stage1' | 'stage2' | 'knockout' | 'round-robin'>(
    event.isQualifier ? 'stage1' : (event.format === 'hybrid' ? (hasHybridKnockout ? 'knockout' as any : 'round-robin' as any) : 'knockout')
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (highlightedMatchId) {
      const match = matches.find(m => m.id === highlightedMatchId);
      if (match) {
        if (event.format === 'hybrid' && match.stage === 'knockout') {
          setActiveStage('knockout');
        } else if (match.stage === 'stage1' || match.stage === 'stage2' || match.stage === 'knockout') {
          setActiveStage(match.stage as any);
        }
      }
    }
  }, [highlightedMatchId, matches, event.format]);

  React.useEffect(() => {
    if (scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
      if (event.eliminationType === 'double') {
        el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
      }
    }
  }, [activeStage, event.eliminationType]);

  const knockoutMatches = matches.filter(m => m.stage === activeStage);
  
  const getMatch = (pos: string) => knockoutMatches.find(m => m.bracketPosition === pos);

  const isDouble = (activeStage === 'knockout' || activeStage === 'stage1') && event.eliminationType === 'double';

  const layout = generateBracketLayout(
    activeStage === 'stage2' ? (event.qualifierSpots || 8) : (event.isQualifier ? (event.totalPlayers || 32) : (event.bracketSize || 32)),
    activeStage === 'stage2' ? false : isDouble,
    activeStage === 'stage1' ? event.qualifierSpots : undefined
  );

  const bpMap = layout.reduce((acc, r) => {
    acc[r.bp] = r.label || '';
    return acc;
  }, {} as Record<string, string>);

  const wRoutes = layout.filter(r => !r.isLoserBracket);
  const lRoutes = layout.filter(r => r.isLoserBracket);

  const groupRoutesByRound = (routes: any[]) => {
    const groups: any[] = [];
    routes.forEach(r => {
      let g = groups.find(x => x.name === r.roundName);
      if (!g) {
        g = { name: r.roundName, matches: [] };
        groups.push(g);
      }
      g.matches.push(r);
    });
    return groups;
  };

  const wGroups = groupRoutesByRound(wRoutes);
  const lGroups = groupRoutesByRound(lRoutes);

  const handlePrint = () => {
    window.dispatchEvent(new CustomEvent('app-toast', { detail: 'Printing is restricted in preview. Please export or open in a new tab.' }));
  };

  const stageToggle = (event.isQualifier || event.format === 'hybrid') && (
    <div className="flex w-full mb-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 max-w-xl mx-auto">
      <button 
        onClick={() => setActiveStage(event.format === 'hybrid' ? 'round-robin' as any : 'stage1')}
        className={`flex-1 py-3 text-sm font-black font-display tracking-widest uppercase transition-colors ${(activeStage === 'stage1' || activeStage === 'round-robin') ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
      >
        Stage 1 
        <span className="block text-[10px] font-medium text-zinc-500 uppercase mt-0.5">{event.format === 'hybrid' ? 'Round Robin' : 'Qualification'}</span>
      </button>
      <div className="w-px bg-zinc-800" />
      <button 
        onClick={() => {
          if (matches.some(m => m.eventId === event.id && (m.stage === 'stage2' || (event.format === 'hybrid' && m.stage === 'knockout')))) {
            setActiveStage((event.format === 'hybrid' && !event.isQualifier) ? 'knockout' : 'stage2');
          }
        }}
        className={`flex-1 py-3 text-sm font-black font-display tracking-widest uppercase transition-colors ${!matches.some(m => m.eventId === event.id && (m.stage === 'stage2' || (event.format === 'hybrid' && m.stage === 'knockout'))) ? 'opacity-50 cursor-not-allowed text-zinc-600' : (activeStage === 'stage2' || activeStage === 'knockout') ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
      >
        Stage 2
        <span className="block text-[10px] font-medium text-zinc-500 uppercase mt-0.5">{event.format === 'hybrid' ? 'Knockout Bracket' : 'Main Event'}</span>
      </button>
    </div>
  );

  if (knockoutMatches.length === 0 || activeStage === 'round-robin') {
    const hasRRMatches = matches.some(m => m.eventId === event.id && m.stage === 'round-robin');
    return (
      <div className="w-full">
        {stageToggle}
        <div className="flex flex-col items-center justify-center p-16 text-zinc-500 min-h-[40vh]">
          <Trophy className="w-16 h-16 mb-6 opacity-30 text-emerald-500" />
          {hasRRMatches && activeStage === 'round-robin' ? (
            <>
              <p className="font-bold text-xl text-white mb-2">Round Robin format doesn't have a bracket</p>
              <p className="text-sm mt-3 text-zinc-400 text-center max-w-md mx-auto leading-relaxed">Round robin phase is active.<br/><br/>Please view matches in the Matches tab or standings in the Standings tab.</p>
            </>
          ) : hasRRMatches ? (
            <>
              <p className="font-bold text-xl text-white mb-2">Tournament is in Round-Robin phase</p>
              <p className="text-sm mt-3 text-zinc-400 text-center max-w-md mx-auto leading-relaxed">Complete the round-robin matches first to determine standings.<br/><br/>When ready, you can advance the top players from the Standings tab to automatically generate the knockout bracket.</p>
            </>
          ) : (
            <>
              <p className="font-bold text-xl text-white mb-2">Bracket isn't created yet</p>
              <p className="text-sm mt-3 text-zinc-400 text-center max-w-md mx-auto leading-relaxed">The knockout bracket will appear here.<br/><br/>You can generate initial matches from the Matches tab, or advance players from the Standings tab.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {stageToggle}

      {knockoutMatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-zinc-500 min-h-[40vh]">
          <Trophy className="w-16 h-16 mb-6 opacity-30 text-emerald-500" />
          <p className="font-bold text-xl text-white mb-2">Bracket isn't created yet</p>
          <p className="text-sm mt-3 text-zinc-400 text-center max-w-md mx-auto leading-relaxed">The knockout bracket will appear here.<br/><br/>You can generate initial matches from the Matches tab, or advance players from the Standings tab.</p>
        </div>
      ) : (
      <>
      <div className="flex justify-end mb-4 pr-4">
        <button onClick={handlePrint} className="bg-zinc-800 text-white px-3 py-1.5 rounded text-sm hover:bg-zinc-700">
          Print Bracket
        </button>
      </div>
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto overflow-y-auto mix-blend-normal bg-zinc-950/50 rounded-3xl border border-zinc-800 relative select-none bracket-container custom-scrollbar touch-pan-x touch-pan-y"
      >
        <div className="flex flex-row pt-20 pb-12 px-12 min-w-max items-stretch justify-center">
          {/* LOSERS BRACKET */}
          {lGroups.length > 0 && (
            <div className="flex flex-row-reverse relative items-stretch" style={{ marginRight: '4rem' }}>
              <div className="absolute -top-16 left-0 w-full text-center text-orange-500/50 font-black tracking-widest text-sm italic uppercase border-b border-orange-500/20 pb-2">Losers Bracket</div>
              {lGroups.map((group, rIdx) => (
                <div key={group.name} className="flex flex-col relative w-[140px] md:w-[260px] flex-shrink-0" style={{ minHeight: `${group.matches.length * 100}px` }}>
                  {/* Column header */}
                  <div className="absolute -top-6 w-full text-center text-xs font-bold text-zinc-500 uppercase tracking-widest">{group.name}</div>
                  
                  {group.matches.map((route: any, i: number) => {
                    const pos = route.bp;
                    const matchObj = getMatch(pos);
                    const extraLabel = matchObj ? <span className="text-zinc-600 lowercase ml-1">{matchObj.scoringSystem === 'race' ? `(Race to ${matchObj.raceTo})` : `(Best of ${matchObj.bestOfSets})`}</span> : null;
                    
                    const hasNextRound = rIdx < lGroups.length - 1;
                    const isTopNode = i % 2 === 0;

                    const nextGroupMatches = hasNextRound ? lGroups[rIdx + 1].matches.length : 0;
                    const isNarrowing = nextGroupMatches < group.matches.length;

                    return (
                      <div key={pos} className="relative flex-none flex items-center justify-center w-full min-h-[100px]" style={{ flex: 1 }}>
                        <BracketNode 
                          match={matchObj} 
                          route={route}
                          delay={0.05 * rIdx} 
                          onClick={onMatchClick} 
                          isLoserNode={true}
                          bpMap={bpMap}
                          highlightedMatchId={highlightedMatchId}
                        />

                        {hasNextRound && isNarrowing && isTopNode && (
                          <div className="absolute top-1/2 border-l-2 border-t-2 border-b-2 border-zinc-700/30 rounded-l-xl pointer-events-none" style={{ right: '100%', width: '1rem', height: '100%', zIndex: 1 }} />
                        )}
                        {hasNextRound && isNarrowing && (
                          <div className="absolute top-1/2 border-b-2 border-zinc-700/30 pointer-events-none" style={{ right: '100%', width: '1rem', zIndex: 1 }} />
                        )}
                        {hasNextRound && isNarrowing && isTopNode && (
                          <div className="absolute border-b-2 border-zinc-700/30 pointer-events-none" style={{ top: '100%', right: 'calc(100% + 1rem)', width: '1.5rem', zIndex: 1 }} />
                        )}

                        {hasNextRound && !isNarrowing && (
                          <div className="absolute top-1/2 border-b-2 border-zinc-700/30 pointer-events-none" style={{ right: '100%', width: '2.5rem', zIndex: 1 }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* WINNERS BRACKET */}
          <div className="flex relative items-stretch">
            {wGroups.some(g => g.matches.length > 0) && event.isQualifier && (
              <div className="absolute -top-16 left-0 w-full text-center text-emerald-500/50 font-black tracking-widest text-sm italic uppercase border-b border-emerald-500/20 pb-2">Winners Bracket</div>
            )}
            {wGroups.map((group, rIdx) => (
              <div key={group.name} className="flex flex-col relative w-[140px] md:w-[260px] flex-shrink-0" style={{ minHeight: `${group.matches.length * 100}px` }}>
                {/* Column header */}
                <div className="absolute -top-6 w-full text-center text-xs font-bold text-zinc-500 uppercase tracking-widest">{activeStage === 'stage1' ? `WQ ${rIdx + 1}` : group.name}</div>
                
                {group.matches.map((route: any, i: number) => {
                  const pos = route.bp;
                  const matchObj = getMatch(pos);
                  const extraLabel = matchObj ? <span className="text-zinc-600 lowercase ml-1">{matchObj.scoringSystem === 'race' ? `(Race to ${matchObj.raceTo})` : `(Best of ${matchObj.bestOfSets})`}</span> : null;
                  
                  // Calculate dynamic connections
                  const hasNextRound = rIdx < wGroups.length - 1;
                  const isTopNode = i % 2 === 0;

                  return (
                    <div key={pos} className="relative flex-1 flex items-center justify-center w-full min-h-[100px]">
                      <BracketNode 
                        match={matchObj} 
                        route={route}
                        delay={0.05 * rIdx} 
                        onClick={onMatchClick} 
                        isQualifierFinal={activeStage === 'stage1' && rIdx === wGroups.length - 1}
                        bpMap={bpMap}
                        highlightedMatchId={highlightedMatchId}
                      />
                      
                      {/* Drawing connections rightwards */}
                      {hasNextRound && isTopNode && group.matches.length > 1 && (
                        <div className="absolute top-1/2 border-r-2 border-t-2 border-b-2 border-zinc-700/50 rounded-r-xl pointer-events-none" style={{ left: '100%', width: '1rem', height: '100%', zIndex: 1 }} />
                      )}
                      {hasNextRound && group.matches.length > 1 && (
                        <div className="absolute top-1/2 border-b-2 border-zinc-700/50 pointer-events-none" style={{ left: '100%', width: '1rem', zIndex: 1 }} />
                      )}
                      {hasNextRound && isTopNode && group.matches.length > 1 && (
                        <div className="absolute border-b-2 border-zinc-700/50 pointer-events-none" style={{ top: '100%', left: 'calc(100% + 1rem)', width: '1.5rem', zIndex: 1 }} />
                      )}
                      {/* Straight line for 1:1 mapping (Grand Final) */}
                      {hasNextRound && group.matches.length === 1 && (
                        <div className="absolute top-1/2 border-b-2 border-zinc-700/50 pointer-events-none" style={{ left: '100%', width: '2.5rem', zIndex: 1 }} />
                      )}

                      {/* Drawing connections leftwards for Double Elim (WR1 -> LR1) */}
                      {isDouble && rIdx === 0 && isTopNode && group.matches.length > 1 && (
                        <div className="absolute top-1/2 border-l-2 border-t-2 border-b-2 border-zinc-700/50 rounded-l-xl pointer-events-none" style={{ right: '100%', width: '1rem', height: '100%', zIndex: 1 }} />
                      )}
                      {isDouble && rIdx === 0 && group.matches.length > 1 && (
                        <div className="absolute top-1/2 border-b-2 border-zinc-700/50 pointer-events-none" style={{ right: '100%', width: '1rem', zIndex: 1 }} />
                      )}
                      {isDouble && rIdx === 0 && isTopNode && group.matches.length > 1 && (
                        <div className="absolute border-b-2 border-zinc-700/50 pointer-events-none" style={{ top: '100%', right: 'calc(100% + 1rem)', width: '3rem', zIndex: 1 }} />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
    )}
    </div>
  );
}
