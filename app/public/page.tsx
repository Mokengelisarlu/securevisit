import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicHeader } from "@/components/PublicHeader";
import {
  ShieldCheck,
  Users,
  BarChart3,
  TabletSmartphone,
  LayoutDashboard,
  ClipboardList,
  UserCheck,
  Monitor,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <>
      <PublicHeader />
      <main className="min-h-screen bg-white">
        {/* ============ SECTION 1: HERO ============ */}
        <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white py-32">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-12">
              {/* Left: Content */}
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-400/30 w-fit">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span className="text-sm font-semibold text-blue-200">Visitor Management System</span>
                </div>

                <div className="space-y-6">
                  <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                    Gérez vos visiteurs <br />
                    <span className="text-blue-400">simplement et en toute sécurité</span>
                  </h1>
                  <p className="text-xl text-slate-300 leading-relaxed max-w-lg">
                    Une plateforme moderne pour l'enregistrement des visiteurs, le contrôle des accès et le suivi en temps réel — adaptée aux entreprises, écoles et institutions.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
                    <Link href="/sign-up">Créer un compte</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-slate-400 text-slate-200 hover:bg-slate-800">
                    <Link href="#features">En savoir plus</Link>
                  </Button>
                </div>
              </div>

              {/* Right: Hero Image */}
              <div className="relative h-96 lg:h-full rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-700 to-slate-600">
                <img src="/images/hero.svg" alt="Modern corporate office with security desk" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* ============ SECTION 2: KEY FEATURES ============ */}
        <section id="features" className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                Fonctionnalités Clés
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Découvrez ce qui fait de SecureVisit la solution complète pour la gestion des visiteurs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard
                icon={<LayoutDashboard className="w-8 h-8 text-blue-600" />}
                title="Tableau de Bord Live"
                description="Visualisez en temps réel les arrivées, les visiteurs sur place et les sorties."
              />
              <FeatureCard
                icon={<ClipboardList className="w-8 h-8 text-blue-600" />}
                title="Gestion des Visites"
                description="Suivi détaillé avec filtrage avancé par date et statut pour la traçabilité."
              />
              <FeatureCard
                icon={<TabletSmartphone className="w-8 h-8 text-blue-600" />}
                title="Borne d'Enregistrement"
                description="Interface publique intuitive pour un check-in autonome sur tablette."
              />
              <FeatureCard
                icon={<Users className="w-8 h-8 text-blue-600" />}
                title="Base de Données Visiteurs"
                description="Gérez vos visiteurs récurrents et catégorisez-les par type."
              />
            </div>
          </div>
        </section>

        {/* ============ SECTION 3: DEEP DIVE - DASHBOARD ============ */}
        <section className="py-24 bg-slate-50">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: Dashboard Image */}
              <div className="relative h-96 rounded-xl overflow-hidden shadow-xl bg-slate-100 order-last lg:order-first">
                <img src="/images/dashboard.svg" alt="Dashboard with analytics and live statistics" className="w-full h-full object-cover" />
              </div>

              {/* Right: Content */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-4xl font-bold text-slate-900">
                    Tableau de Bord en Temps Réel
                  </h3>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    Obtenez une vue d'ensemble instantanée de toute votre activité d'accueil. Suivez les statistiques d'arrivées, le nombre de visiteurs sur place, et les horaires de départ — tout en un seul coup d'œil.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    "Statistiques en direct (Arrivées, Présents, Sorties)",
                    "Historique mensuel des visites",
                    "Flux d'activité des 10 derniers événements",
                    "Horloge synchronisée en temps réel"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span className="text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ SECTION 4: HOW IT WORKS ============ */}
        <section id="how-it-works" className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                Comment ça Marche
              </h2>
              <p className="text-xl text-slate-600">
                De la mise en place à la gestion quotidienne, en trois étapes simples
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
              {[
                {
                  step: "1",
                  title: "Créez votre compte",
                  description: "Inscrivez-vous en quelques minutes et configurez votre portail personnalisé avec votre sous-domaine.",
                },
                {
                  step: "2",
                  title: "Paramétrez votre équipe",
                  description: "Ajoutez vos hôtes et organisez-les par département pour une assignation rapide des visites.",
                },
                {
                  step: "3",
                  title: "Commencez à accueillir",
                  description: "Utilisez le kiosque numérique ou l'interface admin pour enregistrer et suivre les visiteurs en temps réel.",
                },
              ].map((item, i) => (
                <div key={i} className="relative">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                      {item.step}
                    </div>
                    <h4 className="text-xl font-bold text-slate-900">{item.title}</h4>
                    <p className="text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                  {i < 2 && (
                    <div className="hidden lg:block absolute top-6 -right-4 text-blue-400 opacity-50">
                      <ArrowRight className="w-8 h-8" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* How It Works Image */}
            <div className="relative h-80 rounded-xl overflow-hidden shadow-lg bg-slate-100">
              <img src="/images/workflow.svg" alt="Three-step process flow visualization" className="w-full h-full object-cover" />
            </div>
          </div>
        </section>

        {/* ============ SECTION 5: SECURITY & COMPLIANCE ============ */}
        <section className="py-24 bg-gradient-to-br from-slate-900 to-blue-900 text-white">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-4xl font-bold">
                    Sécurité et Conformité <br /> au Cœur
                  </h3>
                  <p className="text-lg text-slate-300 leading-relaxed">
                    Vos données sont votre responsabilité. C'est pourquoi SecureVisit implémente une architecture multi-locataire robuste qui garantit que vos données sont totalement isolées de celles des autres clients. Chaque accès est contrôlé, chiffré et auditable.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    "Isolation stricte des bases de données par client",
                    "Authentification sécurisée avec Clerk",
                    "Sous-domaines personnalisés et dédiés",
                    "Logs d'activité complets et auditables",
                    "Conformité RGPD prête",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      <span className="text-slate-200">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Security Image */}
              <div className="relative h-96 rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-800 to-slate-700">
                <img src="/images/security.svg" alt="Data protection and shield security concept" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* ============ SECTION 6: FINAL CTA ============ */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-2xl border-0">
              <CardContent className="p-16 text-center space-y-8">
                <h2 className="text-4xl lg:text-5xl font-bold">
                  Transformez votre gestion des visiteurs dès aujourd'hui
                </h2>
                <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                  Rejoignez les entreprises qui font confiance à SecureVisit pour sécuriser leur accueil et moderniser leur accueil des visiteurs.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold" asChild>
                    <Link href="/sign-up">Créer un compte gratuit</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-600/20">
                    Planifier une démo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <footer className="border-t bg-slate-50">
          <div className="container mx-auto px-6 py-12">
            <div className="text-center text-sm text-slate-600">
              © {new Date().getFullYear()} — SecureVisit. Visitor Management System. Tous droits réservés.
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

/* ============ FEATURE CARD COMPONENT ============ */

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="hover:shadow-lg transition border-slate-200 bg-white">
      <CardContent className="p-8 space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
          {icon}
        </div>
        <h3 className="font-bold text-lg text-slate-900">{title}</h3>
        <p className="text-slate-600 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
