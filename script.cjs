const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const helperFunc = `
function handleAutoAdvance(match: Match, dbState: typeof db, io: Server) {
  if (match.status !== 'finished' || match.stage === 'round-robin' || !match.bracketPosition) return;
  const winner = match.score1 > match.score2 ? match.player1 : (match.score2 > match.score1 ? match.player2 : null);
  if (!winner || winner === 'BYE' || winner === 'TBA') return;

  const event = dbState.events.find(e => e.id === match.eventId);
  let handledAsQualifier = false;
  const bp = String(match.bracketPosition);

  // Qualification Stage 1 -> Stage 2 logic
  if (match.stage === 'stage1' && event?.isQualifier && event.qualifierSpots) {
    const isDouble = event.eliminationType === 'double';
    const size = event.totalPlayers || 32;
    const stopAt = event.qualifierSpots;
    
    let rounds = [];
    if (size >= 512) rounds.push('R512');
    if (size >= 256) rounds.push('R256');
    if (size >= 128) rounds.push('R128');
    if (size >= 64) rounds.push('R64');
    if (size >= 32) rounds.push('R32');
    
    const effectiveStop = isDouble ? stopAt / 2 : stopAt;
    if (size >= 16 && effectiveStop < 16) rounds.push('R16');
    if (size >= 8 && effectiveStop < 8) rounds.push('QF');
    if (size >= 4 && effectiveStop < 4) rounds.push('SF');
    if (size >= 2 && effectiveStop < 2) rounds.push('Final');

    const finalRoundString = rounds[rounds.length - 1] || 'R16';

    if (bp.startsWith(finalRoundString)) {
      handledAsQualifier = true;
      const stage2Matches = dbState.matches.filter(m => m.eventId === event.id && m.stage === 'stage2');
      let placed = false;
      let updatedStage2Matches = [];
      for (let sm of stage2Matches) {
        if (!placed && typeof sm.player1 === 'string' && sm.player1.startsWith('Qualifier')) {
          sm.player1 = winner;
          if (sm.status !== 'finished') sm.status = 'pending';
          placed = true;
        } else if (!placed && typeof sm.player2 === 'string' && sm.player2.startsWith('Qualifier')) {
          sm.player2 = winner;
          if (sm.status !== 'finished') sm.status = 'pending';
          placed = true;
        }
      }
      
      if (placed) {
        const wName = typeof winner === 'string' ? winner : winner.name;
        io.emit('toast', { message: \`\${wName} successfully qualified to Main Bracket!\` });
      }
    }
  }

  if (!handledAsQualifier) {
    const nextPos = getNextBracketPosition(match.bracketPosition);
    if (!nextPos) return;
    
    const currentMatchNumMatch = match.bracketPosition.match(/\\d+$/);
    const currentNum = currentMatchNumMatch ? parseInt(currentMatchNumMatch[0], 10) : 1;
    const isPlayer1Slot = currentNum % 2 !== 0;

    const nextMatchIdx = dbState.matches.findIndex(m => m.eventId === match.eventId && m.bracketPosition === nextPos && m.stage === match.stage);
    if (nextMatchIdx !== -1) {
      const nm = dbState.matches[nextMatchIdx];
      if (isPlayer1Slot) nm.player1 = winner;
      else nm.player2 = winner;
      
      if (nm.status !== 'finished') {
        nm.status = 'pending';
      }
    } else {
      const newMatch: Match = {
        id: 'm-' + Math.random().toString(36).substr(2, 6),
        eventId: match.eventId,
        player1: isPlayer1Slot ? winner : 'TBA',
        player2: !isPlayer1Slot ? winner : 'TBA',
        score1: 0,
        score2: 0,
        status: 'pending',
        stage: match.stage,
        tableNumber: 1,
        scoringSystem: match.scoringSystem,
        raceTo: match.raceTo,
        bestOfSets: match.bestOfSets,
        bracketPosition: nextPos,
        time: 'TBD'
      };
      dbState.matches.push(newMatch);
    }
  }
}
`;
code = code.replace(/async function startServer\(\) \{/, helperFunc + '\nasync function startServer() {');

// Replace the three instances
const block1Regex = /\/\/ Handle Auto-Advancement in Knockout if status became finished[\s\S]*?(?=      \} else \{)/;
code = code.replace(block1Regex, `// Handle Auto-Advancement
        if (oldMatch.status !== 'finished' && updatedMatch.status === 'finished') {
          handleAutoAdvance(updatedMatch, db, io);
        }
`);

const block2Regex = /\/\/ Auto-advance if it was added as already finished \(e\.g\., due to BYEs\)[\s\S]*?(?=      io\.emit\(\'sync_state\', db\);)/;
code = code.replace(block2Regex, `// Auto-advance if it was added as already finished
      if (match.status === 'finished') {
        handleAutoAdvance(match, db, io);
      }
`);

const block3Regex = /\/\/ Auto-advance if it was added as already finished \(e\.g\., due to BYEs\)[\s\S]*?(?=      \}\n      \n      if \(matchesAdded > 0\))/;
code = code.replace(block3Regex, `// Auto-advance if it was added as already finished
        if (match.status === 'finished') {
          handleAutoAdvance(match, db, io);
        }
`);

fs.writeFileSync('server.ts', code);
