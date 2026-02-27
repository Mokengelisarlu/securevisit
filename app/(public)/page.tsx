import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicHeader } from "@/components/PublicHeader";
import {
  ShieldCheck,
  Users,
  BarChart3,
  TabletSmartphone,
} from "lucide-react";

export default function HomePage() {
  return (
    <>
      <PublicHeader />
      <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* ---------------- HERO ---------------- */}
      <section className="container mx-auto px-6 py-24 text-center">
        <span className="inline-block mb-4 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
          Visitor Management System
        </span>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Gérez vos visiteurs <br />
          <span className="text-primary">simplement et en toute sécurité</span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-10">
          Une plateforme moderne pour l’enregistrement des visiteurs,
          le contrôle des accès et le suivi en temps réel — adaptée
          aux entreprises, écoles et institutions.
        </p>

      </section>

      {/* ---------------- FEATURES ---------------- */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Feature
            icon={<TabletSmartphone className="h-6 w-6" />}
            title="Check-in digital"
            description="Enregistrement rapide via tablette, téléphone ou borne d’accueil."
          />
          <Feature
            icon={<Users className="h-6 w-6" />}
            title="Gestion des visiteurs"
            description="Historique complet, visites planifiées et suivi en temps réel."
          />
          <Feature
            icon={<BarChart3 className="h-6 w-6" />}
            title="Tableau de bord"
            description="Statistiques journalières, mensuelles et rapports exportables."
          />
          <Feature
            icon={<ShieldCheck className="h-6 w-6" />}
            title="Sécurité & conformité"
            description="Données isolées par entreprise, accès contrôlés et auditables."
          />
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="container mx-auto px-6 py-24">
        <Card className="bg-primary text-primary-foreground shadow-xl">
          <CardContent className="p-12 text-center space-y-6">
            <h2 className="text-3xl font-bold">
              Prêt à moderniser la gestion de vos visiteurs ?
            </h2>
            <p className="max-w-xl mx-auto text-primary-foreground/80">
              Créez votre portail en quelques minutes et commencez à
              enregistrer vos visiteurs dès aujourd’hui.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/setup-tenant">Créer un compte</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="border-t">
        <div className="container mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} — Visitor Management System. Tous droits réservés.
        </div>
      </footer>
      </main>
    </>
  );
}

/* ---------------- Feature Card ---------------- */

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="hover:shadow-lg transition">
      <CardContent className="p-6 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
