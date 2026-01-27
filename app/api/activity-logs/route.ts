import { connectToDatabase } from '@/lib/mongodb';
import ActivityLog from '@/lib/models/ActivityLog';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const logs = await ActivityLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('appointmentId');

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Activity log fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
