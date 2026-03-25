import { Shield, Linkedin, Twitter, Youtube, Github } from 'lucide-react';

const Footer = () => {
  const footerLinks = {
    Produit: ['Fonctionnalités', 'Sécurité', 'Intégrations', 'Changelog'],
    Solutions: ['Entreprises', 'Santé', 'Éducation', 'Gouvernement'],
    Ressources: ['Documentation', 'API', 'Blog', 'Études de cas'],
    Entreprise: ['À propos', 'Carrières', 'Presse', 'Contact'],
  };

  const socialLinks = [
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Youtube, href: '#', label: 'YouTube' },
    { icon: Github, href: '#', label: 'GitHub' },
  ];

  return (
    <footer className="bg-[#0E1116] text-white">
      <div className="w-full px-6 lg:px-12 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto">
          {/* Top Section */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12 mb-16">
            {/* Logo & Description */}
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-8 h-8 text-[#1E6EE6]" />
                <span
                  className="font-semibold text-xl tracking-tight"
                  style={{ fontFamily: 'Sora, sans-serif' }}
                >
                  SecureVisit
                </span>
              </div>
              <p className="text-sm text-[#6B7280] leading-relaxed mb-6 max-w-xs">
                Une réception plus calme et plus sécurisée. Enregistrement en quelques secondes. Alertes instantanées. Journaux conformes.
              </p>
              
              {/* Contact Info */}
              <div className="mb-6">
                <p className="text-sm text-[#6B7280]">+243 846 050 997</p>
                <p className="text-sm text-[#6B7280]">Lubumbashi, RD Congo</p>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-3">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    aria-label={social.label}
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <social.icon className="w-4 h-4 text-[#6B7280]" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4
                  className="text-sm font-semibold mb-4"
                  style={{ fontFamily: 'Sora, sans-serif' }}
                >
                  {category}
                </h4>
                <ul className="space-y-3">
                  {links.map((link, index) => (
                    <li key={index}>
                      <a
                        href="#"
                        className="text-sm text-[#6B7280] hover:text-white transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-white/10 mb-8" />

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
              <p className="text-sm text-[#6B7280]">
                © {new Date().getFullYear()} SecureVisit. Tous droits réservés.
              </p>
              <span className="hidden md:inline text-[#6B7280]">•</span>
              <p className="text-sm text-[#6B7280]">
                Propulsé par Mokengeli Sarlu
              </p>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="#"
                className="text-sm text-[#6B7280] hover:text-white transition-colors"
              >
                Politique de confidentialité
              </a>
              <a
                href="#"
                className="text-sm text-[#6B7280] hover:text-white transition-colors"
              >
                Conditions d'utilisation
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
