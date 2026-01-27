import { connectToDatabase } from '@/lib/mongodb';
import Staff from '@/lib/models/Staff';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, serviceType, dailyCapacity, availability } = await request.json();

    if (!name || !serviceType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const staff = new Staff({
      userId,
      name,
      serviceType,
      dailyCapacity: dailyCapacity || 5,
      availability: availability || 'available',
    });

    await staff.save();
    return NextResponse.json(staff, { status: 201 });
  } catch (error) {
    console.error('Staff creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const staff = await Staff.find({ userId });
    return NextResponse.json(staff);
  } catch (error) {
    console.error('Staff fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
