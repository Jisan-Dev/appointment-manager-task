import ActivityLog from "@/lib/models/ActivityLog";
import Appointment from "@/lib/models/Appointment";
import Staff from "@/lib/models/Staff";
import { connectToDatabase } from "@/lib/mongodb";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let { staffId } = await request.json().catch(() => ({}));

    // Get earliest waiting appointment
    const earliestWaiting = await Appointment.findOne({
      userId,
      status: "waiting",
    })
      .populate("serviceId")
      .sort({ appointmentDate: 1 });

    if (!earliestWaiting) {
      return NextResponse.json({ message: "No appointments in queue" }, { status: 200 });
    }

    // If no specific staff provided, find available staff for this service
    if (!staffId) {
      const allStaff = await Staff.find({ userId });
      const appointmentDate = new Date(earliestWaiting.appointmentDate);
      const startOfDay = new Date(appointmentDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(appointmentDate);
      endOfDay.setHours(23, 59, 59, 999);

      for (const s of allStaff) {
        if (s.serviceType === (earliestWaiting.serviceId as any)?.requiredStaffType) {
          const dayAppointments = await Appointment.countDocuments({
            staffId: s._id,
            appointmentDate: { $gte: startOfDay, $lte: endOfDay },
            status: "scheduled",
          });

          if (dayAppointments < s.dailyCapacity) {
            staffId = s._id;
            break;
          }
        }
      }
    }

    if (!staffId) {
      return NextResponse.json({ message: "No available staff for this service" }, { status: 400 });
    }

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return NextResponse.json({ message: "Staff not found" }, { status: 200 });
    }

    // Check staff capacity one more time
    const appointmentDate = new Date(earliestWaiting.appointmentDate);
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const dayAppointments = await Appointment.countDocuments({
      staffId: staffId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: "scheduled",
    });

    if (dayAppointments >= staff.dailyCapacity) {
      return NextResponse.json({ message: "Staff has reached daily capacity" }, { status: 200 });
    }

    // Assign appointment
    earliestWaiting.staffId = staffId;
    earliestWaiting.status = "scheduled";
    await earliestWaiting.save();

    // Log activity
    await ActivityLog.create({
      userId,
      appointmentId: earliestWaiting._id,
      action: "assigned_from_queue",
      description: `Appointment for "${earliestWaiting.customerName}" assigned from queue to ${staff.name}`,
    });

    return NextResponse.json({
      success: true,
      appointment: earliestWaiting,
      message: `Assigned ${earliestWaiting.customerName} to ${staff.name}`,
    });
  } catch (error) {
    console.error("[v0] Queue assignment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
