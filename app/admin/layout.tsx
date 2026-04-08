"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  ArrowLeft,
  Menu,
} from "lucide-react";
import { Loader } from "lucide-react";
import Image from "next/image";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { userId, isLoaded } = useAuth();

  useEffect(() => {
    const verifyAdmin = async () => {
      if (!isLoaded) return;

      if (!userId) {
        router.push("/");
        return;
      }

      try {
        const response = await fetch("/api/admin/verify");
        if (!response.ok) {
          throw new Error("Not authorized");
        }
        setIsAuthorized(true);
      } catch (error) {
        console.error("Admin verification failed:", error);
        router.push("/");
      } finally {
        setIsChecking(false);
      }
    };

    verifyAdmin();
  }, [isLoaded, userId, router]);

  if (!isLoaded || isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin" size={32} />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${collapsed ? "w-16" : "w-64"
          } bg-white border-r transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 relative overflow-hidden rounded-md">
                <Image
                  src="/icons/icon-512x512.png"
                  alt="SecureVisit Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-lg font-semibold">Admin</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded hover:bg-gray-100"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          <SidebarLink
            href="/admin"
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            collapsed={collapsed}
            isActive={pathname === "/admin"}
          />
          <SidebarLink
            href="/admin/tenants"
            icon={<Building2 size={18} />}
            label="Tenants"
            collapsed={collapsed}
            isActive={pathname === "/admin/tenants"}
          />
          <SidebarLink
            href="/admin/users"
            icon={<Users size={18} />}
            label="Users"
            collapsed={collapsed}
            isActive={pathname === "/admin/users"}
          />
          <SidebarLink
            href="/admin/settings"
            icon={<Settings size={18} />}
            label="Settings"
            collapsed={collapsed}
            isActive={pathname === "/admin/settings"}
          />
        </nav>

        {/* Back to main site */}
        <div className="p-2 border-t">
          <a href="http://localhost:3000">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
              <ArrowLeft size={18} />
              {!collapsed && <span>Back</span>}
            </button>
          </a>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <h1 className="text-lg font-medium">Admin Dashboard</h1>
          <div>Admin User</div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

function SidebarLink({
  href,
  icon,
  label,
  collapsed,
  isActive,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${isActive
        ? "bg-blue-100 text-blue-700"
        : "text-gray-700 hover:bg-gray-100"
        }`}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}
