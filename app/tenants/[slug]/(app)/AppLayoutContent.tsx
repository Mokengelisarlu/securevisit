"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import {
    LayoutDashboard,
    Users,
    UserCircle,
    ClipboardList,
    Settings,
    Menu,
    Layout,
    Monitor,
    ShieldCheck,
    UserPlus,
    Globe,
    Car,
    Building2
} from "lucide-react";
import { useTenant } from "@/lib/tenant-provider";

export function AppLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useUser();
    const { name: tenantName } = useTenant();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="flex flex-col h-screen overflow-hidden font-sans bg-slate-100 relative">

            {/* Top Header - Modern Glassmorphism */}
            <header className="h-16 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 border-b border-slate-200/50 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <Link href="/dashboard" className="flex items-center gap-2.5 group">
                        <Image
                            src="/icon-48x48.png"
                            alt="SecureVisit"
                            width={36}
                            height={36}
                            className="object-contain group-hover:scale-105 transition-all duration-300"
                        />
                        <span className="text-xl font-black tracking-tight text-[#0f172a]">
                            Secure<span style={{ color: '#3ECFCA' }}>Visit</span>
                        </span>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    {/* Tablet Emulator */}
                    <HeaderAction href="/kiosk" target="_blank" active={false}>
                        <Monitor className="w-4 h-4 mr-2" />
                        Émulateur
                    </HeaderAction>

                    {/* Tenant Name Display */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-1.5 shadow-sm">
                        <Building2 className="w-3.5 h-3.5 text-teal-500" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                            {tenantName || "Chargement..."}
                        </span>
                    </div>

                    <div className="w-px h-6 bg-slate-200 mx-1" />

                    <UserButton
                        appearance={{
                            elements: {
                                userButtonAvatarBox: "w-9 h-9 border-2 border-white hover:border-teal-400 transition-all shadow-md"
                            }
                        }}
                    />
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar - Glassmorphism */}
                <aside
                    className={`bg-white/50 backdrop-blur-sm border-r border-slate-200/50 flex flex-col overflow-y-auto shrink-0 z-10 transition-all duration-500 ease-in-out ${isSidebarCollapsed ? "w-20" : "w-64"
                        }`}
                >
                    <div className="py-6">
                        <SidebarLink
                            href="/dashboard"
                            icon={<LayoutDashboard className="w-5 h-5" />}
                            label="Tableau de bord"
                            active={pathname.endsWith("/dashboard")}
                            collapsed={isSidebarCollapsed}
                        />

                        <SidebarCategory label="Visiteurs" collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/visiteurs/types" icon={<Layout className="w-5 h-5" />} label="Type des visiteurs" active={pathname.includes("/visiteurs/types")} collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/visiteurs/list" icon={<Users className="w-5 h-5" />} label="Visites" active={pathname.includes("/visiteurs/list")} collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/visiteurs/registered" icon={<ShieldCheck className="w-5 h-5" />} label="Gérer les visiteurs" active={pathname.includes("/visiteurs/registered")} collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/visiteurs/vehicles" icon={<Car className="w-5 h-5" />} label="Véhicules" active={pathname.includes("/visiteurs/vehicles")} collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/visiteurs/register" icon={<UserPlus className="w-5 h-5" />} label="Enregistrer" active={pathname.includes("/visiteurs/register")} collapsed={isSidebarCollapsed} />

                        <SidebarCategory label="Hôte" collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/hote/management" icon={<UserCircle className="w-5 h-5" />} label="Gérer les hôtes" active={pathname.includes("/hote/management")} collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/hote/departments" icon={<ClipboardList className="w-5 h-5" />} label="Départements" active={pathname.includes("/hote/departments")} collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/hote/services" icon={<Layout className="w-5 h-5" />} label="Gérer les services" active={pathname.includes("/hote/services")} collapsed={isSidebarCollapsed} />

                        <SidebarCategory label="Dispositif" collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/dispositif" icon={<Monitor className="w-5 h-5" />} label="Dispositif" active={pathname.includes("/dispositif")} collapsed={isSidebarCollapsed} />

                        <SidebarCategory label="Paramètres" collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/paramettres/generales" icon={<Settings className="w-5 h-5" />} label="Générales" active={pathname.includes("/paramettres/generales")} collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/paramettres/integrations" icon={<Globe className="w-5 h-5" />} label="Intégrations" active={pathname.includes("/paramettres/integrations")} collapsed={isSidebarCollapsed} />

                        <SidebarCategory label="Administration" collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/administration/billing" icon={<ClipboardList className="w-5 h-5" />} label="Facturation" active={pathname.includes("/administration/billing")} collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/administration/users" icon={<Users className="w-5 h-5" />} label="Utilisateurs" active={pathname.includes("/administration/users")} collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/administration/settings" icon={<Building2 className="w-5 h-5" />} label="Mon Entreprise" active={pathname.includes("/administration/settings")} collapsed={isSidebarCollapsed} />
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-8 relative bg-slate-100">
                    <div className="relative z-10 w-full h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

function SidebarCategory({ label, collapsed }: { label: string; collapsed: boolean }) {
    if (collapsed) return <div className="h-px bg-gray-100 my-4 mx-4" />;
    return (
        <div className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 mt-2">
            {label}
        </div>
    );
}

function SidebarLink({ href, icon, label, active, collapsed }: { href: string; icon: React.ReactNode; label: string; active: boolean; collapsed: boolean }) {
    return (
        <Link
            href={href}
            title={collapsed ? label : ""}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all border-l-[3px] ${active
                ? 'bg-teal-50/50 text-teal-600 border-teal-600'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                } ${collapsed ? 'justify-center px-0' : ''}`}
        >
            <span className={`${active ? "text-teal-600" : "text-gray-400"} ${collapsed ? "w-6 h-6 flex items-center justify-center ms-1" : ""}`}>
                {icon}
            </span>
            {!collapsed && <span className="truncate">{label}</span>}
        </Link>
    );
}

function HeaderAction({ children, href, target, active }: { children: React.ReactNode; href: string; target?: string; active?: boolean }) {
    return (
        <Link
            href={href}
            target={target}
            rel={target === "_blank" ? "noopener noreferrer" : undefined}
            className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all flex items-center shadow-sm ${active ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:shadow-md'}`}
        >
            {children}
        </Link>
    );
}
