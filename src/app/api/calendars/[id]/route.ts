import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
  const userId = (session.user as any).id;
  const { id } = await params;

  try {
    // Verify ownership
    const calendar = await prisma.calendar.findUnique({
        where: { id }
    });

    if (!calendar || calendar.userId !== userId) {
        return NextResponse.json({ error: 'Not found or access denied' }, { status: 404 });
    }

    if (calendar.isDefault) {
        return NextResponse.json({ error: 'Cannot delete default calendar' }, { status: 400 });
    }

    await prisma.calendar.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete calendar' }, { status: 500 });
  }
}
