'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from './CalendarSidebar';

type CalendarEvent = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  calendarId?: string;
  originalEventId?: string;
};

type EventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onEventAdded: () => void;
  onEventUpdated?: () => void;
  onEventDeleted?: () => void;
  defaultStartTime?: Date;
  defaultEndTime?: Date;
  event?: CalendarEvent | null;
  calendars?: Calendar[];
};

export default function EventModal({ 
  isOpen, 
  onClose, 
  onEventAdded, 
  onEventUpdated,
  onEventDeleted,
  defaultStartTime, 
  defaultEndTime, 
  event,
  calendars = []
}: EventModalProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [recurrence, setRecurrence] = useState('NONE'); // NONE, DAILY, WEEKLY
  const [selectedCalendarId, setSelectedCalendarId] = useState('');
  const [selectedReminder, setSelectedReminder] = useState<number>(-1); // -1 = None
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (event) {
        // Edit Mode
        const start = new Date(event.startTime);
        const end = new Date(event.endTime);
        setTitle(event.title);
        setDate(format(start, 'yyyy-MM-dd'));
        setStartTime(format(start, 'HH:mm'));
        setEndTime(format(end, 'HH:mm'));
        setRecurrence('NONE'); 
        setSelectedCalendarId(event.calendarId || calendars.find(c => c.isDefault)?.id || calendars[0]?.id || '');
      } else {
        // Create Mode
        setTitle('');
        setDate(defaultStartTime ? format(defaultStartTime, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
        setStartTime(defaultStartTime ? format(defaultStartTime, 'HH:mm') : '09:00');
        setEndTime(defaultEndTime ? format(defaultEndTime, 'HH:mm') : '10:00');
        setRecurrence('NONE');
        setSelectedCalendarId(calendars.find(c => c.isDefault)?.id || calendars[0]?.id || '');
      }
      setError('');
      setIsDeleteConfirmOpen(false); 
    }
  }, [isOpen, event, defaultStartTime, defaultEndTime, calendars]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);
    
    // Use originalEventId for recurring instances to update the SERIES
    // Virtual IDs (with underscore) won't work on backend.
    const targetId = (event as any)?.originalEventId || event?.id;

    let recurrenceRule = null;
    if (recurrence === 'DAILY') recurrenceRule = 'FREQ=DAILY';
    if (recurrence === 'WEEKLY') recurrenceRule = 'FREQ=WEEKLY';
    if (recurrence === 'MONTHLY') recurrenceRule = 'FREQ=MONTHLY';

    try {
      // ... fetch logic ...
      const url = event ? `/api/events/${targetId}` : '/api/events';
      const method = event ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          recurrenceRule, 
          calendarId: selectedCalendarId,
          reminders: selectedReminder > 0 ? [selectedReminder] : [] 
        }),
      });


      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${event ? 'update' : 'create'} event`);
      }

      if (event && onEventUpdated) onEventUpdated();
      else onEventAdded();
      
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    
    // Use originalEventId for recurring instances to delete the SERIES
    const targetId = (event as any)?.originalEventId || event.id;
    
    setIsDeleting(true);
    try {
        const res = await fetch(`/api/events/${targetId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');
        if (onEventDeleted) onEventDeleted();
        onClose();
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 transform transition-all scale-100 relative">
        {/* Delete Confirmation Overlay */}
        {isDeleteConfirmOpen && (
          <div className="absolute inset-0 bg-white rounded-xl z-10 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-200">
             <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
               </svg>
             </div>
             <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Event?</h3>
             <p className="text-slate-500 mb-6">Are you sure you want to delete "{title}"? This action cannot be undone.</p>
             {(event as any)?.originalEventId && (
                 <p className="text-amber-600 bg-amber-50 p-3 rounded-lg text-sm mb-6 border border-amber-200">
                    ⚠ This is a recurring event. Deleting it will remove <strong>all occurrences</strong> in the series.
                 </p>
             )}
             <div className="flex space-x-3 w-full">
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="flex-1 px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  autoFocus
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
             </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">{event ? 'Edit Event' : 'Create Event'}</h2>
            {event && (
                <button 
                    type="button"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors"
                >
                    Delete
                </button>
            )}
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Event Title</label>
            <input
              type="text"
              required
              placeholder="e.g., Team Sync"
              className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border hover:border-indigo-300 transition-colors text-slate-900 placeholder:text-slate-400"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
            <input
              type="date"
              required
              className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border hover:border-indigo-300 transition-colors text-slate-900 placeholder:text-slate-400"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Start Time</label>
              <input
                type="time"
                required
                className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border hover:border-indigo-300 transition-colors text-slate-900 placeholder:text-slate-400"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">End Time</label>
              <input
                type="time"
                required
                className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border hover:border-indigo-300 transition-colors text-slate-900 placeholder:text-slate-400"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
             <label className="block text-sm font-semibold text-slate-700 mb-2">Reminder</label>
             <select
                className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border hover:border-indigo-300 transition-colors text-slate-900"
                value={selectedReminder}
                onChange={(e) => setSelectedReminder(Number(e.target.value))}
             >
                <option value={-1}>None</option>
                <option value={10}>10 minutes before</option>
                <option value={30}>30 minutes before</option>
                <option value={60}>1 hour before</option>
                <option value={1440}>1 day before</option>
             </select>
          </div>

          <div>
             <label className="block text-sm font-semibold text-slate-700 mb-2">Recurrence</label>
             <select
                className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border hover:border-indigo-300 transition-colors text-slate-900"
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                disabled={!!event} // Disable editing recurrence for existing events (MVP simplification)
             >
                <option value="NONE">None</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
             </select>
             {event && <p className="text-xs text-slate-500 mt-1">Recurrence cannot be changed for existing events.</p>}
          </div>

          <div>
             <label className="block text-sm font-semibold text-slate-700 mb-2">Calendar</label>
             <select
                className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border hover:border-indigo-300 transition-colors text-slate-900"
                value={selectedCalendarId}
                onChange={(e) => setSelectedCalendarId(e.target.value)}
                disabled={!!event} // For now, disable moving calendars on edit if complex
             >
                {calendars.map(cal => (
                    <option key={cal.id} value={cal.id}>
                        {cal.name} {cal.isDefault ? '(Default)' : ''}
                    </option>
                ))}
             </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isSubmitting ? 'Saving...' : (event ? 'Update Event' : 'Create Event')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
