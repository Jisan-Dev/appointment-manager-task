"use client";

import { AlertCircle } from "lucide-react"; // Added import for AlertCircle

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ActivityLog {
  _id: string;
  action: string;
  description: string;
  timestamp: string;
  appointmentId: { customerName: string };
}

export default function ActivityPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    // Logout logic here
    router.push("/login");
  };

  console.log("logs", logs);

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  const fetchActivityLogs = async () => {
    try {
      const res = await fetch("/api/activity-logs?limit=50");
      if (!res.ok) {
        if (res.status === 401) router.push("/login");
        return;
      }
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "auto_assigned":
        return "text-green-600 dark:text-green-400";
      case "scheduled":
        return "text-blue-600 dark:text-blue-400";
      case "queued":
        return "text-yellow-600 dark:text-yellow-400";
      case "completed":
        return "text-purple-600 dark:text-purple-400";
      case "cancelled":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Activity Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track all appointment actions and status changes
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>All Activity</CardTitle>
            <CardDescription>
              Complete history of all appointment actions and status changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading activity logs...</p>
                </div>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground text-sm">
                  No activity logs yet. Activities will appear here as you create and manage
                  appointments.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log._id}
                    className="flex items-start gap-4 pb-4 border-b border-border last:border-b-0 hover:bg-muted/30 px-3 py-2 rounded transition-colors"
                  >
                    <Clock className={`w-5 h-5 mt-1 flex-shrink-0 ${getActionColor(log.action)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm">
                          {log.appointmentId?.customerName ||
                            log.description.match(/"([^"]+)"/)?.[1] ||
                            "Unknown Customer"}
                        </p>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${getActionColor(log.action)} bg-opacity-10 whitespace-nowrap`}
                        >
                          {log.action.replace(/_/g, " ").toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{log.description}</p>
                      <p className="text-xs text-muted-foreground/60 mt-2">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
