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
        <section className="bg-gradient-to-br from-slate-900 via-teal-900 to-slate-800 text-white py-32">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/20 border border-teal-400/30 w-fit">
                  <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                  <span className="text-sm font-semibold text-teal-200">Visitor Management System</span>
                </div>

                <div className="space-y-6">
                  <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                    Gérez vos visiteurs <br />
                    <span className="text-teal-400">simplement et en toute sécurité</span>
                  </h1>
                  <p className="text-xl text-slate-300 leading-relaxed max-w-lg">
                    Une plateforme moderne pour l'enregistrement des visiteurs, le contrôle des accès et le suivi en temps réel — adaptée aux entreprises, écoles et institutions.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white" asChild>
                    <Link href="/sign-up">Créer un compte</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-slate-400 text-slate-200 hover:bg-slate-800">
                    <Link href="#features">En savoir plus</Link>
                  </Button>
                </div>
              </div>

              {/* Right: Image Placeholder */}
              <div className="relative h-96 lg:h-full rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center">
                <div className="text-center text-slate-400 space-y-2">
                  <div className="text-6xl">📊</div>
                  <p className="text-sm mt-4">Hero Image: Modern corporate office with security desk</p>
                </div>
              </div>
            </div>
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

