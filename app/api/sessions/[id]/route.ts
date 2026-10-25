import { NextResponse } from 'next/server';
import { getAuthenticatedUserOrLocal } from '@/lib/chatgpt-auth';
import { SessionService } from '@/lib/session-service';
import { updateSessionSchema } from '@/lib/validation';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const user = await getAuthenticatedUserOrLocal();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const session = await SessionService.getSessionById(user.userId, id);

    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PATCH(
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

    const parseResult = updateSessionSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((e: any) => e.message).join(' ');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const updated = await SessionService.updateSession(user.userId, id, parseResult.data);
    return NextResponse.json(updated);
  } catch (error: any) {
    const isConflict = error.message?.includes('already exists');
    const isNotFound = error.message?.includes('not found');
    const status = isNotFound ? 404 : isConflict ? 409 : 400;
    return NextResponse.json(
      { error: error.message || 'Failed to update session' },
      { status },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const user = await getAuthenticatedUserOrLocal();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    await SessionService.deleteSession(user.userId, id);

    return NextResponse.json({ success: true, message: 'Session deleted successfully.' });
  } catch (error: any) {
    const isNotFound = error.message?.includes('not found');
    return NextResponse.json(
      { error: error.message || 'Failed to delete session' },
      { status: isNotFound ? 404 : 400 },
    );
  }
}
