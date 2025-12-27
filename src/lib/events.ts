import { prisma } from './prisma';
import { RRule, rrulestr } from 'rrule';

export type CreateEventInput = {
  title: string;
  startTime: string | Date;
  endTime: string | Date;
  description?: string;
  recurrenceRule?: string | null;
  calendarId?: string;
  reminders?: number[];
};

export async function getEvents(userId: string, start: Date, end: Date) {
  // 1. Fetch non-recurring events in range for USER
  const singleEvents = await prisma.event.findMany({
    where: {
      calendar: { userId },
      recurrenceRule: null,
      startTime: { gte: start },
      endTime: { lte: end },
    },
    include: { reminders: true },
  });

  // 2. Fetch ALL recurring events for USER
  // Optimization: Filter by start time <= end range
  const recurringEvents = await prisma.event.findMany({
    where: {
      calendar: { userId },
      recurrenceRule: { not: null },
      startTime: { lte: end }, 
    },
    include: { reminders: true },
  });

  const expandedEvents: any[] = [];
  
  for (const event of recurringEvents) {
    if (!event.recurrenceRule) continue; 

    const eventDuration = event.endTime.getTime() - event.startTime.getTime();
    
    try {
        const rule = rrulestr(event.recurrenceRule, {
            dtstart: event.startTime, // RRule uses this as the seed
        });

        // Get occurrences between range start and end
        const dates = rule.between(start, end, true);

        dates.forEach(date => {
            expandedEvents.push({
                ...event,
                id: `${event.id}_${date.getTime()}`, // Virtual ID for occurrence
                startTime: date,
                endTime: new Date(date.getTime() + eventDuration),
                originalEventId: event.id, // Track original
                // Reminders are inherited from the parent event
            });
        });
    } catch (e) {
        console.error(`Failed to parse RRule for event ${event.id}`, e);
    }
  }

  // Combine and sort
  const allEvents = [...singleEvents, ...expandedEvents].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return allEvents;
}

export async function checkConflict(userId: string, start: Date, end: Date, excludeId?: string): Promise<boolean> {
  const count = await prisma.event.count({
    where: {
      calendar: { userId },
      AND: [
        { startTime: { lt: end } },
        { endTime: { gt: start } },
        excludeId ? { id: { not: excludeId } } : {},
      ],
    },
  });
  return count > 0;
}

export async function createEvent(userId: string, data: CreateEventInput) {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);

  if (start >= end) {
    throw new Error('Start time must be before end time');
  }

  const hasConflict = await checkConflict(userId, start, end);
  if (hasConflict) {
    throw new Error('Event overlaps with an existing event');
  }

  let targetCalendarId = data.calendarId;

  if (!targetCalendarId) {
    // Find default calendar
    const defaultCalendar = await prisma.calendar.findFirst({
        where: { userId, isDefault: true }
    });
    if (!defaultCalendar) {
        throw new Error('User has no default calendar');
    }
    targetCalendarId = defaultCalendar.id;
  } else {
      // Verify ownership
      const calendar = await prisma.calendar.findFirst({
          where: { id: targetCalendarId, userId }
      });
      if (!calendar) {
          throw new Error('Invalid calendar');
      }
  }

  return prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      startTime: start,
      endTime: end,
      recurrenceRule: data.recurrenceRule,
      calendarId: targetCalendarId,
      reminders: {
          create: data.reminders?.map(minutes => ({ minutesBefore: minutes })) || []
      }
    },
    include: { reminders: true }
  });
}

export async function updateEvent(userId: string, id: string, data: CreateEventInput) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
  
    if (start >= end) {
      throw new Error('Start time must be before end time');
    }
    
    // Conflict check omitted for now/simplification
    
    // Delete existing reminders first (simple replacement strategy)
    if (data.reminders) {
        await prisma.reminder.deleteMany({
            where: { eventId: id }
        });
    }

    return prisma.event.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        startTime: start,
        endTime: end,
        recurrenceRule: data.recurrenceRule,
        ...(data.calendarId ? { calendarId: data.calendarId } : {}),
        ...(data.reminders ? {
            reminders: {
                create: data.reminders.map(minutes => ({ minutesBefore: minutes }))
            }
        } : {})
      },
      include: { reminders: true }
    });
  }

export async function deleteEvent(id: string) {
  return prisma.event.delete({
    where: { id },
  });
}
