export interface BracketRoute {
  bp: string;
  winTo: string | null;
  loseTo: string | null;
  label?: string; // e.g. "M1", "M2"
  isLoserBracket: boolean;
  roundName: string;
}

function getRounds(size: number) {
  const r = [];
  if (size >= 512) r.push('R512');
  if (size >= 256) r.push('R256');
  if (size >= 128) r.push('R128');
  if (size >= 64) r.push('R64');
  if (size >= 32) r.push('R32');
  if (size >= 16) r.push('R16');
  if (size >= 8) r.push('QF');
  if (size >= 4) r.push('SF');
  if (size >= 2) r.push('Final');
  return r;
}

export function generateBracketLayout(size: number, isDouble: boolean, stopAt?: number): BracketRoute[] {
  const routes: BracketRoute[] = [];
  const wRounds = getRounds(size);
  let stopRoundIndex = wRounds.length - 1;
  
  if (stopAt) {
    const effectiveStop = isDouble ? stopAt / 2 : stopAt;
    const stopCandidate = getRounds(effectiveStop * 2);
    const stopString = stopCandidate[0];
    const idx = wRounds.indexOf(stopString);
    if (idx !== -1) stopRoundIndex = idx;
  }

  let mNum = 1;
  let lNum = 1;

  let prevLRoundMatches = 0;
  let lRoundIdx = 1;

  for (let i = 0; i <= stopRoundIndex; i++) {
    const r = wRounds[i];
    const rName = r;
    const nextRName = i < stopRoundIndex ? wRounds[i+1] : null;

    let matchCount = 1;
    if (r === 'R512') matchCount = 256;
    else if (r === 'R256') matchCount = 128;
    else if (r === 'R128') matchCount = 64;
    else if (r === 'R64') matchCount = 32;
    else if (r === 'R32') matchCount = 16;
    else if (r === 'R16') matchCount = 8;
    else if (r === 'QF') matchCount = 4;
    else if (r === 'SF') matchCount = 2;
    else if (r === 'Final') matchCount = 1;

    for (let m = 1; m <= matchCount; m++) {
      const bp = isDouble ? (r === 'Final' ? 'W-Final' : `W-${r} - M${m}`) : (r === 'Final' ? 'Final' : `${r} - M${m}`);
      let winTo = null;
      if (nextRName) {
         winTo = isDouble ? (nextRName === 'Final' ? 'W-Final' : `W-${nextRName} - M${Math.ceil(m/2)}`) 
                          : (nextRName === 'Final' ? 'Final' : `${nextRName} - M${Math.ceil(m/2)}`);
      } else if (isDouble && stopAt === undefined) {
         winTo = 'Grand Final';
      }

      let loseTo = null;
      if (isDouble && stopAt === undefined || (isDouble && stopAt !== undefined && i <= stopRoundIndex)) {
        if (i === 0) {
          loseTo = `L1 - M${Math.ceil(m/2)}`;
        } else {
          loseTo = `L${lRoundIdx} - M${matchCount - m + 1}`;
        }
      }

      routes.push({
        bp, winTo, loseTo, isLoserBracket: false, roundName: rName, label: `M${mNum++}`
      });
    }

    if (isDouble) {
      if (i === 0) {
         let lMatches = matchCount / 2;
         for (let m = 1; m <= lMatches; m++) {
           let winTo = null;
           if (i < stopRoundIndex || stopAt === undefined) {
              winTo = `L2 - M${m}`;
           }
           routes.push({
             bp: `L1 - M${m}`, winTo, loseTo: null, isLoserBracket: true, roundName: 'L1', label: `M${mNum++}`
           });
         }
         prevLRoundMatches = lMatches;
         lRoundIdx++;
      } else {
         // Drop-in round
         let lMatches = matchCount;
         for (let m = 1; m <= lMatches; m++) {
           let winTo: string | null = `L${lRoundIdx+1} - M${Math.ceil(m/2)}`;
           if (stopAt !== undefined && i === stopRoundIndex) {
              winTo = null;
           } else if (matchCount === 1 && stopAt === undefined) {
              winTo = 'Grand Final';
           }
           routes.push({
             bp: `L${lRoundIdx} - M${m}`, winTo, loseTo: null, isLoserBracket: true, roundName: `L${lRoundIdx}`, label: `M${mNum++}`
           });
         }
         lRoundIdx++;

         // Narrowing round
         if (!(stopAt !== undefined && i === stopRoundIndex)) {
           lMatches = matchCount / 2;
           if (lMatches >= 1) {
             for (let m = 1; m <= lMatches; m++) {
               let winTo = `L${lRoundIdx+1} - M${m}`;
               if (lMatches === 1 && nextRName === null && stopAt === undefined) {
                  winTo = 'Grand Final';
               }
               routes.push({
                 bp: `L${lRoundIdx} - M${m}`, winTo, loseTo: null, isLoserBracket: true, roundName: `L${lRoundIdx}`, label: `M${mNum++}`
               });
             }
             lRoundIdx++;
             prevLRoundMatches = lMatches;
           }
         }
      }
    }
  }

  if (isDouble && stopAt === undefined) {
     routes.push({
       bp: 'Grand Final', winTo: null, loseTo: null, isLoserBracket: false, roundName: 'Grand Final', label: `M${mNum++}`
     });
  }

  // If stopAt is specified, we end here. But wait, in Qualifiers, Losers bracket also stops when remaining equal to qualifierSpots / 2
  // Let's prune out any L rounds that are beyond the required number. Actually, my logic inherently stops generating W rounds!
  
  return routes;
}
