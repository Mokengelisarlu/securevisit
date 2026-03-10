import { useState, useEffect } from 'react';
import { Menu, X, Shield } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Produit', href: '#features' },
    { label: 'Solutions', href: '#usecases' },
    { label: 'Ressources', href: '#contact' },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${isScrolled
          ? 'bg-white/90 backdrop-blur-md shadow-sm'
          : 'bg-transparent'
        }`}
    >
      <div className="w-full px-6 lg:px-12">
        <nav className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a
            href="#"
            className="flex items-center gap-2 text-[#0E1116] hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Shield className="w-7 h-7 text-[#1E6EE6]" />
            <span className="font-semibold text-lg tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
              SecureVisit
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollToSection(link.href)}
                className="text-sm font-medium text-[#6B7280] hover:text-[#0E1116] transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:block">
            <Button
              asChild
              className="bg-[#1E6EE6] hover:bg-[#1a5fcc] text-white px-5 py-2 rounded-full text-sm font-medium btn-hover"
            >
              <Link href="/sign-up">Créer un compte</Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <button className="p-2 text-[#0E1116]">
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-80 bg-white">
              <div className="flex flex-col h-full pt-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <Shield className="w-7 h-7 text-[#1E6EE6]" />
                    <span className="font-semibold text-lg" style={{ fontFamily: 'Sora, sans-serif' }}>
                      SecureVisit
                    </span>
                  </div>
                  <SheetClose asChild>
                    <button className="p-2 text-[#0E1116]">
                      <X className="w-6 h-6" />
                    </button>
                  </SheetClose>
                </div>

                <div className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <SheetClose key={link.label} asChild>
                      <button
                        onClick={() => scrollToSection(link.href)}
                        className="text-left text-lg font-medium text-[#0E1116] hover:text-[#1E6EE6] transition-colors py-2"
                      >
                        {link.label}
                      </button>
                    </SheetClose>
                  ))}
                </div>

                <div className="mt-auto pb-8">
                  <SheetClose asChild>
                    <Button
                      asChild
                      className="w-full bg-[#1E6EE6] hover:bg-[#1a5fcc] text-white py-3 rounded-full text-base font-medium"
                    >
                      <Link href="/sign-up">Créer un compte</Link>
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </header>
  );
};

export default Navigation;
