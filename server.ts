import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import type { AppState, EventType, Match, NewsItem, Player } from './src/types';

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://qdgsjhxplktaywgetjol.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkZ3NqaHhwbGt0YXl3Z2V0am9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NTM5NDcsImV4cCI6MjA5NjEyOTk0N30.dI-tOo1ZMkHIbjgU0nDpl-h-8IRgR_QPFm9kBUUUCtI';

const supabase = createClient(supabaseUrl, supabaseKey);

const realPoolPlayers = [
  { name: 'Jayson Shaw', country: 'GBR' },
  { name: 'Francisco Sanchez Ruiz', country: 'ESP' },
  { name: 'Shane Van Boening', country: 'USA' },
  { name: 'Joshua Filler', country: 'GER' },
  { name: 'Albin Ouschan', country: 'AUT' },
  { name: 'Ko Pin Yi', country: 'TPE' },
  { name: 'Ko Ping Chung', country: 'TPE' },
  { name: 'Carlo Biado', country: 'PHI' },
  { name: 'Eklent Kaçi', country: 'ALB' },
  { name: 'David Alcaide', country: 'ESP' },
  { name: 'Mario He', country: 'AUT' },
  { name: 'Alexander Kazakis', country: 'GRE' },
  { name: 'Fedor Gorst', country: 'USA' },
  { name: 'Aloysius Yapp', country: 'SGP' },
  { name: 'Max Lechner', country: 'AUT' },
  { name: 'Skyler Woodward', country: 'USA' },
  { name: 'Wiktor Zielinski', country: 'POL' },
  { name: 'Niels Feijen', country: 'NED' },
  { name: 'Wu Jiaqing', country: 'CHN' },
  { name: 'Chang Jung-Lin', country: 'TPE' },
  { name: 'Dennis Orcollo', country: 'PHI' },
  { name: 'Johann Chua', country: 'PHI' },
  { name: 'Naoyuki Oi', country: 'JPN' },
  { name: 'Sanjin Pehlivanovic', country: 'BIH' },
  { name: 'Mieszko Fortunski', country: 'POL' },
  { name: 'Ralf Souquet', country: 'GER' },
  { name: 'Thorsten Hohmann', country: 'GER' },
  { name: 'Mika Immonen', country: 'FIN' },
  { name: 'Darren Appleton', country: 'GBR' },
  { name: 'Chris Melling', country: 'GBR' },
  { name: 'Karl Boyes', country: 'GBR' },
  { name: 'Konrad Juszczyszyn', country: 'POL' },
  { name: 'Wojciech Szewczyk', country: 'POL' },
  { name: 'Marc Bijsterbosch', country: 'NED' },
  { name: 'Billy Thorpe', country: 'USA' },
  { name: 'Tyler Styer', country: 'USA' },
  { name: 'Justin Martin', country: 'USA' },
  { name: 'John Morra', country: 'CAN' },
  { name: 'Alex Pagulayan', country: 'CAN' },
  { name: 'Corey Deuel', country: 'USA' },
  { name: 'Earl Strickland', country: 'USA' },
  { name: 'Johnny Archer', country: 'USA' },
  { name: 'Dennis Hatch', country: 'USA' },
  { name: 'Moritz Neuhausen', country: 'GER' },
  { name: 'Duong Quoc Hoang', country: 'VIE' },
  { name: 'Nguyen Anh Tuan', country: 'VIE' },
  { name: 'Luong Duc Thien', country: 'VIE' },
  { name: 'Bader Al Awadhi', country: 'KUW' },
  { name: 'Omar Al Shaheen', country: 'KUW' },
  { name: 'Dang Jin Hu', country: 'CHN' },
  { name: 'Pijus Labutis', country: 'LTU' },
  { name: 'Anton Raga', country: 'PHI' },
  { name: 'James Aranas', country: 'PHI' },
  { name: 'Lee Vann Corteza', country: 'PHI' },
  { name: 'Jeffrey de Luna', country: 'PHI' },
  { name: 'Hayato Hijikata', country: 'JPN' },
  { name: 'Robbie Capito', country: 'HKG' },
  { name: 'Jonas Souto', country: 'ESP' },
  { name: 'Imran Majid', country: 'GBR' },
  { name: 'Oliver Szolnoki', country: 'HUN' },
  { name: 'Marco Teutscher', country: 'NED' },
  { name: 'Ivar Saris', country: 'NED' },
  { name: 'Aleksa Pecelj', country: 'SRB' },
  { name: 'Niels Feijen', country: 'NED' } // Ensure 64 total
];

const playersList: Player[] = realPoolPlayers.slice(0, 64).map((p, i) => ({
  id: `p-${i + 1}`,
  name: p.name,
  country: p.country
}));

// In-memory Database for prototyping
let db: AppState = {
  events: [
    {
      id: 'demo-qualif-1',
      name: 'Demo Pro Qualification',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000 * 5).toISOString(),
      venue: 'London, UK',
      prizepool: '$50,000',
      adminCode: 'DEMO',
      status: 'live',
      format: 'knockout',
      isQualifier: true,
      totalPlayers: 32,
      qualifierSpots: 8,
      eliminationType: 'single',
      bracketSize: 32, // Used as fallback
      defaultScoringSystem: 'race',
      defaultRaceTo: 7,
      enrolledPlayers: playersList.map(p => p.id) // enroll everyone to play with
    },
    {
      id: 'evt-2',
      name: 'Hybrid Championship',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000 * 5).toISOString(),
      venue: 'Arena, CA',
      prizepool: '$100,000',
      adminCode: 'HYBRID',
      status: 'live',
      format: 'hybrid',
      bracketSize: 256,
      defaultScoringSystem: 'race',
      defaultRaceTo: 7,
      enrolledPlayers: playersList.slice(0, 8).map(p => p.id)
    },
    {
      id: 'evt-1',
      name: 'World Pool Masters 64',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000 * 5).toISOString(),
      venue: 'Halle 39, Hildesheim, Germany',
      prizepool: '$250,000',
      adminCode: 'WPM2A1',
      status: 'live',
      format: 'knockout',
      bracketSize: 64,
      defaultScoringSystem: 'race',
      defaultRaceTo: 9
    }
  ],
  players: playersList,
  matches: [],
  news: [
    {
      id: 'news-1',
      title: 'Jayson Shaw Advances to Semi-Finals!',
      content: 'In a thrilling match, Jayson Shaw secured his spot in the next round...',
      date: new Date().toISOString(),
      authorName: 'News Team',
      type: 'highlight'
    }
  ]
};

import { generateBracketLayout } from './src/utils/bracketLogic.js';

// Helper to determine next bracket match position using the layout array
function getBracketRouting(size: number, isDouble: boolean, stopAt: number | undefined, currentBP: string) {
  const layout = generateBracketLayout(size, isDouble, stopAt);
  const route = layout.find(l => l.bp === currentBP);
  return route || null;
}

function handleAutoAdvance(match: Match, dbState: typeof db, io: Server) {
  if (match.status !== 'finished' || match.stage === 'round-robin' || !match.bracketPosition) return;
  const winner = match.score1 > match.score2 ? match.player1 : (match.score2 > match.score1 ? match.player2 : null);
  const loser = match.score1 > match.score2 ? match.player2 : (match.score2 > match.score1 ? match.player1 : null);
  if (!winner || winner === 'BYE' || winner === 'TBA') return;

  const event = dbState.events.find(e => e.id === match.eventId);
  let handledAsQualifier = false;
  const bp = String(match.bracketPosition);

  const isStage1 = match.stage === 'stage1';
  const isDouble = isStage1 ? event?.eliminationType === 'double' : (match.stage === 'knockout' ? event?.eliminationType === 'double' : false);
  const size = isStage1 ? (event?.totalPlayers || 32) : (match.stage === 'stage2' ? (event?.qualifierSpots || 8) : (event?.bracketSize || 32));
  const stopAt = isStage1 ? event?.qualifierSpots : undefined;

  const route = getBracketRouting(size, !!isDouble, stopAt, bp);

  // Qualification Stage 1 -> Stage 2 logic
  if (match.stage === 'stage1' && event?.isQualifier && event.qualifierSpots) {
    if (route && !route.winTo) { // If it's a final advancement match in stage 1
      handledAsQualifier = true;
      let stage2Matches = dbState.matches.filter(m => m.eventId === event.id && m.stage === 'stage2');
      
      if (stage2Matches.length === 0) {
        const stage2Size = event.qualifierSpots || 8;
        const stage2Routes = generateBracketLayout(stage2Size, false, undefined);
        for (const sr of stage2Routes) {
          dbState.matches.push({
            id: 'm-' + Math.random().toString(36).substr(2, 6),
            eventId: event.id,
            player1: 'TBA',
            player2: 'TBA',
            score1: 0,
            score2: 0,
            status: 'pending',
            stage: 'stage2',
            bracketPosition: sr.bp,
            tableNumber: 1,
            scoringSystem: match.scoringSystem,
            raceTo: match.raceTo,
            bestOfSets: match.bestOfSets,
            time: 'TBD'
          });
        }
        stage2Matches = dbState.matches.filter(m => m.eventId === event.id && m.stage === 'stage2');
      }

      let placed = false;
      for (let sm of stage2Matches) {
        if (!placed && typeof sm.player1 === 'string' && (sm.player1 === 'TBA' || sm.player1.startsWith('Qualifier'))) {
          sm.player1 = winner;
          if (sm.status !== 'finished') sm.status = 'pending';
          placed = true;
        } else if (!placed && typeof sm.player2 === 'string' && (sm.player2 === 'TBA' || sm.player2.startsWith('Qualifier'))) {
          sm.player2 = winner;
          if (sm.status !== 'finished') sm.status = 'pending';
          placed = true;
        }
      }
      
      if (placed) {
        const wName = typeof winner === 'string' ? winner : winner.name;
      }
    }
  }

  if (route) {
    // Advance winner
    if (!handledAsQualifier && route.winTo) {
      const nextMatchIdx = dbState.matches.findIndex(m => m.eventId === match.eventId && m.bracketPosition === route.winTo && m.stage === match.stage);
      if (nextMatchIdx !== -1) {
        const nm = dbState.matches[nextMatchIdx];
        // Determine slot: we look at where 'M{num}' is the current match. Usually odd goes to slot1, even to slot2.
        // Wait, if nextMatch exists, which slot does this winner take?
        // We can just rely on the layout structure logic which always paired them: M1 & M2 -> M1.
        // So if current BP ends in \d+, we parse it to determine slot.
        const prevMatchNumMatch = bp.match(/\d+$/);
        const prevNum = prevMatchNumMatch ? parseInt(prevMatchNumMatch[0], 10) : 1;
        const isPlayer1Slot = prevNum % 2 !== 0;

        if (isPlayer1Slot) nm.player1 = winner;
        else nm.player2 = winner;
        
        if (nm.status !== 'finished') {
          nm.status = 'pending';
        }
      } else {
        const prevMatchNumMatch = bp.match(/\d+$/);
        const prevNum = prevMatchNumMatch ? parseInt(prevMatchNumMatch[0], 10) : 1;
        const isPlayer1Slot = prevNum % 2 !== 0;

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
          bracketPosition: route.winTo,
          time: 'TBD'
        };
        dbState.matches.push(newMatch);
      }
    }

    // Advance loser if applicable
    if (route.loseTo && loser && loser !== 'BYE' && loser !== 'TBA') {
      const loserMatchIdx = dbState.matches.findIndex(m => m.eventId === match.eventId && m.bracketPosition === route.loseTo && m.stage === match.stage);
      if (loserMatchIdx !== -1) {
        const lm = dbState.matches[loserMatchIdx];
        
        // Determing slot for loser drop: 
        // For WR round 1, L1 odd M -> slot1, even M -> slot2.
        // For other WR drops to L bracket, it usually drops to slot2 or slot1 depending on alignment. To keep it simple, we just pick the first TBA slot, or derive it.
        // But the simplest is matching the `M` number: if it drops to a new match, it's slot1/slot2.
        // Wait: "L{idx} - M{m}" usually corresponds exactly to the match number. If it drops to `L1 - M(ceil(M/2))`, then odd->1, even->2.
        // If it drops to `L{drop} - M{m}`, it drops directly to slot2 (slot1 is the winner coming from the L bracket).
        // Let's implement this rule:
        let isLoserP1Slot = true;
        if (route.loseTo.startsWith('L1 ')) {
          const prevMatchNumMatch = bp.match(/\d+$/);
          const prevNum = prevMatchNumMatch ? parseInt(prevMatchNumMatch[0], 10) : 1;
          isLoserP1Slot = prevNum % 2 !== 0;
        } else {
          // If it drops into L2, L4 etc, the L bracket winner takes P1, WR loser takes P2.
          isLoserP1Slot = false;
        }

        if (isLoserP1Slot) lm.player1 = loser;
        else lm.player2 = loser;
        
        if (lm.status !== 'finished') {
          lm.status = 'pending';
        }
      } else {
        // Create if missing
        let isLoserP1Slot = true;
        if (route.loseTo.startsWith('L1 ')) {
          const prevMatchNumMatch = bp.match(/\d+$/);
          const prevNum = prevMatchNumMatch ? parseInt(prevMatchNumMatch[0], 10) : 1;
          isLoserP1Slot = prevNum % 2 !== 0;
        } else {
          isLoserP1Slot = false;
        }

        const newMatch: Match = {
          id: 'm-' + Math.random().toString(36).substr(2, 6),
          eventId: match.eventId,
          player1: isLoserP1Slot ? loser : 'TBA',
          player2: !isLoserP1Slot ? loser : 'TBA',
          score1: 0,
          score2: 0,
          status: 'pending',
          stage: match.stage,
          tableNumber: 1,
          scoringSystem: match.scoringSystem,
          raceTo: match.raceTo,
          bestOfSets: match.bestOfSets,
          bracketPosition: route.loseTo,
          time: 'TBD'
        };
        dbState.matches.push(newMatch);
      }
    }
  }
}


let saveTimeout: NodeJS.Timeout | null = null;
async function saveToSupabase(state: AppState) {
  if (saveTimeout) clearTimeout(saveTimeout);
  
  saveTimeout = setTimeout(async () => {
    try {
      const { error } = await supabase
        .from('app_state')
        .upsert({ id: 'main', data: JSON.parse(JSON.stringify(state)) });
      
      if (error) {
        console.error('Failed to sync to Supabase:', error);
      }
    } catch (err) {
      console.error('Failed to sync to Supabase:', err);
    }
  }, 2000); // 2 second debounce
}

async function startServer() {
  try {
    console.log('Loading state from Supabase...');
    const { data: row, error } = await supabase
      .from('app_state')
      .select('data')
      .eq('id', 'main')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows
        console.log('No state found, saving defaults.');
        await saveToSupabase(db);
      } else {
        console.error('Error finding state in Supabase, falling back to local defaults:', error);
      }
    } else if (row && row.data) {
      db = { ...db, ...row.data };
      console.log('State loaded successfully!');
    }
  } catch (err) {
    console.error('Error loading Supabase state:', err);
  }

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  
  app.use(express.json());

  // Socket.IO Setup
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Send initial state
    socket.emit('sync_state', db);

    // Event updates
    socket.on('update_match', (updatedMatch: Match) => {
      const idx = db.matches.findIndex(m => m.id === updatedMatch.id);
      if (idx !== -1) {
        const oldMatch = db.matches[idx];
        db.matches[idx] = updatedMatch;
        
        // Handle Auto-Advancement
        if (oldMatch.status !== 'finished' && updatedMatch.status === 'finished') {
          handleAutoAdvance(updatedMatch, db, io);
        }
      } else {
        db.matches.push(updatedMatch);
      }
      io.emit('sync_state', db);
      saveToSupabase(db);
    });

    socket.on('add_match', (match: Match) => {
      db.matches.push(match);
      
      // Auto-advance if it was added as already finished
      if (match.status === 'finished') {
        handleAutoAdvance(match, db, io);
      }
      io.emit('sync_state', db);
      saveToSupabase(db);
    });

    socket.on('add_matches', (newMatches: Match[]) => {
      let matchesAdded = 0;
      for (const match of newMatches) {
        db.matches.push(match);
        matchesAdded++;
        
        // Auto-advance if it was added as already finished
        if (match.status === 'finished') {
          handleAutoAdvance(match, db, io);
        }
      }
      
      if (matchesAdded > 0) {
        io.emit('sync_state', db);
      saveToSupabase(db);
      }
    });

    socket.on('create_event', (event: EventType) => {
      db.events.push(event);
      io.emit('sync_state', db);
      saveToSupabase(db);
    });

    socket.on('update_event', (event: EventType) => {
      const idx = db.events.findIndex(e => e.id === event.id);
      if (idx !== -1) {
        db.events[idx] = event;
        io.emit('sync_state', db);
      saveToSupabase(db);
      }
    });

    socket.on('delete_match', (id: string) => {
      db.matches = db.matches.filter(m => m.id !== id);
      io.emit('sync_state', db);
      saveToSupabase(db);
    });

    socket.on('delete_matches', (ids: string[]) => {
      db.matches = db.matches.filter(m => !ids.includes(m.id));
      io.emit('sync_state', db);
      saveToSupabase(db);
    });

    socket.on('delete_event', (id: string) => {
      db.events = db.events.filter(e => e.id !== id);
      db.matches = db.matches.filter(m => m.eventId !== id);
      io.emit('sync_state', db);
      saveToSupabase(db);
    });

    socket.on('add_news', (news: NewsItem) => {
      db.news.unshift(news);
      io.emit('sync_state', db);
      saveToSupabase(db);
    });

    socket.on('update_news', (news: NewsItem) => {
      const idx = db.news.findIndex(n => n.id === news.id);
      if (idx !== -1) {
        db.news[idx] = news;
        io.emit('sync_state', db);
      saveToSupabase(db);
      }
    });

    socket.on('delete_news', (id: string) => {
      db.news = db.news.filter(n => n.id !== id);
      io.emit('sync_state', db);
      saveToSupabase(db);
    });

    socket.on('add_player', (player: typeof db.players[0]) => {
      db.players.push(player);
      io.emit('sync_state', db);
      saveToSupabase(db);
    });

    socket.on('update_player', (player: typeof db.players[0]) => {
      const idx = db.players.findIndex(p => p.id === player.id);
      if (idx !== -1) {
        db.players[idx] = player;
      }
      io.emit('sync_state', db);
      saveToSupabase(db);
    });

    socket.on('delete_player', (id: string) => {
      db.players = db.players.filter(p => p.id !== id);
      io.emit('sync_state', db);
      saveToSupabase(db);
    });

    socket.on('update_settings', (settings: any) => {
      db.settings = settings;
      io.emit('sync_state', db);
      saveToSupabase(db);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Vite Middleware for Dev
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
