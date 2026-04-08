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
import { type OAuthStrategy } from "@clerk/types";

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
        <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
      </div>
    );
  }

  const signInWith = (strategy: OAuthStrategy) => {
    return signIn.authenticateWithRedirect({
      strategy,
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/tenants",
    });
  };

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
    <main className="min-h-screen bg-slate-100 flex flex-col lg:flex-row relative overflow-hidden">
      {/* Background decorations */}


      {/* Back Button - Responsive Positioning */}
      <div className="absolute top-6 left-6 lg:top-8 lg:left-8 z-50">
        <Button
          variant="outline"
          asChild
          className="text-slate-600 hover:text-slate-900 hover:bg-slate-200 flex items-center gap-2 group px-4 py-2 rounded-xl border border-slate-200 bg-white shadow-sm"
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
            <span className="text-slate-900 tracking-tight">SecureVisit</span>
          </Link>

          <div className="space-y-6">
            <h1 className="text-5xl font-black text-slate-900 leading-tight tracking-tight">
              Gérez vos visiteurs avec une <span className="text-teal-600">précision absolue.</span>
            </h1>
            <p className="text-xl text-slate-600 font-medium leading-relaxed">
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
                <div className="mt-1 w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 group-hover:bg-teal-100 transition-colors">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{item.title}</h4>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: CUSTOM SIGN IN FORM */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-500 delay-200">

          {/* Mobile Logo Only */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <Link href="/" className="text-3xl font-black flex items-center gap-4 group">
              <span className="text-slate-900 tracking-tight">SecureVisit</span>
            </Link>
          </div>

          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-2 leading-tight">Bon retour !</h2>
            <p className="text-slate-600 font-medium text-lg">Choisissez votre méthode de connexion</p>
          </div>

          <div className="bg-white border border-slate-200 shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 lg:p-10 relative overflow-hidden">
            {/* Subtle light effect inside card */}


            <div className="space-y-6 relative z-10">
              {/* Social Logins */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => signInWith("oauth_google")}
                  className="h-14 bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100 hover:border-slate-300 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="font-bold relative z-10">Google</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => signInWith("oauth_facebook")}
                  className="h-14 bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100 hover:border-slate-300 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <svg className="w-5 h-5 text-[#1877F2] relative z-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span className="font-bold relative z-10">Facebook</span>
                </Button>
              </div>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-xs font-black text-slate-400 uppercase tracking-widest">Ou continuer avec</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-red-200">{error}</p>
                  </div>
                )}

                <div className="space-y-2.5">
                  <Label htmlFor="email" className="text-slate-700 font-bold ml-1 text-sm">Adresse Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nom@entreprise.com"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      required
                      className="h-14 pl-12 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-2xl focus:bg-white focus:ring-2 focus:ring-teal-500/50 transition-all text-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="password" className="text-slate-700 font-bold text-sm">Mot de passe</Label>
                    <Link href="/forgot-password" title="Fonctionnalité bientôt disponible" className="text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors">
                      Oublié ?
                    </Link>
                  </div>
                  <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-14 pl-12 pr-12 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-2xl focus:bg-white focus:ring-2 focus:ring-teal-500/50 transition-all text-lg"
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
                    className="w-full h-16 bg-teal-600 hover:bg-teal-700 text-white font-black text-xl rounded-2xl transition-all shadow-xl shadow-teal-500/20 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3 group"
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
              </form>

              <div className="text-center pt-2">
                <p className="text-slate-400 text-sm font-medium">
                  Pas encore de compte ? <Link href="/sign-up" className="text-teal-600 hover:text-teal-700 font-black decoration-2 underline-offset-4 hover:underline transition-all">S'inscrire</Link>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center text-slate-400 text-sm font-bold tracking-tight uppercase">
            © {new Date().getFullYear()} SECUREVISIT • VISITOR MANAGEMENT SYSTEM
          </div>
        </div>
      </div>
    </main>
  );
}