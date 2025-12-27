'use client';

import React, { useState, useEffect } from 'react';

export type Calendar = {
    id: string;
    name: string;
    isDefault: boolean;
};

interface CalendarSidebarProps {
    calendars: Calendar[];
    selectedCalendarId: string | null;
    onToggleCalendar: (id: string) => void;
    onCreateCalendar: (name: string) => void;
    onDeleteCalendar: (id: string) => void;
    onUpdateCalendar: (id: string, name: string) => void;
}

export default function CalendarSidebar({ 
    calendars, 
    selectedCalendarId, 
    onToggleCalendar,
    onCreateCalendar,
    onDeleteCalendar,
    onUpdateCalendar
}: CalendarSidebarProps) {
    const [newCalendarName, setNewCalendarName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    
    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCalendarName.trim()) {
            onCreateCalendar(newCalendarName);
            setNewCalendarName('');
            setIsCreating(false);
        }
    };

    const handleEditSubmit = (e: React.FormEvent, id: string) => {
        e.preventDefault();
        if (editName.trim()) {
            onUpdateCalendar(id, editName);
            setEditingId(null);
        }
    };

    const startEditing = (cal: Calendar) => {
        setEditingId(cal.id);
        setEditName(cal.name);
    };

    return (
        <div className="w-64 bg-slate-50/50 border-r border-slate-200 flex-shrink-0 flex flex-col h-full backdrop-blur-sm">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white/50">
                <h2 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">My Calendars</h2>
                <button 
                    onClick={() => setIsCreating(!isCreating)}
                    className="flex items-center justify-center w-6 h-6 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-all shadow-sm transform hover:scale-105"
                    title="Add Calendar"
                >
                    <span className="text-lg leading-none mb-0.5">+</span>
                </button>
            </div>

            {isCreating && (
                <div className="p-4 bg-white border-b border-indigo-100 animate-in fade-in slide-in-from-top-2 duration-200">
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <input 
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
                            placeholder="Calendar Name"
                            value={newCalendarName}
                            onChange={e => setNewCalendarName(e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <button 
                                type="button" 
                                onClick={() => setIsCreating(false)} 
                                className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all transform active:scale-95"
                            >
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                {calendars.map(cal => (
                    <div 
                        key={cal.id} 
                        className={`flex items-center justify-between group px-3 py-2.5 rounded-lg transition-all duration-200 ${
                            selectedCalendarId === cal.id 
                            ? 'bg-white shadow-sm border border-slate-100' 
                            : 'hover:bg-white/60 hover:shadow-sm border border-transparent hover:border-slate-100'
                        }`}
                    >
                        {editingId === cal.id ? (
                            <form onSubmit={(e) => handleEditSubmit(e, cal.id)} className="flex-1 flex gap-2">
                                <input 
                                    className="w-full px-2 py-1 text-sm rounded border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    autoFocus
                                    onBlur={() => setEditingId(null)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') setEditingId(null);
                                    }}
                                />
                            </form>
                        ) : (
                            <>
                                <label className="flex items-center gap-3 cursor-pointer text-sm text-slate-700 select-none flex-1 truncate">
                                    <div className="relative flex items-center justify-center">
                                        <input 
                                            type="radio" 
                                            name="calendar-select"
                                            checked={selectedCalendarId === cal.id}
                                            onChange={() => onToggleCalendar(cal.id)}
                                            className="peer appearance-none w-4 h-4 rounded-full border border-slate-300 checked:bg-indigo-600 checked:border-indigo-600 focus:ring-offset-0 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                                        />
                                        <div className="absolute w-1.5 h-1.5 bg-white rounded-full pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                                    </div>
                                    <span className={`truncate font-medium ${selectedCalendarId === cal.id ? 'text-slate-800' : 'text-slate-600'}`}>
                                        {cal.name}
                                    </span>
                                    {cal.isDefault && (
                                        <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-100 ml-auto flex-shrink-0">
                                            Default
                                        </span>
                                    )}
                                </label>
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            startEditing(cal);
                                        }}
                                        className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                                        title="Rename Calendar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                        </svg>
                                    </button>
                                    {!cal.isDefault && (
                                        <button 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                onDeleteCalendar(cal.id);
                                            }}
                                            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all ml-1"
                                            title="Delete Calendar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
