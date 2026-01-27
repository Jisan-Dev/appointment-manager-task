import { connectToDatabase } from '@/lib/mongodb';
import Service from '@/lib/models/Service';
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

    const { name, duration, requiredStaffType } = await request.json();

    if (!name || !duration || !requiredStaffType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const service = new Service({
      userId,
      name,
      duration,
      requiredStaffType,
    });

    await service.save();
    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Service creation error:', error);
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

    const services = await Service.find({ userId });
    return NextResponse.json(services);
  } catch (error) {
    console.error('Service fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
