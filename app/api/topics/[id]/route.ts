import { NextResponse } from 'next/server';
import { getAuthenticatedUserOrLocal } from '@/lib/chatgpt-auth';
import { TopicService } from '@/lib/topic-service';
import { updateTopicSchema } from '@/lib/validation';

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

    const parseResult = updateTopicSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((e) => e.message).join(' ');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const updated = await TopicService.updateTopic(user.userId, id, parseResult.data);
    return NextResponse.json(updated);
  } catch (error: any) {
    const isConflict = error.message?.includes('already exists');
    const isNotFound = error.message?.includes('not found');
    const status = isNotFound ? 404 : isConflict ? 409 : 400;
    return NextResponse.json(
      { error: error.message || 'Failed to update topic.' },
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
    await TopicService.deleteTopic(user.userId, id);
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    const isNotFound = error.message?.includes('not found');
    return NextResponse.json(
      { error: error.message || 'Failed to delete topic.' },
      { status: isNotFound ? 404 : 400 },
    );
  }
}
