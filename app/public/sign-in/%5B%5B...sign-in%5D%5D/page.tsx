"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
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
            redirectUrlComplete: "/dashboard",
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
                router.push("/dashboard");
            } else {
                setError("La connexion n'a pas pu être finalisée.");
            }
        } catch (err: any) {
            setError(err.errors?.[0]?.message || "Email ou mot de passe incorrect.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="h-screen w-full bg-slate-950 flex flex-col lg:flex-row relative overflow-hidden">
            {/* Background accents */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-600/5 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/5 blur-[120px] rounded-full" />

            {/* Floating Back Button */}
            <Link
                href="/"
                className="absolute top-6 left-6 lg:top-8 lg:left-8 z-50 flex items-center gap-2 text-slate-500 hover:text-white transition-colors group text-sm font-bold"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Retour
            </Link>

            {/* LEFT: BRANDING (Minimalist) */}
            <div className="hidden lg:flex flex-col justify-center items-center lg:w-[45%] p-12 lg:p-24 relative z-10 border-r border-white/5 bg-white/[0.01]">
                <div className="max-w-sm w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="flex flex-col items-center lg:items-start gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-teal-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-teal-500/20 mb-4 items-center">
                            <span className="text-white font-black text-4xl">V</span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tighter">
                            Secure<span className="text-teal-500">Visit</span>.
                        </h1>
                        <p className="text-lg text-slate-500 font-medium max-w-[280px]">
                            Logiciel de gestion de visiteurs intelligent et sécurisé.
                        </p>
                    </div>
                </div>
            </div>

            {/* RIGHT: FORM (Minimalist) */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
                <div className="w-full max-w-[380px] space-y-8 animate-in fade-in zoom-in duration-500">

                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-black text-white tracking-tight">Espace Connexion</h2>
                        <p className="text-slate-500 text-sm font-medium">Entrez vos identifiants pour continuer</p>
                    </div>

                    <div className="space-y-6">
                        {/* Social Logins - Minimalist Row */}
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                onClick={() => signInWith("oauth_google")}
                                variant="outline"
                                className="h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-2xl flex items-center justify-center gap-2.5 transition-all text-xs font-bold"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Google
                            </Button>
                            <Button
                                onClick={() => signInWith("oauth_facebook")}
                                variant="outline"
                                className="h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-2xl flex items-center justify-center gap-2.5 transition-all text-xs font-bold"
                            >
                                <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                Facebook
                            </Button>
                        </div>

                        <div className="relative flex items-center py-1">
                            <div className="flex-grow border-t border-white/5"></div>
                            <span className="flex-shrink mx-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">ou email</span>
                            <div className="flex-grow border-t border-white/5"></div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 animate-in fade-in duration-300">
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                    <p className="text-[11px] font-bold text-red-200">{error}</p>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-teal-500 transition-colors" />
                                    <Input
                                        type="email"
                                        placeholder="Email"
                                        value={emailAddress}
                                        onChange={(e) => setEmailAddress(e.target.value)}
                                        required
                                        className="h-12 pl-11 bg-white/[0.03] border-white/5 text-white placeholder:text-slate-700 rounded-xl focus:bg-white/[0.06] focus:ring-1 focus:ring-teal-500/30 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="relative group">
                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-teal-500 transition-colors" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Mot de passe"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-12 pl-11 pr-11 bg-white/[0.03] border-white/5 text-white placeholder:text-slate-700 rounded-xl focus:bg-white/[0.06] focus:ring-1 focus:ring-teal-500/30 transition-all text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 hover:text-slate-400 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl transition-all shadow-lg shadow-teal-500/10 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group text-sm"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        Continuer
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </form>

                        <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest pt-4">
                            © {new Date().getFullYear()} SecureVisit • VMS
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
