import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    ShieldCheck,
    Users,
    BarChart3,
    TabletSmartphone,
    LayoutDashboard,
    ClipboardList,
    UserCheck,
    Zap,
    ArrowRight,
    Globe,
    Settings,
    Monitor
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function FeaturesPage() {
    return (
        <main className="min-h-screen bg-white font-sans">
            {/* Hero Header */}
            <section className="bg-slate-50 border-b py-20">
                <div className="container mx-auto px-6 text-center max-w-4xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-bold uppercase tracking-wider mb-6">
                        <Zap className="w-3 h-3 text-teal-600" />
                        Fonctionnalités Clés
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-6">
                        Une solution complète pour votre <span className="text-teal-600">gestion des visiteurs</span>
                    </h1>
                    <p className="text-xl text-gray-600 font-medium leading-relaxed">
                        Découvrez comment SecureVisit transforme votre accueil en un espace sécurisé, moderne et efficace.
                    </p>
                </div>
            </section>

            {/* Main Features Grid */}
            <section className="py-24">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureItem
                            icon={<LayoutDashboard className="w-10 h-10 text-emerald-500" />}
                            title="Tableau de Bord Live"
                            description="Visualisez en temps réel les arrivées, les visiteurs sur place et les sorties. Statisques quotidiennes et mensuelles automatisées."
                        />
                        <FeatureItem
                            icon={<ClipboardList className="w-10 h-10 text-teal-500" />}
                            title="Gestion des Visites"
                            description="Suivi détaillé via des onglets spécialisés. Filtrage avancé par date et statut pour une traçabilité totale."
                        />
                        <FeatureItem
                            icon={<TabletSmartphone className="w-10 h-10 text-purple-500" />}
                            title="Borne d'Enregistrement"
                            description="Interface publique intuitive pour un check-in autonome. Idéal pour les tablettes en réception."
                        />
                        <FeatureItem
                            icon={<Users className="w-10 h-10 text-amber-500" />}
                            title="Base de Données Visiteurs"
                            description="Gérez vos visiteurs récurrents, enregistrez de nouveaux profils et catégorisez-les par type."
                        />
                        <FeatureItem
                            icon={<UserCheck className="w-10 h-10 text-sky-500" />}
                            title="Hôtes et Personnel"
                            description="Organisez vos employés par département pour une assignation rapide des visites."
                        />
                        <FeatureItem
                            icon={<Monitor className="w-10 h-10 text-rose-500" />}
                            title="Système Multi-Établissement"
                            description="Chaque client dispose de son propre sous-domaine sécurisé et de sa base de données isolée."
                        />
                    </div>
                </div>
            </section>

            {/* Deep Dive Section */}
            <section className="bg-slate-900 py-24 text-white">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row gap-16 items-center">
                        <div className="lg:w-1/2 space-y-8">
                            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-loose">
                                Sécurité et <br />Confidentialité d'Abord
                            </h2>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Notre architecture multi-tenant garantit que vos données sont totalement isolées de celles des autres clients. Chaque accès est contrôlé et audité pour satisfaire vos exigences de conformité.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "Isolation stricte des bases de données",
                                    "Authentification sécurisée avec Clerk",
                                    "Sous-domaines personnalisés",
                                    "Logs d'activité en temps réel"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                        <span className="font-semibold text-gray-200">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="lg:w-1/2 w-full">
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                                <div className="grid grid-cols-2 gap-4">
                                    <StatItem label="Temps de Check-in" value="< 30s" />
                                    <StatItem label="Uptime Garanti" value="99.9%" />
                                    <StatItem label="Isolation Données" value="100%" />
                                    <StatItem label="Support" value="24/7" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Action CTA */}
            <section className="py-32 bg-white">
                <div className="container mx-auto px-6 text-center">
                    <div className="max-w-2xl mx-auto space-y-10">
                        <h2 className="text-4xl font-black text-gray-900">Prêt à moderniser votre accueil ?</h2>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button asChild size="lg" className="h-14 px-10 text-lg font-bold rounded-2xl bg-teal-600 hover:bg-teal-700 shadow-xl shadow-blue-100">
                                <Link href="/sign-up">Créer mon espace</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="h-14 px-10 text-lg font-bold rounded-2xl border-2">
                                <Link href="/sign-in">Déjà client ? Se connecter</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Simple Footer */}
            <footer className="py-12 border-t bg-gray-50">
                <div className="container mx-auto px-6 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-gray-900">SecureVisit</span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                        Propulsé par Mokengeli Sarlu &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </footer>
        </main>
    );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="group p-8 rounded-[2.5rem] bg-gray-50 border border-transparent hover:border-teal-100 hover:bg-white hover:shadow-2xl hover:shadow-blue-50 transition-all duration-500">
            <div className="mb-6 bg-white w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg shadow-gray-100 group-hover:scale-110 transition-transform duration-500">
                {icon}
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-3 group-hover:text-teal-600 transition-colors uppercase tracking-tight">{title}</h3>
            <p className="text-gray-500 font-medium leading-relaxed italic line-clamp-3">
                {description}
            </p>
        </div>
    );
}

function StatItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="p-6 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="text-2xl font-black text-white">{value}</div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{label}</div>
        </div>
    );
}
