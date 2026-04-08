"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateDepartmentForm } from "@/features/tenants/forms/createDepartment.form";
import { CreateHostForm } from "@/features/tenants/forms/createHost.form";
import { CreateVisitorForm } from "@/features/tenants/forms/createVisitor.form";
import { DepartmentsList } from "@/features/tenants/lists/DepartmentsList";
import { HostsList } from "@/features/tenants/lists/HostsList";
import { VisitorsList } from "@/features/tenants/lists/VisitorsList";
import { UsersList } from "@/features/tenants/lists/UsersList";

type Tab = "departments" | "hosts" | "visitors" | "users";

export default function TenantManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>("departments");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tenant Management</h1>
        <p className="text-gray-600 mt-2">Manage departments, hosts, and visitors</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("departments")}
          className={`px-4 py-2 font-medium border-b-2 transition ${activeTab === "departments"
            ? "border-teal-500 text-teal-600"
            : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
        >
          Departments
        </button>
        <button
          onClick={() => setActiveTab("hosts")}
          className={`px-4 py-2 font-medium border-b-2 transition ${activeTab === "hosts"
            ? "border-teal-500 text-teal-600"
            : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
        >
          Hosts (Employees)
        </button>
        <button
          onClick={() => setActiveTab("visitors")}
          className={`px-4 py-2 font-medium border-b-2 transition ${activeTab === "visitors"
            ? "border-teal-500 text-teal-600"
            : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
        >
          Visitors
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 font-medium border-b-2 transition ${activeTab === "users"
            ? "border-teal-500 text-teal-600"
            : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
        >
          Users
        </button>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Departments Tab */}
        {activeTab === "departments" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Create Department</CardTitle>
                <CardDescription>Add a new department to your tenant</CardDescription>
              </CardHeader>
              <CardContent>
                <CreateDepartmentForm />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Departments</CardTitle>
                <CardDescription>All departments in your tenant</CardDescription>
              </CardHeader>
              <CardContent>
                <DepartmentsList />
              </CardContent>
            </Card>
          </>
        )}

        {/* Hosts Tab */}
        {activeTab === "hosts" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Create Host (Employee)</CardTitle>
                <CardDescription>Add a new internal employee or host</CardDescription>
              </CardHeader>
              <CardContent>
                <CreateHostForm />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hosts</CardTitle>
                <CardDescription>All hosts/employees in your tenant</CardDescription>
              </CardHeader>
              <CardContent>
                <HostsList />
              </CardContent>
            </Card>
          </>
        )}

        {/* Visitors Tab */}
        {activeTab === "visitors" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Create Visitor</CardTitle>
                <CardDescription>Add a new visitor to your tenant</CardDescription>
              </CardHeader>
              <CardContent>
                <CreateVisitorForm />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Visitors</CardTitle>
                <CardDescription>All visitors in your tenant</CardDescription>
              </CardHeader>
              <CardContent>
                <VisitorsList />
              </CardContent>
            </Card>
          </>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Tenant Users</CardTitle>
                <CardDescription>All users synchronized in this workspace</CardDescription>
              </CardHeader>
              <CardContent>
                <UsersList />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
