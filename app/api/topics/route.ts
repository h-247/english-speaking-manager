import { NextResponse } from 'next/server';
import { getAuthenticatedUserOrLocal } from '@/lib/chatgpt-auth';
import { TopicService } from '@/lib/topic-service';
import { createTopicSchema } from '@/lib/validation';

export async function GET() {
  try {
    const user = await getAuthenticatedUserOrLocal();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const topics = await TopicService.listTopics(user.userId);
    return NextResponse.json({ topics });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to list topics.' },
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
    const parseResult = createTopicSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((e) => e.message).join(' ');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const created = await TopicService.createTopic(user.userId, parseResult.data);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    const isConflict = error.message?.includes('already exists');
    return NextResponse.json(
      { error: error.message || 'Failed to create topic.' },
      { status: isConflict ? 409 : 400 },
    );
  }
}
