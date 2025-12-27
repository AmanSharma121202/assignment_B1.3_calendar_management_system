import { NextRequest, NextResponse } from 'next/server';
import { deleteEvent, updateEvent } from '@/lib/events';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    // In a real app, verify ownership here too!
    await deleteEvent(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { id } = await params;
      const body = await request.json();
      const updatedEvent = await updateEvent((session.user as any).id, id, body);
      return NextResponse.json(updatedEvent);
    } catch (error: any) {
       console.error(error);
       return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }
  }
