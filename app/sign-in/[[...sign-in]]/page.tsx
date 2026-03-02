"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Zap,
  Lock,
  Mail,
  KeyRound,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError("");

    try {
      const result = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/tenants");
      } else {
        console.error("Sign-in incomplete:", result);
        setError("La connexion n'a pas pu être finalisée.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.errors?.[0]?.message || "Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col lg:flex-row relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full z-0" />

      {/* Back Button - Responsive Positioning */}
      <div className="absolute top-6 left-6 lg:top-8 lg:left-8 z-50">
        <Button
          variant="ghost"
          asChild
          className="text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-2 group px-4 py-2 rounded-xl backdrop-blur-md border border-white/5"
        >
          <Link href="/">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Retour à l'accueil</span>
          </Link>
        </Button>
      </div>

      {/* LEFT COLUMN: BRAND AREA */}
      <div className="hidden lg:flex flex-col justify-center items-start lg:w-1/2 p-20 relative z-10 border-r border-white/5 bg-white/[0.02]">
        <div className="space-y-12 max-w-lg animate-in slide-in-from-left duration-700">
          <Link href="/" className="text-4xl font-black flex items-center gap-4 group">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-3xl">V</span>
            </div>
            <span className="text-white tracking-tight">SecureVisit</span>
          </Link>

          <div className="space-y-6">
            <h1 className="text-5xl font-black text-white leading-tight tracking-tight">
              Gérez vos visiteurs avec une <span className="text-blue-500">précision absolue.</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium leading-relaxed">
              La plateforme moderne pour l'enregistrement, le contrôle des accès et le suivi en temps réel de votre établissement.
            </p>
          </div>

          <div className="space-y-6 pt-8">
            {[
              { icon: ShieldCheck, title: "Sécurité Maximale", desc: "Isolation des données et protocoles chiffrés." },
              { icon: Zap, title: "Rapidité d'Exécution", desc: "Kiosque intuitif pour un check-in en moins de 30s." },
              { icon: Lock, title: "Contrôle Total", desc: "Gérez vos permissions et vos historiques avec précision." }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 group">
                <div className="mt-1 w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">{item.title}</h4>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: CUSTOM SIGN IN FORM */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-20 relative z-10">
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-500 delay-200">

          {/* Mobile Logo Only */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <Link href="/" className="text-3xl font-black flex items-center gap-4 group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                <span className="text-white font-black text-2xl">V</span>
              </div>
              <span className="text-white tracking-tight">SecureVisit</span>
            </Link>
          </div>

          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-3">Bon retour !</h2>
            <p className="text-slate-400 font-medium text-lg">Connectez-vous à votre espace administrateur</p>
          </div>

          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)] rounded-[2.5rem] p-8 lg:p-10 relative overflow-hidden">
            {/* Subtle light effect inside card */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-16 -mt-16" />

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-200">{error}</p>
                </div>
              )}

              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-slate-300 font-bold ml-1 text-sm">Adresse Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nom@entreprise.com"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    required
                    className="h-14 pl-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-2xl focus:bg-white/10 focus:ring-2 focus:ring-blue-500/50 border-white/10 transition-all text-lg"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-slate-300 font-bold text-sm">Mot de passe</Label>
                  <Link href="/forgot-password" title="Fonctionnalité bientôt disponible" className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
                    Oublié ?
                  </Link>
                </div>
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-14 pl-12 pr-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-2xl focus:bg-white/10 focus:ring-2 focus:ring-blue-500/50 border-white/10 transition-all text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3 group"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Se connecter
                      <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center pt-2">
                <p className="text-slate-400 text-sm font-medium">
                  Nouveau utilisateur ? <Link href="/setup-tenant" className="text-blue-400 hover:text-blue-300 font-black decoration-2 underline-offset-4 hover:underline transition-all">Créer un compte</Link>
                </p>
              </div>
            </form>
          </div>

          <div className="mt-12 text-center text-slate-700 text-sm font-bold tracking-tight">
            © {new Date().getFullYear()} SECUREVISIT. VISITOR MANAGEMENT SYSTEM.
          </div>
        </div>
      </div>
    </main>
  );
}