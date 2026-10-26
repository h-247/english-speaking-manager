import { NextResponse } from 'next/server';
import { getAuthenticatedUserOrLocal } from '@/lib/chatgpt-auth';
import { SessionService } from '@/lib/session-service';
import { updateAttemptSchema } from '@/lib/validation';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; attemptId: string }> | { id: string; attemptId: string } },
) {
  try {
    const user = await getAuthenticatedUserOrLocal();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, attemptId } = await context.params;
    const body = await request.json();
    const validated = updateAttemptSchema.parse(body);

    const updated = await SessionService.updateAttempt(user.userId, id, attemptId, validated);
    return NextResponse.json({ success: true, attempt: updated });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', issues: error.issues },
        { status: 400 },
      );
    }
    const isNotFound = error.message?.includes('not found');
    return NextResponse.json(
      { error: error.message || 'Failed to update practice attempt' },
      { status: isNotFound ? 404 : 400 },
    );
  }
}

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
