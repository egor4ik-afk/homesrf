import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { issueVpnKey } from '@/lib/vpn';

export async function POST(req: NextRequest) {
  if (req.headers.get('x-debug-token') !== process.env.DEBUG_TOKEN) {
    return NextResponse.json({ error: 'no' }, { status: 401 });
  }
  const { userId, tarifId } = await req.json();
  try {
    const [tarif] = await sql`SELECT id, name, duration_days FROM tarifs WHERE id = ${tarifId}`;
    const key = await issueVpnKey(userId, tarifId);
    await sql`
      UPDATE users SET tarif_id=${tarif.id}, status='active',
        subscription_expires_at = NOW() + (${tarif.duration_days} || ' days')::interval,
        vpn_key=${key}, updated_at=NOW()
      WHERE id=${userId}`;
    return NextResponse.json({ ok: true, activated: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}