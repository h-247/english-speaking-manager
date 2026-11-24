import { NextResponse } from 'next/server';
import { getAuthenticatedUserOrLocal } from '@/lib/chatgpt-auth';
import { SessionService } from '@/lib/session-service';
import { validateChatGPTUrl } from '@/lib/chatgpt-url';

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const user = await getAuthenticatedUserOrLocal();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    let urlToDelete = '';

    const body = (await request.json().catch(() => null)) as { url?: string } | null;
    if (body?.url) {
      urlToDelete = body.url;
    } else {
      const { searchParams } = new URL(request.url);
      urlToDelete = searchParams.get('url') || '';
    }

    if (!urlToDelete) {
      return NextResponse.json(
        { error: 'ChatGPT link URL is required to delete.' },
        { status: 400 },
      );
    }

    const updated = await SessionService.deleteTopicLink(user.userId, id, urlToDelete);
    return NextResponse.json(updated);
  } catch (error: any) {
    const isNotFound = error.message?.includes('not found');
    return NextResponse.json(
      { error: error.message || 'Failed to delete link' },
      { status: isNotFound ? 404 : 400 },
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
    const body = (await request.json().catch(() => ({}))) as { url?: string };
    const url = body?.url?.trim() || '';

    const validation = validateChatGPTUrl(url);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid ChatGPT link' },
        { status: 400 },
      );
    }

    const session = await SessionService.getSessionById(user.userId, id);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const existingBranches = session.branchUrls || [];
    if (
      !existingBranches.some((b: any) => (typeof b === 'string' ? b : b.url) === url) &&
      session.chatgptUrl !== url
    ) {
      const updated = await SessionService.updateSession(user.userId, id, {
        branchUrls: [...existingBranches, url],
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json(session);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to add link' },
      { status: 400 },
    );
  }
}
