import React from 'react';
import { useStore } from '../store';
import { Calendar, Clock, Trophy, CalendarPlus, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Match, EventType } from '../types';

export function ScheduleView() {
  const { matches, events } = useStore();
  const navigate = useNavigate();

  // Filter scheduled or upcoming matches across all events
  const upcomingMatches = matches.filter(m => m.status === 'pending' && m.time !== 'TBD').sort((a, b) => {
    // Sort by time roughly. Assuming 'HH:MM'
    return (a.time || '').localeCompare(b.time || '');
  });

  const getEvent = (eventId: string) => events.find(e => e.id === eventId);

  const exportToICS = (match: Match, event: EventType | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!event) return;

    const p1Name = typeof match.player1 === 'string' ? match.player1 : match.player1.name;
    const p2Name = typeof match.player2 === 'string' ? match.player2 : match.player2.name;
    const title = `${p1Name} vs ${p2Name}`;
    const description = `${event.name}\\nStage: ${match.stage === 'knockout' ? match.bracketPosition : 'Round Robin'}\\nTable: ${match.tableNumber}`;
    
    // We don't have accurate specific dates, only event date and match "time".
    const dateObj = new Date();
    if (match.time && match.time !== 'TBD') {
      const [hours, minutes] = match.time.split(':');
      dateObj.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    }
    
    const endObj = new Date(dateObj.getTime() + 2 * 60 * 60 * 1000); // Assume 2 hour duration

    const toICSStr = (d: Date) => d.toISOString().replace(/-|:/g, '').split('.')[0] + 'Z';
    
    const icsStr = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Billards//WNT Live//EN\nBEGIN:VEVENT\nUID:${match.id}@wntlive.com\nDTSTAMP:${toICSStr(new Date())}\nDTSTART:${toICSStr(dateObj)}\nDTEND:${toICSStr(endObj)}\nSUMMARY:${title}\nDESCRIPTION:${description}\nLOCATION:${event.venue}\nEND:VEVENT\nEND:VCALENDAR`;

    const blob = new Blob([icsStr], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 print:mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white print:text-black tracking-tight">Global Schedule</h1>
          <p className="text-zinc-400 print:text-zinc-600 mt-1">Upcoming matches across all tournaments</p>
        </div>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('app-toast', { detail: 'Printing is restricted in preview. Please export or open in a new tab.' }))}
          className="flex items-center gap-2 bg-zinc-800 text-white px-4 py-2 rounded-2xl text-sm hover:bg-zinc-700 transition-colors print:hidden"
        >
          <Printer className="w-4 h-4" /> Print Schedule
        </button>
      </div>

      <div className="space-y-4">
        {upcomingMatches.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <div className="text-xl font-bold text-white mb-2">No upcomings scheduled</div>
            <p className="text-zinc-500">Scheduled matches with set times will appear here.</p>
          </div>
        ) : (
          upcomingMatches.map(match => {
            const event = getEvent(match.eventId);
            return (
              <div key={match.id} onClick={() => navigate(`/event/${event?.id}`)} className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center cursor-pointer hover:border-zinc-700 transition-colors print:bg-white print:border-zinc-300 print:shadow-none print:break-inside-avoid print:cursor-auto">
                <div className="w-full md:w-48 shrink-0">
                  <div className="text-emerald-400 print:text-emerald-600 font-bold mb-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> {match.time}
                  </div>
                  <div className="text-sm text-zinc-400 print:text-zinc-600 truncate flex items-center gap-2">
                    <Trophy className="w-3 h-3" /> {event?.name}
                  </div>
                </div>

                <div className="flex-1 w-full flex items-center justify-between md:border-l md:border-zinc-800 print:border-zinc-300 md:pl-6">
                  <div className="flex-1 text-right">
                    <div className="font-display font-bold text-lg text-white print:text-black">{typeof match.player1 === 'string' ? match.player1 : match.player1.name}</div>
                    <div className="text-xs text-zinc-500 print:text-zinc-500 font-medium uppercase tracking-widest">{typeof match.player1 === 'string' ? 'N/A' : match.player1.country}</div>
                  </div>
                  
                  <div className="px-8 flex flex-col items-center shrink-0">
                    <div className="text-xs font-mono text-zinc-500 print:text-zinc-500 mb-2 whitespace-nowrap">
                      {match.stage === 'knockout' ? match.bracketPosition || 'KO' : 'Round Robin'} 
                    </div>
                    <div className="text-2xl font-display font-black text-zinc-700 print:text-zinc-400 italic">VS</div>
                    <div className="mt-2 text-xs text-zinc-500 print:text-zinc-500 font-bold uppercase tracking-widest text-center">
                      Table {match.tableNumber}
                    </div>
                  </div>

                  <div className="flex-1 text-left">
                    <div className="font-display font-bold text-lg text-white print:text-black">{typeof match.player2 === 'string' ? match.player2 : match.player2.name}</div>
                    <div className="text-xs text-zinc-500 print:text-zinc-500 font-medium uppercase tracking-widest">{typeof match.player2 === 'string' ? 'N/A' : match.player2.country}</div>
                  </div>

                  <div className="absolute top-4 right-4 md:static md:ml-4 border-l border-zinc-800 print:border-zinc-300 md:pl-4 print:hidden">
                    <button 
                      onClick={(e) => exportToICS(match, event, e)} 
                      className="text-zinc-400 hover:text-emerald-400 p-2 bg-zinc-950 rounded-2xl hover:bg-zinc-800 transition-colors"
                      title="Add to Calendar"
                    >
                       <CalendarPlus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
