import { NextRequest, NextResponse } from 'next/server';
import { createEvent, getEvents } from '@/lib/events';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');

  if (!startParam || !endParam) {
    return NextResponse.json(
      { error: 'Missing start or end date parameters' },
      { status: 400 }
    );
  }

  try {
    const start = new Date(startParam);
    const end = new Date(endParam);
    const events = await getEvents((session.user as any).id, start, end);
    return NextResponse.json(events);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const event = await createEvent((session.user as any).id, body);
    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Event overlaps with an existing event') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error.message === 'Start time must be before end time') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error.message === 'User has no default calendar') {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
