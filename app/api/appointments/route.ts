import ActivityLog from "@/lib/models/ActivityLog";
import Appointment from "@/lib/models/Appointment";
import Service from "@/lib/models/Service";
import Staff from "@/lib/models/Staff";
import { connectToDatabase } from "@/lib/mongodb";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Helper function to check conflicts
async function checkConflict(
  staffId: string,
  appointmentDate: Date,
  duration: number,
  excludeId?: string,
) {
  // const service = await Service.findById("").select("duration");
  const startTime = new Date(appointmentDate);
  const endTime = new Date(startTime.getTime() + duration * 60000);

  const query: any = {
    staffId,
    status: { $in: ["scheduled", "waiting"] },
    appointmentDate: {
      $lt: endTime,
      $gte: new Date(startTime.getTime() - 60 * 60 * 1000), // Check 1 hour before
    },
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return await Appointment.findOne(query);
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { customerName, serviceId, staffId, appointmentDate } = await request.json();

    if (!customerName || !serviceId || !appointmentDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log("staffId:", staffId);

    // Get service details
    const service = await Service.findById(serviceId);
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const appointmentDateTime = new Date(appointmentDate);
    let finalStatus = "waiting";
    let finalStaffId = staffId || null;

    // If staff is assigned, check for conflicts and capacity
    if (staffId) {
      const staff = await Staff.findById(staffId);
      if (!staff) {
        return NextResponse.json({ error: "Staff not found" }, { status: 404 });
      }

      // Check for conflicts
      const conflict = await checkConflict(staffId, appointmentDateTime, service.duration);
      if (conflict) {
        return NextResponse.json(
          { error: "This staff member already has an appointment at this time" },
          { status: 409 },
        );
      }

      // Check capacity
      const startOfDay = new Date(appointmentDateTime);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(appointmentDateTime);
      endOfDay.setHours(23, 59, 59, 999);

      const dayAppointments = await Appointment.countDocuments({
        staffId,
        appointmentDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ["scheduled", "waiting"] },
      });

      if (dayAppointments >= staff.dailyCapacity) {
        finalStatus = "waiting";
        finalStaffId = null;
      } else {
        finalStatus = "scheduled";
      }
    }

    // Create appointment
    const appointment = new Appointment({
      userId,
      customerName,
      serviceId,
      staffId: finalStaffId,
      appointmentDate: appointmentDateTime,
      status: finalStatus,
    });

    await appointment.save();

    // Log activity
    await ActivityLog.create({
      userId,
      appointmentId: appointment._id,
      action: finalStatus === "waiting" ? "queued" : "scheduled",
      description: `Appointment for "${customerName}" ${finalStatus === "waiting" ? "added to queue" : "scheduled"}`,
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Appointment creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const date = searchParams.get("date");

    let query: any = { userId };

    if (staffId) {
      query.staffId = staffId;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const appointments = await Appointment.find(query)
      .populate("serviceId")
      .populate("staffId")
      .sort({ appointmentDate: 1 });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Appointment fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
