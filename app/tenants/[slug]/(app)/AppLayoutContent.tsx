"use client";

import { useState } from "react";
import Link from "next/link";
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
        <div className="flex flex-col h-screen overflow-hidden font-sans">
            {/* Top Header - Premium Blue */}
            <header className="h-20 bg-[#0055cc] flex items-center justify-between px-6 shrink-0 text-white shadow-md z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                            <ShieldCheck className="text-white w-6 h-6" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter">
                            SecureVisit
                        </span>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    {/* Tablet Emulator */}
                    <HeaderAction href="/kiosk" target="_blank" active={false}>
                        <Monitor className="w-4 h-4 mr-2" />
                        Émulateur de tablette
                    </HeaderAction>

                    {/* Tenant Name Display */}
                    <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2 border border-white/20 backdrop-blur-sm">
                        <span className="text-sm font-semibold text-white">
                            {tenantName || "Chargement..."}
                        </span>
                    </div>

                    <div className="w-px h-8 bg-white/20 mx-2" />

                    <UserButton
                        appearance={{
                            elements: {
                                userButtonAvatarBox: "w-10 h-10 border-2 border-white/20 hover:border-white/40 transition-all"
                            }
                        }}
                    />
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside
                    className={`bg-white border-r flex flex-col overflow-y-auto shrink-0 z-10 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "w-20" : "w-64"
                        }`}
                >
                    <div className="py-4">
                        <SidebarLink
                            href="/dashboard"
                            icon={<LayoutDashboard className="w-5 h-5" />}
                            label="Tableau de bord"
                            active={pathname.endsWith("/dashboard")}
                            collapsed={isSidebarCollapsed}
                        />

                        <SidebarCategory label="Visiteurs" collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/visiteurs/types" icon={<Layout className="w-5 h-5 text-gray-400" />} label="Type des visiteurs" active={pathname.includes("/visiteurs/types")} collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/visiteurs/list" icon={<Users className="w-5 h-5 text-gray-400" />} label="Visits" active={pathname.includes("/visiteurs/list")} collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/visiteurs/registered" icon={<ShieldCheck className="w-5 h-5 text-gray-400" />} label="Gérer les visiteurs inscrits" active={pathname.includes("/visiteurs/registered")} collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/visiteurs/vehicles" icon={<Car className="w-5 h-5 text-gray-400" />} label="Véhicules" active={pathname.includes("/visiteurs/vehicles")} collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/visiteurs/register" icon={<UserPlus className="w-5 h-5 text-gray-400" />} label="Enregistrer Visiteur" active={pathname.includes("/visiteurs/register")} collapsed={isSidebarCollapsed} />

                        <SidebarCategory label="Hôte" collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/hote/management" icon={<UserCircle className="w-5 h-5 text-gray-400" />} label="Gérer les hôtes" active={pathname.includes("/hote/management")} collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/hote/departments" icon={<ClipboardList className="w-5 h-5 text-gray-400" />} label="Gérer les départements" active={pathname.includes("/hote/departments")} collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/hote/services" icon={<Layout className="w-5 h-5 text-gray-400" />} label="Gérer les services" active={pathname.includes("/hote/services")} collapsed={isSidebarCollapsed} />

                        <SidebarCategory label="Dispositif" collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/dispositif" icon={<Monitor className="w-5 h-5 text-gray-400" />} label="Dispositif" active={pathname.includes("/dispositif")} collapsed={isSidebarCollapsed} />

                        <SidebarCategory label="Paramètres" collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/paramettres/generales" icon={<Settings className="w-5 h-5 text-gray-400" />} label="Générales" active={pathname.includes("/paramettres/generales")} collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/paramettres/integrations" icon={<Globe className="w-5 h-5 text-gray-400" />} label="Intégrations" active={pathname.includes("/paramettres/integrations")} collapsed={isSidebarCollapsed} />

                        <SidebarCategory label="Administration" collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/administration/billing" icon={<ClipboardList className="w-5 h-5 text-gray-400" />} label="Facturation" active={pathname.includes("/administration/billing")} collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/administration/users" icon={<Users className="w-5 h-5 text-gray-400" />} label="Utilisateurs" active={pathname.includes("/administration/users")} collapsed={isSidebarCollapsed} />
                        <SidebarLink href="/administration/settings" icon={<Building2 className="w-5 h-5 text-gray-400" />} label="Mon Entreprise" active={pathname.includes("/administration/settings")} collapsed={isSidebarCollapsed} />
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto bg-[#f8fafc] p-8">
                    {children}
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
            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all border-l-4 ${active
                ? 'bg-blue-50 text-[#0055cc] border-[#0055cc]'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                } ${collapsed ? 'justify-center px-0' : ''}`}
        >
            <span className={`${active ? "text-[#0055cc]" : "text-gray-400"} ${collapsed ? "w-6 h-6 flex items-center justify-center ms-1" : ""}`}>
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
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors flex items-center ${active ? 'bg-white text-blue-600' : 'bg-black/20 text-white hover:bg-black/30'}`}
        >
            {children}
        </Link>
    );
}
