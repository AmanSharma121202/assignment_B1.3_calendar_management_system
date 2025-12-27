'use client';

import React, { useState, useEffect } from 'react';

export type Calendar = {
    id: string;
    name: string;
    isDefault: boolean;
};

interface CalendarSidebarProps {
    calendars: Calendar[];
    selectedCalendarIds: string[];
    onToggleCalendar: (id: string) => void;
    onCreateCalendar: (name: string) => void;
    onDeleteCalendar: (id: string) => void;
}

export default function CalendarSidebar({ 
    calendars, 
    selectedCalendarIds, 
    onToggleCalendar,
    onCreateCalendar,
    onDeleteCalendar
}: CalendarSidebarProps) {
    const [newCalendarName, setNewCalendarName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCalendarName.trim()) {
            onCreateCalendar(newCalendarName);
            setNewCalendarName('');
            setIsCreating(false);
        }
    };

    return (
        <div className="w-64 bg-slate-50 border-r border-slate-200 flex-shrink-0 flex flex-col h-full bg-white/50">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-700">My Calendars</h2>
                <button 
                    onClick={() => setIsCreating(!isCreating)}
                    className="text-indigo-600 hover:bg-indigo-50 p-1 rounded transition"
                >
                    +
                </button>
            </div>

            {isCreating && (
                <form onSubmit={handleSubmit} className="p-3 bg-slate-100 border-b border-slate-200">
                    <input 
                        className="w-full px-2 py-1 text-sm rounded border border-slate-300 mb-2 text-slate-900 placeholder:text-slate-400"
                        placeholder="Calendar Name"
                        value={newCalendarName}
                        onChange={e => setNewCalendarName(e.target.value)}
                        autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setIsCreating(false)} className="text-xs text-slate-500">Cancel</button>
                        <button type="submit" className="text-xs bg-indigo-600 text-white px-2 py-1 rounded">Save</button>
                    </div>
                </form>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {calendars.map(cal => (
                    <div key={cal.id} className="flex items-center justify-between group">
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 select-none">
                            <input 
                                type="checkbox" 
                                checked={selectedCalendarIds.includes(cal.id)}
                                onChange={() => onToggleCalendar(cal.id)}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            {cal.name}
                            {cal.isDefault && <span className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded">Default</span>}
                        </label>
                        {!cal.isDefault && (
                             <button 
                                onClick={() => onDeleteCalendar(cal.id)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity px-1"
                             >
                                ×
                             </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
