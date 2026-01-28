"use server";

import Appointment from "@/lib/models/Appointment";
import { connectToDatabase } from "@/lib/mongodb";
import { cookies } from "next/headers";

export async function deleteAppointment(appointmentId: string) {
  try {
    await connectToDatabase();
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return { error: "Unauthorized" };
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      userId,
    });

    if (!appointment) {
      return { error: "Appointment not found" };
    }

    await Appointment.deleteOne({ _id: appointmentId });

    return { success: true, message: "Appointment deleted successfully" };
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return { error: "Failed to delete appointment" };
  }
}
