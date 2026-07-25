import { NextRequest, NextResponse } from 'next/server';
import { issueVpnKey } from '@/lib/vpn';

export async function POST(req: NextRequest) {
  if (req.headers.get('x-debug-token') !== process.env.DEBUG_TOKEN) {
    return NextResponse.json({ error: 'no' }, { status: 401 });
  }
  const { userId, tarifId } = await req.json();
  try {
    const key = await issueVpnKey(userId, tarifId);
    return NextResponse.json({ ok: true, key });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
