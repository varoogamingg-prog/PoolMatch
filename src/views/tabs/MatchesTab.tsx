import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Match, EventType } from '../../types';
import { useStore } from '../../store';
import { generateBracketLayout } from '../../utils/bracketLogic';
import { Edit2, Disc, PlayCircle, Plus, Wand2, Download, Search, ChevronDown, ChevronUp, LayoutGrid, List, Trash2, Trophy, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScoreboardView } from '../ScoreboardView';
import { EditMatchModal } from './EditMatchModal';
import { getFlagUrl } from '../../iocToAlpha2';
import { ConfirmModal } from '../../components/ConfirmModal';

export function MatchesTab({ event, matches, isAdmin, onMatchClick, onGoToBracket, highlightedMatchId }: { event: EventType, matches: Match[], isAdmin: boolean, onMatchClick?: (id: string) => void, onGoToBracket?: () => void, highlightedMatchId?: string | null }) {
  const { updateMatch, addMatch, addMatches, players, updateEvent, deleteMatch, deleteMatches } = useStore();
  const navigate = useNavigate();
  const [confirmAction, setConfirmAction] = useState<{action: () => void, text: string} | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [activeScoreboardId, setActiveScoreboardId] = useState<string|null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'id' | 'time' | 'table' | 'status'>('id');
  const [viewMode, setViewMode] = useState<'full' | 'minimal'>(isAdmin ? 'full' : 'minimal');
  const [mobileViewMode, setMobileViewMode] = useState<'minimalist' | 'bulky'>(isAdmin ? 'bulky' : 'minimalist');
  const [p1Id, setP1Id] = useState('');
  const [p2Id, setP2Id] = useState('');
  const [stage, setStage] = useState<'round-robin' | 'knockout' | 'stage1' | 'stage2'>(
    event.isQualifier ? 'stage1' : (event.format === 'knockout' ? 'knockout' : (event.format === 'hybrid' ? 'round-robin' : 'round-robin'))
  );
  const [scoringSystem, setScoringSystem] = useState<'race'|'sets'>(event.defaultScoringSystem || 'race');
  const [bestOfSets, setBestOfSets] = useState(3);
  const [raceTo, setRaceTo] = useState(event.defaultRaceTo || 9);
  const [time, setTime] = useState('19:00');
  const [pos, setPos] = useState('');
  const [bracketSize, setBracketSize] = useState(event.bracketSize || 16);

  const eventPlayers = useMemo(() => {
    if (event.enrolledPlayers && event.enrolledPlayers.length > 0) {
      return players.filter(p => event.enrolledPlayers!.includes(p.id));
    }
    return players;
  }, [players, event.enrolledPlayers]);

  const handleScoreUpdate = (match: Match, pIdx: 1 | 2, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (match.status === 'finished') return;
    
    const mRaceTo = match.raceTo || event.defaultRaceTo || 9;
    let n1 = match.score1;
    let n2 = match.score2;
    
    if (pIdx === 1) {
      n1 = Math.max(0, match.score1 + delta);
      if (n1 > mRaceTo) return;
    } else {
      n2 = Math.max(0, match.score2 + delta);
      if (n2 > mRaceTo) return;
    }
    
    if ((pIdx === 1 && n1 === mRaceTo) || (pIdx === 2 && n2 === mRaceTo)) {
      setConfirmAction({
        text: `Is this the winner? Score will be ${n1} - ${n2} and the match will be marked as finished.`,
        action: () => {
          updateMatch({ 
            ...match, 
            score1: n1, 
            score2: n2, 
            status: 'finished',
            endTime: Date.now()
          });
        }
      });
    } else {
      let newStatus = match.status;
      if (match.status === 'pending' && (n1 > 0 || n2 > 0)) {
        newStatus = 'live';
      }
      updateMatch({ ...match, score1: n1, score2: n2, status: newStatus });
    }
  };

  const handleClearAll = () => {
    setConfirmAction({
      text: 'Are you sure you want to delete ALL matches for this event?',
      action: () => {
        const eventMatches = matches.filter(m => m.eventId === event.id);
        deleteMatches(eventMatches.map(m => m.id));
      }
    });
  };

  const getRoundsForSize = (size: number, stopAtSpots?: number) => {
    const rounds = [];
    if (size >= 512) rounds.push('R512');
    if (size >= 256) rounds.push('R256');
    if (size >= 128) rounds.push('R128');
    if (size >= 64) rounds.push('R64');
    if (size >= 32) rounds.push('R32');
    if (size >= 16 && (!stopAtSpots || stopAtSpots < 16)) rounds.push('R16');
    if (size >= 8 && (!stopAtSpots || stopAtSpots < 8)) rounds.push('QF');
    if (size >= 4 && (!stopAtSpots || stopAtSpots < 4)) rounds.push('SF');
    if (size >= 2 && (!stopAtSpots || stopAtSpots < 2)) rounds.push('Final');
    return rounds;
  };

  // Bracket sizing logic up to 512
  const effectiveBracketSize = event.isQualifier ? (event.totalPlayers || 32) : (event.bracketSize || 32);
  const generateBracketPositions = () => {
    if (stage === 'stage2') {
      return generateBracketLayout(event.qualifierSpots || 8, false, undefined).map(r => r.bp);
    }
    return generateBracketLayout(
      effectiveBracketSize, 
      (stage === 'stage1' || stage === 'knockout') ? event.eliminationType === 'double' : false, 
      (stage === 'stage1' && event.isQualifier) ? event.qualifierSpots : undefined
    ).map(r => r.bp);
  };

  const handleAutomate = () => {
    let modeToGenerate = stage;
    
    if (event.format === 'hybrid') {
      modeToGenerate = 'round-robin';
      window.dispatchEvent(new CustomEvent('app-toast', { detail: 'Hybrid Event: Automating initial Round-Robin matches.' }));
    }

    if (modeToGenerate === 'knockout' || modeToGenerate === 'stage1' || modeToGenerate === 'stage2') {
      const isStage2 = modeToGenerate === 'stage2';
      const isStage1 = modeToGenerate === 'stage1';
      
      const effectiveSize = isStage2 ? (event.qualifierSpots || 8) : effectiveBracketSize;
      const isDouble = isStage1 ? event.eliminationType === 'double' : (modeToGenerate === 'knockout' ? event.eliminationType === 'double' : false);
      const stopAt = isStage1 ? event.qualifierSpots : undefined;
      
      const allPosRoutes = generateBracketLayout(effectiveSize, isDouble, stopAt);
      const firstRound = allPosRoutes.length > 0 ? allPosRoutes[0].roundName : '';
      const firstRoundMatchesExist = matches.some(m => m.eventId === event.id && m.stage === modeToGenerate && m.bracketPosition && String(m.bracketPosition).startsWith(firstRound));
      
      if (firstRoundMatchesExist) {
        window.dispatchEvent(new CustomEvent('app-toast', { detail: 'Automated matches have already been generated for this stage.' }));
        return;
      }

      const shuffledPlayers = [...eventPlayers].sort(() => Math.random() - 0.5);
      const paddedPlayers = isStage2 ? [] : [...shuffledPlayers];
      
      if (isStage2) {
        // Fill stage 2 with TBA placeholders
        for (let i = 0; i < effectiveSize; i++) {
          paddedPlayers.push(`Qualifier ${i+1}` as any);
        }
      } else {
        while (paddedPlayers.length < effectiveSize) {
          paddedPlayers.push('BYE' as any);
        }
      }
      
      const matchesToAdd: Match[] = [];
      let playerCursor = 0;

      for (const route of allPosRoutes) {
        // If it's the very first winner round, populate players
        let p1: any = 'TBA';
        let p2: any = 'TBA';

        if (route.roundName === firstRound) {
          p1 = paddedPlayers[playerCursor];
          p2 = paddedPlayers[effectiveSize - 1 - playerCursor];
          playerCursor++;
        }

        matchesToAdd.push({
          id: 'm-' + Math.random().toString(36).substr(2, 6),
          eventId: event.id,
          player1: p1 || 'TBA',
          player2: p2 || 'TBA',
          score1: ['BYE', 'DSQ', 'NS'].includes(p2 as string) ? (scoringSystem === 'race' ? (event.roundRaceTo?.[route.roundName] || raceTo) : bestOfSets) : 0,
          score2: ['BYE', 'DSQ', 'NS'].includes(p1 as string) ? (scoringSystem === 'race' ? (event.roundRaceTo?.[route.roundName] || raceTo) : bestOfSets) : 0,
          status: (['BYE', 'DSQ', 'NS'].includes(p1 as string) || ['BYE', 'DSQ', 'NS'].includes(p2 as string)) ? 'finished' : 'pending',
          stage: modeToGenerate,
          tableNumber: 1, // Defaulting table
          scoringSystem,
          raceTo: scoringSystem === 'race' ? (event.roundRaceTo?.[route.roundName] || raceTo) : undefined,
          bestOfSets: scoringSystem === 'sets' ? bestOfSets : undefined,
          bracketPosition: route.bp,
          time: 'TBD'
        });
      }

      // If generating stage1 of a qualifier, ALSO pre-generate stage2
      if (isStage1 && event.isQualifier && event.qualifierSpots) {
        const stage2Size = event.qualifierSpots;
        const stage2Routes = generateBracketLayout(stage2Size, false, undefined);
        const s2FirstRound = stage2Routes.length > 0 ? stage2Routes[0].roundName : '';

        for (const route of stage2Routes) {
          let p1: any = 'TBA';
          let p2: any = 'TBA';
          matchesToAdd.push({
            id: 'm-' + Math.random().toString(36).substr(2, 6),
            eventId: event.id,
            player1: p1 || 'TBA',
            player2: p2 || 'TBA',
            score1: 0,
            score2: 0,
            status: 'pending',
            stage: 'stage2',
            tableNumber: 1, // Defaulting table
            scoringSystem,
            raceTo: scoringSystem === 'race' ? (event.roundRaceTo?.[route.roundName] || raceTo) : undefined,
            bestOfSets: scoringSystem === 'sets' ? bestOfSets : undefined,
            bracketPosition: route.bp,
            time: 'TBD'
          });
        }
      }

      if (matchesToAdd.length > 0) {
        addMatches(matchesToAdd);
        window.dispatchEvent(new CustomEvent('app-toast', { detail: `Automated entire ${isStage2 ? 'Main Bracket' : 'Knockout'} bracket.` }));
      }
    } else {
      const existingStages = Array.from(new Set(matches.filter(m => m.eventId === event.id && m.stage === 'round-robin').map(m => m.bracketPosition || 'Stage 1')));
      let stageName = 'Stage 1';
      
      const robinMatchesExist = matches.some(m => m.eventId === event.id && m.stage === 'round-robin');
      if (robinMatchesExist) {
        window.dispatchEvent(new CustomEvent('app-toast', { detail: 'Continuing to add to existing round-robin matches.' }));
        stageName = existingStages[existingStages.length - 1]; // Use current/latest stage
      }

      // Basic auto-generation logic
      if (eventPlayers.length < 2) {
        window.dispatchEvent(new CustomEvent('app-toast', { detail: 'Need at least 2 players to automate games' }));
        return;
      }
      
      window.dispatchEvent(new CustomEvent('app-toast', { detail: `Automating Robin matches for ${stageName}...` }));
      const matchesToAdd: Match[] = [];
      for (let i=0; i<eventPlayers.length; i++) {
        for (let j=i+1; j<eventPlayers.length; j++) {
          matchesToAdd.push({
            id: 'm-' + Math.random().toString(36).substr(2, 6),
            eventId: event.id,
            player1: eventPlayers[i],
            player2: eventPlayers[j],
            score1: 0,
            score2: 0,
            status: 'pending',
            stage: 'round-robin',
            bracketPosition: stageName,
            tableNumber: 1,
            scoringSystem: event.defaultScoringSystem || 'race',
            raceTo: event.defaultRaceTo || 9,
            time: 'TBD'
          });
        }
      }
      if (matchesToAdd.length > 0) {
        addMatches(matchesToAdd);
      }
    }
  };

  // Separate matches by status/stage visually if needed, sorted by time or ID for now
  const sortedMatches = [...matches].sort((a, b) => {
    if (sortBy === 'time') {
      const timeA = a.time || '99:99';
      const timeB = b.time || '99:99';
      return timeA.localeCompare(timeB) || a.id.localeCompare(b.id);
    } else if (sortBy === 'table') {
      return a.tableNumber - b.tableNumber || a.id.localeCompare(b.id);
    } else if (sortBy === 'status') {
      const statusOrder = { live: 0, pending: 1, finished: 2 };
      return (statusOrder[a.status] - statusOrder[b.status]) || a.id.localeCompare(b.id);
    } else if (sortBy === 'id') {
      const getRoundWeight = (bp?: string) => {
        if (!bp) return 999;
        if (bp.includes('R512')) return 1;
        if (bp.includes('R256')) return 2;
        if (bp.includes('R128')) return 3;
        if (bp.includes('R64')) return 4;
        if (bp.includes('R32')) return 5;
        if (bp.includes('R16')) return 6;
        if (bp.includes('QF')) return 7;
        if (bp.includes('SF')) return 8;
        if (bp.includes('Final')) return 9;
        if (bp.startsWith('L')) {
           const match = bp.match(/L(\d+)/);
           if (match) return parseInt(match[1]) + 10;
        }
        return 998;
      };
      
      const wA = getRoundWeight(a.bracketPosition);
      const wB = getRoundWeight(b.bracketPosition);
      if (wA !== wB) return wA - wB;
      
      return a.id.localeCompare(b.id);
    }
    return a.id.localeCompare(b.id);
  });

  const getH2H = (m: Match) => {
    if (typeof m.player1 === 'string' || typeof m.player2 === 'string') return null;
    let p1Wins = 0;
    let p2Wins = 0;
    const p1Id = m.player1.id;
    const p2Id = m.player2.id;
    matches.forEach(x => {
      if (x.status !== 'finished' || x.id === m.id) return;
      if (typeof x.player1 === 'string' || typeof x.player2 === 'string') return;
      const isP1_vs_P2 = x.player1.id === p1Id && x.player2.id === p2Id;
      const isP2_vs_P1 = x.player1.id === p2Id && x.player2.id === p1Id;
      if (isP1_vs_P2) {
        if (x.score1 > x.score2) p1Wins++;
        else if (x.score2 > x.score1) p2Wins++;
      } else if (isP2_vs_P1) {
        if (x.score1 > x.score2) p2Wins++;
        else if (x.score2 > x.score1) p1Wins++;
      }
    });
    return { p1Wins, p2Wins };
  };

  const [activeStageFilter, setActiveStageFilter] = useState<'stage1' | 'stage2' | 'all' | 'round-robin' | 'knockout'>(event.isQualifier ? 'stage1' : (event.format === 'hybrid' ? 'round-robin' : 'all'));
  const [activeBracketFilter, setActiveBracketFilter] = useState<'all'|'winners'|'losers'>('all');

  useEffect(() => {
    if (highlightedMatchId) {
      const match = matches.find(m => m.id === highlightedMatchId);
      if (match) {
        if (event.format === 'hybrid') {
          if (match.stage === 'round-robin') setActiveStageFilter('round-robin');
          else if (match.stage === 'knockout') setActiveStageFilter('stage2');
        } else if (event.isQualifier) {
          if (match.stage === 'stage1') setActiveStageFilter('stage1');
          else if (match.stage === 'stage2') setActiveStageFilter('stage2');
        }
      }
    }
  }, [highlightedMatchId, matches, event]);

  const filteredMatches = sortedMatches.filter(match => {
    if ((event.isQualifier || event.format === 'hybrid') && activeStageFilter !== 'all') {
      if (activeStageFilter === 'stage2' && event.format === 'hybrid') {
        if (match.stage !== 'knockout' && match.stage !== 'stage2') return false;
      } else {
        if (match.stage !== activeStageFilter) return false;
      }
    }
    if (activeBracketFilter === 'winners') {
      if (!match.bracketPosition || (!match.bracketPosition.startsWith('W-') && match.bracketPosition !== 'Grand Final')) return false;
    }
    if (activeBracketFilter === 'losers') {
      if (!match.bracketPosition || !match.bracketPosition.startsWith('L')) return false;
    }
    const term = searchQuery.toLowerCase();
    if (!term) return true;
    const p1Name = typeof match.player1 === 'string' ? match.player1.toLowerCase() : match.player1.name.toLowerCase();
    const p2Name = typeof match.player2 === 'string' ? match.player2.toLowerCase() : match.player2.name.toLowerCase();
    const tNum = match.tableNumber.toString();
    const mId = match.id.toLowerCase();
    return p1Name.includes(term) || p2Name.includes(term) || tNum.includes(term) || mId.includes(term);
  });

  const { groupedMatches, allOrderedGroups } = useMemo(() => {
    // Generate authoritative layout routes for all stages present
    const layout: any[] = [];
    if (event.isQualifier) {
       generateBracketLayout(event.totalPlayers || 32, event.eliminationType === 'double', event.qualifierSpots).forEach(r => layout.push({ ...r, stage: 'stage1' }));
       generateBracketLayout(event.qualifierSpots || 8, false, undefined).forEach(r => layout.push({ ...r, stage: 'stage2' }));
    } else if (event.format === 'hybrid') {
       generateBracketLayout(event.bracketSize || 32, event.eliminationType === 'double', undefined).forEach(r => layout.push({ ...r, stage: 'knockout' }));
    } else {
       generateBracketLayout(event.bracketSize || 32, event.eliminationType === 'double', undefined).forEach(r => layout.push({ ...r, stage: 'knockout' }));
    }

    const routeToGroup = (route: any) => {
      let main = route.roundName;
      if (main.startsWith('L')) {
        main = 'LOSERS ' + main.replace('L', 'ROUND ');
      } else if (main.startsWith('R')) {
        main = 'WINNERS ' + main.replace('R', 'ROUND OF ');
      } else if (main === 'QF') main = 'WINNERS QUARTER FINALS';
      else if (main === 'SF') main = 'WINNERS SEMI FINALS';
      else if (main === 'Final') main = 'WINNERS FINAL';
      else main = main.toUpperCase();

      if (route.stage === 'stage1') return 'STAGE 1: ' + main;
      if (route.stage === 'stage2') return main.replace('WINNERS ', '');
      return main;
    };

    const roundRobinGroups = Array.from(new Set(filteredMatches.filter(m => m.stage === 'round-robin').map(m => m.bracketPosition ? (m.bracketPosition.toUpperCase() + ' ROUND ROBIN') : 'STAGE 1 ROUND ROBIN')));
    roundRobinGroups.sort((a, b) => {
       const numA = parseInt(a.replace(/\D/g, '')) || 0;
       const numB = parseInt(b.replace(/\D/g, '')) || 0;
       return numA - numB;
    });

    const orderedGroupKeys: string[] = [...roundRobinGroups];
    layout.forEach(r => {
      const gName = routeToGroup(r);
      if (!orderedGroupKeys.includes(gName)) orderedGroupKeys.push(gName);
    });

    orderedGroupKeys.push('OTHER');

    const groups: Record<string, Match[]> = {};
    filteredMatches.forEach(m => {
      let groupMatch = 'OTHER';
      
      if (m.stage === 'round-robin') {
        groupMatch = m.bracketPosition ? (m.bracketPosition.toUpperCase() + ' ROUND ROBIN') : 'STAGE 1 ROUND ROBIN';
        if (!orderedGroupKeys.includes(groupMatch)) orderedGroupKeys.push(groupMatch);
      } else if (['knockout', 'stage1', 'stage2'].includes(m.stage)) {
        const matchingRoute = layout.find(r => r.bp === m.bracketPosition && r.stage === m.stage);
        if (matchingRoute) {
          groupMatch = routeToGroup(matchingRoute);
        } else {
          groupMatch = (m.bracketPosition || m.stage).toUpperCase();
          if (!orderedGroupKeys.includes(groupMatch)) orderedGroupKeys.push(groupMatch);
        }
      } else {
        groupMatch = (m.bracketPosition || m.stage).toUpperCase();
        if (!orderedGroupKeys.includes(groupMatch)) orderedGroupKeys.push(groupMatch);
      }
      
      if (!groups[groupMatch]) groups[groupMatch] = [];
      groups[groupMatch].push(m);
    });

    return { groupedMatches: groups, allOrderedGroups: orderedGroupKeys };
  }, [filteredMatches, event]);

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!p1Id || !p2Id || p1Id === p2Id) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: 'Invalid players' }));
      return;
    }
    
    const p1 = ['BYE', 'TBA', 'DSQ', 'NS'].includes(p1Id) ? p1Id as any : players.find(p => p.id === p1Id);
    const p2 = ['BYE', 'TBA', 'DSQ', 'NS'].includes(p2Id) ? p2Id as any : players.find(p => p.id === p2Id);

    if (!p1 || !p2) return;

    let finalPos = pos;
    if ((stage === 'knockout' || stage === 'stage1' || stage === 'stage2') && !finalPos) {
      // Find the first empty bracket position starting from the earliest rounds
      const availablePositions = generateBracketPositions();
      for (const bp of availablePositions) {
        if (!matches.some(m => m.eventId === event.id && m.bracketPosition === bp && m.stage === stage)) {
          finalPos = bp;
          break;
        }
      }
    }

    addMatch({
      id: 'm-' + Math.random().toString(36).substr(2, 6),
      eventId: event.id,
      player1: p1,
      player2: p2,
      score1: ['BYE', 'DSQ', 'NS'].includes(p2 as string) ? (scoringSystem === 'race' ? raceTo : bestOfSets) : 0,
      score2: ['BYE', 'DSQ', 'NS'].includes(p1 as string) ? (scoringSystem === 'race' ? raceTo : bestOfSets) : 0,
      status: (['BYE', 'DSQ', 'NS'].includes(p1 as string) || ['BYE', 'DSQ', 'NS'].includes(p2 as string)) ? 'finished' : 'pending',
      stage,
      tableNumber: 1,
      scoringSystem,
      raceTo: scoringSystem === 'race' ? raceTo : undefined,
      bestOfSets: scoringSystem === 'sets' ? bestOfSets : undefined,
      bracketPosition: finalPos,
      time
    });

    setShowAdd(false);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e2) => {
      const text = e2.target?.result;
      if (typeof text !== 'string') return;
      
      const lines = text.split('\n');
      if (lines.length < 2) return; // Need header + at least 1 row
      
      const newMatches: Match[] = [];
      // basic parsing
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        // Expected roughly: ID, Stage, Bracket Position, Table Number, Player 1, Player 2, Score 1, Score 2, Status, Time, Scoring System, Race To, Best Of Sets
        // We will just read basic info to insert new Matches
        if (cols.length >= 6) {
           const p1Str = cols[4];
           const p2Str = cols[5];
           const p1Match = players.find(p => p.name.toLowerCase() === p1Str.toLowerCase() || p.id === p1Str);
           const p2Match = players.find(p => p.name.toLowerCase() === p2Str.toLowerCase() || p.id === p2Str);
           
           const parsedScore1 = parseInt(cols[6] || '0');
           const parsedScore2 = parseInt(cols[7] || '0');
           
           newMatches.push({
             id: cols[0] && cols[0] !== '' && !matches.some(m => m.id === cols[0]) ? cols[0] : 'm-' + Math.random().toString(36).substr(2, 6),
             eventId: event.id,
             stage: (cols[1] as Match['stage']) || 'round-robin',
             bracketPosition: cols[2] || undefined,
             tableNumber: parseInt(cols[3] || '1'),
             player1: (p1Match ? p1Match.id : (p1Str || 'TBA')) as any,
             player2: (p2Match ? p2Match.id : (p2Str || 'TBA')) as any,
             score1: isNaN(parsedScore1) ? 0 : parsedScore1,
             score2: isNaN(parsedScore2) ? 0 : parsedScore2,
             status: (cols[8] as Match['status']) || 'pending',
             time: cols[9] || 'TBD',
             scoringSystem: (cols[10] as 'race'|'sets') || 'race',
             raceTo: parseInt(cols[11] || '9'),
             bestOfSets: parseInt(cols[12] || '3')
           });
        }
      }
      
      if (newMatches.length > 0) {
         addMatches(newMatches);
         window.dispatchEvent(new CustomEvent('app-toast', { detail: `Imported ${newMatches.length} matches from CSV.` }));
      }
      
      // Reset input
      if (csvInputRef.current) csvInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    if (matches.length === 0) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: 'No matches to export.' }));
      return;
    }

    const headers = ['ID', 'Stage', 'Bracket Position', 'Table Number', 'Player 1', 'Player 2', 'Score 1', 'Score 2', 'Status', 'Time', 'Scoring System', 'Race To', 'Best Of Sets'];
    const rows = matches.map(m => {
      const p1Name = typeof m.player1 === 'string' ? m.player1 : m.player1.name;
      const p2Name = typeof m.player2 === 'string' ? m.player2 : m.player2.name;
      
      return [
        m.id,
        m.stage,
        m.bracketPosition || '',
        m.tableNumber,
        `"${p1Name}"`,
        `"${p2Name}"`,
        m.score1,
        m.score2,
        m.status,
        m.time || '',
        m.scoringSystem,
        m.raceTo || '',
        m.bestOfSets || ''
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `matches_${event.name.replace(/\\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {(event.isQualifier || event.format === 'hybrid') && (
        <div className="flex w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
          <button 
            onClick={() => setActiveStageFilter(event.format === 'hybrid' ? 'round-robin' as any : 'stage1')}
            className={`flex-1 py-3 text-sm font-black font-display tracking-widest uppercase transition-colors ${(activeStageFilter === 'stage1' || activeStageFilter === 'round-robin') ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
          >
            Stage 1
          </button>
          <div className="w-px bg-zinc-800" />
          <button 
            onClick={() => {
              if (matches.some(m => m.eventId === event.id && (m.stage === 'stage2' || (event.format === 'hybrid' && m.stage === 'knockout')))) {
                setActiveStageFilter('stage2');
              }
            }}
            className={`flex-1 py-3 text-sm font-black font-display tracking-widest uppercase transition-colors ${!matches.some(m => m.eventId === event.id && (m.stage === 'stage2' || (event.format === 'hybrid' && m.stage === 'knockout'))) ? 'opacity-50 cursor-not-allowed text-zinc-600' : activeStageFilter === 'stage2' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
          >
            Stage 2
          </button>
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search matches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2 text-white focus:border-emerald-500/50 outline-none"
            />
          </div>
          {event.eliminationType === 'double' && (!event.isQualifier || activeStageFilter === 'stage1') && (
            <select 
              value={activeBracketFilter} 
              onChange={(e) => setActiveBracketFilter(e.target.value as any)}
              className="w-full md:w-auto bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 text-white outline-none focus:border-emerald-500/50 cursor-pointer text-sm font-medium"
            >
              <option value="all">All Brackets</option>
              <option value="winners">Winners Bracket</option>
              <option value="losers">Losers Bracket</option>
            </select>
          )}
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full md:w-auto bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 text-white outline-none focus:border-emerald-500/50 cursor-pointer"
          >
            <option value="id">Sort by Draft ID</option>
            <option value="time">Sort by Time</option>
            <option value="table">Sort by Table</option>
            <option value="status">Sort by Status</option>
          </select>

          {isAdmin && (
            <button 
              onClick={() => setMobileViewMode(m => m === 'minimalist' ? 'bulky' : 'minimalist')}
              className="flex w-full md:w-auto items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 text-white font-semibold outline-none hover:bg-zinc-800 transition-colors"
            >
              {mobileViewMode === 'minimalist' ? (
                <><LayoutGrid className="w-4 h-4 text-emerald-400" /> Switch to Scoring View</>
              ) : (
                <><List className="w-4 h-4 text-emerald-400" /> Switch to Minimal List</>
              )}
            </button>
          )}
        </div>

        {isAdmin && (
          <div className="flex justify-end gap-4 flex-wrap w-full md:w-auto">
            <input type="file" accept=".csv" className="hidden" ref={csvInputRef} onChange={handleImportCSV} />
            <button onClick={() => csvInputRef.current?.click()} className="flex items-center gap-2 bg-zinc-800 text-white px-4 py-2 rounded-2xl text-sm hover:bg-zinc-700 transition-colors">
              <Upload className="w-4 h-4" /> Import CSV
            </button>
            <button onClick={handleExportCSV} className="flex items-center gap-2 bg-zinc-800 text-white px-4 py-2 rounded-2xl text-sm hover:bg-zinc-700 transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={handleAutomate} className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-2xl text-sm hover:bg-emerald-500/30 transition-colors font-bold">
              <Wand2 className="w-4 h-4" /> Automate Initial Matches
            </button>
            <button onClick={handleClearAll} className="flex items-center gap-2 bg-red-500/20 text-red-500 border border-red-500/30 px-4 py-2 rounded-2xl text-sm hover:bg-red-500/30 transition-colors font-bold" title="Delete All Matches">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 bg-zinc-800 text-white px-4 py-2 rounded-2xl text-sm hover:bg-zinc-700 transition-colors">
              <Plus className="w-4 h-4" /> Add Match
            </button>
          </div>
        )}
      </div>

      {showAdd && (
        <form onSubmit={handleCreateMatch} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Player 1</label>
              <select value={p1Id} onChange={e => setP1Id(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white">
                <option value="">Select...</option>
                <option value="BYE">BYE</option>
                <option value="TBA">TBA</option>
                <option value="DSQ">DSQ</option>
                <option value="NS">NS</option>
                {eventPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Player 2</label>
              <select value={p2Id} onChange={e => setP2Id(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white">
                <option value="">Select...</option>
                <option value="BYE">BYE</option>
                <option value="TBA">TBA</option>
                <option value="DSQ">DSQ</option>
                <option value="NS">NS</option>
                {eventPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Stage</label>
              <select value={stage} onChange={e => setStage(e.target.value as any)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white">
                {event.isQualifier ? (
                  <>
                    <option value="stage1">Stage 1 (Qualification)</option>
                    <option value="stage2">Stage 2 (Main Event)</option>
                  </>
                ) : event.format === 'hybrid' ? (
                  <>
                    <option value="round-robin">Stage 1 (Round Robin)</option>
                    <option value="knockout">Stage 2 (Bracket)</option>
                  </>
                ) : (
                  <>
                    <option value="round-robin">Round Robin</option>
                    <option value="knockout">Bracket</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Scoring System</label>
              <select value={scoringSystem} onChange={e => setScoringSystem(e.target.value as any)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white">
                <option value="race">Race To</option>
                <option value="sets">Best of Sets</option>
              </select>
            </div>
            {scoringSystem === 'race' ? (
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Race To</label>
                <input type="number" value={raceTo} onChange={e => setRaceTo(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white" />
              </div>
            ) : (
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Best of Sets</label>
                <input type="number" value={bestOfSets} onChange={e => setBestOfSets(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white" />
              </div>
            )}
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Time</label>
               <input type="text" placeholder="e.g. 19:00" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white" />
            </div>
            {(stage === 'knockout' || stage === 'stage1' || stage === 'stage2') && (
              <div className="lg:col-span-2 flex gap-4">
                {!event.isQualifier && (
                  <div className="w-1/3">
                    <label className="block text-sm text-zinc-400 mb-1">Bracket Size</label>
                    <select value={bracketSize} onChange={e => {
                      const newSize = Number(e.target.value);
                      setBracketSize(newSize);
                      updateEvent({ ...event, bracketSize: newSize });
                    }} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white">
                      {[2,4,8,16,32,64,128,256,512].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
                <div className="flex-1">
                  <label className="block text-sm text-zinc-400 mb-1">Position (Auto if empty)</label>
                  <select value={pos} onChange={e => setPos(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-white">
                     <option value="">Auto-place in nearest empty</option>
                     {generateBracketPositions().map(bp => <option key={bp} value={bp}>{bp}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
          <button type="submit" className="bg-emerald-500 text-black px-4 py-2 rounded font-bold">Create</button>
        </form>
      )}

      {matches.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <PlayCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <div className="text-xl font-bold text-white mb-2">No matches scheduled</div>
          <p className="text-zinc-500">Matches will appear here once the tournament begins.</p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <Search className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <div className="text-xl font-bold text-white mb-2">No results</div>
          <p className="text-zinc-500">No matches found matching your current filters.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full">
          {(() => {
            const getLayoutRoutes = () => {
              const routes = [
                 ...generateBracketLayout(event.bracketSize || 32, event.eliminationType === 'double', undefined),
                 ...(event.isQualifier ? generateBracketLayout(event.totalPlayers || 32, event.eliminationType === 'double', event.qualifierSpots) : []),
                 ...(event.isQualifier ? generateBracketLayout(event.qualifierSpots || 8, false, undefined).map(r => ({ ...r, roundName: `S2 ${r.roundName}` })) : [])
              ];
              return routes;
            };
            const allRoutes = getLayoutRoutes();

            return allOrderedGroups.filter(g => groupedMatches[g] && groupedMatches[g].length > 0).map(group => {
              const groupMatches = groupedMatches[group];
              return (
              <div key={group} className="flex flex-col">
                <div className="bg-zinc-800 text-emerald-400 font-display font-bold space-x-2 py-3 px-4 text-xs md:text-sm shadow-sm rounded-t-xl">
                  {group}
                </div>
                <div className="flex flex-col bg-zinc-900 border-x border-b border-zinc-800 rounded-b-xl mb-4 overflow-hidden shadow-xl shadow-black/20">
                  {(groupMatches as Match[]).map(match => {
                    const p1Name = typeof match.player1 === 'string' ? match.player1 : match.player1.name;
                    const p2Name = typeof match.player2 === 'string' ? match.player2 : match.player2.name;
                    const p1Flag = typeof match.player1 !== 'string' ? match.player1.country : null;
                    const p2Flag = typeof match.player2 !== 'string' ? match.player2.country : null;
                    
                    const qualRounds = event.isQualifier && event.qualifierSpots ? getRoundsForSize(event.totalPlayers || 32, event.eliminationType === 'double' ? event.qualifierSpots / 2 : event.qualifierSpots) : [];
                    const isQualFinal = match.stage === 'stage1' && match.status === 'finished' && match.bracketPosition?.startsWith(qualRounds[qualRounds.length - 1] || 'R16');

                    let targetRoutes = allRoutes;
                    if (match.stage === 'stage2') targetRoutes = generateBracketLayout(event.qualifierSpots || 8, false, undefined);
                    else if (match.stage === 'stage1') targetRoutes = generateBracketLayout(event.totalPlayers || 32, event.eliminationType === 'double', event.qualifierSpots);
                    else if (match.stage === 'knockout') targetRoutes = generateBracketLayout(event.bracketSize || 32, event.eliminationType === 'double', undefined);

                    const route = targetRoutes.find(r => r.bp === match.bracketPosition);
                    let loseToLabel = null;
                    if (route?.loseTo) {
                        const targetLoseRoute = targetRoutes.find(r => r.bp === route.loseTo);
                        loseToLabel = targetLoseRoute ? `#${targetLoseRoute.label?.replace('M', '')}` : route.loseTo;
                    }

                    return (
                        <div 
                        key={match.id} 
                        id={`match-${match.id}`} 
                        className={`last:border-b-0 border border-transparent border-b-zinc-800 transition-all duration-300 cursor-pointer group flex flex-col md:flex-row items-stretch justify-between relative p-2 md:py-2 md:px-4 ${isQualFinal ? 'bg-green-500/10 hover:bg-green-500/20 border-l-2 border-l-green-500' : 'bg-transparent hover:bg-zinc-800/50'} ${highlightedMatchId === match.id ? '!bg-emerald-500/30 !border-emerald-500 ring-2 ring-emerald-500 shadow-xl shadow-emerald-500/20 z-20 overflow-hidden animate-pulse' : ''}`}
                        onClick={(e) => { 
                          if ((e.ctrlKey || e.metaKey) && isAdmin) {
                            setEditingMatch(match);
                          } else if(typeof match.player1 !== 'string' && typeof match.player2 !== 'string') {
                            setActiveScoreboardId(match.id);
                          }
                        }}
                      >
                        {/* Left status color bar */}
                        {match.status === 'live' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 animate-pulse" />}
                        {match.status === 'finished' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-700" />}
                        {match.status === 'pending' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500/40" />}
                        
                        {/* Mobile/Bulky Layout */}
                        <div className={`${mobileViewMode === 'bulky' ? 'flex' : 'flex md:hidden'} flex-col gap-1.5 w-full`}>
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                            <div className="flex items-center gap-1.5">
                              {route?.label && (
                                <span className="text-zinc-300 font-black px-1.5 py-0.5 bg-zinc-800 rounded-sm">#{route.label.replace('M', '')}</span>
                              )}
                              <span className="text-zinc-400 font-mono">
                                {['knockout', 'stage1', 'stage2'].includes(match.stage) ? (match.stage === 'stage1' ? 'Qualification' : (match.bracketPosition || 'KO')) : 'Round Robin'}
                              </span>
                              <span className="text-zinc-700">•</span>
                              <span className="text-emerald-500 font-mono">Table {match.tableNumber}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {loseToLabel && <span className="text-zinc-500 italic text-[9px] lowercase mr-1">loser to {loseToLabel}</span>}
                              {match.time && <span className="text-zinc-400">{match.time === 'TBD' ? 'UPCOMING' : match.time}</span>}
                              {match.status === 'live' && <span className="text-red-500 font-bold animate-pulse text-[9px]">● LIVE</span>}
                              {match.status === 'finished' && <span className="text-zinc-500 font-bold text-[9px]">FINAL</span>}
                              {match.status === 'pending' && <span className="text-blue-400 font-bold text-[9px]">UPCOMING</span>}
                            </div>
                          </div>

                        <div className="flex flex-col gap-1 w-full mt-2">
                          <div className="flex items-center justify-between w-full py-0.5">
                            <div className="flex items-center gap-2 min-w-0">
                              {p1Flag && getFlagUrl(p1Flag) && (
                                <img src={getFlagUrl(p1Flag)!} className="w-4.5 h-auto rounded shrink-0 object-cover" alt="" />
                              )}
                              <span className={`font-bold text-sm truncate ${
                                match.status === 'finished' && match.score1 > match.score2 ? (isQualFinal ? 'text-emerald-400 font-black' : 'text-white font-black') : 'text-zinc-300'
                              }`}>
                                {p1Name}
                              </span>
                              {match.status === 'finished' && match.score1 > match.score2 && (
                                <Trophy className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {isAdmin && mobileViewMode === 'bulky' && match.status !== 'finished' && (
                                <div className="flex items-center gap-1 mx-2 bg-zinc-900/80 rounded-lg border border-zinc-800 p-0.5">
                                  <button onClick={(e) => handleScoreUpdate(match, 1, 1, e)} className="w-12 h-10 flex items-center justify-center rounded-md bg-zinc-800 text-white hover:bg-zinc-700 active:bg-zinc-600 transition-colors text-xl font-black">+</button>
                                  <button onClick={(e) => handleScoreUpdate(match, 1, -1, e)} className="w-12 h-10 flex items-center justify-center rounded-md bg-zinc-800/50 text-white hover:bg-zinc-700 active:bg-zinc-600 transition-colors text-xl font-black">-</button>
                                </div>
                              )}
                              <span className={`font-display font-black text-right ${mobileViewMode === 'bulky' ? 'text-3xl w-10' : 'text-base w-4'} ${
                                match.status === 'finished' && match.score1 > match.score2 ? 'text-emerald-400' : 'text-zinc-300'
                              }`}>
                                {match.score1}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between w-full py-0.5">
                            <div className="flex items-center gap-2 min-w-0">
                              {p2Flag && getFlagUrl(p2Flag) && (
                                <img src={getFlagUrl(p2Flag)!} className="w-4.5 h-auto rounded shrink-0 object-cover" alt="" />
                              )}
                              <span className={`font-bold text-sm truncate ${
                                match.status === 'finished' && match.score2 > match.score1 ? (isQualFinal ? 'text-emerald-400 font-black' : 'text-white font-black') : 'text-zinc-300'
                              }`}>
                                {p2Name}
                              </span>
                              {match.status === 'finished' && match.score2 > match.score1 && (
                                <Trophy className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {isAdmin && mobileViewMode === 'bulky' && match.status !== 'finished' && (
                                <div className="flex items-center gap-1 mx-2 bg-zinc-900/80 rounded-lg border border-zinc-800 p-0.5">
                                  <button onClick={(e) => handleScoreUpdate(match, 2, 1, e)} className="w-12 h-10 flex items-center justify-center rounded-md bg-zinc-800 text-white hover:bg-zinc-700 active:bg-zinc-600 transition-colors text-xl font-black">+</button>
                                  <button onClick={(e) => handleScoreUpdate(match, 2, -1, e)} className="w-12 h-10 flex items-center justify-center rounded-md bg-zinc-800/50 text-white hover:bg-zinc-700 active:bg-zinc-600 transition-colors text-xl font-black">-</button>
                                </div>
                              )}
                              <span className={`font-display font-black text-right ${mobileViewMode === 'bulky' ? 'text-3xl w-10' : 'text-base w-4'} ${
                                match.status === 'finished' && match.score2 > match.score1 ? 'text-emerald-400' : 'text-zinc-300'
                              }`}>
                                {match.score2}
                              </span>
                            </div>
                          </div>
                        </div>

                        {(isAdmin || (onMatchClick && match.stage !== 'round-robin')) && (
                          <div className="mt-1 pt-1.5 border-t border-zinc-900 flex justify-end gap-2">
                            {onMatchClick && match.stage !== 'round-robin' && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); onMatchClick(match.id); }} 
                                className="text-zinc-500 hover:text-emerald-400 flex items-center gap-1.5 py-1 px-2 rounded hover:bg-zinc-900 max-w-max text-xs transition-colors"
                              >
                                <Trophy className="w-3.5 h-3.5" />
                                <span>Bracket</span>
                              </button>
                            )}
                            {isAdmin && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setConfirmAction({ text: 'Are you sure you want to delete this match?', action: () => deleteMatch(match.id) }); }} 
                                className="text-zinc-500 hover:text-red-500 flex items-center gap-1.5 py-1 px-2 rounded hover:bg-zinc-900 max-w-max text-xs transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Match</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Desktop List Layout (>= md) */}
                      <div className={`${mobileViewMode === 'bulky' ? 'hidden' : 'hidden md:flex'} items-center justify-between w-full`}>
                        <div className="flex items-center gap-4 flex-[3] min-w-0 pr-2">
                          <div className="flex flex-col items-start min-w-[70px] shrink-0">
                            {route?.label && (
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="bg-emerald-500 text-black font-black text-[10px] px-1.5 py-0.5 rounded-sm shadow-sm leading-none inline-block">#{route.label.replace('M', '')}</span>
                                {loseToLabel && <span className="text-zinc-500 italic text-[10px] lowercase truncate">loser {loseToLabel}</span>}
                              </div>
                            )}
                            <div className="flex items-center gap-1 font-bold uppercase tracking-widest text-[9px]">
                              <span className="text-zinc-500">{['knockout', 'stage1', 'stage2'].includes(match.stage) ? (match.stage === 'stage1' ? 'Qualif' : (match.bracketPosition || 'KO')) : 'RR'}</span>
                              <span className="text-emerald-500/80">T{match.tableNumber}</span>
                            </div>
                          </div>
                          <span className={`font-bold text-sm truncate ${match.score1 > match.score2 && match.status === 'finished' && isQualFinal ? 'text-emerald-400 font-black' : 'text-white'}`}>{p1Name}</span>
                          {p1Flag && getFlagUrl(p1Flag) && <img src={getFlagUrl(p1Flag)!} className="w-5 h-auto rounded shrink-0 object-cover" alt="" />}
                        </div>
                        
                        <div className="flex items-center justify-center gap-6 shrink-0 px-4 flex-[1]">
                          <span className={`text-2xl font-black font-display text-right w-10 ${match.score1 > match.score2 && match.status === 'finished' ? 'text-emerald-500' : 'text-white'}`}>{match.score1}</span>
                          <span className="text-zinc-600 text-[10px] font-medium italic">vs</span>
                          <span className={`text-2xl font-black font-display text-left w-10 ${match.score2 > match.score1 && match.status === 'finished' ? 'text-emerald-500' : 'text-white'}`}>{match.score2}</span>
                        </div>

                        <div className="flex items-center justify-end gap-4 flex-[3] min-w-0 pl-2">
                          {p2Flag && getFlagUrl(p2Flag) && <img src={getFlagUrl(p2Flag)!} className="w-5 h-auto rounded shrink-0 object-cover" alt="" />}
                          <span className={`font-bold text-sm truncate text-right ${match.score2 > match.score1 && match.status === 'finished' && isQualFinal ? 'text-emerald-400 font-black' : 'text-white'}`}>{p2Name}</span>
                          <div className="text-right flex flex-col shrink-0 border-l border-zinc-700/50 pl-4 ml-2 w-24">
                            <span className="text-zinc-500 text-xs truncate">{match.time === 'TBD' ? 'UPCOMING' : match.time}</span>
                            {match.status === 'live' && <span className="text-red-500 font-bold animate-pulse text-[10px] uppercase tracking-widest">LIVE</span>}
                            {match.status === 'finished' && <span className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest">FINAL</span>}
                            {match.status === 'pending' && <span className="text-blue-500 font-bold text-[10px] uppercase tracking-widest">UPCOMING</span>}
                          </div>
                        </div>
                        {(isAdmin || (onMatchClick && match.stage !== 'round-robin')) && (
                          <div className="ml-2 pl-2 border-l border-zinc-800 shrink-0 flex items-center gap-1 justify-center">
                            {onMatchClick && match.stage !== 'round-robin' && (
                              <button
                                 onClick={(e) => { e.stopPropagation(); onMatchClick(match.id); }}
                                 className="text-zinc-500 hover:text-emerald-400 p-1 transition-colors"
                                 title="View in Bracket"
                               >
                                  <Trophy className="w-4 h-4" />
                               </button>
                            )}
                            {isAdmin && (
                              <button onClick={(e) => { e.stopPropagation(); setConfirmAction({ text: 'Are you sure you want to delete this match?', action: () => deleteMatch(match.id) }); }} className="text-zinc-600 hover:text-red-500 p-1">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
          })})()}
        </div>
      )}

      {activeScoreboardId && createPortal(
        <ScoreboardView 
          matchId={activeScoreboardId} 
          onClose={() => setActiveScoreboardId(null)} 
        />,
        document.body
      )}

      {editingMatch && (
        <EditMatchModal
          match={editingMatch}
          event={event}
          onClose={() => setEditingMatch(null)}
        />
      )}
      {event.format !== 'round-robin' && onGoToBracket && (
        <button 
          onClick={onGoToBracket} 
          className="fixed bottom-6 right-6 z-[90] flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-3 rounded-full font-bold shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
        >
          <Trophy className="w-5 h-5 shadow-sm" /> 
          Go to Bracket
        </button>
      )}
      <ConfirmModal 
        isOpen={!!confirmAction} 
        message={confirmAction?.text || ''} 
        onConfirm={confirmAction?.action || (() => {})} 
        onCancel={() => setConfirmAction(null)} 
      />
    </div>
  );
}