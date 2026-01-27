import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';
import Staff from '@/lib/models/Staff';
import Service from '@/lib/models/Service';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await connectToDatabase();

    // Check if demo user already exists
    let demoUser = await User.findOne({ email: 'demo@example.com' });

    if (!demoUser) {
      // Create demo user
      demoUser = new User({
        email: 'demo@example.com',
        password: 'demo123',
        name: 'Demo Manager',
      });
      await demoUser.save();
    }

    const userId = demoUser._id;

    // Check if demo data already exists
    const existingStaff = await Staff.findOne({ userId });
    if (existingStaff) {
      return NextResponse.json(
        { message: 'Demo data already exists' },
        { status: 200 }
      );
    }

    // Create demo staff members
    const staffMembers = [
      { name: 'Dr. Riya Sharma', serviceType: 'Doctor', dailyCapacity: 5 },
      { name: 'Farhan Ahmed', serviceType: 'Doctor', dailyCapacity: 5 },
      { name: 'Sarah Johnson', serviceType: 'Consultant', dailyCapacity: 6 },
      { name: 'Mike Chen', serviceType: 'Support Agent', dailyCapacity: 10 },
    ];

    const createdStaff = await Staff.insertMany(
      staffMembers.map((staff) => ({
        ...staff,
        userId,
        availability: 'available',
      }))
    );

    // Create demo services
    const services = [
      {
        name: 'General Checkup',
        duration: 30,
        requiredStaffType: 'Doctor',
      },
      {
        name: 'Consultation',
        duration: 60,
        requiredStaffType: 'Consultant',
      },
      {
        name: 'Follow-up Appointment',
        duration: 15,
        requiredStaffType: 'Doctor',
      },
      {
        name: 'Technical Support',
        duration: 30,
        requiredStaffType: 'Support Agent',
      },
    ];

    await Service.insertMany(
      services.map((service) => ({
        ...service,
        userId,
      }))
    );

    return NextResponse.json(
      {
        message: 'Demo data created successfully',
        staffCount: createdStaff.length,
        serviceCount: services.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Demo setup error:', error);
    return NextResponse.json(
      { error: 'Failed to set up demo data' },
      { status: 500 }
    );
  }
}
