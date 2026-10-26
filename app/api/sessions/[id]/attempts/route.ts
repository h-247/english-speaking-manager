import { NextResponse } from 'next/server';
import { getAuthenticatedUserOrLocal } from '@/lib/chatgpt-auth';
import { SessionService } from '@/lib/session-service';
import { createAttemptSchema } from '@/lib/validation';

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
    const attempts = await SessionService.listAttempts(user.userId, id);

    return NextResponse.json(attempts);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

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

    const parseResult = createAttemptSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((e: any) => e.message).join(' ');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const attempt = await SessionService.addAttempt(user.userId, id, parseResult.data);
    return NextResponse.json(attempt, { status: 201 });
  } catch (error: any) {
    const isNotFound = error.message?.includes('not found');
    return NextResponse.json(
      { error: error.message || 'Failed to add practice attempt' },
      { status: isNotFound ? 404 : 400 },
    );
  }
}
