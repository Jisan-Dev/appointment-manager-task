import ActivityLog from "@/lib/models/ActivityLog";
import Appointment from "@/lib/models/Appointment";
import { connectToDatabase } from "@/lib/mongodb";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await connectToDatabase();
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status, staffId, appointmentDate } = await request.json();
    console.log(params.id, userId);

    const appointment = await Appointment.findOne({ _id: params.id, userId });
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const oldStatus = appointment.status;

    if (status) {
      appointment.status = status;
    }

    if (staffId !== undefined) {
      appointment.staffId = staffId || null;
    }

    if (appointmentDate) {
      appointment.appointmentDate = new Date(appointmentDate);
    }

    await appointment.save();

    // Log activity
    if (oldStatus !== status) {
      await ActivityLog.create({
        userId,
        appointmentId: appointment._id,
        action: "status_changed",
        description: `Status changed from ${oldStatus} to ${status}`,
      });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Appointment update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await connectToDatabase();
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appointment = await Appointment.findOne({ _id: params.id, userId });
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    await Appointment.deleteOne({ _id: params.id });
    // Log activity
    await ActivityLog.create({
      userId,
      appointmentId: appointment._id,
      action: "cancelled",
      description: `Appointment for "${appointment.customerName}" cancelled`,
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Appointment delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
