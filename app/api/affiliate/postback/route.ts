import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Conversion postback for affiliate partners that support one:
 *   GET /api/affiliate/postback?id=<linkId>&amount=<value>&secret=<shared secret>
 *
 * Partners without a postback still get click tracking; revenue for those is
 * entered manually from their own dashboard.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const amount = Number(url.searchParams.get('amount') || 0);
  const secret = url.searchParams.get('secret');

  const expected = process.env.AFFILIATE_POSTBACK_SECRET;
  if (expected && secret !== expected) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const link = await prisma.affiliateLink.findUnique({ where: { id } });
  if (!link) return NextResponse.json({ error: 'Unknown link' }, { status: 404 });

  await prisma.affiliateLink.update({
    where: { id },
    data: {
      conversions: { increment: 1 },
      revenue: { increment: Number.isFinite(amount) && amount > 0 ? amount : 0 },
    },
  });

  return NextResponse.json({ ok: true });
}
