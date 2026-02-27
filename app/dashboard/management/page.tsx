"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateDepartmentForm } from "@/features/tenants/forms/createDepartment.form";
import { CreateHostForm } from "@/features/tenants/forms/createHost.form";
import { CreateVisitorForm } from "@/features/tenants/forms/createVisitor.form";
import { DepartmentsList } from "@/features/tenants/lists/DepartmentsList";
import { HostsList } from "@/features/tenants/lists/HostsList";
import { VisitorsList } from "@/features/tenants/lists/VisitorsList";

type Tab = "departments" | "hosts" | "visitors";

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>("departments");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Management</h1>
        <p className="text-gray-600 mt-2">Manage departments, hosts, and visitors</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("departments")}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === "departments"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Departments
        </button>
        <button
          onClick={() => setActiveTab("hosts")}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === "hosts"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Hosts (Employees)
        </button>
        <button
          onClick={() => setActiveTab("visitors")}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === "visitors"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Visitors
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "departments" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Department</CardTitle>
              <CardDescription>Create a new department for your organization</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateDepartmentForm />
            </CardContent>
          </Card>
          <DepartmentsList />
        </div>
      )}

      {activeTab === "hosts" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Employee</CardTitle>
              <CardDescription>Register a new host/employee</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateHostForm />
            </CardContent>
          </Card>
          <HostsList />
        </div>
      )}

      {activeTab === "visitors" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Register Visitor</CardTitle>
              <CardDescription>Add a new visitor to your system</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateVisitorForm />
            </CardContent>
          </Card>
          <VisitorsList />
        </div>
      )}
    </div>
  );
}
