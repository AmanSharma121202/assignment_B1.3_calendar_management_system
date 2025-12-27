import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id;

  try {
    const calendars = await prisma.calendar.findMany({
      where: { userId },
    });
    return NextResponse.json(calendars);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch calendars' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id;

  try {
    const { name } = await request.json();
    if (!name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const calendar = await prisma.calendar.create({
      data: {
        name,
        userId,
        isDefault: false
      }
    });

    return NextResponse.json(calendar, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create calendar' }, { status: 500 });
  }
}
