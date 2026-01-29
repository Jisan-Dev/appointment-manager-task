"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Calendar, Clock, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface Appointment {
  _id: string;
  status: "completed" | "scheduled" | "waiting";
  staffId: { _id: string } | string;
}

interface StaffMember {
  _id: string;
  name: string;
  dailyCapacity: number;
}

interface DashboardData {
  totalAppointmentsToday: number;
  completedAppointments: number;
  pendingAppointments: number;
  waitingQueueCount: number;
  staffLoad: Array<{
    staffId: string;
    name: string;
    capacity: number;
    scheduled: number;
  }>;
}

interface ActivityLogEntry {
  _id: string;
  action: string;
  description: string;
  timestamp: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = () => {
    router.push("/login");
  };

  // Fetch dashboard data with parallel requests
  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const today = new Date().toISOString();
      console.log(today);
      // Fetch appointments and staff in parallel
      const [appointmentsRes, staffRes] = await Promise.all([
        fetch(`/api/appointments?date=${today}`),
        fetch("/api/staff"),
      ]);

      // Handle authentication errors
      if (appointmentsRes.status === 401 || staffRes.status === 401) {
        router.push("/login");
        return;
      }

      // Check response status for both requests
      if (!appointmentsRes.ok || !staffRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const [appointments, staff] = await Promise.all([
        appointmentsRes.json() as Promise<Appointment[]>,
        staffRes.json() as Promise<StaffMember[]>,
      ]);

      // Calculate dashboard metrics
      const total = appointments.length;
      const completed = appointments.filter((a) => a.status === "completed").length;
      const pending = appointments.filter((a) => a.status === "scheduled").length;
      const waiting = appointments.filter((a) => a.status === "waiting").length;

      // Calculate staff load
      const staffLoad = staff.map((s) => {
        const scheduled = appointments.filter(
          (a) =>
            (typeof a.staffId === "string" ? a.staffId : a.staffId._id) === s._id &&
            a.status === "scheduled",
        ).length;
        return {
          staffId: s._id,
          name: s.name,
          capacity: s.dailyCapacity,
          scheduled,
        };
      });

      setData({
        totalAppointmentsToday: total,
        completedAppointments: completed,
        pendingAppointments: pending,
        waitingQueueCount: waiting,
        staffLoad,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch dashboard data";
      setError(message);
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Fetch activity logs with proper error handling
  const fetchActivityLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/activity-logs?limit=5");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.ok) {
        const logs = (await res.json()) as ActivityLogEntry[];
        setActivityLogs(logs);
      }
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
    }
  }, [router]);

  // Setup initial load and polling
  useEffect(() => {
    fetchDashboardData();
    fetchActivityLogs();

    // Set up polling for activity logs
    // intervalRef.current = setInterval(() => {
    //   fetchActivityLogs();
    // }, 5000);

    // // Cleanup interval on unmount
    // return () => {
    //   if (intervalRef.current) {
    //     clearInterval(intervalRef.current);
    //   }
    // };
  }, [fetchDashboardData, fetchActivityLogs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back. Here&#39;s your appointment overview.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium ">
                    Today&#39;s Appointments
                  </p>
                  <p className="text-3xl font-bold mt-2">{data?.totalAppointmentsToday || 0}</p>
                </div>
                <Calendar className="w-8 h-8 text-primary opacity-85" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium ">Pending</p>
                  <p className="text-3xl font-bold mt-2">{data?.pendingAppointments || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-primary opacity-85" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium ">Completed</p>
                  <p className="text-3xl font-bold mt-2">{data?.completedAppointments || 0}</p>
                </div>
                <Zap className="w-8 h-8 text-green-600 opacity-85" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium ">In Queue</p>
                  <p className="text-3xl font-bold mt-2">{data?.waitingQueueCount || 0}</p>
                </div>
                <Users className="w-8 h-8 text-destructive opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staff Load and Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Staff Load Summary</CardTitle>
                <CardDescription>Appointments scheduled per staff member today</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.staffLoad && data.staffLoad.length > 0 ? (
                  <div className="space-y-4">
                    {data.staffLoad.map((staff) => (
                      <div key={staff.staffId}>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium capitalize">{staff.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {staff.scheduled} / {staff.capacity}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              staff.scheduled >= staff.capacity
                                ? "bg-destructive"
                                : staff.scheduled >= staff.capacity * 0.75
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min((staff.scheduled / staff.capacity) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                        {staff.scheduled >= staff.capacity && (
                          <p className="text-xs text-destructive mt-1">Fully booked</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No staff members added yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/dashboard/appointments">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Calendar className="w-4 h-4 mr-2" />
                    Manage Appointments
                  </Button>
                </Link>
                <Link href="/dashboard/staff">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Users className="w-4 h-4 mr-2" />
                    Manage Staff
                  </Button>
                </Link>
                <Link href="/dashboard/services">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Zap className="w-4 h-4 mr-2" />
                    Manage Services
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <Link href="/dashboard/activity">
                    <ArrowRight className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {activityLogs && activityLogs.length > 0 ? (
                  <div className="space-y-3">
                    {activityLogs.map((log) => (
                      <div key={log._id} className="text-sm border-l-2 border-accent pl-3 py-1">
                        <p className="font-medium text-foreground">
                          {log.action.replace("_", " ").toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{log.description}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activity
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
