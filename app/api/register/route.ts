import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { rateLimit, clientIp, REGISTER_LIMIT } from '@/lib/rate-limit';

const schema = z.object({
  name: z.string().min(2, 'Enter your full name').max(120),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
  phone: z.string().max(24).optional().or(z.literal('')),
  indexNumber: z.string().max(32).optional().or(z.literal('')),
});

export async function POST(req: Request) {
  const limit = rateLimit(
    `register:${clientIp(req.headers)}`,
    REGISTER_LIMIT.limit,
    REGISTER_LIMIT.windowMs
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many accounts created from this connection. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid details' },
      { status: 400 }
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: 'An account with that email already exists.' },
      { status: 409 }
    );
  }

  await prisma.user.create({
    data: {
      name: parsed.data.name.trim(),
      email,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      phone: parsed.data.phone || null,
      indexNumber: parsed.data.indexNumber || null,
      // Self sign-up is always a student. Lecturers are added by the Super
      // Admin; TAs are added by their lecturer.
      role: 'STUDENT',
    },
  });

  return NextResponse.json({ ok: true });
}
