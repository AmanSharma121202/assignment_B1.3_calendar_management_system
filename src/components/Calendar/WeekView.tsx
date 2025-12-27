'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek, addDays, startOfDay, addHours, differenceInMinutes, isSameDay } from 'date-fns';
import { useSession, signOut } from 'next-auth/react';
import EventModal from './EventModal';
import CalendarSidebar, { Calendar } from './CalendarSidebar';


type CalendarEvent = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  calendarId: string;
  originalEventId?: string;
  reminders?: { minutesBefore: number }[];
};

// Helper to generate consistent vibrant colors from string
const getStringColor = (str: string) => {
  const colors = [
    'bg-red-100 border-red-200 text-red-800 hover:bg-red-200',
    'bg-orange-100 border-orange-200 text-orange-800 hover:bg-orange-200',
    'bg-amber-100 border-amber-200 text-amber-800 hover:bg-amber-200',
    'bg-green-100 border-green-200 text-green-800 hover:bg-green-200',
    'bg-emerald-100 border-emerald-200 text-emerald-800 hover:bg-emerald-200',
    'bg-teal-100 border-teal-200 text-teal-800 hover:bg-teal-200',
    'bg-cyan-100 border-cyan-200 text-cyan-800 hover:bg-cyan-200',
    'bg-sky-100 border-sky-200 text-sky-800 hover:bg-sky-200',
    'bg-blue-100 border-blue-200 text-blue-800 hover:bg-blue-200',
    'bg-indigo-100 border-indigo-200 text-indigo-800 hover:bg-indigo-200',
    'bg-violet-100 border-violet-200 text-violet-800 hover:bg-violet-200',
    'bg-purple-100 border-purple-200 text-purple-800 hover:bg-purple-200',
    'bg-fuchsia-100 border-fuchsia-200 text-fuchsia-800 hover:bg-fuchsia-200',
    'bg-pink-100 border-pink-200 text-pink-800 hover:bg-pink-200',
    'bg-rose-100 border-rose-200 text-rose-800 hover:bg-rose-200',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function WeekView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Local state for year input to allow typing
  const [yearInput, setYearInput] = useState(currentDate.getFullYear().toString());

  useEffect(() => {
    setYearInput(currentDate.getFullYear().toString());
  }, [currentDate]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [selectedStart, setSelectedStart] = useState<Date | undefined>();
  const [selectedEnd, setSelectedEnd] = useState<Date | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const { data: session } = useSession();

  const startDate = React.useMemo(() => startOfWeek(currentDate, { weekStartsOn: 0 }), [currentDate]); // Sunday start

  // Set current time on mount and update every minute
  useEffect(() => {
      setNow(new Date());
      const interval = setInterval(() => setNow(new Date()), 60000);
      return () => clearInterval(interval);
  }, []);

  // Fetch calendars
  const fetchCalendars = useCallback(async () => {
    if (!session?.user) return;
    try {
        const res = await fetch('/api/calendars');
        if (res.ok) {
            const data = await res.json();
            setCalendars(data);
            // Default select first or default if no selection
            if (!selectedCalendarId && data.length > 0) {
                const defaultCal = data.find((c: Calendar) => c.isDefault) || data[0];
                setSelectedCalendarId(defaultCal.id);
            }
        }
    } catch (e) {
        console.error('Failed to fetch calendars');
    }
  }, [session, selectedCalendarId]);

  useEffect(() => {
    fetchCalendars();
  }, [fetchCalendars]);

  const handleCreateCalendar = async (name: string) => {
      try {
          const res = await fetch('/api/calendars', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name })
          });
          if (res.ok) {
            fetchCalendars();
          }
      } catch (e) {
          console.error("Failed to create calendar");
      }
  };

  const handleUpdateCalendar = async (id: string, name: string) => {
      try {
          const res = await fetch(`/api/calendars/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name })
          });
          if (res.ok) {
              fetchCalendars();
          }
      } catch (e) {
          console.error("Failed to update calendar");
      }
  };

  const [calendarToDelete, setCalendarToDelete] = useState<string | null>(null);

  const handleDeleteCalendarClick = (id: string) => {
      setCalendarToDelete(id);
  };

  const confirmDeleteCalendar = async () => {
      if (!calendarToDelete) return;
      try {
          const res = await fetch(`/api/calendars/${calendarToDelete}`, { method: 'DELETE' });
          if (res.ok) {
              fetchCalendars();
              fetchEvents();
              setCalendarToDelete(null);
              // If deleted current selection, select another
              if (selectedCalendarId === calendarToDelete) {
                  setSelectedCalendarId(null); // fetchCalendars will pick new one
              }
          } else {
              alert("Failed to delete (cannot delete default)");
          }
      } catch (e) {
          console.error("Failed to delete");
      }
  };

  const handleToggleCalendar = (id: string) => {
      setSelectedCalendarId(id);
  };

  // Fetch events when week changes
  const fetchEvents = useCallback(async () => {
    const start = startDate.toISOString();
    const end = addDays(startDate, 7).toISOString();
    console.log(`Fetching events from ${start} to ${end}`);
    try {
      const res = await fetch(`/api/events?start=${start}&end=${end}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        console.log('Fetched events:', data);
        setEvents(data);
      } else {
        console.error('Failed response:', res.status);
      }
    } catch (e) {
      console.error('Failed to fetch events', e);
    }
  }, [startDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    return addDays(startDate, i);
  });

  const hours = Array.from({ length: 24 }).map((_, i) => i);

  const handleSlotClick = (day: Date, hour: number) => {
    const start = addHours(startOfDay(day), hour);
    const end = addHours(start, 1);
    setSelectedStart(start);
    setSelectedEnd(end);
    setSelectedEvent(null); // Clear selected event for create mode
    setIsModalOpen(true);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedEvent(event);
      setIsModalOpen(true);
  };

  const calculateEventPosition = (event: CalendarEvent) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    // Minutes from start of day
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const durationMinutes = differenceInMinutes(end, start);
    
    return {
      top: `${(startMinutes / 1440) * 100}%`,
      height: `${(durationMinutes / 1440) * 100}%`,
    };
  };

  const handleEventDrop = async (e: React.DragEvent, day: Date, hour: number) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('eventId');
    const event = events.find(ev => ev.id === eventId);
    if (!event) return;

    // Calculate new start/end times
    // Dropping on 'day' at 'hour'. 
    // We preserve the minutes from the original start time? Or snap to top of hour?
    // UX decision: Snap to top of hour for simplicity in this MVP drag. 
    // Or simpler: The hour block represents XX:00.
    
    const originalStart = new Date(event.startTime);
    const originalEnd = new Date(event.endTime);
    const durationMinutes = differenceInMinutes(originalEnd, originalStart);
    
    const newStart = addHours(startOfDay(day), hour);
    // Let's keep original minutes if we want precise drag, but I'm dropping on an "Hour Slot".
    // Snapping to the hour is cleaner for "Agenda" style slots.
    // If I wanted precise dnd, I'd need pixel offset calculation within the slot.
    // Let's stick to hour snap. 
    const newEnd = addHours(newStart, durationMinutes / 60); 

    // Optimistic update
    const oldEvents = [...events];
    setEvents(events.map(ev => 
        ev.id === eventId 
        ? { ...ev, startTime: newStart.toISOString(), endTime: newEnd.toISOString() } 
        : ev
    ));

    try {
        const res = await fetch(`/api/events/${eventId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: event.title,
                startTime: newStart.toISOString(),
                endTime: newEnd.toISOString(),
            }),
        });

        if (!res.ok) {
            throw new Error('Failed to update event position');
        }
        // Success - server might return updated event with sanitized times etc.
    } catch (err) {
        console.error("Drag update failed", err);
        alert("Failed to move event (overlap or error)");
        setEvents(oldEvents); // Revert
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      {/* Delete Calendar Confirmation Modal */}
      {calendarToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100 relative animate-in fade-in zoom-in duration-200">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 text-center">Delete Calendar?</h3>
                  <p className="text-slate-500 mb-6 text-center text-sm">
                      Are you sure you want to delete this calendar? All events in this calendar will be permanently lost.
                  </p>
                  <div className="flex space-x-3 w-full">
                    <button
                        onClick={() => setCalendarToDelete(null)}
                        className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmDeleteCalendar}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Delete
                    </button>
                  </div>
              </div>
          </div>
      )}

      <EventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onEventAdded={() => {
            fetchEvents();
            setIsModalOpen(false);
        }}
        onEventUpdated={() => {
            fetchEvents();
            setIsModalOpen(false);
        }}
        onEventDeleted={() => {
            fetchEvents();
            setIsModalOpen(false);
        }}
        defaultStartTime={selectedStart}
        defaultEndTime={selectedEnd}
        event={selectedEvent}
        calendars={calendars}
      />
      
      {/* Notification System Removed */}
      {/* <NotificationManager events={events} /> */}

      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between px-4 md:px-8 py-3 md:py-5 bg-white border-b border-slate-200 shadow-sm z-30 gap-4 md:gap-0">
        <div className="flex items-center w-full md:w-auto justify-between">
            <div className="flex items-center gap-3">
                {/* Mobile Menu Button */}
                <button 
                    className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md"
                    onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                CalendarMate
                </h1>
            </div>
            
            {/* Mobile Profile Icon (Moved to top right on mobile for better UX) */}
            <div className="md:hidden flex items-center">
                 {session?.user && (
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
                        {session.user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                 )}
            </div>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-6 w-full md:w-auto justify-center md:justify-end">
          <button 
             className="px-5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-full hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm"
             onClick={() => setCurrentDate(addDays(currentDate, -7))}
          >
            ← Previous
          </button>
          
          <div className="flex items-center gap-2">
            <select 
                value={currentDate.getMonth()}
                onChange={(e) => {
                    const newMonth = parseInt(e.target.value);
                    const newDate = new Date(currentDate.getFullYear(), newMonth, 1);
                    setCurrentDate(newDate);
                }}
                className="text-xl font-bold text-slate-800 bg-transparent border-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20 rounded px-1 py-0.5 hover:bg-slate-50 transition-colors appearance-none"
                style={{ WebkitAppearance: 'menulist' }} // Force arrow to show
            >
                {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i} value={i}>
                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </option>
                ))}
            </select>
            
            <input 
                type="number"
                value={yearInput}
                onChange={(e) => {
                     setYearInput(e.target.value);
                     const newYear = parseInt(e.target.value);
                     if (!isNaN(newYear) && newYear > 1900 && newYear < 2100) {
                         const newDate = new Date(newYear, currentDate.getMonth(), 1);
                         setCurrentDate(newDate);
                     }
                }}
                className="text-xl font-bold text-slate-800 bg-transparent border-none focus:ring-2 focus:ring-indigo-500/20 rounded px-1 py-0.5 w-24 hover:bg-slate-50 transition-colors"
            />
          </div>

          <button 
             className="px-5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-full hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm"
             onClick={() => setCurrentDate(addDays(currentDate, 7))}
          >
            Next →
          </button>
        </div>
        
        {/* User Profile (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
            {session?.user && (
                <div className="flex items-center gap-3">
                    <div className="flex flex-col text-right">
                        <span className="text-sm font-semibold text-slate-700">{session.user.name}</span>
                        <span className="text-xs text-slate-500">{session.user.email}</span>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
                        {session.user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            )}
        </div>
      </header>

      {/* Grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {session?.user && (
            <>
                {/* Mobile Overlay */}
                {showMobileSidebar && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setShowMobileSidebar(false)}
                    />
                )}
                
                {/* Sidebar Container */}
                <div className={`
                    fixed md:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
                    ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}
                    md:translate-x-0 w-64 bg-white border-r border-slate-200 flex-shrink-0 h-full shadow-xl md:shadow-none
                `}>
                    <CalendarSidebar 
                        calendars={calendars}
                        selectedCalendarId={selectedCalendarId}
                        onToggleCalendar={handleToggleCalendar}
                        onCreateCalendar={handleCreateCalendar}
                        onDeleteCalendar={handleDeleteCalendarClick}
                        onUpdateCalendar={handleUpdateCalendar}
                    />
                </div>
            </>
        )}

        {/* Unified 2D Scroll Container */}
        <div className="flex-1 overflow-auto bg-white relative" id="calendar-scroll-container">
            <div className="flex min-w-[800px]"> {/* Ensure min width for horiz scroll */}
                
                {/* Time Sidebar (Sticky Left) */}
                <div className="sticky left-0 z-40 bg-white border-r border-slate-200 flex-shrink-0 w-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                    {/* Corner Spacer (Sticky Top) */}
                    <div className="h-16 border-b border-slate-200 bg-slate-50 sticky top-0 z-50"></div>
                    
                    {/* Time Labels */}
                    <div className="relative" style={{ height: '1440px' }}>
                        {hours.map((hour) => (
                            <div key={hour} className="h-[60px] border-b border-transparent text-xs font-medium text-slate-400 text-center pt-2 relative">
                                <span className="-mt-2 block bg-white px-1 relative z-10">{format(addHours(startOfDay(new Date()), hour), 'h a')}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Days Columns */}
                <div className="flex flex-1">
                    {weekDays.map((day) => {
                        const isToday = isSameDay(day, new Date());
                        return (
                            <div key={day.toISOString()} className="flex-1 min-w-[140px] border-r border-slate-100 relative group">
                                {/* Day Header (Sticky Top) */}
                                <div className={`h-16 border-b border-slate-200 flex flex-col items-center justify-center sticky top-0 z-30 transition-colors ${isToday ? 'bg-indigo-50 border-b-indigo-200' : 'bg-slate-50'}`}>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>
                                        {format(day, 'EEE')}
                                    </span>
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full mt-1 ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-900'}`}>
                                        <span className="text-lg font-bold">
                                            {format(day, 'd')}
                                        </span>
                                    </div>
                                </div>

                                {/* Time Slots Container */}
                                <div 
                                    className="relative h-[1440px]" 
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                    }}
                                >
                                    {/* Horizontal grid lines */}
                                    {hours.map((hour) => (
                                        <div 
                                            key={hour} 
                                            className="h-[60px] border-b border-slate-100 hover:bg-indigo-50/30 cursor-pointer transition-colors duration-75 box-border"
                                            onClick={() => handleSlotClick(day, hour)}
                                            onDragOver={(e) => {
                                                 e.preventDefault();
                                                 e.dataTransfer.dropEffect = 'move';
                                            }}
                                            onDrop={(e) => handleEventDrop(e, day, hour)}
                                        >
                                        </div>
                                    ))}
                                    
                                    {/* Vertical marker for current time */}
                                    {isToday && now && (
                                        <div 
                                            className="absolute w-full border-t-2 border-red-500 z-20 pointer-events-none opacity-60"
                                            style={{ top: `${((now.getHours() * 60 + now.getMinutes()) / 1440) * 100}%` }}
                                        >
                                            <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
                                        </div>
                                    )}

                                    {/* Events */}
                                    {events
                                        .filter(event => isSameDay(new Date(event.startTime), day))
                                        .filter(event => selectedCalendarId ? event.calendarId === selectedCalendarId : false)
                                        .map(event => {
                                            const style = calculateEventPosition(event);
                                            const colorClass = getStringColor(event.title);
                                            const isRecurring = !!event.originalEventId;

                                            return (
                                                <div
                                                    key={event.id}
                                                    draggable={!isRecurring}
                                                    onDragStart={(e) => {
                                                        if (isRecurring) {
                                                            e.preventDefault();
                                                            alert("You cannot drag and drop recurring events.");
                                                            return;
                                                        }
                                                        e.dataTransfer.setData('eventId', event.id);
                                                        e.dataTransfer.effectAllowed = 'move';
                                                    }}
                                                    className={`absolute left-1 right-1 rounded-md border p-2 text-xs overflow-hidden shadow-sm hover:shadow-md transition-shadow z-10 ${colorClass} opacity-90 hover:opacity-100 ${isRecurring ? 'cursor-pointer' : 'cursor-move'}`}
                                                    style={{
                                                        top: style.top,
                                                        height: style.height,
                                                    }}
                                                    onClick={(e) => handleEventClick(event, e)}
                                                >
                                                    <div className="font-bold truncate text-sm flex items-center gap-1">
                                                        {isRecurring && <span>↻</span>}
                                                        {event.title}
                                                    </div>
                                                    <div className="opacity-90">{format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}</div>
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      </div>

    </div>
  );
}
