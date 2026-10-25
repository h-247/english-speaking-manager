import { NextResponse } from 'next/server';
import { getAuthenticatedUserOrLocal } from '@/lib/chatgpt-auth';
import { SessionService } from '@/lib/session-service';
import { recordResultSchema } from '@/lib/validation';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const user = await getAuthenticatedUserOrLocal();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    const parseResult = recordResultSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((e: any) => e.message).join(' ');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const updated = await SessionService.recordResult(user.userId, id, parseResult.data);
    return NextResponse.json(updated);
  } catch (error: any) {
    const isNotFound = error.message?.includes('not found');
    return NextResponse.json(
      { error: error.message || 'Failed to record results' },
      { status: isNotFound ? 404 : 400 },
    );
  }
}
