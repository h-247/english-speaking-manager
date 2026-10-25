import { NextResponse } from 'next/server';
import { getAuthenticatedUserOrLocal } from '@/lib/chatgpt-auth';
import { SessionService } from '@/lib/session-service';

export async function GET() {
  try {
    const user = await getAuthenticatedUserOrLocal();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await SessionService.getDashboardStats(user.userId);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Failed to get dashboard stats:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
