import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        // Create a default calendar
        calendars: {
            create: {
                name: "My Calendar",
                isDefault: true
            }
        }
      }
    });

    return NextResponse.json({ user: { id: user.id, email: user.email } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Registration failed" }, { status: 500 });
  }
}
