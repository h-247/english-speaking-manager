import { NextResponse } from 'next/server';
import { getAuthenticatedUserOrLocal } from '@/lib/chatgpt-auth';
import { SessionService } from '@/lib/session-service';
import { createSessionSchema } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUserOrLocal();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const sortBy = (searchParams.get('sortBy') as any) || 'recently_updated';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 100;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0;

    const result = await SessionService.listSessions(user.userId, {
      search,
      status,
      tag,
      sortBy,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to list sessions:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUserOrLocal();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = createSessionSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((e: any) => e.message).join(' ');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const created = await SessionService.createSession(user.userId, parseResult.data);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    const status = error.message?.includes('already exists') ? 409 : 400;
    return NextResponse.json(
      { error: error.message || 'Failed to create session' },
      { status },
    );
  }
}
