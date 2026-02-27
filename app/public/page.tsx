import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldCheck,
  Users,
  BarChart3,
  TabletSmartphone,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* HERO */}
      <section className="container mx-auto px-6 py-24 text-center">
        <span className="inline-block mb-4 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
          Visitor Management System
        </span>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Gérez vos visiteurs <br />
          <span className="text-primary">simplement et en toute sécurité</span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-10">
          Une plateforme moderne pour l'enregistrement des visiteurs,
          le contrôle des accès et le suivi en temps réel — adaptée
          aux entreprises, écoles et institutions.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Button size="lg" asChild>
            <Link href="/sign-up">Démarrer</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#features">En savoir plus</Link>
          </Button>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="container mx-auto px-6 py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<TabletSmartphone className="h-6 w-6" />}
            title="Check-in digital"
            description="Enregistrement rapide via tablette, téléphone ou borne d'accueil."
          />
          <FeatureCard
            icon={<Users className="h-6 w-6" />}
            title="Gestion des visiteurs"
            description="Historique complet, visites planifiées et suivi en temps réel."
          />
          <FeatureCard
            icon={<BarChart3 className="h-6 w-6" />}
            title="Rapports & Analytics"
            description="Tableaux de bord détaillés et exports pour la conformité."
          />
          <FeatureCard
            icon={<ShieldCheck className="h-6 w-6" />}
            title="Sécurité avancée"
            description="Contrôle d'accès granulaire et audit trail complet."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-20 text-center">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-8">
            <h2 className="text-2xl font-bold mb-4">Prêt à commencer ?</h2>
            <p className="text-gray-600 mb-6">
              Créez votre compte et gérez vos visiteurs en quelques minutes.
            </p>
            <Button size="lg" asChild>
              <Link href="/sign-up">S'inscrire</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

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
    <Card>
      <CardContent className="pt-6">
        <div className="text-primary mb-3">{icon}</div>
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </CardContent>
    </Card>
  )
}
