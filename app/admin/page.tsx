"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Activity, Clock } from "lucide-react";
import { Loader } from "lucide-react";

interface Stats {
  totalTenants: number;
  totalUsers: number;
  activeSessions: number;
  systemStatus: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats");
        if (!response.ok) throw new Error("Failed to fetch stats");
        const data = await response.json();
        setStats(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="animate-spin" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 rounded-lg bg-red-50">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">System overview and statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tenants"
          value={stats?.totalTenants || 0}
          icon={<Building2 className="h-6 w-6 text-blue-600" />}
          description="Active workspace"
        />
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={<Users className="h-6 w-6 text-green-600" />}
          description="Registered users"
        />
        <StatCard
          title="Active Sessions"
          value={stats?.activeSessions || 0}
          icon={<Activity className="h-6 w-6 text-purple-600" />}
          description="Current sessions"
        />
        <StatCard
          title="System Status"
          value={stats?.systemStatus === "healthy" ? "✓ OK" : "⚠ Warning"}
          icon={<Clock className="h-6 w-6 text-yellow-600" />}
          description="System health"
        />
      </div>

      {/* Recent Activity Section */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ActivityItem
              title="New tenant created"
              time="2 hours ago"
              user="System"
            />
            <ActivityItem
              title="User registration"
              time="5 hours ago"
              user="System"
            />
            <ActivityItem
              title="System backup completed"
              time="1 day ago"
              user="System"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
              <h3 className="font-semibold mb-1">View All Tenants</h3>
              <p className="text-sm text-gray-600">Manage all workspaces</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
              <h3 className="font-semibold mb-1">View All Users</h3>
              <p className="text-sm text-gray-600">Manage users and roles</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
              <h3 className="font-semibold mb-1">System Settings</h3>
              <p className="text-sm text-gray-600">Configure system</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-600 text-sm">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            <p className="text-gray-500 text-xs mt-1">{description}</p>
          </div>
          <div>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityItem({
  title,
  time,
  user,
}: {
  title: string;
  time: string;
  user: string;
}) {
  return (
    <div className="flex justify-between items-start pb-4 border-b last:border-b-0">
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-gray-600 text-xs">By {user}</p>
      </div>
      <p className="text-gray-500 text-xs">{time}</p>
    </div>
  );
}
