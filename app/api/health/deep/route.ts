import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/health/deep — readiness probe: verifies the DB with SELECT 1.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', db: 'up', ts: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: 'error', db: 'down' }, { status: 503 });
  }
}
