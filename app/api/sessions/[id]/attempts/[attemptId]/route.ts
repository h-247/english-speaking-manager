import { NextResponse } from 'next/server';
import { getAuthenticatedUserOrLocal } from '@/lib/chatgpt-auth';
import { SessionService } from '@/lib/session-service';

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; attemptId: string }> | { id: string; attemptId: string } },
) {
  try {
    const user = await getAuthenticatedUserOrLocal();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, attemptId } = await context.params;
    await SessionService.deleteAttempt(user.userId, id, attemptId);

    return NextResponse.json({ success: true, message: 'Practice attempt deleted.' });
  } catch (error: any) {
    const isNotFound = error.message?.includes('not found');
    return NextResponse.json(
      { error: error.message || 'Failed to delete practice attempt' },
      { status: isNotFound ? 404 : 400 },
    );
  }
}
