"use client";

import React from "react";

import { deleteAppointment } from "@/actions/deleteAppointment";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Loader from "@/components/ui/loader";
import { AlertCircle, AlertTriangle, CheckCircle, Clock, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Appointment {
  _id: string;
  customerName: string;
  appointmentDate: string;
  status: string;
  serviceId: { name: string; duration: number };
  staffId?: { name: string; _id: string };
}

interface Staff {
  _id: string;
  name: string;
  serviceType: string;
  dailyCapacity: number;
}

interface Service {
  _id: string;
  name: string;
  duration: number;
  requiredStaffType: string;
}

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [filterStaffId, setFilterStaffId] = useState("");
  const [formData, setFormData] = useState({
    customerName: "",
    serviceId: "",
    staffId: "",
    appointmentDate: "",
    appointmentTime: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appointmentsRes, staffRes, servicesRes] = await Promise.all([
        fetch("/api/appointments"),
        fetch("/api/staff"),
        fetch("/api/services"),
      ]);

      if (!appointmentsRes.ok && appointmentsRes.status === 401) {
        router.push("/login");
        return;
      }

      const appointmentsData = appointmentsRes.ok ? await appointmentsRes.json() : [];
      const staffData = staffRes.ok ? await staffRes.json() : [];
      const servicesData = servicesRes.ok ? await servicesRes.json() : [];

      setAppointments(appointmentsData);
      setStaff(staffData);
      setServices(servicesData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const appointmentDateTime = new Date(
        `${formData.appointmentDate}T${formData.appointmentTime}`,
      );

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.customerName,
          serviceId: formData.serviceId,
          staffId: formData.staffId || undefined,
          appointmentDate: appointmentDateTime.toISOString(),
        }),
      });

      if (res.ok) {
        setFormData({
          customerName: "",
          serviceId: "",
          staffId: "",
          appointmentDate: "",
          appointmentTime: "",
        });
        setShowForm(false);
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error);
      }
    } catch (error) {
      console.error("Failed to create appointment:", error);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.add(appointmentId);
      return next;
    });

    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        console.log("[v0] Appointment cancelled successfully");
        await fetchData();
      } else {
        const error = await res.json();
        alert(`Failed to cancel appointment: ${error.error}`);
        console.error("[v0] Delete error:", error);
      }
    } catch (error) {
      console.error("[v0] Failed to delete appointment:", error);
      alert("Failed to cancel appointment. Please try again.");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(appointmentId);
        return next;
      });
    }
  };

  const handleDeleteCompletedAppointment = async (appointmentId: string) => {
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.add(appointmentId);
      return next;
    });

    try {
      const result = await deleteAppointment(appointmentId);

      if (result.success) {
        console.log("[v0] Appointment deleted successfully");
        await fetchData();
      } else {
        alert(`Failed to delete appointment: ${result.error}`);
        console.error("[v0] Delete error:", result.error);
      }
    } catch (error) {
      console.error("[v0] Failed to delete appointment:", error);
      alert("Failed to delete appointment. Please try again.");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(appointmentId);
        return next;
      });
    }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.add(appointmentId);
      return next;
    });

    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });

      if (res.ok) {
        console.log("[v0] Appointment completed successfully");
        await fetchData();
      } else {
        const error = await res.json();
        alert(`Failed to complete appointment: ${error.error}`);
        console.error("[v0] Patch error:", error);
      }
    } catch (error) {
      console.error("[v0] Failed to update appointment:", error);
      alert("Failed to complete appointment. Please try again.");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(appointmentId);
        return next;
      });
    }
  };

  const handleAssignFromQueue = async () => {
    setAssigning(true);
    try {
      const res = await fetch("/api/queue/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        console.log("[v0] Queue assignment successful");
        await fetchData();
      } else {
        const error = await res.json();
        alert(error.message || "No appointments in queue to assign");
      }
    } catch (error) {
      console.error("[v0] Failed to assign from queue:", error);
    } finally {
      setAssigning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case "waiting":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Clock className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "waiting":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getQueuePosition = (appointmentId: string, appointmentDate: string): number => {
    const waitingAppointments = appointments
      .filter((apt) => apt.status === "waiting")
      .sort(
        (a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime(),
      );

    const position = waitingAppointments.findIndex((apt) => apt._id === appointmentId);
    return position + 1;
  };

  const getOrdinalNumber = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return `${num}st`;
    if (j === 2 && k !== 12) return `${num}nd`;
    if (j === 3 && k !== 13) return `${num}rd`;
    return `${num}th`;
  };

  const waitingAppointments = appointments.filter((apt) => apt.status === "waiting");
  const hasWaitingQueue = waitingAppointments.length > 0;

  // Filter appointments based on date and staff
  const filteredAppointments = appointments.filter((apt) => {
    // Filter by date
    if (filterDate) {
      const appointmentDate = new Date(apt.appointmentDate).toISOString().split("T")[0];
      if (appointmentDate !== filterDate) {
        return false;
      }
    }

    // Filter by staff
    if (filterStaffId) {
      if (filterStaffId === "unassigned") {
        if (apt.staffId) {
          return false;
        }
      } else {
        if (!apt.staffId || apt.staffId._id !== filterStaffId) {
          return false;
        }
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-primary">Appointments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, manage, and track customer appointments
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Manage Appointments</h2>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Appointment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Customer Name</label>
                    <Input
                      placeholder="Customer name"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Service</label>
                    <select
                      value={formData.serviceId}
                      onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      required
                    >
                      <option value="">Select a service</option>
                      {services.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.duration} min)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Staff (Optional)</label>
                    <select
                      value={formData.staffId}
                      onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="">Let system assign staff</option>
                      {staff.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.serviceType})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <Input
                      type="date"
                      value={formData.appointmentDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          appointmentDate: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Time</label>
                  <Input
                    type="time"
                    value={formData.appointmentTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        appointmentTime: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit">Create Appointment</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {hasWaitingQueue && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
            <CardHeader>
              <CardTitle className="text-lg text-yellow-800 dark:text-yellow-100">
                Waiting Queue ({waitingAppointments.length})
              </CardTitle>
              <CardDescription className="text-yellow-700 dark:text-yellow-200">
                Customers waiting for staff assignment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                {waitingAppointments
                  .sort(
                    (a, b) =>
                      new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime(),
                  )
                  .map((apt, idx) => (
                    <div
                      key={apt._id}
                      className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 rounded border border-yellow-200 dark:border-yellow-900"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {getOrdinalNumber(idx + 1)} - {apt.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {apt.serviceId?.name} • {new Date(apt.appointmentDate).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
              <Button
                onClick={handleAssignFromQueue}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                disabled={assigning}
              >
                {assigning ? (
                  <>
                    <Loader size="sm" className="mr-2" ariaLabel="Assigning" />
                    Assigning...
                  </>
                ) : (
                  "Assign Next From Queue"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && appointments.length > 0 && (
          <Card className="mb-6 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Filter Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filter by Date</label>
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filter by Staff</label>
                  <select
                    value={filterStaffId}
                    onChange={(e) => setFilterStaffId(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="">All Staff</option>
                    <option value="unassigned">Unassigned</option>
                    {staff.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {(filterDate || filterStaffId) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterDate("");
                    setFilterStaffId("");
                  }}
                  className="mt-4 w-full bg-transparent"
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading Appointments...</p>
            </div>
          </div>
        ) : appointments.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  No appointments yet. Create one to get started.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : filteredAppointments.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No appointments match the selected filters.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div>
            <div className="mb-4 text-sm text-muted-foreground">
              Showing {filteredAppointments.length} of {appointments.length} appointments
            </div>
            <div className="space-y-4">
              {filteredAppointments.map((apt) => (
                <Card
                  key={apt._id}
                  className={`hover:shadow-md transition-shadow ${
                    apt.status === "waiting" ? "border-yellow-300" : ""
                  }`}
                >
                  <CardContent>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{apt.customerName}</h3>
                        <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Service</p>
                            <p className="font-medium">
                              {apt.serviceId?.name} ({apt.serviceId?.duration} min)
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Staff</p>
                            <p className="font-medium">
                              {apt.staffId?.name || "Waiting assignment"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Date & Time</p>
                            <p className="font-medium">
                              {new Date(apt.appointmentDate).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Status</p>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(apt.status)}
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                                  apt.status,
                                )}`}
                              >
                                {apt.status === "waiting"
                                  ? `Waiting - ${getOrdinalNumber(getQueuePosition(apt._id, apt.appointmentDate))}`
                                  : apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {(apt.status === "scheduled" || apt.status === "waiting") && (
                          <Button
                            size="sm"
                            onClick={() => handleCompleteAppointment(apt._id)}
                            className="gap-2"
                            disabled={processingIds.has(apt._id)}
                          >
                            <CheckCircle className="w-4 h-4" />

                            {apt.status === "scheduled" ? "Complete" : "Assign & Complete"}
                          </Button>
                        )}
                        {apt.status === "completed" && (
                          <>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="gap-2"
                                  disabled={processingIds.has(apt._id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your
                                    account from our servers.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteCompletedAppointment(apt._id)}
                                  >
                                    Continue
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                        {apt.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteAppointment(apt._id)}
                            className="gap-2"
                            disabled={processingIds.has(apt._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
