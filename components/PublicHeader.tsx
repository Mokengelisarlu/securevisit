"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export function PublicHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [bgColor, setBgColor] = useState("transparent");

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 50);

      // Determine background color based on scroll position
      if (scrollY > 50) {
        setBgColor("rgba(15, 23, 42, 0.95)"); // Dark slate
      } else {
        setBgColor("transparent");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#features", label: "Fonctionnalités" },
    { href: "#how-it-works", label: "Comment ça marche" },
    { href: "#pricing", label: "Tarifs" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "shadow-lg" : ""
        }`}
        style={{ backgroundColor: bgColor }}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:shadow-lg transition-shadow">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <span className="text-white">SecureVisit</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isScrolled
                    ? "text-slate-300 hover:text-white"
                    : "text-slate-200 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <Button
              variant="ghost"
              asChild
              className={`text-sm transition-colors ${
                isScrolled
                  ? "text-slate-300 hover:text-white hover:bg-slate-700"
                  : "text-slate-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <Link href="/sign-in">Se connecter</Link>
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/setup-tenant">Créer un compte</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              isScrolled
                ? "text-slate-300 hover:bg-slate-700"
                : "text-slate-200 hover:bg-white/10"
            }`}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 border-t border-slate-700">
            <nav className="container mx-auto px-6 py-4 space-y-4 flex flex-col">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-slate-300 hover:text-white transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-slate-700 space-y-3 flex flex-col">
                <Button
                  variant="ghost"
                  asChild
                  className="w-full text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <Link href="/sign-in">Se connecter</Link>
                </Button>
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Link href="/setup-tenant">Créer un compte</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
