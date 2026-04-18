import { getPublicTenantBySlug, getBusinessSettings } from "@/features/tenants/queries/tenant-data";
import { VisitorKioskForm } from "@/features/tenants/forms/VisitorKioskForm";
import { Building2 } from "lucide-react";
import Image from "next/image";

export default async function KioskPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const tenant = await getPublicTenantBySlug(slug);

    if (!tenant) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 uppercase tracking-widest font-bold text-teal-300/60">
                Tenant non trouvé
            </div>
        );
    }

    // Fetch business settings to get logo
    const settings = await getBusinessSettings(slug).catch(() => null);

    return (
        <div className="h-screen w-full overflow-hidden bg-white">
            {/* Light Teal Theme Background */}
            <div
                className="relative h-full w-full flex flex-col items-center justify-between"
                style={{
                    backgroundColor: '#F0FDFA', // teal-50
                    backgroundImage: 'radial-gradient(circle at top left, #E0F2FE 0%, transparent 40%), radial-gradient(circle at bottom right, #F0FDFA 0%, transparent 40%)',
                }}
            >
                {/* Subtle animated overlay */}
                <div
                    className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"
                />
 
                {/* Animated particles (Teal) */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(12)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full bg-teal-400"
                            style={{
                                width: `${Math.random() * 4 + 2}px`,
                                height: `${Math.random() * 4 + 2}px`,
                                opacity: Math.random() * 0.3 + 0.1,
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animation: `float ${Math.random() * 10 + 8}s ease-in-out infinite`,
                                animationDelay: `${Math.random() * 5}s`,
                            }}
                        />
                    ))}
                </div>
 
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center w-full h-full p-4 md:p-6">
                    {/* Logo Section */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center">
                        <Image
                            src="/icon-192x192.png"
                            alt="SecureVisit Logo"
                            width={80}
                            height={80}
                            className="object-contain drop-shadow-xl"
                        />
                        <span className="text-teal-600 font-bold text-xl mt-2 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
                            SecureVisit
                        </span>
                    </div>
 
                    {/* Tenant Name */}
                    <div className="text-center flex-shrink-0 mt-6">
                        <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter">
                            {tenant.name}
                        </h1>
                    </div>
 
                    {/* Main Form Content */}
                    <div className="flex-1 w-full max-w-3xl flex flex-col items-center justify-center overflow-hidden">
                        <div className="w-full max-h-full overflow-y-auto px-2 py-2 custom-scrollbar">
                            <VisitorKioskForm tenantSlug={slug} />
                        </div>
                    </div>
 
                    {/* Footer */}
                    <footer className="flex-shrink-0 text-center py-2">
                        <p className="text-teal-600 font-bold text-[9px] uppercase tracking-widest mb-1">
                            Système de gestion des visiteurs
                        </p>
                        <div className="flex items-center justify-center gap-2 opacity-80 hover:opacity-100 transition-opacity duration-300">
                            <Image
                                src="/images/logoBlanc.png"
                                alt="MOKENGELI Logo"
                                width={12}
                                height={12}
                                className="object-contain invert opacity-60"
                            />
                            <span className="text-teal-700 text-[8px] font-medium tracking-wide">
                                Powered by <span className="text-teal-900 font-semibold">MOKENGELI Sarlu</span>
                            </span>
                        </div>
                    </footer>
                </div>
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes gradientShift {
                    0%, 100% { opacity: 0.7; }
                    50% { opacity: 0.5; }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.2; }
                    25% { transform: translateY(-20px) translateX(10px); opacity: 0.4; }
                    50% { transform: translateY(-40px) translateX(-10px); opacity: 0.6; }
                    75% { transform: translateY(-20px) translateX(15px); opacity: 0.3; }
                }
            `}</style>
        </div>
    );
}
