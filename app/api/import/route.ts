import { NextResponse } from 'next/server';
import { getAuthenticatedUserOrLocal } from '@/lib/chatgpt-auth';
import { SessionService } from '@/lib/session-service';
import { importPayloadSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUserOrLocal();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = importPayloadSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((e: any) => e.message).join(' ');
      return NextResponse.json({ error: `Import validation error: ${errorMsg}` }, { status: 400 });
    }

    const report = await SessionService.importData(user.userId, parseResult.data);
    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Failed to import data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import records' },
      { status: 400 },
    );
  }
}
