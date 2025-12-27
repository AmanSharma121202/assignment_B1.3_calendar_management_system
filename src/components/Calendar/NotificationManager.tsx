'use client';

import { useEffect, useState, useRef } from 'react';

type ReminderEvent = {
    id: string;
    title: string;
    startTime: string;
    reminders?: { minutesBefore: number }[];
};

export default function NotificationManager({ events }: { events: ReminderEvent[] }) {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const notifiedEvents = useRef<Set<string>>(new Set());

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
            if (Notification.permission === 'default') {
                Notification.requestPermission().then(setPermission);
            }
        }
    }, []);

    useEffect(() => {
        if (permission !== 'granted') return;

        const checkReminders = () => {
            const now = new Date();
            
            events.forEach(event => {
                if (!event.reminders || event.reminders.length === 0) return;

                const eventStart = new Date(event.startTime);
                if (isNaN(eventStart.getTime())) return;

                event.reminders.forEach(reminder => {
                    const reminderTime = new Date(eventStart.getTime() - reminder.minutesBefore * 60000);
                    const diff = Math.abs(now.getTime() - reminderTime.getTime());

                    // Trigger if within a 1-minute window
                    const notificationId = `${event.id}-${reminder.minutesBefore}`;
                    
                    if (diff < 60000 && !notifiedEvents.current.has(notificationId)) {
                        new Notification(`Reminder: ${event.title}`, {
                            body: `Event starts in ${reminder.minutesBefore} minutes.`,
                            icon: '/calendar-icon.png' // Optional
                        });
                        notifiedEvents.current.add(notificationId);
                    }
                });
            });
        };

        const interval = setInterval(checkReminders, 10000); // Check every 10 seconds
        return () => clearInterval(interval);

    }, [events, permission]);

    return null; // Headless component
}
