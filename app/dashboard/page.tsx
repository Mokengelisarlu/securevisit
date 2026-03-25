"use client";

import { useState } from "react";
import { CreateDepartmentForm } from "@/features/tenants/forms/createDepartment.form";
import { CreateHostForm } from "@/features/tenants/forms/createHost.form";
import { CreateVisitorForm } from "@/features/tenants/forms/createVisitor.form";
import { DepartmentsList } from "@/features/tenants/lists/DepartmentsList";
import { HostsList } from "@/features/tenants/lists/HostsList";
import { VisitorsList } from "@/features/tenants/lists/VisitorsList";

type Tab = "departments" | "hosts" | "visitors";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("departments");

  return (
    <div className="space-y-10">
      <div>
        <h1
          className="text-3xl lg:text-4xl font-semibold text-[#0E1116] tracking-tight mb-3"
          style={{ fontFamily: 'Sora, sans-serif' }}
        >
          Tableau de bord
        </h1>
        <p className="text-[#6B7280] text-lg font-medium">
          Gérez vos départements, vos hôtes et vos visiteurs en toute simplicité.
        </p>
      </div>

      {/* Premium Tab Navigation */}
      <div className="flex gap-4 border-b border-[#E5E7EB] pb-px">
        {(["departments", "hosts", "visitors"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 font-semibold text-sm transition-all relative ${activeTab === tab
              ? "text-[#1E6EE6]"
              : "text-[#6B7280] hover:text-[#0E1116]"
              }`}
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            {tab === "departments" && "Départements"}
            {tab === "hosts" && "Hôtes (Employés)"}
            {tab === "visitors" && "Visiteurs"}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1E6EE6] rounded-full animate-in fade-in slide-in-from-bottom-1 duration-300" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-top-2 duration-500">
        {activeTab === "departments" && (
          <div className="space-y-10">
            <div className="card-white p-8">
              <div className="mb-6">
                <h3
                  className="text-xl font-semibold text-[#0E1116] tracking-tight"
                  style={{ fontFamily: 'Sora, sans-serif' }}
                >
                  Ajouter un Département
                </h3>
                <p className="text-[#6B7280] text-sm mt-1">
                  Créez une nouvelle unité organisationnelle pour votre établissement.
                </p>
              </div>
              <CreateDepartmentForm />
            </div>
            <div className="card-white p-8">
              <DepartmentsList />
            </div>
          </div>
        )}

        {activeTab === "hosts" && (
          <div className="space-y-10">
            <div className="card-white p-8">
              <div className="mb-6">
                <h3
                  className="text-xl font-semibold text-[#0E1116] tracking-tight"
                  style={{ fontFamily: 'Sora, sans-serif' }}
                >
                  Ajouter un Employé
                </h3>
                <p className="text-[#6B7280] text-sm mt-1">
                  Enregistrez un nouvel hôte/employé dans votre système.
                </p>
              </div>
              <CreateHostForm />
            </div>
            <div className="card-white p-8">
              <HostsList />
            </div>
          </div>
        )}

        {activeTab === "visitors" && (
          <div className="space-y-10">
            <div className="card-white p-8">
              <div className="mb-6">
                <h3
                  className="text-xl font-semibold text-[#0E1116] tracking-tight"
                  style={{ fontFamily: 'Sora, sans-serif' }}
                >
                  Enregistrer un Visiteur
                </h3>
                <p className="text-[#6B7280] text-sm mt-1">
                  Ajoutez manuellement un nouveau visiteur à votre registre.
                </p>
              </div>
              <CreateVisitorForm />
            </div>
            <div className="card-white p-8">
              <VisitorsList />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
